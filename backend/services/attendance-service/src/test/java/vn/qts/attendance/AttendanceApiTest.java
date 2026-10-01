package vn.qts.attendance;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;

import vn.qts.attendance.application.AttendanceRequestAuthenticator;
import vn.qts.attendance.domain.AttendanceDevice;
import vn.qts.attendance.domain.AttendancePrincipal;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(InMemoryAttendanceAdapters.class)
class AttendanceApiTest {
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-7000-8000-000000000001");

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JdbcTemplate jdbc;

    @MockitoBean
    AttendanceRequestAuthenticator authenticator;

    private KeyPair keyPair;
    private AttendanceDevice device;

    @BeforeEach
    void setUp() throws Exception {
        jdbc.update("delete from idempotency_keys");
        jdbc.update("delete from attendance_source_events");
        jdbc.update("delete from outbox_events");
        jdbc.update("delete from attendance_devices");

        KeyPairGenerator generator = KeyPairGenerator.getInstance("Ed25519");
        keyPair = generator.generateKeyPair();
        UUID deviceId = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update(
                """
                insert into attendance_devices
                    (id, tenant_id, device_code, kind, branch_id, public_key, key_alg,
                     status, version, revoked_at, revoke_reason, last_seen_at,
                     last_sync_cursor, clock_anchor_server_time, created_at)
                values (?, ?, 'KIOSK-01', 'kiosk', null, ?, 'ed25519',
                        'active', 1, null, '', null, null, null, ?)
                """,
                deviceId, TENANT_ID, rawPublicKey(keyPair), now
        );
        device = new AttendanceDevice(
                deviceId, TENANT_ID, "KIOSK-01", "kiosk", null, rawPublicKey(keyPair),
                "ed25519", "active", 1, null, "", null, null, null, now
        );
    }

    @Test
    void enrollReturnsPrivateKeyOnlyOnce() throws Exception {
        when(authenticator.authenticate(any())).thenReturn(new AttendancePrincipal(
                TENANT_ID,
                UUID.randomUUID(),
                null,
                Set.of("hrm.attendance.device.manage"),
                false
        ));

        mockMvc.perform(post("/api/v1/attendance/devices")
                        .header("X-Request-ID", "attendance-enroll-test")
                        .contentType("application/json")
                        .content("""
                                {"deviceCode":"KIOSK-02","kind":"kiosk"}
                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("X-Request-ID", "attendance-enroll-test"))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.privateKey").isString())
                .andExpect(jsonPath("$.data.publicKey").isString());
    }

    @Test
    void nonHealthActuatorEndpointsAreClosedByDefault() throws Exception {
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void syncIsIdempotentAndReplayIsRejected() throws Exception {
        String eventId = UUID.randomUUID().toString();
        String nonce = UUID.randomUUID().toString();
        Instant occurred = Instant.now();
        String body = signedEvent(eventId, nonce, occurred, "in");
        when(authenticator.authenticate(any())).thenReturn(new AttendancePrincipal(
                TENANT_ID,
                device.id(),
                device,
                Set.of(),
                true
        ));

        String key = UUID.randomUUID().toString();
        mockMvc.perform(post("/api/v1/attendance/device-events:sync")
                        .header("Idempotency-Key", key)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accepted[0]").value(eventId));

        mockMvc.perform(post("/api/v1/attendance/device-events:sync")
                        .header("Idempotency-Key", key)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accepted[0]").value(eventId));

        String replayBody = signedEvent(eventId, nonce, occurred, "out");
        mockMvc.perform(post("/api/v1/attendance/device-events:sync")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType("application/json")
                        .content(replayBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rejected[0].errorCode").value("ATTENDANCE_REPLAY"));

        Integer sources = jdbc.queryForObject("select count(*) from attendance_source_events", Integer.class);
        Integer outbox = jdbc.queryForObject("select count(*) from outbox_events", Integer.class);
        org.assertj.core.api.Assertions.assertThat(sources).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(outbox).isEqualTo(1);
    }

    @Test
    void wrongRevokeVersionReturnsConflict() throws Exception {
        when(authenticator.authenticate(any())).thenReturn(new AttendancePrincipal(
                TENANT_ID,
                UUID.randomUUID(),
                null,
                Set.of("hrm.attendance.device.manage"),
                false
        ));

        mockMvc.perform(post("/api/v1/attendance/devices/" + device.id() + "/revoke")
                        .contentType("application/json")
                        .content("""
                                {"version":99,"reason":"lost"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("VERSION_CONFLICT"));
    }

    private String signedEvent(String eventId, String nonce, Instant occurred, String punchType) throws Exception {
        String timestamp = occurred.toString().replace("+00:00", "Z");
        String unsigned = """
                {"deviceId":"%s","employeeRef":"","eventId":"%s","nonce":"%s","occurredAt":"%s","punchType":"%s","recordedAt":"%s","schemaVersion":1}
                """.formatted(device.id(), eventId, nonce, timestamp, punchType, timestamp);
        JsonNode node = objectMapper.readTree(unsigned);
        byte[] canonical = objectMapper.writeValueAsString(node).getBytes(StandardCharsets.UTF_8);
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(keyPair.getPrivate());
        signer.update(canonical);
        String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());
        return """
                {"events":[{"deviceId":"%s","employeeRef":"","eventId":"%s","nonce":"%s","occurredAt":"%s","punchType":"%s","recordedAt":"%s","schemaVersion":1,"signature":"%s"}]}
                """.formatted(device.id(), eventId, nonce, timestamp, punchType, timestamp, signature);
    }

    private static byte[] rawPublicKey(KeyPair pair) {
        byte[] encoded = pair.getPublic().getEncoded();
        return java.util.Arrays.copyOfRange(encoded, encoded.length - 32, encoded.length);
    }
}
