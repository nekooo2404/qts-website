package vn.qts.leads.config;

import java.util.UUID;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.platform")
public record PlatformProperties(UUID tenantId) {
}
