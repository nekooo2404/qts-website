package vn.qts.hrm.domain;

import java.time.LocalDate;
import java.util.UUID;

public record EmployeeDetail(
        UUID id,
        String employeeCode,
        String legalName,
        String workEmail,
        String departmentName,
        String jobTitle,
        String managerName,
        String employmentStatus,
        String employmentStatusLabel,
        String employmentType,
        LocalDate joiningDate,
        LocalDate resignationDate,
        long version
) {
}
