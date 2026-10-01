package vn.qts.leads.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.leads")
public record LeadProperties(
    String powPrefix,
    String notifyEmail,
    String eventSource,
    Integer exportMaxRows,
    String consultationRate
) {
    public String powPrefixOrEmpty() {
        return powPrefix == null ? "" : powPrefix.trim();
    }

    public String notifyEmailOrEmpty() {
        return notifyEmail == null ? "" : notifyEmail.trim();
    }

    public String eventSourceOrDefault() {
        return eventSource == null || eventSource.isBlank() ? "qts.leads" : eventSource.trim();
    }

    public int exportMaxRowsOrDefault() {
        return exportMaxRows == null ? 5000 : Math.max(1, exportMaxRows);
    }

    public String consultationRateOrDefault() {
        return consultationRate == null || consultationRate.isBlank() ? "60/min" : consultationRate.trim();
    }
}
