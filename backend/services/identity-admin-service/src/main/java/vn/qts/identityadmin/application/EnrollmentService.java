package vn.qts.identityadmin.application;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import vn.qts.identityadmin.config.OrySessionProperties;
import vn.qts.identityadmin.domain.EnrollmentIncompleteException;
import vn.qts.identityadmin.domain.IdentityAdminException;
import vn.qts.identityadmin.domain.KratosBrowserSession;
import vn.qts.identityadmin.infra.EnrollmentRepository;
import vn.qts.identityadmin.infra.EnrollmentRepository.EnrollmentUser;
import vn.qts.identityadmin.infra.OrySessionGateway;

@Service
public class EnrollmentService {
    private static final Set<String> REQUIRED_CREDENTIALS = Set.of("password", "totp", "lookup_secret");

    private final OrySessionGateway orySessionGateway;
    private final OrySessionProperties orySessionProperties;
    private final EnrollmentRepository repository;
    private final ObjectMapper objectMapper;

    public EnrollmentService(
            OrySessionGateway orySessionGateway,
            OrySessionProperties orySessionProperties,
            EnrollmentRepository repository,
            ObjectMapper objectMapper
    ) {
        this.orySessionGateway = orySessionGateway;
        this.orySessionProperties = orySessionProperties;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> complete(EnrollmentCompleteRequest body, HttpServletRequest request) {
        if (body == null || !body.confirmPasswordChanged()) {
            throw new IdentityAdminException(
                    "invalid_request",
                    "Vui lòng xác nhận đã đổi mật khẩu ban đầu.",
                    400
            );
        }
        KratosBrowserSession kratos = KratosBrowserSession.from(
                orySessionGateway.whoami(cookie(request, orySessionProperties.kratosSessionCookieOrDefault()))
        );
        if (kratos == null) {
            throw new IdentityAdminException(
                    "unauthorized",
                    "Vui lòng đăng nhập để tiếp tục.",
                    401
            );
        }

        EnrollmentUser user = repository.userByOryId(kratos.identityId());
        if (user == null) {
            throw new IdentityAdminException(
                    "invalid_token",
                    "Không có người dùng tương ứng với phiên đăng nhập.",
                    401
            );
        }

        JsonNode authoritative = orySessionGateway.identity(kratos.identityId());
        ObjectNode metadata = metadata(authoritative.path("metadata_admin"));
        if (!user.id().toString().equals(metadata.path("qts_user_id").asText(""))) {
            throw new IdentityAdminException(
                    "access_denied",
                    "Tài khoản không khớp với định danh.",
                    403
            );
        }
        if (!metadata.path("requires_enrollment").asBoolean(false)) {
            return Map.of("completed", true, "membership_status", "active");
        }

        List<String> missing = REQUIRED_CREDENTIALS.stream()
                .filter(required -> !authoritative.path("credentials").has(required))
                .sorted()
                .toList();
        if (!missing.isEmpty()) {
            throw new EnrollmentIncompleteException(missing);
        }

        String completedAt = Instant.now().toString();
        metadata.put("requires_enrollment", false);
        metadata.put("enrollment_completed_at", completedAt);
        orySessionGateway.replaceMetadataAdmin(kratos.identityId(), metadata);
        repository.complete(user, completedAt);
        return Map.of("completed", true, "membership_status", "active");
    }

    private ObjectNode metadata(JsonNode raw) {
        if (raw != null && raw.isObject()) {
            return raw.deepCopy();
        }
        return objectMapper.createObjectNode();
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
}
