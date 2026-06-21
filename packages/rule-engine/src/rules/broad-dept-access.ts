import {
  SENSITIVE_THRESHOLD,
  aiSurfacingRisk,
  breadthScore,
  criticalityScore,
  externalReachScore,
  governanceGapScore,
  isBroadGroup,
  isEveryone,
  topSensitivityLabel,
} from "./shared.js";
import type { EvidenceInput, ExposureRule, RuleHit } from "./types.js";

/** Issue 2: a sensitive file is exposed to a broad department group (e.g. Sales). */
export const broadDeptAccessRule: ExposureRule = {
  id: "broad-dept-access",
  title: "Sensitive file exposed to a broad department group",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "file") continue;
      const sens = ctx.classify(resource);
      if (sens.rawScore < SENSITIVE_THRESHOLD) continue;
      for (const access of ctx.pg.effectiveAccess(resource.id)) {
        const principal = ctx.pg.principal(access.principalId);
        if (!principal || principal.kind !== "group") continue;
        if (isEveryone(principal)) continue; // org-wide handled elsewhere
        if (!isBroadGroup(ctx.pg, access.principalId)) continue;
        const path = ctx.pg.buildExposurePath(access, resource.id, ctx.actorId);
        const evidence: EvidenceInput[] = [
          {
            kind: "permission",
            sourceObjectId: access.grant.id,
            sourceObjectType: "permission",
            statement: `Grants read to ${principal.displayName} (${access.breadth} members)`,
          },
          {
            kind: "membership",
            sourceObjectId: principal.id,
            sourceObjectType: "group",
            statement: `${principal.displayName} has ${access.breadth} members`,
            data: { memberCount: access.breadth },
          },
          {
            kind: "sensitivity",
            sourceObjectId: resource.id,
            sourceObjectType: resource.kind,
            statement: `Sensitive content: ${topSensitivityLabel(sens)}`,
          },
        ];
        if (access.inheritedFrom) {
          const ancestor = ctx.pg.resource(access.inheritedFrom);
          evidence.splice(1, 0, {
            kind: "permission",
            sourceObjectId: access.inheritedFrom,
            sourceObjectType: "site",
            statement: `Permission inherited from ${ancestor?.name ?? access.inheritedFrom}`,
          });
        }
        hits.push({
          ruleId: this.id,
          title: this.title,
          resourceId: resource.id,
          exposurePath: path,
          evidence,
          scoring: {
            sensitivity: sens.rawScore,
            exposureBreadth: breadthScore(ctx.pg, access),
            externalReach: externalReachScore(access),
            agentActionRisk: aiSurfacingRisk(breadthScore(ctx.pg, access)),
            governanceGap: Math.max(governanceGapScore(resource), 0.4),
            businessCriticality: criticalityScore(resource),
            confidence: 0.9,
          },
          summary: `${resource.name} is readable by the entire ${principal.displayName} (${access.breadth} members).`,
          businessImpact: `${access.breadth} people in ${principal.displayName} can open ${resource.name}, far beyond its intended audience.`,
        });
      }
    }
    return hits;
  },
};
