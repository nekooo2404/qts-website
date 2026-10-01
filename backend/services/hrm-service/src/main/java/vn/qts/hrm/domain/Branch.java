package vn.qts.hrm.domain;

import java.util.UUID;

public record Branch(
        UUID id,
        UUID companyId,
        String code,
        String name,
        String status,
        long version
) {
}
