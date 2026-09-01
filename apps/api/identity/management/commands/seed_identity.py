import os
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from identity.keycloak import keycloak_enabled
from identity.models import (
    Application,
    ApplicationAssignment,
    Membership,
    MembershipRole,
    OrganizationDomain,
    Permission,
    Role,
    RolePermission,
    Tenant,
    User,
)


PERMISSIONS = {
    "portal.view_dashboard": "View portal dashboard",
    "portal.view_projects": "View projects",
    "crm.view_customer": "View CRM customers",
    "crm.edit_customer": "Edit CRM customers",
    "crm.delete_customer": "Delete CRM customers",
    "hr.view_people": "View people directory",
    "finance.view_invoice": "View invoices",
    "finance.approve_payment": "Approve payments",
    "developer.view_logs": "View developer logs",
    "developer.deploy_application": "Deploy applications",
    "analytics.view_reports": "View analytics reports",
    "identity.view_console": "View Identity Console",
    "identity.manage_users": "Manage users and memberships",
    "identity.manage_applications": "Manage applications",
    "identity.manage_permissions": "Manage permissions",
    "identity.view_audit": "View audit events",
}

ROLE_PERMISSIONS = {
    "super-admin": list(PERMISSIONS),
    "organization-admin": [
        "portal.view_dashboard", "portal.view_projects", "crm.view_customer", "crm.edit_customer",
        "hr.view_people", "finance.view_invoice", "analytics.view_reports", "identity.view_console",
        "identity.manage_users", "identity.manage_applications", "identity.manage_permissions", "identity.view_audit",
    ],
    "manager": ["portal.view_dashboard", "portal.view_projects", "crm.view_customer", "crm.edit_customer", "hr.view_people", "analytics.view_reports"],
    "employee": ["portal.view_dashboard", "portal.view_projects", "crm.view_customer", "analytics.view_reports"],
    "developer": ["portal.view_dashboard", "portal.view_projects", "developer.view_logs", "developer.deploy_application", "analytics.view_reports"],
    "customer": ["portal.view_dashboard", "crm.view_customer"],
}

APPLICATIONS = [
    ("qts-portal", "QTS Portal", "Enterprise operating workspace", ["portal.view_dashboard"], ["http://localhost:5174/auth/callback", "http://localhost:5174/"]),
    ("qts-crm", "QTS CRM", "Customer relationships and pipeline", ["crm.view_customer"], ["http://localhost:5174/crm/callback"]),
    ("qts-erp", "QTS ERP", "Operations, finance and planning", ["finance.view_invoice"], ["http://localhost:5174/erp/callback"]),
    ("qts-hr", "QTS HR", "People and organizational health", ["hr.view_people"], ["http://localhost:5174/hr/callback"]),
    ("qts-analytics", "QTS Analytics", "Enterprise decision intelligence", ["analytics.view_reports"], ["http://localhost:5174/analytics/callback"]),
    ("qts-ai", "QTS AI Assistant", "Governed enterprise intelligence", ["analytics.view_reports"], ["http://localhost:5174/ai/callback"]),
]


class Command(BaseCommand):
    help = "Seed a local QTS Identity tenant, users, roles and registered applications."

    @transaction.atomic
    def handle(self, *args, **options):
        tenant, _ = Tenant.objects.get_or_create(slug="qts-global", defaults={"name": "QTS Global", "require_mfa": False})
        domain, _ = OrganizationDomain.objects.get_or_create(tenant=tenant, domain="qts.com")
        if not domain.verified_at:
            domain.verified_at = timezone.now()
            domain.save(update_fields=["verified_at"])

        permission_objects = {}
        for code, name in PERMISSIONS.items():
            permission_objects[code], _ = Permission.objects.get_or_create(code=code, defaults={"name": name})

        roles = {}
        for code, granted in ROLE_PERMISSIONS.items():
            role, _ = Role.objects.get_or_create(tenant=tenant, code=code, defaults={"name": code.replace("-", " ").title(), "is_system": True})
            roles[code] = role
            for permission in granted:
                RolePermission.objects.get_or_create(role=role, permission=permission_objects[permission])

        users = [
            ("alex@qts.com", "Alex Harper", "Operations lead", "super-admin"),
            ("maya@qts.com", "Maya Chen", "Principal engineer", "developer"),
            ("jonas@qts.com", "Jonas Lee", "Delivery director", "manager"),
            ("nora@qts.com", "Nora Lewis", "Product designer", "employee"),
        ]
        demo_password = os.getenv("DEMO_PASSWORD")
        if not demo_password:
            raise CommandError("DEMO_PASSWORD is required to seed demo users.")
        memberships = []
        for email, name, title, role_code in users:
            user, created = User.objects.get_or_create(email=email, defaults={"display_name": name})
            if created:
                user.set_password(demo_password)
                user.save(update_fields=["password"])
            if keycloak_enabled():
                expected_id = uuid.uuid5(uuid.NAMESPACE_URL, email)
                if str(user.keycloak_id) != str(expected_id):
                    user.keycloak_id = expected_id
                    user.save(update_fields=["keycloak_id"])
            membership, _ = Membership.objects.get_or_create(tenant=tenant, user=user, defaults={"title": title, "department": "QTS"})
            MembershipRole.objects.get_or_create(membership=membership, role=roles[role_code], defaults={"assigned_by": user})
            memberships.append(membership)

        portal_client_id = ""
        for slug, name, description, required_permissions, redirect_uris in APPLICATIONS:
            defaults = {
                "name": name,
                "description": description,
                "required_permissions": required_permissions,
                "allowed_scopes": ["profile", "email"],
                "redirect_uris": redirect_uris,
                "is_public": True,
            }
            if slug == "qts-portal" and keycloak_enabled():
                defaults["client_id"] = "qts-portal"
            application, _ = Application.objects.get_or_create(tenant=tenant, slug=slug, defaults=defaults)
            changed = False
            for field, value in defaults.items():
                if field == "client_id" and slug != "qts-portal":
                    continue
                if getattr(application, field) != value:
                    setattr(application, field, value)
                    changed = True
            if changed:
                application.save()
            for membership in memberships:
                ApplicationAssignment.objects.get_or_create(membership=membership, application=application)
            if slug == "qts-portal":
                portal_client_id = application.client_id

        self.stdout.write(self.style.SUCCESS("Seeded QTS Identity."))
        self.stdout.write(f"QTS Portal OIDC client ID: {portal_client_id}")
