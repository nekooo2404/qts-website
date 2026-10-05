package vn.qts.hrm.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.security")
public record SecurityProperties(
        boolean enabled,
        String issuer,
        String jwkSetUri,
        String audience,
        List<String> corsAllowedOrigins
) {
    public String issuerOrEmpty() {
        return issuer == null ? "" : issuer.trim();
    }

    public String jwkSetUriOrEmpty() {
        return jwkSetUri == null ? "" : jwkSetUri.trim();
    }

    public String audienceOrDefault() {
        return audience == null || audience.isBlank() ? "qts-api" : audience.trim();
    }

    public List<String> corsAllowedOrigins() {
        if (corsAllowedOrigins == null) {
            return List.of();
        }
        return corsAllowedOrigins.stream()
                .filter(origin -> origin != null && !origin.isBlank())
                .map(String::trim)
                .toList();
    }
}
