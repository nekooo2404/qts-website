package vn.qts.events.domain;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

public record NotificationRequest(List<String> recipients, String subject, String body) {
    public static NotificationRequest from(JsonNode data, int maxRecipients, int maxBodyLength) {
        List<String> recipients = new ArrayList<>();
        JsonNode to = data.path("to");
        if (to.isArray()) {
            to.forEach(node -> {
                String value = node.asText("").trim();
                if (!value.isBlank()) {
                    recipients.add(value);
                }
            });
        } else if (to.isTextual() && !to.asText().isBlank()) {
            recipients.add(to.asText().trim());
        }
        if (recipients.isEmpty()) {
            throw new DeterministicEventException("notification recipient is required");
        }
        if (recipients.size() > maxRecipients) {
            throw new DeterministicEventException("notification recipient limit exceeded");
        }
        String subject = data.path("subject").asText("");
        String body = data.path("body").asText("");
        if (body.length() > maxBodyLength) {
            throw new DeterministicEventException("notification body is too large");
        }
        return new NotificationRequest(List.copyOf(recipients), subject, body);
    }
}
