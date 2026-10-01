package vn.qts.attendance.domain;

import java.util.List;

public record SyncResult(
        List<String> accepted,
        List<String> duplicate,
        List<RejectedEvent> rejected
) {
    public record RejectedEvent(String eventId, String errorCode, String message) {
    }
}
