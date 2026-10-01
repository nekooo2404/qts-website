package vn.qts.events.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qts.events")
public class EventProperties {
    private boolean pollEnabled;
    private int batchSize = 100;
    private int maxAttempts = 8;
    private int streamMaxLength = 100_000;
    private Duration retryBaseDelay = Duration.ofSeconds(1);
    private Duration pendingIdle = Duration.ofMinutes(6);
    private String streamName = "qts.events";
    private String notificationGroup = "notification";
    private String consumerName = "spring-event-service";
    private boolean mailEnabled;
    private int maxRecipients = 50;
    private int maxBodyLength = 100_000;

    public boolean isPollEnabled() {
        return pollEnabled;
    }

    public void setPollEnabled(boolean pollEnabled) {
        this.pollEnabled = pollEnabled;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getStreamMaxLength() {
        return streamMaxLength;
    }

    public void setStreamMaxLength(int streamMaxLength) {
        this.streamMaxLength = streamMaxLength;
    }

    public Duration getRetryBaseDelay() {
        return retryBaseDelay;
    }

    public void setRetryBaseDelay(Duration retryBaseDelay) {
        this.retryBaseDelay = retryBaseDelay;
    }

    public Duration getPendingIdle() {
        return pendingIdle;
    }

    public void setPendingIdle(Duration pendingIdle) {
        this.pendingIdle = pendingIdle;
    }

    public String getStreamName() {
        return streamName;
    }

    public void setStreamName(String streamName) {
        this.streamName = streamName;
    }

    public String getNotificationGroup() {
        return notificationGroup;
    }

    public void setNotificationGroup(String notificationGroup) {
        this.notificationGroup = notificationGroup;
    }

    public String getConsumerName() {
        return consumerName;
    }

    public void setConsumerName(String consumerName) {
        this.consumerName = consumerName;
    }

    public boolean isMailEnabled() {
        return mailEnabled;
    }

    public void setMailEnabled(boolean mailEnabled) {
        this.mailEnabled = mailEnabled;
    }

    public int getMaxRecipients() {
        return maxRecipients;
    }

    public void setMaxRecipients(int maxRecipients) {
        this.maxRecipients = maxRecipients;
    }

    public int getMaxBodyLength() {
        return maxBodyLength;
    }

    public void setMaxBodyLength(int maxBodyLength) {
        this.maxBodyLength = maxBodyLength;
    }
}
