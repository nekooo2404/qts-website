package vn.qts.leads;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LeadConsultationControllerTest {
    private static final String URL = "/api/v1/leads/consultation/";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper objectMapper;

    @BeforeEach
    void cleanTables() {
        jdbc.update("delete from outbox_events");
        jdbc.update("delete from leads_leadactivity");
        jdbc.update("delete from leads_lead");
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
            .andExpect(status().isOk());
    }

    @Test
    void staffListRequiresViewPermission() throws Exception {
        mockMvc.perform(get("/api/v1/leads/"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/leads/")
                .with(jwt().authorities(() -> "PERM_other.permission")))
            .andExpect(status().isForbidden());
    }

    @Test
    void staffCanListAndFilterLeads() throws Exception {
        insertLead(1, "Alex Morgan", "alex@company.com", "Northstar", "new");
        insertLead(2, "Blair Kim", "blair@other.com", "Other Co", "contacted");

        mockMvc.perform(get("/api/v1/leads/")
                .param("page_size", "5")
                .with(jwt().authorities(() -> "PERM_crm.view_customer")))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", containsString("no-store")))
            .andExpect(jsonPath("$.count").value(2))
            .andExpect(jsonPath("$.results.length()").value(2))
            .andExpect(jsonPath("$.results[0].email").value("blair@other.com"))
            .andExpect(jsonPath("$.results[0].source_url").value(""))
            .andExpect(jsonPath("$.results[0].owner").value((Object) null));

        mockMvc.perform(get("/api/v1/leads/")
                .param("status", "contacted")
                .param("q", "Other")
                .with(jwt().authorities(() -> "PERM_crm.view_customer")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.count").value(1))
            .andExpect(jsonPath("$.results[0].company").value("Other Co"));
    }

    @Test
    void staffCanPatchStatusAndOwnerAndActivitiesAreRecorded() throws Exception {
        UUID owner = UUID.randomUUID();
        UUID actor = UUID.randomUUID();
        jdbc.update("insert into identity_user (id) values (?)", owner);
        insertLead(1, "Alex Morgan", "alex@company.com", "Northstar", "new");

        mockMvc.perform(patch("/api/v1/leads/1/")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status":"qualified","owner":"%s","email":"attacker@example.com"}
                    """.formatted(owner))
                .with(jwt().jwt(token -> token.subject(actor.toString()))
                    .authorities(() -> "PERM_crm.edit_customer")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("qualified"))
            .andExpect(jsonPath("$.owner").value(owner.toString()))
            .andExpect(jsonPath("$.assigned_at").exists())
            .andExpect(jsonPath("$.email").value("alex@company.com"));

        assertThat(jdbc.queryForObject("select owner_id from leads_lead where id = 1", UUID.class))
            .isEqualTo(owner);
        assertThat(count("leads_leadactivity")).isEqualTo(2);
        assertThat(jdbc.queryForObject(
            "select count(*) from leads_leadactivity where actor_id = ?", Integer.class, actor
        )).isEqualTo(2);

        mockMvc.perform(get("/api/v1/leads/1/activities/")
                .with(jwt().authorities(() -> "PERM_crm.view_customer")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].created_at").exists());
    }

    @Test
    void viewPermissionCannotPatchLead() throws Exception {
        insertLead(1, "Alex Morgan", "alex@company.com", "Northstar", "new");

        mockMvc.perform(patch("/api/v1/leads/1/")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"spam\"}")
                .with(jwt().authorities(() -> "PERM_crm.view_customer")))
            .andExpect(status().isForbidden());
    }

    @Test
    void exportEscapesSpreadsheetFormulas() throws Exception {
        insertLead(1, "=HYPERLINK(\"https://evil.test\",\"Alex\")", "+alex@company.com", "-Northstar", "new");

        MvcResult result = mockMvc.perform(get("/api/v1/leads/export/")
                .with(jwt().authorities(() -> "PERM_crm.view_customer")))
            .andExpect(status().isOk())
            .andReturn();

        String csv = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(csv).contains("\"'=HYPERLINK(\"\"https://evil.test\"\",\"\"Alex\"\")\"");
        assertThat(csv).contains("'+alex@company.com");
        assertThat(csv).contains("'-Northstar");
    }

    @Test
    void nonPublicEndpointsAreClosed() throws Exception {
        mockMvc.perform(get("/actuator/metrics"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void validLeadIsPersistedWithActivityAndOutbox() throws Exception {
        mockMvc.perform(post(URL)
                .header("X-Request-ID", "lead-consultation-test")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload())))
            .andExpect(status().isCreated())
            .andExpect(header().string("X-Request-ID", "lead-consultation-test"))
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.status").value("new"))
            .andExpect(jsonPath("$.created_at").exists())
            .andExpect(jsonPath("$.email").doesNotExist())
            .andExpect(jsonPath("$.message").doesNotExist());

        assertThat(count("leads_lead")).isEqualTo(1);
        assertThat(count("leads_leadactivity")).isEqualTo(1);
        assertThat(count("outbox_events")).isEqualTo(1);
        assertThat(jdbc.queryForObject("select event_type from outbox_events", String.class))
            .isEqualTo("notification.requested.v1");
    }

    @Test
    void duplicateIdempotencyKeyReturnsExistingLeadWithoutDuplicateRows() throws Exception {
        Map<String, Object> body = payload();

        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated());

        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("new"));

        assertThat(count("leads_lead")).isEqualTo(1);
        assertThat(count("leads_leadactivity")).isEqualTo(1);
        assertThat(count("outbox_events")).isEqualTo(1);
    }

    @Test
    void duplicateIdempotencyKeyReturnsExistingBeforePowCheck() throws Exception {
        Map<String, Object> body = payload();

        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated());

        body.put("pow", "not-a-solution");
        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk());

        assertThat(count("leads_lead")).isEqualTo(1);
    }

    @Test
    void invalidPowIsRejectedBeforePersistence() throws Exception {
        Map<String, Object> body = payload();
        body.put("pow", "not-a-solution");

        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.pow[0]").value("Proof-of-work không hợp lệ."));

        assertThat(count("leads_lead")).isZero();
    }

    @Test
    void consultationEndpointRateLimitsRepeatedRequestsFromSameClient() throws Exception {
        for (int index = 0; index < 60; index++) {
            Map<String, Object> body = payload("ip-limit-" + index + "@company.com");
            mockMvc.perform(post(URL)
                    .header("X-Forwarded-For", "203.0.113.60")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
        }

        Map<String, Object> blocked = payload("ip-limit-blocked@company.com");
        mockMvc.perform(post(URL)
                .header("X-Forwarded-For", "203.0.113.60")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blocked)))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"))
            .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    void consultationEndpointRateLimitsRepeatedEmailAcrossRotatingForwardedAddresses() throws Exception {
        for (int index = 0; index < 20; index++) {
            Map<String, Object> body = payload("same-person@company.com");
            mockMvc.perform(post(URL)
                    .header("X-Forwarded-For", "198.51.100." + index)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
        }

        Map<String, Object> blocked = payload("same-person@company.com");
        mockMvc.perform(post(URL)
                .header("X-Forwarded-For", "198.51.100.99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blocked)))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"));
    }

    @Test
    void untrustedForwardedForCannotBypassClientRateLimit() throws Exception {
        for (int index = 0; index < 60; index++) {
            Map<String, Object> body = payload("spoofed-ip-" + index + "@company.com");
            mockMvc.perform(post(URL)
                    .with(request -> {
                        request.setRemoteAddr("203.0.113.10");
                        return request;
                    })
                    .header("X-Forwarded-For", "198.51.100." + index)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
        }

        Map<String, Object> blocked = payload("spoofed-ip-blocked@company.com");
        mockMvc.perform(post(URL)
                .with(request -> {
                    request.setRemoteAddr("203.0.113.10");
                    return request;
                })
                .header("X-Forwarded-For", "198.51.100.200")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blocked)))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"));
    }

    @Test
    void powHeaderIsAccepted() throws Exception {
        Map<String, Object> body = payload();
        String pow = String.valueOf(body.remove("pow"));

        mockMvc.perform(post(URL)
                .header("X-PoW", pow)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated());
    }

    @Test
    void invalidLeadIsRejected() throws Exception {
        Map<String, Object> body = payload();
        body.put("name", "");
        body.put("email", "not-an-email");
        body.put("message", "");
        body.put("consent", false);
        body.put("website", "https://spam.example");

        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.name[0]").exists())
            .andExpect(jsonPath("$.email[0]").exists())
            .andExpect(jsonPath("$.message[0]").exists())
            .andExpect(jsonPath("$.consent[0]").exists())
            .andExpect(jsonPath("$.website[0]").exists());

        assertThat(count("leads_lead")).isZero();
    }

    private Map<String, Object> payload() {
        return payload("alex-" + UUID.randomUUID() + "@company.com");
    }

    private Map<String, Object> payload(String email) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "Alex Morgan");
        body.put("email", email);
        body.put("company", "Northstar");
        body.put("phone", "+84 909 000 000");
        body.put("message", "We need a unified operations platform");
        body.put("consent", true);
        body.put("idempotency_key", UUID.randomUUID().toString());
        body.put("pow", solvePow(String.valueOf(body.get("idempotency_key"))));
        return body;
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    private void insertLead(long id, String name, String email, String company, String status) {
        jdbc.update("""
            insert into leads_lead
                (id, name, email, company, message, phone, locale, consent, source_url, utm_source,
                 utm_medium, utm_campaign, status, owner_id, assigned_at, idempotency_key, spam_score, created_at)
            values (?, ?, ?, ?, ?, '', 'vi', true, '', '', '', '', ?, null, null, ?, 0, ?)
            """, id, name, email, company, "We need a unified operations platform", status,
            "staff-" + id + "-" + UUID.randomUUID(), Instant.now());
    }

    private String solvePow(String seed) {
        int nonce = 0;
        while (true) {
            String token = String.valueOf(nonce);
            if (sha256(seed + ":" + token).startsWith("000")) {
                return token;
            }
            nonce++;
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte current : bytes) {
                hex.append(String.format("%02x", current));
            }
            return hex.toString();
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }
}
