package vn.qts.identityadmin;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import vn.qts.identityadmin.application.IdentityBootstrapService;

@SpringBootTest
@ActiveProfiles("test")
class IdentityBootstrapServiceTest {
    @Autowired
    IdentityBootstrapService bootstrap;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void cleanDatabase() {
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
    }

    @Test
    void bootstrapIsIdempotentAndSeedsEnterpriseIdentityBaseline() {
        bootstrap.ensureBaseline();
        bootstrap.ensureBaseline();

        Integer tenants = jdbc.queryForObject(
                "select count(*) from identity_tenant where slug = 'qts-global'",
                Integer.class
        );
        Integer superAdmins = jdbc.queryForObject(
                "select count(*) from identity_user where email = 'superadmin@qts.com' and is_superuser = true and is_staff = true",
                Integer.class
        );
        Integer applications = jdbc.queryForObject(
                "select count(*) from identity_application where slug in ('qts-portal', 'qts-hrm', 'qts-analytics')",
                Integer.class
        );
        Integer manageUserGrants = jdbc.queryForObject(
                """
                select count(*)
                  from identity_role r
                  join identity_rolepermission rp on rp.role_id = r.id
                  join identity_permission p on p.id = rp.permission_id
                 where r.code = 'super-admin'
                   and p.code = 'identity.manage_users'
                """,
                Integer.class
        );
        Integer assignments = jdbc.queryForObject(
                """
                select count(*)
                  from identity_applicationassignment aa
                  join identity_membership m on m.id = aa.membership_id
                  join identity_user u on u.id = m.user_id
                 where u.email = 'superadmin@qts.com'
                   and aa.is_enabled = true
                """,
                Integer.class
        );
        Integer hrmLinks = jdbc.queryForObject(
                """
                select count(*)
                  from identity_hrmemployeelink l
                  join identity_user u on u.id = l.user_id
                 where u.email = 'superadmin@qts.com'
                   and l.employee_code = 'QTS-00001'
                """,
                Integer.class
        );

        assertThat(tenants).isEqualTo(1);
        assertThat(superAdmins).isEqualTo(1);
        assertThat(applications).isEqualTo(3);
        assertThat(manageUserGrants).isEqualTo(1);
        assertThat(assignments).isEqualTo(3);
        assertThat(hrmLinks).isEqualTo(1);
    }

    @Test
    void bootstrapReclaimsExistingSuperadminEmployeeCodeLink() {
        bootstrap.ensureBaseline();

        UUID tenantId = jdbc.queryForObject("select id from identity_tenant where slug = 'qts-global'", UUID.class);
        UUID previousUserId = UUID.fromString("00000000-0000-7000-8000-000000000101");
        UUID previousMembershipId = UUID.fromString("00000000-0000-7000-8000-000000000102");

        jdbc.update(
                """
                insert into identity_user (id, email, display_name, is_active, is_staff, created_at, updated_at)
                values (?, 'previous-superadmin@qts.com', 'Previous Super Admin', true, true, current_timestamp, current_timestamp)
                """,
                previousUserId
        );
        jdbc.update(
                """
                insert into identity_membership (id, tenant_id, user_id, title, status, created_at, updated_at)
                values (?, ?, ?, 'Legacy Admin', 'active', current_timestamp, current_timestamp)
                """,
                previousMembershipId,
                tenantId,
                previousUserId
        );
        jdbc.update(
                """
                update identity_hrmemployeelink
                   set user_id = ?, membership_id = ?, source = 'legacy-bootstrap', updated_at = current_timestamp
                 where tenant_id = ? and employee_code = 'QTS-00001'
                """,
                previousUserId,
                previousMembershipId,
                tenantId
        );

        bootstrap.ensureBaseline();

        Integer superadminLinks = jdbc.queryForObject(
                """
                select count(*)
                  from identity_hrmemployeelink l
                  join identity_user u on u.id = l.user_id
                 where l.tenant_id = ?
                   and l.employee_code = 'QTS-00001'
                   and u.email = 'superadmin@qts.com'
                """,
                Integer.class,
                tenantId
        );
        Integer totalLinksForCode = jdbc.queryForObject(
                "select count(*) from identity_hrmemployeelink where tenant_id = ? and employee_code = 'QTS-00001'",
                Integer.class,
                tenantId
        );

        assertThat(superadminLinks).isEqualTo(1);
        assertThat(totalLinksForCode).isEqualTo(1);
    }
}
