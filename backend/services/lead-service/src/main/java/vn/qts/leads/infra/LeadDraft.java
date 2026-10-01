package vn.qts.leads.infra;

public record LeadDraft(
    String name,
    String email,
    String company,
    String phone,
    String message,
    String locale,
    boolean consent,
    String sourceUrl,
    String utmSource,
    String utmMedium,
    String utmCampaign,
    String idempotencyKey
) {
}
