package vn.qts.attendance.infra;

import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class EmployeeLinkResolver {
    private final JdbcTemplate jdbc;

    public EmployeeLinkResolver(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UUID> resolve(UUID tenantId, String employeeRef) {
        try {
            if (employeeRef.startsWith("badge:")) {
                String code = employeeRef.substring("badge:".length());
                if (code.isBlank()) {
                    return Optional.empty();
                }
                return jdbc.query(
                        """
                        select id as employee_id
                          from hrm.employees
                         where tenant_id = ? and employee_code = ?
                           and employment_status = 'active' and active = true
                         limit 1
                        """,
                        (rs, rowNum) -> rs.getObject("employee_id", UUID.class),
                        tenantId,
                        code
                ).stream().findFirst();
            }
            if (employeeRef.startsWith("employee:")) {
                UUID employeeId;
                try {
                    employeeId = UUID.fromString(employeeRef.substring("employee:".length()));
                } catch (IllegalArgumentException error) {
                    return Optional.empty();
                }
                return jdbc.query(
                        """
                        select id as employee_id
                          from hrm.employees
                         where tenant_id = ? and id = ?
                           and employment_status = 'active' and active = true
                         limit 1
                        """,
                        (rs, rowNum) -> rs.getObject("employee_id", UUID.class),
                        tenantId,
                        employeeId
                ).stream().findFirst();
            }
            return Optional.empty();
        } catch (DataAccessException missingOptionalTable) {
            // During the migration window HRM may still own this read model.
            return Optional.empty();
        }
    }
}
