package vn.qts.hrm.api;

import java.time.Instant;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import vn.qts.hrm.domain.HrmException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(HrmException.class)
    ResponseEntity<Map<String, Object>> handleHrm(HrmException error, HttpServletRequest request) {
        return ResponseEntity.status(error.status())
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "success", false,
                        "errorCode", error.code(),
                        "message", error.getMessage(),
                        "requestId", requestId(request),
                        "timestamp", Instant.now().toString()
                ));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handleUnexpected(Exception error, HttpServletRequest request) {
        return ResponseEntity.status(500)
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "success", false,
                        "errorCode", "INTERNAL_001",
                        "message", "Đã xảy ra lỗi hệ thống.",
                        "requestId", requestId(request),
                        "timestamp", Instant.now().toString()
                ));
    }

    private static String requestId(HttpServletRequest request) {
        Object value = request.getAttribute(RequestIdFilter.ATTRIBUTE);
        return value == null ? "unknown" : value.toString();
    }
}
