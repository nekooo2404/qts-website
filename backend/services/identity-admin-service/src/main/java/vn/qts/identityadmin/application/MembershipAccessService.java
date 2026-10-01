package vn.qts.identityadmin.application;

import java.util.List;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import vn.qts.identityadmin.domain.AdminUser;
import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;
import vn.qts.identityadmin.infra.IdentityReadRepository;
import vn.qts.identityadmin.infra.MembershipAccessRepository;
import vn.qts.identityadmin.security.TokenClaimReader;

@Service
public class MembershipAccessService {
    private final TenantClaims tenantClaims;
    private final IdentityReadRepository identity;
    private final MembershipAccessRepository access;

    public MembershipAccessService(
            TenantClaims tenantClaims,
            IdentityReadRepository identity,
            MembershipAccessRepository access
    ) {
        this.tenantClaims = tenantClaims;
        this.identity = identity;
        this.access = access;
    }

    public AdminUser update(UUID membershipId, UpdateMembershipAccessRequest request, Jwt jwt) {
        IdentityContext actor = actor(jwt);
        if (!actor.permissions().contains("identity.manage_users")) {
            throw new IdentityAdminException("insufficient_scope", "Bạn không được phép thực hiện hành động này.", 403);
        }
        if (actor.membershipId().equals(membershipId)) {
            throw new IdentityAdminException(
                    "invalid_request",
                    "Không thể tự thay đổi quyền truy cập của phiên hiện tại.",
                    400
            );
        }
        return access.update(
                actor.tenantId(),
                membershipId,
                normalize(request == null ? null : request.roles()),
                normalize(request == null ? null : request.applications()),
                actor
        );
    }

    private IdentityContext actor(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new IdentityAdminException("invalid_token", "Bắt buộc có bearer access token.", 401);
        }
        UUID subject;
        try {
            subject = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException error) {
            throw new IdentityAdminException("invalid_token", "Token không có chủ thể hợp lệ.", 401);
        }
        UUID sid = uuid(TokenClaimReader.string(jwt, "qts_sid"));
        if (sid == null) {
            throw new IdentityAdminException("invalid_token", "Token không có phiên đăng nhập hợp lệ.", 401);
        }
        return identity.context(subject, tenantClaims.tenantId(jwt), sid);
    }

    private static List<String> normalize(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .sorted()
                .toList();
    }

    private static UUID uuid(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (RuntimeException error) {
            return null;
        }
    }
}
