package vn.qts.hrm.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import vn.qts.hrm.domain.HrmException;
import vn.qts.hrm.infra.EmployeeRepository;
import vn.qts.hrm.infra.OrganizationRepository;

class OrganizationServiceTest {
    private OrganizationRepository organization;
    private EmployeeRepository employees;
    private OrganizationService service;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        organization = mock(OrganizationRepository.class);
        employees = mock(EmployeeRepository.class);
        tenantId = UUID.randomUUID();
        service = new OrganizationService(organization, employees, new TenantContext());
    }

    @Test
    void companyReadIsTenantScopedAndPermissionChecked() {
        Jwt jwt = jwt(List.of("organization.company.read"));
        service.companies(jwt, "active", "1", "25");

        verify(organization).companies(tenantId, "active", 1, 25);
    }

    @Test
    void missingPermissionFailsClosed() {
        Jwt jwt = jwt(List.of());

        assertThatThrownBy(() -> service.companies(jwt, "", "1", "25"))
                .isInstanceOf(HrmException.class)
                .extracting("status")
                .isEqualTo(403);
    }

    @Test
    void malformedPageValuesUseSafeDefaults() {
        Jwt jwt = jwt(List.of("organization.company.read"));

        service.companies(jwt, null, "not-a-number", "5000");

        verify(organization).companies(tenantId, null, 1, 100);
    }

    private Jwt jwt(List<String> permissions) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("sub", UUID.randomUUID().toString())
                .claim("qts_tenant", tenantId.toString())
                .claim("permissions", permissions)
                .issuedAt(java.time.Instant.now())
                .expiresAt(java.time.Instant.now().plusSeconds(600))
                .build();
    }
}
