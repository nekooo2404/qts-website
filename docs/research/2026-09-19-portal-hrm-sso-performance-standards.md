# Portal/HRM/Ory SSO: performance and enterprise standards

- **Date:** 2026-09-19
- **Status:** Research note
- **Context:** Browser-based Portal and HRM clients using Ory Kratos for the user session and Ory Hydra for OAuth 2.0/OIDC authorization.
- **Source policy:** Primary sources only. RFC/specification language is separated from implementation recommendations.

## Standards requirements

### OAuth 2.0 and PKCE

- A public client **MUST use PKCE**; an authorization server **MUST support PKCE** and prevent downgrade by requiring a verifier when the authorization request included a challenge. Confidential clients are also recommended to use PKCE. Use the authorization-code flow rather than the implicit grant, which the Security BCP says clients **SHOULD NOT** use. ([RFC 9700, §§2.1.1–2.1.2](https://www.rfc-editor.org/rfc/rfc9700#section-2.1.1), [RFC 9700, §2.1.2](https://www.rfc-editor.org/rfc/rfc9700#section-2.1.2))
- The client verifier must be a high-entropy, URL-safe value; RFC 7636 specifies 43–128 unreserved characters and recommends at least 256 bits of entropy. A client capable of S256 **MUST** use S256, and the token endpoint must recompute and compare the challenge, returning `invalid_grant` on failure. ([RFC 7636, §§4.1–4.2](https://www.rfc-editor.org/rfc/rfc7636#section-4.1), [RFC 7636, §4.6](https://www.rfc-editor.org/rfc/rfc7636#section-4.6))
- Redirect URIs require exact matching, apart from the localhost port exception for native apps; pattern matching and open redirectors are unsafe. Authorization responses must use encrypted transport, and authorization servers must not permit ordinary `http` redirect URIs. ([RFC 9700, §2.1](https://www.rfc-editor.org/rfc/rfc9700#section-2.1), [RFC 9700, §2.6](https://www.rfc-editor.org/rfc/rfc9700#section-2.6))
- Clients **MUST** prevent CSRF. Bind a transaction-specific `state` value to the user agent; for OIDC, also generate a transaction-specific `nonce` and validate it in the ID Token. ([RFC 9700, §4.7.1](https://www.rfc-editor.org/rfc/rfc9700#section-4.7.1), [RFC 9700, §4.5.3.2](https://www.rfc-editor.org/rfc/rfc9700#section-4.5.3.2), [OIDC Core, §§3.1.2.1, 3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation))
- An OIDC client must validate the ID Token issuer exactly, require its audience to contain the client ID, reject an expired token, and validate `nonce` when one was sent. Discovery metadata must use HTTPS; the discovered `issuer` must exactly match the issuer URL used to fetch `/.well-known/openid-configuration`, and `jwks_uri` identifies the keys used for signature validation. ([OIDC Core, §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation), [OIDC Discovery, §§3–4.3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest))
- Public-client refresh tokens **MUST** be sender-constrained or rotated. Access tokens **SHOULD** be audience-restricted, and sender-constraining access tokens is recommended where feasible. ([RFC 9700, §2.2](https://www.rfc-editor.org/rfc/rfc9700#section-2.2))

### Ory responsibilities

- Hydra’s documented login/consent integration sends `login_challenge` and `consent_challenge` to external applications. Those applications accept or reject the requests, grant scopes on consent, and may skip UI when Hydra reports that it is unnecessary. This is an Ory integration contract, not a replacement for the OAuth/OIDC validations above. ([Ory Hydra login and consent](https://www.ory.com/docs/hydra/guides/login-consent))
- Kratos documents the browser session as a cookie-backed session and exposes session state through `/sessions/whoami`; active sessions include an expiry. Ory’s security model documents cookie-based CSRF protection. ([Ory Kratos session management](https://www.ory.com/docs/kratos/session-management/overview), [Ory security model](https://www.ory.com/docs/security-model))

## Performance recommendations (not protocol requirements)

1. **Make the callback path small and deterministic.** Exchange the code once, validate the ID Token locally from cached discovery/JWKS metadata, and avoid an extra login or consent screen when Hydra’s challenge says `skip`. Refresh discovery/JWKS on a bounded policy and on key-identifier misses; this is an implementation policy based on the metadata and key-validation roles defined by OIDC Discovery, not a mandated cache duration. ([OIDC Discovery, §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse), [Ory Hydra login and consent](https://www.ory.com/docs/hydra/guides/login-consent))
2. **Treat the Kratos cookie as the SSO fast path.** Keep the browser session on the identity origin and let Hydra’s login bridge reuse it; reserve credential/MFA UI for a genuinely unauthenticated or policy-forced fresh login. This follows Kratos’ documented session purpose and Hydra’s documented challenge/skip flow. ([Ory Kratos session management](https://www.ory.com/docs/kratos/session-management/overview), [Ory Hydra login and consent](https://www.ory.com/docs/hydra/guides/login-consent))
3. **Prefer an enterprise token boundary.** A BFF can keep refresh tokens off the browser; a pure SPA must at minimum use authorization code + S256 PKCE and refresh-token rotation. The BFF preference is an architecture recommendation; rotation for a public client is the normative requirement. ([RFC 9700, §§2.1.1, 2.2](https://www.rfc-editor.org/rfc/rfc9700#section-2.2), [OIDC Core, §3.1](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth))
4. **Keep initial Portal JavaScript small.** React’s `lazy` defers a component’s code until first render and uses `Suspense` for the loading state; Vite pre-bundles dependencies and rewrites dynamic imports with preload steps. Load HRM-heavy routes after authentication instead of making the SSO callback download the whole application. ([React `lazy`](https://react.dev/reference/react/lazy), [Vite dependency pre-bundling](https://vite.dev/guide/features#npm-dependency-resolving-and-pre-bundling), [Vite async chunk loading](https://vite.dev/guide/features#async-chunk-loading-optimization))
5. **Measure the complete redirect budget.** Record timings for Portal bootstrap, authorization redirect, login/consent bridge, token exchange, JWKS lookup, and the first API request. Optimize the slowest measured segment without weakening validation, cookie protections, token rotation, or exact redirect matching; none of those security controls is optional merely because a shorter path is faster. ([RFC 9700, §§2.1, 2.2, 4.7.1](https://www.rfc-editor.org/rfc/rfc9700), [OIDC Core, §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation))

## References

- [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [RFC 7636 — Proof Key for Code Exchange](https://www.rfc-editor.org/rfc/rfc7636.html)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [Ory Hydra — Login and consent app](https://www.ory.com/docs/hydra/guides/login-consent)
- [Ory Kratos — Session management](https://www.ory.com/docs/kratos/session-management/overview)
- [Ory — Security model](https://www.ory.com/docs/security-model)
- [React — `lazy`](https://react.dev/reference/react/lazy)
- [Vite — Features](https://vite.dev/guide/features.html)
