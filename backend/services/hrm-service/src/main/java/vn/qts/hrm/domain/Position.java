package vn.qts.hrm.domain;

import java.util.UUID;

public record Position(
        UUID id,
        UUID departmentId,
        UUID reportsToId,
        String code,
        String title,
        String status,
        long version
) {
}
