package vn.qts.identityadmin.infra;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;

@Repository
public class IdentityAuditRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public IdentityAuditRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public void append(
            IdentityContext actor,
            String action,
            String targetType,
            String targetId,
            Map<String, Object> metadata
    ) {
        if (!tableExists("identity_auditevent")) {
            return;
        }

        boolean postgres = isPostgres();
        if (postgres) {
            // Serialize append-only chain writes in the current transaction.
            jdbc.queryForObject("select pg_advisory_xact_lock(hashtext('qts.identity.audit'))", Object.class);
        }

        String previous = jdbc.queryForObject(
                """
                select coalesce((
                    select event_hash
                      from identity_auditevent
                     order by created_at desc, id desc
                     limit 1
                ), '')
                """,
                String.class
        );
        String metadataJson = json(metadata == null ? Map.of() : metadata);
        String content = previous + "|" + actor.tenantId() + "|" + actor.userId()
                + "|" + action + "|" + targetId + "|" + metadataJson;
        String eventHash = sha256(content);

        String sql = postgres
                ? """
                  insert into identity_auditevent
                      (id, tenant_id, actor_id, action, target_type, target_id, outcome,
                       ip_hash, user_agent, correlation_id, metadata, previous_hash, event_hash, created_at)
                  values (?, ?, ?, ?, ?, ?, 'success', '', '', ?, ?::jsonb, ?, ?, ?)
                  """
                : """
                  insert into identity_auditevent
                      (id, tenant_id, actor_id, action, target_type, target_id, outcome,
                       ip_hash, user_agent, correlation_id, metadata, previous_hash, event_hash, created_at)
                  values (?, ?, ?, ?, ?, ?, 'success', '', '', ?, ?, ?, ?, ?)
                  """;
        jdbc.update(
                sql,
                UUID.randomUUID(),
                actor.tenantId(),
                actor.userId(),
                action,
                safe(targetType, 80),
                safe(targetId, 128),
                UUID.randomUUID(),
                metadataJson,
                previous == null ? "" : previous,
                eventHash,
                Timestamp.from(Instant.now())
        );
    }

    private boolean isPostgres() {
        try (Connection connection = jdbc.getDataSource().getConnection()) {
            return connection.getMetaData()
                    .getDatabaseProductName()
                    .toLowerCase()
                    .contains("postgresql");
        } catch (SQLException | NullPointerException error) {
            return false;
        }
    }

    private boolean tableExists(String table) {
        try {
            return Boolean.TRUE.equals(jdbc.queryForObject(
                    "select exists (select 1 from information_schema.tables where table_name = ?)",
                    Boolean.class,
                    table
            ));
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException error) {
            throw new IdentityAdminException(
                    "server_error",
                    "Không thể ghi nhận sự kiện bảo mật.",
                    503
            );
        }
    }

    private static String safe(String value, int max) {
        String safeValue = value == null ? "" : value;
        return safeValue.length() > max ? safeValue.substring(0, max) : safeValue;
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder output = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                output.append(String.format("%02x", item));
            }
            return output.toString();
        } catch (Exception error) {
            throw new IllegalStateException("SHA-256 is unavailable", error);
        }
    }
}
