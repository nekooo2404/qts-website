package vn.qts.identitybridge.infra;

import java.sql.Timestamp;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import vn.qts.identitybridge.domain.ApplicationPolicy;
import vn.qts.identitybridge.domain.BridgeException;
import vn.qts.identitybridge.domain.KratosSession;
import vn.qts.identitybridge.domain.Principal;

@Repository
public class BridgeIdentityRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public BridgeIdentityRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public ApplicationPolicy application(String clientId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                select id, client_id, name, is_active, tenant_id, required_permissions
                  from identity_application
                 where client_id = ?
                """,
                clientId
        );
        if (rows.isEmpty()) {
            throw new BridgeException("unauthorized_client", "Ứng dụng chưa được cấp quyền.", 403);
        }
        Map<String, Object> row = rows.getFirst();
        return new ApplicationPolicy(
                uuid(row.get("id")),
                text(row.get("client_id")),
                text(row.get("name")),
                booleanValue(row.get("is_active")),
                uuid(row.get("tenant_id")),
                jsonSet(row.get("required_permissions"))
        );
    }

    @Transactional
    public Principal establish(KratosSession kratos, String userAgent, String remoteAddress) {
        Map<String, Object> row = principalRow(kratos.identityId());
        if (row == null) {
            throw new BridgeException("invalid_token", "Không có người dùng tương ứng với phiên đăng nhập.", 401);
        }
        UUID userId = uuid(row.get("user_id"));
        UUID oryId = uuid(row.get("ory_id"));
        UUID tenantId = uuid(row.get("tenant_id"));
        if (userId == null || oryId == null || tenantId == null
                || !booleanValue(row.get("user_active"))
                || !"active".equals(text(row.get("tenant_status")))
                || !"active".equals(text(row.get("membership_status")))) {
            throw new BridgeException("access_denied", "Bạn chưa được cấp quyền truy cập tổ chức này.", 403);
        }
        Set<String> permissions = permissions(uuid(row.get("membership_id")), tenantId);
        int securityVersion = intValue(row.get("security_version"), 1);
        UUID sessionId = findSession(kratos.id(), userId, tenantId, securityVersion);
        Instant expiresAt = kratos.expiresAt();
        int sessionMaxDays = Math.max(1, Math.min(30, intValue(row.get("session_max_days"), 7)));
        Instant maxSessionExpiry = Instant.now().plusSeconds(86_400L * sessionMaxDays);
        if (expiresAt.isAfter(maxSessionExpiry)) {
            expiresAt = maxSessionExpiry;
        }
        String methods = json(kratos.authenticationMethods());
        if (sessionId == null) {
            sessionId = UUID.randomUUID();
            jdbc.update(
                    """
                    insert into identity_identitysession
                        (id, user_id, tenant_id, user_agent, ip_hash, location,
                         authentication_methods, security_version, auth_time, last_seen_at,
                         expires_at, revoked_at, revoked_reason, kratos_session_id, hydra_sid)
                    values (?, ?, ?, ?, '', '', ?::jsonb, ?, ?, ?, ?, null, '', ?, null)
                    """,
                    sessionId,
                    userId,
                    tenantId,
                    truncate(userAgent, 600),
                    methods,
                    securityVersion,
                    Timestamp.from(kratos.authenticatedAt()),
                    Timestamp.from(Instant.now()),
                    Timestamp.from(expiresAt),
                    kratos.id()
            );
        } else {
            jdbc.update(
                    """
                    update identity_identitysession
                       set authentication_methods = ?::jsonb,
                           auth_time = ?, last_seen_at = ?, expires_at = ?
                     where id = ? and revoked_at is null
                    """,
                    methods,
                    Timestamp.from(kratos.authenticatedAt()),
                    Timestamp.from(Instant.now()),
                    Timestamp.from(expiresAt),
                    sessionId
            );
        }
        return new Principal(
                userId,
                oryId,
                tenantId,
                sessionId,
                text(row.get("email")),
                text(row.get("display_name")),
                booleanValue(row.get("require_mfa")),
                kratos.authenticatedAt(),
                expiresAt,
                permissions,
                kratos.authenticationMethods()
        );
    }

    public boolean canAccess(Principal principal, ApplicationPolicy application) {
        if (!application.active()) {
            return false;
        }
        if (application.tenantId() != null && !application.tenantId().equals(principal.tenantId())) {
            return false;
        }
        Boolean assigned = jdbc.queryForObject(
                """
                select exists (
                    select 1
                      from identity_applicationassignment
                     where membership_id = (
                         select id from identity_membership
                          where user_id = ? and tenant_id = ?
                     )
                       and application_id = (
                         select id from identity_application where client_id = ?
                     )
                       and is_enabled = true
                )
                """,
                Boolean.class,
                principal.userId(),
                principal.tenantId(),
                application.clientId()
        );
        return Boolean.TRUE.equals(assigned)
                && principal.permissions().containsAll(application.requiredPermissions());
    }

    public void revokeSessions(UUID subject) {
        jdbc.update(
                """
                update identity_identitysession
                   set revoked_at = coalesce(revoked_at, now()),
                       revoked_reason = case when revoked_at is null then 'ory_logout' else revoked_reason end
                 where user_id = (select id from identity_user where ory_id = ?)
                """,
                subject
        );
    }

    public void audit(UUID tenantId, UUID actorId, String action, UUID targetId, String metadata) {
        // The hash chain remains owned by the Identity schema.
        // This write is deliberately opt-in for deployments that have
        // enabled the shared audit writer migration.
        if (!tableExists("identity_auditevent")) {
            return;
        }
        String previous = jdbc.queryForObject(
                "select coalesce((select event_hash from identity_auditevent order by created_at desc limit 1), '')",
                String.class
        );
        String content = previous + "|" + tenantId + "|" + actorId + "|" + action + "|"
                + targetId + "|" + metadata;
        String eventHash = sha256(content);
        jdbc.update(
                """
                insert into identity_auditevent
                    (id, tenant_id, actor_id, action, target_type, target_id, outcome,
                     ip_hash, user_agent, correlation_id, metadata, previous_hash, event_hash, created_at)
                values (?, ?, ?, ?, 'identity_bridge', ?, 'success', '', '', ?, ?::jsonb, ?, ?, now())
                """,
                UUID.randomUUID(), tenantId, actorId, action,
                targetId == null ? "" : targetId.toString(),
                UUID.randomUUID(), metadata == null ? "{}" : metadata, previous, eventHash
        );
    }

    private Map<String, Object> principalRow(UUID oryId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                select u.id as user_id, u.ory_id, u.email, u.display_name,
                       u.is_active as user_active, u.security_version,
                       t.id as tenant_id, t.status as tenant_status, t.require_mfa, t.session_max_days,
                       m.id as membership_id, m.status as membership_status
                  from identity_user u
                  join identity_membership m on m.user_id = u.id
                  join identity_tenant t on t.id = m.tenant_id
                  join identity_organizationdomain d on d.tenant_id = t.id
                 where u.ory_id = ?
                   and d.domain = split_part(u.email, '@', 2)
                   and d.verified_at is not null
                 order by t.id
                 limit 1
                """,
                oryId
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private Set<String> permissions(UUID membershipId, UUID tenantId) {
        Set<String> granted = new HashSet<>(jdbc.queryForList(
                """
                select distinct p.code
                  from identity_membershiprole mr
                  join identity_role r on r.id = mr.role_id
                  join identity_rolepermission rp on rp.role_id = r.id
                  join identity_permission p on p.id = rp.permission_id
                 where mr.membership_id = ?
                   and (r.tenant_id = ? or r.tenant_id is null)
                """,
                String.class,
                membershipId,
                tenantId
        ));
        List<Map<String, Object>> direct = jdbc.queryForList(
                """
                select p.code, g.allowed
                  from identity_directgrant g
                  join identity_permission p on p.id = g.permission_id
                 where g.membership_id = ?
                """,
                membershipId
        );
        for (Map<String, Object> row : direct) {
            String code = text(row.get("code"));
            if (booleanValue(row.get("allowed"))) {
                granted.add(code);
            } else {
                granted.remove(code);
            }
        }
        return Set.copyOf(granted);
    }

    private UUID findSession(UUID kratosSessionId, UUID userId, UUID tenantId, int securityVersion) {
        List<UUID> rows = jdbc.query(
                """
                select id
                  from identity_identitysession
                 where kratos_session_id = ? and user_id = ? and tenant_id = ?
                   and security_version = ? and revoked_at is null
                 order by last_seen_at desc
                 limit 1
                """,
                (rs, ignored) -> uuid(rs.getObject("id")),
                kratosSessionId,
                userId,
                tenantId,
                securityVersion
        );
        return rows.isEmpty() ? null : rows.getFirst();
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

    private Set<String> jsonSet(Object value) {
        String raw = text(value);
        if (raw.isBlank()) {
            return Set.of();
        }
        try {
            return Set.copyOf(Arrays.asList(objectMapper.readValue(raw, String[].class)));
        } catch (JsonProcessingException error) {
            return Set.of();
        }
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException error) {
            throw new BridgeException("server_error", "Không thể tạo phiên định danh.", 503);
        }
    }

    private static UUID uuid(Object value) {
        try {
            return value == null ? null : value instanceof UUID id ? id : UUID.fromString(value.toString());
        } catch (RuntimeException error) {
            return null;
        }
    }

    private static String text(Object value) {
        return value == null ? "" : value.toString();
    }

    private static boolean booleanValue(Object value) {
        return value instanceof Boolean b ? b : "true".equalsIgnoreCase(text(value));
    }

    private static int intValue(Object value, int fallback) {
        try {
            return Integer.parseInt(text(value));
        } catch (RuntimeException error) {
            return fallback;
        }
    }

    private static String truncate(String value, int max) {
        return value == null ? "" : value.substring(0, Math.min(max, value.length()));
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
