package vn.qts.attendance.infra;

import java.sql.Connection;
import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AttendanceOutboxRepository {
    private final JdbcTemplate jdbc;
    private final boolean postgres;

    public AttendanceOutboxRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.postgres = isPostgres(jdbc);
    }

    public void insert(
            UUID id,
            UUID tenantId,
            String eventType,
            String aggregateType,
            UUID aggregateId,
            JsonNode payload,
            JsonNode headers,
            Instant occurredAt
    ) {
        String payloadExpression = postgres ? "cast(? as jsonb)" : "?";
        String headersExpression = postgres ? "cast(? as jsonb)" : "?";
        jdbc.update(
                ("""
                insert into outbox_events
                    (id, tenant_id, event_type, aggregate_type, aggregate_id,
                     payload, headers, occurred_at, published_at, attempt_count,
                     available_at, created_at)
                values (?, ?, ?, ?, ?, %s, %s, ?, null, 0, ?, ?)
                """).formatted(payloadExpression, headersExpression),
                id, tenantId, eventType, aggregateType, aggregateId,
                payload.toString(), headers.toString(), occurredAt, occurredAt, occurredAt
        );
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
