import os
import uuid

from django.conf import settings
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
    "portal.view_dashboard": "Xem tổng quan cổng thông tin",
    "portal.view_projects": "Xem dự án",
    "crm.view_customer": "Xem khách hàng CRM",
    "crm.edit_customer": "Chỉnh sửa khách hàng CRM",
    "crm.delete_customer": "Xóa khách hàng CRM",
    "hr.view_people": "Xem danh bạ nhân sự",
    "finance.view_invoice": "Xem hóa đơn",
    "finance.approve_payment": "Phê duyệt thanh toán",
    "developer.view_logs": "Xem nhật ký dành cho nhà phát triển",
    "developer.deploy_application": "Triển khai ứng dụng",
    "analytics.view_reports": "Xem báo cáo phân tích",
    "identity.view_console": "Xem bảng điều khiển định danh",
    "identity.manage_users": "Quản lý người dùng và tư cách thành viên",
    "identity.manage_applications": "Quản lý ứng dụng",
    "identity.manage_permissions": "Quản lý quyền",
    "identity.view_audit": "Xem sự kiện kiểm tra",
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
    # qts-portal uses the configured production values when the command runs.
    ("qts-portal", "Cổng thông tin QTS", "Không gian vận hành doanh nghiệp", ["portal.view_dashboard"], None),
    ("qts-crm", "QTS CRM", "Quan hệ khách hàng và quy trình kinh doanh", ["crm.view_customer"], ["http://localhost:5174/crm/callback"]),
    ("qts-erp", "QTS ERP", "Vận hành, tài chính và lập kế hoạch", ["finance.view_invoice"], ["http://localhost:5174/erp/callback"]),
    ("qts-hr", "QTS HR", "Nhân sự và tổ chức", ["hr.view_people"], ["http://localhost:5174/hr/callback"]),
    ("qts-analytics", "QTS Analytics", "Phân tích hỗ trợ quyết định doanh nghiệp", ["analytics.view_reports"], ["http://localhost:5174/analytics/callback"]),
    ("qts-ai", "Trợ lý AI QTS", "Trí tuệ doanh nghiệp có kiểm soát", ["analytics.view_reports"], ["http://localhost:5174/ai/callback"]),
]


class Command(BaseCommand):
    help = "Khởi tạo dữ liệu định danh QTS cho tenant, người dùng, vai trò và ứng dụng đã đăng ký."

    @transaction.atomic
    def handle(self, *args, **options):
        tenant, _ = Tenant.objects.get_or_create(slug="qts-global", defaults={"name": "CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ QTS", "require_mfa": False})
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

        # Demo accounts must stay aligned with infra/keycloak/realm-qts.json.
        users = [
            ("alex@qts.com", "Alex Harper", "Phụ trách vận hành", "super-admin"),
            ("maya@qts.com", "Maya Chen", "Kỹ sư chính", "developer"),
            ("jonas@qts.com", "Jonas Lee", "Giám đốc triển khai", "manager"),
            ("nora@qts.com", "Nora Lewis", "Thiết kế sản phẩm", "employee"),
        ]
        demo_password = os.getenv("DEMO_PASSWORD")
        if not demo_password:
            raise CommandError("Cần đặt DEMO_PASSWORD để khởi tạo người dùng demo.")
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
            if slug == "qts-portal":
                redirect_uris = [
                    settings.PORTAL_OIDC_REDIRECT_URI,
                    settings.PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI,
                ]
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

        self.stdout.write(self.style.SUCCESS("Đã khởi tạo QTS Identity."))
        self.stdout.write(f"OIDC client ID của Cổng thông tin QTS: {portal_client_id}")
