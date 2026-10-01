# Ory identity runtime

Hydra owns OAuth2/OIDC issuance, authorization challenges and signing keys.
Kratos owns identities, passwords, TOTP, backup codes and browser sessions.
Spring Identity Admin owns QTS tenant memberships, role grants, application
assignments, enrollment state and audit records. Spring Identity Bridge owns the
Hydra login, consent and logout decisions. Neither SPA stores an admin API
credential, and Hydra/Kratos admin listeners must stay private on the Docker
network.

## Browser flow

1. Portal, HRM or another first-party application generates PKCE verifier,
   state and nonce, then navigates to Hydra.
2. Hydra calls the Spring Identity Bridge through the Identity web origin.
3. The bridge validates the Hydra challenge, client allowlist and Kratos
   browser session through `sessions/whoami`.
4. If the browser has no valid Kratos session, the Identity UI renders the
   Kratos login flow through the public `/kratos` proxy.
5. Identity Bridge accepts the Hydra login only for an active QTS membership
   with an active application assignment. Consent grants only the first-party
   scope allowlist, binds the token to the QTS session, tenant and client, and
   uses the `qts-api` audience.
6. Spring resource services validate the Hydra access token through the issuer
   and JWKS, then enforce tenant scope, application assignment and service
   permissions.
7. RP logout requires confirmation, revokes QTS session state and Kratos
   session state, deletes Hydra grants where applicable, then accepts the Hydra
   logout challenge.

The canonical production issuer is `https://sso.qtsgroup.vn/` including the
trailing slash. Existing internal user IDs, tenant IDs, memberships and
assignments stay intact. Historical external-id columns are migration evidence
only and must not be used by new Spring services for authorization decisions.

## Passwords, MFA and email

Production password, recovery and verification flows belong to Kratos. Local
Mailpit is available only under the `dev-mail` profile and is never a production
mail service. When real SMTP is configured, set `ORY_SMTP_CONNECTION_URI` and
`ORY_EMAIL_FLOWS_ENABLED=true`, then test recovery, verification and expiry in a
controlled environment before publishing the UI links.

Bootstrap superadmin follows the production secret rule:

- local/dev may use a Git-ignored bootstrap file for repeatable testing;
- production must provide `BOOTSTRAP_SUPERADMIN_PASSWORD` from a secret manager
  or mount `BOOTSTRAP_SUPERADMIN_PASSWORD_FILE` from a protected path such as
  `/run/secrets/...`;
- the plaintext bootstrap password must never be committed, logged or stored
  after enrollment;
- first login must force password rotation and MFA enrollment before the account
  is treated as production-ready.

## Migration and cutover

Take a full backup of PostgreSQL, Ory databases, exact images, environment and
Caddyfile before changing the production issuer or gateway routing.

1. Start Hydra/Kratos databases and migrations.
2. Start Spring services with `docker-compose.spring.yml`,
   `docker-compose.spring.prod.yml` and `docker-compose.spring.cutover.yml`.
3. Run the Spring production gate and service-specific smoke tests.
4. Synchronize first-party Hydra clients using `scripts/sync-ory-clients.sh`.
5. Verify password login, MFA, Portal SSO, HRM SSO, application filtering,
   revocation and logout with representative users.
6. Switch host Caddy routes only after readiness, auth and business smoke tests
   pass.
7. Keep database snapshots and previous Spring image tags during the rollback
   window. Rollback should restore a known-good Spring release, not re-enable a
   retired backend profile.

`scripts/backup.sh` captures application, Hydra and Kratos databases as one
completed snapshot directory. `scripts/restore-ory.sh` stops writers and
requires explicit confirmation before restoring all three. Back up environment
secrets separately: database dumps alone cannot decrypt Ory state.

## Validation

The isolated `qtsss-ory-check` stack runs Identity, Portal, HRM, Hydra and the
Spring API services on separate local ports and volumes. It is not the VPS
deployment.

`tests/ory/session.spec.ts` exercises Kratos login/TOTP, Hydra PKCE,
Portal/HRM SSO, refresh rotation, assignment revocation and logout using only
the isolated fixture account. Traces, video and screenshots are disabled for
this suite; credentials are kept under Git-ignored `.secrets`.

Public production smoke tests are separate and must run only after the Ory
cutover. Passing the isolated suite does not prove that the VPS has the current
Spring images, correct DNS, valid TLS, or migrated production users.
