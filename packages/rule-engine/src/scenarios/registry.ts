import type { Finding, Resource, Scenario, ScenarioKey } from "@cel/types";
import type { PermissionGraph } from "../graph/permission-graph.js";
import type { SensitivityResult } from "../sensitivity/classifier.js";

/**
 * A scenario is a LENS over the same findings — it surfaces the subset relevant
 * to a persona/condition. It never invents findings; it selects them.
 */
export interface ScenarioLensContext {
  pg: PermissionGraph;
  classify: (r: Resource) => SensitivityResult;
  scenario: Scenario;
}

export type ScenarioLens = (finding: Finding, ctx: ScenarioLensContext) => boolean;

const PERMISSION_RULES = new Set(["org-wide-link", "broad-dept-access", "inherited-broad-read"]);
const AGENT_RULES = new Set(["agent-send-action", "orphaned-agent-owner"]);

function reachableByActor(pg: PermissionGraph, resourceId: string, actorId: string): boolean {
  return pg.effectiveAccess(resourceId).some((a) => a.reachableUserIds.includes(actorId));
}

export const SCENARIO_LENSES: Record<ScenarioKey, ScenarioLens> = {
  // What a normal employee (the persona) can actually reach through permissions.
  "normal-employee": (f, { pg, scenario }) =>
    PERMISSION_RULES.has(f.ruleId) &&
    !!scenario.actorPrincipalId &&
    reachableByActor(pg, f.resourceId, scenario.actorPrincipalId),

  // What an external contractor/guest still reaches.
  "contractor-guest": (f) => f.ruleId === "stale-external-access",

  // Anything exposed broadly (org-wide links, big groups, inherited broad read).
  "broad-sharing": (f) => PERMISSION_RULES.has(f.ruleId),

  // High-sensitivity files reachable beyond intent.
  "sensitive-file": (f, { pg, classify }) => {
    const r = pg.resource(f.resourceId);
    return !!r && r.kind === "file" && classify(r).rawScore >= 0.7 && !AGENT_RULES.has(f.ruleId);
  },

  // Risky Copilot Studio-style agents.
  "agent-action": (f) => AGENT_RULES.has(f.ruleId),

  // Access that outlived its holder: a departed agent owner, an expired guest, or
  // any exposure path running through a now-inactive principal. The persistence
  // risk that offboarding missed (ATT&CK Valid Accounts).
  "departing-employee": (f, { pg }) => {
    if (f.ruleId === "orphaned-agent-owner" || f.ruleId === "stale-external-access") return true;
    const steps = f.exposurePath?.steps ?? [];
    return steps.some(
      (s) => (s.objectType === "user" || s.objectType === "group") && pg.principal(s.objectId)?.active === false,
    );
  },

  // The high-impact surface a single compromised identity could reach and damage:
  // broadly-shared sensitive resources (critical/high) plus agents with send/egress
  // capability (an automated exfiltration path). "One phished account → this much."
  "ransomware-blast-radius": (f) =>
    (PERMISSION_RULES.has(f.ruleId) && (f.risk.band === "critical" || f.risk.band === "high")) ||
    f.ruleId === "agent-send-action" ||
    f.ruleId === "risky-connector",
};
