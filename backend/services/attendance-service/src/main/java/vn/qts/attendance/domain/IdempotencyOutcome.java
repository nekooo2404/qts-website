package vn.qts.attendance.domain;

import com.fasterxml.jackson.databind.JsonNode;

public record IdempotencyOutcome(String kind, Integer status, JsonNode response, String requestHash) {
    public static IdempotencyOutcome miss(String requestHash) {
        return new IdempotencyOutcome("miss", null, null, requestHash);
    }

    public static IdempotencyOutcome hit(int status, JsonNode response, String requestHash) {
        return new IdempotencyOutcome("hit", status, response, requestHash);
    }

    public static IdempotencyOutcome conflict(String requestHash) {
        return new IdempotencyOutcome("conflict", null, null, requestHash);
    }
}
