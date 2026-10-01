package vn.qts.attendance.application;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.support.JdbcTransactionManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import vn.qts.attendance.config.AttendanceProperties;
import vn.qts.attendance.domain.AttendanceDevice;
import vn.qts.attendance.domain.AttendanceException;
import vn.qts.attendance.domain.AttendancePrincipal;
import vn.qts.attendance.domain.IdempotencyOutcome;
import vn.qts.attendance.domain.SyncResult;
import vn.qts.attendance.domain.SyncServiceResult;
import vn.qts.attendance.infra.AttendanceDeviceRepository;
import vn.qts.attendance.infra.AttendanceOutboxRepository;
import vn.qts.attendance.infra.AttendanceSourceEventRepository;
import vn.qts.attendance.infra.EmployeeLinkResolver;
import vn.qts.attendance.infra.IdempotencyRepository;

@Service
public class AttendanceService {
    private static final Set<String> KINDS = Set.of("gps", "qr", "kiosk", "mobile", "card");
    private static final Set<String> PUNCH_TYPES = Set.of("in", "out", "break_start", "break_end");

    private final AttendanceDeviceRepository devices;
    private final AttendanceSourceEventRepository sourceEvents;
    private final AttendanceOutboxRepository outbox;
    private final IdempotencyRepository idempotency;
    private final EmployeeLinkResolver employeeLinks;
    private final DeviceCrypto crypto;
    private final ObjectMapper objectMapper;
    private final AttendanceProperties properties;
    private final Clock clock;
    private final TransactionTemplate transaction;

    public AttendanceService(
            AttendanceDeviceRepository devices,
            AttendanceSourceEventRepository sourceEvents,
            AttendanceOutboxRepository outbox,
            IdempotencyRepository idempotency,
            EmployeeLinkResolver employeeLinks,
            DeviceCrypto crypto,
            ObjectMapper objectMapper,
            AttendanceProperties properties,
            Clock clock,
            org.springframework.transaction.PlatformTransactionManager transactionManager
    ) {
        this.devices = devices;
        this.sourceEvents = sourceEvents;
        this.outbox = outbox;
        this.idempotency = idempotency;
        this.employeeLinks = employeeLinks;
        this.crypto = crypto;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.clock = clock;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    public ObjectNode enroll(AttendancePrincipal principal, JsonNode body) {
        require(principal, "hrm.attendance.device.manage");
        String deviceCode = text(body, "deviceCode").trim();
        String kind = text(body, "kind").trim();
        if (deviceCode.isBlank() || deviceCode.length() > 64 || !KINDS.contains(kind)) {
            throw new AttendanceException("VAL_001", 400, "deviceCode và kind hợp lệ là bắt buộc.");
        }
        UUID branchId = optionalUuid(body, "branchId", "branchId phải là UUID.");
        DeviceKeyPair keys = crypto.generateKeyPair();
        AttendanceDevice device;
        try {
            device = devices.insert(principal.tenantId(), deviceCode, kind, branchId, keys.publicKey(), "ed25519");
        } catch (DataIntegrityViolationException error) {
            throw new AttendanceException("CONFLICT_001", 409, "deviceCode đã tồn tại.");
        }
        ObjectNode result = devicePayload(device);
        result.put("privateKey", DeviceCrypto.b64u(keys.privateKey()));
        return result;
    }

    public ObjectNode getDevice(AttendancePrincipal principal, UUID id) {
        require(principal, "hrm.attendance.device.read");
        return devicePayload(findDevice(principal, id));
    }

    public ObjectNode revoke(AttendancePrincipal principal, UUID id, JsonNode body) {
        require(principal, "hrm.attendance.device.manage");
        AttendanceDevice device = findDevice(principal, id);
        int version = integer(body, "version", "version là bắt buộc.");
        if (version != device.version()) {
            throw new AttendanceException("VERSION_CONFLICT", 409, "Phiên bản thiết bị không khớp.");
        }
        String reason = text(body, "reason").trim();
        String status = "lost".equals(reason) ? "lost" : "revoked";
        if (!devices.revoke(id, principal.tenantId(), version, status, reason, Instant.now(clock))) {
            throw new AttendanceException("VERSION_CONFLICT", 409, "Phiên bản thiết bị không khớp.");
        }
        return devicePayload(findDevice(principal, id));
    }

    public SyncServiceResult sync(
            AttendancePrincipal principal,
            JsonNode body,
            String route,
            String idempotencyKey,
            String requestId
    ) {
        AttendanceDevice device = principal.device();
        if (device == null) {
            throw new AttendanceException("VAL_001", 400, "Thiếu X-Device-Id.");
        }
        if (!principal.deviceAssertion() && !principal.hasAny("hrm.attendance.import", "hrm.attendance.device.sync")) {
            throw new AttendanceException("PERMISSION_001", 403, "Bạn không được phép đồng bộ dữ liệu chấm công.");
        }
        if (!device.active()) {
            throw new AttendanceException("DEVICE_REVOKED", 403, "Thiết bị đã bị thu hồi.");
        }

        String requestHash = CanonicalJson.sha256(body, objectMapper);
        IdempotencyOutcome outcome = idempotency.begin(
                principal.tenantId(),
                principal.actorId(),
                route,
                idempotencyKey,
                requestHash
        );
        if ("conflict".equals(outcome.kind())) {
            throw new AttendanceException(
                    "IDEMPOTENCY_CONFLICT",
                    409,
                    "Idempotency-Key đã dùng với payload khác hoặc yêu cầu trùng đang được xử lý."
            );
        }
        if ("hit".equals(outcome.kind())) {
            return new SyncServiceResult(outcome.status(), outcome.response());
        }

        if (body == null || !body.isObject()) {
            throw new AttendanceException("VAL_001", 400, "Nội dung đồng bộ phải là object JSON.");
        }
        validateSyncMetadata(device, body);
        JsonNode events = body.path("events");
        if (!events.isArray()) {
            throw new AttendanceException("VAL_001", 400, "events phải là danh sách.");
        }
        if (events.size() > properties.getMaxEvents()) {
            throw new AttendanceException(
                    "PAYLOAD_001",
                    413,
                    "Tối đa %d sự kiện cho mỗi lần đồng bộ.".formatted(properties.getMaxEvents())
            );
        }

        List<String> accepted = new ArrayList<>();
        List<String> duplicate = new ArrayList<>();
        List<SyncResult.RejectedEvent> rejected = new ArrayList<>();
        UUID lastAcceptedEvent = null;
        Instant now = Instant.now(clock);
        for (JsonNode event : events) {
            EventDisposition disposition = processEvent(device, event, now, requestId);
            if (disposition.accepted()) {
                accepted.add(disposition.eventId());
                lastAcceptedEvent = UUID.fromString(disposition.eventId());
            } else if (disposition.duplicate()) {
                duplicate.add(disposition.eventId());
            } else {
                rejected.add(disposition.rejected());
            }
        }
        if (lastAcceptedEvent != null) {
            devices.updateCursor(device.id(), now, lastAcceptedEvent);
        }
        AttendanceDevice current = devices.findById(device.id()).orElse(device);
        ObjectNode data = objectMapper.createObjectNode();
        data.set("accepted", objectMapper.valueToTree(accepted));
        data.set("duplicate", objectMapper.valueToTree(duplicate));
        data.set("rejected", objectMapper.valueToTree(rejected));
        data.put("nextCursor", current.lastSyncCursor() == null ? null : current.lastSyncCursor().toString());
        data.put("serverTime", DateTimeFormatter.ISO_INSTANT.format(now));
        data.put("deviceStatus", current.status());
        ObjectNode response = success(data, requestId);
        idempotency.complete(
                principal.tenantId(),
                principal.actorId(),
                route,
                idempotencyKey,
                200,
                response
        );
        return new SyncServiceResult(200, response);
    }

    private EventDisposition processEvent(
            AttendanceDevice device,
            JsonNode raw,
            Instant now,
            String requestId
    ) {
        String eventIdText = text(raw, "eventId");
        String nonce = text(raw, "nonce");
        String occurredRaw = text(raw, "occurredAt");
        String signatureRaw = text(raw, "signature");
        if (eventIdText.isBlank() || nonce.isBlank() || occurredRaw.isBlank() || signatureRaw.isBlank()) {
            return rejected(eventIdText, "VAL_001", "Thiếu trường bắt buộc.");
        }
        UUID eventId;
        try {
            eventId = UUID.fromString(eventIdText);
        } catch (IllegalArgumentException error) {
            return rejected(eventIdText, "VAL_001", "eventId phải là UUID.");
        }
        String deviceIdRaw = text(raw, "deviceId");
        if (!device.id().toString().equals(deviceIdRaw)) {
            return rejected(eventIdText, "VAL_001", "deviceId không khớp.");
        }
        String punchType = text(raw, "punchType");
        if (!PUNCH_TYPES.contains(punchType)) {
            return rejected(eventIdText, "VAL_001", "punchType không hợp lệ.");
        }
        Instant occurredAt;
        try {
            occurredAt = parseInstant(occurredRaw);
            parseInstant(text(raw, "recordedAt").isBlank() ? occurredRaw : text(raw, "recordedAt"));
        } catch (RuntimeException error) {
            return rejected(eventIdText, "VAL_001", "occurredAt không hợp lệ.");
        }
        if (occurredAt.isAfter(now.plus(properties.getOnlineSkew()))) {
            return rejected(eventIdText, "ATTENDANCE_CLOCK_SKEW", "Thời gian chấm công lệch quá ngưỡng.");
        }
        if (occurredAt.isBefore(now.minus(properties.getOfflineWindow()))) {
            return rejected(
                    eventIdText,
                    "ATTENDANCE_OFFLINE_WINDOW_EXPIRED",
                    "Sự kiện vượt quá cửa sổ offline 24h."
            );
        }
        int schemaVersion;
        try {
            schemaVersion = raw.path("schemaVersion").isMissingNode()
                    ? 1
                    : raw.path("schemaVersion").asInt(-1);
            if (schemaVersion < 0) {
                throw new IllegalArgumentException();
            }
        } catch (RuntimeException error) {
            return rejected(eventIdText, "VAL_001", "schemaVersion không hợp lệ.");
        }
        byte[] signature;
        try {
            signature = DeviceCrypto.decodeB64u(signatureRaw);
        } catch (RuntimeException error) {
            return rejected(eventIdText, "VAL_001", "Chữ ký không hợp lệ.");
        }
        if (signature.length != 64) {
            return rejected(eventIdText, "VAL_001", "Chữ ký không hợp lệ.");
        }
        ObjectNode bodyForVerify = objectMapper.createObjectNode();
        bodyForVerify.put("deviceId", device.id().toString());
        bodyForVerify.put("employeeRef", text(raw, "employeeRef"));
        bodyForVerify.put("eventId", eventId.toString());
        bodyForVerify.put("nonce", nonce);
        bodyForVerify.put("occurredAt", occurredRaw);
        bodyForVerify.put("punchType", punchType);
        bodyForVerify.put("recordedAt", text(raw, "recordedAt").isBlank() ? occurredRaw : text(raw, "recordedAt"));
        bodyForVerify.put("schemaVersion", schemaVersion);
        if (!crypto.verify(device.publicKey(), CanonicalJson.bytes(bodyForVerify, objectMapper), signature)) {
            return rejected(eventIdText, "VAL_001", "Chữ ký không hợp lệ.");
        }

        String employeeRef = text(raw, "employeeRef");
        UUID employeeId = employeeLinks.resolve(device.tenantId(), employeeRef).orElse(null);
        ObjectNode payload = raw.deepCopy();
        payload.remove("signature");
        try {
            UUID sourceId = UuidV7.now(now);
            transaction.executeWithoutResult(status -> {
                sourceEvents.insert(
                        sourceId,
                        device.tenantId(),
                        device.id(),
                        eventId,
                        employeeId,
                        employeeRef,
                        punchType,
                        occurredAt,
                        now,
                        nonce,
                        signature,
                        raw
                );
                ObjectNode eventPayload = objectMapper.createObjectNode();
                eventPayload.put("tenantId", device.tenantId().toString());
                eventPayload.put("aggregateType", "attendance_source_event");
                eventPayload.put("aggregateId", sourceId.toString());
                eventPayload.put("version", 1);
                if (employeeId != null) {
                    eventPayload.put("employeeId", employeeId.toString());
                } else {
                    eventPayload.putNull("employeeId");
                }
                eventPayload.put("employeeRef", employeeRef);
                eventPayload.put("deviceId", device.id().toString());
                eventPayload.put("occurredAt", DateTimeFormatter.ISO_INSTANT.format(occurredAt));
                eventPayload.put("punchType", punchType);
                eventPayload.put("eventId", eventId.toString());
                ObjectNode headers = objectMapper.createObjectNode();
                headers.put("request_id", requestId);
                headers.put("schema_version", 1);
                outbox.insert(
                        UuidV7.now(now),
                        device.tenantId(),
                        "attendance.source_recorded.v1",
                        "attendance_source_event",
                        sourceId,
                        eventPayload,
                        headers,
                        now
                );
            });
        } catch (DataIntegrityViolationException error) {
            Optional<AttendanceSourceEventRepository.StoredEvent> existing =
                    sourceEvents.findByEvent(device.tenantId(), device.id(), eventId);
            if (existing.isPresent()) {
                var row = existing.get();
                if (row.punchType().equals(punchType)
                        && row.nonce().equals(nonce)
                        && row.employeeRef().equals(employeeRef)
                        && row.occurredAt().equals(occurredAt)) {
                    return new EventDisposition(eventIdText, true, true, null);
                }
                return rejected(eventIdText, "ATTENDANCE_REPLAY", "eventId đã tồn tại với payload khác.");
            }
            if (sourceEvents.findByNonce(device.tenantId(), device.id(), nonce).isPresent()) {
                return rejected(eventIdText, "ATTENDANCE_REPLAY", "nonce đã được sử dụng.");
            }
            return rejected(eventIdText, "ATTENDANCE_REPLAY", "Trùng lặp sự kiện.");
        }
        return new EventDisposition(eventIdText, true, false, null);
    }

    private void validateSyncMetadata(AttendanceDevice device, JsonNode body) {
        if (body.has("deviceId") && !device.id().toString().equals(text(body, "deviceId"))) {
            throw new AttendanceException("VAL_001", 400, "deviceId không khớp thiết bị đã xác thực.");
        }
        if (body.has("cursor") && !body.path("cursor").isNull()) {
            UUID cursor = optionalUuid(body, "cursor", "cursor phải là UUIDv7.");
            if (cursor.version() != 7) {
                throw new AttendanceException("VAL_001", 400, "cursor phải là UUIDv7.");
            }
        }
    }

    private AttendanceDevice findDevice(AttendancePrincipal principal, UUID id) {
        return devices.findByIdAndTenant(id, principal.tenantId())
                .orElseThrow(() -> new AttendanceException("RES_001", 404, "Không tìm thấy thiết bị chấm công."));
    }

    private void require(AttendancePrincipal principal, String permission) {
        if (!principal.permissions().contains(permission)) {
            throw new AttendanceException("PERMISSION_001", 403, "Bạn không có quyền thực hiện thao tác này.");
        }
    }

    private ObjectNode devicePayload(AttendanceDevice device) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("id", device.id().toString());
        data.put("deviceCode", device.deviceCode());
        data.put("kind", device.kind());
        data.put("status", device.status());
        data.put("version", device.version());
        data.put("keyAlg", device.keyAlg());
        data.put("publicKey", DeviceCrypto.b64u(device.publicKey()));
        return data;
    }

    private ObjectNode success(JsonNode data, String requestId) {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("success", true);
        response.set("data", data);
        response.put("message", "");
        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("requestId", requestId);
        response.set("meta", meta);
        return response;
    }

    private static EventDisposition rejected(String eventId, String code, String message) {
        return new EventDisposition(eventId, false, false, new SyncResult.RejectedEvent(eventId, code, message));
    }

    private static String text(JsonNode node, String field) {
        return node == null ? "" : node.path(field).asText("");
    }

    private static int integer(JsonNode node, String field, String message) {
        if (node == null || !node.path(field).canConvertToInt()) {
            throw new AttendanceException("VAL_001", 400, message);
        }
        return node.path(field).asInt();
    }

    private static UUID optionalUuid(JsonNode node, String field, String message) {
        String value = text(node, field);
        if (value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException error) {
            throw new AttendanceException("VAL_001", 400, message);
        }
    }

    private static Instant parseInstant(String value) {
        String normalized = value.endsWith("Z") ? value : value;
        try {
            return Instant.parse(normalized);
        } catch (RuntimeException ignored) {
            return OffsetDateTime.parse(normalized).toInstant();
        }
    }

    private record EventDisposition(
            String eventId,
            boolean accepted,
            boolean duplicate,
            SyncResult.RejectedEvent rejected
    ) {
    }
}
