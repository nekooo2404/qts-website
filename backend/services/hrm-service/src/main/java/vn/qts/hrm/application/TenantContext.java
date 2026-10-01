package vn.qts.hrm.application;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import vn.qts.hrm.domain.HrmException;

@Component
public class TenantContext {
    public UUID tenantId(Jwt jwt) {
        if (jwt == null) {
            throw new HrmException("AUTH_001", "Phiên xác thực không hợp lệ.", 401);
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
            throw new HrmException("AUTH_002", "Token không liên kết với tổ chức.", 401);
        }
    }

    public UUID subject(Jwt jwt) {
        if (jwt == null) {
            throw new HrmException("AUTH_001", "Phiên xác thực không hợp lệ.", 401);
        }
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (RuntimeException error) {
            throw new HrmException("AUTH_002", "Token không có chủ thể hợp lệ.", 401);
        }
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
