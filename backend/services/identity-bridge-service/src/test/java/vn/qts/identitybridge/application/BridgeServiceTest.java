package vn.qts.identitybridge.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import vn.qts.identitybridge.config.IdentityBridgeProperties;
import vn.qts.identitybridge.domain.ApplicationPolicy;
import vn.qts.identitybridge.domain.BridgeException;
import vn.qts.identitybridge.domain.KratosSession;
import vn.qts.identitybridge.domain.Principal;
import vn.qts.identitybridge.infra.BridgeIdentityRepository;
import vn.qts.identitybridge.infra.OryGateway;

class BridgeServiceTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private OryGateway ory;
    private BridgeIdentityRepository identity;
    private BridgeService service;
    private IdentityBridgeProperties properties;

    @BeforeEach
    void setUp() {
        ory = org.mockito.Mockito.mock(OryGateway.class);
        identity = org.mockito.Mockito.mock(BridgeIdentityRepository.class);
        properties = new IdentityBridgeProperties(
                true,
                "https://sso.test",
                "https://hydra.test/",
                "http://hydra:4444",
                "http://hydra:4445",
                "https://sso.test/kratos",
                "http://kratos:4433",
                "http://kratos:4434",
                "qts-api",
                "ory_kratos_session",
                "qts-portal",
                "qts-hrm",
                "https://portal.test/auth/callback",
                "https://hrm.test/auth/callback"
        );
        service = new BridgeService(ory, identity, properties, mapper);
    }

    @Test
    void redirectsUnauthenticatedBrowserToKratos() {
        JsonNode pending = mapper.createObjectNode()
                .set("client", mapper.createObjectNode().put("client_id", "qts-portal"));
        when(ory.pending("login", "challenge")).thenReturn(pending);
        when(identity.application("qts-portal")).thenReturn(application());
        when(ory.resolveKratosSession(null)).thenReturn(null);

        URIResult result = URIResult.of(service.login("challenge", request(null, null)));

        assertThat(result.value()).startsWith("https://sso.test/kratos/self-service/login/browser");
        assertThat(result.value()).contains("return_to=");
        verify(ory).pending("login", "challenge");
    }

    @Test
    void redirectsStaleLoginChallengeToLauncherLogin() {
        when(ory.pending("login", "challenge"))
                .thenThrow(new BridgeException("invalid_token", "Phiên đăng nhập không hợp lệ.", 401));

        URIResult result = URIResult.of(service.login("challenge", request(null, null)));

        assertThat(result.value()).startsWith("https://sso.test/login?return_to=");
        assertThat(result.value()).contains("launcher");
    }

    @Test
    void redirectsUnboundKratosSessionToFreshLogin() {
        JsonNode pending = mapper.createObjectNode()
                .set("client", mapper.createObjectNode().put("client_id", "qts-portal"));
        KratosSession kratos = kratos();
        ObjectNode kratosSession = mapper.createObjectNode()
                .put("active", true)
                .put("id", kratos.id().toString())
                .put("expires_at", kratos.expiresAt().toString())
                .put("authenticated_at", kratos.authenticatedAt().toString())
                .put("authenticator_assurance_level", "aal1");
        kratosSession.set("identity", kratos.identity());
        kratosSession.set("authentication_methods", mapper.createArrayNode().addObject().put("method", "password"));
        when(ory.pending("login", "challenge")).thenReturn(pending);
        when(ory.resolveKratosSession("session-value")).thenReturn(kratosSession);
        when(ory.kratosIdentity(kratos.identityId())).thenReturn(mapper.createObjectNode());
        when(identity.application("qts-portal")).thenReturn(application());
        when(identity.establish(any(KratosSession.class), any(), any()))
                .thenThrow(new BridgeException("invalid_token", "Không có người dùng tương ứng với phiên đăng nhập.", 401));

        URIResult result = URIResult.of(service.login("challenge", request("session-value", null)));

        assertThat(result.value()).startsWith("https://sso.test/kratos/self-service/login/browser");
        assertThat(result.value()).contains("refresh=true");
        assertThat(result.value()).contains("return_to=");
    }

    @Test
    void acceptsLoginWithExistingKratosSessionAndBoundAssignment() {
        JsonNode pending = mapper.createObjectNode()
                .set("client", mapper.createObjectNode().put("client_id", "qts-portal"));
        KratosSession kratos = kratos();
        Principal principal = principal();
        ApplicationPolicy application = application();
        JsonNode accepted = mapper.createObjectNode().put("redirect_to", "https://hydra.test/oauth2/auth?code=abc");
        ObjectNode kratosSession = mapper.createObjectNode()
                .put("active", true)
                .put("id", kratos.id().toString())
                .put("expires_at", kratos.expiresAt().toString())
                .put("authenticated_at", kratos.authenticatedAt().toString())
                .put("authenticator_assurance_level", "aal1");
        kratosSession.set("identity", kratos.identity());
        kratosSession.set("authentication_methods", mapper.createArrayNode().addObject().put("method", "password"));
        when(ory.pending("login", "challenge")).thenReturn(pending);
        when(ory.resolveKratosSession("session-value")).thenReturn(kratosSession);
        when(ory.kratosIdentity(kratos.identityId())).thenReturn(mapper.createObjectNode());
        when(identity.application("qts-portal")).thenReturn(application);
        when(identity.establish(any(KratosSession.class), any(), any())).thenReturn(principal);
        when(identity.canAccess(principal, application)).thenReturn(true);
        when(ory.accept(eq("login"), eq("challenge"), any())).thenReturn(accepted);

        URIResult result = URIResult.of(service.login("challenge", request("session-value", "https://sso.test/sign-in")));

        assertThat(result.value()).isEqualTo("https://hydra.test/oauth2/auth?code=abc");
        verify(ory).accept(eq("login"), eq("challenge"), any());
    }

    @Test
    void acceptsConsentAndReturnsHydraVerifierRedirect() {
        KratosSession kratos = kratos();
        Principal principal = principal();
        ApplicationPolicy application = application();
        ObjectNode pending = mapper.createObjectNode()
                .put("subject", principal.oryId().toString());
        pending.set("client", mapper.createObjectNode().put("client_id", "qts-portal"));
        pending.set("requested_scope", mapper.createArrayNode().add("openid").add("profile").add("email"));
        ObjectNode kratosSession = mapper.createObjectNode()
                .put("active", true)
                .put("id", kratos.id().toString())
                .put("expires_at", kratos.expiresAt().toString())
                .put("authenticated_at", kratos.authenticatedAt().toString())
                .put("authenticator_assurance_level", "aal1");
        kratosSession.set("identity", kratos.identity());
        kratosSession.set("authentication_methods", mapper.createArrayNode().addObject().put("method", "password"));
        when(ory.pending("consent", "challenge")).thenReturn(pending);
        when(ory.resolveKratosSession("session-value")).thenReturn(kratosSession);
        when(ory.kratosIdentity(kratos.identityId())).thenReturn(mapper.createObjectNode());
        when(identity.application("qts-portal")).thenReturn(application);
        when(identity.establish(any(KratosSession.class), any(), any())).thenReturn(principal);
        when(identity.canAccess(principal, application)).thenReturn(true);
        when(ory.accept(eq("consent"), eq("challenge"), any())).thenReturn(
                mapper.createObjectNode().put("redirect_to", "https://hydra.test/oauth2/auth?consent_verifier=abc"));

        URIResult result = URIResult.of(service.consent("challenge", request("session-value", "https://sso.test/login")));

        assertThat(result.value()).isEqualTo("https://hydra.test/oauth2/auth?consent_verifier=abc");
        verify(ory).accept(eq("consent"), eq("challenge"), any());
    }

    @Test
    void rejectsLogoutPostFromUnexpectedOrigin() {
        MockHttpServletRequest request = request("session-value", "https://attacker.test/logout");
        when(ory.pending("logout", "challenge")).thenReturn(
                mapper.createObjectNode().put("subject", UUID.randomUUID().toString()));

        assertThatThrownBy(() -> service.logoutAccept("challenge", request))
                .isInstanceOf(BridgeException.class)
                .extracting("code")
                .isEqualTo("csrf_failed");
    }

    @Test
    void rejectsLogoutPostWithoutCsrfToken() {
        MockHttpServletRequest request = request("session-value", "https://sso.test/sign-out");

        assertThatThrownBy(() -> service.logoutAccept("challenge", request))
                .isInstanceOf(BridgeException.class)
                .extracting("code")
                .isEqualTo("csrf_failed");
    }

    @Test
    void acceptsLogoutPostFromTrustedOriginWithCsrfToken() {
        UUID subject = UUID.randomUUID();
        MockHttpServletRequest request = request("session-value", "https://sso.test/sign-out");
        request.addHeader("X-CSRFToken", "spring-identity-cookie-session");
        ObjectNode kratosSession = mapper.createObjectNode()
                .put("active", true)
                .put("id", UUID.randomUUID().toString())
                .put("expires_at", Instant.now().plusSeconds(600).toString())
                .put("authenticated_at", Instant.now().minusSeconds(5).toString())
                .put("authenticator_assurance_level", "aal1");
        kratosSession.set("identity", mapper.createObjectNode().put("id", subject.toString()));
        kratosSession.set("authentication_methods", mapper.createArrayNode().addObject().put("method", "password"));
        when(ory.pending("logout", "challenge")).thenReturn(
                mapper.createObjectNode().put("subject", subject.toString()));
        when(ory.resolveKratosSession("session-value")).thenReturn(kratosSession);
        when(ory.accept(eq("logout"), eq("challenge"), any())).thenReturn(
                mapper.createObjectNode().put("redirect_to", "https://hydra.test/oauth2/sessions/logout?done=1"));

        URIResult result = URIResult.of(service.logoutAccept("challenge", request));

        assertThat(result.value()).isEqualTo("https://hydra.test/oauth2/sessions/logout?done=1");
        verify(identity).revokeSessions(subject);
        verify(ory).revokeKratosSessions(subject);
        verify(ory).revokeHydraConsentSessions(subject);
    }

    private ApplicationPolicy application() {
        return new ApplicationPolicy(
                UUID.randomUUID(), "qts-portal", "QTS Portal", true, null, Set.of());
    }

    private Principal principal() {
        return new Principal(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "person@qtsgroup.vn",
                "Person",
                false,
                Instant.now().minusSeconds(5),
                Instant.now().plusSeconds(600),
                Set.of(),
                List.of("pwd")
        );
    }

    private KratosSession kratos() {
        UUID sessionId = UUID.randomUUID();
        UUID identityId = UUID.randomUUID();
        JsonNode identity = mapper.createObjectNode()
                .put("id", identityId.toString())
                .set("traits", mapper.createObjectNode().put("email", "person@qtsgroup.vn"));
        return new KratosSession(
                sessionId,
                identityId,
                identity,
                Instant.now().plusSeconds(600),
                Instant.now().minusSeconds(5),
                "aal1",
                List.of("password"),
                true
        );
    }

    private MockHttpServletRequest request(String cookie, String origin) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (cookie != null) {
            request.addHeader("Cookie", "ory_kratos_session=" + cookie);
        }
        if (origin != null) {
            request.addHeader("Origin", origin);
        }
        request.addHeader("User-Agent", "test-agent");
        request.setRemoteAddr("127.0.0.1");
        return request;
    }

    private record URIResult(String value) {
        private static URIResult of(java.net.URI uri) {
            return new URIResult(uri.toString());
        }
    }
}
