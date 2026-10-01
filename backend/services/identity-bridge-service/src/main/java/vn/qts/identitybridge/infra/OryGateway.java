package vn.qts.identitybridge.infra;

import java.net.URI;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

public interface OryGateway {
    JsonNode pending(String kind, String challenge);

    JsonNode accept(String kind, String challenge, JsonNode payload);

    JsonNode reject(String kind, String challenge, JsonNode payload);

    URI resolveHydraBrowserRedirect(URI browserRedirect, String cookieHeader);

    JsonNode resolveKratosSession(String cookieValue);

    JsonNode kratosIdentity(UUID subject);

    void revokeKratosSessions(UUID subject);

    void revokeHydraConsentSessions(UUID subject);
}
