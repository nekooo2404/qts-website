package vn.qts.identityadmin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.identity-bootstrap")
public record IdentityBootstrapProperties(
        boolean enabled,
        String tenantSlug,
        String tenantName,
        String primaryDomain,
        boolean requireMfa,
        String portalClientId,
        String portalRedirectUri,
        String portalPostLogoutRedirectUri,
        String hrmClientId,
        String hrmRedirectUri,
        String hrmPostLogoutRedirectUri,
        String superadminEmail,
        String superadminName,
        String superadminTitle,
        String superadminEmployeeCode,
        String superadminPassword,
        String superadminPasswordFile,
        boolean allowWorkspaceSecretFile
) {
    public String tenantSlugOrDefault() {
        return text(tenantSlug, "qts-global").toLowerCase();
    }

    public String tenantNameOrDefault() {
        return text(tenantName, "QTS Global");
    }

    public String primaryDomainOrDefault() {
        return text(primaryDomain, "qts.com").toLowerCase();
    }

    public String portalClientIdOrDefault() {
        return text(portalClientId, "qts-portal");
    }

    public String hrmClientIdOrDefault() {
        return text(hrmClientId, "qts-hrm");
    }

    public String superadminEmailOrDefault() {
        return text(superadminEmail, "superadmin@qts.com").toLowerCase();
    }

    public String superadminNameOrDefault() {
        return text(superadminName, "Super Admin");
    }

    public String superadminTitleOrDefault() {
        return text(superadminTitle, "Quản trị viên cấp cao");
    }

    public String superadminEmployeeCodeOrDefault() {
        return text(superadminEmployeeCode, "QTS-00001");
    }

    private static String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
