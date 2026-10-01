package vn.qts.events.application;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.qts.events.config.EventProperties;
import vn.qts.events.domain.DeterministicEventException;
import vn.qts.events.domain.InboxState;
import vn.qts.events.domain.NotificationRequest;
import vn.qts.events.domain.StreamMessage;
import vn.qts.events.infra.InboxRepository;

@Service
public class NotificationConsumer {
    private static final String NOTIFICATION_EVENT = "notification.requested.v1";

    private final EventStream stream;
    private final InboxRepository inbox;
    private final NotificationSender notificationSender;
    private final ObjectMapper objectMapper;
    private final EventProperties properties;
    private final Clock clock;

    public NotificationConsumer(
            EventStream stream,
            InboxRepository inbox,
            NotificationSender notificationSender,
            ObjectMapper objectMapper,
            EventProperties properties,
            Clock clock
    ) {
        this.stream = stream;
        this.inbox = inbox;
        this.notificationSender = notificationSender;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.clock = clock;
    }

    public int consumeDue() {
        String streamName = properties.getStreamName();
        String group = properties.getNotificationGroup();
        stream.ensureGroup(streamName, group);
        List<StreamMessage> messages = stream.reclaim(
                streamName,
                group,
                properties.getConsumerName(),
                properties.getBatchSize(),
                properties.getPendingIdle()
        );
        if (messages.size() < properties.getBatchSize()) {
            messages = new java.util.ArrayList<>(messages);
            messages.addAll(stream.read(
                    streamName,
                    group,
                    properties.getConsumerName(),
                    properties.getBatchSize() - messages.size(),
                    Duration.ZERO
            ));
        }
        int completed = 0;
        for (StreamMessage message : messages) {
            if (processMessage(message)) {
                completed++;
            }
        }
        return completed;
    }

    @Transactional
    public boolean processMessage(StreamMessage message) {
        JsonNode event = parse(message.envelope());
        String eventType = event.path("type").asText("");
        if (!NOTIFICATION_EVENT.equals(eventType)) {
            stream.acknowledge(properties.getStreamName(), properties.getNotificationGroup(), message.id());
            return true;
        }

        UUID eventId = UUID.fromString(event.path("id").asText());
        String idempotencyKey = readIdempotencyKey(event, eventId);
        InboxState row = inbox.begin(properties.getNotificationGroup(), eventId, idempotencyKey);
        if (row.isTerminal()) {
            stream.acknowledge(properties.getStreamName(), properties.getNotificationGroup(), message.id());
            return true;
        }

        try {
            NotificationRequest request = NotificationRequest.from(
                    event.path("data"),
                    properties.getMaxRecipients(),
                    properties.getMaxBodyLength()
            );
            notificationSender.send(request);
            inbox.markProcessed(properties.getNotificationGroup(), eventId, Instant.now(clock));
            stream.acknowledge(properties.getStreamName(), properties.getNotificationGroup(), message.id());
            return true;
        } catch (DeterministicEventException error) {
            moveToDeadLetter(row, event, error, Instant.now(clock));
            stream.acknowledge(properties.getStreamName(), properties.getNotificationGroup(), message.id());
            return true;
        } catch (RuntimeException error) {
            InboxState failed = inbox.markFailed(properties.getNotificationGroup(), eventId, Instant.now(clock));
            if (failed.attemptCount() >= properties.getMaxAttempts()) {
                moveToDeadLetter(failed, event, error, Instant.now(clock));
                stream.acknowledge(properties.getStreamName(), properties.getNotificationGroup(), message.id());
                return true;
            }
            return false;
        }
    }

    private void moveToDeadLetter(InboxState row, JsonNode event, Exception error, Instant now) {
        inbox.moveToDeadLetter(
                row,
                properties.getStreamName(),
                event.path("type").asText(""),
                event,
                error.getClass().getSimpleName(),
                error.getMessage() == null ? "" : error.getMessage(),
                now
        );
    }

    private JsonNode parse(String envelope) {
        try {
            return objectMapper.readTree(envelope);
        } catch (Exception error) {
            throw new DeterministicEventException("event envelope is not valid JSON");
        }
    }

    private String readIdempotencyKey(JsonNode event, UUID eventId) {
        String value = event.path("idempotency_key").asText("");
        return value.isBlank() ? eventId.toString() : value;
    }
}
