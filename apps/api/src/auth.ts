/**
 * API-key authentication + RBAC.
 *
 * Design (config-gated, OFF by default):
 *  - `buildApp` is given an optional `apiKeys` list. If it is undefined or empty
 *    auth is DISABLED — every request is treated as role "owner" (full access),
 *    which preserves all existing behavior (tests, e2e, and the open demo).
 *  - If `apiKeys` is non-empty auth is ENFORCED — the caller's key is read from
 *    `authorization: Bearer <key>` (or `x-api-key: <key>`), resolved to a role,
 *    and each route declares the permission it requires.
 *
 * The role→permission matrix mirrors docs/spec/05_SECURITY/02_PERMISSIONS_MODEL.md.
 */

export type Role = "owner" | "admin" | "analyst" | "viewer";

export type Permission = "connect" | "scan" | "view" | "export" | "manage" | "delete";

/** Role → granted permissions (from the permissions model RBAC matrix). */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["connect", "scan", "view", "export", "manage", "delete"],
  admin: ["connect", "scan", "view", "export"],
  analyst: ["scan", "view", "export"],
  viewer: ["view"],
};

/** A configured API key: the secret, the role it grants, and an optional label. */
export interface ApiKeyEntry {
  key: string;
  role: Role;
  label?: string;
}

/** An auth error carrying the HTTP status the route handler / error handler uses. */
export interface AuthError extends Error {
  statusCode: number;
}

function authError(statusCode: number, message: string): AuthError {
  return Object.assign(new Error(message), { statusCode });
}

const ROLES: ReadonlySet<string> = new Set<Role>(["owner", "admin", "analyst", "viewer"]);

function isRole(value: string): value is Role {
  return ROLES.has(value);
}

/**
 * Parse `CEL_API_KEYS` — a comma-separated list of `key:role` pairs
 * (e.g. `k_admin123:admin,k_view456:viewer`). Whitespace around entries is
 * trimmed. Unknown roles or malformed pairs throw, so a misconfiguration fails
 * loudly at boot rather than silently disabling auth. Returns `undefined` when
 * the variable is unset or empty (→ auth stays OFF).
 */
export function parseApiKeys(raw: string | undefined): ApiKeyEntry[] | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;

  const entries: ApiKeyEntry[] = [];
  for (const segment of trimmed.split(",")) {
    const pair = segment.trim();
    if (pair.length === 0) continue;
    const idx = pair.indexOf(":");
    if (idx <= 0 || idx === pair.length - 1) {
      throw new Error(`CEL_API_KEYS: malformed entry "${pair}" — expected "key:role"`);
    }
    const key = pair.slice(0, idx).trim();
    const role = pair.slice(idx + 1).trim();
    if (key.length === 0) throw new Error(`CEL_API_KEYS: empty key in "${pair}"`);
    if (!isRole(role)) {
      throw new Error(`CEL_API_KEYS: unknown role "${role}" (expected owner|admin|analyst|viewer)`);
    }
    entries.push({ key, role });
  }
  return entries.length > 0 ? entries : undefined;
}

/** Build a fast key→role lookup once at app construction. */
export function buildKeyIndex(apiKeys: ApiKeyEntry[]): Map<string, Role> {
  const index = new Map<string, Role>();
  for (const entry of apiKeys) index.set(entry.key, entry.role);
  return index;
}

/** Extract the presented credential from either supported header. */
export function extractCredential(headers: {
  authorization?: string;
  "x-api-key"?: string;
}): string | undefined {
  const auth = headers.authorization;
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match?.[1]) return match[1].trim();
  }
  const apiKey = headers["x-api-key"];
  if (apiKey && apiKey.trim().length > 0) return apiKey.trim();
  return undefined;
}

/**
 * Resolve the caller's role for an ENFORCED app.
 * Missing or unknown credential → throws a 401 AuthError.
 */
export function resolveRole(
  headers: { authorization?: string; "x-api-key"?: string },
  keyIndex: Map<string, Role>,
): Role {
  const credential = extractCredential(headers);
  if (!credential) throw authError(401, "unauthorized");
  const role = keyIndex.get(credential);
  if (!role) throw authError(401, "unauthorized");
  return role;
}

/** Whether a role holds a permission. */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Throw a 403 AuthError if the role lacks the required permission. */
export function assertPermission(role: Role, permission: Permission): void {
  if (!roleHasPermission(role, permission)) throw authError(403, "forbidden");
}
