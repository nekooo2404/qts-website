package vn.qts.events.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import vn.qts.events.domain.InboxState;

@Repository
public class JdbcInboxRepository implements InboxRepository {
    private final JdbcTemplate jdbc;
    private final boolean postgres;

    public JdbcInboxRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.postgres = isPostgres(jdbc);
    }

    @Override
    public InboxState begin(String consumerName, UUID eventId, String idempotencyKey) {
        try {
            jdbc.update(
                    """
                    insert into inbox_events
                        (id, consumer_name, event_id, idempotency_key, status,
                         processed_at, first_failed_at, request_id, attempt_count, updated_at)
                    values (?, ?, ?, ?, 'processing', null, null, null, 0, ?)
                    """,
                    UUID.randomUUID(),
                    consumerName,
                    eventId,
                    idempotencyKey,
                    Instant.now()
            );
        } catch (DuplicateKeyException ignored) {
            // Another worker already created the idempotency record.
        }
        return find(consumerName, eventId)
                .orElseThrow(() -> new IllegalStateException("Inbox row was not created"));
    }

    @Override
    public Optional<InboxState> find(String consumerName, UUID eventId) {
        String sql = """
                select consumer_name, event_id, idempotency_key, status, attempt_count, first_failed_at
                  from inbox_events
                 where consumer_name = ? and event_id = ?
                """;
        return jdbc.query(sql, inboxMapper(), consumerName, eventId).stream().findFirst();
    }

    @Override
    public void markProcessed(String consumerName, UUID eventId, Instant processedAt) {
        jdbc.update(
                """
                update inbox_events
                   set status = 'processed', processed_at = ?, updated_at = ?
                 where consumer_name = ? and event_id = ?
                """,
                processedAt,
                processedAt,
                consumerName,
                eventId
        );
    }

    @Override
    public InboxState markFailed(String consumerName, UUID eventId, Instant failedAt) {
        jdbc.update(
                """
                update inbox_events
                   set attempt_count = attempt_count + 1,
                       status = 'failed',
                       first_failed_at = coalesce(first_failed_at, ?),
                       updated_at = ?
                 where consumer_name = ? and event_id = ?
                """,
                failedAt,
                failedAt,
                consumerName,
                eventId
        );
        return find(consumerName, eventId)
                .orElseThrow(() -> new IllegalStateException("Inbox row disappeared"));
    }

    @Override
    public void moveToDeadLetter(
            InboxState inbox,
            String stream,
            String eventType,
            JsonNode payload,
            String errorClass,
            String errorText,
            Instant movedAt
    ) {
        try {
            String payloadExpression = postgres ? "cast(? as jsonb)" : "?";
            jdbc.update(
                    ("""
                    insert into inbox_dead_letters
                        (id, consumer_name, stream, event_id, event_type, payload,
                         error_class, error_text, attempt_count, first_failed_at,
                         moved_at, dlq_published_at, replayed_at)
                    values (?, ?, ?, ?, ?, %s, ?, ?, ?, ?, ?, null, null)
                    """).formatted(payloadExpression),
                    UUID.randomUUID(),
                    inbox.consumerName(),
                    stream,
                    inbox.eventId(),
                    eventType,
                    payload.toString(),
                    errorClass,
                    errorText,
                    inbox.attemptCount(),
                    inbox.firstFailedAt() == null ? movedAt : inbox.firstFailedAt(),
                    movedAt
            );
        } catch (DuplicateKeyException ignored) {
            // Durable disposition already exists.
        }
        jdbc.update(
                """
                update inbox_events
                   set status = 'discarded',
                       first_failed_at = coalesce(first_failed_at, ?),
                       updated_at = ?
                 where consumer_name = ? and event_id = ?
                """,
                movedAt,
                movedAt,
                inbox.consumerName(),
                inbox.eventId()
        );
    }

    private RowMapper<InboxState> inboxMapper() {
        return (rs, rowNum) -> new InboxState(
                rs.getObject("event_id", UUID.class),
                rs.getString("consumer_name"),
                rs.getString("idempotency_key"),
                rs.getString("status"),
                rs.getInt("attempt_count"),
                instantOrNull(rs, "first_failed_at")
        );
    }

    private Instant instantOrNull(ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private static boolean isPostgres(JdbcTemplate jdbc) {
        try {
            return Boolean.TRUE.equals(jdbc.execute((ConnectionCallback<Boolean>) connection ->
                    connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgres")
            ));
        } catch (DataAccessException error) {
            return false;
        }
    }
}
