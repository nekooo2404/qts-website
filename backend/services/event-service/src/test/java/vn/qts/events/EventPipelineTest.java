package vn.qts.events;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import vn.qts.events.application.EventStream;
import vn.qts.events.application.NotificationConsumer;
import vn.qts.events.application.NotificationDeliveryException;
import vn.qts.events.application.NotificationSender;
import vn.qts.events.application.OutboxPublisher;
import vn.qts.events.domain.NotificationRequest;
import vn.qts.events.domain.StreamMessage;

@SpringBootTest
@ActiveProfiles("test")
class EventPipelineTest {
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-7000-8000-000000000001");

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    OutboxPublisher publisher;

    @Autowired
    NotificationConsumer consumer;

    @Autowired
    InMemoryStream stream;

    @Autowired
    RecordingSender sender;

    @Autowired
    ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from inbox_dead_letters");
        jdbc.update("delete from inbox_events");
        jdbc.update("delete from outbox_events");
        stream.clear();
        sender.clear();
    }

    @Test
    void publishesDueOutboxRowsAsCloudEventsOnce() throws Exception {
        UUID eventId = insertOutbox("""
                {"to":["ops@example.test"],"subject":"Lead mới","body":"Nội dung"}
                """);

        assertThat(publisher.publishDue()).isEqualTo(1);
        assertThat(publisher.publishDue()).isZero();

        Instant publishedAt = jdbc.queryForObject(
                "select published_at from outbox_events where id = ?",
                Instant.class,
                eventId
        );
        assertThat(publishedAt).isNotNull();
        assertThat(stream.length("qts.events")).isEqualTo(1);

        JsonNode envelope = objectMapper.readTree(stream.envelopes().getFirst());
        assertThat(envelope.path("type").asText()).isEqualTo("notification.requested.v1");
        assertThat(envelope.path("source").asText()).isEqualTo("qts.leads");
        assertThat(envelope.path("data").path("tenantId").asText()).isEqualTo(TENANT_ID.toString());
    }

    @Test
    void consumesNotificationOnceAndMarksInboxProcessed() {
        UUID eventId = insertOutbox("""
                {"to":["ops@example.test"],"subject":"Subject","body":"Body"}
                """);
        publisher.publishDue();

        assertThat(consumer.consumeDue()).isEqualTo(1);
        assertThat(sender.sent()).hasSize(1);
        assertThat(sender.sent().getFirst().recipients()).containsExactly("ops@example.test");

        String status = jdbc.queryForObject(
                "select status from inbox_events where event_id = ?",
                String.class,
                eventId
        );
        assertThat(status).isEqualTo("processed");
        assertThat(consumer.consumeDue()).isZero();
    }

    @Test
    void movesDeterministicNotificationErrorsToDeadLetterWithoutRetry() {
        UUID eventId = insertOutbox("""
                {"subject":"Subject","body":"Body"}
                """);
        publisher.publishDue();

        assertThat(consumer.consumeDue()).isEqualTo(1);
        assertThat(sender.sent()).isEmpty();

        Map<String, Object> dead = jdbc.queryForMap(
                """
                select i.status as status, d.attempt_count as attempt_count, d.error_class as error_class
                  from inbox_events i
                  join inbox_dead_letters d using (event_id)
                 where i.event_id = ?
                """,
                eventId
        );
        assertThat(dead.get("status")).isEqualTo("discarded");
        assertThat(((Number) dead.get("attempt_count")).intValue()).isZero();
        assertThat(dead.get("error_class")).isEqualTo("DeterministicEventException");
    }

    @Test
    void retriesTransientNotificationErrorsThenDeadLetters() {
        UUID eventId = insertOutbox("""
                {"to":["ops@example.test"],"subject":"Subject","body":"Body"}
                """);
        publisher.publishDue();
        sender.fail.set(true);

        for (int i = 1; i <= 7; i++) {
            assertThat(consumer.consumeDue()).isZero();
            int attempts = jdbc.queryForObject(
                    "select attempt_count from inbox_events where event_id = ?",
                    Integer.class,
                    eventId
            );
            assertThat(attempts).isEqualTo(i);
        }

        assertThat(consumer.consumeDue()).isEqualTo(1);
        Map<String, Object> dead = jdbc.queryForMap(
                """
                select i.status as status, d.attempt_count as attempt_count
                  from inbox_events i
                  join inbox_dead_letters d using (event_id)
                 where i.event_id = ?
                """,
                eventId
        );
        assertThat(dead.get("status")).isEqualTo("discarded");
        assertThat(((Number) dead.get("attempt_count")).intValue()).isEqualTo(8);
    }

    private UUID insertOutbox(String payload) {
        UUID eventId = UUID.randomUUID();
        Instant now = Instant.parse("2026-09-22T00:00:00Z");
        jdbc.update(
                """
                insert into outbox_events
                    (id, tenant_id, event_type, aggregate_type, aggregate_id,
                     payload, headers, occurred_at, published_at, attempt_count,
                     available_at, created_at)
                values (?, ?, 'notification.requested.v1', 'lead', ?, ?, ?, ?, null, 0, ?, ?)
                """,
                eventId,
                TENANT_ID,
                UUID.randomUUID(),
                payload,
                "{\"source\":\"qts.leads\",\"request_id\":\"%s\"}".formatted(UUID.randomUUID()),
                now,
                now,
                now
        );
        return eventId;
    }

    @TestConfiguration
    static class TestDoubles {
        @Bean
        @Primary
        InMemoryStream inMemoryStream() {
            return new InMemoryStream();
        }

        @Bean
        @Primary
        RecordingSender recordingSender() {
            return new RecordingSender();
        }
    }

    static class RecordingSender implements NotificationSender {
        private final List<NotificationRequest> sent = new ArrayList<>();
        private final AtomicBoolean fail = new AtomicBoolean();

        @Override
        public void send(NotificationRequest request) {
            if (fail.get()) {
                throw new NotificationDeliveryException("smtp down");
            }
            sent.add(request);
        }

        List<NotificationRequest> sent() {
            return sent;
        }

        void clear() {
            sent.clear();
            fail.set(false);
        }
    }

    static class InMemoryStream implements EventStream {
        private final Map<String, List<StreamMessage>> streams = new HashMap<>();
        private final Map<String, Integer> cursors = new HashMap<>();
        private final Map<String, Map<String, StreamMessage>> pending = new HashMap<>();

        @Override
        public String add(String stream, String envelope) {
            List<StreamMessage> records = streams.computeIfAbsent(stream, ignored -> new ArrayList<>());
            String id = (records.size() + 1) + "-0";
            records.add(new StreamMessage(id, envelope));
            return id;
        }

        @Override
        public long length(String stream) {
            return streams.getOrDefault(stream, List.of()).size();
        }

        @Override
        public void ensureGroup(String stream, String group) {
            cursors.putIfAbsent(stream + ":" + group, 0);
            pending.computeIfAbsent(stream + ":" + group, ignored -> new HashMap<>());
        }

        @Override
        public List<StreamMessage> read(String stream, String group, String consumer, int count, Duration block) {
            ensureGroup(stream, group);
            String key = stream + ":" + group;
            List<StreamMessage> records = streams.getOrDefault(stream, List.of());
            int cursor = cursors.get(key);
            int end = Math.min(records.size(), cursor + count);
            List<StreamMessage> batch = new ArrayList<>(records.subList(cursor, end));
            cursors.put(key, end);
            batch.forEach(message -> pending.get(key).put(message.id(), message));
            return batch;
        }

        @Override
        public List<StreamMessage> reclaim(String stream, String group, String consumer, int count, Duration minIdle) {
            ensureGroup(stream, group);
            return pending.get(stream + ":" + group).values().stream().limit(count).toList();
        }

        @Override
        public void acknowledge(String stream, String group, String messageId) {
            ensureGroup(stream, group);
            pending.get(stream + ":" + group).remove(messageId);
        }

        List<String> envelopes() {
            return streams.getOrDefault("qts.events", List.of()).stream()
                    .map(StreamMessage::envelope)
                    .toList();
        }

        void clear() {
            streams.clear();
            cursors.clear();
            pending.clear();
        }
    }
}
