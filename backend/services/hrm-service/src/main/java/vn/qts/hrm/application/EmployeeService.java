package vn.qts.hrm.application;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import vn.qts.hrm.domain.EmployeeDetail;
import vn.qts.hrm.domain.EmployeeListItem;
import vn.qts.hrm.domain.HrmException;
import vn.qts.hrm.domain.PageResult;
import vn.qts.hrm.infra.EmployeeRepository;

@Service
public class EmployeeService {
    private static final String READ = "hrm.employee.read";
    private static final String READ_OWN = "hrm.employee.read_own";
    private static final String PERSONAL = "hrm.employee.field.personal";
    private static final String TAX = "hrm.employee.field.tax";

    private final EmployeeRepository employees;
    private final TenantContext tenantContext;

    public EmployeeService(EmployeeRepository employees, TenantContext tenantContext) {
        this.employees = employees;
        this.tenantContext = tenantContext;
    }

    public PageResult<EmployeeListItem> list(
            Jwt jwt,
            String query,
            UUID departmentId,
            String status,
            String page,
            String pageSize
    ) {
        UUID tenantId = tenantContext.tenantId(jwt);
        int safePage = parseInt(page, 1, 1, 1_000_000);
        int safePageSize = parseInt(pageSize, 25, 1, 100);
        String safeQuery = query == null ? "" : query.trim();
        String safeStatus = status == null ? "" : status.trim();
        if (has(jwt, READ)) {
            return employees.list(tenantId, safeQuery, departmentId, safeStatus, safePage, safePageSize);
        }
        if (!has(jwt, READ_OWN)) {
            throw forbidden();
        }
        UUID ownEmployeeId = employees.employeeForSubject(tenantId, tenantContext.subject(jwt));
        if (ownEmployeeId == null) {
            return new PageResult<>(List.of(), safePage, safePageSize, 0);
        }
        EmployeeDetail own = employees.find(tenantId, ownEmployeeId);
        if (own == null || !matches(own, safeQuery, safeStatus, departmentId)) {
            return new PageResult<>(List.of(), safePage, safePageSize, 0);
        }
        EmployeeListItem item = new EmployeeListItem(
                own.id(), own.employeeCode(), own.legalName(), own.workEmail(),
                own.departmentName(), own.jobTitle(), own.managerName(),
                own.employmentStatus(), own.employmentStatusLabel()
        );
        return new PageResult<>(List.of(item), 1, safePageSize, 1);
    }

    public EmployeeDetail detail(Jwt jwt, UUID employeeId) {
        UUID tenantId = tenantContext.tenantId(jwt);
        assertEmployeeAccess(jwt, tenantId, employeeId, READ, READ_OWN);
        EmployeeDetail detail = employees.find(tenantId, employeeId);
        if (detail == null) {
            throw new HrmException("NOT_FOUND_001", "Không tìm thấy hồ sơ nhân sự.", 404);
        }
        return detail;
    }

    public List<EmployeeRepository.EmploymentRecord> employmentRecords(Jwt jwt, UUID employeeId) {
        UUID tenantId = tenantContext.tenantId(jwt);
        assertEmployeeAccess(jwt, tenantId, employeeId, READ, READ_OWN);
        ensureExists(tenantId, employeeId);
        return employees.employmentRecords(tenantId, employeeId);
    }

    public List<EmployeeRepository.Dependent> dependents(Jwt jwt, UUID employeeId) {
        UUID tenantId = tenantContext.tenantId(jwt);
        assertEmployeeAccess(jwt, tenantId, employeeId, TAX, TAX);
        ensureExists(tenantId, employeeId);
        return employees.dependents(tenantId, employeeId);
    }

    public List<EmployeeRepository.EmergencyContact> emergencyContacts(Jwt jwt, UUID employeeId) {
        UUID tenantId = tenantContext.tenantId(jwt);
        assertEmployeeAccess(jwt, tenantId, employeeId, PERSONAL, PERSONAL);
        ensureExists(tenantId, employeeId);
        return employees.emergencyContacts(tenantId, employeeId);
    }

    public Map<String, Object> personalDetails(Jwt jwt, UUID employeeId) {
        UUID tenantId = tenantContext.tenantId(jwt);
        assertEmployeeAccess(jwt, tenantId, employeeId, PERSONAL, PERSONAL);
        EmployeeDetail detail = ensureExists(tenantId, employeeId);
        // Confidential columns are stored encrypted and are intentionally not
        // exposed until the field-decryption key is configured in the service.
        // Returning only non-confidential identity metadata is safer than
        // leaking ciphertext or pretending that UI masking is authorization.
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("employeeId", detail.id());
        response.put("legalName", detail.legalName());
        if (detail.workEmail() != null && !detail.workEmail().isBlank()) {
            response.put("workEmail", detail.workEmail());
        }
        return Map.copyOf(response);
    }

    public List<vn.qts.hrm.domain.Department> departments(
            Jwt jwt,
            UUID companyId,
            UUID branchId,
            UUID parentId
    ) {
        require(jwt, "organization.department.read");
        return employees.departments(tenantContext.tenantId(jwt), companyId, branchId, parentId);
    }

    private EmployeeDetail ensureExists(UUID tenantId, UUID employeeId) {
        EmployeeDetail detail = employees.find(tenantId, employeeId);
        if (detail == null) {
            throw new HrmException("NOT_FOUND_001", "Không tìm thấy hồ sơ nhân sự.", 404);
        }
        return detail;
    }

    private void assertEmployeeAccess(Jwt jwt, UUID tenantId, UUID employeeId, String fullPermission, String ownPermission) {
        if (has(jwt, fullPermission)) {
            return;
        }
        if (!has(jwt, ownPermission)) {
            throw forbidden();
        }
        UUID own = employees.employeeForSubject(tenantId, tenantContext.subject(jwt));
        if (own == null || !own.equals(employeeId)) {
            throw new HrmException("PERMISSION_002", "Bạn không có quyền truy cập hồ sơ này.", 403);
        }
    }

    private static boolean matches(EmployeeDetail detail, String query, String status, UUID departmentId) {
        boolean textMatch = query.isBlank()
                || detail.legalName().toLowerCase().contains(query.toLowerCase())
                || detail.employeeCode().toLowerCase().contains(query.toLowerCase())
                || (detail.workEmail() != null && detail.workEmail().toLowerCase().contains(query.toLowerCase()));
        boolean statusMatch = status.isBlank() || status.equals(detail.employmentStatus());
        // Department IDs are not included in the projected detail yet; own
        // scope cannot broaden into a department filter.
        return textMatch && statusMatch && departmentId == null;
    }

    private void require(Jwt jwt, String permission) {
        if (!has(jwt, permission)) {
            throw forbidden();
        }
    }

    private static boolean has(Jwt jwt, String permission) {
        if (jwt == null) {
            return false;
        }
        Object raw = jwt.getClaims().get("permissions");
        if (contains(raw, permission)) {
            return true;
        }
        Object ext = jwt.getClaims().get("ext");
        if (ext instanceof Map<?, ?> map && contains(map.get("permissions"), permission)) {
            return true;
        }
        return false;
    }

    private static boolean contains(Object raw, String expected) {
        if (raw instanceof Iterable<?> iterable) {
            for (Object value : iterable) {
                if (expected.equals(String.valueOf(value))) {
                    return true;
                }
            }
        }
        return false;
    }

    private static HrmException forbidden() {
        return new HrmException("PERMISSION_001", "Bạn không có quyền thực hiện thao tác này.", 403);
    }

    private static int parseInt(String raw, int fallback, int min, int max) {
        try {
            return Math.max(min, Math.min(max, Integer.parseInt(raw == null ? "" : raw.trim())));
        } catch (RuntimeException error) {
            return fallback;
        }
    }
}
