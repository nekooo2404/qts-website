# Access Review Procedure

## Objective

Verify that every user, service identity, application assignment, role,
permission, tenant membership and privileged grant is still necessary,
time-bounded where appropriate and consistent with employment status.

## Review cadence

| Review | Cadence | Scope | Owner |
|---|---|---|---|
| Privileged access | Monthly | Identity, HRM, database, cloud, CI/CD and backup admins | Security + service owners |
| Application assignments | Quarterly | Portal, HRM and future applications | Identity owner + product owners |
| All user memberships | Quarterly | Active users, tenant and organization scope | Identity + data owners |
| Joiner/mover/leaver | On every event; reconcile weekly | New, moved, suspended and departed staff | HR + Identity |
| Service identities | Quarterly and after topology changes | OAuth clients, database roles, deploy identities and keys | Platform + Security |
| Emergency grants | At creation and expiry | Break-glass and support access | Security owner |

## Review steps

1. Export the authoritative identity, membership, role, application and service
   identity inventory.
2. Reconcile against HR employment status, contracts, support tickets and
   approved change records.
3. Check each grant against least privilege, tenant scope, data scope and
   field-level policy.
4. Confirm MFA status for policy-forced groups.
5. Confirm inactive, expired and departed identities are disabled and sessions
   revoked.
6. Record owner decision: retain, reduce, suspend or revoke.
7. Apply changes through the authoritative Identity/admin path.
8. Verify API denial and audit events after revocation.
9. Attach signed review evidence and exceptions with expiry.

## Evidence fields

```text
reviewId
period
subjectId
subjectType
tenant/application scope
grants reviewed
decision
approver
decisionAt
revocationAt
exceptionId
exceptionExpiry
verificationRequestId
```

Do not export passwords, tokens, private keys or unnecessary personal data into
the review artifact.

## Immediate revocation triggers

- employment termination;
- role or department change;
- security incident;
- disabled application;
- expired temporary access;
- failed identity-verification or MFA recovery;
- owner request.

Revocation includes application assignment, role/grant, service access and
active sessions/tokens where applicable.

## Exceptions

An exception must identify:

- business reason;
- exact scope;
- compensating controls;
- accountable owner;
- start and expiry date;
- next review date.

Expired exceptions are denied by default and cannot be renewed silently.

