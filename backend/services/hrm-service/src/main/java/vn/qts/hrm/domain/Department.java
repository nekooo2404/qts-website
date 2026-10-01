package vn.qts.hrm.domain;

import java.util.UUID;

public record Department(
        UUID id,
        String code,
        String name,
        UUID companyId,
        UUID branchId,
        UUID parentId,
        String status,
        long version
) {
}
