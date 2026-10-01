package vn.qts.hrm.domain;

import java.util.Map;

public record ApiEnvelope<T>(
        boolean success,
        T data,
        String message,
        Map<String, Object> meta
) {
    public static <T> ApiEnvelope<T> ok(T data, String message, Map<String, Object> meta) {
        return new ApiEnvelope<>(true, data, message == null ? "" : message, meta);
    }
}
