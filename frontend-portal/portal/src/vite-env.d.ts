/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IDENTITY_ISSUER?: string;
  readonly VITE_API_ISSUER?: string;
  readonly VITE_IDENTITY_WEB_ORIGIN?: string;
  readonly VITE_PORTAL_OIDC_CLIENT_ID?: string;
  readonly VITE_PORTAL_OIDC_REDIRECT_URI?: string;
  readonly VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
