package vn.qts.identityadmin.infra;

import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;

/**
 * Owns session-admin revocation writes.
 *
 * <p>The database row is the authoritative revocation read model for
 * Identity session state. Ory bridge ownership remains separate, so this class
 * never handles passwords or creates tokens.</p>
 */
@Repository
public class IdentitySessionAdminRepository {
    private final JdbcTemplate jdbc;
    private final IdentityAuditRepository audit;

    public IdentitySessionAdminRepository(JdbcTemplate jdbc, IdentityAuditRepository audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Transactional
    public void revoke(UUID targetSessionId, IdentityContext actor, String reason) {
        TargetSession target = jdbc.query(
                """
                select id, user_id, tenant_id, kratos_session_id, revoked_at
                  from identity_identitysession
                 where id = ? and tenant_id = ?
                 limit 1
                """,
                (rs, ignored) -> new TargetSession(
                        rs.getObject("id", UUID.class),
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("tenant_id", UUID.class),
                        rs.getObject("kratos_session_id", UUID.class),
                        rs.getTimestamp("revoked_at") == null
                ),
                targetSessionId,
                actor.tenantId()
        ).stream().findFirst().orElseThrow(() -> new IdentityAdminException(
                "not_found",
                "Không tìm thấy phiên đăng nhập.",
                404
        ));

        boolean ownSession = actor.userId().equals(target.userId());
        boolean canManageUsers = actor.permissions().contains("identity.manage_users");
        if (!ownSession && !canManageUsers) {
            // Do not disclose whether another user's session exists.
            throw new IdentityAdminException(
                    "not_found",
                    "Không tìm thấy phiên đăng nhập.",
                    404
            );
        }

        jdbc.update(
                """
                update identity_identitysession
                   set revoked_at = coalesce(revoked_at, now()),
                       revoked_reason = case
                           when revoked_at is null then ?
                           else revoked_reason
                       end
                 where id = ? and tenant_id = ?
                """,
                safeReason(reason),
                target.id(),
                actor.tenantId()
        );

        audit.append(
                actor,
                "identity.session.revoked",
                "identity_session",
                target.id().toString(),
                Map.of(
                        "reason", safeReason(reason),
                        "target_user_id", target.userId().toString(),
                        "target_session_id", target.id().toString()
                )
        );
    }

    private static String safeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "remote_logout";
        }
        return reason.length() > 120 ? reason.substring(0, 120) : reason;
    }

    private record TargetSession(
            UUID id,
            UUID userId,
            UUID tenantId,
            UUID kratosSessionId,
            boolean active
    ) {
    }
}
