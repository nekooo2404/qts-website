import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function stringifySearchParams(searchParams?: SearchParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }
  return query.toString();
}

function identityRedirectTarget(path: string[]) {
  if (path[0] === "sign-in") return "/login";
  if (path[0] === "account" && path.length === 1) return "/launcher";
  return `/${path.join("/")}`;
}

export default async function LegacyIdentityPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }> | { path?: string[] };
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const query = stringifySearchParams(resolvedSearchParams);
  redirect(`${identityRedirectTarget(resolvedParams.path ?? [])}${query ? `?${query}` : ""}`);
}
