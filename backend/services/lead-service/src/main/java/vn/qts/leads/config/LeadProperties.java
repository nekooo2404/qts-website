package vn.qts.leads.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.leads")
public record LeadProperties(
    String powPrefix,
    String notifyEmail,
    String eventSource,
    Integer exportMaxRows,
    String consultationRate,
    String consultationEmailRate,
    String trustedProxyCidrs
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

    public String consultationEmailRateOrDefault() {
        return consultationEmailRate == null || consultationEmailRate.isBlank() ? "20/hour" : consultationEmailRate.trim();
    }

    public String trustedProxyCidrsOrDefault() {
        return trustedProxyCidrs == null || trustedProxyCidrs.isBlank() ? "127.0.0.1/32,::1/128" : trustedProxyCidrs.trim();
    }
}
