package vn.qts.identityadmin.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminApplicationCatalogItem(
        UUID id,
        String slug,
        String name,
        String description,
        String clientId,
        String type,
        String icon,
        boolean active,
        List<String> requiredPermissions,
        List<String> redirectUris,
        int assignments,
        Instant createdAt
) {
}
