import type { ConnectionMode, TenantGraph } from "@cel/types";
import { SystemSeedClient, tagSystem } from "./base.js";
import { loadSystemGraph, systemSeedDir } from "./loader.js";

/** Default location of the bundled Salesforce seed (`seed/salesforce`). */
export const SALESFORCE_SEED_DIR = systemSeedDir("salesforce");

/** Load + validate the Salesforce seed, tagged `system:salesforce`. */
export function loadSalesforceGraph(seedDir: string = SALESFORCE_SEED_DIR): TenantGraph {
  return tagSystem(loadSystemGraph(seedDir), "salesforce");
}

/**
 * Metadata-only Salesforce provider. Normalizes objects (as sites), reports
 * (as files), org-wide-default sharing, role/public groups, and external
 * community/portal users into the standard {@link TenantGraph} so the unchanged
 * exposure rules fire over Salesforce sharing exactly as for M365.
 */
export class SalesforceClient extends SystemSeedClient {
  readonly mode: ConnectionMode = "salesforce";

  constructor(graph: TenantGraph = loadSalesforceGraph()) {
    super(graph);
  }
}
