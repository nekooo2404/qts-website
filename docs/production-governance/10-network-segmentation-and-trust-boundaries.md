# Network Segmentation and Trust Boundaries

## Zones

| Zone | Purpose | Examples | Default exposure |
|---|---|---|---|
| Public edge | TLS termination, WAF and routing | Caddy/managed ingress | Internet-facing |
| Frontend | Static/browser applications | Marketing, Portal, Identity, HRM | Reachable through edge only |
| Identity | Authentication and authorization | Kratos, Hydra, Identity Admin, Bridge | Private except approved browser routes |
| Application | Business APIs and workers | Lead, Event, Attendance, HRM | Private; gateway/service allowlist |
| Data | Durable state | PostgreSQL, Redis | Private; service-specific grants |
| Storage | Private documents and exports | Object storage | Private; signed/controlled operations |
| Management | Administration and deployment | CI/CD, bastion, admin tools | VPN/private control plane |
| Observability | Metrics, logs and security events | Metrics, log store, SIEM | Private; write-only service paths |
| Backup/DR | Recovery assets and isolated restore | Snapshot store, restore network | Private and separately controlled |

## Allowed-flow baseline

| Source | Destination | Allowance | Control |
|---|---|---|---|
| Internet | Public edge | HTTPS only | WAF, rate limit, TLS |
| Public edge | Frontend | Static HTTP within private network | Network policy |
| Public edge | Gateway | Approved API/OIDC routes | Route allowlist |
| Gateway | Identity | Approved browser/admin bridge endpoints | mTLS/private network where available |
| Gateway | Application | Approved service routes | Route and auth policy |
| Application | Identity | JWKS/session/introspection only where required | Least-privilege service identity |
| Application | Data | Own schema/database only | Database grants and network policy |
| Application | Storage | Private object operations | Bucket policy and malware checks |
| Services | Observability | Metrics/log/audit write paths | Egress allowlist |
| Management | Services/Data | Approved admin paths | VPN/bastion, MFA, audited |
| Data | Backup | Scheduled backup path | Dedicated identity, encryption |
| Backup | Production | No routine inbound access | Recovery approval only |

All other flows are denied by default.

## Trust-boundary rules

- Browser input is untrusted even after authentication.
- Access tokens are untrusted until issuer, signature, audience, token type and
  expiry are validated.
- Service-to-service identity is separate from end-user authorization.
- Database credentials never cross into browser or frontend configuration.
- Ory admin endpoints are not equivalent to public OIDC endpoints.
- Backup storage is a high-value target and must not share application write
  credentials.
- Logs are evidence, not authority; a log event cannot grant access.

## Required network evidence

- firewall and security-group rules;
- WAF policy and TLS scan;
- public exposure scan;
- admin access audit;
- database/Redis private reachability proof;
- segmentation test showing denied unexpected flows;
- incident procedure for a compromised service identity.

