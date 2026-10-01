package vn.qts.identityadmin.api;

import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import vn.qts.identityadmin.application.EnrollmentCompleteRequest;
import vn.qts.identityadmin.application.EnrollmentService;
import vn.qts.identityadmin.application.IdentityReadService;
import vn.qts.identityadmin.application.IdentitySessionAdminService;

@RestController
public class IdentityReadController {
    private final IdentityReadService identity;
    private final IdentitySessionAdminService sessionAdmin;
    private final EnrollmentService enrollment;

    public IdentityReadController(
            IdentityReadService identity,
            IdentitySessionAdminService sessionAdmin,
            EnrollmentService enrollment
    ) {
        this.identity = identity;
        this.sessionAdmin = sessionAdmin;
        this.enrollment = enrollment;
    }

    @GetMapping({"/oauth/userinfo", "/oauth/userinfo/"})
    public Map<String, Object> userinfo(@AuthenticationPrincipal Jwt jwt) {
        return identity.userinfo(jwt);
    }

    @GetMapping({"/oauth/csrf", "/oauth/csrf/"})
    public Map<String, Object> csrf() {
        return Map.of("csrfToken", BrowserCsrf.TOKEN);
    }

    @PostMapping({"/api/enrollment/complete", "/api/enrollment/complete/"})
    public Map<String, Object> completeEnrollment(
            @RequestBody(required = false) EnrollmentCompleteRequest body,
            HttpServletRequest request
    ) {
        BrowserCsrf.require(request);
        return enrollment.complete(body, request);
    }

    @GetMapping({"/api/session", "/api/session/"})
    public Map<String, Object> session(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return identity.session(jwt, request);
    }

    @GetMapping({"/api/launcher", "/api/launcher/"})
    public Map<String, Object> launcher(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return identity.launcher(jwt, request);
    }

    @GetMapping({"/api/portal-entitlements", "/api/portal-entitlements/"})
    public Map<String, Object> portalEntitlements(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return identity.portalEntitlements(jwt, request);
    }

    @GetMapping({"/api/sessions", "/api/sessions/"})
    public Map<String, Object> sessions(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return identity.sessions(jwt, request);
    }

    @DeleteMapping({"/api/sessions/{sessionId}", "/api/sessions/{sessionId}/"})
    public ResponseEntity<Void> revokeSession(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID sessionId,
            HttpServletRequest request
    ) {
        if (jwt == null) {
            BrowserCsrf.require(request);
        }
        sessionAdmin.revoke(sessionId, identity.currentContext(jwt, request));
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/api/console/security-overview", "/api/console/security-overview/"})
    public Map<String, Object> securityOverview(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return identity.securityOverview(jwt, request);
    }

    @GetMapping({"/api/console/audit-events", "/api/console/audit-events/"})
    public Map<String, Object> auditEvents(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return identity.auditEvents(jwt, request);
    }
}
