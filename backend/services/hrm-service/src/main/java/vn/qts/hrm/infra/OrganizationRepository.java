package vn.qts.hrm.infra;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.qts.hrm.domain.Branch;
import vn.qts.hrm.domain.Company;
import vn.qts.hrm.domain.Position;

@Repository
public class OrganizationRepository {
    private final JdbcTemplate jdbc;

    public OrganizationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Company> companies(UUID tenantId, String status, int page, int pageSize) {
        StringBuilder sql = new StringBuilder("""
                select id, code, name, status, version
                  from hrm.companies
                 where tenant_id = ?
                """);
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        if (status != null && !status.isBlank()) {
            sql.append(" and status = ?");
            args.add(status.trim());
        }
        sql.append(" order by name, id limit ? offset ?");
        args.add(pageSize);
        args.add((long) (page - 1) * pageSize);
        return jdbc.query(sql.toString(), (rs, ignored) -> new Company(
                rs.getObject("id", UUID.class),
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("status"),
                rs.getLong("version")
        ), args.toArray());
    }

    public List<Branch> branches(UUID tenantId, UUID companyId, int page, int pageSize) {
        StringBuilder sql = new StringBuilder("""
                select id, company_id, code, name, status, version
                  from hrm.branches
                 where tenant_id = ?
                """);
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        if (companyId != null) {
            sql.append(" and company_id = ?");
            args.add(companyId);
        }
        sql.append(" order by name, id limit ? offset ?");
        args.add(pageSize);
        args.add((long) (page - 1) * pageSize);
        return jdbc.query(sql.toString(), (rs, ignored) -> new Branch(
                rs.getObject("id", UUID.class),
                rs.getObject("company_id", UUID.class),
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("status"),
                rs.getLong("version")
        ), args.toArray());
    }

    public List<Position> positions(
            UUID tenantId,
            UUID departmentId,
            String title,
            int page,
            int pageSize
    ) {
        StringBuilder sql = new StringBuilder("""
                select id, department_id, reports_to_id, code, title, status, version
                  from hrm.positions
                 where tenant_id = ?
                """);
        List<Object> args = new ArrayList<>();
        args.add(tenantId);
        if (departmentId != null) {
            sql.append(" and department_id = ?");
            args.add(departmentId);
        }
        if (title != null && !title.isBlank()) {
            sql.append(" and lower(title) like ?");
            args.add("%" + title.trim().toLowerCase() + "%");
        }
        sql.append(" order by title, id limit ? offset ?");
        args.add(pageSize);
        args.add((long) (page - 1) * pageSize);
        return jdbc.query(sql.toString(), (rs, ignored) -> new Position(
                rs.getObject("id", UUID.class),
                rs.getObject("department_id", UUID.class),
                rs.getObject("reports_to_id", UUID.class),
                rs.getString("code"),
                rs.getString("title"),
                rs.getString("status"),
                rs.getLong("version")
        ), args.toArray());
    }
}
