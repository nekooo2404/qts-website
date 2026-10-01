package vn.qts.identityadmin.application;

import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import vn.qts.identityadmin.domain.UserListPage;
import vn.qts.identityadmin.infra.AdminUserRepository;

@Service
public class AdminUserService {
    private static final Set<String> STATUSES = Set.of("active", "disabled", "invited");

    private final AdminUserRepository users;

    public AdminUserService(AdminUserRepository users) {
        this.users = users;
    }

    public UserListPage list(UUID tenantId, String query, String status, String role, String page, String pageSize) {
        int safePage = parseInt(page, 1, 1, Integer.MAX_VALUE);
        int safePageSize = parseInt(pageSize, 20, 1, 100);
        String safeStatus = STATUSES.contains(blankToEmpty(status)) ? status.trim() : "";
        return users.list(
                tenantId,
                blankToEmpty(query).trim(),
                safeStatus,
                blankToEmpty(role).trim(),
                safePage,
                safePageSize
        );
    }

    private static int parseInt(String raw, int defaultValue, int min, int max) {
        try {
            int parsed = Integer.parseInt(blankToEmpty(raw).trim());
            return Math.max(min, Math.min(max, parsed));
        } catch (RuntimeException error) {
            return defaultValue;
        }
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value;
    }
}
