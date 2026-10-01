package vn.qts.identityadmin.api;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import vn.qts.identityadmin.domain.EnrollmentIncompleteException;
import vn.qts.identityadmin.domain.IdentityAdminException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(EnrollmentIncompleteException.class)
    ResponseEntity<Map<String, Object>> handleEnrollmentIncomplete(EnrollmentIncompleteException error) {
        return ResponseEntity.status(error.status()).cacheControl(CacheControl.noStore()).body(Map.of(
                "error", error.code(),
                "error_description", error.getMessage(),
                "missing", error.missing()
        ));
    }

    @ExceptionHandler(IdentityAdminException.class)
    ResponseEntity<Map<String, String>> handleIdentity(IdentityAdminException error) {
        return ResponseEntity.status(error.status()).cacheControl(CacheControl.noStore()).body(Map.of(
                "error", error.code(),
                "error_description", error.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, String>> handleUnexpected(Exception error) {
        return ResponseEntity.status(500).cacheControl(CacheControl.noStore()).body(Map.of(
                "error", "server_error",
                "error_description", "Đã xảy ra lỗi hệ thống."
        ));
    }
}
