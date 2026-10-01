package vn.qts.attendance.infra;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import vn.qts.attendance.application.ReplayGuard;

@Component
public class RedisReplayGuard implements ReplayGuard {
    private final StringRedisTemplate redis;

    public RedisReplayGuard(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public boolean claim(String key, String fingerprint, Duration ttl) {
        Boolean inserted = redis.opsForValue().setIfAbsent(key, fingerprint, ttl);
        if (Boolean.TRUE.equals(inserted)) {
            return true;
        }
        String existing = redis.opsForValue().get(key);
        return fingerprint.equals(existing);
    }
}
