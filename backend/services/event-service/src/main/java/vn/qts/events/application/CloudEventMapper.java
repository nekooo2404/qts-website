package vn.qts.events.application;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import vn.qts.events.domain.OutboxEvent;

@Component
public class CloudEventMapper {
    private final ObjectMapper objectMapper;

    public CloudEventMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String toEnvelope(OutboxEvent row) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("specversion", "1.0");
        root.put("id", row.id().toString());
        root.put("source", readText(row.headers(), "source", "qts"));
        root.put("type", row.eventType());
        root.put("subject", "aggregate:%s:%s".formatted(row.aggregateType(), row.aggregateId()));
        root.put("time", DateTimeFormatter.ISO_INSTANT.format(row.occurredAt().atOffset(ZoneOffset.UTC)));
        root.put("datacontenttype", "application/json");
        root.put("dataschema", "/events/%s/1".formatted(schemaPrefix(row.eventType())));
        root.put("requestid", readText(row.headers(), "request_id", ""));
        root.put("tenantid", row.tenantId().toString());

        ObjectNode data = objectMapper.createObjectNode();
        if (row.payload() != null && row.payload().isObject()) {
            data.setAll((ObjectNode) row.payload().deepCopy());
        } else if (row.payload() != null && !row.payload().isNull()) {
            data.set("value", row.payload().deepCopy());
        }
        data.put("tenantId", row.tenantId().toString());
        data.put("aggregateType", row.aggregateType());
        data.put("aggregateId", row.aggregateId().toString());
        root.set("data", data);
        try {
            return objectMapper.writeValueAsString(root);
        } catch (Exception error) {
            throw new IllegalStateException("Cannot serialize CloudEvent envelope", error);
        }
    }

    private static String schemaPrefix(String eventType) {
        int index = eventType.lastIndexOf('.');
        if (index <= 0) {
            return eventType;
        }
        return eventType.substring(0, index);
    }

    private static String readText(com.fasterxml.jackson.databind.JsonNode node, String field, String fallback) {
        if (node == null || node.isNull()) {
            return fallback;
        }
        String value = node.path(field).asText("");
        return value.isBlank() ? fallback : value;
    }
}
