# QTS Identity Bridge Service

Spring Boot implementation of the QTS Ory Hydra login/consent/logout bridge.
It owns this bridge contract:

- `GET /oauth/ory/login?login_challenge=...`
- `GET /oauth/ory/consent?consent_challenge=...`
- `GET /oauth/ory/logout?logout_challenge=...`
- `POST /oauth/ory/logout/accept`

The service is disabled by default (`QTS_IDENTITY_BRIDGE_ENABLED=false`) and is
enabled only for the Spring cutover path. With
`docker-compose.spring.cutover.yml`, Identity UI can proxy `/oauth/ory/**` to
`http://identity-bridge-service:8085`; rollback restores the previous
known-good Spring image/config and resyncs Hydra URLs if needed.

The bridge never receives passwords or OAuth tokens. It only receives the
Kratos browser session cookie, calls Ory's private admin/public APIs, and reads
the existing QTS identity database for membership and application policy.

Browser-cookie mutations are protected by both trusted origin checking and a
CSRF token. `POST /oauth/ory/logout/accept` accepts `X-CSRFToken`,
`X-CSRF-Token`, `csrfmiddlewaretoken`, or `_csrf` with the Identity CSRF token.
