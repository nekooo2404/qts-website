package vn.qts.attendance.application;

import java.time.Duration;

public interface ReplayGuard {
    boolean claim(String key, String fingerprint, Duration ttl);
}
