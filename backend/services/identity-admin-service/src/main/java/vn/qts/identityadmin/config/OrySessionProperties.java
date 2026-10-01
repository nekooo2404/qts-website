package vn.qts.identityadmin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.ory")
public record OrySessionProperties(
        String kratosInternalPublicUrl,
        String kratosAdminUrl,
        String kratosSessionCookie
) {
    public String kratosInternalPublicUrlOrDefault() {
        return defaultValue(kratosInternalPublicUrl, "http://kratos:4433");
    }

    public String kratosSessionCookieOrDefault() {
        return defaultValue(kratosSessionCookie, "ory_kratos_session");
    }

    public String kratosAdminUrlOrDefault() {
        return defaultValue(kratosAdminUrl, "http://kratos:4434");
    }

    private static String defaultValue(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
