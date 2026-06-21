import type {
  ConnectionMode,
  PermissionGrant,
  Principal,
  Resource,
  Scenario,
  TenantGraph,
} from "@cel/types";
import type { GraphProvider } from "../provider.js";

/**
 * Shared metadata-only provider backing for the multi-system seeds. Identical
 * slicing semantics to {@link SeedGraphClient} — a pre-assembled, validated
 * {@link TenantGraph} is exposed through the {@link GraphProvider} contract so
 * the unchanged rule engine runs over each connector's normalized world.
 */
export abstract class SystemSeedClient implements GraphProvider {
  abstract readonly mode: ConnectionMode;
  protected readonly graph: TenantGraph;

  protected constructor(graph: TenantGraph) {
    this.graph = graph;
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

/**
 * Tag every resource with `system:<name>` in its `sensitivityTags` so merged /
 * exported views can attribute a resource to its source system. Returns a new
 * graph; never mutates the input. (Tagging only — the Resource type is unchanged.)
 */
export function tagSystem(graph: TenantGraph, system: string): TenantGraph {
  const tag = `system:${system}`;
  return {
    ...graph,
    resources: graph.resources.map((r) =>
      r.sensitivityTags.includes(tag) ? r : { ...r, sensitivityTags: [...r.sensitivityTags, tag] },
    ),
  };
}
