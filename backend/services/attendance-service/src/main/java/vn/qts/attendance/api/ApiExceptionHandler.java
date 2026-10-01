package vn.qts.attendance.api;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import vn.qts.attendance.domain.AttendanceException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(AttendanceException.class)
    ResponseEntity<Map<String, Object>> handle(AttendanceException error, HttpServletRequest request) {
        String requestId = requestId(request);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("errorCode", error.code());
        body.put("message", error.getMessage());
        body.put("timestamp", Instant.now().toString());
        body.put("requestId", requestId);
        if (!error.details().isEmpty()) {
            body.put("details", error.details());
        }
        return ResponseEntity.status(error.status()).body(body);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handleUnexpected(Exception error, HttpServletRequest request) {
        return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "errorCode", "SYS_001",
                "message", "Đã xảy ra lỗi hệ thống.",
                "timestamp", Instant.now().toString(),
                "requestId", requestId(request)
        ));
    }

    private static String requestId(HttpServletRequest request) {
        Object value = request.getAttribute(RequestIdFilter.ATTRIBUTE);
        return value == null ? "unknown" : value.toString();
    }
}
