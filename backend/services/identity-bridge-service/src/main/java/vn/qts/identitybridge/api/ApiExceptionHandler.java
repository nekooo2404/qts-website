package vn.qts.identitybridge.api;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import vn.qts.identitybridge.config.IdentityBridgeProperties;
import vn.qts.identitybridge.domain.BridgeException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private final IdentityBridgeProperties properties;

    public ApiExceptionHandler(IdentityBridgeProperties properties) {
        this.properties = properties;
    }

    @ExceptionHandler(BridgeException.class)
    ResponseEntity<?> handleBridge(BridgeException error, HttpServletRequest request) {
        if (browserOryGet(request)) {
            return redirectToLogin();
        }
        return ResponseEntity.status(error.status())
                .cacheControl(CacheControl.noStore())
                .body(Map.of("error", error.code(), "error_description", error.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> handleUnexpected(Exception error, HttpServletRequest request) {
        if (browserOryGet(request)) {
            return redirectToLogin();
        }
        return ResponseEntity.status(500)
                .cacheControl(CacheControl.noStore())
                .body(Map.of("error", "server_error", "error_description", "Đã xảy ra lỗi hệ thống."));
    }

    private boolean browserOryGet(HttpServletRequest request) {
        if (request == null || !HttpMethod.GET.matches(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        if (uri == null || !uri.startsWith("/oauth/ory/")) {
            return false;
        }
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        return accept == null || !accept.contains(MediaType.APPLICATION_JSON_VALUE);
    }

    private ResponseEntity<Void> redirectToLogin() {
        String origin = properties.webOriginOrEmpty().replaceAll("/+$", "");
        URI target = URI.create(origin + "/login?return_to=" + encode(origin + "/launcher"));
        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, target.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
