package vn.qts.attendance.domain;

import com.fasterxml.jackson.databind.JsonNode;

public record SyncServiceResult(int status, JsonNode responseBody) {
}
