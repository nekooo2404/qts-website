package vn.qts.attendance.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.annotation.JsonValue;

public record ApiEnvelope(JsonNode body) {
    @JsonValue
    public JsonNode body() {
        return body;
    }

    public static ApiEnvelope success(JsonNode data, String requestId) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode body = mapper.createObjectNode();
        body.put("success", true);
        body.set("data", data);
        body.put("message", "");
        ObjectNode meta = mapper.createObjectNode();
        meta.put("requestId", requestId);
        body.set("meta", meta);
        return new ApiEnvelope(body);
    }
}
