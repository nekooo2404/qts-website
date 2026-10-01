package vn.qts.leads.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record LeadCreatedResponse(
    long id,
    String status,
    @JsonProperty("created_at") Instant createdAt
) {
}
