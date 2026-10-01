package vn.qts.attendance;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;

import vn.qts.attendance.application.RateLimiter;
import vn.qts.attendance.application.ReplayGuard;

@TestConfiguration
public class InMemoryAttendanceAdapters {
    @Bean
    @Primary
    ReplayGuard replayGuard() {
        return new InMemoryReplayGuard();
    }

    @Bean
    @Primary
    RateLimiter rateLimiter() {
        return new InMemoryRateLimiter();
    }

    static class InMemoryReplayGuard implements ReplayGuard {
        private final Map<String, String> values = new ConcurrentHashMap<>();

        @Override
        public boolean claim(String key, String fingerprint, Duration ttl) {
            String current = values.putIfAbsent(key, fingerprint);
            return current == null || current.equals(fingerprint);
        }
    }

    static class InMemoryRateLimiter implements RateLimiter {
        private final Map<String, Window> values = new ConcurrentHashMap<>();

        @Override
        public boolean tryAcquire(String key, int limit, Duration window) {
            Instant now = Instant.now();
            Window current = values.compute(key, (ignored, old) -> {
                if (old == null || old.expiresAt().isBefore(now)) {
                    return new Window(1, now.plus(window));
                }
                return new Window(old.count() + 1, old.expiresAt());
            });
            return current.count() <= limit;
        }

        private record Window(int count, Instant expiresAt) {
        }
    }
}
