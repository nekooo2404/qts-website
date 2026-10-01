package vn.qts.events.infra;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

import vn.qts.events.domain.InboxState;

public interface InboxRepository {
    InboxState begin(String consumerName, UUID eventId, String idempotencyKey);

    Optional<InboxState> find(String consumerName, UUID eventId);

    void markProcessed(String consumerName, UUID eventId, Instant processedAt);

    InboxState markFailed(String consumerName, UUID eventId, Instant failedAt);

    void moveToDeadLetter(
            InboxState inbox,
            String stream,
            String eventType,
            JsonNode payload,
            String errorClass,
            String errorText,
            Instant movedAt
    );
}
