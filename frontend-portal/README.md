# Frontend portal

This folder contains the authenticated entry experience for QTS:

- `portal/` is the application launcher and OIDC client.
- `identity/` is the Identity Gateway UI: login, logout, MFA, account security
  and launcher pages.

The two applications share the QTS visual language but remain separate
deployables. The portal consumes Identity-issued sessions; it never stores
passwords or implements its own identity provider.
