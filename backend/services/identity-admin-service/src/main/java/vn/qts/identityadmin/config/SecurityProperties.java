package vn.qts.identityadmin.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.security")
public record SecurityProperties(
        boolean enabled,
        String issuer,
        String jwkSetUri,
        String audience,
        Cors cors
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

    public List<String> corsAllowedOrigins() {
        if (cors == null || cors.allowedOrigins() == null) {
            return List.of();
        }
        return cors.allowedOrigins().stream()
                .filter(origin -> origin != null && !origin.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
