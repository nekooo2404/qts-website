package vn.qts.identityadmin.api;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.qts.identityadmin.application.IdentityCatalogService;

@RestController
public class AdminCatalogController {
    private final IdentityCatalogService catalog;

    public AdminCatalogController(IdentityCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping({
            "/api/v1/identity/api/admin/roles",
            "/api/v1/identity/api/admin/roles/",
            "/api/admin/roles",
            "/api/admin/roles/"
    })
    public Map<String, Object> roles(@AuthenticationPrincipal Jwt jwt) {
        return catalog.roles(jwt);
    }

    @GetMapping({
            "/api/v1/identity/api/admin/applications",
            "/api/v1/identity/api/admin/applications/",
            "/api/admin/applications",
            "/api/admin/applications/"
    })
    public Map<String, Object> applications(@AuthenticationPrincipal Jwt jwt) {
        return catalog.applications(jwt);
    }
}
