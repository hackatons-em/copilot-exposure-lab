import type { ConnectionMode, PermissionGrant, Principal, Resource, TenantGraph } from "@cel/types";
import { DEFAULT_SCENARIOS } from "../graph/ms-graph-client.js";
import { loadSeedGraph } from "../seed-graph-client.js";
import { SystemSeedClient, tagSystem } from "./base.js";
import { loadGoogleWorkspaceGraph } from "./google-workspace-client.js";
import { loadSalesforceGraph } from "./salesforce-client.js";
import { loadSlackGraph } from "./slack-client.js";

const MULTI_WORKSPACE_ID = "ws-multi-system";

/**
 * Merge several already-validated, system-tagged graphs into ONE TenantGraph:
 * principals / resources / grants are concatenated (ids are namespaced per
 * system, so no collisions), a single multi-system workspace + connection is
 * kept, and the standard scenario set is reused. Result is re-validated.
 */
export function mergeSystemGraphs(graphs: TenantGraph[]): TenantGraph {
  const principals: Principal[] = [];
  const resources: Resource[] = [];
  const grants: PermissionGrant[] = [];
  for (const g of graphs) {
    principals.push(...g.principals);
    resources.push(...g.resources);
    grants.push(...g.grants);
  }
  return {
    workspace: { id: MULTI_WORKSPACE_ID, name: "Acme — All Systems" },
    connection: {
      id: `conn-${MULTI_WORKSPACE_ID}`,
      workspaceId: MULTI_WORKSPACE_ID,
      mode: "multi-system",
      tenantName: "Microsoft 365 + Google Workspace + Slack + Salesforce",
    },
    principals,
    resources,
    grants,
    scenarios: DEFAULT_SCENARIOS,
  };
}

/** Load the M365 demo + the three system seeds and merge them into one graph. */
export function loadMultiSystemGraph(): TenantGraph {
  const microsoft = tagSystem(loadSeedGraph(), "microsoft");
  return mergeSystemGraphs([
    microsoft,
    loadGoogleWorkspaceGraph(),
    loadSlackGraph(),
    loadSalesforceGraph(),
  ]);
}

/**
 * Metadata-only provider that presents M365, Google Workspace, Slack, and
 * Salesforce as a single normalized graph. Every resource is tagged with its
 * source system (`system:<name>`) so merged views remain attributable, and the
 * one deterministic engine scans them all together.
 */
export class MultiSystemClient extends SystemSeedClient {
  readonly mode: ConnectionMode = "multi-system";

  constructor(graph: TenantGraph = loadMultiSystemGraph()) {
    super(graph);
  }
}
