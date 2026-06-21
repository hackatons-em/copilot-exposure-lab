import type { ConnectionMode, PermissionGrant, Principal, Resource, Scenario, TenantGraph } from "@cel/types";

/**
 * Abstraction over a source of Microsoft 365 metadata.
 *
 * Two implementations:
 *  - SeedGraphClient  — reads the bundled demo company (this package).
 *  - MsGraphClient    — live Microsoft Graph, least-privilege, metadata-only (added later).
 *
 * Contract: METADATA ONLY. No method returns document content, email bodies,
 * Teams messages, or credentials. The granular `list*` methods exist for live
 * ingestion + tests; `loadTenantGraph()` returns the assembled, validated graph
 * the rule engine consumes.
 */
export interface GraphProvider {
  readonly mode: ConnectionMode;

  /** Assemble + validate the full normalized tenant graph. */
  loadTenantGraph(): Promise<TenantGraph>;

  listUsers(): Promise<Principal[]>;
  listGroups(): Promise<Principal[]>;
  /** Principals whose `memberOf` includes `groupId`. */
  listGroupMembers(groupId: string): Promise<Principal[]>;
  listSites(): Promise<Resource[]>;
  /** All resources: sites, files, folders, agents, connectors. */
  listResources(): Promise<Resource[]>;
  listPermissions(): Promise<PermissionGrant[]>;
  listScenarios(): Promise<Scenario[]>;
}
