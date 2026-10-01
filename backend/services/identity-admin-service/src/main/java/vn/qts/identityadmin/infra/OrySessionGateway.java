package vn.qts.identityadmin.infra;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;

public interface OrySessionGateway {
    JsonNode whoami(String kratosSessionCookie);

    JsonNode identity(UUID subject);

    void replaceMetadataAdmin(UUID subject, JsonNode metadataAdmin);
}
