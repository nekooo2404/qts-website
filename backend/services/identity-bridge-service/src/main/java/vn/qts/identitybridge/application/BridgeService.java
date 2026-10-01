package vn.qts.identitybridge.application;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import vn.qts.identitybridge.config.IdentityBridgeProperties;
import vn.qts.identitybridge.domain.ApplicationPolicy;
import vn.qts.identitybridge.domain.BridgeException;
import vn.qts.identitybridge.domain.KratosSession;
import vn.qts.identitybridge.domain.Principal;
import vn.qts.identitybridge.infra.BridgeIdentityRepository;
import vn.qts.identitybridge.infra.OryGateway;

@Service
public class BridgeService {
    private static final Logger log = LoggerFactory.getLogger(BridgeService.class);
    private static final Set<String> ALLOWED_SCOPES = Set.of("openid", "profile", "email", "offline_access");

    private final OryGateway ory;
    private final BridgeIdentityRepository identity;
    private final IdentityBridgeProperties properties;
    private final ObjectMapper objectMapper;

    public BridgeService(
            OryGateway ory,
            BridgeIdentityRepository identity,
            IdentityBridgeProperties properties,
            ObjectMapper objectMapper
    ) {
        this.ory = ory;
        this.identity = identity;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public URI login(String challenge, HttpServletRequest request) {
        enabled();
        requireChallenge(challenge, "login");
        JsonNode pending;
        try {
            pending = ory.pending("login", challenge);
        } catch (BridgeException error) {
            if (staleBrowserChallenge(error)) {
                return launcherLogin();
            }
            throw error;
        }
        ApplicationPolicy application = application(pending.path("client").path("client_id").asText(""));
        QueryParameters requested = QueryParameters.from(pending.path("request_url").asText(""));
        boolean silent = requested.prompt().contains("none");
        KratosSession kratos = KratosSession.from(ory.resolveKratosSession(cookie(request)));
        String continuation = bridgeUrl("login", "login_challenge", challenge);
        if (kratos == null) {
            if (silent) {
                return hydraRedirect(ory.reject("login", challenge, objectMapper.createObjectNode()
                        .put("error", "login_required")));
            }
            return kratosLogin(continuation, false);
        }
        if (needsFreshAuthentication(requested, pending, kratos)) {
            if (silent) {
                return hydraRedirect(ory.reject("login", challenge, objectMapper.createObjectNode()
                        .put("error", "login_required")));
            }
            return kratosLogin(continuation, true);
        }
        Principal principal;
        try {
            principal = principal(kratos, request);
        } catch (BridgeException error) {
            if (recoverableBrowserSession(error)) {
                return kratosLogin(continuation, true);
            }
            throw error;
        }
        if (principal.requireMfa() && !kratos.meetsMfa()) {
            if (silent) {
                return hydraRedirect(ory.reject("login", challenge, objectMapper.createObjectNode()
                        .put("error", "interaction_required")));
            }
            return kratosAal2(continuation);
        }
        if (!identity.canAccess(principal, application)) {
            return hydraRedirect(ory.reject("login", challenge, objectMapper.createObjectNode()
                    .put("error", "access_denied")
                    .put("error_description", "Ứng dụng chưa được cấp quyền.")));
        }
        ObjectNode payload = objectMapper.createObjectNode()
                .put("subject", principal.oryId().toString())
                .put("remember", true)
                .put("remember_for", Math.max(1, Math.min(3600,
                        Math.max(1, ChronoUnit.SECONDS.between(Instant.now(), principal.expiresAt())))))
                .put("acr", kratos.assuranceLevel());
        payload.set("amr", objectMapper.valueToTree(principal.amr()));
        payload.set("context", objectMapper.createObjectNode().put("qts_sid", principal.sessionId().toString()));
        return hydraRedirect(ory.accept("login", challenge, payload));
    }

    public URI consent(String challenge, HttpServletRequest request) {
        enabled();
        requireChallenge(challenge, "consent");
        JsonNode pending;
        try {
            pending = ory.pending("consent", challenge);
        } catch (BridgeException error) {
            if (staleBrowserChallenge(error)) {
                return launcherLogin();
            }
            throw error;
        }
        ApplicationPolicy application = application(pending.path("client").path("client_id").asText(""));
        String continuation = bridgeUrl("consent", "consent_challenge", challenge);
        KratosSession kratos = KratosSession.from(ory.resolveKratosSession(cookie(request)));
        if (kratos == null) {
            return kratosLogin(continuation, false);
        }
        Principal principal;
        try {
            principal = principal(kratos, request);
        } catch (BridgeException error) {
            if (recoverableBrowserSession(error)) {
                return kratosLogin(continuation, true);
            }
            throw error;
        }
        if (principal.requireMfa() && !kratos.meetsMfa()) {
            return consentClientRedirect(ory.reject("consent", challenge, objectMapper.createObjectNode()
                    .put("error", "interaction_required")), pending, request);
        }
        if (!principal.oryId().toString().equals(pending.path("subject").asText(""))
                || !identity.canAccess(principal, application)) {
            return consentClientRedirect(ory.reject("consent", challenge, objectMapper.createObjectNode()
                    .put("error", "access_denied")), pending, request);
        }
        List<String> scopes = arrayText(pending.path("requested_scope"));
        if (!ALLOWED_SCOPES.containsAll(scopes)) {
            throw new BridgeException("invalid_scope", "Scope không được cấp.", 403);
        }
        boolean emailVerified = verifiedEmail(kratos.identity(), principal.email());
        ObjectNode idToken = objectMapper.createObjectNode()
                .put("acr", kratos.assuranceLevel())
                .put("email_verified", emailVerified);
        idToken.set("amr", objectMapper.valueToTree(principal.amr()));
        if (scopes.contains("email")) {
            idToken.put("email", principal.email());
        }
        if (scopes.contains("profile")) {
            idToken.put("name", principal.displayName());
        }
        ObjectNode accessClaims = objectMapper.createObjectNode()
                .put("qts_sid", principal.sessionId().toString())
                .put("qts_tenant", principal.tenantId().toString())
                .put("qts_client", application.clientId())
                .put("token_use", "access")
                .put("email_verified", emailVerified);
        accessClaims.set("permissions", objectMapper.valueToTree(principal.permissions()));
        ObjectNode session = objectMapper.createObjectNode();
        session.set("access_token", accessClaims);
        session.set("id_token", idToken);
        ObjectNode payload = objectMapper.createObjectNode()
                .set("grant_scope", objectMapper.valueToTree(scopes));
        payload.set("grant_access_token_audience", objectMapper.valueToTree(List.of(properties.apiAudienceOrDefault())));
        payload.put("remember", true);
        payload.put("remember_for", 3600);
        payload.set("session", session);
        identity.audit(principal.tenantId(), principal.userId(), "identity.application.authorized",
                application.id(), "{\"client\":\"" + application.clientId() + "\"}");
        return acceptedConsentClientRedirect(ory.accept("consent", challenge, payload), pending, request, application.clientId());
    }

    public URI logout(String challenge) {
        enabled();
        requireChallenge(challenge, "logout");
        ory.pending("logout", challenge);
        return URI.create(properties.webOriginOrEmpty().replaceAll("/+$", "")
                + "/sign-out?logout_challenge=" + encode(challenge));
    }

    public URI logoutAccept(String challenge, HttpServletRequest request) {
        enabled();
        requireChallenge(challenge, "logout");
        requireTrustedOrigin(request);
        BrowserCsrf.require(request);
        JsonNode pending = ory.pending("logout", challenge);
        UUID subject = uuid(pending.path("subject").asText(""));
        if (subject == null) {
            throw new BridgeException("server_error", "Phiên đăng xuất không có chủ thể hợp lệ.", 502);
        }
        KratosSession kratos = KratosSession.from(ory.resolveKratosSession(cookie(request)));
        if (kratos != null && !subject.equals(kratos.identityId())) {
            throw new BridgeException("access_denied", "Phiên đăng xuất không khớp.", 403);
        }
        identity.revokeSessions(subject);
        ory.revokeKratosSessions(subject);
        ory.revokeHydraConsentSessions(subject);
        return hydraRedirect(ory.accept("logout", challenge, objectMapper.createObjectNode()));
    }

    private Principal principal(KratosSession kratos, HttpServletRequest request) {
        JsonNode authoritative = ory.kratosIdentity(kratos.identityId());
        if (authoritative.path("metadata_admin").path("requires_enrollment").asBoolean(false)) {
            throw new BridgeException("enrollment_required",
                    "Tài khoản phải hoàn tất thiết lập bảo mật trước khi truy cập ứng dụng.", 403);
        }
        return identity.establish(
                kratos,
                request.getHeader("User-Agent"),
                request.getRemoteAddr()
        );
    }

    private ApplicationPolicy application(String clientId) {
        if (!properties.registeredClient(clientId)) {
            throw new BridgeException("unauthorized_client", "Ứng dụng chưa được phép đăng nhập.", 403);
        }
        return identity.application(clientId);
    }

    private URI hydraRedirect(JsonNode result) {
        String target = result == null ? "" : result.path("redirect_to").asText("");
        if (target.isBlank()) {
            throw new BridgeException("server_error", "Chuyển hướng định danh không hợp lệ.", 502);
        }
        URI redirect = URI.create(target);
        URI issuer = URI.create(properties.hydraIssuerBrowserUrlOrEmpty());
        if (!issuer.getScheme().equalsIgnoreCase(redirect.getScheme())
                || !issuer.getHost().equalsIgnoreCase(redirect.getHost())
                || issuer.getPort() != redirect.getPort()
                || redirect.getUserInfo() != null
                || redirect.getFragment() != null) {
            throw new BridgeException("server_error", "Chuyển hướng định danh không hợp lệ.", 502);
        }
        return redirect;
    }

    private URI consentClientRedirect(JsonNode result, JsonNode pending, HttpServletRequest request) {
        URI hydra = hydraRedirect(result);
        URI callback = ory.resolveHydraBrowserRedirect(hydra, request.getHeader("Cookie"));
        requireExpectedClientRedirect(callback, pending);
        return callback;
    }

    private URI acceptedConsentClientRedirect(JsonNode result, JsonNode pending, HttpServletRequest request, String clientId) {
        return hydraRedirect(result);
    }

    private void requireExpectedClientRedirect(URI callback, JsonNode pending) {
        String redirectUri = expectedClientRedirectUri(pending);
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new BridgeException("server_error", "Chuyá»ƒn hÆ°á»›ng á»©ng dá»¥ng khÃ´ng há»£p lá»‡.", 502);
        }
        URI expected = URI.create(redirectUri);
        if (callback.getUserInfo() != null
                || callback.getFragment() != null
                || !sameOrigin(callback, expected)
                || !String.valueOf(callback.getPath()).equals(String.valueOf(expected.getPath()))) {
            throw new BridgeException("server_error", "Chuyá»ƒn hÆ°á»›ng á»©ng dá»¥ng khÃ´ng há»£p lá»‡.", 502);
        }
    }

    private URI clientSsoRestart(JsonNode pending, String clientId) {
        String redirectUri = properties.registeredRedirectUri(clientId);
        if (redirectUri == null || redirectUri.isBlank()) {
            redirectUri = expectedClientRedirectUri(pending);
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new BridgeException("server_error", "Chuyá»ƒn hÆ°á»›ng á»©ng dá»¥ng khÃ´ng há»£p lá»‡.", 502);
        }
        URI redirect = URI.create(redirectUri);
        if (redirect.getScheme() == null
                || redirect.getHost() == null
                || redirect.getUserInfo() != null
                || redirect.getFragment() != null
                || (!"https".equalsIgnoreCase(redirect.getScheme())
                && !"http".equalsIgnoreCase(redirect.getScheme()))) {
            throw new BridgeException("server_error", "Chuyá»ƒn hÆ°á»›ng á»©ng dá»¥ng khÃ´ng há»£p lá»‡.", 502);
        }
        return UriComponentsBuilder.newInstance()
                .scheme(redirect.getScheme())
                .host(redirect.getHost())
                .port(redirect.getPort())
                .path("/")
                .queryParam("sso", "1")
                .build()
                .toUri();
    }

    private String expectedClientRedirectUri(JsonNode pending) {
        String requestUrl = pending.path("request_url").asText("");
        String redirectUri = requestedRedirectUri(requestUrl);
        if (redirectUri != null && !redirectUri.isBlank()) {
            return redirectUri;
        }
        String clientId = pending.path("client").path("client_id").asText("");
        if (clientId.isBlank()) {
            clientId = requestedClientId(requestUrl);
        }
        redirectUri = properties.registeredRedirectUri(clientId);
        if (redirectUri != null && !redirectUri.isBlank()) {
            return redirectUri;
        }
        JsonNode registered = pending.path("client").path("redirect_uris");
        if (registered.isArray()) {
            for (JsonNode item : registered) {
                if (item.isTextual() && !item.asText("").isBlank()) {
                    return item.asText("");
                }
            }
        }
        return "";
    }

    private String requestedRedirectUri(String requestUrl) {
        if (requestUrl == null || requestUrl.isBlank()) {
            return "";
        }
        return UriComponentsBuilder.fromUriString(requestUrl)
                .build()
                .getQueryParams()
                .getFirst("redirect_uri");
    }

    private String requestedClientId(String requestUrl) {
        if (requestUrl == null || requestUrl.isBlank()) {
            return "";
        }
        String clientId = UriComponentsBuilder.fromUriString(requestUrl)
                .build()
                .getQueryParams()
                .getFirst("client_id");
        return clientId == null ? "" : clientId;
    }

    private URI kratosLogin(String continuation, boolean refresh) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(properties.kratosBrowserUrlOrEmpty().replaceAll("/+$", "")
                        + "/self-service/login/browser")
                .queryParam("return_to", continuation);
        if (refresh) {
            builder.queryParam("refresh", "true");
        }
        return builder.build().encode().toUri();
    }

    private URI kratosAal2(String continuation) {
        return UriComponentsBuilder
                .fromUriString(properties.kratosBrowserUrlOrEmpty().replaceAll("/+$", "")
                        + "/self-service/login/browser")
                .queryParam("aal", "aal2")
                .queryParam("return_to", continuation)
                .build()
                .encode()
                .toUri();
    }

    private boolean needsFreshAuthentication(QueryParameters requested, JsonNode pending, KratosSession kratos) {
        boolean fresh = requested.prompt().contains("login") || "0".equals(requested.maxAge());
        Instant authenticated = kratos.authenticatedAt();
        Instant requestedAt = parseInstant(pending.path("requested_at").asText(""));
        String maxAge = requested.maxAge();
        if (!maxAge.isBlank()) {
            try {
                long seconds = Long.parseLong(maxAge);
                if (seconds < 0 || seconds > 31_536_000) {
                    throw new NumberFormatException();
                }
                if (seconds > 0 && (authenticated == null
                        || authenticated.isBefore(Instant.now().minusSeconds(seconds)))) {
                    return true;
                }
            } catch (NumberFormatException error) {
                throw new BridgeException("invalid_request", "Thời hạn xác thực không hợp lệ.", 400);
            }
        }
        return fresh && (authenticated == null || requestedAt == null || authenticated.isBefore(requestedAt));
    }

    private QueryParameters query(String url) {
        return QueryParameters.from(url);
    }

    private void enabled() {
        if (!properties.enabled()) {
            throw new BridgeException("not_found", "Không tìm thấy tài nguyên.", 404);
        }
        if (properties.webOriginOrEmpty().isBlank() || properties.hydraIssuerBrowserUrlOrEmpty().isBlank()
                || properties.kratosBrowserUrlOrEmpty().isBlank()) {
            throw new BridgeException("server_error", "Dịch vụ định danh chưa được cấu hình.", 503);
        }
    }

    private String cookie(HttpServletRequest request) {
        String header = request.getHeader("Cookie");
        if (header == null || header.isBlank()) {
            return null;
        }
        return extractCookie(header, properties.kratosSessionCookieOrDefault());
    }

    private static String extractCookie(String header, String configuredName) {
        String name = configuredName == null || configuredName.isBlank() ? "ory_kratos_session" : configuredName;
        for (String pair : header.split(";")) {
            String trimmed = pair.trim();
            if (trimmed.startsWith(name + "=")) {
                String value = trimmed.substring(name.length() + 1);
                if (!value.contains("\r") && !value.contains("\n") && !value.contains(";")) {
                    return value;
                }
            }
        }
        return null;
    }

    private String bridgeUrl(String name, String parameter, String value) {
        return properties.webOriginOrEmpty().replaceAll("/+$", "")
                + "/identity-api/oauth/ory/" + name + "?" + parameter + "=" + encode(value);
    }

    private URI launcherLogin() {
        String origin = properties.webOriginOrEmpty().replaceAll("/+$", "");
        return URI.create(origin + "/login?return_to=" + encode(origin + "/launcher"));
    }

    private static boolean staleBrowserChallenge(BridgeException error) {
        return "invalid_request".equals(error.code())
                || "invalid_token".equals(error.code())
                || "login_required".equals(error.code());
    }

    private static boolean recoverableBrowserSession(BridgeException error) {
        return "invalid_token".equals(error.code())
                || "login_required".equals(error.code());
    }

    private void requireTrustedOrigin(HttpServletRequest request) {
        String expected = properties.webOriginOrEmpty().replaceAll("/+$", "");
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");
        String actual = origin != null && !origin.isBlank()
                ? origin.replaceAll("/+$", "")
                : referer == null ? "" : referer.replaceAll("/+$", "");
        if (!actual.startsWith(expected) || (actual.length() > expected.length()
                && actual.charAt(expected.length()) != '/')) {
            throw new BridgeException("csrf_failed", "Yêu cầu không hợp lệ.", 403);
        }
    }

    private static void requireChallenge(String challenge, String kind) {
        if (challenge == null || challenge.isBlank() || challenge.length() > 8192) {
            throw new BridgeException("invalid_request", "Thiếu giao dịch xác thực hợp lệ cho " + kind + ".", 400);
        }
    }

    private static List<String> arrayText(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(item -> {
                if (item.isTextual() && !item.asText().isBlank()) {
                    values.add(item.asText());
                }
            });
        }
        return List.copyOf(values);
    }

    private static boolean verifiedEmail(JsonNode identity, String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        JsonNode addresses = identity.path("verifiable_addresses");
        if (!addresses.isArray()) {
            return false;
        }
        for (JsonNode address : addresses) {
            if (email.equalsIgnoreCase(address.path("value").asText(""))
                    && address.path("verified").asBoolean(false)) {
                return true;
            }
        }
        return false;
    }

    private static UUID uuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (RuntimeException error) {
            return null;
        }
    }

    private static Instant parseInstant(String value) {
        try {
            return value == null || value.isBlank() ? null : Instant.parse(value);
        } catch (RuntimeException error) {
            return null;
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static boolean sameOrigin(URI left, URI right) {
        return left.getScheme() != null
                && right.getScheme() != null
                && left.getScheme().equalsIgnoreCase(right.getScheme())
                && left.getHost() != null
                && right.getHost() != null
                && left.getHost().equalsIgnoreCase(right.getHost())
                && effectivePort(left) == effectivePort(right);
    }

    private static int effectivePort(URI uri) {
        if (uri.getPort() >= 0) {
            return uri.getPort();
        }
        String scheme = uri.getScheme();
        if ("https".equalsIgnoreCase(scheme)) {
            return 443;
        }
        if ("http".equalsIgnoreCase(scheme)) {
            return 80;
        }
        return -1;
    }

    private record QueryParameters(Set<String> prompt, String maxAge) {
        private static QueryParameters from(String url) {
            if (url == null || url.isBlank()) {
                return new QueryParameters(Set.of(), "");
            }
            var query = UriComponentsBuilder.fromUriString(url).build().getQueryParams();
            return new QueryParameters(
                    Set.copyOf(query.getOrDefault("prompt", List.of()).stream()
                            .flatMap(value -> List.of(value.split("\\s+")).stream())
                            .filter(value -> !value.isBlank())
                            .toList()),
                    query.getFirst("max_age") == null ? "" : query.getFirst("max_age")
            );
        }
    }
}
