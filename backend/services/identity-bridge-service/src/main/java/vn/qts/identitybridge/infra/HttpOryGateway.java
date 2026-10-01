package vn.qts.identitybridge.infra;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.NullNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import vn.qts.identitybridge.config.IdentityBridgeProperties;
import vn.qts.identitybridge.domain.BridgeException;

@Service
public class HttpOryGateway implements OryGateway {
    private final RestClient client;
    private final HttpClient browserClient;
    private final IdentityBridgeProperties properties;

    public HttpOryGateway(RestClient.Builder builder, IdentityBridgeProperties properties) {
        this.client = builder.build();
        this.browserClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        this.properties = properties;
    }

    @Override
    public JsonNode pending(String kind, String challenge) {
        return request(HttpMethod.GET, hydraPath("/admin/oauth2/auth/requests/" + kind, challengeKey(kind), challenge), null, null);
    }

    @Override
    public JsonNode accept(String kind, String challenge, JsonNode payload) {
        return request(HttpMethod.PUT, hydraPath("/admin/oauth2/auth/requests/" + kind + "/accept", challengeKey(kind), challenge), payload, null);
    }

    @Override
    public JsonNode reject(String kind, String challenge, JsonNode payload) {
        return request(HttpMethod.PUT, hydraPath("/admin/oauth2/auth/requests/" + kind + "/reject", challengeKey(kind), challenge), payload, null);
    }

    @Override
    public URI resolveHydraBrowserRedirect(URI browserRedirect, String cookieHeader) {
        URI internal = internalHydraPublicUri(browserRedirect);
        try {
            HttpRequest.Builder request = HttpRequest.newBuilder(internal)
                    .timeout(Duration.ofSeconds(5))
                    .header(HttpHeaders.ACCEPT, "text/html,application/xhtml+xml")
                    .GET();
            String safeCookie = safeCookieHeader(cookieHeader);
            if (safeCookie != null) {
                request.header(HttpHeaders.COOKIE, safeCookie);
            }
            HttpResponse<Void> response = browserClient.send(request.build(), HttpResponse.BodyHandlers.discarding());
            int status = response.statusCode();
            if (status >= 300 && status < 400) {
                String location = response.headers().firstValue(HttpHeaders.LOCATION).orElse("");
                if (location.isBlank()) {
                    throw new BridgeException("server_error", "Chuyển hướng định danh không hợp lệ.", 502);
                }
                return browserRedirect.resolve(location);
            }
            if (status >= 400) {
                throw remoteFailure(status);
            }
            throw new BridgeException("server_error", "Chuyển hướng định danh không hợp lệ.", 502);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new BridgeException("server_error", "Không thể kết nối dịch vụ định danh.", 503);
        } catch (BridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new BridgeException("server_error", "Không thể kết nối dịch vụ định danh.", 503);
        }
    }

    @Override
    public JsonNode resolveKratosSession(String cookieValue) {
        if (cookieValue == null || cookieValue.isBlank()) {
            return null;
        }
        try {
            return request(
                    HttpMethod.GET,
                    properties.kratosInternalPublicUrlOrDefault() + "/sessions/whoami",
                    null,
                    properties.kratosSessionCookieOrDefault() + "=" + cookieValue
            );
        } catch (BridgeException error) {
            if (error.status() == 401 || error.status() == 403) {
                return null;
            }
            throw error;
        }
    }

    @Override
    public JsonNode kratosIdentity(UUID subject) {
        return request(HttpMethod.GET,
                properties.kratosAdminUrlOrDefault() + "/admin/identities/" + subject,
                null,
                null);
    }

    @Override
    public void revokeKratosSessions(UUID subject) {
        request(HttpMethod.DELETE,
                properties.kratosAdminUrlOrDefault() + "/admin/identities/" + subject + "/sessions",
                null,
                null);
    }

    @Override
    public void revokeHydraConsentSessions(UUID subject) {
        String path = UriComponentsBuilder
                .fromPath("/admin/oauth2/auth/sessions/consent")
                .queryParam("subject", subject)
                .queryParam("all", "true")
                .build()
                .toUriString();
        request(HttpMethod.DELETE, properties.hydraAdminUrlOrDefault() + path, null, null);
    }

    private JsonNode request(HttpMethod method, String url, JsonNode payload, String cookie) {
        try {
            RestClient.RequestBodySpec request = client.method(method).uri(URI.create(url));
            if (cookie != null) {
                request.header(HttpHeaders.COOKIE, cookie);
            }
            if (payload != null) {
                request.header(HttpHeaders.CONTENT_TYPE, "application/json");
                request.body(payload);
            }
            ResponseEntity<JsonNode> response = request.retrieve().toEntity(JsonNode.class);
            if (response.getStatusCode().is4xxClientError() || response.getStatusCode().is5xxServerError()) {
                throw remoteFailure(response.getStatusCode().value());
            }
            return response.getBody() == null ? NullNode.getInstance() : response.getBody();
        } catch (RestClientResponseException error) {
            if (method == HttpMethod.DELETE && error.getStatusCode().value() == 404) {
                return NullNode.getInstance();
            }
            throw remoteFailure(error.getStatusCode().value());
        } catch (BridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new BridgeException("server_error", "Không thể kết nối dịch vụ định danh.", 503);
        }
    }

    private String hydraPath(String path, String parameter, String value) {
        String query = UriComponentsBuilder.fromPath(path)
                .queryParam(parameter, value)
                .build()
                .encode()
                .toUriString();
        return properties.hydraAdminUrlOrDefault() + query;
    }

    private URI internalHydraPublicUri(URI browserRedirect) {
        URI issuer = URI.create(properties.hydraIssuerBrowserUrlOrEmpty());
        if (!sameOrigin(issuer, browserRedirect)
                || browserRedirect.getRawPath() == null
                || !browserRedirect.getRawPath().startsWith("/oauth2/")
                || browserRedirect.getUserInfo() != null
                || browserRedirect.getFragment() != null) {
            throw new BridgeException("server_error", "Chuyển hướng định danh không hợp lệ.", 502);
        }
        String base = properties.hydraInternalPublicUrlOrDefault().replaceAll("/+$", "");
        String path = browserRedirect.getRawPath();
        String query = browserRedirect.getRawQuery();
        return URI.create(base + path + (query == null || query.isBlank() ? "" : "?" + query));
    }

    private static String safeCookieHeader(String header) {
        if (header == null || header.isBlank() || header.contains("\r") || header.contains("\n")) {
            return null;
        }
        return header;
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

    private static String challengeKey(String kind) {
        return switch (kind) {
            case "login" -> "login_challenge";
            case "consent" -> "consent_challenge";
            case "logout" -> "logout_challenge";
            default -> throw new BridgeException("invalid_request", "Loại challenge không hợp lệ.", 400);
        };
    }

    private static BridgeException remoteFailure(int status) {
        if (status == 401 || status == 403) {
            return new BridgeException("invalid_token", "Phiên đăng nhập không hợp lệ.", status);
        }
        if (status == 400 || status == 404 || status == 410) {
            return new BridgeException("invalid_request", "Giao dịch xác thực đã hết hạn. Vui lòng bắt đầu lại.", 410);
        }
        return new BridgeException("server_error", "Không thể kết nối dịch vụ định danh.", 503);
    }
}
