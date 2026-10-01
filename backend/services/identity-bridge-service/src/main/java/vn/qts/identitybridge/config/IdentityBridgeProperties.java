package vn.qts.identitybridge.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.identity")
public record IdentityBridgeProperties(
        boolean enabled,
        String webOrigin,
        String hydraIssuerBrowserUrl,
        String hydraInternalPublicUrl,
        String hydraAdminUrl,
        String kratosBrowserUrl,
        String kratosInternalPublicUrl,
        String kratosAdminUrl,
        String apiAudience,
        String kratosSessionCookie,
        String portalClientId,
        String hrmClientId,
        String portalRedirectUri,
        String hrmRedirectUri
) {
    public String webOriginOrEmpty() {
        return text(webOrigin);
    }

    public String hydraIssuerBrowserUrlOrEmpty() {
        return text(hydraIssuerBrowserUrl);
    }

    public String hydraInternalPublicUrlOrDefault() {
        return defaultValue(hydraInternalPublicUrl, "http://hydra:4444");
    }

    public String hydraAdminUrlOrDefault() {
        return defaultValue(hydraAdminUrl, "http://hydra:4445");
    }

    public String kratosBrowserUrlOrEmpty() {
        return text(kratosBrowserUrl);
    }

    public String kratosInternalPublicUrlOrDefault() {
        return defaultValue(kratosInternalPublicUrl, "http://kratos:4433");
    }

    public String kratosAdminUrlOrDefault() {
        return defaultValue(kratosAdminUrl, "http://kratos:4434");
    }

    public String apiAudienceOrDefault() {
        return defaultValue(apiAudience, "qts-api");
    }

    public String kratosSessionCookieOrDefault() {
        return defaultValue(kratosSessionCookie, "ory_kratos_session");
    }

    public boolean registeredClient(String clientId) {
        return text(portalClientId).equals(clientId) || text(hrmClientId).equals(clientId);
    }

    public String registeredRedirectUri(String clientId) {
        if (text(portalClientId).equals(clientId)) {
            return text(portalRedirectUri);
        }
        if (text(hrmClientId).equals(clientId)) {
            return text(hrmRedirectUri);
        }
        return "";
    }

    private static String text(String value) {
        return value == null ? "" : value.trim();
    }

    private static String defaultValue(String value, String fallback) {
        String normalized = text(value);
        return normalized.isBlank() ? fallback : normalized;
    }
}
