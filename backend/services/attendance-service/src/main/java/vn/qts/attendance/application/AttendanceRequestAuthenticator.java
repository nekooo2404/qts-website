package vn.qts.attendance.application;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Component;

import vn.qts.attendance.domain.AttendanceException;
import vn.qts.attendance.domain.AttendancePrincipal;

@Component
public class AttendanceRequestAuthenticator {
    private final DeviceAssertionVerifier deviceAssertionVerifier;
    private final IdentityTokenVerifier identityTokenVerifier;

    public AttendanceRequestAuthenticator(
            DeviceAssertionVerifier deviceAssertionVerifier,
            IdentityTokenVerifier identityTokenVerifier
    ) {
        this.deviceAssertionVerifier = deviceAssertionVerifier;
        this.identityTokenVerifier = identityTokenVerifier;
    }

    public AttendancePrincipal authenticate(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || authorization.isBlank()) {
            throw new AttendanceException("AUTH_001", 401, "Bắt buộc có thông tin xác thực.");
        }
        if (!authorization.startsWith("Bearer ")) {
            throw new AttendanceException("AUTH_001", 401, "Authorization phải dùng Bearer token.");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.startsWith("QTS-DEVICE.")) {
            return deviceAssertionVerifier.verify(request, token);
        }
        return identityTokenVerifier.verify(request, token);
    }
}
