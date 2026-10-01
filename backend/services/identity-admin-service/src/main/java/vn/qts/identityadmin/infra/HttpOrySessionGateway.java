package vn.qts.identityadmin.infra;

import java.net.URI;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import vn.qts.identityadmin.config.OrySessionProperties;
import vn.qts.identityadmin.domain.IdentityAdminException;

@Service
public class HttpOrySessionGateway implements OrySessionGateway {
    private final RestClient client;
    private final ObjectMapper objectMapper;
    private final OrySessionProperties properties;

    public HttpOrySessionGateway(
            RestClient.Builder builder,
            ObjectMapper objectMapper,
            OrySessionProperties properties
    ) {
        this.client = builder.build();
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Override
    public JsonNode whoami(String kratosSessionCookie) {
        if (kratosSessionCookie == null || kratosSessionCookie.isBlank()) {
            return null;
        }
        try {
            return request(
                    HttpMethod.GET,
                    properties.kratosInternalPublicUrlOrDefault() + "/sessions/whoami",
                    null,
                    properties.kratosSessionCookieOrDefault() + "=" + kratosSessionCookie
            );
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().value() == 401 || error.getStatusCode().value() == 403) {
                return null;
            }
            throw serviceUnavailable();
        } catch (IdentityAdminException error) {
            throw error;
        } catch (Exception error) {
            throw serviceUnavailable();
        }
    }

    @Override
    public JsonNode identity(UUID subject) {
        if (subject == null) {
            throw new IdentityAdminException("invalid_token", "Phiên đăng nhập không hợp lệ.", 401);
        }
        return request(
                HttpMethod.GET,
                properties.kratosAdminUrlOrDefault() + "/admin/identities/" + subject,
                null,
                null
        );
    }

    @Override
    public void replaceMetadataAdmin(UUID subject, JsonNode metadataAdmin) {
        if (subject == null) {
            throw new IdentityAdminException("invalid_token", "Phiên đăng nhập không hợp lệ.", 401);
        }
        ObjectNode operation = objectMapper.createObjectNode();
        operation.put("op", "replace");
        operation.put("path", "/metadata_admin");
        operation.set("value", metadataAdmin == null ? objectMapper.createObjectNode() : metadataAdmin);
        ArrayNode payload = objectMapper.createArrayNode().add(operation);
        request(
                HttpMethod.PATCH,
                properties.kratosAdminUrlOrDefault() + "/admin/identities/" + subject,
                payload,
                null
        );
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
            return response.getBody() == null ? NullNode.getInstance() : response.getBody();
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().value() == 401 || error.getStatusCode().value() == 403) {
                throw new IdentityAdminException("invalid_token", "Phiên đăng nhập không hợp lệ.", 401);
            }
            if (error.getStatusCode().value() == 404) {
                throw new IdentityAdminException("invalid_token", "Không tìm thấy định danh tương ứng.", 401);
            }
            throw serviceUnavailable();
        } catch (IdentityAdminException error) {
            throw error;
        } catch (Exception error) {
            throw serviceUnavailable();
        }
    }

    private static IdentityAdminException serviceUnavailable() {
        return new IdentityAdminException(
                "server_error",
                "Dịch vụ định danh đang bảo trì hoặc không phản hồi.",
                503
        );
    }
}
