# Training and Operations Handbook

## Audiences

| Audience | Required capability |
|---|---|
| Employee/end user | Login, SSO, MFA settings, session expiry, logout and safe data handling |
| HR operator | Employee lifecycle, scope, FLS, documents, workflows and audit awareness |
| Identity administrator | User lifecycle, application assignment, role/grant, Kratos/Hydra flow and recovery |
| Platform/SRE | Deploy, health, logs, metrics, backup, restore, rollback and incident response |
| Security reviewer | Threat model, access reviews, audit queries, findings and risk acceptance |
| Release/Product | UAT/OAT, change control, release evidence and go/no-go |

## Training modules

### End user

- choose the correct QTS application from the launcher;
- recognize the trusted Identity origin;
- use password managers and TOTP safely;
- report suspicious prompts and session behavior;
- sign out on shared devices;
- understand generic login errors and support correlation IDs.

### HR operator

- respect tenant, company, manager and self data scope;
- reveal protected fields only for an approved purpose;
- use workflow actions only for assigned requests;
- upload approved document types;
- avoid exporting more data than necessary;
- verify audit feedback after sensitive actions.

### Identity administrator

- provision, move and de-provision users;
- assign applications and minimum roles;
- handle forced MFA/enrollment policy;
- revoke sessions and recover accounts;
- validate exact redirect/client configuration;
- never share passwords or copy secrets into tickets.

### Platform/SRE

- deploy immutable images and migrations;
- verify readiness and correlation IDs;
- inspect metrics/logs without leaking secrets;
- execute backup, isolated restore and rollback;
- declare and coordinate incidents;
- preserve evidence and complete post-incident review.

## Required runbooks

- release and migration;
- rollback;
- Ory/Identity outage;
- HRM protected API outage;
- backup and restore;
- key/certificate rotation;
- suspected account or token compromise;
- tenant-isolation incident;
- stale frontend asset/chunk recovery;
- notification/outbox lag;
- access review and offboarding.

## Change control

Every production change records:

- request and business reason;
- affected services, data and trust boundaries;
- security and rollback assessment;
- test evidence;
- approver;
- maintenance window;
- migration/configuration revision;
- post-change verification.

High-risk Identity, authorization, data, network and backup changes require
Security review before release.

## Support model

The current on-call roster must identify first responder, service owner,
security escalation, product escalation, communications and legal/privacy
contacts. Contact information belongs in the controlled operations system, not
in public repository files.

## Training evidence

- attendance/completion record;
- role-specific exercise result;
- new-operator access approval;
- annual refresher;
- incident and restore drill participation.

