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
        String key = clientKey(request);
        RateSpec spec = RateSpec.parse(properties.consultationRateOrDefault());
        long now = clock.millis();
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> new Bucket(now));
        long retryAfter;
        synchronized (bucket) {
            retryAfter = bucket.tryAcquire(now, spec);
        }
        if (retryAfter > 0) {
            throw new LeadRateLimitException(retryAfter);
        }
        if (buckets.size() > 10_000) {
            buckets.entrySet().removeIf(entry -> now - entry.getValue().windowStartedAt > Duration.ofMinutes(10).toMillis());
        }
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",", 2)[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
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
