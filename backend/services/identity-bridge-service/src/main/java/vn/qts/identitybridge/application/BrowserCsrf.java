package vn.qts.identitybridge.application;

import jakarta.servlet.http.HttpServletRequest;

import vn.qts.identitybridge.domain.BridgeException;

final class BrowserCsrf {
    static final String TOKEN = "spring-identity-cookie-session";

    private BrowserCsrf() {
    }

    static void require(HttpServletRequest request) {
        String token = header(request, "X-CSRFToken");
        if (token == null || token.isBlank()) {
            token = header(request, "X-CSRF-Token");
        }
        if (token == null || token.isBlank()) {
            token = request.getParameter("csrfmiddlewaretoken");
        }
        if (token == null || token.isBlank()) {
            token = request.getParameter("_csrf");
        }
        if (!TOKEN.equals(token)) {
            throw new BridgeException("csrf_failed", "Yêu cầu không hợp lệ.", 403);
        }
    }

    private static String header(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value == null ? "" : value.trim();
    }
}
