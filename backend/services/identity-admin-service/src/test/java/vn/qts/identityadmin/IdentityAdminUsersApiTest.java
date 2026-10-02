package vn.qts.identityadmin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.qts.identityadmin.infra.OrySessionGateway;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdentityAdminUsersApiTest {
    private static final String USERS_URL = "/api/v1/identity/api/admin/users";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    OrySessionGateway orySessionGateway;

    UUID qtsTenant;
    UUID otherTenant;
    UUID alexOryId;
    UUID alexSessionId;
    UUID alexMembershipId;
    UUID mayaMembershipId;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from identity_auditevent");
        jdbc.update("delete from identity_identitysession");
        jdbc.update("delete from identity_hrmemployeelink");
        jdbc.update("delete from identity_directgrant");
        jdbc.update("delete from identity_rolepermission");
        jdbc.update("delete from identity_applicationassignment");
        jdbc.update("delete from identity_application");
        jdbc.update("delete from identity_permission");
        jdbc.update("delete from identity_membershiprole");
        jdbc.update("delete from identity_role");
        jdbc.update("delete from identity_membership");
        jdbc.update("delete from identity_tenant");
        jdbc.update("delete from identity_user");

        qtsTenant = UUID.randomUUID();
        otherTenant = UUID.randomUUID();
        insertTenant(qtsTenant, "qts", "QTS Global");
        insertTenant(otherTenant, "other", "Other Tenant");

        UUID adminRole = insertRole(qtsTenant, "admin", "Quản trị viên");
        UUID managerRole = insertRole(qtsTenant, "manager", "Quản lý");
        UUID portal = insertApplication(qtsTenant, "qts-portal", "Cổng thông tin QTS");
        UUID manageUsers = insertPermission("identity.manage_users");
        assignPermission(adminRole, manageUsers);
        UUID hrm = insertApplication(qtsTenant, "qts-hrm", "QTS HRM");

        UUID alex = insertUser("alex@qts.com", "Alex Harper", true);
        alexOryId = oryId(alex);
        UUID alexMembership = insertMembership(qtsTenant, alex, "active", 3);
        alexMembershipId = alexMembership;
        assignRole(alexMembership, adminRole);
        assignApplication(alexMembership, portal);
        assignApplication(alexMembership, hrm);
        alexSessionId = insertSession(alex, qtsTenant);

        UUID maya = insertUser("maya@qts.com", "Maya Chen", true);
        UUID mayaMembership = insertMembership(qtsTenant, maya, "disabled", 1);
        mayaMembershipId = mayaMembership;
        assignRole(mayaMembership, managerRole);
        assignApplication(mayaMembership, hrm);

        UUID outsider = insertUser("outsider@example.com", "Other User", true);
        insertMembership(otherTenant, outsider, "active", 1);
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk());
    }

    @Test
    void csrfCompatibilityEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/oauth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.csrfToken").value("spring-identity-cookie-session"));
    }

    @Test
    void unsafeRequestIdIsNotReflected() throws Exception {
        String unsafeRequestId = "identity admin users test";

        mockMvc.perform(get("/oauth/csrf")
                        .header("X-Request-ID", unsafeRequestId))
                .andExpect(status().isOk())
                .andExpect(result -> assertThat(result.getResponse().getHeader("X-Request-ID"))
                        .isNotEqualTo(unsafeRequestId)
                        .matches("[0-9a-fA-F-]{36}"));
    }

    @Test
    void browserCookieMutationsRequireCsrfToken() throws Exception {
        when(orySessionGateway.whoami("csrf-session"))
                .thenReturn(kratosSession(UUID.randomUUID(), alexOryId));

        mockMvc.perform(delete("/api/sessions/{sessionId}", alexSessionId)
                        .cookie(new Cookie("ory_kratos_session", "csrf-session")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("csrf_failed"));
    }

    @Test
    void browserEnrollmentCompletionRequiresCsrfToken() throws Exception {
        mockMvc.perform(post("/api/enrollment/complete")
                        .cookie(new Cookie("ory_kratos_session", "enrollment-session"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"confirm_password_changed\": true}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("csrf_failed"));
    }

    @Test
    void adminUsersRequiresAuthenticationAndManagePermission() throws Exception {
        mockMvc.perform(get(USERS_URL))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get(USERS_URL)
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.view_console")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanListTenantScopedUsersWithRolesAndApplications() throws Exception {
        mockMvc.perform(get(USERS_URL)
                        .header("X-Request-ID", "identity-admin-users-test")
                        .param("page_size", "10")
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-ID", "identity-admin-users-test"))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.pagination.total").value(2))
                .andExpect(jsonPath("$.users.length()").value(2))
                .andExpect(jsonPath("$.users[0].email").value("alex@qts.com"))
                .andExpect(jsonPath("$.users[0].display_name").value("Alex Harper"))
                .andExpect(jsonPath("$.users[0].membership_id").isString())
                .andExpect(jsonPath("$.users[0].is_active").value(true))
                .andExpect(jsonPath("$.users[0].membership.roles[0]").value("admin"))
                .andExpect(jsonPath("$.users[0].membership.applications[0]").value("qts-hrm"))
                .andExpect(jsonPath("$.users[0].membership.applications[1]").value("qts-portal"))
                .andExpect(jsonPath("$.users[0].membership.policy_version").value(3))
                .andExpect(jsonPath("$.users[1].email").value("maya@qts.com"))
                .andExpect(jsonPath("$.users[1].membership.status").value("disabled"));
    }

    @Test
    void adminCanFilterByQueryStatusAndRole() throws Exception {
        mockMvc.perform(get(USERS_URL)
                        .param("q", "maya")
                        .param("status", "disabled")
                        .param("role", "manager")
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagination.total").value(1))
                .andExpect(jsonPath("$.users[0].email").value("maya@qts.com"));
    }

    @Test
    void missingTenantClaimIsRejected() throws Exception {
        mockMvc.perform(get(USERS_URL)
                        .with(jwt().authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_token"));
    }

    @Test
    void rootAndVersionedAdminPathsAreSupported() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.length()").value(2));

        mockMvc.perform(get("/api/v1/identity/api/admin/users/")
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.length()").value(2));
    }

    @Test
    void adminCanReadTenantScopedRoleAndApplicationCatalogs() throws Exception {
        mockMvc.perform(get("/api/admin/roles")
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.roles.length()").value(2))
                .andExpect(jsonPath("$.roles[0].code").value("admin"))
                .andExpect(jsonPath("$.roles[0].permissions[0]").value("identity.manage_users"))
                .andExpect(jsonPath("$.roles[0].members").value(1));

        mockMvc.perform(get("/api/admin/applications")
                        .with(jwt().jwt(token -> token.claim("tid", qtsTenant.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications.length()").value(2))
                .andExpect(jsonPath("$.applications[0].slug").value("qts-portal"))
                .andExpect(jsonPath("$.applications[0].assignments").value(1));
    }

    @Test
    void adminCanUpdateMembershipRolesAndApplicationsWithAudit() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{membershipId}/access", mayaMembershipId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "roles": ["admin"],
                                  "applications": ["qts-portal"]
                                }
                                """)
                        .with(jwt().jwt(token -> token
                                        .subject(alexOryId.toString())
                                        .claim("qts_tenant", qtsTenant.toString())
                                        .claim("qts_sid", alexSessionId.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.membership.roles[0]").value("admin"))
                .andExpect(jsonPath("$.membership.applications[0]").value("qts-portal"))
                .andExpect(jsonPath("$.membership.policy_version").value(2));

        Integer auditCount = jdbc.queryForObject(
                "select count(*) from identity_auditevent where action = 'identity.membership.access.updated' and target_id = ?",
                Integer.class,
                mayaMembershipId.toString()
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void unchangedMembershipAccessUpdateIsIdempotent() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{membershipId}/access", mayaMembershipId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "roles": ["manager"],
                                  "applications": ["qts-hrm"]
                                }
                                """)
                        .with(jwt().jwt(token -> token
                                        .subject(alexOryId.toString())
                                        .claim("qts_tenant", qtsTenant.toString())
                                        .claim("qts_sid", alexSessionId.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membership.roles[0]").value("manager"))
                .andExpect(jsonPath("$.membership.applications[0]").value("qts-hrm"))
                .andExpect(jsonPath("$.membership.policy_version").value(1));

        Integer auditCount = jdbc.queryForObject(
                "select count(*) from identity_auditevent where action = 'identity.membership.access.updated' and target_id = ?",
                Integer.class,
                mayaMembershipId.toString()
        );
        assertThat(auditCount).isEqualTo(0);
    }

    @Test
    void adminCannotModifyCurrentSessionMembershipAccess() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{membershipId}/access", alexMembershipId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "roles": ["admin"],
                                  "applications": ["qts-portal"]
                                }
                                """)
                        .with(jwt().jwt(token -> token
                                        .subject(alexOryId.toString())
                                        .claim("qts_tenant", qtsTenant.toString())
                                        .claim("qts_sid", alexSessionId.toString()))
                                .authorities(() -> "PERM_identity.manage_users")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_request"));
    }

    @Test
    void userCanRevokeOwnIdentitySessionWithAuditEvent() throws Exception {
        mockMvc.perform(delete("/api/sessions/{sessionId}", alexSessionId)
                        .with(jwt().jwt(token -> token
                                .subject(alexOryId.toString())
                                .claim("qts_tenant", qtsTenant.toString())
                                .claim("qts_sid", alexSessionId.toString()))))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Cache-Control", containsString("no-store")));

        RevocationProof proof = revocationProof(alexSessionId);
        assertThat(proof.revokedCount()).isEqualTo(1);
        assertThat(proof.auditCount()).isEqualTo(1);
    }

    @Test
    void browserKratosSessionCanReadSessionAndLauncherWithoutBearerToken() throws Exception {
        UUID kratosSessionId = UUID.randomUUID();
        when(orySessionGateway.whoami("browser-session"))
                .thenReturn(kratosSession(kratosSessionId, alexOryId));

        Cookie cookie = new Cookie("ory_kratos_session", "browser-session");

        mockMvc.perform(get("/api/session")
                        .cookie(cookie)
                        .header("User-Agent", "JUnit Browser")
                        .with(request -> {
                            request.setRemoteAddr("203.0.113.7");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.email").value("alex@qts.com"))
                .andExpect(jsonPath("$.tenant.id").value(qtsTenant.toString()))
                .andExpect(jsonPath("$.session.amr[0]").value("password"));

        mockMvc.perform(get("/api/launcher").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications.length()").value(2));

        Integer mappedSessions = jdbc.queryForObject(
                "select count(*) from identity_identitysession where kratos_session_id = ? and user_id = (select id from identity_user where ory_id = ?)",
                Integer.class,
                kratosSessionId,
                alexOryId
        );
        assertThat(mappedSessions).isEqualTo(1);
    }

    @Test
    void browserKratosSessionCanCompleteEnrollmentAndActivateMembership() throws Exception {
        UUID user = insertUser("invitee@qts.com", "Invited User", true);
        UUID invitedOryId = oryId(user);
        UUID membershipId = insertMembership(qtsTenant, user, "invited", 1);
        UUID kratosSessionId = UUID.randomUUID();
        when(orySessionGateway.whoami("enrollment-session"))
                .thenReturn(kratosSession(kratosSessionId, invitedOryId));
        when(orySessionGateway.identity(invitedOryId))
                .thenReturn(kratosIdentity(user, true, "password", "totp", "lookup_secret"));

        mockMvc.perform(post("/api/enrollment/complete")
                        .cookie(new Cookie("ory_kratos_session", "enrollment-session"))
                        .header("X-CSRFToken", "spring-identity-cookie-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"confirm_password_changed\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.membership_status").value("active"));

        String status = jdbc.queryForObject(
                "select status from identity_membership where id = ?",
                String.class,
                membershipId
        );
        Integer auditCount = jdbc.queryForObject(
                "select count(*) from identity_auditevent where action = 'identity.enrollment.completed' and target_id = ?",
                Integer.class,
                membershipId.toString()
        );
        assertThat(status).isEqualTo("active");
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void browserEnrollmentReportsMissingCredentialSetup() throws Exception {
        UUID user = insertUser("pending@qts.com", "Pending User", true);
        UUID pendingOryId = oryId(user);
        insertMembership(qtsTenant, user, "invited", 1);
        when(orySessionGateway.whoami("pending-session"))
                .thenReturn(kratosSession(UUID.randomUUID(), pendingOryId));
        when(orySessionGateway.identity(pendingOryId))
                .thenReturn(kratosIdentity(user, true, "password"));

        mockMvc.perform(post("/api/enrollment/complete")
                        .cookie(new Cookie("ory_kratos_session", "pending-session"))
                        .header("X-CSRFToken", "spring-identity-cookie-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"confirm_password_changed\": true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("enrollment_incomplete"))
                .andExpect(jsonPath("$.missing.length()").value(2));
    }

    private void insertTenant(UUID id, String slug, String name) {
        jdbc.update(
                "insert into identity_tenant (id, slug, name, status, require_mfa, session_max_days, created_at) values (?, ?, ?, 'active', false, 7, ?)",
                id, slug, name, Instant.now()
        );
    }

    private UUID insertUser(String email, String name, boolean active) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update(
                """
                insert into identity_user
                    (id, email, display_name, is_active, is_staff, ory_id, security_version, created_at, updated_at)
                values (?, ?, ?, ?, false, ?, 1, ?, ?)
                """,
                id, email, name, active, UUID.randomUUID(), now, now
        );
        return id;
    }

    private UUID insertMembership(UUID tenantId, UUID userId, String status, int policyVersion) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update(
                """
                insert into identity_membership
                    (id, tenant_id, user_id, department, title, status, policy_version, created_at, updated_at)
                values (?, ?, ?, '', '', ?, ?, ?, ?)
                """,
                id, tenantId, userId, status, policyVersion, now, now
        );
        return id;
    }

    private UUID insertRole(UUID tenantId, String code, String name) {
        UUID id = UUID.randomUUID();
        jdbc.update(
                "insert into identity_role (id, tenant_id, code, name, description, is_system, created_at) values (?, ?, ?, ?, '', false, ?)",
                id, tenantId, code, name, Instant.now()
        );
        return id;
    }

    private UUID insertPermission(String code) {
        UUID id = UUID.randomUUID();
        jdbc.update(
                "insert into identity_permission (id, code, name, description, created_at) values (?, ?, ?, '', ?)",
                id, code, code, Instant.now()
        );
        return id;
    }

    private void assignPermission(UUID roleId, UUID permissionId) {
        jdbc.update(
                "insert into identity_rolepermission (role_id, permission_id) values (?, ?)",
                roleId, permissionId
        );
    }

    private UUID insertApplication(UUID tenantId, String slug, String name) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update(
                """
                insert into identity_application
                    (id, tenant_id, client_id, name, slug, description, application_type,
                     redirect_uris, allowed_scopes, required_permissions, icon, client_secret_hash,
                     is_public, is_active, created_at, updated_at)
                values (?, ?, ?, ?, ?, '', 'internal', '[]', '[]', '[]', 'squares-2x2', '', true, true, ?, ?)
                """,
                id, tenantId, "client-" + slug, name, slug, now, now
        );
        return id;
    }

    private void assignRole(UUID membershipId, UUID roleId) {
        jdbc.update(
                "insert into identity_membershiprole (membership_id, role_id, assigned_by_id, created_at) values (?, ?, null, ?)",
                membershipId, roleId, Instant.now()
        );
    }

    private void assignApplication(UUID membershipId, UUID applicationId) {
        jdbc.update(
                "insert into identity_applicationassignment (membership_id, application_id, is_enabled, last_accessed_at, created_at) values (?, ?, true, null, ?)",
                membershipId, applicationId, Instant.now()
        );
    }

    private UUID oryId(UUID userId) {
        return jdbc.queryForObject(
                "select ory_id from identity_user where id = ?",
                UUID.class,
                userId
        );
    }

    private UUID insertSession(UUID userId, UUID tenantId) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update(
                """
                insert into identity_identitysession
                    (id, user_agent, ip_hash, location, authentication_methods,
                     auth_time, last_seen_at, expires_at, revoked_at, revoked_reason,
                     user_id, tenant_id, security_version, kratos_session_id, hydra_sid)
                values (?, 'JUnit', '', '', '["password"]', ?, ?, ?, null, '', ?, ?, 1, ?, null)
                """,
                id,
                now,
                now,
                now.plusSeconds(3600),
                userId,
                tenantId,
                UUID.randomUUID()
        );
        return id;
    }

    private RevocationProof revocationProof(UUID sessionId) {
        Integer revokedCount = jdbc.queryForObject(
                "select count(*) from identity_identitysession where id = ? and revoked_at is not null and revoked_reason = 'remote_logout'",
                Integer.class,
                sessionId
        );
        Integer auditCount = jdbc.queryForObject(
                "select count(*) from identity_auditevent where action = 'identity.session.revoked' and target_id = ?",
                Integer.class,
                sessionId.toString()
        );
        return new RevocationProof(
                revokedCount == null ? 0 : revokedCount,
                auditCount == null ? 0 : auditCount
        );
    }

    private JsonNode kratosSession(UUID sessionId, UUID identityId) throws Exception {
        return objectMapper.readTree("""
                {
                  "id": "%s",
                  "active": true,
                  "expires_at": "%s",
                  "authenticated_at": "%s",
                  "identity": {"id": "%s"},
                  "authentication_methods": [{"method": "password"}]
                }
                """.formatted(
                sessionId,
                Instant.now().plusSeconds(3600),
                Instant.now().minusSeconds(60),
                identityId
        ));
    }

    private JsonNode kratosIdentity(UUID userId, boolean requiresEnrollment, String... credentials) {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode metadata = root.putObject("metadata_admin");
        metadata.put("qts_user_id", userId.toString());
        metadata.put("requires_enrollment", requiresEnrollment);
        ObjectNode credentialNode = root.putObject("credentials");
        for (String credential : credentials) {
            credentialNode.putObject(credential);
        }
        return root;
    }

    private record RevocationProof(int revokedCount, int auditCount) {
    }
}
