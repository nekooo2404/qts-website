package vn.qts.identitybridge.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

public record KratosSession(
        UUID id,
        UUID identityId,
        JsonNode identity,
        Instant expiresAt,
        Instant authenticatedAt,
        String assuranceLevel,
        List<String> authenticationMethods,
        boolean active
) {
    public static KratosSession from(JsonNode node) {
        if (node == null || !node.isObject() || !node.path("active").asBoolean(false)) {
            return null;
        }
        UUID sessionId = uuid(node.path("id").asText(null));
        JsonNode identityNode = node.path("identity");
        UUID identityId = uuid(identityNode.path("id").asText(null));
        Instant expiresAt = instant(node.path("expires_at").asText(null));
        Instant authenticatedAt = instant(node.path("authenticated_at").asText(null));
        String aal = node.path("authenticator_assurance_level").asText("");
        if (sessionId == null || identityId == null || expiresAt == null || authenticatedAt == null
                || expiresAt.isBefore(Instant.now()) || aal.isBlank()) {
            return null;
        }
        List<String> methods = node.path("authentication_methods").isArray()
                ? java.util.stream.StreamSupport.stream(node.path("authentication_methods").spliterator(), false)
                .map(method -> method.path("method").asText(""))
                .filter(method -> !method.isBlank())
                .distinct()
                .toList()
                : List.of();
        return new KratosSession(sessionId, identityId, identityNode, expiresAt, authenticatedAt, aal, methods, true);
    }

    public String email() {
        return identity.path("traits").path("email").asText("").trim().toLowerCase();
    }

    public boolean meetsMfa() {
        return "aal2".equalsIgnoreCase(assuranceLevel);
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
