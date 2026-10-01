package vn.qts.identityadmin.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.StreamSupport;

import com.fasterxml.jackson.databind.JsonNode;

public record KratosBrowserSession(
        UUID id,
        UUID identityId,
        Instant expiresAt,
        Instant authenticatedAt,
        List<String> authenticationMethods
) {
    public static KratosBrowserSession from(JsonNode node) {
        if (node == null || !node.isObject() || !node.path("active").asBoolean(false)) {
            return null;
        }
        UUID sessionId = uuid(node.path("id").asText(null));
        UUID identityId = uuid(node.path("identity").path("id").asText(null));
        Instant expiresAt = instant(node.path("expires_at").asText(null));
        Instant authenticatedAt = instant(node.path("authenticated_at").asText(null));
        if (sessionId == null || identityId == null || expiresAt == null || authenticatedAt == null
                || !expiresAt.isAfter(Instant.now())) {
            return null;
        }
        List<String> methods = node.path("authentication_methods").isArray()
                ? StreamSupport.stream(node.path("authentication_methods").spliterator(), false)
                .map(method -> method.path("method").asText(""))
                .filter(method -> !method.isBlank())
                .distinct()
                .toList()
                : List.of();
        return new KratosBrowserSession(sessionId, identityId, expiresAt, authenticatedAt, methods);
    }

    private static UUID uuid(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private static Instant instant(String value) {
        try {
            return value == null ? null : Instant.parse(value);
        } catch (RuntimeException error) {
            return null;
        }
    }
}
