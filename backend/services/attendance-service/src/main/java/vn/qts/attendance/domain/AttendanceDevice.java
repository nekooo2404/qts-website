package vn.qts.attendance.domain;

import java.time.Instant;
import java.util.UUID;

public record AttendanceDevice(
        UUID id,
        UUID tenantId,
        String deviceCode,
        String kind,
        UUID branchId,
        byte[] publicKey,
        String keyAlg,
        String status,
        int version,
        Instant revokedAt,
        String revokeReason,
        Instant lastSeenAt,
        UUID lastSyncCursor,
        Instant clockAnchorServerTime,
        Instant createdAt
) {
    public boolean active() {
        return "active".equals(status);
    }
}
