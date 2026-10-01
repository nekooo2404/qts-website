package vn.qts.identityadmin.infra;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;

@Repository
public class EnrollmentRepository {
    private final JdbcTemplate jdbc;
    private final IdentityAuditRepository audit;

    public EnrollmentRepository(JdbcTemplate jdbc, IdentityAuditRepository audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    public EnrollmentUser userByOryId(UUID oryId) {
        List<EnrollmentUser> rows = jdbc.query(
                """
                select id, ory_id, email, display_name, is_active
                  from identity_user
                 where ory_id = ?
                 limit 1
                """,
                (rs, ignored) -> new EnrollmentUser(
                        rs.getObject("id", UUID.class),
                        rs.getObject("ory_id", UUID.class),
                        rs.getString("email"),
                        rs.getString("display_name"),
                        rs.getBoolean("is_active")
                ),
                oryId
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    @Transactional
    public void complete(EnrollmentUser user, String completedAt) {
        if (user == null || !user.active()) {
            throw new IdentityAdminException(
                    "access_denied",
                    "Tài khoản chưa được cấp quyền truy cập.",
                    403
            );
        }
        List<EnrollmentMembership> memberships = jdbc.query(
                """
                select m.id as membership_id, m.tenant_id, m.status,
                       t.slug as tenant_slug, t.name as tenant_name
                  from identity_membership m
                  join identity_tenant t on t.id = m.tenant_id
                 where m.user_id = ?
                 order by t.created_at, t.id
                """,
                (rs, ignored) -> new EnrollmentMembership(
                        rs.getObject("membership_id", UUID.class),
                        rs.getObject("tenant_id", UUID.class),
                        rs.getString("tenant_slug"),
                        rs.getString("tenant_name"),
                        rs.getString("status")
                ),
                user.id()
        );
        Instant now = Instant.now();
        for (EnrollmentMembership membership : memberships) {
            if ("invited".equals(membership.status())) {
                jdbc.update(
                        "update identity_membership set status = 'active', updated_at = ? where id = ? and status = 'invited'",
                        now,
                        membership.id()
                );
            }
            audit.append(
                    context(user, membership),
                    "identity.enrollment.completed",
                    "membership",
                    membership.id().toString(),
                    Map.of("completed_at", completedAt, "self_service", true)
            );
        }
    }

    private static IdentityContext context(EnrollmentUser user, EnrollmentMembership membership) {
        return new IdentityContext(
                user.id(),
                user.oryId(),
                membership.tenantId(),
                membership.id(),
                user.email(),
                user.displayName(),
                membership.tenantSlug(),
                membership.tenantName(),
                user.active(),
                true,
                List.of(),
                Set.of(),
                null,
                "",
                null,
                "",
                List.of()
        );
    }

    public record EnrollmentUser(
            UUID id,
            UUID oryId,
            String email,
            String displayName,
            boolean active
    ) {
    }

    private record EnrollmentMembership(
            UUID id,
            UUID tenantId,
            String tenantSlug,
            String tenantName,
            String status
    ) {
    }
}
