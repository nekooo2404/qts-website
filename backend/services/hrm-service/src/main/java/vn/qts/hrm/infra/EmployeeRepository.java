package vn.qts.hrm.infra;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.hrm.domain.Department;
import vn.qts.hrm.domain.EmployeeDetail;
import vn.qts.hrm.domain.EmployeeListItem;
import vn.qts.hrm.domain.PageResult;

@Repository
public class EmployeeRepository {
    private final JdbcTemplate jdbc;

    public EmployeeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PageResult<EmployeeListItem> list(
            UUID tenantId,
            String query,
            UUID departmentId,
            String status,
            int page,
            int pageSize
    ) {
        Where where = where(tenantId, query, departmentId, status);
        Long total = jdbc.queryForObject(
                "select count(*) from hrm.employees e " + where.sql(),
                Long.class,
                where.args().toArray()
        );
        long offset = (long) (page - 1) * pageSize;
        List<Object> rowsArgs = new ArrayList<>(where.args());
        rowsArgs.add(pageSize);
        rowsArgs.add(offset);
        List<EmployeeListItem> rows = jdbc.query(
                """
                select e.id, e.employee_code, e.legal_name, e.work_email,
                       d.name as department_name, p.title as job_title,
                       manager.legal_name as manager_name,
                       e.employment_status
                from hrm.employees e
                left join hrm.departments d on d.id = e.department_id
                left join hrm.positions p on p.id = e.position_id
                left join hrm.employees manager on manager.id = e.manager_employee_id
                """ + where.sql() + """
                order by e.legal_name asc, e.id asc
                limit ? offset ?
                """,
                this::mapListItem,
                rowsArgs.toArray()
        );
        return new PageResult<>(rows, page, pageSize, total == null ? 0 : total);
    }

    public EmployeeDetail find(UUID tenantId, UUID employeeId) {
        List<EmployeeDetail> rows = jdbc.query(
                """
                select e.id, e.employee_code, e.legal_name, e.work_email,
                       d.name as department_name, p.title as job_title,
                       manager.legal_name as manager_name,
                       e.employment_status, e.employment_type,
                       e.joining_date, e.resignation_date, e.version
                  from hrm.employees e
                  left join hrm.departments d on d.id = e.department_id
                  left join hrm.positions p on p.id = e.position_id
                  left join hrm.employees manager on manager.id = e.manager_employee_id
                 where e.tenant_id = ? and e.id = ? and e.active = true
                """,
                this::mapDetail,
                tenantId,
                employeeId
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public UUID employeeForSubject(UUID tenantId, UUID subject) {
        List<UUID> rows = jdbc.query(
                """
                select employee_id
                  from hrm.employee_identity_links
                 where tenant_id = ? and identity_subject = ? and status = 'active'
                """,
                (rs, ignored) -> rs.getObject("employee_id", UUID.class),
                tenantId,
                subject
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public List<Department> departments(UUID tenantId, UUID companyId, UUID branchId, UUID parentId) {
        StringBuilder sql = new StringBuilder("""
                select id, code, name, company_id, branch_id, parent_id, status, version
                  from hrm.departments
                 where tenant_id = ?
                """);
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        if (companyId != null) {
            sql.append(" and company_id = ?");
            args.add(companyId);
        }
        if (branchId != null) {
            sql.append(" and branch_id = ?");
            args.add(branchId);
        }
        if (parentId != null) {
            sql.append(" and parent_id = ?");
            args.add(parentId);
        }
        sql.append(" order by name, id");
        return jdbc.query(sql.toString(), (rs, ignored) -> new Department(
                rs.getObject("id", UUID.class),
                rs.getString("code"),
                rs.getString("name"),
                rs.getObject("company_id", UUID.class),
                rs.getObject("branch_id", UUID.class),
                rs.getObject("parent_id", UUID.class),
                rs.getString("status"),
                rs.getLong("version")
        ), args.toArray());
    }

    public List<EmploymentRecord> employmentRecords(UUID tenantId, UUID employeeId) {
        return jdbc.query(
                """
                select r.id, r.effective_from, r.effective_to, r.employment_status,
                       r.decision_number, d.name as department_name, p.title as job_title,
                       manager.legal_name as manager_name, r.version
                  from hrm.employment_records r
                  left join hrm.departments d on d.id = r.department_id
                  left join hrm.positions p on p.id = r.position_id
                  left join hrm.employees manager on manager.id = r.manager_employee_id
                 where r.tenant_id = ? and r.employee_id = ?
                 order by r.effective_from desc, r.id desc
                """,
                (rs, ignored) -> new EmploymentRecord(
                        rs.getObject("id", UUID.class),
                        rs.getObject("effective_from", Date.class).toLocalDate(),
                        date(rs, "effective_to"),
                        rs.getString("employment_status"),
                        rs.getString("decision_number"),
                        rs.getString("department_name"),
                        rs.getString("job_title"),
                        rs.getString("manager_name"),
                        rs.getLong("version")
                ),
                tenantId,
                employeeId
        );
    }

    public List<Dependent> dependents(UUID tenantId, UUID employeeId) {
        return jdbc.query(
                """
                select id, full_name, relationship, date_of_birth, tax_deductible
                  from hrm.employee_dependents
                 where tenant_id = ? and employee_id = ? and status = 'active'
                 order by full_name, id
                """,
                (rs, ignored) -> new Dependent(
                        rs.getObject("id", UUID.class),
                        rs.getString("full_name"),
                        rs.getString("relationship"),
                        date(rs, "date_of_birth"),
                        rs.getBoolean("tax_deductible")
                ),
                tenantId,
                employeeId
        );
    }

    public List<EmergencyContact> emergencyContacts(UUID tenantId, UUID employeeId) {
        return jdbc.query(
                """
                select id, full_name, relationship, is_primary
                  from hrm.employee_emergency_contacts
                 where tenant_id = ? and employee_id = ? and status = 'active'
                 order by is_primary desc, full_name, id
                """,
                (rs, ignored) -> new EmergencyContact(
                        rs.getObject("id", UUID.class),
                        rs.getString("full_name"),
                        rs.getString("relationship"),
                        rs.getBoolean("is_primary")
                ),
                tenantId,
                employeeId
        );
    }

    private Where where(UUID tenantId, String query, UUID departmentId, String status) {
        StringBuilder sql = new StringBuilder("""
                 where e.tenant_id = ? and e.active = true
                """);
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        if (!query.isBlank()) {
            sql.append(" and (lower(e.legal_name) like ? or lower(e.employee_code) like ? or lower(coalesce(e.work_email, '')) like ?)");
            String pattern = "%" + query.toLowerCase() + "%";
            args.add(pattern);
            args.add(pattern);
            args.add(pattern);
        }
        if (departmentId != null) {
            sql.append(" and e.department_id = ?");
            args.add(departmentId);
        }
        if (!status.isBlank()) {
            sql.append(" and e.employment_status = ?");
            args.add(status);
        }
        return new Where(sql.toString(), args);
    }

    private EmployeeListItem mapListItem(ResultSet rs, int ignored) throws SQLException {
        String status = rs.getString("employment_status");
        return new EmployeeListItem(
                rs.getObject("id", UUID.class),
                rs.getString("employee_code"),
                rs.getString("legal_name"),
                rs.getString("work_email"),
                rs.getString("department_name"),
                rs.getString("job_title"),
                rs.getString("manager_name"),
                status,
                statusLabel(status)
        );
    }

    private EmployeeDetail mapDetail(ResultSet rs, int ignored) throws SQLException {
        String status = rs.getString("employment_status");
        return new EmployeeDetail(
                rs.getObject("id", UUID.class),
                rs.getString("employee_code"),
                rs.getString("legal_name"),
                rs.getString("work_email"),
                rs.getString("department_name"),
                rs.getString("job_title"),
                rs.getString("manager_name"),
                status,
                statusLabel(status),
                rs.getString("employment_type"),
                date(rs, "joining_date"),
                date(rs, "resignation_date"),
                rs.getLong("version")
        );
    }

    private static LocalDate date(ResultSet rs, String column) throws SQLException {
        Date value = rs.getDate(column);
        return value == null ? null : value.toLocalDate();
    }

    private static String statusLabel(String status) {
        return switch (status == null ? "" : status) {
            case "pending" -> "Chờ nhận việc";
            case "probation" -> "Thử việc";
            case "active" -> "Đang làm việc";
            case "suspended" -> "Tạm hoãn hợp đồng";
            case "maternity" -> "Nghỉ thai sản";
            case "unpaid_leave" -> "Nghỉ không lương";
            case "resigned" -> "Nghỉ việc";
            default -> status == null ? "" : status;
        };
    }

    public record EmploymentRecord(
            UUID id,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            String employmentStatus,
            String decisionNumber,
            String departmentName,
            String jobTitle,
            String managerName,
            long version
    ) {
    }

    public record Dependent(
            UUID id,
            String name,
            String relationship,
            LocalDate dateOfBirth,
            boolean taxDeductible
    ) {
    }

    public record EmergencyContact(
            UUID id,
            String name,
            String relationship,
            boolean primary
    ) {
    }

    private record Where(String sql, List<Object> args) {
    }
}
