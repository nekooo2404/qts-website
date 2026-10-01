package vn.qts.identityadmin.application;

import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import vn.qts.identityadmin.infra.IdentityCatalogRepository;

@Service
public class IdentityCatalogService {
    private final IdentityCatalogRepository catalog;
    private final TenantClaims tenantClaims;

    public IdentityCatalogService(IdentityCatalogRepository catalog, TenantClaims tenantClaims) {
        this.catalog = catalog;
        this.tenantClaims = tenantClaims;
    }

    public Map<String, Object> roles(Jwt jwt) {
        return Map.of("roles", catalog.roles(tenantClaims.tenantId(jwt)));
    }

    public Map<String, Object> applications(Jwt jwt) {
        return Map.of("applications", catalog.applications(tenantClaims.tenantId(jwt)));
    }
}
