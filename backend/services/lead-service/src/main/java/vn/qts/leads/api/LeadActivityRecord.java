package vn.qts.leads.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record LeadActivityRecord(
    long id,
    String action,
    UUID actor,
    Map<String, Object> payload,
    @JsonProperty("created_at") Instant createdAt
) {
}
