package vn.qts.identityadmin.infra;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
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

import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;
import vn.qts.identityadmin.domain.KratosBrowserSession;

@Repository
public class IdentityReadRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public IdentityReadRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public IdentityContext context(UUID oryId, UUID tenantId, UUID sessionId) {
        List<Row> rows = jdbc.query(
                """
                select u.id as user_id, u.ory_id, u.email, u.display_name, u.is_active as user_active,
                       t.id as tenant_id, t.slug as tenant_slug, t.name as tenant_name,
                       m.id as membership_id, m.status as membership_status,
                       l.employee_id, l.employee_code,
                       s.id as session_id, s.auth_time, s.authentication_methods
                  from identity_user u
                  join identity_membership m on m.user_id = u.id and m.tenant_id = ?
                  join identity_tenant t on t.id = m.tenant_id and t.status = 'active'
                  left join identity_hrmemployeelink l
                    on l.tenant_id = m.tenant_id
                   and l.user_id = u.id
                   and l.membership_id = m.id
                   and l.status = 'active'
                 left join identity_identitysession s
                    on s.id = ?
                   and s.user_id = u.id
                   and s.tenant_id = t.id
                   and s.revoked_at is null
                 where u.ory_id = ?
                   and (? is null or s.id is not null)
                 limit 1
                """,
                (rs, ignored) -> mapRow(rs),
                tenantId,
                sessionId,
                oryId,
                sessionId
        );
        if (rows.isEmpty()) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Token không liên kết với tài khoản hoặc tổ chức đang hoạt động.",
                    401
            );
        }
        Row row = rows.getFirst();
        if (!row.userActive() || !"active".equals(row.membershipStatus())) {
            throw new IdentityAdminException(
                    "access_denied",
                    "Tài khoản chưa được cấp quyền truy cập.",
                    403
            );
        }
        return new IdentityContext(
                row.userId(),
                row.oryId(),
                row.tenantId(),
                row.membershipId(),
                row.email(),
                row.displayName(),
                row.tenantSlug(),
                row.tenantName(),
                row.userActive(),
                "active".equals(row.membershipStatus()),
                roles(row.membershipId(), row.tenantId()),
                permissions(row.membershipId(), row.tenantId()),
                row.employeeId(),
                row.employeeCode(),
                row.sessionId(),
                row.authTime() == null ? "" : row.authTime().toString(),
                jsonArray(row.authenticationMethods())
        );
    }

    @Transactional
    public IdentityContext contextFromKratosSession(
            KratosBrowserSession kratos,
            String userAgent,
            String remoteAddress
    ) {
        if (kratos == null) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
                    401
            );
        }
        Map<String, Object> row = principalRow(kratos.identityId());
        if (row == null) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Phiên đăng nhập không liên kết với tài khoản đang hoạt động.",
                    401
            );
        }
        UUID userId = uuid(row.get("user_id"));
        UUID oryId = uuid(row.get("ory_id"));
        UUID tenantId = uuid(row.get("tenant_id"));
        if (userId == null || oryId == null || tenantId == null
                || !booleanValue(row.get("user_active"))
                || !"active".equals(text(row.get("tenant_status")))
                || !"active".equals(text(row.get("membership_status")))) {
            throw new IdentityAdminException(
                    "access_denied",
                    "Tài khoản chưa được cấp quyền truy cập.",
                    403
            );
        }
        int securityVersion = intValue(row.get("security_version"), 1);
        UUID sessionId = findSession(kratos.id(), userId, tenantId, securityVersion);
        Instant expiresAt = boundedExpiry(kratos.expiresAt(), intValue(row.get("session_max_days"), 7));
        String authenticationMethods = json(kratos.authenticationMethods());
        boolean postgres = isPostgres();
        if (sessionId == null) {
            sessionId = UUID.randomUUID();
            jdbc.update(
                    postgres
                            ? """
                              insert into identity_identitysession
                                  (id, user_id, tenant_id, user_agent, ip_hash, location,
                                   authentication_methods, security_version, auth_time, last_seen_at,
                                   expires_at, revoked_at, revoked_reason, kratos_session_id, hydra_sid)
                              values (?, ?, ?, ?, ?, '', ?::jsonb, ?, ?, ?, ?, null, '', ?, null)
                              """
                            : """
                              insert into identity_identitysession
                                  (id, user_id, tenant_id, user_agent, ip_hash, location,
                                   authentication_methods, security_version, auth_time, last_seen_at,
                                   expires_at, revoked_at, revoked_reason, kratos_session_id, hydra_sid)
                              values (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, null, '', ?, null)
                              """,
                    sessionId,
                    userId,
                    tenantId,
                    truncate(userAgent, 600),
                    sha256(safe(remoteAddress)),
                    authenticationMethods,
                    securityVersion,
                    Timestamp.from(kratos.authenticatedAt()),
                    Timestamp.from(Instant.now()),
                    Timestamp.from(expiresAt),
                    kratos.id()
            );
        } else {
            jdbc.update(
                    postgres
                            ? """
                              update identity_identitysession
                                 set user_agent = ?,
                                     ip_hash = ?,
                                     authentication_methods = ?::jsonb,
                                     auth_time = ?,
                                     last_seen_at = ?,
                                     expires_at = ?
                               where id = ? and revoked_at is null
                              """
                            : """
                              update identity_identitysession
                                 set user_agent = ?,
                                     ip_hash = ?,
                                     authentication_methods = ?,
                                     auth_time = ?,
                                     last_seen_at = ?,
                                     expires_at = ?
                               where id = ? and revoked_at is null
                              """,
                    truncate(userAgent, 600),
                    sha256(safe(remoteAddress)),
                    authenticationMethods,
                    Timestamp.from(kratos.authenticatedAt()),
                    Timestamp.from(Instant.now()),
                    Timestamp.from(expiresAt),
                    sessionId
            );
        }
        return context(oryId, tenantId, sessionId);
    }

    public List<Map<String, Object>> launcher(IdentityContext context) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                select a.id, a.name, a.slug, a.description, a.icon, a.client_id,
                       a.redirect_uris, aa.last_accessed_at, a.required_permissions
                  from identity_applicationassignment aa
                  join identity_application a on a.id = aa.application_id
                 where aa.membership_id = ?
                   and aa.is_enabled = true
                   and a.is_active = true
                 order by a.name, a.id
                """,
                context.membershipId()
        );
        List<Map<String, Object>> applications = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Set<String> required = jsonSet(row.get("required_permissions"));
            if (!context.permissions().containsAll(required)) {
                continue;
            }
            List<String> redirects = jsonArray(row.get("redirect_uris"));
            Map<String, Object> application = new java.util.LinkedHashMap<>();
            application.put("id", row.get("id"));
            application.put("name", text(row.get("name")));
            application.put("slug", text(row.get("slug")));
            application.put("description", text(row.get("description")));
            application.put("icon", text(row.get("icon")));
            application.put("client_id", text(row.get("client_id")));
            application.put("redirect_uri", redirects.isEmpty() ? "" : redirects.getFirst());
            application.put("status", "Available");
            application.put("last_accessed_at", row.get("last_accessed_at"));
            applications.add(application);
        }
        return List.copyOf(applications);
    }

    public boolean canAccessApplication(IdentityContext context, String slug) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                select a.required_permissions
                  from identity_applicationassignment aa
                  join identity_application a on a.id = aa.application_id
                 where aa.membership_id = ?
                   and aa.is_enabled = true
                   and a.slug = ?
                   and a.is_active = true
                """,
                context.membershipId(),
                slug
        );
        if (rows.isEmpty()) {
            return false;
        }
        return context.permissions().containsAll(jsonSet(rows.getFirst().get("required_permissions")));
    }

    public List<Map<String, Object>> sessions(IdentityContext context) {
        return jdbc.queryForList(
                """
                select id, user_agent, location, last_seen_at, auth_time, authentication_methods
                  from identity_identitysession
                 where user_id = ? and tenant_id = ? and revoked_at is null and expires_at > now()
                 order by last_seen_at desc
                """,
                context.userId(),
                context.tenantId()
        ).stream().map(row -> Map.of(
                "id", row.get("id"),
                "current", context.sessionId() != null && context.sessionId().equals(row.get("id")),
                "user_agent", text(row.get("user_agent")),
                "location", text(row.get("location")).isBlank() ? "Vị trí không xác định" : text(row.get("location")),
                "last_seen_at", row.get("last_seen_at"),
                "auth_time", row.get("auth_time"),
                "amr", jsonArray(row.get("authentication_methods"))
        )).toList();
    }

    public Map<String, Object> securityOverview(UUID tenantId) {
        Integer activeUsers = jdbc.queryForObject(
                "select count(*) from identity_membership where tenant_id = ? and status = 'active'",
                Integer.class,
                tenantId
        );
        Integer failedLogins = jdbc.queryForObject(
                """
                select count(*) from identity_auditevent
                 where tenant_id = ? and action = 'identity.login.failed'
                   and created_at >= now() - interval '1 day'
                """,
                Integer.class,
                tenantId
        );
        Integer applications = jdbc.queryForObject(
                "select count(*) from identity_application where (tenant_id = ? or tenant_id is null) and is_active = true",
                Integer.class,
                tenantId
        );
        return Map.of(
                "active_users", activeUsers == null ? 0 : activeUsers,
                "failed_logins", failedLogins == null ? 0 : failedLogins,
                "mfa_adoption", 0,
                "risk_level", "Guarded",
                "connected_applications", applications == null ? 0 : applications
        );
    }

    public List<Map<String, Object>> auditEvents(UUID tenantId) {
        return jdbc.queryForList(
                """
                select e.id, e.action, e.outcome, e.created_at, e.target_type, e.target_id,
                       u.email as actor_email
                  from identity_auditevent e
                  left join identity_user u on u.id = e.actor_id
                 where e.tenant_id = ?
                 order by e.created_at desc
                 limit 100
                """,
                tenantId
        ).stream().map(row -> Map.of(
                "id", row.get("id"),
                "action", text(row.get("action")),
                "outcome", text(row.get("outcome")),
                "actor", text(row.get("actor_email")).isBlank() ? "Hệ thống" : text(row.get("actor_email")),
                "created_at", row.get("created_at"),
                "target_type", text(row.get("target_type")),
                "target_id", text(row.get("target_id"))
        )).toList();
    }

    private List<String> roles(UUID membershipId, UUID tenantId) {
        return List.copyOf(jdbc.queryForList(
                """
                select r.code
                  from identity_membershiprole mr
                  join identity_role r on r.id = mr.role_id
                 where mr.membership_id = ?
                   and (r.tenant_id = ? or r.tenant_id is null)
                 order by r.code
                """,
                String.class,
                membershipId,
                tenantId
        ));
    }

    private Map<String, Object> principalRow(UUID oryId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                select u.id as user_id, u.ory_id, u.email, u.display_name,
                       u.is_active as user_active, u.security_version,
                       t.id as tenant_id, t.slug as tenant_slug, t.name as tenant_name,
                       t.status as tenant_status, t.session_max_days,
                       m.id as membership_id, m.status as membership_status
                  from identity_user u
                  join identity_membership m on m.user_id = u.id
                  join identity_tenant t on t.id = m.tenant_id
                 where u.ory_id = ?
                 order by case when t.slug = 'qts' then 0 else 1 end,
                          t.created_at,
                          t.id
                 limit 1
                """,
                oryId
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private UUID findSession(UUID kratosSessionId, UUID userId, UUID tenantId, int securityVersion) {
        List<UUID> rows = jdbc.query(
                """
                select id
                  from identity_identitysession
                 where kratos_session_id = ?
                   and user_id = ?
                   and tenant_id = ?
                   and security_version = ?
                   and revoked_at is null
                 order by last_seen_at desc
                 limit 1
                """,
                (rs, ignored) -> rs.getObject("id", UUID.class),
                kratosSessionId,
                userId,
                tenantId,
                securityVersion
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
        jdbc.queryForList(
                """
                select p.code, g.allowed
                  from identity_directgrant g
                  join identity_permission p on p.id = g.permission_id
                 where g.membership_id = ?
                """,
                membershipId
        ).forEach(row -> {
            String code = text(row.get("code"));
            if (Boolean.TRUE.equals(row.get("allowed"))) {
                granted.add(code);
            } else {
                granted.remove(code);
            }
        });
        return Set.copyOf(granted);
    }

    private Row mapRow(ResultSet rs) throws SQLException {
        return new Row(
                rs.getObject("user_id", UUID.class),
                rs.getObject("ory_id", UUID.class),
                rs.getObject("tenant_id", UUID.class),
                rs.getObject("membership_id", UUID.class),
                rs.getString("email"),
                rs.getString("display_name"),
                rs.getString("tenant_slug"),
                rs.getString("tenant_name"),
                rs.getBoolean("user_active"),
                rs.getString("membership_status"),
                rs.getObject("employee_id", UUID.class),
                rs.getString("employee_code"),
                rs.getObject("session_id", UUID.class),
                timestamp(rs, "auth_time"),
                rs.getObject("authentication_methods")
        );
    }

    private static Instant timestamp(ResultSet rs, String column) throws SQLException {
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private List<String> jsonArray(Object value) {
        String raw = text(value);
        if (raw.isBlank()) {
            return List.of();
        }
        try {
            return List.copyOf(Arrays.asList(objectMapper.readValue(raw, String[].class)));
        } catch (JsonProcessingException error) {
            return List.of();
        }
    }

    private Set<String> jsonSet(Object value) {
        return Set.copyOf(jsonArray(value));
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException error) {
            throw new IdentityAdminException("server_error", "Không thể tạo phiên đăng nhập.", 503);
        }
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

    private static Instant boundedExpiry(Instant kratosExpiry, int sessionMaxDays) {
        int days = Math.max(1, Math.min(30, sessionMaxDays));
        Instant maxSessionExpiry = Instant.now().plusSeconds(86_400L * days);
        return kratosExpiry.isAfter(maxSessionExpiry) ? maxSessionExpiry : kratosExpiry;
    }

    private static UUID uuid(Object value) {
        try {
            return value == null ? null : value instanceof UUID id ? id : UUID.fromString(value.toString());
        } catch (RuntimeException error) {
            return null;
        }
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

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String truncate(String value, int max) {
        String safeValue = safe(value);
        return safeValue.substring(0, Math.min(max, safeValue.length()));
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

    private static String text(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Clob clob) {
            try {
                return clob.getSubString(1, Math.toIntExact(clob.length()));
            } catch (SQLException | ArithmeticException error) {
                return "";
            }
        }
        return value.toString();
    }

    private record Row(
            UUID userId,
            UUID oryId,
            UUID tenantId,
            UUID membershipId,
            String email,
            String displayName,
            String tenantSlug,
            String tenantName,
            boolean userActive,
            String membershipStatus,
            UUID employeeId,
            String employeeCode,
            UUID sessionId,
            Instant authTime,
            Object authenticationMethods
    ) {
    }
}
