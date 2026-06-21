import type { TenantGraph } from "@cel/types";
import { buildPermissionGraph, type EffectiveAccess, type PermissionGraph } from "../graph/permission-graph.js";
import { classifySensitivity } from "../sensitivity/classifier.js";

/**
 * One thing M365 Copilot — grounded on what the actor can access — could surface.
 * Deterministic: derived purely from permission metadata + sensitivity signals.
 */
export interface RetrievalItem {
  resourceId: string;
  name: string;
  /** 0..1 sensitivity of the resource (classifier rawScore). */
  sensitivity: number;
  /** Whether the actor can reach the resource through any access path. */
  reachable: boolean;
  /** Short label for the strongest access path, e.g. "organization-wide link". */
  via: string;
  /** Retrieval score: sensitivity when reachable, else 0. */
  score: number;
  /** The classifier signals that drove the sensitivity, strongest first. */
  topSignals: string[];
}

export interface RetrievalResult {
  actorId: string;
  actorName: string;
  items: RetrievalItem[];
}

export interface SimulateRetrievalOptions {
  actorId: string;
  /** Cap on returned items (default 10). */
  limit?: number;
}

/**
 * Whether a broad-audience grant reaches this actor without an explicit member
 * grant. "anyone" (anonymous link) reaches everyone, including external users;
 * "org-wide" is *Everyone Except External Users*, so it excludes external actors.
 */
function reachesActor(access: EffectiveAccess, actorIsExternal: boolean): boolean {
  if (access.audience === "anyone") return true;
  if (access.audience === "org-wide") return !actorIsExternal;
  return false;
}

/** A short, human-readable label for one access path. */
function viaLabel(pg: PermissionGraph, access: EffectiveAccess): string {
  if (access.audience === "org-wide") return "organization-wide link";
  if (access.audience === "anyone") return "anyone-with-the-link";
  const principal = pg.principal(access.principalId);
  if (principal?.kind === "group") {
    const breadth = pg.breadthOf(access.principalId);
    return `broad group (${breadth})`;
  }
  if (access.audience === "external" || access.via === "guest") return "guest access";
  return "direct";
}

/**
 * Choose the single strongest access path the actor has to a resource. Strongest
 * = widest audience (org-wide/anyone first), then largest breadth, then a stable
 * grant-id tie-break. Returns undefined when the actor cannot reach the resource.
 */
function strongestAccessFor(
  pg: PermissionGraph,
  resourceId: string,
  actorId: string,
  actorIsExternal: boolean,
): EffectiveAccess | undefined {
  const reachable = pg
    .effectiveAccess(resourceId)
    .filter((a) => reachesActor(a, actorIsExternal) || a.reachableUserIds.includes(actorId));
  if (reachable.length === 0) return undefined;
  const rank = (a: EffectiveAccess): number => (reachesActor(a, actorIsExternal) ? 1 : 0);
  return [...reachable].sort(
    (a, b) => rank(b) - rank(a) || b.breadth - a.breadth || (a.grant.id < b.grant.id ? -1 : 1),
  )[0];
}

/**
 * Simulate what M365 Copilot could surface to one actor: every sensitive file
 * the actor can reach, ranked by sensitivity. The product thesis made concrete —
 * grounded entirely in permission metadata, never on document content.
 */
export function simulateRetrieval(graph: TenantGraph, opts: SimulateRetrievalOptions): RetrievalResult {
  const pg = buildPermissionGraph(graph);
  const actor = pg.principal(opts.actorId);
  const actorIsExternal = actor?.isExternal === true || actor?.kind === "external";
  const limit = opts.limit ?? 10;

  const items: RetrievalItem[] = [];
  for (const resource of graph.resources) {
    if (resource.kind !== "file") continue;
    const sensitivity = classifySensitivity(resource).rawScore;
    if (sensitivity <= 0) continue;
    const access = strongestAccessFor(pg, resource.id, opts.actorId, actorIsExternal);
    if (!access) continue;
    const topSignals = classifySensitivity(resource)
      .signals.slice()
      .sort((a, b) => b.weight - a.weight || (a.signal < b.signal ? -1 : 1))
      .map((s) => s.signal);
    items.push({
      resourceId: resource.id,
      name: resource.name,
      sensitivity,
      reachable: true,
      via: viaLabel(pg, access),
      score: sensitivity,
      topSignals,
    });
  }

  items.sort((a, b) => b.score - a.score || (a.resourceId < b.resourceId ? -1 : 1));

  return {
    actorId: opts.actorId,
    actorName: actor?.displayName ?? opts.actorId,
    items: items.slice(0, limit),
  };
}
