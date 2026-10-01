package vn.qts.attendance.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.attendance")
public class AttendanceProperties {
    private int maxEvents = 200;
    private Duration offlineWindow = Duration.ofHours(24);
    private Duration onlineSkew = Duration.ofMinutes(5);
    private Duration assertionMaxTtl = Duration.ofHours(24);
    private Duration assertionFutureSkew = Duration.ofSeconds(60);
    private String streamName = "qts.events";
    private boolean securityEnabled = true;
    private String identityIssuer = "";
    private String identityJwkSetUri = "";
    private String identityAudience = "qts-api";
    private String deviceRate = "120/min";
    private String tenantRate = "1200/min";

    public int getMaxEvents() {
        return maxEvents;
    }

    public void setMaxEvents(int maxEvents) {
        this.maxEvents = maxEvents;
    }

    public Duration getOfflineWindow() {
        return offlineWindow;
    }

    public void setOfflineWindow(Duration offlineWindow) {
        this.offlineWindow = offlineWindow;
    }

    public Duration getOnlineSkew() {
        return onlineSkew;
    }

    public void setOnlineSkew(Duration onlineSkew) {
        this.onlineSkew = onlineSkew;
    }

    public Duration getAssertionMaxTtl() {
        return assertionMaxTtl;
    }

    public void setAssertionMaxTtl(Duration assertionMaxTtl) {
        this.assertionMaxTtl = assertionMaxTtl;
    }

    public Duration getAssertionFutureSkew() {
        return assertionFutureSkew;
    }

    public void setAssertionFutureSkew(Duration assertionFutureSkew) {
        this.assertionFutureSkew = assertionFutureSkew;
    }

    public String getStreamName() {
        return streamName;
    }

    public void setStreamName(String streamName) {
        this.streamName = streamName;
    }

    public boolean isSecurityEnabled() {
        return securityEnabled;
    }

    public void setSecurityEnabled(boolean securityEnabled) {
        this.securityEnabled = securityEnabled;
    }

    public String getIdentityIssuer() {
        return identityIssuer;
    }

    public void setIdentityIssuer(String identityIssuer) {
        this.identityIssuer = identityIssuer;
    }

    public String getIdentityJwkSetUri() {
        return identityJwkSetUri;
    }

    public void setIdentityJwkSetUri(String identityJwkSetUri) {
        this.identityJwkSetUri = identityJwkSetUri;
    }

    public String getIdentityAudience() {
        return identityAudience;
    }

    public void setIdentityAudience(String identityAudience) {
        this.identityAudience = identityAudience;
    }

    public String getDeviceRate() {
        return deviceRate;
    }

    public void setDeviceRate(String deviceRate) {
        this.deviceRate = deviceRate;
    }

    public String getTenantRate() {
        return tenantRate;
    }

    public void setTenantRate(String tenantRate) {
        this.tenantRate = tenantRate;
    }
}
