/** Runtime config read from public env, with safe demo defaults. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const WORKSPACE_ID = process.env.NEXT_PUBLIC_WORKSPACE_ID ?? "ws-demo";

/** Canonical public site origin — used for SEO metadata, sitemap, and robots. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app-cel-web-dev.blackwave-a223f5f4.swedencentral.azurecontainerapps.io";

/**
 * Optional API key. When the server is configured with API-key RBAC
 * (CEL_API_KEYS), set this to authenticate from the dashboard; the client then
 * sends `Authorization: Bearer <key>` on every request. Unset against the open
 * demo — no header is sent and nothing changes.
 */
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
