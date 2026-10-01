package vn.qts.identitybridge.domain;

import java.util.Set;
import java.util.UUID;

public record ApplicationPolicy(
        UUID id,
        String clientId,
        String name,
        boolean active,
        UUID tenantId,
        Set<String> requiredPermissions
) {
}
