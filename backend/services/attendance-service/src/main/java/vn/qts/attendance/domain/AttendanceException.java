package vn.qts.attendance.domain;

import java.util.Map;

public class AttendanceException extends RuntimeException {
    private final String code;
    private final int status;
    private final Map<String, Object> details;

    public AttendanceException(String code, int status, String message) {
        this(code, status, message, Map.of());
    }

    public AttendanceException(String code, int status, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details == null ? Map.of() : Map.copyOf(details);
    }

    public String code() {
        return code;
    }

    public int status() {
        return status;
    }

    public Map<String, Object> details() {
        return details;
    }
}
