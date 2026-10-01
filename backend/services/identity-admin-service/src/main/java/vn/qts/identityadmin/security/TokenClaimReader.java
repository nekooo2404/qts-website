package vn.qts.identityadmin.security;

import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;

public final class TokenClaimReader {
    private TokenClaimReader() {
    }

    public static String string(Jwt jwt, String name) {
        return text(raw(jwt, name));
    }

    public static boolean bool(Jwt jwt, String name) {
        Object value = raw(jwt, name);
        if (value instanceof Boolean flag) {
            return flag;
        }
        return "true".equalsIgnoreCase(text(value));
    }

    private static Object raw(Jwt jwt, String name) {
        if (jwt == null || name == null || name.isBlank()) {
            return null;
        }
        Object value = jwt.getClaims().get(name);
        if (!text(value).isBlank()) {
            return value;
        }
        Object ext = jwt.getClaims().get("ext");
        if (ext instanceof Map<?, ?> extMap) {
            return extMap.get(name);
        }
        return value;
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
