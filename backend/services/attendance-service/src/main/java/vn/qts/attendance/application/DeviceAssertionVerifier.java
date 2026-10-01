package vn.qts.attendance.application;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.cache.support.NullValue;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;

import vn.qts.attendance.config.AttendanceProperties;
import vn.qts.attendance.domain.AttendanceDevice;
import vn.qts.attendance.domain.AttendanceException;
import vn.qts.attendance.domain.AttendancePrincipal;
import vn.qts.attendance.infra.AttendanceDeviceRepository;

@Component
public class DeviceAssertionVerifier {
    private final ObjectMapper objectMapper;
    private final AttendanceDeviceRepository devices;
    private final DeviceCrypto crypto;
    private final ReplayGuard replayGuard;
    private final AttendanceProperties properties;
    private final Clock clock;

    public DeviceAssertionVerifier(
            ObjectMapper objectMapper,
            AttendanceDeviceRepository devices,
            DeviceCrypto crypto,
            ReplayGuard replayGuard,
            AttendanceProperties properties,
            Clock clock
    ) {
        this.objectMapper = objectMapper;
        this.devices = devices;
        this.crypto = crypto;
        this.replayGuard = replayGuard;
        this.properties = properties;
        this.clock = clock;
    }

    public AttendancePrincipal verify(HttpServletRequest request, String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3 || !"QTS-DEVICE".equals(parts[0])) {
            throw auth("Device assertion không hợp lệ.");
        }
        String headerDeviceId = firstHeader(request, "X-Device-Id");
        if (headerDeviceId.isBlank()) {
            throw auth("Thiếu X-Device-Id.");
        }

        JsonNode payload;
        byte[] signature;
        try {
            payload = objectMapper.readTree(new String(DeviceCrypto.decodeB64u(parts[1]), StandardCharsets.UTF_8));
            signature = DeviceCrypto.decodeB64u(parts[2]);
        } catch (Exception error) {
            throw auth("Device assertion không hợp lệ.");
        }
        if (payload == null || !payload.isObject()) {
            throw auth("Device assertion không hợp lệ.");
        }

        UUID deviceId = parseUuid(payload.path("deviceId").asText(""), "deviceId phải là UUID.");
        UUID headerId = parseUuid(headerDeviceId, "X-Device-Id phải là UUID.");
        if (!deviceId.equals(headerId)) {
            throw auth("X-Device-Id không khớp deviceId trong assertion.");
        }
        long issuedAt = longClaim(payload, "iat");
        long expiresAt = longClaim(payload, "exp");
        String jti = payload.path("jti").asText("");
        UUID jtiUuid = parseUuid(jti, "jti phải là UUID.");
        Instant now = Instant.now(clock);
        long nowSeconds = now.getEpochSecond();
        if (expiresAt <= nowSeconds) {
            throw auth("Device assertion đã hết hạn.");
        }
        if (issuedAt > nowSeconds + properties.getAssertionFutureSkew().toSeconds()) {
            throw auth("Device assertion iat trong tương lai.");
        }
        if (expiresAt - issuedAt > properties.getAssertionMaxTtl().toSeconds()) {
            throw auth("Device assertion TTL vượt quá giới hạn.");
        }
        validateRequestBinding(request, payload);

        AttendanceDevice device = devices.findById(deviceId)
                .orElseThrow(() -> auth("Thiết bị không tồn tại."));
        if (!device.active()) {
            throw new AttendanceException("DEVICE_REVOKED", 403, "Thiết bị đã bị thu hồi.");
        }
        if (!crypto.verify(device.publicKey(), CanonicalJson.bytes(payload, objectMapper), signature)) {
            throw auth("Chữ ký thiết bị không hợp lệ.");
        }
        String fingerprint = requestFingerprint(request);
        String replayKey = "attendance:device-assertion:" + device.id() + ":" + jtiUuid;
        if (!replayGuard.claim(
                replayKey,
                fingerprint,
                Duration.ofSeconds(Math.max(1, Math.min(expiresAt - nowSeconds, 86400)))
        )) {
            throw auth("Device assertion đã được sử dụng cho yêu cầu khác.");
        }
        return new AttendancePrincipal(device.tenantId(), device.id(), device, Set.of(), true);
    }

    private void validateRequestBinding(HttpServletRequest request, JsonNode payload) {
        Map<String, String> expected = requestBinding(request);
        Map<String, String> actual = new HashMap<>();
        actual.put("method", payload.path("method").asText("").toUpperCase());
        actual.put("path", payload.path("path").asText(""));
        actual.put("idempotencyKey", payload.path("idempotencyKey").asText(""));
        actual.put("bodySha256", payload.path("bodySha256").asText("").toLowerCase());
        if (!expected.equals(actual)) {
            throw auth("Device assertion không khớp yêu cầu đồng bộ.");
        }
    }

    private Map<String, String> requestBinding(HttpServletRequest request) {
        String bodyHash = sha256(body(request));
        String key = firstHeader(request, "Idempotency-Key");
        return Map.of(
                "method", request.getMethod().toUpperCase(),
                "path", request.getRequestURI(),
                "idempotencyKey", key,
                "bodySha256", bodyHash
        );
    }

    private String requestFingerprint(HttpServletRequest request) {
        Map<String, String> binding = requestBinding(request);
        return sha256((
                binding.get("method") + "\n" +
                        binding.get("path") + "\n" +
                        binding.get("idempotencyKey") + "\n" +
                        binding.get("bodySha256")
        ).getBytes(StandardCharsets.UTF_8));
    }

    private byte[] body(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper cached) {
            return cached.getContentAsByteArray();
        }
        return new byte[0];
    }

    private static String firstHeader(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value == null ? "" : value;
    }

    private static long longClaim(JsonNode payload, String name) {
        if (!payload.has(name) || !payload.path(name).canConvertToLong()) {
            throw auth(name + " phải là số nguyên.");
        }
        return payload.path(name).asLong();
    }

    private static UUID parseUuid(String value, String message) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException error) {
            throw auth(message);
        }
    }

    private static AttendanceException auth(String message) {
        return new AttendanceException("AUTH_001", 401, message);
    }

    private static String sha256(byte[] value) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256").digest(value);
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                result.append("%02x".formatted(item));
            }
            return result.toString();
        } catch (Exception error) {
            throw new IllegalStateException("Cannot hash request", error);
        }
    }
}
