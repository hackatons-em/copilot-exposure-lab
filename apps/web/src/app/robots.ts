import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/** Allow indexing of the marketing surface; keep the app shell out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/overview",
        "/findings",
        "/graph",
        "/threat-model",
        "/copilot-sim",
        "/scenarios",
        "/reports",
        "/exports",
        "/resources",
        "/remediation",
        "/schedules",
        "/audit",
        "/settings",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
