import type { MetadataRoute } from "next";
import { resourceCategories, resources } from "@/components/marketing/resources/catalog";
import { STATIC_SITEMAP_ROUTES, absoluteUrl } from "@/lib/seo";
import { solutionThemes } from "@/lib/solution-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_SITEMAP_ROUTES,
    ...solutionThemes.map((s) => `/solutions/${s.slug}`),
    ...resourceCategories.map(({ slug }) => `/resources/${slug}`),
    ...resources.map((r) => `/resources/${r.category}/${r.slug}`),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
