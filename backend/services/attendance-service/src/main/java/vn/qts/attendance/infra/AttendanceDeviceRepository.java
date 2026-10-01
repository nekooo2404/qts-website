package vn.qts.attendance.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import vn.qts.attendance.domain.AttendanceDevice;

@Repository
public class AttendanceDeviceRepository {
    private final JdbcTemplate jdbc;

    public AttendanceDeviceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AttendanceDevice insert(
            UUID tenantId,
            String deviceCode,
            String kind,
            UUID branchId,
            byte[] publicKey,
            String keyAlg
    ) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.update(
                """
                insert into attendance_devices
                    (id, tenant_id, device_code, kind, branch_id, public_key, key_alg,
                     status, version, revoked_at, revoke_reason, last_seen_at,
                     last_sync_cursor, clock_anchor_server_time, created_at)
                values (?, ?, ?, ?, ?, ?, ?, 'active', 1, null, '', null, null, null, ?)
                """,
                id, tenantId, deviceCode, kind, branchId, publicKey, keyAlg, now
        );
        return findByIdAndTenant(id, tenantId)
                .orElseThrow(() -> new IllegalStateException("Created attendance device cannot be read"));
    }

    public Optional<AttendanceDevice> findById(UUID id) {
        return query("select * from attendance_devices where id = ?", id).stream().findFirst();
    }

    public Optional<AttendanceDevice> findByIdAndTenant(UUID id, UUID tenantId) {
        return query(
                "select * from attendance_devices where id = ? and tenant_id = ?",
                id,
                tenantId
        ).stream().findFirst();
    }

    public boolean revoke(UUID id, UUID tenantId, int expectedVersion, String status, String reason, Instant revokedAt) {
        return jdbc.update(
                """
                update attendance_devices
                   set status = ?, revoked_at = ?, revoke_reason = ?, version = version + 1
                 where id = ? and tenant_id = ? and version = ?
                """,
                status, revokedAt, reason, id, tenantId, expectedVersion
        ) == 1;
    }

    public void updateCursor(UUID id, Instant lastSeenAt, UUID cursor) {
        jdbc.update(
                """
                update attendance_devices
                   set last_seen_at = ?, clock_anchor_server_time = ?, last_sync_cursor = ?
                 where id = ?
                """,
                lastSeenAt, lastSeenAt, cursor, id
        );
    }

    private List<AttendanceDevice> query(String sql, Object... args) {
        return jdbc.query(sql, mapper(), args);
    }

    private RowMapper<AttendanceDevice> mapper() {
        return (rs, rowNum) -> new AttendanceDevice(
                rs.getObject("id", UUID.class),
                rs.getObject("tenant_id", UUID.class),
                rs.getString("device_code"),
                rs.getString("kind"),
                rs.getObject("branch_id", UUID.class),
                rs.getBytes("public_key"),
                rs.getString("key_alg"),
                rs.getString("status"),
                rs.getInt("version"),
                instantOrNull(rs, "revoked_at"),
                rs.getString("revoke_reason"),
                instantOrNull(rs, "last_seen_at"),
                rs.getObject("last_sync_cursor", UUID.class),
                instantOrNull(rs, "clock_anchor_server_time"),
                instantOrNull(rs, "created_at")
        );
    }

    private Instant instantOrNull(ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }
}
