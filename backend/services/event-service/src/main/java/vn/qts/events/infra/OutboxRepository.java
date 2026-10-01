package vn.qts.events.infra;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import vn.qts.events.domain.OutboxEvent;

public interface OutboxRepository {
    List<OutboxEvent> findDueHeadsForUpdate(Instant now, int limit);

    void markPublished(UUID eventId, Instant publishedAt);

    void scheduleRetry(UUID eventId, int attemptCount, Instant availableAt);
}
