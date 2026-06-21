import { agentActionRiskScore, criticalityScore } from "./shared.js";
import type { ExposureRule, RuleHit } from "./types.js";

/** Issue 7: an agent runs under a departed/inactive maker (orphaned ownership). */
export const orphanedAgentOwnerRule: ExposureRule = {
  id: "orphaned-agent-owner",
  title: "Agent owned by a departed or inactive maker",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "agent") continue;
      const owner = resource.ownerPrincipalId ? ctx.pg.principal(resource.ownerPrincipalId) : undefined;
      const orphaned = !owner || owner.active === false;
      if (!orphaned) continue;
      hits.push({
        ruleId: this.id,
        title: this.title,
        resourceId: resource.id,
        principalId: owner?.id,
        evidence: [
          {
            kind: "ownership",
            sourceObjectId: owner?.id ?? resource.id,
            sourceObjectType: "user",
            statement: owner
              ? `Owner ${owner.displayName} is inactive/offboarded (${owner.jobTitle ?? "former employee"})`
              : "Agent has no resolvable owner",
            data: { ownerActive: owner?.active ?? null },
          },
          {
            kind: "agent-config",
            sourceObjectId: resource.id,
            sourceObjectType: "agent",
            statement: `Publication: ${resource.publication ?? "unknown"}; auth mode: ${resource.authMode ?? "unknown"}`,
          },
        ],
        scoring: {
          sensitivity: 0.4,
          exposureBreadth: 0.3,
          externalReach: resource.agentActions.some((a) => a.startsWith("external") || a === "mail.send") ? 0.5 : 0.2,
          agentActionRisk: agentActionRiskScore(resource),
          governanceGap: 0.7,
          businessCriticality: criticalityScore(resource),
          confidence: 0.95,
        },
        summary: `${resource.name} is owned by ${owner?.displayName ?? "no active user"} — nobody accountable governs it.`,
        businessImpact: `An agent with live actions but a departed owner has no one to review or revoke it. It keeps running unmanaged.`,
      });
    }
    return hits;
  },
};
