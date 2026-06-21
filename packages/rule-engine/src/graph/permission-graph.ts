import type {
  ExposurePath,
  GrantVia,
  PathStep,
  PermissionGrant,
  Principal,
  Resource,
  SourceObjectType,
  TenantGraph,
} from "@cel/types";
import { pathId } from "../fingerprint.js";
import { byId, sortBy } from "../util.js";

export type Audience = "single" | "group" | "org-wide" | "anyone" | "external";

/** One way a resource is reachable, with the audience it exposes. */
export interface EffectiveAccess {
  grant: PermissionGrant;
  /** Principal named on the grant (user / group / link audience). */
  principalId: string;
  via: GrantVia;
  /** Ancestor resource id when the grant is inherited down the hierarchy. */
  inheritedFrom?: string;
  audience: Audience;
  /** Concrete user ids that gain access through this grant. */
  reachableUserIds: string[];
  /** Effective number of users reached (>= reachableUserIds.length for large groups). */
  breadth: number;
}

/**
 * Resolves group membership, inheritance, links, guests, and org-wide access
 * into the effective audience of each resource — the substrate every exposure
 * rule reasons over. Pure and deterministic.
 */
export class PermissionGraph {
  private readonly principals: Map<string, Principal>;
  private readonly resources: Map<string, Resource>;
  private readonly grantsByResource: Map<string, PermissionGrant[]>;
  /** Memoized membership closures — the graph is immutable, so safe to cache. */
  private readonly membersCache = new Map<string, Principal[]>();

  constructor(private readonly graph: TenantGraph) {
    this.principals = byId(graph.principals);
    this.resources = byId(graph.resources);
    this.grantsByResource = new Map();
    for (const g of graph.grants) {
      const list = this.grantsByResource.get(g.resourceId) ?? [];
      list.push(g);
      this.grantsByResource.set(g.resourceId, list);
    }
  }

  principal(id: string): Principal | undefined {
    return this.principals.get(id);
  }

  resource(id: string): Resource | undefined {
    return this.resources.get(id);
  }

  allResources(): Resource[] {
    return this.graph.resources;
  }

  allPrincipals(): Principal[] {
    return this.graph.principals;
  }

  /** Ancestor resources, nearest first (walks parentId). */
  ancestorsOf(resourceId: string): Resource[] {
    const out: Resource[] = [];
    let current = this.resources.get(resourceId);
    const guard = new Set<string>();
    while (current?.parentId && !guard.has(current.parentId)) {
      guard.add(current.parentId);
      const parent = this.resources.get(current.parentId);
      if (!parent) break;
      out.push(parent);
      current = parent;
    }
    return out;
  }

  /** Concrete user principals that belong to a principal (expands nested groups). */
  membersOf(principalId: string): Principal[] {
    const cached = this.membersCache.get(principalId);
    if (cached) return cached;
    const computed = this.computeMembersOf(principalId);
    this.membersCache.set(principalId, computed);
    return computed;
  }

  private computeMembersOf(principalId: string): Principal[] {
    const p = this.principals.get(principalId);
    if (!p) return [];
    if (p.kind === "user" || p.kind === "external" || p.kind === "link") return p.kind === "link" ? [] : [p];
    // group: collect users whose memberOf transitively includes this group
    const groupIds = new Set<string>([principalId]);
    let added = true;
    while (added) {
      added = false;
      for (const g of this.graph.principals) {
        if (g.kind === "group" && !groupIds.has(g.id) && g.memberOf.some((m) => groupIds.has(m))) {
          groupIds.add(g.id);
          added = true;
        }
      }
    }
    const users = this.graph.principals.filter(
      (u) => (u.kind === "user" || u.kind === "external") && u.active && u.memberOf.some((m) => groupIds.has(m)),
    );
    return sortBy(users, (u) => u.id);
  }

  /** Effective audience size of a principal. Groups use memberCount when larger than enumerated members. */
  breadthOf(principalId: string): number {
    const p = this.principals.get(principalId);
    if (!p) return 0;
    if (p.kind === "user" || p.kind === "external") return 1;
    const enumerated = this.membersOf(principalId).length;
    return Math.max(p.memberCount ?? 0, enumerated);
  }

  private audienceOf(grant: PermissionGrant, principal: Principal | undefined): Audience {
    if (grant.via === "orgwide" || grant.linkScope === "org-wide") return "org-wide";
    if (grant.linkScope === "anyone") return "anyone";
    if (grant.via === "guest" || principal?.isExternal || principal?.kind === "external") return "external";
    if (principal?.kind === "group") return "group";
    return "single";
  }

  /** Own grants plus grants inherited from ancestor resources. */
  grantsAffecting(resourceId: string): { grant: PermissionGrant; inheritedFrom?: string }[] {
    const own = (this.grantsByResource.get(resourceId) ?? []).map((grant) => ({ grant }));
    const inherited: { grant: PermissionGrant; inheritedFrom?: string }[] = [];
    for (const ancestor of this.ancestorsOf(resourceId)) {
      for (const grant of this.grantsByResource.get(ancestor.id) ?? []) {
        // Owner grants and explicit single-owner perms are not "exposure" inheritance noise we surface,
        // but read/broad grants do flow down. Keep them all; rules decide relevance.
        inherited.push({ grant, inheritedFrom: ancestor.id });
      }
    }
    return [...own, ...inherited];
  }

  /** All effective access entries for a resource, sorted by breadth descending. */
  effectiveAccess(resourceId: string): EffectiveAccess[] {
    const entries = this.grantsAffecting(resourceId).map(({ grant, inheritedFrom }) => {
      const principal = this.principals.get(grant.principalId);
      const reachable = this.membersOf(grant.principalId).map((u) => u.id);
      const breadth = this.breadthOf(grant.principalId);
      return {
        grant,
        principalId: grant.principalId,
        via: grant.via,
        inheritedFrom,
        audience: this.audienceOf(grant, principal),
        reachableUserIds: reachable,
        breadth,
      } satisfies EffectiveAccess;
    });
    return entries.sort((a, b) => b.breadth - a.breadth || (a.grant.id < b.grant.id ? -1 : 1));
  }

  private objType(resource: Resource): SourceObjectType {
    return resource.kind;
  }

  /**
   * Build the ordered exposure path for one access entry, optionally starting
   * from a specific actor (e.g. the scenario persona). Each step's `relation`
   * labels the edge to the following step.
   */
  buildExposurePath(access: EffectiveAccess, targetResourceId: string, actorId?: string): ExposurePath {
    const target = this.resources.get(targetResourceId);
    const grantedResource = access.inheritedFrom ? this.resources.get(access.inheritedFrom) : target;
    const grantPrincipal = this.principals.get(access.principalId);
    const steps: PathStep[] = [];
    const relink = (rel: string): void => {
      const last = steps[steps.length - 1];
      if (last) last.relation = rel;
    };

    // 1. Starting actor (a concrete user where one applies).
    let startUserId: string | undefined;
    if (actorId && access.reachableUserIds.includes(actorId)) startUserId = actorId;
    else if (grantPrincipal && (grantPrincipal.kind === "user" || grantPrincipal.kind === "external"))
      startUserId = grantPrincipal.id;
    else startUserId = [...access.reachableUserIds].sort()[0];

    if (startUserId) {
      const u = this.principals.get(startUserId);
      steps.push({ objectType: "user", objectId: startUserId, label: u?.displayName ?? startUserId, relation: "" });
    }

    // 2. Group hop.
    if (grantPrincipal && grantPrincipal.kind === "group") {
      relink("member of");
      steps.push({ objectType: "group", objectId: grantPrincipal.id, label: grantPrincipal.displayName, relation: "" });
    }

    // 3. Link / guest edge.
    const isLink = access.audience === "org-wide" || access.audience === "anyone" || access.via === "link";
    if (isLink) {
      relink("via");
      const label = access.audience === "anyone" ? "anyone link" : "organization-wide link";
      steps.push({ objectType: "link", objectId: access.grant.id, label, relation: "" });
    } else if (access.via === "guest") {
      relink("guest access to");
    }

    // 4. The granted resource.
    if (grantedResource) {
      relink(steps.length ? "to" : "");
      steps.push({
        objectType: this.objType(grantedResource),
        objectId: grantedResource.id,
        label: grantedResource.name,
        relation: "",
      });
    }

    // 5. Inheritance down to the actual target.
    if (access.inheritedFrom && target && access.inheritedFrom !== targetResourceId) {
      relink("inherited by");
      steps.push({ objectType: this.objType(target), objectId: target.id, label: target.name, relation: "" });
    }

    return { id: pathId(steps.map((s) => s.objectId).join(">")), steps, via: access.via };
  }
}

/** Construct the permission graph for a tenant. */
export function buildPermissionGraph(graph: TenantGraph): PermissionGraph {
  return new PermissionGraph(graph);
}
