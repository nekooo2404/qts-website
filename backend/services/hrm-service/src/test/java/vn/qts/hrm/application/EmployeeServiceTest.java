package vn.qts.hrm.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import vn.qts.hrm.domain.EmployeeDetail;
import vn.qts.hrm.domain.HrmException;
import vn.qts.hrm.domain.PageResult;
import vn.qts.hrm.infra.EmployeeRepository;

class EmployeeServiceTest {
    private EmployeeRepository repository;
    private EmployeeService service;
    private UUID tenantId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        repository = mock(EmployeeRepository.class);
        TenantContext tenantContext = new TenantContext();
        service = new EmployeeService(repository, tenantContext);
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
    }

    @Test
    void fullReadPermissionStaysTenantScoped() {
        Jwt jwt = jwt(List.of("hrm.employee.read"));
        EmployeeDetail detail = detail();
        when(repository.find(tenantId, employeeId)).thenReturn(detail);

        assertThat(service.detail(jwt, employeeId)).isEqualTo(detail);
    }

    @Test
    void employeeReadOwnCannotReadAnotherEmployee() {
        Jwt jwt = jwt(List.of("hrm.employee.read_own"));
        when(repository.employeeForSubject(tenantId, UUID.fromString(jwt.getSubject())))
                .thenReturn(UUID.randomUUID());

        assertThatThrownBy(() -> service.detail(jwt, employeeId))
                .isInstanceOf(HrmException.class)
                .extracting("code")
                .isEqualTo("PERMISSION_002");
    }

    @Test
    void listWithoutPermissionFailsClosed() {
        Jwt jwt = jwt(List.of());

        assertThatThrownBy(() -> service.list(jwt, "", null, "", "1", "25"))
                .isInstanceOf(HrmException.class)
                .extracting("status")
                .isEqualTo(403);
    }

    @Test
    void ownListReturnsOnlyLinkedEmployee() {
        Jwt jwt = jwt(List.of("hrm.employee.read_own"));
        UUID subject = UUID.fromString(jwt.getSubject());
        EmployeeDetail detail = detail();
        when(repository.employeeForSubject(tenantId, subject)).thenReturn(employeeId);
        when(repository.find(tenantId, employeeId)).thenReturn(detail);

        PageResult<?> result = service.list(jwt, "", null, "", "1", "25");

        assertThat(result.total()).isEqualTo(1);
        assertThat(result.items()).hasSize(1);
    }

    private EmployeeDetail detail() {
        return new EmployeeDetail(
                employeeId,
                "QTS-00001",
                "Nguyễn Văn A",
                "a@qtsgroup.vn",
                "Công nghệ",
                "Kỹ sư",
                "Quản lý",
                "active",
                "Đang làm việc",
                "full_time",
                LocalDate.of(2026, 1, 1),
                null,
                1
        );
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
