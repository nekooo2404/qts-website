# QTS Architecture and Governance Decision Register

This register prevents policy assumptions from silently becoming production
behavior. A decision marked `Architecture Decision Required` is a release
blocker until the accountable approver records the outcome.

## Decision records

### ADR-GOV-001 — System owner and security owner

**Status:** Architecture Decision Required  
**Decision:** Assign one accountable business system owner and one accountable
security owner for the QTS ecosystem. Service owners remain responsible for
their bounded services but cannot approve their own security exceptions.

**Options:**

1. One enterprise product owner plus a separate central security owner.
2. HRM owner for HRM data, Identity owner for identity data, and a central
   security owner.
3. A managed-service provider owns operations while QTS retains business and
   security accountability.

**Recommendation:** Option 1 for cross-application policy, with named data
owners for HR, Identity, Lead and Finance domains.

**Required evidence:** signed responsibility assignment, escalation contacts,
on-call roster and service ownership map.  
**Approver:** executive sponsor and security lead.

### ADR-GOV-002 — Information-system security level

**Status:** Architecture Decision Required  
**Decision:** Determine the approved information-system security level for
Identity, HRM, Portal and supporting services before production launch.

**Options:**

1. Classify the ecosystem as one system at the highest applicable level.
2. Classify Identity and each business domain separately with shared controls.
3. Use a lower level for development and a formally assessed level for
   production.

**Recommendation:** Option 2, because data ownership and impact differ across
   Identity, HR, Lead and future domains.

**Required evidence:** asset inventory, data classification, impact analysis,
approved security dossier and scope of any external assessment.  
**Approver:** security owner and system owner.

### ADR-GOV-003 — MFA enforcement policy

**Status:** Architecture Decision Required  
**Decision:** Keep MFA opt-in for ordinary users by default, while requiring
MFA where risk or policy demands it.

**Options:**

1. MFA off for everyone unless a user enables it.
2. MFA required for administrators, external access and third parties; opt-in
   for ordinary internal users.
3. MFA required for every user.

**Recommendation:** Option 2. It preserves the current product requirement
while addressing the detailed-design requirement for privileged and
untrusted access.

**Required evidence:** approved policy, Kratos AAL mapping, recovery process,
exception register and test results.  
**Approver:** security owner.

### ADR-GOV-004 — Reliability objectives

**Status:** Architecture Decision Required  
**Decision:** Approve availability, latency, error-budget, maintenance,
RPO and RTO targets per service tier.

**Options:**

1. One target for the whole ecosystem.
2. Tiered targets: Identity, business APIs, asynchronous workers and
   non-critical frontends.
3. Per-tenant contracted targets.

**Recommendation:** Option 2 initially; move to option 3 only where a
contract requires it.

**Required evidence:** traffic baseline, capacity model, monitoring dashboard,
restore drill and signed service-level objectives.  
**Approver:** product owner, SRE owner and security owner where recovery
controls affect risk.

### ADR-GOV-005 — Database topology and schema ownership

**Status:** Architecture Decision Required  
**Decision:** Keep domain ownership at the service boundary even when services
share a PostgreSQL cluster.

**Options:**

1. One shared schema with unrestricted service access.
2. One PostgreSQL cluster with a schema/database per service and Flyway
   ownership.
3. Separate PostgreSQL clusters for every service.

**Recommendation:** Option 2 for the current scale, with a migration path to
separate clusters for high-risk or high-volume domains.

**Required evidence:** grants matrix, migration ownership, backup scope,
cross-service API/event contracts and restore procedure.  
**Approver:** platform architect and data owner.

### ADR-GOV-006 — Production network and gateway ownership

**Status:** Architecture Decision Required  
**Decision:** Approve who owns the public edge, WAF, TLS certificates,
network segmentation, Ory private connectivity and management access.

**Options:**

1. Host Caddy with external WAF and private service network.
2. Managed ingress/WAF with private Kubernetes or cloud networking.
3. Single public Docker host with host firewall only.

**Recommendation:** Option 1 for the current compose cutover, provided the
WAF, management and backup controls are independently evidenced.

**Required evidence:** network diagram, firewall rules, certificate rotation
procedure, admin access path and external exposure scan.  
**Approver:** network owner and security owner.

## How to close a decision

A decision is closed only when the register records:

- selected option;
- approver and approval date;
- affected services and environments;
- required implementation changes;
- evidence location;
- rollback or exception plan.

