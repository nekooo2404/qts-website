package vn.qts.identityadmin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import vn.qts.identityadmin.application.IdentityReadService;
import vn.qts.identityadmin.application.TenantClaims;
import vn.qts.identityadmin.config.OrySessionProperties;
import vn.qts.identityadmin.config.SecurityProperties;
import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;
import vn.qts.identityadmin.infra.IdentityReadRepository;
import vn.qts.identityadmin.infra.OrySessionGateway;

class IdentityReadServiceTest {
    private IdentityReadRepository repository;
    private IdentityReadService service;
    private UUID tenantId;
    private UUID oryId;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        repository = mock(IdentityReadRepository.class);
        service = new IdentityReadService(
                repository,
                new TenantClaims(),
                mock(OrySessionGateway.class),
                new OrySessionProperties("http://kratos:4433", "http://kratos:4434", "ory_kratos_session"),
                new SecurityProperties(true, null, null, null, null, null)
        );
        tenantId = UUID.randomUUID();
        oryId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @Test
    void userinfoReturnsOnlyRequestedProfileClaims() {
        IdentityContext context = context();
        when(repository.context(oryId, tenantId, sessionId)).thenReturn(context);

        var result = service.userinfo(jwt("openid email profile", List.of()));

        assertThat(result)
                .containsEntry("sub", oryId)
                .containsEntry("email", "employee@qtsgroup.vn")
                .containsEntry("name", "Employee")
                .containsEntry("employee_code", "QTS-00001");
    }

    @Test
    void portalEntitlementsRequiresAssignment() {
        IdentityContext context = context();
        when(repository.context(oryId, tenantId, sessionId)).thenReturn(context);
        when(repository.canAccessApplication(context, "qts-portal")).thenReturn(false);

        assertThatThrownBy(() -> service.portalEntitlements(jwt("openid", List.of())))
                .isInstanceOf(IdentityAdminException.class)
                .extracting("status")
                .isEqualTo(403);
    }

    private IdentityContext context() {
        return new IdentityContext(
                UUID.randomUUID(),
                oryId,
                tenantId,
                UUID.randomUUID(),
                "employee@qtsgroup.vn",
                "Employee",
                "qts",
                "QTS Global",
                true,
                true,
                List.of("employee"),
                Set.of("portal.view_dashboard"),
                UUID.randomUUID(),
                "QTS-00001",
                sessionId,
                "",
                List.of("password")
        );
    }

    private Jwt jwt(String scope, List<String> permissions) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", oryId.toString())
                .claim("qts_tenant", tenantId.toString())
                .claim("qts_sid", sessionId.toString())
                .claim("scope", scope)
                .claim("permissions", permissions)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
    }
}
