from django.contrib import admin

from .models import (
    Application,
    ApplicationAssignment,
    AuditEvent,
    ExternalIdentityConnection,
    IdentitySession,
    Membership,
    OrganizationDomain,
    Permission,
    Role,
    SigningKey,
    Tenant,
)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("slug", "name", "status", "require_mfa")


@admin.register(OrganizationDomain)
class OrganizationDomainAdmin(admin.ModelAdmin):
    list_display = ("domain", "tenant", "verified_at")


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "name")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("tenant", "user", "status", "policy_version")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "tenant", "is_system")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("name", "client_id", "tenant", "is_public", "is_active")


@admin.register(ApplicationAssignment)
class ApplicationAssignmentAdmin(admin.ModelAdmin):
    list_display = ("membership", "application", "is_enabled")


@admin.register(IdentitySession)
class IdentitySessionAdmin(admin.ModelAdmin):
    list_display = ("user", "tenant", "is_active", "created_at")
    readonly_fields = ("id",)

    def created_at(self, obj):
        return obj.auth_time


@admin.register(SigningKey)
class SigningKeyAdmin(admin.ModelAdmin):
    list_display = ("kid", "is_active", "created_at")


@admin.register(ExternalIdentityConnection)
class ExternalIdentityConnectionAdmin(admin.ModelAdmin):
    list_display = ("tenant", "provider", "name", "is_active")


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("action", "tenant", "actor", "outcome", "created_at")
    readonly_fields = ("event_hash", "previous_hash")
