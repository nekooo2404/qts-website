package vn.qts.hrm.domain;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EmployeeListItem(
        UUID id,
        @JsonProperty("employeeCode") String employeeCode,
        @JsonProperty("legalName") String legalName,
        @JsonProperty("workEmail") String workEmail,
        @JsonProperty("departmentName") String departmentName,
        @JsonProperty("jobTitle") String jobTitle,
        @JsonProperty("managerName") String managerName,
        @JsonProperty("employmentStatus") String employmentStatus,
        @JsonProperty("employmentStatusLabel") String employmentStatusLabel
) {
}
