import { SENSITIVE_THRESHOLD, criticalityScore, topSensitivityLabel } from "./shared.js";
import type { ExposureRule, RuleHit } from "./types.js";

/** Issue 5: a sensitive file has no sensitivity label, so DLP/Copilot can't protect it. */
export const missingLabelRule: ExposureRule = {
  id: "missing-label",
  title: "Sensitive file is missing a sensitivity label",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "file") continue;
      const sens = ctx.classify(resource);
      if (sens.rawScore < SENSITIVE_THRESHOLD) continue;
      const labelled = resource.sensitivityLabel !== null && resource.sensitivityLabel !== undefined;
      if (labelled) continue;
      const maxBreadth = ctx.pg.effectiveAccess(resource.id).reduce((m, a) => Math.max(m, a.breadth), 0);
      hits.push({
        ruleId: this.id,
        title: this.title,
        resourceId: resource.id,
        evidence: [
          {
            kind: "label",
            sourceObjectId: resource.id,
            sourceObjectType: resource.kind,
            statement: "No sensitivity label applied",
            data: { sensitivityLabel: null },
          },
          {
            kind: "sensitivity",
            sourceObjectId: resource.id,
            sourceObjectType: resource.kind,
            statement: `Content appears sensitive: ${topSensitivityLabel(sens)}`,
          },
        ],
        scoring: {
          sensitivity: sens.rawScore,
          exposureBreadth: Math.min(1, maxBreadth / 60),
          externalReach: 0.1,
          agentActionRisk: 0.6,
          governanceGap: 0.7,
          businessCriticality: criticalityScore(resource),
          confidence: 0.8,
        },
        summary: `${resource.name} looks sensitive but carries no sensitivity label.`,
        businessImpact: `Without a label, Purview DLP and Copilot can't enforce handling rules on ${resource.name}, so it may be summarized or shared without restriction.`,
      });
    }
    return hits;
  },
};
