package vn.qts.leads.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record LeadRecord(
    long id,
    String name,
    String email,
    String company,
    String phone,
    String message,
    String locale,
    String status,
    UUID owner,
    @JsonProperty("assigned_at") Instant assignedAt,
    @JsonProperty("source_url") String sourceUrl,
    @JsonProperty("utm_source") String utmSource,
    @JsonProperty("utm_medium") String utmMedium,
    @JsonProperty("utm_campaign") String utmCampaign,
    @JsonProperty("created_at") Instant createdAt
) {
}
