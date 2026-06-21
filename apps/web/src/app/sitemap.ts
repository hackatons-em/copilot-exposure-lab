import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/** The public marketing surface. The app shell (dashboard) is intentionally excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/product", priority: 0.9 },
    { path: "/pricing", priority: 0.9 },
    { path: "/security", priority: 0.7 },
    { path: "/research", priority: 0.7 },
  ];
  // Static build — use a fixed lastModified (no Date.now in this codebase).
  const lastModified = "2026-06-21T00:00:00.000Z";
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
