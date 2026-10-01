package vn.qts.identityadmin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import vn.qts.identityadmin.application.IdentitySessionAdminService;
import vn.qts.identityadmin.application.TenantClaims;
import vn.qts.identityadmin.domain.IdentityContext;
import vn.qts.identityadmin.infra.IdentityReadRepository;
import vn.qts.identityadmin.infra.IdentitySessionAdminRepository;

import static org.mockito.Mockito.mock;

class IdentitySessionAdminServiceTest {
    private IdentityReadRepository readRepository;
    private IdentitySessionAdminRepository sessionRepository;
    private IdentitySessionAdminService service;
    private UUID tenantId;
    private UUID userId;
    private UUID sessionId;
    private UUID oryId;

    @BeforeEach
    void setUp() {
        readRepository = mock(IdentityReadRepository.class);
        sessionRepository = mock(IdentitySessionAdminRepository.class);
        service = new IdentitySessionAdminService(
                readRepository,
                sessionRepository,
                new TenantClaims()
        );
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        oryId = UUID.randomUUID();
    }

    @Test
    void revokesSessionWithinTokenTenant() {
        whenContext();

        service.revoke(sessionId, jwt());

        verify(sessionRepository).revoke(
                eq(sessionId),
                any(IdentityContext.class),
                eq("remote_logout")
        );
    }

    private void whenContext() {
        org.mockito.Mockito.when(readRepository.context(oryId, tenantId, sessionId))
                .thenReturn(context());
    }

    private IdentityContext context() {
        return new IdentityContext(
                userId,
                oryId,
                tenantId,
                UUID.randomUUID(),
                "admin@qtsgroup.vn",
                "Admin",
                "qts",
                "QTS Global",
                true,
                true,
                List.of("admin"),
                Set.of("identity.manage_users"),
                null,
                "",
                sessionId,
                Instant.now().toString(),
                List.of("password")
        );
    }

    private Jwt jwt() {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", oryId.toString())
                .claim("qts_tenant", tenantId.toString())
                .claim("qts_sid", sessionId.toString())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
    }
}
