package vn.qts.leads.application;

public class LeadRateLimitException extends RuntimeException {
    private final long retryAfterSeconds;

    public LeadRateLimitException(long retryAfterSeconds) {
        super("Too many consultation requests.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
