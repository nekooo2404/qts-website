package vn.qts.identityadmin.api;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.qts.identityadmin.application.AdminUserService;
import vn.qts.identityadmin.application.MembershipAccessService;
import vn.qts.identityadmin.application.TenantClaims;
import vn.qts.identityadmin.application.UpdateMembershipAccessRequest;
import vn.qts.identityadmin.domain.AdminUser;
import vn.qts.identityadmin.domain.UserListPage;

@RestController
public class AdminUsersController {
    private final AdminUserService users;
    private final MembershipAccessService access;
    private final TenantClaims tenantClaims;

    public AdminUsersController(
            AdminUserService users,
            MembershipAccessService access,
            TenantClaims tenantClaims
    ) {
        this.users = users;
        this.access = access;
        this.tenantClaims = tenantClaims;
    }

    @GetMapping({
            "/api/v1/identity/api/admin/users",
            "/api/v1/identity/api/admin/users/",
            "/api/admin/users",
            "/api/admin/users/"
    })
    public UserListPage list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "page", required = false) String page,
            @RequestParam(name = "page_size", required = false) String pageSize
    ) {
        UUID tenantId = tenantClaims.tenantId(jwt);
        return users.list(tenantId, query, status, role, page, pageSize);
    }

    @PatchMapping({
            "/api/v1/identity/api/admin/users/{membershipId}/access",
            "/api/v1/identity/api/admin/users/{membershipId}/access/",
            "/api/admin/users/{membershipId}/access",
            "/api/admin/users/{membershipId}/access/"
    })
    public AdminUser updateAccess(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID membershipId,
            @RequestBody(required = false) UpdateMembershipAccessRequest request
    ) {
        return access.update(membershipId, request, jwt);
    }
}
