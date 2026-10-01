package vn.qts.attendance.application;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

public final class CanonicalJson {
    private CanonicalJson() {
    }

    public static byte[] bytes(JsonNode node, ObjectMapper mapper) {
        try {
            return mapper.writeValueAsBytes(sort(node));
        } catch (Exception error) {
            throw new IllegalArgumentException("JSON payload cannot be canonicalized", error);
        }
    }

    public static String sha256(JsonNode node, ObjectMapper mapper) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes(node, mapper));
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                result.append("%02x".formatted(value));
            }
            return result.toString();
        } catch (Exception error) {
            throw new IllegalStateException("Cannot hash JSON payload", error);
        }
    }

    public static JsonNode sort(JsonNode node) {
        if (node == null || node.isValueNode() || node.isNull()) {
            return node == null ? JsonNodeFactory.instance.nullNode() : node;
        }
        if (node.isArray()) {
            ArrayNode sorted = JsonNodeFactory.instance.arrayNode();
            node.forEach(child -> sorted.add(sort(child)));
            return sorted;
        }
        ObjectNode sorted = JsonNodeFactory.instance.objectNode();
        var fields = new ArrayList<Map.Entry<String, JsonNode>>();
        fields.addAll(node.properties());
        fields.sort(Comparator.comparing(Map.Entry::getKey));
        fields.forEach(entry -> sorted.set(entry.getKey(), sort(entry.getValue())));
        return sorted;
    }
}
