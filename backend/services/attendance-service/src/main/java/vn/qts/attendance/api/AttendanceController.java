package vn.qts.attendance.api;

import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.qts.attendance.application.AttendanceRequestAuthenticator;
import vn.qts.attendance.application.AttendanceService;
import vn.qts.attendance.application.RateLimiter;
import vn.qts.attendance.config.AttendanceProperties;
import vn.qts.attendance.domain.AttendanceException;
import vn.qts.attendance.domain.AttendancePrincipal;
import vn.qts.attendance.domain.SyncServiceResult;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {
    private final AttendanceService attendance;
    private final AttendanceRequestAuthenticator authenticator;
    private final RateLimiter rateLimiter;
    private final AttendanceProperties properties;

    public AttendanceController(
            AttendanceService attendance,
            AttendanceRequestAuthenticator authenticator,
            RateLimiter rateLimiter,
            AttendanceProperties properties
    ) {
        this.attendance = attendance;
        this.authenticator = authenticator;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    @PostMapping("/devices")
    public ResponseEntity<ApiEnvelope> enroll(
            @RequestBody(required = false) JsonNode body,
            HttpServletRequest request
    ) {
        AttendancePrincipal principal = authenticator.authenticate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiEnvelope.success(attendance.enroll(principal, body), requestId(request))
        );
    }

    @GetMapping({"/devices/{id}", "/devices/{id}/"})
    public ResponseEntity<ApiEnvelope> get(
            @PathVariable UUID id,
            HttpServletRequest request
    ) {
        AttendancePrincipal principal = authenticator.authenticate(request);
        return ResponseEntity.ok(ApiEnvelope.success(attendance.getDevice(principal, id), requestId(request)));
    }

    @PostMapping({"/devices/{id}/revoke", "/devices/{id}/revoke/"})
    public ResponseEntity<ApiEnvelope> revoke(
            @PathVariable UUID id,
            @RequestBody(required = false) JsonNode body,
            HttpServletRequest request
    ) {
        AttendancePrincipal principal = authenticator.authenticate(request);
        return ResponseEntity.ok(ApiEnvelope.success(attendance.revoke(principal, id, body), requestId(request)));
    }

    @PostMapping({"/device-events:sync", "/device-events:sync/"})
    public ResponseEntity<ApiEnvelope> sync(
            @RequestBody(required = false) JsonNode body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request
    ) {
        AttendancePrincipal principal = authenticator.authenticate(request);
        if (principal.device() == null) {
            throw new AttendanceException("VAL_001", 400, "Thiếu X-Device-Id.");
        }
        ensureRateLimit(principal);
        SyncServiceResult result = attendance.sync(
                principal,
                body,
                request.getRequestURI(),
                idempotencyKey,
                requestId(request)
        );
        return ResponseEntity.status(result.status()).body(new ApiEnvelope(result.responseBody()));
    }

    private void ensureRateLimit(AttendancePrincipal principal) {
        RateSpec device = RateSpec.parse(properties.getDeviceRate());
        RateSpec tenant = RateSpec.parse(properties.getTenantRate());
        if (!rateLimiter.tryAcquire("attendance:device:" + principal.device().id(), device.limit(), device.window())) {
            throw new AttendanceException(
                    "RATE_001",
                    429,
                    "Vượt giới hạn đồng bộ chấm công. Vui lòng thử lại sau.",
                    java.util.Map.of("retryAfter", device.window().toSeconds())
            );
        }
        if (!rateLimiter.tryAcquire("attendance:tenant:" + principal.tenantId(), tenant.limit(), tenant.window())) {
            throw new AttendanceException(
                    "RATE_001",
                    429,
                    "Vượt giới hạn đồng bộ chấm công. Vui lòng thử lại sau.",
                    java.util.Map.of("retryAfter", tenant.window().toSeconds())
            );
        }
    }

    private static String requestId(HttpServletRequest request) {
        Object value = request.getAttribute(RequestIdFilter.ATTRIBUTE);
        return value == null ? "unknown" : value.toString();
    }

    private record RateSpec(int limit, java.time.Duration window) {
        static RateSpec parse(String raw) {
            try {
                String[] parts = raw.toLowerCase().trim().split("/");
                int limit = Integer.parseInt(parts[0]);
                java.time.Duration window = switch (parts[1]) {
                    case "s", "sec", "second" -> java.time.Duration.ofSeconds(1);
                    case "m", "min", "minute" -> java.time.Duration.ofMinutes(1);
                    case "h", "hour" -> java.time.Duration.ofHours(1);
                    default -> throw new IllegalArgumentException();
                };
                return new RateSpec(limit, window);
            } catch (RuntimeException error) {
                return new RateSpec(120, java.time.Duration.ofMinutes(1));
            }
        }
    }
}
