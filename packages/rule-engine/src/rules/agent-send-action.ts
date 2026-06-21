import { agentActionRiskScore, criticalityScore, governanceGapScore } from "./shared.js";
import type { ExposureRule, RuleHit } from "./types.js";

const RISKY_ACTIONS = ["mail.send", "external"];

/** Issue 6: a Copilot Studio-style agent can take a risky action (e.g. send mail externally). */
export const agentSendActionRule: ExposureRule = {
  id: "agent-send-action",
  title: "Agent can take a risky external action",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "agent") continue;
      const risky = resource.agentActions.filter((a) => RISKY_ACTIONS.some((r) => a.startsWith(r)));
      if (risky.length === 0) continue;
      const owner = resource.ownerPrincipalId ? ctx.pg.principal(resource.ownerPrincipalId) : undefined;
      hits.push({
        ruleId: this.id,
        title: this.title,
        resourceId: resource.id,
        evidence: [
          {
            kind: "agent-config",
            sourceObjectId: resource.id,
            sourceObjectType: "agent",
            statement: `Agent actions enabled: ${risky.join(", ")}`,
            data: { actions: resource.agentActions },
          },
          {
            kind: "action",
            sourceObjectId: resource.id,
            sourceObjectType: "action",
            statement: `Connectors: ${(resource.connectors ?? []).join(", ") || "none"}`,
            data: { connectors: resource.connectors ?? [] },
          },
          {
            kind: "ownership",
            sourceObjectId: resource.ownerPrincipalId ?? resource.id,
            sourceObjectType: "user",
            statement: `Authentication mode: ${resource.authMode ?? "unknown"}; owner: ${owner?.displayName ?? "unknown"}`,
          },
        ],
        scoring: {
          sensitivity: 0.6,
          exposureBreadth: 0.5,
          externalReach: resource.agentActions.some((a) => a.startsWith("external") || a === "mail.send") ? 0.7 : 0.3,
          agentActionRisk: agentActionRiskScore(resource),
          governanceGap: governanceGapScore(resource),
          businessCriticality: criticalityScore(resource),
          confidence: 0.9,
        },
        summary: `${resource.name} can ${risky.join(" and ")} — a risky action for an agent over company data.`,
        businessImpact: `${resource.name} could send sensitive summaries to external recipients on a user's behalf. Combined with broad data access, that is an exfiltration path.`,
      });
    }
    return hits;
  },
};
