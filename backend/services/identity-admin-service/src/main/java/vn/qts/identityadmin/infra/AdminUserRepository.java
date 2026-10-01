package vn.qts.identityadmin.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.identityadmin.domain.AdminMembership;
import vn.qts.identityadmin.domain.AdminUser;
import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.UserListPage;

@Repository
public class AdminUserRepository {
    private final JdbcTemplate jdbc;

    public AdminUserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public UserListPage list(UUID tenantId, String query, String status, String role, int page, int pageSize) {
        Where where = where(tenantId, query, status, role);
        Integer total = jdbc.queryForObject(
                "select count(*) " + where.fromAndWhere(),
                Integer.class,
                where.args().toArray()
        );
        int offset = (page - 1) * pageSize;
        List<Object> args = new ArrayList<>(where.args());
        args.add(pageSize);
        args.add(offset);
        List<Row> rows = jdbc.query(
                """
                select u.id as user_id, u.email, u.display_name, u.is_active, u.ory_id, u.created_at,
                       m.id as membership_id, m.status, m.policy_version
                """ + where.fromAndWhere() + """
                 order by u.email asc
                 limit ? offset ?
                """,
                this::mapRow,
                args.toArray()
        );
        List<AdminUser> users = rows.stream().map(row -> toUser(row, tenantId)).toList();
        return new UserListPage(users, Map.of(
                "page", page,
                "page_size", pageSize,
                "total", total == null ? 0 : total
        ));
    }

    public AdminUser get(UUID tenantId, UUID membershipId) {
        List<Row> rows = jdbc.query(
                """
                select u.id as user_id, u.email, u.display_name, u.is_active, u.ory_id, u.created_at,
                       m.id as membership_id, m.status, m.policy_version
                  from identity_membership m
                  join identity_user u on u.id = m.user_id
                 where m.tenant_id = ? and m.id = ?
                 limit 1
                """,
                this::mapRow,
                tenantId,
                membershipId
        );
        if (rows.isEmpty()) {
            throw new IdentityAdminException("not_found", "Không tìm thấy tài khoản trong tổ chức.", 404);
        }
        return toUser(rows.getFirst(), tenantId);
    }

    private AdminUser toUser(Row row, UUID tenantId) {
        List<String> roles = jdbc.queryForList(
                """
                select r.code
                  from identity_membershiprole mr
                  join identity_role r on r.id = mr.role_id
                 where mr.membership_id = ?
                   and (r.tenant_id = ? or r.tenant_id is null)
                 order by r.code
                """,
                String.class,
                row.membershipId(),
                tenantId
        );
        List<String> applications = jdbc.queryForList(
                """
                select a.slug
                 from identity_applicationassignment aa
                 join identity_application a on a.id = aa.application_id
                 where aa.membership_id = ?
                   and aa.is_enabled = true
                 order by a.slug
                """,
                String.class,
                row.membershipId()
        );
        AdminMembership membership = new AdminMembership(
                row.membershipId(),
                row.status(),
                statusLabel(row.status()),
                roles,
                applications,
                row.policyVersion()
        );
        return new AdminUser(
                row.userId(),
                row.membershipId(),
                row.email(),
                row.displayName(),
                row.active(),
                row.oryId(),
                membership,
                row.createdAt()
        );
    }

    private Where where(UUID tenantId, String query, String status, String role) {
        StringBuilder sql = new StringBuilder("""
                  from identity_membership m
                  join identity_user u on u.id = m.user_id
                 where m.tenant_id = ?
                """);
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        if (!query.isBlank()) {
            sql.append(" and (lower(u.email) like ? or lower(u.display_name) like ?)");
            String pattern = "%" + query.toLowerCase() + "%";
            args.add(pattern);
            args.add(pattern);
        }
        if (!status.isBlank()) {
            sql.append(" and m.status = ?");
            args.add(status);
        }
        if (!role.isBlank()) {
            sql.append("""
                 and exists (
                     select 1
                       from identity_membershiprole mr
                       join identity_role r on r.id = mr.role_id
                      where mr.membership_id = m.id
                        and r.code = ?
                        and (r.tenant_id = m.tenant_id or r.tenant_id is null)
                 )
                """);
            args.add(role);
        }
        return new Where(sql.toString(), args);
    }

    private Row mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new Row(
                rs.getObject("user_id", UUID.class),
                rs.getObject("membership_id", UUID.class),
                rs.getString("email"),
                rs.getString("display_name"),
                rs.getBoolean("is_active"),
                rs.getObject("ory_id", UUID.class),
                rs.getString("status"),
                rs.getInt("policy_version"),
                instant(rs, "created_at")
        );
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        var timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static String statusLabel(String status) {
        return switch (status) {
            case "active" -> "Active";
            case "invited" -> "Invited";
            case "disabled" -> "Disabled";
            default -> status;
        };
    }

    private record Row(
            UUID userId,
            UUID membershipId,
            String email,
            String displayName,
            boolean active,
            UUID oryId,
            String status,
            int policyVersion,
            Instant createdAt
    ) {
    }

    private record Where(String fromAndWhere, List<Object> args) {
    }
}
