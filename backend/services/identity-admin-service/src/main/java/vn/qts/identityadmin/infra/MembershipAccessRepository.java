package vn.qts.identityadmin.infra;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import vn.qts.identityadmin.domain.AdminUser;
import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;

@Repository
public class MembershipAccessRepository {
    private final JdbcTemplate jdbc;
    private final AdminUserRepository users;
    private final IdentityAuditRepository audit;

    public MembershipAccessRepository(
            JdbcTemplate jdbc,
            AdminUserRepository users,
            IdentityAuditRepository audit
    ) {
        this.jdbc = jdbc;
        this.users = users;
        this.audit = audit;
    }

    @Transactional
    public AdminUser update(
            UUID tenantId,
            UUID membershipId,
            List<String> roleCodes,
            List<String> applicationSlugs,
            IdentityContext actor
    ) {
        UUID userId = membershipUserId(tenantId, membershipId);
        List<UUID> roleIds = roleIds(tenantId, roleCodes);
        List<UUID> applicationIds = applicationIds(tenantId, applicationSlugs);
        if (currentRoles(membershipId, tenantId).equals(roleCodes)
                && currentApplications(membershipId).equals(applicationSlugs)) {
            return users.get(tenantId, membershipId);
        }

        jdbc.update("delete from identity_membershiprole where membership_id = ?", membershipId);
        for (UUID roleId : roleIds) {
            jdbc.update(
                    "insert into identity_membershiprole (membership_id, role_id, assigned_by_id, created_at) values (?, ?, ?, ?)",
                    membershipId,
                    roleId,
                    actor.userId(),
                    Instant.now()
            );
        }

        jdbc.update(
                """
                update identity_applicationassignment
                   set is_enabled = false
                 where membership_id = ?
                """,
                membershipId
        );
        for (UUID applicationId : applicationIds) {
            Integer updated = jdbc.update(
                    """
                    update identity_applicationassignment
                       set is_enabled = true
                     where membership_id = ? and application_id = ?
                    """,
                    membershipId,
                    applicationId
            );
            if (updated == 0) {
                jdbc.update(
                        """
                        insert into identity_applicationassignment
                            (membership_id, application_id, is_enabled, last_accessed_at, created_at)
                        values (?, ?, true, null, ?)
                        """,
                        membershipId,
                        applicationId,
                        Instant.now()
                );
            }
        }

        jdbc.update(
                """
                update identity_membership
                   set policy_version = policy_version + 1,
                       updated_at = ?
                 where id = ? and tenant_id = ?
                """,
                Instant.now(),
                membershipId,
                tenantId
        );

        audit.append(
                actor,
                "identity.membership.access.updated",
                "identity_membership",
                membershipId.toString(),
                Map.of(
                        "target_user_id", userId.toString(),
                        "roles", List.copyOf(roleCodes),
                        "applications", List.copyOf(applicationSlugs)
                )
        );
        return users.get(tenantId, membershipId);
    }

    private UUID membershipUserId(UUID tenantId, UUID membershipId) {
        List<UUID> rows = jdbc.queryForList(
                "select user_id from identity_membership where tenant_id = ? and id = ? limit 1",
                UUID.class,
                tenantId,
                membershipId
        );
        if (rows.isEmpty()) {
            throw new IdentityAdminException("not_found", "Không tìm thấy tài khoản trong tổ chức.", 404);
        }
        return rows.getFirst();
    }

    private List<UUID> roleIds(UUID tenantId, List<String> roleCodes) {
        if (roleCodes.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = jdbc.queryForList(
                """
                select id
                  from identity_role
                 where code in (:codes)
                   and (tenant_id = :tenant_id or tenant_id is null)
                 order by code
                """.replace(":codes", placeholders(roleCodes.size()))
                        .replace(":tenant_id", "?"),
                UUID.class,
                args(roleCodes, tenantId).toArray()
        );
        if (ids.size() != roleCodes.size()) {
            throw new IdentityAdminException("invalid_request", "Vai trò không hợp lệ hoặc ngoài phạm vi tổ chức.", 400);
        }
        return ids;
    }

    private List<String> currentRoles(UUID membershipId, UUID tenantId) {
        return jdbc.queryForList(
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
        );
    }

    private List<String> currentApplications(UUID membershipId) {
        return jdbc.queryForList(
                """
                select a.slug
                  from identity_applicationassignment aa
                  join identity_application a on a.id = aa.application_id
                 where aa.membership_id = ?
                   and aa.is_enabled = true
                 order by a.slug
                """,
                String.class,
                membershipId
        );
    }

    private List<UUID> applicationIds(UUID tenantId, List<String> applicationSlugs) {
        if (applicationSlugs.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = jdbc.queryForList(
                """
                select id
                  from identity_application
                 where slug in (:slugs)
                   and is_active = true
                   and (tenant_id = :tenant_id or tenant_id is null)
                 order by slug
                """.replace(":slugs", placeholders(applicationSlugs.size()))
                        .replace(":tenant_id", "?"),
                UUID.class,
                args(applicationSlugs, tenantId).toArray()
        );
        if (ids.size() != applicationSlugs.size()) {
            throw new IdentityAdminException("invalid_request", "Ứng dụng không hợp lệ hoặc ngoài phạm vi tổ chức.", 400);
        }
        return ids;
    }

    private static List<Object> args(List<String> values, UUID tenantId) {
        java.util.ArrayList<Object> args = new java.util.ArrayList<>(values);
        args.add(tenantId);
        return args;
    }

    private static String placeholders(int count) {
        return String.join(",", java.util.Collections.nCopies(count, "?"));
    }
}
