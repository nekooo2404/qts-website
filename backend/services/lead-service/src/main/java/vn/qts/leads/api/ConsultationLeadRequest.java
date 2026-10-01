package vn.qts.leads.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ConsultationLeadRequest(
    String name,
    String email,
    String company,
    String phone,
    String message,
    String locale,
    Boolean consent,
    @JsonProperty("source_url") String sourceUrl,
    @JsonProperty("utm_source") String utmSource,
    @JsonProperty("utm_medium") String utmMedium,
    @JsonProperty("utm_campaign") String utmCampaign,
    @JsonProperty("idempotency_key") String idempotencyKey,
    String website,
    String pow
) {
}
