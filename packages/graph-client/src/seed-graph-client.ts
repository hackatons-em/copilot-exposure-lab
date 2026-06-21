import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseTenantGraph,
  type ConnectionMode,
  type PermissionGrant,
  type Principal,
  type Resource,
  type Scenario,
  type TenantGraph,
} from "@cel/types";
import type { GraphProvider } from "./provider.js";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Default location of the bundled demo company (repo `seed/demo-company`). */
export const DEFAULT_SEED_DIR = resolve(HERE, "../../../seed/demo-company");

/**
 * Read the demo company's JSON parts from `seedDir`, assemble them, and
 * validate against the `@cel/types` schema. Throws (with a zod path) if the
 * seed violates any invariant.
 */
export function loadSeedGraph(seedDir: string = DEFAULT_SEED_DIR): TenantGraph {
  const readJson = (file: string): unknown => JSON.parse(readFileSync(resolve(seedDir, file), "utf8"));
  const meta = readJson("workspace.json") as { workspace: unknown; connection: unknown };
  return parseTenantGraph({
    workspace: meta.workspace,
    connection: meta.connection,
    principals: readJson("principals.json"),
    resources: readJson("resources.json"),
    grants: readJson("grants.json"),
    scenarios: readJson("scenarios.json"),
  });
}

/**
 * Metadata-only provider backed by the bundled demo dataset. Constructed with a
 * pre-loaded graph (e.g. in tests) or it loads the demo company on demand.
 */
export class SeedGraphClient implements GraphProvider {
  readonly mode: ConnectionMode = "demo-seed";
  private readonly graph: TenantGraph;

  constructor(graph?: TenantGraph) {
    this.graph = graph ?? loadSeedGraph();
  }

  async loadTenantGraph(): Promise<TenantGraph> {
    return this.graph;
  }

  async listUsers(): Promise<Principal[]> {
    return this.graph.principals.filter((p) => p.kind === "user");
  }

  async listGroups(): Promise<Principal[]> {
    return this.graph.principals.filter((p) => p.kind === "group");
  }

  async listGroupMembers(groupId: string): Promise<Principal[]> {
    return this.graph.principals.filter((p) => p.memberOf.includes(groupId));
  }

  async listSites(): Promise<Resource[]> {
    return this.graph.resources.filter((r) => r.kind === "site");
  }

  async listResources(): Promise<Resource[]> {
    return this.graph.resources;
  }

  async listPermissions(): Promise<PermissionGrant[]> {
    return this.graph.grants;
  }

  async listScenarios(): Promise<Scenario[]> {
    return this.graph.scenarios;
  }
}
