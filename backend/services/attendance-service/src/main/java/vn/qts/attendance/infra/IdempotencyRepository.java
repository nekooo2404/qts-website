package vn.qts.attendance.infra;

import java.sql.Connection;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.attendance.domain.IdempotencyOutcome;

@Repository
public class IdempotencyRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final boolean postgres;

    public IdempotencyRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.postgres = isPostgres(jdbc);
    }

    public IdempotencyOutcome begin(UUID tenantId, UUID actorId, String route, String key, String requestHash) {
        if (key == null || key.isBlank()) {
            throw new vn.qts.attendance.domain.AttendanceException("VAL_001", 400, "Thiếu Idempotency-Key.");
        }
        try {
            UUID id = UUID.randomUUID();
            jdbc.update(
                    """
                    insert into idempotency_keys
                        (id, tenant_id, actor_id, route, "key", request_hash,
                         response_status, response_body, created_at)
                    values (?, ?, ?, ?, ?, ?, null, null, ?)
                    """,
                    id, tenantId, actorId, route, key, requestHash, Instant.now()
            );
            return IdempotencyOutcome.miss(requestHash);
        } catch (DuplicateKeyException error) {
            Optional<Stored> existing = find(tenantId, actorId, route, key);
            if (existing.isEmpty() || !existing.get().requestHash().equals(requestHash)
                    || existing.get().status() == null) {
                return IdempotencyOutcome.conflict(requestHash);
            }
            return IdempotencyOutcome.hit(
                    existing.get().status(),
                    existing.get().response(),
                    requestHash
            );
        }
    }

    public void complete(UUID tenantId, UUID actorId, String route, String key, int status, JsonNode response) {
        String expression = postgres ? "cast(? as jsonb)" : "?";
        jdbc.update(
                ("update idempotency_keys set response_status = ?, response_body = %s where tenant_id = ? and actor_id = ? and route = ? and \"key\" = ?")
                        .formatted(expression),
                status, response.toString(), tenantId, actorId, route, key
        );
    }

    private Optional<Stored> find(UUID tenantId, UUID actorId, String route, String key) {
        return jdbc.query(
                """
                select request_hash, response_status, response_body
                  from idempotency_keys
                 where tenant_id = ? and actor_id = ? and route = ? and "key" = ?
                """,
                (rs, rowNum) -> new Stored(
                        rs.getString("request_hash"),
                        (Integer) rs.getObject("response_status"),
                        parseJson(rs.getString("response_body"))
                ),
                tenantId, actorId, route, key
        ).stream().findFirst();
    }

    private JsonNode parseJson(String value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.readTree(value);
        } catch (Exception error) {
            throw new IllegalStateException("Invalid idempotency response JSON", error);
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

    private record Stored(String requestHash, Integer status, JsonNode response) {
    }
}
