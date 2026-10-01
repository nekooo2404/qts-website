package vn.qts.events.application;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.qts.events.config.EventProperties;
import vn.qts.events.domain.OutboxEvent;
import vn.qts.events.infra.OutboxRepository;

@Service
public class OutboxPublisher {
    private final OutboxRepository outbox;
    private final EventStream stream;
    private final CloudEventMapper mapper;
    private final EventProperties properties;
    private final Clock clock;

    public OutboxPublisher(
            OutboxRepository outbox,
            EventStream stream,
            CloudEventMapper mapper,
            EventProperties properties,
            Clock clock
    ) {
        this.outbox = outbox;
        this.stream = stream;
        this.mapper = mapper;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public int publishDue() {
        Instant now = Instant.now(clock);
        int published = 0;
        for (OutboxEvent row : outbox.findDueHeadsForUpdate(now, properties.getBatchSize())) {
            if (stream.length(properties.getStreamName()) >= properties.getStreamMaxLength()) {
                break;
            }
            try {
                stream.add(properties.getStreamName(), mapper.toEnvelope(row));
                outbox.markPublished(row.id(), Instant.now(clock));
                published++;
            } catch (RuntimeException error) {
                int nextAttempt = row.attemptCount() + 1;
                outbox.scheduleRetry(row.id(), nextAttempt, now.plus(backoff(nextAttempt)));
            }
        }
        return published;
    }

    private Duration backoff(int attemptCount) {
        long baseSeconds = Math.max(1, properties.getRetryBaseDelay().toSeconds());
        long delay = Math.min(300, baseSeconds * (1L << Math.min(20, Math.max(0, attemptCount - 1))));
        return Duration.ofSeconds(delay);
    }
}
