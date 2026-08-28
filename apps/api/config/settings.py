from pathlib import Path
import os
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-development-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "core",
    "leads",
    "accounts",
    "identity",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

IS_TEST = "test" in os.sys.argv or os.getenv("DJANGO_TEST") == "true"

def require_postgres_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        if IS_TEST:
            return f"test-{name.lower()}"
        raise ImproperlyConfigured(f"PostgreSQL is required. Missing environment variable: {name}")
    return value

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": require_postgres_env("POSTGRES_DB"),
        "USER": require_postgres_env("POSTGRES_USER"),
        "PASSWORD": require_postgres_env("POSTGRES_PASSWORD"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = []
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "identity.User"

IDENTITY_ISSUER = os.getenv("IDENTITY_ISSUER", "http://localhost:8000")
IDENTITY_WEB_ORIGIN = os.getenv("IDENTITY_WEB_ORIGIN", "http://localhost:3001")
IDENTITY_SIGNING_KEY_PASSPHRASE = os.getenv("IDENTITY_SIGNING_KEY_PASSPHRASE", "")
IDENTITY_TOKEN_LIFETIME_SECONDS = int(os.getenv("IDENTITY_TOKEN_LIFETIME_SECONDS", "900"))
IDENTITY_CODE_LIFETIME_SECONDS = int(os.getenv("IDENTITY_CODE_LIFETIME_SECONDS", "120"))
IDENTITY_REFRESH_LIFETIME_DAYS = int(os.getenv("IDENTITY_REFRESH_LIFETIME_DAYS", "7"))
IDENTITY_SESSION_COOKIE = os.getenv("IDENTITY_SESSION_COOKIE", "qts_identity_session")
IDENTITY_PROVIDER = os.getenv("IDENTITY_PROVIDER", "local")
KEYCLOAK_ISSUER = os.getenv("KEYCLOAK_ISSUER", "http://localhost:8080/realms/qts")
KEYCLOAK_INTERNAL_ISSUER = os.getenv("KEYCLOAK_INTERNAL_ISSUER", KEYCLOAK_ISSUER)
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE", "account")
KEYCLOAK_JWKS_CACHE_SECONDS = int(os.getenv("KEYCLOAK_JWKS_CACHE_SECONDS", "900"))

if IDENTITY_PROVIDER not in {"local", "keycloak"}:
    raise ImproperlyConfigured("IDENTITY_PROVIDER must be either local or keycloak.")

if not DEBUG and (SECRET_KEY == "unsafe-development-key-change-me" or not IDENTITY_SIGNING_KEY_PASSPHRASE):
    raise ImproperlyConfigured("Production identity requires a unique Django secret and IDENTITY_SIGNING_KEY_PASSPHRASE.")

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31_536_000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")
if IS_TEST:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
else:
    CACHES = {"default": {"BACKEND": "django_redis.cache.RedisCache", "LOCATION": REDIS_URL, "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"}}}

CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:5174").split(",")
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
SPECTACULAR_SETTINGS = {"TITLE": "QTS Enterprise API", "VERSION": "v1"}
