package vn.qts.identityadmin.application;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import vn.qts.identityadmin.config.IdentityBootstrapProperties;
import vn.qts.identityadmin.config.OrySessionProperties;

@Service
public class IdentityBootstrapService {
    private static final Logger log = LoggerFactory.getLogger(IdentityBootstrapService.class);

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final IdentityBootstrapProperties properties;
    private final OrySessionProperties ory;

    public IdentityBootstrapService(
            JdbcTemplate jdbc,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder,
            IdentityBootstrapProperties properties,
            OrySessionProperties ory
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder.build();
        this.properties = properties;
        this.ory = ory;
    }

    @Transactional
    public void ensureBaseline() {
        UUID tenantId = ensureTenant();
        ensureOrganizationDomain(tenantId);

        Map<String, Object> permissionIds = new LinkedHashMap<>();
        permissions().forEach((code, name) -> permissionIds.put(code, ensurePermission(code, name)));

        Map<String, UUID> roleIds = new LinkedHashMap<>();
        roles().forEach((code, name) -> roleIds.put(code, ensureRole(tenantId, code, name)));
        roleGrants().forEach((role, grants) -> ensureRolePermissions(roleIds.get(role), grants, permissionIds));

        Map<String, UUID> appIds = new LinkedHashMap<>();
        applications().forEach((slug, app) -> appIds.put(slug, ensureApplication(tenantId, slug, app)));

        UUID superadminId = ensureSuperadminUser();
        UUID membershipId = ensureMembership(tenantId, superadminId);
        ensureMembershipRole(membershipId, roleIds.get("super-admin"), superadminId);
        appIds.values().forEach(applicationId -> ensureApplicationAssignment(membershipId, applicationId));
        ensureHrmEmployeeLink(tenantId, superadminId, membershipId);
    }

    private UUID ensureTenant() {
        List<UUID> rows = jdbc.queryForList(
                "select id from identity_tenant where slug = ? limit 1",
                UUID.class,
                properties.tenantSlugOrDefault()
        );
        if (!rows.isEmpty()) {
            jdbc.update(
                    "update identity_tenant set name = ?, require_mfa = ? where id = ?",
                    properties.tenantNameOrDefault(),
                    properties.requireMfa(),
                    rows.getFirst()
            );
            return rows.getFirst();
        }

        UUID id = stableUuid("tenant:" + properties.tenantSlugOrDefault());
        jdbc.update(
                """
                insert into identity_tenant
                    (id, slug, name, status, require_mfa, session_max_days, created_at)
                values (?, ?, ?, 'active', ?, 7, ?)
                """,
                id,
                properties.tenantSlugOrDefault(),
                properties.tenantNameOrDefault(),
                properties.requireMfa(),
                now()
        );
        return id;
    }

    private void ensureOrganizationDomain(UUID tenantId) {
        if (!tableExists("identity_organizationdomain")) {
            return;
        }
        String domain = properties.primaryDomainOrDefault();
        Integer count = jdbc.queryForObject(
                "select count(*) from identity_organizationdomain where domain = ?",
                Integer.class,
                domain
        );
        if (count != null && count > 0) {
            return;
        }
        jdbc.update(
                """
                insert into identity_organizationdomain (tenant_id, domain, verified_at, created_at)
                values (?, ?, ?, ?)
                """,
                tenantId,
                domain,
                now(),
                now()
        );
    }

    private Object ensurePermission(String code, String name) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select id from identity_permission where code = ? limit 1",
                code
        );
        if (!rows.isEmpty()) {
            jdbc.update("update identity_permission set name = ? where code = ?", name, code);
            return rows.getFirst().get("id");
        }
        if (columnIsUuid("identity_permission", "id")) {
            UUID id = stableUuid("permission:" + code);
            jdbc.update(
                    "insert into identity_permission (id, code, name, description, created_at) values (?, ?, ?, '', ?)",
                    id,
                    code,
                    name,
                    now()
            );
            return id;
        }
        jdbc.update(
                "insert into identity_permission (code, name, description, created_at) values (?, ?, '', ?)",
                code,
                name,
                now()
        );
        return jdbc.queryForMap("select id from identity_permission where code = ? limit 1", code).get("id");
    }

    private UUID ensureRole(UUID tenantId, String code, String name) {
        List<UUID> rows = jdbc.queryForList(
                "select id from identity_role where tenant_id = ? and code = ? limit 1",
                UUID.class,
                tenantId,
                code
        );
        if (!rows.isEmpty()) {
            jdbc.update("update identity_role set name = ?, is_system = true where id = ?", name, rows.getFirst());
            return rows.getFirst();
        }
        UUID id = stableUuid("role:" + tenantId + ":" + code);
        jdbc.update(
                """
                insert into identity_role
                    (id, tenant_id, code, name, description, is_system, created_at)
                values (?, ?, ?, ?, '', true, ?)
                """,
                id,
                tenantId,
                code,
                name,
                now()
        );
        return id;
    }

    private void ensureRolePermissions(UUID roleId, List<String> permissionCodes, Map<String, Object> permissionIds) {
        if (roleId == null) {
            return;
        }
        for (String code : permissionCodes) {
            Object permissionId = permissionIds.get(code);
            if (permissionId == null) {
                continue;
            }
            Integer count = jdbc.queryForObject(
                    "select count(*) from identity_rolepermission where role_id = ? and permission_id = ?",
                    Integer.class,
                    roleId,
                    permissionId
            );
            if (count == null || count == 0) {
                jdbc.update(
                        "insert into identity_rolepermission (role_id, permission_id) values (?, ?)",
                        roleId,
                        permissionId
                );
            }
        }
    }

    private UUID ensureApplication(UUID tenantId, String slug, BootstrapApplication application) {
        List<UUID> rows = jdbc.queryForList(
                "select id from identity_application where tenant_id = ? and slug = ? limit 1",
                UUID.class,
                tenantId,
                slug
        );
        UUID id = rows.isEmpty() ? stableUuid("application:" + tenantId + ":" + slug) : rows.getFirst();
        List<String> redirects = application.redirectUris();
        List<String> scopes = List.of("profile", "email");
        String required = json(application.requiredPermissions());
        String redirectJson = json(redirects);
        String scopeJson = json(scopes);
        if (rows.isEmpty()) {
            jdbc.update(
                    jsonSql("""
                    insert into identity_application
                        (id, tenant_id, client_id, name, slug, description, application_type,
                         redirect_uris, allowed_scopes, required_permissions, icon, client_secret_hash,
                         is_public, is_active, created_at, updated_at)
                    values (?, ?, ?, ?, ?, ?, 'internal', %s, %s, %s, ?, '', true, true, ?, ?)
                    """),
                    id,
                    tenantId,
                    application.clientId(),
                    application.name(),
                    slug,
                    application.description(),
                    redirectJson,
                    scopeJson,
                    required,
                    application.icon(),
                    now(),
                    now()
            );
            return id;
        }
        jdbc.update(
                jsonSql("""
                update identity_application
                   set client_id = ?, name = ?, description = ?, redirect_uris = %s,
                       allowed_scopes = %s, required_permissions = %s, icon = ?,
                       is_public = true, is_active = true, updated_at = ?
                 where id = ?
                """),
                application.clientId(),
                application.name(),
                application.description(),
                redirectJson,
                scopeJson,
                required,
                application.icon(),
                now(),
                id
        );
        return id;
    }

    private UUID ensureSuperadminUser() {
        String email = properties.superadminEmailOrDefault();
        List<UUID> rows = jdbc.queryForList("select id from identity_user where email = ? limit 1", UUID.class, email);
        UUID id = rows.isEmpty() ? stableUuid("user:" + email) : rows.getFirst();
        UUID oryId = existingOryId(id).orElse(null);
        if (oryId == null) {
            oryId = createKratosIdentityIfConfigured(id, email).orElse(null);
        }
        if (rows.isEmpty()) {
            jdbc.update(
                    """
                    insert into identity_user
                        (id, password, last_login, is_superuser, email, display_name,
                         is_active, is_staff, ory_id, security_version, created_at, updated_at)
                    values (?, '!', null, true, ?, ?, true, true, ?, 1, ?, ?)
                    """,
                    id,
                    email,
                    properties.superadminNameOrDefault(),
                    oryId,
                    now(),
                    now()
            );
            return id;
        }
        jdbc.update(
                """
                update identity_user
                   set display_name = ?, is_active = true, is_staff = true,
                       is_superuser = true, ory_id = coalesce(ory_id, ?), updated_at = ?
                 where id = ?
                """,
                properties.superadminNameOrDefault(),
                oryId,
                now(),
                id
        );
        return id;
    }

    private Optional<UUID> existingOryId(UUID userId) {
        List<UUID> rows = jdbc.queryForList(
                "select ory_id from identity_user where id = ? and ory_id is not null limit 1",
                UUID.class,
                userId
        );
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.getFirst());
    }

    private Optional<UUID> createKratosIdentityIfConfigured(UUID userId, String email) {
        String password = bootstrapPassword();
        if (password.isBlank()) {
            log.info("Skipped Kratos bootstrap identity for {} because no bootstrap password is configured.", email);
            return Optional.empty();
        }
        ObjectNode traits = objectMapper.createObjectNode();
        traits.put("email", email);
        traits.put("name", properties.superadminNameOrDefault());

        ObjectNode passwordConfig = objectMapper.createObjectNode();
        passwordConfig.put("password", password);
        ObjectNode passwordNode = objectMapper.createObjectNode();
        passwordNode.set("config", passwordConfig);
        ObjectNode credentials = objectMapper.createObjectNode();
        credentials.set("password", passwordNode);

        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("qts_user_id", userId.toString());
        metadata.put("bootstrap_superadmin", true);
        metadata.put("requires_enrollment", true);
        metadata.put("enrollment_required_at", Instant.now().toString());

        ArrayNode verifiable = objectMapper.createArrayNode();
        ObjectNode emailAddress = objectMapper.createObjectNode();
        emailAddress.put("value", email);
        emailAddress.put("via", "email");
        emailAddress.put("verified", true);
        emailAddress.put("status", "completed");
        verifiable.add(emailAddress);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("schema_id", "qts");
        payload.put("state", "active");
        payload.set("traits", traits);
        payload.set("credentials", credentials);
        payload.set("metadata_admin", metadata);
        payload.set("verifiable_addresses", verifiable);

        try {
            ObjectNode response = restClient.post()
                    .uri(URI.create(ory.kratosAdminUrlOrDefault() + "/admin/identities"))
                    .body(payload)
                    .retrieve()
                    .body(ObjectNode.class);
            if (response == null || response.path("id").asText("").isBlank()) {
                throw new IllegalStateException("Kratos did not return an identity id.");
            }
            return Optional.of(UUID.fromString(response.path("id").asText()));
        } catch (RestClientResponseException error) {
            throw new IllegalStateException("Unable to create bootstrap Kratos identity: HTTP "
                    + error.getStatusCode().value(), error);
        }
    }

    private String bootstrapPassword() {
        if (properties.superadminPassword() != null && !properties.superadminPassword().isBlank()) {
            return normalizePassword(properties.superadminPassword());
        }
        if (properties.superadminPasswordFile() == null || properties.superadminPasswordFile().isBlank()) {
            return "";
        }
        Path path = Path.of(properties.superadminPasswordFile()).toAbsolutePath().normalize();
        if (!properties.allowWorkspaceSecretFile() && path.toString().contains(".secrets")) {
            throw new IllegalStateException("Refusing to read workspace .secrets bootstrap password in Spring production path.");
        }
        try {
            return normalizePassword(Files.readString(path));
        } catch (Exception error) {
            throw new IllegalStateException("Unable to read bootstrap superadmin password file.", error);
        }
    }

    private String normalizePassword(String value) {
        String normalized = value == null ? "" : value.replace("\r", "").replace("\n", "").trim();
        int marker = normalized.indexOf("password=");
        return marker >= 0 ? normalized.substring(marker + "password=".length()).trim() : normalized;
    }

    private UUID ensureMembership(UUID tenantId, UUID userId) {
        List<UUID> rows = jdbc.queryForList(
                "select id from identity_membership where tenant_id = ? and user_id = ? limit 1",
                UUID.class,
                tenantId,
                userId
        );
        if (!rows.isEmpty()) {
            jdbc.update(
                    """
                    update identity_membership
                       set title = ?, department = 'QTS Global', status = 'active', updated_at = ?
                     where id = ?
                    """,
                    properties.superadminTitleOrDefault(),
                    now(),
                    rows.getFirst()
            );
            return rows.getFirst();
        }
        UUID id = stableUuid("membership:" + tenantId + ":" + userId);
        jdbc.update(
                """
                insert into identity_membership
                    (id, tenant_id, user_id, department, title, status, policy_version, created_at, updated_at)
                values (?, ?, ?, 'QTS Global', ?, 'active', 1, ?, ?)
                """,
                id,
                tenantId,
                userId,
                properties.superadminTitleOrDefault(),
                now(),
                now()
        );
        return id;
    }

    private void ensureMembershipRole(UUID membershipId, UUID roleId, UUID assignedBy) {
        Integer count = jdbc.queryForObject(
                "select count(*) from identity_membershiprole where membership_id = ? and role_id = ?",
                Integer.class,
                membershipId,
                roleId
        );
        if (count == null || count == 0) {
            jdbc.update(
                    "insert into identity_membershiprole (membership_id, role_id, assigned_by_id, created_at) values (?, ?, ?, ?)",
                    membershipId,
                    roleId,
                    assignedBy,
                    now()
            );
        }
    }

    private void ensureApplicationAssignment(UUID membershipId, UUID applicationId) {
        Integer updated = jdbc.update(
                "update identity_applicationassignment set is_enabled = true where membership_id = ? and application_id = ?",
                membershipId,
                applicationId
        );
        if (updated == 0) {
            jdbc.update(
                    """
                    insert into identity_applicationassignment
                        (membership_id, application_id, is_enabled, last_accessed_at, created_at)
                    values (?, ?, true, null, ?)
                    """,
                    membershipId,
                    applicationId,
                    now()
            );
        }
    }

    private void ensureHrmEmployeeLink(UUID tenantId, UUID userId, UUID membershipId) {
        if (!tableExists("identity_hrmemployeelink")) {
            return;
        }
        String employeeCode = properties.superadminEmployeeCodeOrDefault();
        UUID employeeId = stableUuid("hrm-employee:" + tenantId + ":" + employeeCode);
        Integer updatedByEmployeeCode = jdbc.update(
                """
                update identity_hrmemployeelink
                   set user_id = ?, membership_id = ?, employee_id = ?, status = 'active',
                       source = coalesce(nullif(source, ''), 'spring-bootstrap'), updated_at = ?
                 where tenant_id = ? and employee_code = ?
                """,
                userId,
                membershipId,
                employeeId,
                now(),
                tenantId,
                employeeCode
        );
        if (updatedByEmployeeCode > 0) {
            return;
        }
        Integer count = jdbc.queryForObject(
                "select count(*) from identity_hrmemployeelink where tenant_id = ? and membership_id = ?",
                Integer.class,
                tenantId,
                membershipId
        );
        if (count != null && count > 0) {
            jdbc.update(
                    """
                    update identity_hrmemployeelink
                       set employee_code = ?, status = 'active', source = coalesce(nullif(source, ''), 'spring-bootstrap'),
                           updated_at = ?
                     where tenant_id = ? and membership_id = ?
                    """,
                    employeeCode,
                    now(),
                    tenantId,
                    membershipId
            );
            return;
        }
        jdbc.update(
                """
                insert into identity_hrmemployeelink
                    (id, tenant_id, user_id, membership_id, employee_id, employee_code, status, source, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, 'active', 'spring-bootstrap', ?, ?)
                """,
                stableUuid("hrm-link:" + tenantId + ":" + userId),
                tenantId,
                userId,
                membershipId,
                employeeId,
                employeeCode,
                now(),
                now()
        );
    }

    private String json(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Unable to serialize bootstrap JSON.", error);
        }
    }

    private String jsonSql(String template) {
        String marker = isPostgres() ? "?::jsonb" : "?";
        return template.formatted(marker, marker, marker);
    }

    private boolean isPostgres() {
        try (Connection connection = Objects.requireNonNull(jdbc.getDataSource()).getConnection()) {
            return connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgresql");
        } catch (SQLException error) {
            return false;
        }
    }

    private boolean tableExists(String table) {
        try {
            return Boolean.TRUE.equals(jdbc.queryForObject(
                    "select exists (select 1 from information_schema.tables where table_name = ?)",
                    Boolean.class,
                    table
            ));
        } catch (RuntimeException error) {
            return false;
        }
    }

    private boolean columnIsUuid(String table, String column) {
        List<String> rows = jdbc.queryForList(
                """
                select data_type
                  from information_schema.columns
                 where table_name = ? and column_name = ?
                 limit 1
                """,
                String.class,
                table,
                column
        );
        return !rows.isEmpty() && rows.getFirst().toLowerCase().contains("uuid");
    }

    private UUID stableUuid(String key) {
        return UUID.nameUUIDFromBytes(("qts:" + key).getBytes(StandardCharsets.UTF_8));
    }

    private static Timestamp now() {
        return Timestamp.from(Instant.now());
    }

    private Map<String, BootstrapApplication> applications() {
        Map<String, BootstrapApplication> apps = new LinkedHashMap<>();
        apps.put("qts-portal", new BootstrapApplication(
                properties.portalClientIdOrDefault(),
                "Cổng thông tin QTS",
                "Không gian vận hành doanh nghiệp",
                "squares-2x2",
                List.of("portal.view_dashboard"),
                List.of(properties.portalRedirectUri(), properties.portalPostLogoutRedirectUri())
        ));
        apps.put("qts-hrm", new BootstrapApplication(
                properties.hrmClientIdOrDefault(),
                "QTS HRM",
                "Quản lý nhân sự",
                "user-group",
                List.of("hrm.employee.read"),
                List.of(properties.hrmRedirectUri(), properties.hrmPostLogoutRedirectUri())
        ));
        apps.put("qts-analytics", new BootstrapApplication(
                "qts-analytics",
                "QTS Analytics",
                "Phân tích và báo cáo điều hành",
                "chart-bar",
                List.of("analytics.view_reports"),
                List.of()
        ));
        return apps;
    }

    private static Map<String, String> permissions() {
        Map<String, String> items = new LinkedHashMap<>();
        items.put("portal.view_dashboard", "Xem tổng quan cổng thông tin");
        items.put("portal.view_projects", "Xem dự án");
        items.put("crm.view_customer", "Xem khách hàng CRM");
        items.put("crm.edit_customer", "Chỉnh sửa khách hàng CRM");
        items.put("crm.delete_customer", "Xóa khách hàng CRM");
        items.put("hr.view_people", "Xem danh bạ nhân sự");
        items.put("finance.view_invoice", "Xem hóa đơn");
        items.put("finance.approve_payment", "Phê duyệt thanh toán");
        items.put("analytics.view_reports", "Xem báo cáo phân tích");
        items.put("identity.view_console", "Xem bảng điều khiển định danh");
        items.put("identity.manage_users", "Quản lý người dùng và tư cách thành viên");
        items.put("identity.manage_applications", "Quản lý ứng dụng");
        items.put("identity.manage_permissions", "Quản lý quyền");
        items.put("identity.view_audit", "Xem sự kiện kiểm tra");
        items.put("hrm.dashboard.hr", "Xem dashboard nhân sự");
        items.put("hrm.employee.read", "Xem hồ sơ nhân sự trong phạm vi");
        items.put("hrm.employee.create", "Tạo hồ sơ nhân sự");
        items.put("hrm.employee.edit", "Sửa hồ sơ nhân sự");
        items.put("hrm.employee.export", "Xuất danh sách nhân sự");
        items.put("hrm.employee.field.personal", "Xem dữ liệu cá nhân bảo mật");
        items.put("hrm.employee.field.salary", "Xem lương và phụ cấp");
        items.put("hrm.contract.read", "Xem hợp đồng");
        items.put("hrm.document.view", "Xem văn bản nhân sự");
        items.put("hrm.attendance.read", "Xem chấm công");
        items.put("hrm.leave.read", "Xem nghỉ phép trong phạm vi");
        items.put("hrm.leave.read_own", "Xem nghỉ phép của mình");
        items.put("hrm.leave.request.create", "Tạo đơn nghỉ phép");
        items.put("hrm.payroll.read", "Xem bảng lương");
        items.put("hrm.payslip.read_own", "Xem phiếu lương của mình");
        items.put("hrm.workflow.read", "Xem hàng đợi workflow");
        items.put("hrm.workflow.approve", "Phê duyệt bước workflow");
        items.put("hrm.report.read", "Xem danh mục báo cáo HRM");
        items.put("organization.company.read", "Xem pháp nhân");
        items.put("organization.branch.read", "Xem chi nhánh");
        items.put("organization.department.read", "Xem phòng ban");
        items.put("organization.position.read", "Xem chức danh");
        return items;
    }

    private static Map<String, String> roles() {
        Map<String, String> items = new LinkedHashMap<>();
        items.put("super-admin", "Quản trị viên cấp cao");
        items.put("organization-admin", "Quản trị tổ chức");
        items.put("manager", "Quản lý");
        items.put("employee", "Nhân viên");
        items.put("hr-manager", "HR Manager");
        items.put("hr-staff", "HR Staff");
        items.put("accountant", "Kế toán");
        return items;
    }

    private static Map<String, List<String>> roleGrants() {
        Map<String, List<String>> grants = new LinkedHashMap<>();
        grants.put("super-admin", new ArrayList<>(permissions().keySet()));
        grants.put("organization-admin", List.of(
                "portal.view_dashboard", "portal.view_projects", "crm.view_customer", "crm.edit_customer",
                "hr.view_people", "analytics.view_reports", "identity.view_console", "identity.manage_users",
                "identity.manage_applications", "identity.manage_permissions", "identity.view_audit"
        ));
        grants.put("manager", List.of(
                "portal.view_dashboard", "portal.view_projects", "crm.view_customer", "crm.edit_customer",
                "hr.view_people", "analytics.view_reports", "hrm.employee.read", "hrm.workflow.approve"
        ));
        grants.put("employee", List.of(
                "portal.view_dashboard", "hrm.employee.read", "hrm.leave.read_own",
                "hrm.leave.request.create", "hrm.payslip.read_own", "hrm.workflow.read"
        ));
        grants.put("hr-manager", List.of(
                "hrm.dashboard.hr", "hrm.employee.read", "hrm.employee.create", "hrm.employee.edit",
                "hrm.employee.export", "hrm.contract.read", "hrm.document.view", "hrm.attendance.read",
                "hrm.leave.read", "hrm.payroll.read", "hrm.workflow.approve", "hrm.report.read",
                "organization.company.read", "organization.branch.read", "organization.department.read",
                "organization.position.read"
        ));
        grants.put("hr-staff", List.of(
                "hrm.dashboard.hr", "hrm.employee.read", "hrm.employee.create", "hrm.employee.edit",
                "hrm.contract.read", "hrm.document.view", "hrm.attendance.read", "hrm.leave.read",
                "hrm.workflow.read", "organization.company.read", "organization.department.read"
        ));
        grants.put("accountant", List.of(
                "hrm.employee.read", "hrm.employee.field.salary", "hrm.payroll.read", "hrm.payslip.read_own",
                "organization.company.read"
        ));
        return grants;
    }

    private record BootstrapApplication(
            String clientId,
            String name,
            String description,
            String icon,
            List<String> requiredPermissions,
            List<String> redirectUris
    ) {
        private BootstrapApplication {
            redirectUris = redirectUris == null
                    ? List.of()
                    : redirectUris.stream().filter(value -> value != null && !value.isBlank()).toList();
        }
    }
}
