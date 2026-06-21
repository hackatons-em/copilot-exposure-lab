import {
  SENSITIVE_THRESHOLD,
  breadthScore,
  criticalityScore,
  externalReachScore,
  governanceGapScore,
  isEveryone,
  topSensitivityLabel,
} from "./shared.js";
import type { ExposureRule, RuleHit } from "./types.js";

/** Issue 3: a sensitive file inherits broad (whole-org) read from a parent site. */
export const inheritedBroadReadRule: ExposureRule = {
  id: "inherited-broad-read",
  title: "Sensitive file inherits broad read from its parent site",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "file") continue;
      const sens = ctx.classify(resource);
      if (sens.rawScore < SENSITIVE_THRESHOLD) continue;
      for (const access of ctx.pg.effectiveAccess(resource.id)) {
        if (!access.inheritedFrom) continue;
        const principal = ctx.pg.principal(access.principalId);
        if (!isEveryone(principal)) continue; // whole-org inheritance is the issue here
        const ancestor = ctx.pg.resource(access.inheritedFrom);
        const path = ctx.pg.buildExposurePath(access, resource.id, ctx.actorId);
        const first = path.steps[0];
        hits.push({
          ruleId: this.id,
          title: this.title,
          resourceId: resource.id,
          principalId: first?.objectType === "user" ? first.objectId : undefined,
          exposurePath: path,
          evidence: [
            {
              kind: "permission",
              sourceObjectId: access.inheritedFrom,
              sourceObjectType: "site",
              statement: `Site ${ancestor?.name ?? access.inheritedFrom} grants read to ${principal?.displayName}`,
            },
            {
              kind: "permission",
              sourceObjectId: access.grant.id,
              sourceObjectType: "permission",
              statement: `${resource.name} inherits this read grant (inheritance not broken)`,
            },
            {
              kind: "membership",
              sourceObjectId: access.principalId,
              sourceObjectType: "group",
              statement: `${principal?.displayName} effectively covers the whole organization`,
            },
            {
              kind: "sensitivity",
              sourceObjectId: resource.id,
              sourceObjectType: resource.kind,
              statement: `Sensitive content: ${topSensitivityLabel(sens)}`,
            },
          ],
          scoring: {
            sensitivity: sens.rawScore,
            exposureBreadth: breadthScore(ctx.pg, access),
            externalReach: externalReachScore(access),
            agentActionRisk: 0,
            governanceGap: governanceGapScore(resource),
            businessCriticality: criticalityScore(resource),
            confidence: 0.85,
          },
          summary: `${resource.name} inherits broad read from ${ancestor?.name ?? "its parent site"}.`,
          businessImpact: `${resource.name} is readable by the whole organization through inherited site permissions — likely unintended for board-level content.`,
        });
      }
    }
    return hits;
  },
};
