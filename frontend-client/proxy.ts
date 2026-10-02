import { NextRequest, NextResponse } from "next/server";

const PRIVATE_PATHS = ["/api", "/cms-api", "/oauth", "/identity"];

function isPrivatePath(pathname: string) {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function buildPolicy(nonce?: string) {
  const development = process.env.NODE_ENV !== "production";
  const scriptSource = nonce
    ? `'nonce-${nonce}' 'strict-dynamic'`
    : "'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src 'self' ${scriptSource}${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    `connect-src 'self' https://plausible.io${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const privatePath = isPrivatePath(request.nextUrl.pathname);
  const nonce = privatePath ? btoa(crypto.randomUUID()) : undefined;
  const policy = buildPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", policy);
  if (nonce) requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  if (privatePath) response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|images/|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
