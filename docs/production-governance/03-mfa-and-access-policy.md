# MFA and Access Policy

## Policy intent

MFA is a risk control, not a visual login option. QTS keeps the existing
product behavior that ordinary users may enable MFA from Settings, while
requiring a security decision for privileged or untrusted access.

## Proposed policy matrix

| Actor or context | MFA policy | Reason | Approval |
|---|---|---|---|
| Ordinary internal employee on a trusted network | Opt-in by user | Preserve low-friction SSO requirement | Product + Security |
| Identity administrator | Mandatory | High-impact account and policy changes | Security owner |
| HRM administrator or payroll operator | Mandatory or step-up at sensitive action | Sensitive employee and payroll data | Security + HR data owner |
| Access from public Internet | Mandatory | Higher session and device risk | Security owner |
| Third-party/support account | Mandatory, time-bound | External privileged access | Security owner |
| Break-glass account | Mandatory, hardware-backed where available | Emergency-only access | Security owner |
| Local development/test | Configurable and isolated from production | Testability without weakening production | Engineering |

Until approved, production must not silently change the ordinary-user default.
The active default remains `require_mfa=false` for ordinary users; Kratos TOTP,
backup codes and AAL2 remain available for users who opt in.

## Enrollment

1. User authenticates through the normal Kratos flow.
2. User opens Settings → Security.
3. User enrolls a TOTP authenticator.
4. User verifies a current code.
5. User downloads or records backup codes.
6. Identity records the enrollment and recovery state.
7. The user receives a clear confirmation without exposing secret material.

For policy-forced groups, access remains in an enrollment-pending state until
the required authenticator and backup method are verified.

## Authentication and recovery controls

- Use OIDC Authorization Code + PKCE for browser applications.
- Validate state, nonce, exact redirect URI and token audience.
- Keep browser tokens out of localStorage and frontend logs.
- Use secure, HttpOnly, SameSite session cookies.
- Never send passwords to Portal, HRM or other business applications.
- Use generic invalid-credential errors to prevent user enumeration.
- Rate-limit repeated failures and apply progressive lockout where approved.
- Recovery must revoke or rotate affected sessions and record an audit event.
- Backup codes are single-use, hashed at rest and never returned after display.
- High-risk recovery requires an approved support or identity-verification path.

## Access lifecycle

| Event | Required action | Evidence |
|---|---|---|
| Joiner | Create or link identity, assign minimum application access | Provisioning event |
| Mover | Recalculate role, tenant, organization and data scope | Permission-change audit |
| Leaver | Disable identity, revoke sessions/tokens and application assignment | De-provisioning event |
| Privilege elevation | Require approval and recent authentication | Approval + audit |
| Temporary support | Time-bound grant with expiry | Grant/revoke record |
| Periodic review | Reconfirm privileged and application assignments | Signed access-review report |

## Architecture Decision Required

The security owner must approve the exact MFA matrix, timeout values,
lockout/rate-limit thresholds, break-glass procedure and recovery evidence
before production release. See `decision-register.md` ADR-GOV-003.

