package vn.qts.identityadmin.application;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import vn.qts.identityadmin.config.SecurityProperties;
import vn.qts.identityadmin.config.OrySessionProperties;
import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.IdentityContext;
import vn.qts.identityadmin.domain.KratosBrowserSession;
import vn.qts.identityadmin.infra.IdentityReadRepository;
import vn.qts.identityadmin.infra.OrySessionGateway;
import vn.qts.identityadmin.security.TokenClaimReader;

@Service
public class IdentityReadService {
    private final IdentityReadRepository repository;
    private final TenantClaims tenantClaims;
    private final OrySessionGateway orySessionGateway;
    private final OrySessionProperties orySessionProperties;
    private final SecurityProperties securityProperties;

    public IdentityReadService(
            IdentityReadRepository repository,
            TenantClaims tenantClaims,
            OrySessionGateway orySessionGateway,
            OrySessionProperties orySessionProperties,
            SecurityProperties securityProperties
    ) {
        this.repository = repository;
        this.tenantClaims = tenantClaims;
        this.orySessionGateway = orySessionGateway;
        this.orySessionProperties = orySessionProperties;
        this.securityProperties = securityProperties;
    }

    public Map<String, Object> userinfo(Jwt jwt) {
        IdentityContext context = context(jwt);
        Map<String, Object> response = new HashMap<>();
        response.put("sub", context.oryId());
        response.put("tid", context.tenantId());
        response.put("tenant", context.tenantName());
        response.put("roles", context.roles());
        response.put("permissions", sortedPermissions(context));
        response.put("data_scope", dataScope(context.roles()));
        response.put("sid", context.sessionId() == null ? safe(TokenClaimReader.string(jwt, "qts_sid")) : context.sessionId());
        if (scope(jwt, "email")) {
            response.put("email", context.email());
            response.put("email_verified", TokenClaimReader.bool(jwt, "email_verified"));
        }
        if (scope(jwt, "profile")) {
            response.put("name", context.displayName());
        }
        if (context.employeeId() != null) {
            response.put("employee_id", context.employeeId());
            response.put("employee_code", context.employeeCode());
        }
        return Map.copyOf(response);
    }

    public Map<String, Object> session(Jwt jwt) {
        IdentityContext context = context(jwt);
        return sessionResponse(context, safe(TokenClaimReader.string(jwt, "qts_sid")));
    }

    public Map<String, Object> session(Jwt jwt, HttpServletRequest request) {
        IdentityContext context = currentContext(jwt, request);
        return sessionResponse(context, jwt == null ? "" : safe(TokenClaimReader.string(jwt, "qts_sid")));
    }

    public Map<String, Object> launcher(Jwt jwt) {
        IdentityContext context = context(jwt);
        return launcher(context);
    }

    public Map<String, Object> launcher(Jwt jwt, HttpServletRequest request) {
        IdentityContext context = currentContext(jwt, request);
        return launcher(context);
    }

    public Map<String, Object> portalEntitlements(Jwt jwt) {
        IdentityContext context = context(jwt);
        return portalEntitlements(context);
    }

    public Map<String, Object> portalEntitlements(Jwt jwt, HttpServletRequest request) {
        IdentityContext context = currentContext(jwt, request);
        return portalEntitlements(context);
    }

    public Map<String, Object> sessions(Jwt jwt) {
        IdentityContext context = context(jwt);
        return sessions(context);
    }

    public Map<String, Object> sessions(Jwt jwt, HttpServletRequest request) {
        IdentityContext context = currentContext(jwt, request);
        return sessions(context);
    }

    public Map<String, Object> securityOverview(Jwt jwt) {
        IdentityContext context = context(jwt);
        return securityOverview(context);
    }

    public Map<String, Object> securityOverview(Jwt jwt, HttpServletRequest request) {
        IdentityContext context = currentContext(jwt, request);
        return securityOverview(context);
    }

    public Map<String, Object> auditEvents(Jwt jwt) {
        IdentityContext context = context(jwt);
        return auditEvents(context);
    }

    public Map<String, Object> auditEvents(Jwt jwt, HttpServletRequest request) {
        IdentityContext context = currentContext(jwt, request);
        return auditEvents(context);
    }

    public IdentityContext currentContext(Jwt jwt, HttpServletRequest request) {
        if (jwt != null && jwt.getSubject() != null) {
            return context(jwt);
        }
        KratosBrowserSession kratos = KratosBrowserSession.from(
                orySessionGateway.whoami(cookie(request, orySessionProperties.kratosSessionCookieOrDefault()))
        );
        if (kratos == null) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
                    401
            );
        }
        return repository.contextFromKratosSession(
                kratos,
                header(request, "User-Agent"),
                TrustedClientAddress.resolve(request, securityProperties.trustedProxyCidrsOrDefault())
        );
    }

    private Map<String, Object> sessionResponse(IdentityContext context, String fallbackSessionId) {
        return Map.of(
                "authenticated", true,
                "user", Map.of("id", context.userId(), "email", context.email(), "name", context.displayName()),
                "tenant", Map.of("id", context.tenantId(), "slug", context.tenantSlug(), "name", context.tenantName()),
                "session", Map.of(
                        "id", context.sessionId() == null ? fallbackSessionId : context.sessionId(),
                        "auth_time", context.authTime(),
                        "amr", context.authenticationMethods()
                ),
                "roles", context.roles(),
                "permissions", sortedPermissions(context)
        );
    }

    private Map<String, Object> launcher(IdentityContext context) {
        return Map.of("applications", repository.launcher(context));
    }

    private Map<String, Object> portalEntitlements(IdentityContext context) {
        if (!repository.canAccessApplication(context, "qts-portal")) {
            throw new IdentityAdminException("access_denied", "Bạn chưa được cấp quyền truy cập Cổng thông tin.", 403);
        }
        Map<String, Boolean> modules = new java.util.LinkedHashMap<>();
        modules.put("Dashboard", context.permissions().contains("portal.view_dashboard"));
        modules.put("Projects", context.permissions().contains("portal.view_projects"));
        modules.put("CRM", context.permissions().contains("crm.view_customer"));
        modules.put("HR", context.permissions().contains("hr.view_people"));
        modules.put("Finance", context.permissions().contains("finance.view_invoice"));
        modules.put("Developer", context.permissions().contains("developer.view_logs"));
        modules.put("Analytics", context.permissions().contains("analytics.view_reports"));
        modules.put("Settings", context.permissions().contains("identity.view_console"));
        return Map.of(
                "modules", modules,
                "manage", Map.of("Settings", context.permissions().contains("identity.manage_users")),
                "roles", context.roles()
        );
    }

    private Map<String, Object> sessions(IdentityContext context) {
        return Map.of("sessions", repository.sessions(context));
    }

    private Map<String, Object> securityOverview(IdentityContext context) {
        require(context, "identity.view_console");
        return repository.securityOverview(context.tenantId());
    }

    private Map<String, Object> auditEvents(IdentityContext context) {
        require(context, "identity.view_audit");
        return Map.of("events", repository.auditEvents(context.tenantId()));
    }

    private IdentityContext context(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new IdentityAdminException("invalid_token", "Bắt buộc có bearer access token.", 401);
        }
        UUID tenant = tenantClaims.tenantId(jwt);
        UUID subject;
        try {
            subject = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException error) {
            throw new IdentityAdminException("invalid_token", "Token không có chủ thể hợp lệ.", 401);
        }
        UUID sid = uuid(TokenClaimReader.string(jwt, "qts_sid"));
        if (sid == null) {
            throw new IdentityAdminException("invalid_token", "Token không có phiên đăng nhập hợp lệ.", 401);
        }
        return repository.context(subject, tenant, sid);
    }

    private static void require(IdentityContext context, String permission) {
        if (!context.permissions().contains(permission)) {
            throw new IdentityAdminException("insufficient_scope", "Bạn không được phép thực hiện hành động này.", 403);
        }
    }

    private static boolean scope(Jwt jwt, String expected) {
        String scope = jwt.getClaimAsString("scope");
        if (scope == null) {
            return false;
        }
        for (String value : scope.split("\\s+")) {
            if (expected.equals(value)) {
                return true;
            }
        }
        return false;
    }

    private static String dataScope(List<String> roles) {
        if (roles.size() == 1 && roles.contains("employee")) {
            return "self";
        }
        if (roles.size() == 1 && roles.contains("manager")) {
            return "manager";
        }
        return "company";
    }

    private static List<String> sortedPermissions(IdentityContext context) {
        List<String> permissions = new ArrayList<>(context.permissions());
        Collections.sort(permissions);
        return List.copyOf(permissions);
    }

    private static UUID uuid(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (RuntimeException error) {
            return null;
        }
    }

    private static String cookie(HttpServletRequest request, String name) {
        if (request == null || request.getCookies() == null) {
            return "";
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return "";
    }

    private static String header(HttpServletRequest request, String name) {
        return request == null ? "" : safe(request.getHeader(name));
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}
