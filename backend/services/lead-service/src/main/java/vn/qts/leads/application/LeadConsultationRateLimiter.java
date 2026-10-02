package vn.qts.leads.application;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import vn.qts.leads.config.LeadProperties;

@Component
public class LeadConsultationRateLimiter {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final LeadProperties properties;
    private final Clock clock;

    public LeadConsultationRateLimiter(LeadProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public void check(HttpServletRequest request) {
        check(request, "");
    }

    public void check(HttpServletRequest request, String email) {
        long now = clock.millis();
        checkBucket("ip:" + clientKey(request), RateSpec.parse(properties.consultationRateOrDefault()), now);
        String normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail.isBlank()) {
            checkBucket("email:" + normalizedEmail, RateSpec.parse(properties.consultationEmailRateOrDefault()), now);
        }
        pruneExpiredBuckets(now);
    }

    private void checkBucket(String key, RateSpec spec, long now) {
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> new Bucket(now));
        long retryAfter;
        synchronized (bucket) {
            retryAfter = bucket.tryAcquire(now, spec);
        }
        if (retryAfter > 0) {
            throw new LeadRateLimitException(retryAfter);
        }
    }

    private void pruneExpiredBuckets(long now) {
        if (buckets.size() > 10_000) {
            buckets.entrySet().removeIf(entry -> now - entry.getValue().windowStartedAt > Duration.ofHours(2).toMillis());
        }
    }

    private String clientKey(HttpServletRequest request) {
        return TrustedClientAddress.resolve(request, properties.trustedProxyCidrsOrDefault());
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    record RateSpec(int limit, Duration window) {
        static RateSpec parse(String raw) {
            try {
                String[] parts = raw.toLowerCase().trim().split("/", 2);
                int parsedLimit = Integer.parseInt(parts[0]);
                Duration parsedWindow = switch (parts.length == 1 ? "min" : parts[1]) {
                    case "s", "sec", "second", "seconds" -> Duration.ofSeconds(1);
                    case "m", "min", "minute", "minutes" -> Duration.ofMinutes(1);
                    case "h", "hour", "hours" -> Duration.ofHours(1);
                    default -> throw new IllegalArgumentException("Unsupported rate window");
                };
                return new RateSpec(Math.max(1, parsedLimit), parsedWindow);
            } catch (RuntimeException error) {
                return new RateSpec(60, Duration.ofMinutes(1));
            }
        }
    }

    private static final class Bucket {
        private long windowStartedAt;
        private int used;

        private Bucket(long windowStartedAt) {
            this.windowStartedAt = windowStartedAt;
        }

        private long tryAcquire(long now, RateSpec spec) {
            long windowMs = Math.max(1, spec.window().toMillis());
            if (now - windowStartedAt >= windowMs) {
                windowStartedAt = now;
                used = 0;
            }
            if (used >= spec.limit()) {
                long retryAfterMs = windowMs - (now - windowStartedAt);
                return Math.max(1, (retryAfterMs + 999) / 1000);
            }
            used++;
            return 0;
        }
    }
}
