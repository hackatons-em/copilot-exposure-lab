import { agentActionRiskScore, criticalityScore, governanceGapScore } from "./shared.js";
import type { ExposureRule, RuleHit } from "./types.js";

// Connectors that egress data outside governed boundaries / use broad credentials.
const RISKY_CONNECTOR = /webhook|sql|ftp|custom|dataverse|blob|^http$/i;

/** V2: a Copilot Studio agent / Power Platform flow uses a risky egress connector. */
export const connectorRiskRule: ExposureRule = {
  id: "risky-connector",
  title: "Agent or flow uses a risky data-egress connector",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "agent" && resource.kind !== "connector") continue;
      const risky = (resource.connectors ?? []).filter((c) => RISKY_CONNECTOR.test(c));
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
            sourceObjectType: "connector",
            statement: `Risky connectors: ${risky.join(", ")}`,
            data: { connectors: resource.connectors },
          },
          {
            kind: "action",
            sourceObjectId: resource.id,
            sourceObjectType: "action",
            statement: `Actions: ${resource.agentActions.join(", ") || "none"}; auth mode: ${resource.authMode ?? "unknown"}`,
          },
          {
            kind: "ownership",
            sourceObjectId: resource.ownerPrincipalId ?? resource.id,
            sourceObjectType: "user",
            statement: `Owner: ${owner?.displayName ?? "unknown"}; publication: ${resource.publication ?? "unknown"}`,
          },
        ],
        scoring: {
          sensitivity: 0.5,
          exposureBreadth: 0.3,
          externalReach: 0.7,
          agentActionRisk: Math.max(agentActionRiskScore(resource), 0.6),
          governanceGap: governanceGapScore(resource),
          businessCriticality: criticalityScore(resource),
          confidence: 0.85,
        },
        summary: `${resource.name} can move data through ${risky.join(", ")} — an external egress path with broad credentials.`,
        businessImpact: `${resource.name} can push company data to external systems via its connectors. Combined with broad data access, that is an exfiltration channel few teams audit.`,
      });
    }
    return hits;
  },
};
