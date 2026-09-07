// Identity Center is hosted under https://qtsgroup.vn/identity in production.
// Same value drives Next.js basePath (next.config) and browser-side URL builders.
export const identityBasePath =
  process.env.NODE_ENV === "production" ? "/identity" : "";

export function identityPath(path: string) {
  return `${identityBasePath}${path}`;
}
