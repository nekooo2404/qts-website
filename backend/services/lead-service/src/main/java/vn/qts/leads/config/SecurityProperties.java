package vn.qts.leads.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.security")
public record SecurityProperties(
    boolean enabled,
    String issuer,
    String jwkSetUri,
    String audience
) {
    public String issuerOrEmpty() {
        return issuer == null ? "" : issuer.trim();
    }

    public String audienceOrDefault() {
        return audience == null || audience.isBlank() ? "qts-api" : audience.trim();
    }

    public String jwkSetUriOrEmpty() {
        return jwkSetUri == null ? "" : jwkSetUri.trim();
    }
}
