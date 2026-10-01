package vn.qts.identityadmin.api;

import jakarta.servlet.http.HttpServletRequest;

import vn.qts.identityadmin.domain.IdentityAdminException;

final class BrowserCsrf {
    static final String TOKEN = "spring-identity-cookie-session";

    private BrowserCsrf() {
    }

    static void require(HttpServletRequest request) {
        String token = header(request, "X-CSRFToken");
        if (token.isBlank()) {
            token = header(request, "X-CSRF-Token");
        }
        if (!TOKEN.equals(token)) {
            throw new IdentityAdminException(
                    "csrf_failed",
                    "Yêu cầu bảo mật không hợp lệ. Vui lòng tải lại trang và thử lại.",
                    403
            );
        }
    }

    private static String header(HttpServletRequest request, String name) {
        if (request == null) {
            return "";
        }
        String value = request.getHeader(name);
        return value == null ? "" : value.trim();
    }
}
