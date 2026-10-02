package vn.qts.identityadmin.config;

import java.net.URI;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.security")
public record SecurityProperties(
        boolean enabled,
        String issuer,
        String jwkSetUri,
        String audience,
        Cors cors,
        String trustedProxyCidrs
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

    public String trustedProxyCidrsOrDefault() {
        return trustedProxyCidrs == null || trustedProxyCidrs.isBlank() ? "127.0.0.1/32,::1/128" : trustedProxyCidrs.trim();
    }

    public List<String> corsAllowedOrigins() {
        if (cors == null || cors.allowedOrigins() == null) {
            return List.of();
        }
        return cors.allowedOrigins().stream()
                .filter(origin -> origin != null && !origin.isBlank())
                .map(String::trim)
                .filter(SecurityProperties::isSafeCorsOrigin)
                .distinct()
                .toList();
    }

    private static boolean isSafeCorsOrigin(String origin) {
        try {
            URI uri = URI.create(origin);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            boolean secureScheme = "https".equalsIgnoreCase(scheme)
                    || ("http".equalsIgnoreCase(scheme) && isLoopbackHost(host));
            return secureScheme
                    && host != null
                    && uri.getUserInfo() == null
                    && uri.getPath().isBlank()
                    && uri.getQuery() == null
                    && uri.getFragment() == null;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    private static boolean isLoopbackHost(String host) {
        return "localhost".equalsIgnoreCase(host)
                || "127.0.0.1".equals(host)
                || "::1".equals(host)
                || "[::1]".equals(host);
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
