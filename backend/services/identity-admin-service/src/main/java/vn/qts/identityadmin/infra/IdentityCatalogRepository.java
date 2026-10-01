package vn.qts.identityadmin.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.identityadmin.domain.AdminApplicationCatalogItem;
import vn.qts.identityadmin.domain.AdminRoleCatalogItem;

@Repository
public class IdentityCatalogRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public IdentityCatalogRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public List<AdminRoleCatalogItem> roles(UUID tenantId) {
        return jdbc.query(
                """
                select r.id, r.code, r.name, r.description, r.is_system, r.created_at,
                       coalesce((
                         select count(*)
                           from identity_membershiprole mr
                           join identity_membership m on m.id = mr.membership_id
                          where mr.role_id = r.id
                            and m.tenant_id = ?
                       ), 0) as members
                  from identity_role r
                 where r.tenant_id = ? or r.tenant_id is null
                 order by r.is_system desc, r.code asc
                """,
                this::mapRole,
                tenantId,
                tenantId
        );
    }

    public List<AdminApplicationCatalogItem> applications(UUID tenantId) {
        return jdbc.query(
                """
                select a.id, a.slug, a.name, a.description, a.client_id,
                       a.application_type, a.icon, a.is_active, a.required_permissions,
                       a.redirect_uris, a.created_at,
                       coalesce((
                         select count(*)
                           from identity_applicationassignment aa
                           join identity_membership m on m.id = aa.membership_id
                          where aa.application_id = a.id
                            and aa.is_enabled = true
                            and m.tenant_id = ?
                       ), 0) as assignments
                  from identity_application a
                 where a.tenant_id = ? or a.tenant_id is null
                 order by a.name asc, a.slug asc
                """,
                this::mapApplication,
                tenantId,
                tenantId
        );
    }

    private AdminRoleCatalogItem mapRole(ResultSet rs, int rowNum) throws SQLException {
        UUID roleId = rs.getObject("id", UUID.class);
        return new AdminRoleCatalogItem(
                roleId,
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getBoolean("is_system"),
                rolePermissions(roleId),
                rs.getInt("members"),
                instant(rs, "created_at")
        );
    }

    private AdminApplicationCatalogItem mapApplication(ResultSet rs, int rowNum) throws SQLException {
        return new AdminApplicationCatalogItem(
                rs.getObject("id", UUID.class),
                rs.getString("slug"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getString("client_id"),
                rs.getString("application_type"),
                rs.getString("icon"),
                rs.getBoolean("is_active"),
                jsonArray(rs.getString("required_permissions")),
                jsonArray(rs.getString("redirect_uris")),
                rs.getInt("assignments"),
                instant(rs, "created_at")
        );
    }

    private List<String> jsonArray(Object value) {
        String raw = value == null ? "" : value.toString();
        if (raw.isBlank()) {
            return List.of();
        }
        try {
            return List.copyOf(Arrays.asList(objectMapper.readValue(raw, String[].class)));
        } catch (JsonProcessingException error) {
            return List.of();
        }
    }

    private List<String> rolePermissions(UUID roleId) {
        return List.copyOf(jdbc.queryForList(
                """
                select p.code
                  from identity_rolepermission rp
                  join identity_permission p on p.id = rp.permission_id
                 where rp.role_id = ?
                 order by p.code
                """,
                String.class,
                roleId
        ));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }
}
