# SLO, SLA, RPO and RTO

The detailed-design reference requires availability, performance, scalability,
backup and recovery to be designed and tested. QTS must convert those
principles into measurable objectives before production approval.

The values below are a proposed baseline for capacity planning. They are not a
contract and are not approved until the decision register is closed.

## Service tiers

| Tier | Services | Business impact |
|---|---|---|
| Tier 0 | Kratos, Hydra, Identity Admin, Identity Bridge | Authentication and cross-application access |
| Tier 1 | HRM, Portal, Lead API | Daily business operations and customer intake |
| Tier 2 | Event worker, Attendance sync, reports and non-critical workers | Asynchronous or recoverable operations |
| Tier 3 | Marketing presentation and non-critical analytics | Degraded experience is acceptable during maintenance |

## Proposed service objectives

| Service/tier | Availability SLO | P95 API latency | Error budget/month | RPO | RTO |
|---|---:|---:|---:|---:|---:|
| Tier 0 | 99.95% | 500 ms for session endpoints | 21.9 min | 15 min | 60 min |
| Tier 1 | 99.90% | 800 ms for read APIs | 43.8 min | 60 min | 4 h |
| Tier 2 | 99.50% | 2 s for accepted commands | 3 h 39 min | 4 h | 8 h |
| Tier 3 | 99.00% | 3 s for page/API reads | 7 h 18 min | 24 h | 24 h |

These targets assume an approved production topology, health probes, monitoring,
database backups and an exercised restore procedure. They cannot be met by
application code alone.

## Measurement

Availability excludes a pre-announced maintenance window only when:

- the window is approved and communicated;
- the edge returns a deliberate maintenance response;
- health and error metrics still record the period;
- the window does not exceed the approved monthly budget.

Measure at the public gateway and at the service boundary:

- successful and failed requests;
- authentication redirect and callback latency;
- 401/403/429/5xx rates;
- database connection saturation;
- queue/outbox lag;
- backup success and restore duration;
- browser stale-asset and chunk-load failures.

Use `X-Request-ID` as the correlation key without logging session IDs or tokens.

## Proposed external SLA shape

The customer or internal-business SLA should state:

1. covered services and support hours;
2. availability calculation and exclusions;
3. incident severity and response targets;
4. planned maintenance notice;
5. data recovery objective;
6. security incident notification path;
7. service credits or internal escalation, if applicable.

Do not publish a numeric SLA until the service owner signs the corresponding
SLO, capacity report and exception policy.

## Approval evidence

- 30-day baseline dashboard;
- load and soak test at expected peak;
- database and queue capacity model;
- backup and isolated restore report;
- incident drill showing RTO;
- signed SLO/SLA/RPO/RTO decision.

See `decision-register.md` ADR-GOV-004.

