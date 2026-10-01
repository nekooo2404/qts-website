package vn.qts.hrm.api;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import vn.qts.hrm.application.EmployeeService;
import vn.qts.hrm.domain.ApiEnvelope;
import vn.qts.hrm.domain.Branch;
import vn.qts.hrm.domain.Company;
import vn.qts.hrm.domain.Department;
import vn.qts.hrm.domain.EmployeeDetail;
import vn.qts.hrm.domain.EmployeeListItem;
import vn.qts.hrm.domain.PageResult;
import vn.qts.hrm.domain.Position;
import vn.qts.hrm.infra.EmployeeRepository;
import vn.qts.hrm.application.OrganizationService;

@RestController
public class HrmController {
    private final EmployeeService employees;
    private final OrganizationService organization;

    public HrmController(EmployeeService employees, OrganizationService organization) {
        this.employees = employees;
        this.organization = organization;
    }

    @GetMapping("/api/v1/employees")
    ApiEnvelope<List<EmployeeListItem>> listEmployees(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "departmentId", required = false) UUID departmentId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", required = false) String page,
            @RequestParam(name = "pageSize", required = false) String pageSize,
            HttpServletRequest request
    ) {
        PageResult<EmployeeListItem> result = employees.list(jwt, query, departmentId, status, page, pageSize);
        return ApiEnvelope.ok(result.items(), "", meta(result.page(), result.pageSize(), result.total(), request));
    }

    @GetMapping("/api/v1/employees/{employeeId}")
    ApiEnvelope<EmployeeDetail> employee(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID employeeId
    ) {
        return ApiEnvelope.ok(employees.detail(jwt, employeeId), "", Map.of());
    }

    @GetMapping("/api/v1/employees/{employeeId}/personal-details")
    ApiEnvelope<Map<String, Object>> personalDetails(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID employeeId
    ) {
        return ApiEnvelope.ok(employees.personalDetails(jwt, employeeId), "", Map.of());
    }

    @GetMapping("/api/v1/employees/{employeeId}/employment-records")
    ApiEnvelope<List<EmployeeRepository.EmploymentRecord>> employmentRecords(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID employeeId
    ) {
        return ApiEnvelope.ok(employees.employmentRecords(jwt, employeeId), "", Map.of());
    }

    @GetMapping("/api/v1/employees/{employeeId}/dependents")
    ApiEnvelope<List<EmployeeRepository.Dependent>> dependents(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID employeeId
    ) {
        return ApiEnvelope.ok(employees.dependents(jwt, employeeId), "", Map.of());
    }

    @GetMapping("/api/v1/employees/{employeeId}/emergency-contacts")
    ApiEnvelope<List<EmployeeRepository.EmergencyContact>> emergencyContacts(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID employeeId
    ) {
        return ApiEnvelope.ok(employees.emergencyContacts(jwt, employeeId), "", Map.of());
    }

    @GetMapping("/api/v1/organizations/departments")
    ApiEnvelope<List<Department>> departments(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "companyId", required = false) UUID companyId,
            @RequestParam(name = "branchId", required = false) UUID branchId,
            @RequestParam(name = "parentId", required = false) UUID parentId
    ) {
        return ApiEnvelope.ok(organization.departments(jwt, companyId, branchId, parentId), "", Map.of());
    }

    @GetMapping("/api/v1/organizations/companies")
    ApiEnvelope<List<Company>> companies(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", required = false) String page,
            @RequestParam(name = "pageSize", required = false) String pageSize,
            HttpServletRequest request
    ) {
        List<Company> result = organization.companies(jwt, status, page, pageSize);
        return ApiEnvelope.ok(result, "", Map.of("requestId", requestId(request)));
    }

    @GetMapping("/api/v1/organizations/branches")
    ApiEnvelope<List<Branch>> branches(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "companyId", required = false) UUID companyId,
            @RequestParam(name = "page", required = false) String page,
            @RequestParam(name = "pageSize", required = false) String pageSize,
            HttpServletRequest request
    ) {
        List<Branch> result = organization.branches(jwt, companyId, page, pageSize);
        return ApiEnvelope.ok(result, "", Map.of("requestId", requestId(request)));
    }

    @GetMapping("/api/v1/organizations/positions")
    ApiEnvelope<List<Position>> positions(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "departmentId", required = false) UUID departmentId,
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "page", required = false) String page,
            @RequestParam(name = "pageSize", required = false) String pageSize,
            HttpServletRequest request
    ) {
        List<Position> result = organization.positions(jwt, departmentId, title, page, pageSize);
        return ApiEnvelope.ok(result, "", Map.of("requestId", requestId(request)));
    }

    private static Map<String, Object> meta(int page, int pageSize, long total, HttpServletRequest request) {
        return Map.of(
                "page", page,
                "pageSize", pageSize,
                "total", total,
                "requestId", requestId(request)
        );
    }

    private static String requestId(HttpServletRequest request) {
        Object value = request.getAttribute(RequestIdFilter.ATTRIBUTE);
        return value == null ? "unknown" : value.toString();
    }
}
