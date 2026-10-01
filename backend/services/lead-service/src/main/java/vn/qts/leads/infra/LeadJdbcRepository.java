package vn.qts.leads.infra;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import vn.qts.leads.api.LeadCreatedResponse;
import vn.qts.leads.api.LeadActivityRecord;
import vn.qts.leads.api.LeadRecord;
import vn.qts.leads.config.LeadProperties;
import vn.qts.leads.config.PlatformProperties;

@Repository
public class LeadJdbcRepository {
    private static final String INSERT_LEAD = """
        insert into leads_lead
            (name, email, company, phone, message, locale, consent, source_url, utm_source, utm_medium,
             utm_campaign, status, idempotency_key, spam_score, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        """;
    private static final String INSERT_ACTIVITY = """
        insert into leads_leadactivity (lead_id, actor_id, action, payload, created_at)
        values (?, ?, ?, ?, ?)
        """;
    private static final String INSERT_OUTBOX = """
        insert into outbox_events
            (id, tenant_id, event_type, aggregate_type, aggregate_id, payload, headers, occurred_at,
             published_at, attempt_count, available_at, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, null, 0, ?, ?)
        """;

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final PlatformProperties platformProperties;
    private final LeadProperties leadProperties;

    public LeadJdbcRepository(
        JdbcTemplate jdbc,
        ObjectMapper objectMapper,
        PlatformProperties platformProperties,
        LeadProperties leadProperties
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.platformProperties = platformProperties;
        this.leadProperties = leadProperties;
    }

    public Optional<LeadCreatedResponse> findByIdempotencyKey(String key) {
        List<LeadCreatedResponse> rows = jdbc.query(
            "select id, status, created_at from leads_lead where idempotency_key = ?",
            (rs, rowNum) -> new LeadCreatedResponse(
                rs.getLong("id"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant()
            ),
            key
        );
        return rows.stream().findFirst();
    }

    public Optional<LeadRecord> findById(long id) {
        return jdbc.query(
            """
            select id, name, email, company, phone, message, locale, status, owner_id, assigned_at,
                   source_url, utm_source, utm_medium, utm_campaign, created_at
            from leads_lead
            where id = ?
            """,
            (rs, rowNum) -> mapLead(rs),
            id
        ).stream().findFirst();
    }

    public long count(String status, String query) {
        QueryParts parts = filter(status, query);
        return jdbc.queryForObject(
            "select count(*) from leads_lead" + parts.where(),
            Long.class,
            parts.args().toArray()
        );
    }

    public List<LeadRecord> findPage(String status, String query, int limit, int offset) {
        QueryParts parts = filter(status, query);
        List<Object> args = new ArrayList<>(parts.args());
        args.add(limit);
        args.add(offset);
        return jdbc.query(
            """
            select id, name, email, company, phone, message, locale, status, owner_id, assigned_at,
                   source_url, utm_source, utm_medium, utm_campaign, created_at
            from leads_lead
            """
                + parts.where()
                + " order by created_at desc, id desc limit ? offset ?",
            (rs, rowNum) -> mapLead(rs),
            args.toArray()
        );
    }

    public boolean userExists(UUID id) {
        Integer count = jdbc.queryForObject(
            "select count(*) from identity_user where id = ?",
            Integer.class,
            id
        );
        return count != null && count > 0;
    }

    public void update(long id, String status, UUID owner, Instant assignedAt) {
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                update leads_lead
                set status = ?, owner_id = ?, assigned_at = ?
                where id = ?
                """);
            ps.setString(1, status);
            if (owner == null) {
                ps.setNull(2, Types.OTHER);
            } else {
                ps.setObject(2, owner);
            }
            if (assignedAt == null) {
                ps.setNull(3, Types.TIMESTAMP);
            } else {
                ps.setTimestamp(3, Timestamp.from(assignedAt));
            }
            ps.setLong(4, id);
            return ps;
        });
    }

    public LeadCreatedResponse createLead(LeadDraft draft, String status, Instant now) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(INSERT_LEAD, new String[] {"id"});
            ps.setString(1, draft.name());
            ps.setString(2, draft.email());
            ps.setString(3, draft.company());
            ps.setString(4, draft.phone());
            ps.setString(5, draft.message());
            ps.setString(6, draft.locale());
            ps.setBoolean(7, draft.consent());
            ps.setString(8, draft.sourceUrl());
            ps.setString(9, draft.utmSource());
            ps.setString(10, draft.utmMedium());
            ps.setString(11, draft.utmCampaign());
            ps.setString(12, status);
            ps.setString(13, draft.idempotencyKey());
            ps.setTimestamp(14, Timestamp.from(now));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Lead insert did not return an id");
        }
        return new LeadCreatedResponse(key.longValue(), status, now);
    }

    public void createActivity(long leadId, String action, Instant now) {
        createActivity(leadId, null, action, Map.of(), now);
    }

    public void createActivity(long leadId, UUID actor, String action, Map<String, Object> payload, Instant now) {
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(INSERT_ACTIVITY);
            ps.setLong(1, leadId);
            if (actor == null) {
                ps.setNull(2, Types.OTHER);
            } else {
                ps.setObject(2, actor);
            }
            ps.setString(3, action);
            setJson(connection, ps, 4, toJson(payload));
            ps.setTimestamp(5, Timestamp.from(now));
            return ps;
        });
    }

    public List<LeadActivityRecord> findActivities(long leadId) {
        return jdbc.query(
            """
            select id, action, actor_id, payload, created_at
            from leads_leadactivity
            where lead_id = ?
            order by created_at desc, id desc
            """,
            (rs, rowNum) -> new LeadActivityRecord(
                rs.getLong("id"),
                rs.getString("action"),
                asUuid(rs.getObject("actor_id")),
                readJson(rs.getString("payload")),
                rs.getTimestamp("created_at").toInstant()
            ),
            leadId
        );
    }

    public void createNotificationOutbox(long leadId, LeadDraft draft, Instant occurredAt) {
        String notifyEmail = leadProperties.notifyEmailOrEmpty();
        if (notifyEmail.isBlank()) {
            return;
        }

        UUID eventId = uuid7();
        UUID aggregateId = uuid5(platformProperties.tenantId(), "lead:" + leadId);
        Map<String, Object> payload = Map.of(
            "to", List.of(notifyEmail),
            "subject", "[QTS] Lead mới từ " + draft.company(),
            "body", leadNotificationBody(draft),
            "kind", "lead_created",
            "leadPk", leadId
        );
        Map<String, Object> headers = Map.of(
            "request_id", UUID.randomUUID().toString(),
            "schema_version", 1,
            "source", leadProperties.eventSourceOrDefault()
        );

        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(INSERT_OUTBOX);
            ps.setObject(1, eventId);
            ps.setObject(2, platformProperties.tenantId());
            ps.setString(3, "notification.requested.v1");
            ps.setString(4, "lead");
            ps.setObject(5, aggregateId);
            setJson(connection, ps, 6, toJson(payload));
            setJson(connection, ps, 7, toJson(headers));
            ps.setTimestamp(8, Timestamp.from(occurredAt));
            ps.setTimestamp(9, Timestamp.from(occurredAt));
            ps.setTimestamp(10, Timestamp.from(occurredAt));
            return ps;
        });
    }

    private String leadNotificationBody(LeadDraft draft) {
        String phone = draft.phone().isBlank() ? "—" : draft.phone();
        return "Tên: " + draft.name() + "\n"
            + "Email: " + draft.email() + "\n"
            + "Công ty: " + draft.company() + "\n"
            + "Điện thoại: " + phone + "\n\n"
            + draft.message();
    }

    private void setJson(Connection connection, PreparedStatement ps, int index, String json) throws SQLException {
        String product = connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT);
        if (product.contains("postgresql")) {
            ps.setObject(index, json, Types.OTHER);
        } else {
            ps.setString(index, json);
        }
    }

    private LeadRecord mapLead(java.sql.ResultSet rs) throws SQLException {
        Timestamp assignedAt = rs.getTimestamp("assigned_at");
        return new LeadRecord(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("company"),
            rs.getString("phone"),
            rs.getString("message"),
            rs.getString("locale"),
            rs.getString("status"),
            asUuid(rs.getObject("owner_id")),
            assignedAt == null ? null : assignedAt.toInstant(),
            rs.getString("source_url"),
            rs.getString("utm_source"),
            rs.getString("utm_medium"),
            rs.getString("utm_campaign"),
            rs.getTimestamp("created_at").toInstant()
        );
    }

    private UUID asUuid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID uuid) {
            return uuid;
        }
        return UUID.fromString(value.toString());
    }

    private Map<String, Object> readJson(String value) {
        if (value == null || value.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Could not parse JSON payload", error);
        }
    }

    private QueryParts filter(String status, String query) {
        StringBuilder where = new StringBuilder();
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            where.append(" where status = ?");
            args.add(status);
        }
        if (query != null && !query.isBlank()) {
            where.append(where.isEmpty() ? " where " : " and ");
            where.append("(lower(name) like lower(?) or lower(email) like lower(?) or lower(company) like lower(?))");
            String pattern = "%" + query + "%";
            args.add(pattern);
            args.add(pattern);
            args.add(pattern);
        }
        return new QueryParts(where.toString(), args);
    }

    private record QueryParts(String where, List<Object> args) {
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Could not serialize JSON payload", error);
        }
    }

    private UUID uuid7() {
        long millis = Instant.now().toEpochMilli() & 0xFFFFFFFFFFFFL;
        byte[] bytes = new byte[16];
        bytes[0] = (byte) (millis >>> 40);
        bytes[1] = (byte) (millis >>> 32);
        bytes[2] = (byte) (millis >>> 24);
        bytes[3] = (byte) (millis >>> 16);
        bytes[4] = (byte) (millis >>> 8);
        bytes[5] = (byte) millis;
        UUID random = UUID.randomUUID();
        ByteBuffer.wrap(bytes, 6, 8).putLong(random.getMostSignificantBits());
        ByteBuffer.wrap(bytes, 14, 2).putShort((short) random.getLeastSignificantBits());
        bytes[6] = (byte) ((bytes[6] & 0x0F) | 0x70);
        bytes[8] = (byte) ((bytes[8] & 0x3F) | 0x80);
        ByteBuffer buffer = ByteBuffer.wrap(bytes);
        return new UUID(buffer.getLong(), buffer.getLong());
    }

    private UUID uuid5(UUID namespace, String name) {
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            ByteBuffer namespaceBytes = ByteBuffer.allocate(16);
            namespaceBytes.putLong(namespace.getMostSignificantBits());
            namespaceBytes.putLong(namespace.getLeastSignificantBits());
            sha1.update(namespaceBytes.array());
            byte[] hash = sha1.digest(name.getBytes(StandardCharsets.UTF_8));
            hash[6] = (byte) ((hash[6] & 0x0F) | 0x50);
            hash[8] = (byte) ((hash[8] & 0x3F) | 0x80);
            ByteBuffer buffer = ByteBuffer.wrap(hash, 0, 16);
            return new UUID(buffer.getLong(), buffer.getLong());
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-1 unavailable", error);
        }
    }
}
