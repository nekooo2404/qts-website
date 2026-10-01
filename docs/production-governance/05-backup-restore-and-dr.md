# Backup, Restore and Disaster Recovery

## Scope

The current QTS backup tooling captures three PostgreSQL databases:

- application database;
- Hydra database;
- Kratos database.

The existing `scripts/backup.sh` writes a complete snapshot marker only after
all three dumps succeed. `scripts/restore-ory.sh` requires an explicit
confirmation and keeps writers stopped after restore. `scripts/verify-ory-
restore.sh` restores into an isolated private PostgreSQL container and verifies
table counts and SHA-256 hashes.

These scripts are implementation assets. They do not, by themselves, prove
that a production backup policy, secret backup, retention policy or recovery
exercise has been approved.

## Backup policy

### What must be backed up

| Asset | Frequency | Protection |
|---|---|---|
| Application and service databases | Daily incremental or logical backup plus approved full backup | Encrypted, access-controlled, isolated |
| Hydra and Kratos databases | Same as application policy, with tighter RPO if Tier 0 | Encrypted and restored with matching keys |
| Ory signing/encryption secrets | Secret-manager backup according to key policy | Separate custody and access approval |
| Production configuration | Versioned configuration plus encrypted secret references | No plaintext secrets |
| Object/document storage | Versioned snapshot or replication | Malware-safe and separately retained |
| Deployment artifacts | Immutable image digest, compose revision and migration version | Release archive |
| Audit logs | Central protected storage | Tamper-evident retention |

The current `KEEP=7` script default is a retention implementation detail, not
the approved retention period.

## Restore procedure

1. Declare a recovery incident and record the request ID.
2. Freeze writers and confirm the target snapshot and key version.
3. Verify snapshot marker, file size, checksum and access authorization.
4. Restore into an isolated environment first.
5. Run schema, migration, table-count, integrity and application smoke checks.
6. Validate Kratos/Hydra key compatibility and OIDC metadata.
7. Validate Identity session, Portal SSO, HRM protected API and logout.
8. Approve production cutover or reject the snapshot.
9. Restore production with the documented writer freeze.
10. Run post-restore smoke tests and record actual RTO.

Never restore an application database without the matching Ory secrets and
without a rollback snapshot of the current state.

## Recovery exercises

| Exercise | Cadence | Pass condition | Evidence |
|---|---|---|---|
| Isolated database restore | Quarterly | All databases restore with matching integrity counts | Restore manifest |
| Ory key/session recovery | Quarterly | Existing sessions and new login behavior match the runbook | Auth smoke report |
| Service rollback | Each release train | Previous image/config starts without manual data edits | Rollback report |
| Full disaster recovery | At least annually | Approved RTO/RPO met and all critical flows pass | DR exercise report |

## Required controls

- Backups are encrypted at rest and in transit.
- Backup credentials use least privilege and are rotated.
- Backup storage is not writable by application runtime identities.
- Restore operators are separated from application deployers where practical.
- Recovery logs never contain passwords, tokens, cookies or private keys.
- Failed or incomplete snapshots raise an alert; a partial dump is never
  treated as restorable evidence.

## Evidence required before approval

- approved backup retention schedule;
- secret/key recovery procedure;
- isolated restore report;
- measured RPO and RTO;
- DR exercise report;
- owner sign-off and exception record.

