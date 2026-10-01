package vn.qts.hrm.application;

import java.util.List;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import vn.qts.hrm.domain.Branch;
import vn.qts.hrm.domain.Company;
import vn.qts.hrm.domain.Department;
import vn.qts.hrm.domain.Position;
import vn.qts.hrm.infra.EmployeeRepository;
import vn.qts.hrm.infra.OrganizationRepository;

@Service
public class OrganizationService {
    private static final String COMPANY_READ = "organization.company.read";
    private static final String BRANCH_READ = "organization.branch.read";
    private static final String DEPARTMENT_READ = "organization.department.read";
    private static final String POSITION_READ = "organization.position.read";

    private final OrganizationRepository organization;
    private final EmployeeRepository employees;
    private final TenantContext tenantContext;

    public OrganizationService(
            OrganizationRepository organization,
            EmployeeRepository employees,
            TenantContext tenantContext
    ) {
        this.organization = organization;
        this.employees = employees;
        this.tenantContext = tenantContext;
    }

    public List<Company> companies(Jwt jwt, String status, String page, String pageSize) {
        require(jwt, COMPANY_READ);
        return organization.companies(tenantContext.tenantId(jwt), status, page(page), pageSize(pageSize));
    }

    public List<Branch> branches(Jwt jwt, UUID companyId, String page, String pageSize) {
        require(jwt, BRANCH_READ);
        return organization.branches(tenantContext.tenantId(jwt), companyId, page(page), pageSize(pageSize));
    }

    public List<Department> departments(Jwt jwt, UUID companyId, UUID branchId, UUID parentId) {
        require(jwt, DEPARTMENT_READ);
        return employees.departments(tenantContext.tenantId(jwt), companyId, branchId, parentId);
    }

    public List<Position> positions(Jwt jwt, UUID departmentId, String title, String page, String pageSize) {
        require(jwt, POSITION_READ);
        return organization.positions(
                tenantContext.tenantId(jwt),
                departmentId,
                title,
                page(page),
                pageSize(pageSize)
        );
    }

    private void require(Jwt jwt, String permission) {
        if (jwt == null || !has(jwt, permission)) {
            throw new vn.qts.hrm.domain.HrmException(
                    "PERMISSION_001",
                    "Bạn không có quyền thực hiện thao tác này.",
                    403
            );
        }
    }

    private static boolean has(Jwt jwt, String permission) {
        Object raw = jwt.getClaims().get("permissions");
        if (raw instanceof Iterable<?> permissions) {
            for (Object value : permissions) {
                if (permission.equals(String.valueOf(value))) {
                    return true;
                }
            }
        }
        Object ext = jwt.getClaims().get("ext");
        if (ext instanceof java.util.Map<?, ?> map) {
            Object nested = map.get("permissions");
            if (nested instanceof Iterable<?> permissions) {
                for (Object value : permissions) {
                    if (permission.equals(String.valueOf(value))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static int page(String raw) {
        try {
            return Math.max(1, Math.min(1_000_000, Integer.parseInt(raw == null ? "" : raw.trim())));
        } catch (RuntimeException error) {
            return 1;
        }
    }

    private static int pageSize(String raw) {
        try {
            return Math.max(1, Math.min(100, Integer.parseInt(raw == null ? "" : raw.trim())));
        } catch (RuntimeException error) {
            return 25;
        }
    }
}
