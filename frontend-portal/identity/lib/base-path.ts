export const identityBasePath = "";

export function identityPath(path: string) {
  return `${identityBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}
