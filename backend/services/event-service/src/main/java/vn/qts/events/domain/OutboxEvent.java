package vn.qts.events.domain;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

public record OutboxEvent(
        UUID id,
        UUID tenantId,
        String eventType,
        String aggregateType,
        UUID aggregateId,
        JsonNode payload,
        JsonNode headers,
        Instant occurredAt,
        Instant publishedAt,
        int attemptCount,
        Instant availableAt,
        Instant createdAt
) {
}
