package vn.qts.identitybridge.api;

import java.net.URI;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.qts.identitybridge.application.BridgeService;

@RestController
public class BridgeController {
    private final BridgeService bridge;

    public BridgeController(BridgeService bridge) {
        this.bridge = bridge;
    }

    @GetMapping({"/oauth/ory/login", "/oauth/ory/login/"})
    ResponseEntity<Void> login(@RequestParam("login_challenge") String challenge, HttpServletRequest request) {
        return redirect(bridge.login(challenge, request));
    }

    @GetMapping({"/oauth/ory/consent", "/oauth/ory/consent/"})
    ResponseEntity<Void> consent(@RequestParam("consent_challenge") String challenge, HttpServletRequest request) {
        return redirect(bridge.consent(challenge, request));
    }

    @GetMapping({"/oauth/ory/logout", "/oauth/ory/logout/"})
    ResponseEntity<Void> logout(@RequestParam("logout_challenge") String challenge) {
        return redirect(bridge.logout(challenge));
    }

    @PostMapping(
            value = {"/oauth/ory/logout/accept", "/oauth/ory/logout/accept/"},
            consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.APPLICATION_JSON_VALUE}
    )
    ResponseEntity<?> logoutAccept(
            @RequestParam("logout_challenge") String challenge,
            HttpServletRequest request
    ) {
        URI target = bridge.logoutAccept(challenge, request);
        if (request.getHeader(HttpHeaders.ACCEPT) != null
                && request.getHeader(HttpHeaders.ACCEPT).contains(MediaType.APPLICATION_JSON_VALUE)) {
            return ResponseEntity.ok()
                    .cacheControl(org.springframework.http.CacheControl.noStore())
                    .body(Map.of("redirect_to", target.toString()));
        }
        return redirect(target);
    }

    private static ResponseEntity<Void> redirect(URI target) {
        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, target.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }
}
