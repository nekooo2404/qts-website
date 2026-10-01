package vn.qts.identityadmin.domain;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record IdentityContext(
        UUID userId,
        UUID oryId,
        UUID tenantId,
        UUID membershipId,
        String email,
        String displayName,
        String tenantSlug,
        String tenantName,
        boolean userActive,
        boolean membershipActive,
        List<String> roles,
        Set<String> permissions,
        UUID employeeId,
        String employeeCode,
        UUID sessionId,
        String authTime,
        List<String> authenticationMethods
) {
}
