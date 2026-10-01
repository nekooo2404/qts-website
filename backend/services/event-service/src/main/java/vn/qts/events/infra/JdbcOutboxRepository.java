package vn.qts.events.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import vn.qts.events.domain.OutboxEvent;

@Repository
public class JdbcOutboxRepository implements OutboxRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final boolean postgres;

    public JdbcOutboxRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.postgres = isPostgres(jdbc);
    }

    @Override
    public List<OutboxEvent> findDueHeadsForUpdate(Instant now, int limit) {
        String lockClause = postgres ? " for update skip locked" : "";
        String sql = """
                select id, tenant_id, event_type, aggregate_type, aggregate_id,
                       payload, headers, occurred_at, published_at, attempt_count,
                       available_at, created_at
                  from outbox_events ob
                 where published_at is null
                   and available_at <= ?
                   and not exists (
                       select 1
                         from outbox_events older
                        where older.aggregate_type = ob.aggregate_type
                          and older.aggregate_id = ob.aggregate_id
                          and older.published_at is null
                          and older.occurred_at < ob.occurred_at
                   )
                 order by occurred_at asc
                 limit ?
                """ + lockClause;
        return jdbc.query(sql, outboxMapper(), now, limit);
    }

    @Override
    public void markPublished(UUID eventId, Instant publishedAt) {
        jdbc.update("update outbox_events set published_at = ? where id = ?", publishedAt, eventId);
    }

    @Override
    public void scheduleRetry(UUID eventId, int attemptCount, Instant availableAt) {
        jdbc.update(
                "update outbox_events set attempt_count = ?, available_at = ? where id = ?",
                attemptCount,
                availableAt,
                eventId
        );
    }

    private RowMapper<OutboxEvent> outboxMapper() {
        return (rs, rowNum) -> new OutboxEvent(
                rs.getObject("id", UUID.class),
                rs.getObject("tenant_id", UUID.class),
                rs.getString("event_type"),
                rs.getString("aggregate_type"),
                rs.getObject("aggregate_id", UUID.class),
                json(rs, "payload"),
                json(rs, "headers"),
                rs.getTimestamp("occurred_at").toInstant(),
                rs.getTimestamp("published_at") == null ? null : rs.getTimestamp("published_at").toInstant(),
                rs.getInt("attempt_count"),
                rs.getTimestamp("available_at").toInstant(),
                rs.getTimestamp("created_at").toInstant()
        );
    }

    private JsonNode json(ResultSet rs, String column) throws SQLException {
        String value = rs.getString(column);
        if (value == null) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(value);
        } catch (Exception error) {
            throw new SQLException("Invalid JSON in " + column, error);
        }
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
