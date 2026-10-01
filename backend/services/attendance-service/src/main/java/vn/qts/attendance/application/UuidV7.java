package vn.qts.attendance.application;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

public final class UuidV7 {
    private static final SecureRandom RANDOM = new SecureRandom();

    private UuidV7() {
    }

    public static UUID now(Instant instant) {
        long millis = instant.toEpochMilli();
        long most = (millis << 16) | 0x7000L | (RANDOM.nextInt(0x1000));
        long least = (RANDOM.nextLong() & 0x3fff_ffff_ffff_ffffL) | 0x8000_0000_0000_0000L;
        return new UUID(most, least);
    }
}
