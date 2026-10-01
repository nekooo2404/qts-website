package vn.qts.events.domain;

import java.time.Instant;
import java.util.UUID;

public record InboxState(
        UUID eventId,
        String consumerName,
        String idempotencyKey,
        String status,
        int attemptCount,
        Instant firstFailedAt
) {
    public boolean isTerminal() {
        return "processed".equals(status) || "discarded".equals(status);
    }
}
