package vn.qts.attendance.domain;

import java.util.Set;
import java.util.UUID;

public record AttendancePrincipal(
        UUID tenantId,
        UUID actorId,
        AttendanceDevice device,
        Set<String> permissions,
        boolean deviceAssertion
) {
    public boolean hasAny(String... required) {
        for (String permission : required) {
            if (permissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }
}
