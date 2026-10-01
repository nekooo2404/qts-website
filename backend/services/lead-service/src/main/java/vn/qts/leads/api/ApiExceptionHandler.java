package vn.qts.leads.api;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.qts.leads.application.FieldValidationException;
import vn.qts.leads.application.LeadNotFoundException;
import vn.qts.leads.application.LeadRateLimitException;

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(FieldValidationException.class)
    ResponseEntity<Map<String, List<String>>> handleFieldValidation(FieldValidationException error) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error.errors());
    }

    @ExceptionHandler(LeadNotFoundException.class)
    ResponseEntity<Map<String, String>> handleNotFound(LeadNotFoundException error) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "Not found."));
    }

    @ExceptionHandler(LeadRateLimitException.class)
    ResponseEntity<Map<String, String>> handleRateLimit(LeadRateLimitException error) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, String.valueOf(error.retryAfterSeconds()))
            .body(Map.of("detail", "Too many requests. Please try again later."));
    }
}
