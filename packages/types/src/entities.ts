import { z } from "zod";
import {
  authMode,
  businessCriticality,
  connectionMode,
  grantRight,
  grantVia,
  linkScope,
  membershipKind,
  principalKind,
  publicationState,
  resourceKind,
  scenarioKey,
} from "./enums.js";

/**
 * Seed / ingest entities. These are the inputs the rule engine reasons over —
 * produced by a {@link GraphProvider} (demo seed or live Microsoft Graph).
 * Schemas are the single source of truth; the exported types are inferred so
 * seed JSON validation and the compile-time types never drift.
 *
 * Metadata-only: no file content, email bodies, or credentials appear here.
 */

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().optional(),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const tenantConnectionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  mode: connectionMode,
  tenantName: z.string(),
  connectedAt: z.string().optional(),
  /** Microsoft Graph scopes granted — least privilege, read-only. */
  scopes: z.array(z.string()).optional(),
});
export type TenantConnection = z.infer<typeof tenantConnectionSchema>;

export const principalSchema = z.object({
  id: z.string(),
  /** Stable id in the source system (Graph object id) — kept for traceability. */
  sourceId: z.string(),
  kind: principalKind,
  displayName: z.string(),
  email: z.string().optional(),
  isExternal: z.boolean().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  /** Group ids this principal is a member of. */
  memberOf: z.array(z.string()).default([]),
  /** Group-only: how membership is composed. */
  membershipKind: membershipKind.optional(),
  /** Approximate member count for groups (drives exposure-breadth scoring). */
  memberCount: z.number().int().nonnegative().optional(),
  /** false => departed / orphaned account. */
  active: z.boolean().default(true),
});
export type Principal = z.infer<typeof principalSchema>;

export const resourceSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  kind: resourceKind,
  name: z.string(),
  path: z.string().optional(),
  url: z.string().optional(),
  /** Parent site/folder — establishes permission inheritance. */
  parentId: z.string().optional(),
  ownerPrincipalId: z.string().optional(),
  /** Sensitivity label applied (null/absent => missing-label governance gap). */
  sensitivityLabel: z.string().nullable().optional(),
  /** Free-form classification hints from name/path. */
  sensitivityTags: z.array(z.string()).default([]),
  businessCriticality: businessCriticality.optional(),
  // agent / connector specific
  agentActions: z.array(z.string()).default([]),
  connectors: z.array(z.string()).default([]),
  authMode: authMode.optional(),
  publication: publicationState.optional(),
  synced: z.string().optional(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const permissionGrantSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  principalId: z.string(),
  right: grantRight,
  via: grantVia,
  /** Set when via === "inherited": the ancestor resource the grant came from. */
  inheritedFromResourceId: z.string().optional(),
  /** Source-system permission id — kept for traceability. */
  sourcePermissionId: z.string().optional(),
  /** Set when via === "link" / "orgwide". */
  linkScope: linkScope.optional(),
  expirationAt: z.string().nullable().optional(),
});
export type PermissionGrant = z.infer<typeof permissionGrantSchema>;

export const scenarioSchema = z.object({
  id: z.string(),
  key: scenarioKey,
  title: z.string(),
  description: z.string(),
  /** Persona/actor the lens runs as (e.g. Bob the PM). */
  actorPrincipalId: z.string().optional(),
  /** Resource scope, e.g. ["sharepoint", "onedrive"]. */
  scope: z.array(z.string()).default([]),
  includeAgents: z.boolean().default(false),
});
export type Scenario = z.infer<typeof scenarioSchema>;

/** The full normalized tenant graph — the rule engine's input. */
export const tenantGraphSchema = z.object({
  workspace: workspaceSchema,
  connection: tenantConnectionSchema,
  principals: z.array(principalSchema),
  resources: z.array(resourceSchema),
  grants: z.array(permissionGrantSchema),
  scenarios: z.array(scenarioSchema),
});
export type TenantGraph = z.infer<typeof tenantGraphSchema>;

/**
 * Parse + validate an untrusted seed object into a {@link TenantGraph}.
 * Throws a zod error (with path) on the first invariant violation.
 */
export function parseTenantGraph(input: unknown): TenantGraph {
  return tenantGraphSchema.parse(input);
}
