# QTS Production Governance Pack

This directory converts the P0/P1 production-readiness priorities into
reviewable artifacts for the QTS enterprise ecosystem.

The pack is intentionally separate from runtime code. It documents the
controls, ownership, evidence and approvals required around the existing
Spring Boot, Ory Kratos/Hydra, PostgreSQL, Redis, Docker and frontend
architecture.

## Status vocabulary

| Status | Meaning |
|---|---|
| `Draft` | The control or procedure is written but has not been approved |
| `Evidence pending` | The design exists, but runtime evidence or an owner decision is missing |
| `Approved` | An accountable owner has approved the control and the evidence is attached |
| `Blocked` | Release cannot proceed until the named decision or evidence exists |

No document in this pack grants production approval by itself.

## P0 deliverables

| Priority | Artifact | Primary owner role | Status |
|---|---|---|---|
| P0 | [Requirements Traceability Matrix](01-requirements-traceability-matrix.md) | Product + Engineering | Draft |
| P0 | [Ownership and system classification](02-ownership-and-system-classification.md) | Executive sponsor + Security | Evidence pending |
| P0 | [MFA and access policy](03-mfa-and-access-policy.md) | Security + Identity | Evidence pending |
| P0 | [SLO, SLA, RPO and RTO](04-slo-sla-rpo-rto.md) | SRE/Operations + Product | Evidence pending |
| P0 | [Backup, restore and DR](05-backup-restore-and-dr.md) | SRE/Operations | Evidence pending |
| P0 | [Audit logging and retention](06-audit-logging-and-retention.md) | Security + Platform | Evidence pending |
| P0 | [Test, UAT, OAT, security and performance plan](07-test-uat-oat-security-performance-plan.md) | QA + Security + Product | Draft |
| P0 | [Release acceptance checklist](08-release-acceptance-checklist.md) | Release manager | Draft |

## P1 deliverables

| Priority | Artifact | Primary owner role | Status |
|---|---|---|---|
| P1 | [Production deployment topology](09-production-deployment-topology.md) | Platform/SRE | Evidence pending |
| P1 | [Network segmentation and trust boundaries](10-network-segmentation-and-trust-boundaries.md) | Network/Security | Evidence pending |
| P1 | [Data classification and retention](11-data-classification-and-retention.md) | Data owners + Security | Evidence pending |
| P1 | [Threat model](12-threat-model.md) | Security + Engineering | Draft |
| P1 | [Incident response runbook](13-incident-response-runbook.md) | Security incident commander | Draft |
| P1 | [Penetration-test plan](14-penetration-test-plan.md) | Security | Draft |
| P1 | [Training and operations handbook](15-training-and-operations-handbook.md) | Operations + Product | Draft |
| P1 | [Access-review procedure](16-access-review-procedure.md) | Identity + Security | Draft |

## Decision and evidence register

[decision-register.md](decision-register.md) is the source of truth for
decisions that cannot be inferred from code, including system ownership,
security classification, MFA enforcement, reliability targets and topology.

## Source documents

- [QTS repository architecture](../../ARCHITECTURE.md)
- [QTS product context](../../PRODUCT.md)
- [Spring production runbook](../architecture/spring-production-readiness-runbook.md)
- [HRM production research](../research/hrm-production-readiness.md)
- [HRM domain model](../hrm-design/03-domain-model.md)
- [HRM API specification](../hrm-design/04-api-specification.md)
- [HRM permission matrix](../hrm-design/06-permission-matrix.md)
- [QTS ecosystem requirements](<../../hrm_qts_docs/HRM-QTS Unified Enterprise Management Ecosystem Requirements.md>)
- Attached detailed-design reference: `C:\Users\buiho\Downloads\Thiet ke chi tiet.docx`

## Release rule

The release manager may mark a release `Go` only when:

1. every P0 artifact is `Approved` or has an explicitly accepted exception;
2. critical and high security findings are closed or formally risk-accepted;
3. SSO, tenant isolation, protected APIs, backup/restore and rollback evidence
   are attached;
4. the decision register contains no unresolved blocking decision.

## Current handoff

The documentation pack is drafted and linked. Production approval remains
blocked until the following evidence exists:

- named system, security, data and operations owners;
- approved information-system security classification;
- signed MFA matrix, including privileged and external access;
- approved SLO/SLA/RPO/RTO values and measured baseline;
- encrypted backup retention and an isolated restore/DR report;
- central audit storage, redaction and retention evidence;
- completed UAT/OAT/security/performance/accessibility reports;
- approved production topology, segmentation and public-exposure scan;
- independent penetration-test report and remediation retest;
- current incident roster, training records and access-review evidence.

The pack distinguishes `Draft` and `Evidence pending` from `Approved`; no
unresolved decision is silently treated as complete.
