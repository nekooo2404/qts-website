package vn.qts.identityadmin.application;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import vn.qts.identityadmin.domain.IdentityAdminException;

@Component
public class TenantClaims {
    public UUID tenantId(Jwt jwt) {
        if (jwt == null) {
            throw new IdentityAdminException("invalid_token", "Bắt buộc có bearer access token.", 401);
        }
        String value = text(jwt.getClaims().get("tid"));
        if (value.isBlank()) {
            value = text(jwt.getClaims().get("qts_tenant"));
        }
        Object ext = jwt.getClaims().get("ext");
        if (value.isBlank() && ext instanceof Map<?, ?> map) {
            value = text(map.get("qts_tenant"));
        }
        try {
            return UUID.fromString(value);
        } catch (RuntimeException error) {
            throw new IdentityAdminException("invalid_token", "Token không liên kết với tổ chức.", 401);
        }
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
