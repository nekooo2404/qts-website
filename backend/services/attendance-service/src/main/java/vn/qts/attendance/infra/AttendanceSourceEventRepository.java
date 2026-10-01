package vn.qts.attendance.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.attendance.domain.AttendanceException;

@Repository
public class AttendanceSourceEventRepository {
    private final JdbcTemplate jdbc;
    private final boolean postgres;

    public AttendanceSourceEventRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.postgres = isPostgres(jdbc);
    }

    public void insert(
            UUID id,
            UUID tenantId,
            UUID deviceId,
            UUID eventId,
            UUID employeeId,
            String employeeRef,
            String punchType,
            Instant occurredAt,
            Instant receivedAt,
            String nonce,
            byte[] signature,
            JsonNode payload
    ) {
        String payloadExpression = postgres ? "cast(? as jsonb)" : "?";
        jdbc.update(
                ("""
                insert into attendance_source_events
                    (id, tenant_id, device_id, event_id, employee_id, employee_ref,
                     punch_type, occurred_at, received_at, nonce, signature, payload)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, %s)
                """).formatted(payloadExpression),
                id, tenantId, deviceId, eventId, employeeId, employeeRef, punchType,
                occurredAt, receivedAt, nonce, signature, payload.toString()
        );
    }

    public Optional<StoredEvent> findByEvent(UUID tenantId, UUID deviceId, UUID eventId) {
        return query(
                """
                select event_id, employee_ref, punch_type, occurred_at, nonce
                  from attendance_source_events
                 where tenant_id = ? and device_id = ? and event_id = ?
                """,
                tenantId, deviceId, eventId
        );
    }

    public Optional<StoredEvent> findByNonce(UUID tenantId, UUID deviceId, String nonce) {
        return query(
                """
                select event_id, employee_ref, punch_type, occurred_at, nonce
                  from attendance_source_events
                 where tenant_id = ? and device_id = ? and nonce = ?
                """,
                tenantId, deviceId, nonce
        );
    }

    private Optional<StoredEvent> query(String sql, Object... args) {
        return jdbc.query(sql, (rs, rowNum) -> new StoredEvent(
                rs.getObject("event_id", UUID.class),
                rs.getString("employee_ref"),
                rs.getString("punch_type"),
                rs.getTimestamp("occurred_at").toInstant(),
                rs.getString("nonce")
        ), args).stream().findFirst();
    }

    public record StoredEvent(UUID eventId, String employeeRef, String punchType, Instant occurredAt, String nonce) {
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
