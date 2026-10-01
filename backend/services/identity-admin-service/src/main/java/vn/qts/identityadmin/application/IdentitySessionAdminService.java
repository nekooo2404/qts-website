package vn.qts.identityadmin.application;

import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;
import vn.qts.identityadmin.infra.IdentityReadRepository;
import vn.qts.identityadmin.infra.IdentitySessionAdminRepository;
import vn.qts.identityadmin.security.TokenClaimReader;

@Service
public class IdentitySessionAdminService {
    private final IdentityReadRepository readRepository;
    private final IdentitySessionAdminRepository sessions;
    private final TenantClaims tenantClaims;

    public IdentitySessionAdminService(
            IdentityReadRepository readRepository,
            IdentitySessionAdminRepository sessions,
            TenantClaims tenantClaims
    ) {
        this.readRepository = readRepository;
        this.sessions = sessions;
        this.tenantClaims = tenantClaims;
    }

    public void revoke(UUID targetSessionId, Jwt jwt) {
        IdentityContext actor = context(jwt);
        revoke(targetSessionId, actor);
    }

    public void revoke(UUID targetSessionId, IdentityContext actor) {
        sessions.revoke(targetSessionId, actor, "remote_logout");
    }

    private IdentityContext context(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Bắt buộc có bearer access token.",
                    401
            );
        }
        UUID subject;
        try {
            subject = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException error) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Token không có chủ thể hợp lệ.",
                    401
            );
        }
        UUID sessionId = uuid(TokenClaimReader.string(jwt, "qts_sid"));
        if (sessionId == null) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Token không có phiên đăng nhập hợp lệ.",
                    401
            );
        }
        return readRepository.context(subject, tenantClaims.tenantId(jwt), sessionId);
    }

    private static UUID uuid(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (RuntimeException error) {
            return null;
        }
    }
}
