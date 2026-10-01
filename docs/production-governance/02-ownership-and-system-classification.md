# Ownership and Information-System Classification

This document defines the roles needed to operate QTS safely. It deliberately
uses role names instead of inventing individual names or claiming approval.

## Ownership model

| Role | Accountability | Minimum evidence | Current status |
|---|---|---|---|
| Executive sponsor | Approves business scope, funding, risk acceptance and go-live | Signed charter and risk decisions | Architecture Decision Required |
| System owner | Accountable for the QTS ecosystem outcome and service level | Named owner, backup owner and escalation path | Architecture Decision Required |
| Security owner | Approves security classification, policies, exceptions and assessment scope | Security dossier approval | Architecture Decision Required |
| Product owner | Owns HRM/Portal/Identity product requirements and UAT sign-off | Approved product backlog and UAT sign-off | Evidence pending |
| Identity owner | Owns Kratos/Hydra configuration, user lifecycle and application assignment | Identity runbook and change log | Evidence pending |
| HR data owner | Owns employee, contract, attendance, leave and payroll data policy | Data dictionary and access policy | Architecture Decision Required |
| Lead data owner | Owns consultation and CRM lead data | Lead retention and access policy | Architecture Decision Required |
| Platform/SRE owner | Owns runtime, deploy, observability, backup and recovery | On-call roster and runbooks | Evidence pending |
| Network owner | Owns edge, WAF, TLS, segmentation and management paths | Firewall/WAF evidence | Architecture Decision Required |
| QA/release owner | Owns release evidence, test execution and go/no-go packet | Acceptance checklist and test reports | Evidence pending |
| Incident commander | Coordinates security and availability incidents | Incident roster and exercise report | Evidence pending |

## RACI baseline

`R` = Responsible, `A` = Accountable, `C` = Consulted, `I` = Informed.

| Activity | System owner | Security | Product | Identity | HR data | Platform/SRE | QA/Release |
|---|---:|---:|---:|---:|---:|---:|---:|
| Business scope | A | C | R | I | C | I | C |
| Security classification | A | R | C | C | C | C | I |
| MFA policy | A | R | C | R | I | C | C |
| SLO/RPO/RTO | A | C | C | C | C | R | C |
| Production topology | A | C | I | C | I | R | C |
| Data access policy | A | R | C | C | R | C | I |
| Release go/no-go | A | C | C | C | C | C | R |
| Security exception | A | R | C | C | C | C | I |
| Incident response | A | R | I | C | C | R | C |

## System boundary

The QTS production system includes:

- public marketing and consultation entry points;
- Portal launcher and authenticated workspace;
- Identity UI and server-side Identity proxy;
- Ory Kratos identity, password, TOTP and browser sessions;
- Ory Hydra OAuth2/OIDC authorization;
- Spring services for Lead, Event, Attendance, Identity Admin, Identity
  Bridge and HRM;
- PostgreSQL databases, Redis/event infrastructure, object storage and
  operational tooling;
- reverse proxy, TLS, WAF and monitoring components that carry production
  traffic.

External systems, mail providers, identity providers and customer browsers are
trust boundaries, not components owned by QTS.

## Classification procedure

Before production approval, the security owner must record:

1. assets and data flows;
2. confidentiality, integrity and availability impact;
3. affected legal entities and tenants;
4. privileged and external access paths;
5. dependencies and shared controls;
6. selected information-system security level;
7. required independent assessment and review frequency.

The detailed-design reference requires security controls aligned to the
approved level, including account control, encryption, logging, backup,
vulnerability management and periodic assessment. QTS must not claim a level
until the dossier is approved.

