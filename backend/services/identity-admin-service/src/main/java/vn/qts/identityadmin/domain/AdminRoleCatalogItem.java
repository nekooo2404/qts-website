package vn.qts.identityadmin.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminRoleCatalogItem(
        UUID id,
        String code,
        String name,
        String description,
        boolean system,
        List<String> permissions,
        int members,
        Instant createdAt
) {
}
