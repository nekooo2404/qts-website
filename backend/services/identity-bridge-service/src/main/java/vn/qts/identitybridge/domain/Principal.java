package vn.qts.identitybridge.domain;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record Principal(
        UUID userId,
        UUID oryId,
        UUID tenantId,
        UUID sessionId,
        String email,
        String displayName,
        boolean requireMfa,
        Instant authTime,
        Instant expiresAt,
        Set<String> permissions,
        List<String> amr
) {
}
