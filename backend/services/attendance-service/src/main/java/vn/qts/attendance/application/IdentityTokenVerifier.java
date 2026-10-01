package vn.qts.attendance.application;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import vn.qts.attendance.config.AttendanceProperties;
import vn.qts.attendance.domain.AttendanceDevice;
import vn.qts.attendance.domain.AttendanceException;
import vn.qts.attendance.domain.AttendancePrincipal;
import vn.qts.attendance.infra.AttendanceDeviceRepository;

@Component
public class IdentityTokenVerifier {
    private final AttendanceProperties properties;
    private final AttendanceDeviceRepository devices;
    private final ObjectMapper objectMapper;
    private volatile JwtDecoder decoder;

    public IdentityTokenVerifier(
            AttendanceProperties properties,
            AttendanceDeviceRepository devices,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.devices = devices;
        this.objectMapper = objectMapper;
    }

    public AttendancePrincipal verify(HttpServletRequest request, String token) {
        if (!properties.isSecurityEnabled()) {
            throw new AttendanceException("AUTH_001", 401, "QTS Identity chưa được bật.");
        }
        Jwt jwt;
        try {
            jwt = decoder().decode(token);
        } catch (Exception error) {
            throw new AttendanceException("AUTH_001", 401, "Access token không hợp lệ hoặc đã hết hạn.");
        }
        JsonNode claims = objectMapper.valueToTree(jwt.getClaims());
        JsonNode ext = claims.path("ext");
        String tokenUse = text(claims, "token_use");
        if (tokenUse.isBlank()) {
            tokenUse = text(ext, "token_use");
        }
        if (!"access".equals(tokenUse)) {
            throw new AttendanceException("AUTH_001", 401, "Chỉ access token được phép truy cập API.");
        }
        UUID actorId = parseUuid(text(claims, "sub"), "Token không hợp lệ.");
        String tenantText = text(claims, "tid");
        if (tenantText.isBlank()) {
            tenantText = text(claims, "qts_tenant");
        }
        if (tenantText.isBlank()) {
            tenantText = text(ext, "qts_tenant");
        }
        UUID tenantId = parseUuid(tenantText, "Token không liên kết với tổ chức.");
        Set<String> permissions = permissions(claims);

        String rawDevice = request.getHeader("X-Device-Id");
        AttendanceDevice device = null;
        if (rawDevice != null && !rawDevice.isBlank()) {
            UUID deviceId = parseUuid(rawDevice, "X-Device-Id phải là UUID.");
            device = devices.findByIdAndTenant(deviceId, tenantId)
                    .orElseThrow(() -> new AttendanceException("RES_001", 404, "Không tìm thấy thiết bị chấm công."));
            if (!device.active()) {
                throw new AttendanceException("DEVICE_REVOKED", 403, "Thiết bị đã bị thu hồi.");
            }
        }
        return new AttendancePrincipal(tenantId, actorId, device, permissions, false);
    }

    private JwtDecoder decoder() {
        JwtDecoder current = decoder;
        if (current != null) {
            return current;
        }
        if (properties.getIdentityJwkSetUri() == null || properties.getIdentityJwkSetUri().isBlank()) {
            throw new AttendanceException("SYS_002", 503, "QTS Identity chưa được cấu hình.");
        }
        synchronized (this) {
            if (decoder == null) {
                var result = org.springframework.security.oauth2.jwt.NimbusJwtDecoder
                        .withJwkSetUri(properties.getIdentityJwkSetUri())
                        .build();
                var validators = new java.util.ArrayList<org.springframework.security.oauth2.core.OAuth2TokenValidator<Jwt>>();
                validators.add(org.springframework.security.oauth2.jwt.JwtValidators.createDefault());
                if (properties.getIdentityIssuer() != null && !properties.getIdentityIssuer().isBlank()) {
                    validators.clear();
                    validators.add(org.springframework.security.oauth2.jwt.JwtValidators
                            .createDefaultWithIssuer(properties.getIdentityIssuer()));
                }
                if (properties.getIdentityAudience() != null && !properties.getIdentityAudience().isBlank()) {
                    validators.add(jwt -> jwt.getAudience().contains(properties.getIdentityAudience())
                            ? org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success()
                            : org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                            new org.springframework.security.oauth2.core.OAuth2Error("invalid_token", "Invalid audience", null)));
                }
                result.setJwtValidator(new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(validators));
                decoder = result;
            }
            return decoder;
        }
    }

    private Set<String> permissions(JsonNode claims) {
        Set<String> result = new HashSet<>();
        addStrings(result, claims.path("permissions"));
        addStrings(result, claims.path("roles"));
        addStrings(result, claims.path("scope"));
        JsonNode ext = claims.path("ext");
        addStrings(result, ext.path("permissions"));
        return Set.copyOf(result);
    }

    private static void addStrings(Set<String> result, JsonNode value) {
        if (value.isArray()) {
            value.forEach(item -> {
                if (item.isTextual()) {
                    result.add(item.asText());
                }
            });
        } else if (value.isTextual()) {
            for (String item : value.asText().split("\\s+")) {
                if (!item.isBlank()) {
                    result.add(item);
                }
            }
        }
    }

    private static String text(JsonNode node, String field) {
        return node == null || node.isMissingNode() ? "" : node.path(field).asText("");
    }

    private static UUID parseUuid(String value, String message) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException error) {
            throw new AttendanceException("AUTH_001", 401, message);
        }
    }
}
