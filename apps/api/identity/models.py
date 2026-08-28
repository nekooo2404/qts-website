import hashlib
import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusers must have is_staff=True and is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    keycloak_id = models.UUIDField(null=True, blank=True, unique=True)
    display_name = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["display_name"]

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email


class Tenant(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=160)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    require_mfa = models.BooleanField(default=False)
    session_max_days = models.PositiveSmallIntegerField(default=7)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class OrganizationDomain(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="domains")
    domain = models.CharField(max_length=253, unique=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["tenant", "domain"])]

    def save(self, *args, **kwargs):
        self.domain = self.domain.strip().lower()
        super().save(*args, **kwargs)


class Permission(models.Model):
    code = models.CharField(
        max_length=100,
        unique=True,
        validators=[RegexValidator(r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$")],
    )
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class Membership(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INVITED = "invited", "Invited"
        DISABLED = "disabled", "Disabled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    department = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    policy_version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["tenant", "user"], name="identity_membership_per_tenant")]
        indexes = [models.Index(fields=["tenant", "status"]), models.Index(fields=["user", "status"])]

    def __str__(self):
        return f"{self.user.email} at {self.tenant.slug}"

    def bump_policy_version(self):
        self.policy_version = models.F("policy_version") + 1
        self.save(update_fields=["policy_version", "updated_at"])
        self.refresh_from_db(fields=["policy_version"])


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="roles", null=True, blank=True)
    code = models.SlugField(max_length=60)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=300, blank=True)
    is_system = models.BooleanField(default=False)
    permissions = models.ManyToManyField(Permission, through="RolePermission", related_name="roles")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["tenant", "code"], name="identity_role_code_per_tenant")]
        ordering = ["name"]


class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["role", "permission"], name="identity_role_permission_once")]


class MembershipRole(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name="role_assignments")
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_identity_roles")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["membership", "role"], name="identity_membership_role_once")]


class DirectGrant(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name="direct_grants")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    allowed = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_identity_grants")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["membership", "permission"], name="identity_direct_grant_once")]


class ApplicationQuerySet(models.QuerySet):
    def visible_to_tenant(self, tenant):
        return self.filter(models.Q(tenant=tenant) | models.Q(tenant__isnull=True))


class Application(models.Model):
    class Type(models.TextChoices):
        INTERNAL = "internal", "Internal"
        CUSTOMER = "customer", "Customer"
        PARTNER = "partner", "Partner"
        THIRD_PARTY = "third_party", "Third party"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="applications", null=True, blank=True)
    client_id = models.CharField(max_length=80, unique=True, default="", editable=False)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=80)
    description = models.CharField(max_length=300, blank=True)
    application_type = models.CharField(max_length=20, choices=Type.choices, default=Type.INTERNAL)
    redirect_uris = models.JSONField(default=list)
    allowed_scopes = models.JSONField(default=list)
    required_permissions = models.JSONField(default=list)
    icon = models.CharField(max_length=48, default="squares-2x2")
    client_secret_hash = models.CharField(max_length=128, blank=True)
    is_public = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ApplicationQuerySet.as_manager()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["tenant", "slug"], name="identity_application_slug_per_tenant")]
        indexes = [models.Index(fields=["tenant", "is_active"])]

    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = f"qts_{secrets.token_urlsafe(24)}"
        super().save(*args, **kwargs)

    def issue_secret(self):
        secret = secrets.token_urlsafe(48)
        self.client_secret_hash = hashlib.sha256(secret.encode()).hexdigest()
        self.save(update_fields=["client_secret_hash", "updated_at"])
        return secret

    def check_secret(self, secret):
        return bool(secret) and secrets.compare_digest(
            self.client_secret_hash,
            hashlib.sha256(secret.encode()).hexdigest(),
        )


class ApplicationAssignment(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name="application_assignments")
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="assignments")
    is_enabled = models.BooleanField(default=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["membership", "application"], name="identity_application_assignment_once")]


class IdentitySession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="identity_sessions")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="identity_sessions")
    user_agent = models.CharField(max_length=600, blank=True)
    ip_hash = models.CharField(max_length=64, blank=True)
    location = models.CharField(max_length=160, blank=True)
    authentication_methods = models.JSONField(default=list)
    auth_time = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_reason = models.CharField(max_length=100, blank=True)

    class Meta:
        indexes = [models.Index(fields=["user", "tenant", "revoked_at"]), models.Index(fields=["expires_at"])]

    @property
    def is_active(self):
        return self.revoked_at is None and self.expires_at > timezone.now()

    @classmethod
    def create_for(cls, user, tenant, request, methods):
        maximum = min(max(1, tenant.session_max_days), 30)
        return cls.objects.create(
            user=user,
            tenant=tenant,
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:600],
            ip_hash=hashlib.sha256(request.META.get("REMOTE_ADDR", "").encode()).hexdigest(),
            authentication_methods=methods,
            expires_at=timezone.now() + timedelta(days=maximum),
        )

    def revoke(self, reason="manual_logout"):
        if not self.revoked_at:
            self.revoked_at = timezone.now()
            self.revoked_reason = reason
            self.save(update_fields=["revoked_at", "revoked_reason"])


class AuthorizationCode(models.Model):
    code_hash = models.CharField(max_length=64, primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    session = models.ForeignKey(IdentitySession, on_delete=models.CASCADE)
    redirect_uri = models.URLField(max_length=1000)
    scopes = models.JSONField(default=list)
    nonce = models.CharField(max_length=255, blank=True)
    code_challenge = models.CharField(max_length=128)
    code_challenge_method = models.CharField(max_length=10, default="S256")
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["expires_at", "consumed_at"])]

    @classmethod
    def issue(cls, raw_code, **kwargs):
        return cls.objects.create(
            code_hash=hashlib.sha256(raw_code.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(seconds=settings.IDENTITY_CODE_LIFETIME_SECONDS),
            **kwargs,
        )


class RefreshTokenFamily(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(IdentitySession, on_delete=models.CASCADE, related_name="refresh_families")
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    reuse_detected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def revoke(self, reuse=False):
        self.revoked_at = timezone.now()
        if reuse:
            self.reuse_detected_at = self.revoked_at
        self.save(update_fields=["revoked_at", "reuse_detected_at"])


class RefreshToken(models.Model):
    token_hash = models.CharField(max_length=64, primary_key=True)
    family = models.ForeignKey(RefreshTokenFamily, on_delete=models.CASCADE, related_name="tokens")
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def issue(cls, raw_token, family):
        return cls.objects.create(
            token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
            family=family,
            expires_at=family.expires_at,
        )


class SigningKey(models.Model):
    kid = models.CharField(max_length=64, unique=True)
    private_key_pem = models.TextField()
    public_jwk = models.JSONField()
    is_active = models.BooleanField(default=True)
    retire_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class MFAAuthenticator(models.Model):
    class Type(models.TextChoices):
        TOTP = "totp", "Authenticator app"
        EMAIL = "email", "Email OTP"
        SMS = "sms", "SMS OTP"
        PASSKEY = "passkey", "Passkey"
        SECURITY_KEY = "security_key", "Security key"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mfa_authenticators")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=Type.choices)
    label = models.CharField(max_length=100)
    encrypted_secret = models.TextField(blank=True)
    credential_data = models.JSONField(default=dict)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "tenant", "confirmed_at"])]


class ExternalIdentityConnection(models.Model):
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google Workspace"
        ENTRA = "entra", "Microsoft Entra ID"
        OKTA = "okta", "Okta"
        SAML = "saml", "SAML 2.0"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="identity_connections")
    provider = models.CharField(max_length=20, choices=Provider.choices)
    name = models.CharField(max_length=120)
    issuer = models.URLField(max_length=1000)
    configuration_encrypted = models.TextField()
    jit_provisioning = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ExternalIdentity(models.Model):
    connection = models.ForeignKey(ExternalIdentityConnection, on_delete=models.CASCADE, related_name="identities")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="external_identities")
    subject = models.CharField(max_length=512)
    claims = models.JSONField(default=dict)
    linked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["connection", "subject"], name="identity_external_subject_once")]


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name="audit_events", null=True, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_events")
    action = models.CharField(max_length=120)
    target_type = models.CharField(max_length=80, blank=True)
    target_id = models.CharField(max_length=128, blank=True)
    outcome = models.CharField(max_length=20, default="success")
    ip_hash = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=600, blank=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, editable=False)
    metadata = models.JSONField(default=dict)
    previous_hash = models.CharField(max_length=64, blank=True)
    event_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["tenant", "created_at"]), models.Index(fields=["action", "created_at"])]
        ordering = ["-created_at"]


class WebhookDelivery(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="webhook_deliveries")
    event = models.CharField(max_length=100)
    endpoint = models.URLField(max_length=1000)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
