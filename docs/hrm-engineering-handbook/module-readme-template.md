# `<module-name>` — Module Handover

> Replace every `<...>` before merge. Keep this file beside the module as `README.md`.

## Purpose

- **Owner:** `<team / technical owner>`
- **Source of truth:** `<business fact owned by this module>`
- **Does not own:** `<facts owned by other modules>`
- **Consumers:** `<modules/apps>`

## Architecture

```text
presentation (controller) → application (service, policy, validator, mapper) → domain
                                                                          ↑
                                                          infrastructure (repository / adapters)
```

| Layer | Files | Responsibility |
|---|---|---|
| Controller | `<path>` | Bind DTO / envelope only |
| Service | `<path>` | `<use cases>` |
| Domain | `<path>` | `<invariants>` |
| Repository | `<path>` | Owner database only |
| Policy | `<path>` | `<RBAC/scope/FLS>` |
| Integration | `<path>` | `<outbox / external client>` |

## Database

| Table | Purpose | Migration | Key constraints/indexes |
|---|---|---|---|
| `<table>` | `<purpose>` | `<migration>` | `<uq / idx / immutable rule>` |

Shared columns: `id`, `tenant_id`, `status`, `created_at`, `updated_at`, `created_by`, `updated_by`.

## API

| Method | Endpoint | DTO | Permission | Scope / FLS |
|---|---|---|---|---|
| `<GET>` | `/api/v1/...` | `<ResponseDto>` | `hrm.<...>` | `<rule>` |

Envelope: `success`, `data`, `message`, `meta.requestId`; errors: `success=false`, `errorCode`, `message`, `timestamp`, `requestId`.

## Flow

```text
<Actor> → <command> → <workflow/service> → <domain state> → <outbox event>
```

| State | Actor | Transition | Invariant |
|---|---|---|---|
| `<state>` | `<actor>` | `<action>` | `<rule>` |

## Permission and audit

| Action | Permission | Data scope | Field policy | Audit event |
|---|---|---|---|---|
| `<read/edit/download>` | `hrm.<...>` | `<self/team/company>` | `<masked fields>` | `<event>` |

## Configuration

| Key | Required | Meaning | Secret? |
|---|---:|---|---:|
| `<ENV_KEY>` | yes/no | `<purpose>` | yes/no |

No real value belongs in this README or `.env.example`.

## Testing

| Test type | Command / location | Required cases |
|---|---|---|
| Unit | `<path>` | `<invariant>` |
| API | `<path>` | 401/403/409 + DTO projection |
| Security | `<path>` | `<FLS / download denial>` |

## Operations and handover

- **Dashboard / log query:** `<requestId / metric path>`
- **Alerts:** `<failure condition>`
- **Rollback/data correction:** `<safe procedure>`
- **Known limitation:** `<none or deliberate constraint>`
- **Last verified:** `<YYYY-MM-DD, test command>`
