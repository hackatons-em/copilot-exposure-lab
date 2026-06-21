import type { AccessRemoval, IdentityExposure, TenantGraph } from "@cel/types";
import { buildPermissionGraph, type EffectiveAccess, type PermissionGraph } from "../graph/permission-graph.js";
import { classifySensitivity } from "../sensitivity/classifier.js";
import { isEveryone } from "../rules/shared.js";
import { SENSITIVE_THRESHOLD } from "../rules/shared.js";

/**
 * Identity-centric least-privilege audit. Flips the question from "which file is
 * exposed?" to "which person is over-privileged, and what should they lose?".
 *
 * Deterministic, metadata-only. Reuses the same reachability semantics as the
 * Copilot retrieval simulation (org-wide reaches every internal user; "anyone"
 * reaches everyone; otherwise explicit membership), then attributes each reached
 * sensitive resource to the strongest access path so removals can be recommended.
 */

function reachesActor(access: EffectiveAccess, actorIsExternal: boolean): boolean {
  if (access.audience === "anyone") return true;
  if (access.audience === "org-wide") return !actorIsExternal;
  return false;
}

/** Strongest access entry by which the actor reaches a resource (or undefined). */
function strongestAccessFor(
  access: EffectiveAccess[],
  actorId: string,
): EffectiveAccess | undefined {
  const reachable = access.filter((a) => reachesActor(a, false) || a.reachableUserIds.includes(actorId));
  if (reachable.length === 0) return undefined;
  const rank = (a: EffectiveAccess): number => (reachesActor(a, false) ? 1 : 0);
  return [...reachable].sort(
    (a, b) => rank(b) - rank(a) || b.breadth - a.breadth || (a.grant.id < b.grant.id ? -1 : 1),
  )[0];
}

/** Classify the removal that would cut an access path. */
function removalSource(pg: PermissionGraph, access: EffectiveAccess): { kind: AccessRemoval["kind"]; id: string; label: string } {
  const principal = pg.principal(access.principalId);
  const everyone = isEveryone(principal);
  const isLink = access.audience === "org-wide" || access.audience === "anyone" || access.via === "orgwide" || access.via === "link";
  if (everyone) return { kind: "link", id: access.grant.id, label: "whole-organization access" };
  if (isLink) {
    return { kind: "link", id: access.grant.id, label: access.audience === "anyone" ? "anyone-with-the-link" : "organization-wide link" };
  }
  if (principal?.kind === "group") return { kind: "group", id: principal.id, label: principal.displayName };
  return { kind: "grant", id: access.grant.id, label: "direct grant" };
}

export interface IdentityAuditOptions {
  /** Max identities returned (default 12). */
  limit?: number;
  /** Cap on active human principals evaluated (bounds cost at scale; default 300). */
  principalCap?: number;
  /** Min sensitivity (0..1) for a resource to count (default = the shared threshold). */
  sensitivityThreshold?: number;
}

/** Ranked over-privileged identities with recommended access removals. */
export function identityAudit(graph: TenantGraph, options: IdentityAuditOptions = {}): IdentityExposure[] {
  const { limit = 12, principalCap = 300, sensitivityThreshold = SENSITIVE_THRESHOLD } = options;
  const pg = buildPermissionGraph(graph);

  const sensitiveFiles = graph.resources
    .filter((r) => r.kind === "file")
    .map((r) => ({ r, sensitivity: classifySensitivity(r).rawScore }))
    .filter((x) => x.sensitivity >= sensitivityThreshold)
    .map((x) => ({ ...x, access: pg.effectiveAccess(x.r.id) }));

  const principals = graph.principals
    .filter((p) => p.kind === "user" && !p.isExternal && p.active)
    .slice(0, principalCap);

  const audits: IdentityExposure[] = [];
  for (const p of principals) {
    let topSensitivity = 0;
    let reachableSensitive = 0;
    const bySource = new Map<string, AccessRemoval>();

    for (const { sensitivity, access } of sensitiveFiles) {
      const best = strongestAccessFor(access, p.id);
      if (!best) continue;
      reachableSensitive += 1;
      if (sensitivity > topSensitivity) topSensitivity = sensitivity;
      const src = removalSource(pg, best);
      const key = `${src.kind}:${src.id}`;
      const existing = bySource.get(key);
      if (existing) existing.sensitiveCut += 1;
      else bySource.set(key, { kind: src.kind, targetId: src.id, label: src.label, sensitiveCut: 1 });
    }

    if (reachableSensitive === 0) continue;
    const recommendations = [...bySource.values()]
      .sort((a, b) => b.sensitiveCut - a.sensitiveCut || (a.targetId < b.targetId ? -1 : 1))
      .slice(0, 4);
    audits.push({
      principalId: p.id,
      displayName: p.displayName,
      email: p.email,
      reachableSensitive,
      topSensitivity,
      recommendations,
    });
  }

  audits.sort(
    (a, b) =>
      b.reachableSensitive - a.reachableSensitive ||
      b.topSensitivity - a.topSensitivity ||
      (a.principalId < b.principalId ? -1 : 1),
  );
  return audits.slice(0, limit);
}
