package vn.qts.leads.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.qts.leads.api.LeadActivityRecord;
import vn.qts.leads.api.LeadRecord;
import vn.qts.leads.infra.LeadJdbcRepository;

@Service
public class LeadStaffService {
    private static final List<String> ALLOWED_STATUSES = List.of(
        "new", "contacted", "qualified", "won", "lost", "spam"
    );

    private final LeadJdbcRepository repository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public LeadStaffService(LeadJdbcRepository repository, ObjectMapper objectMapper, Clock clock) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public LeadPage page(String status, String query, int page, int pageSize) {
        String normalizedStatus = trim(status);
        String normalizedQuery = trim(query);
        long count = repository.count(normalizedStatus, normalizedQuery);
        int offset = Math.max(0, (page - 1) * pageSize);
        List<LeadRecord> results = repository.findPage(normalizedStatus, normalizedQuery, pageSize, offset);
        return new LeadPage(count, results, page, pageSize);
    }

    @Transactional
    public LeadRecord update(long id, JsonNode body, String actorSubject) {
        LeadRecord current = repository.findById(id).orElseThrow(() -> new LeadNotFoundException(id));
        JsonNode payload = body == null ? objectMapper.createObjectNode() : body;

        String nextStatus = current.status();
        UUID nextOwner = current.owner();
        boolean statusProvided = payload.has("status");
        boolean ownerProvided = payload.has("owner");

        if (statusProvided) {
            JsonNode statusNode = payload.get("status");
            if (!statusNode.isTextual() || !ALLOWED_STATUSES.contains(statusNode.asText())) {
                throw new FieldValidationException(Map.of(
                    "status", List.of("Trạng thái lead không hợp lệ.")
                ));
            }
            nextStatus = statusNode.asText();
        }

        if (ownerProvided) {
            JsonNode ownerNode = payload.get("owner");
            if (ownerNode.isNull()) {
                nextOwner = null;
            } else if (!ownerNode.isTextual()) {
                throw new FieldValidationException(Map.of(
                    "owner", List.of("Người phụ trách không hợp lệ.")
                ));
            } else {
                try {
                    nextOwner = UUID.fromString(ownerNode.asText());
                } catch (IllegalArgumentException error) {
                    throw new FieldValidationException(Map.of(
                        "owner", List.of("Người phụ trách không hợp lệ.")
                    ));
                }
                if (!repository.userExists(nextOwner)) {
                    throw new FieldValidationException(Map.of(
                        "owner", List.of("Không tìm thấy người phụ trách.")
                    ));
                }
            }
        }

        Instant now = Instant.now(clock);
        boolean statusChanged = !nextStatus.equals(current.status());
        boolean ownerChanged = ownerProvided && !sameOwner(nextOwner, current.owner());
        if (statusChanged || ownerProvided) {
            Instant assignedAt = ownerProvided ? (nextOwner == null ? null : now) : current.assignedAt();
            repository.update(id, nextStatus, nextOwner, assignedAt);
            UUID actor = parseUuid(actorSubject);
            if (statusChanged) {
                repository.createActivity(id, actor, "status_changed",
                    changedValues("from", current.status(), "to", nextStatus), now);
            }
            if (ownerChanged) {
                repository.createActivity(id, actor, "assigned",
                    changedValues(
                        "from", current.owner() == null ? null : current.owner().toString(),
                        "to", nextOwner == null ? null : nextOwner.toString()
                    ),
                    now
                );
            }
        }
        return repository.findById(id).orElseThrow(() -> new LeadNotFoundException(id));
    }

    public List<LeadActivityRecord> activities(long id) {
        if (repository.findById(id).isEmpty()) {
            throw new LeadNotFoundException(id);
        }
        return repository.findActivities(id);
    }

    public byte[] export(String status, String query, int maxRows) {
        List<LeadRecord> leads = repository.findPage(trim(status), trim(query), Math.max(1, maxRows), 0);
        StringBuilder csv = new StringBuilder();
        csv.append("id,name,email,company,phone,status,owner,locale,created_at,message\n");
        for (LeadRecord lead : leads) {
            csv.append(csvRow(
                String.valueOf(lead.id()),
                lead.name(),
                lead.email(),
                lead.company(),
                lead.phone(),
                lead.status(),
                lead.owner() == null ? "" : lead.owner().toString(),
                lead.locale(),
                lead.createdAt().toString(),
                lead.message()
            ));
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private boolean sameOwner(UUID left, UUID right) {
        return left == null ? right == null : left.equals(right);
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private Map<String, Object> changedValues(String firstKey, Object firstValue, String secondKey, Object secondValue) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put(firstKey, firstValue);
        values.put(secondKey, secondValue);
        return values;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String csvRow(String... values) {
        StringBuilder row = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                row.append(',');
            }
            row.append(csvSafe(values[i]));
        }
        return row.append('\n').toString();
    }

    private String csvSafe(String value) {
        String text = value == null ? "" : value;
        String leadingSpacesRemoved = text.replaceFirst("^ +", "");
        if (!leadingSpacesRemoved.isBlank() && "=+-@\t\r".indexOf(leadingSpacesRemoved.charAt(0)) >= 0) {
            text = "'" + text;
        }
        if (text.contains("\"") || text.contains(",") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    public record LeadPage(long count, List<LeadRecord> results, int page, int pageSize) {
    }
}
