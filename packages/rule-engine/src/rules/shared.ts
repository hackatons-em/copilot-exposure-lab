import type { BusinessCriticality, Principal, Resource } from "@cel/types";
import type { EffectiveAccess, PermissionGraph } from "../graph/permission-graph.js";
import type { SensitivityResult } from "../sensitivity/classifier.js";
import { clamp01 } from "../util.js";

/** A department/security group with this many members is "broad". */
export const BROAD_GROUP_THRESHOLD = 25;
/** Below this sensitivity, access-breadth findings are noise; suppress them. */
export const SENSITIVE_THRESHOLD = 0.5;

export function isEveryone(principal: Principal | undefined): boolean {
  return principal?.membershipKind === "everyone-except-external";
}

export function isBroadGroup(pg: PermissionGraph, principalId: string): boolean {
  const p = pg.principal(principalId);
  if (!p || p.kind !== "group") return false;
  return isEveryone(p) || pg.breadthOf(principalId) >= BROAD_GROUP_THRESHOLD;
}

export function criticalityScore(resource: Resource): number {
  const map: Record<BusinessCriticality, number> = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 };
  return resource.businessCriticality ? map[resource.businessCriticality] : 0.5;
}

/** 0..1 exposure breadth from an access entry's audience + size. */
export function breadthScore(pg: PermissionGraph, access: EffectiveAccess): number {
  if (access.audience === "org-wide" || access.audience === "anyone") return 1;
  const principal = pg.principal(access.principalId);
  if (isEveryone(principal)) return 0.85; // whole-org group
  if (access.audience === "external") return 0.3;
  if (access.audience === "single") return 0.1;
  // group
  return clamp01(Math.max(0.3, access.breadth / 60));
}

/** 0..1 reach outside the organization. */
export function externalReachScore(access: EffectiveAccess): number {
  if (access.audience === "anyone") return 1;
  if (access.audience === "external") return 0.7;
  if (access.audience === "org-wide") return 0.25;
  return 0.1;
}

/** 0..1 governance gap: missing label is the primary signal. */
export function governanceGapScore(resource: Resource): number {
  let gap = 0.2;
  if (resource.sensitivityLabel === null || resource.sensitivityLabel === undefined) gap = 0.7;
  if (resource.kind === "agent" && resource.publication === "unmanaged") gap = Math.max(gap, 0.6);
  return clamp01(gap);
}

/** 0..1 agent/action risk from declared agent actions + connectors. */
export function agentActionRiskScore(resource: Resource): number {
  let risk = 0;
  const actions = resource.agentActions;
  if (actions.includes("mail.send")) risk += 0.8;
  if (actions.some((a) => a.startsWith("external"))) risk += 0.2;
  if ((resource.connectors ?? []).some((c) => /http|webhook|azuread/i.test(c))) risk += 0.15;
  if (resource.authMode === "maker") risk += 0.15;
  return clamp01(risk);
}

/** Compact human-readable summary of the strongest sensitivity signals. */
export function topSensitivityLabel(sens: SensitivityResult): string {
  const terms = [...new Set(sens.signals.map((s) => s.signal).filter((s) => !s.startsWith("label:")))];
  return terms.slice(0, 4).join(", ") || "sensitive content";
}
