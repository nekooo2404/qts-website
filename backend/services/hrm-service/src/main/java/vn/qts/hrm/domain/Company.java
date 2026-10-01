package vn.qts.hrm.domain;

import java.util.UUID;

public record Company(
        UUID id,
        String code,
        String name,
        String status,
        long version
) {
}
