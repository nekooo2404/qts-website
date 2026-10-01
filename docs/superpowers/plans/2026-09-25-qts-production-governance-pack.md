# QTS Production Governance Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the approved P0/P1 production-readiness priorities into a reviewable QTS governance pack with traceability, ownership, measurable service objectives, operational controls, security evidence and acceptance gates.

**Architecture:** Documentation-first, evidence-backed and compatible with the existing Spring Boot microservices, Ory Kratos/Hydra, PostgreSQL, Redis, Docker Compose and frontend ownership boundaries. Runtime behavior will not be changed by this plan; unresolved organizational or security-policy decisions will be recorded as `Architecture Decision Required` with an explicit decision owner and evidence needed.

**Tech Stack:** Markdown, Mermaid, existing QTS Spring/Ory/Docker/Playwright/Maven verification commands.

**Spec:** User P0/P1 readiness priorities; reference inputs `Thiet ke chi tiet.docx`, `ARCHITECTURE.md`, `PRODUCT.md`, `docs/specs/README.md`, `docs/architecture/spring-production-readiness-runbook.md`, `docs/research/hrm-production-readiness.md`, `docs/hrm-design/*.md`, and `hrm_qts_docs/*.md`.

## Global Constraints

- Preserve all existing user worktree changes; add only focused governance documentation and navigation links.
- Do not claim system ownership, security classification, MFA policy approval, SLO/SLA targets, RPO/RTO targets or legal compliance as approved facts without an accountable approver.
- Keep Spring services and Ory Kratos/Hydra as the production architecture.
- Keep MFA opt-in for ordinary users by default; record privileged/external/third-party MFA as a decision requiring Security approval.
- Never place credentials, tokens, private keys or personal data in the new documents.
- Every control must identify its evidence source, owner role, review cadence and acceptance status.

---

### Task 1: Create the production-governance index and decision register

**Files:**
- Create: `docs/production-governance/README.md`
- Create: `docs/production-governance/decision-register.md`
- Modify: `docs/specs/README.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: existing QTS architecture, security and production gate documents.
- Produces: a stable index and a single register for decisions that cannot be inferred from code.

- [x] **Step 1: Add the governance index**

  List each P0/P1 document, its owner role, evidence source, status (`Draft`, `Evidence pending`, `Approved`), and release gate that consumes it.

- [x] **Step 2: Add the decision register**

  Include decision records for:

  - system owner and security owner;
  - information-system security level;
  - MFA policy;
  - SLO/SLA/RPO/RTO;
  - session concurrency policy;
  - database topology;
  - production network and WAF ownership.

  Each record must contain `Decision`, `Options`, `Recommendation`, `Impact`, `Approver`, `Due evidence`, and `Status`.

- [x] **Step 3: Link the pack from repository entry points**

  Add a short `Production governance` section to `docs/specs/README.md` and `README.md` without changing existing commands.

- [x] **Step 4: Verify links and secret hygiene**

  Run:

  ```powershell
  rg -n -i "password|secret|private.?key|access.?token|refresh.?token|bootstrap-superadmin" docs/production-governance
  rg -n "docs/production-governance" README.md docs/specs/README.md
  ```

  Expected: no secret values; both entry points link to the index.

### Task 2: Create the P0 requirements, ownership, classification and MFA pack

**Files:**
- Create: `docs/production-governance/01-requirements-traceability-matrix.md`
- Create: `docs/production-governance/02-ownership-and-system-classification.md`
- Create: `docs/production-governance/03-mfa-and-access-policy.md`

**Interfaces:**
- Consumes: `docs/hrm-design/*.md`, `frontend-portal/identity/IDENTITY_GATEWAY_UX_SPEC.md`, `hrm_qts_docs/HRM-QTS Unified Enterprise Management Ecosystem Requirements.md`, `Thiet ke chi tiet.docx` findings.
- Produces: traceable requirements and explicit owner/classification/MFA decisions.

- [x] **Step 1: Build the traceability matrix**

  Include rows for Identity login, Portal SSO, HRM protected API, employee access, document privacy, payroll FLS, leave workflow, lead consultation, notifications, audit logging, backup/restore, tenant isolation, accessibility and production deployment.

  Every row must have:

  ```text
  ID | Requirement | Source | Owner domain | API/event | UI | Test IDs | Acceptance evidence | Status
  ```

- [x] **Step 2: Define ownership and classification**

  Define role responsibilities without inventing people:

  ```text
  System owner: accountable business owner (approval required)
  Service owner: Engineering/platform owner per service
  Security owner: Security/IT owner (approval required)
  Data owner: HR, Identity, Lead or Finance owner per domain
  Operations owner: DevOps/SRE owner
  ```

  Document the evidence needed to classify QTS and the required review before production.

- [x] **Step 3: Define MFA and access policy**

  Preserve the current ordinary-user default of MFA off while specifying:

  - mandatory MFA candidates for administrators, Internet access and third parties;
  - TOTP and backup-code enrollment;
  - recovery and account-lockout rules;
  - session timeout and re-authentication requirements;
  - quarterly access review;
  - offboarding and immediate revocation.

  Mark policy approval as `Architecture Decision Required`.

- [x] **Step 4: Verify cross-references**

  Run:

  ```powershell
  rg -n "IDENTITY_REQUIRE_MFA|require_mfa|TOTP|AAL2|RBAC|Data Scope|Field-Level Security" docs/production-governance
  ```

  Expected: the documents preserve the existing QTS MFA behavior and reference the approval decision.

### Task 3: Define measurable reliability, data protection and audit controls

**Files:**
- Create: `docs/production-governance/04-slo-sla-rpo-rto.md`
- Create: `docs/production-governance/05-backup-restore-and-dr.md`
- Create: `docs/production-governance/06-audit-logging-and-retention.md`

**Interfaces:**
- Consumes: `docs/architecture/spring-production-readiness-runbook.md`, `scripts/backup.sh`, `scripts/restore-ory.sh`, `scripts/verify-ory-restore.sh`, `infra/ory/README.md`.
- Produces: measurable targets, backup/restore procedures and audit-log requirements.

- [x] **Step 1: Define target classes without declaring approval**

  Provide a proposed baseline table for Identity, HRM, Portal, Lead and supporting services covering availability, latency, error rate, RPO, RTO, support response and maintenance windows. Every target must be labelled `Proposed` until approved.

- [x] **Step 2: Define backup and restore evidence**

  Document:

  - PostgreSQL application, Hydra and Kratos backup scope;
  - secret/key backup separation;
  - encryption and access control;
  - retention tiers;
  - restore into an isolated environment;
  - checksum and table-count verification;
  - quarterly restore drill;
  - rollback safety and writer freeze.

  Reference the existing scripts rather than duplicating shell logic.

- [x] **Step 3: Define audit event schema and retention**

  Specify required fields:

  ```json
  {
    "eventId": "uuid",
    "occurredAt": "UTC timestamp",
    "requestId": "uuid",
    "actorSubject": "opaque id",
    "tenantId": "uuid",
    "action": "stable action code",
    "targetType": "domain type",
    "targetId": "opaque id",
    "decision": "allow|deny",
    "reasonCode": "stable code",
    "source": "service and client",
    "sensitivity": "internal|confidential|restricted"
  }
  ```

  Explicitly prohibit passwords, tokens, cookies, raw session IDs and unnecessary HR PII in logs.

- [x] **Step 4: Define evidence cadence**

  Add monthly log review, quarterly restore drill and annual security review as proposed operational cadences requiring owner approval.

### Task 4: Create the P0 acceptance and testing plan

**Files:**
- Create: `docs/production-governance/07-test-uat-oat-security-performance-plan.md`
- Create: `docs/production-governance/08-release-acceptance-checklist.md`

**Interfaces:**
- Consumes: existing Spring production gate, Playwright configs, Ory test setup and HRM API/design documents.
- Produces: executable test inventory and release evidence checklist.

- [x] **Step 1: Define test layers**

  Cover unit, integration, contract, browser SSO, UAT, OAT, performance, security, accessibility, backup/restore and disaster-recovery tests.

- [x] **Step 2: Add required scenario IDs**

  Include at minimum:

  ```text
  AUTH-001 password login
  AUTH-002 Portal-to-HRM SSO
  AUTH-003 logout/revocation
  AUTH-004 MFA policy paths
  AUTH-005 invalid audience/tenant denial
  HRM-001 employee read/create/update
  HRM-002 field-level salary denial
  HRM-003 cross-tenant denial
  LEAD-001 consultation submission and notification
  OPS-001 readiness/observability
  OPS-002 backup and isolated restore
  SEC-001 CSRF/Origin
  SEC-002 IDOR
  SEC-003 XSS/injection
  SEC-004 secret/dependency scan
  PERF-001 baseline/load/soak
  A11Y-001 WCAG 2.2 keyboard/focus/errors
  ```

- [x] **Step 3: Map each scenario to commands and evidence**

  Reference Maven tests, `npm run typecheck`, `npm run lint`, Playwright projects, Docker build, compose validation and readiness probes.

- [x] **Step 4: Add go/no-go rules**

  Release is blocked by any open critical/high security issue, failed tenant isolation, failed restore drill, failed auth flow, missing owner approval or missing evidence artifact.

### Task 5: Create the P1 topology, segmentation, data and threat-model pack

**Files:**
- Create: `docs/production-governance/09-production-deployment-topology.md`
- Create: `docs/production-governance/10-network-segmentation-and-trust-boundaries.md`
- Create: `docs/production-governance/11-data-classification-and-retention.md`
- Create: `docs/production-governance/12-threat-model.md`

**Interfaces:**
- Consumes: `ARCHITECTURE.md`, `docs/specs/README.md`, compose overlays, Ory configuration, HRM data model and attached DOCX.
- Produces: production topology, trust boundaries, data policy and threat register.

- [x] **Step 1: Add deployment topology**

  Provide a Mermaid diagram from Internet/WAF/reverse proxy through frontend, Identity/Ory, API services, PostgreSQL/Redis, event delivery, backup, monitoring and SIEM. Mark public, private and management paths.

- [x] **Step 2: Add segmentation rules**

  Define deny-by-default flows and required allowlist edges for browser, gateway, services, databases, Ory, management and backup zones.

- [x] **Step 3: Add data classification**

  Classify identity, employee, salary, contract, document, lead, audit and telemetry data with encryption, retention, access and export rules.

- [x] **Step 4: Add threat model**

  Cover credential theft, OAuth redirect/code interception, token replay, session fixation, CSRF, IDOR, cross-tenant access, SSRF, injection, supply-chain compromise, insider misuse, backup theft, log tampering and availability attacks. Add mitigations, evidence and residual risk owner.

### Task 6: Create the P1 operational readiness pack

**Files:**
- Create: `docs/production-governance/13-incident-response-runbook.md`
- Create: `docs/production-governance/14-penetration-test-plan.md`
- Create: `docs/production-governance/15-training-and-operations-handbook.md`
- Create: `docs/production-governance/16-access-review-procedure.md`

**Interfaces:**
- Consumes: existing rollback/runbook files, Identity/HRM ownership docs and production gate.
- Produces: operational procedures that can be rehearsed and audited.

- [x] **Step 1: Define incident response**

  Include severity, detection, triage, containment, eradication, recovery, communication, evidence preservation and post-incident review for SSO outage, token validation failure, suspected account compromise, data exposure, service outage and backup failure.

- [x] **Step 2: Define penetration-test scope**

  Specify authenticated/unauthenticated scope, OIDC flows, APIs, tenant isolation, admin paths, upload/download paths, rate limiting, headers, dependency and container assessment, rules of engagement, retest and acceptance.

- [x] **Step 3: Define training and operations**

  Cover end-user, HR operator, Identity administrator, DevOps/SRE and Security training; include runbooks, escalation contacts, change control, release, rollback, backup, restore and access provisioning.

- [x] **Step 4: Define access review**

  Specify monthly privileged review, quarterly all-user/application review, joiner/mover/leaver checks, evidence capture, exceptions, expiry and revocation.

### Task 7: Review, validate and hand off

**Files:**
- Modify: `docs/production-governance/README.md`

**Interfaces:**
- Consumes: all governance documents created in Tasks 1-6.
- Produces: a final coverage report with open decisions and verification evidence.

- [x] **Step 1: Run Markdown/link/secret checks**

  ```powershell
  rg -n "TBD|TODO|password=|secret=|private_key|access_token|refresh_token" docs/production-governance
  rg -n "\]\([^)]*\)" docs/production-governance
  ```

  Expected: no secret values; all unresolved decisions use explicit `Architecture Decision Required` records rather than hidden placeholders.

- [x] **Step 2: Run repository validation**

  ```powershell
  npm run typecheck
  npm run lint
  powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1 -SkipDockerBuild
  ```

  Documentation work must not regress existing checks.

- [x] **Step 3: Add handoff status**

  Record which P0/P1 artifacts are drafted, which evidence is still needed, who must approve them and which gates remain blocked.

- [x] **Step 4: Report completion without overstating readiness**

  State that the governance pack is implemented, while production approval remains conditional on the named human approvals and evidence.
