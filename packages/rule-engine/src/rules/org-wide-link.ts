import {
  aiSurfacingRisk,
  breadthScore,
  criticalityScore,
  governanceGapScore,
  topSensitivityLabel,
} from "./shared.js";
import type { ExposureRule, RuleHit } from "./types.js";

/** Issue 1: a sensitive file is reachable through an org-wide / anyone link. */
export const orgWideLinkRule: ExposureRule = {
  id: "org-wide-link",
  title: "Sensitive file shared through an organization-wide link",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    for (const resource of ctx.pg.allResources()) {
      if (resource.kind !== "file") continue;
      const sens = ctx.classify(resource);
      for (const access of ctx.pg.effectiveAccess(resource.id)) {
        const orgWide = access.audience === "org-wide" || access.audience === "anyone";
        if (!orgWide || access.inheritedFrom) continue; // only direct org-wide/anyone links
        const path = ctx.pg.buildExposurePath(access, resource.id, ctx.actorId);
        const first = path.steps[0];
        const label = access.audience === "anyone" ? "anyone-with-the-link" : "organization-wide";
        const principal = ctx.pg.principal(access.principalId);
        hits.push({
          ruleId: this.id,
          title: this.title,
          resourceId: resource.id,
          principalId: first?.objectType === "user" ? first.objectId : undefined,
          exposurePath: path,
          evidence: [
            {
              kind: "link",
              sourceObjectId: access.grant.id,
              sourceObjectType: "link",
              statement: `Sharing link scope = ${label} (read)`,
              data: { linkScope: access.grant.linkScope ?? "org-wide" },
            },
            {
              kind: "permission",
              sourceObjectId: access.grant.id,
              sourceObjectType: "permission",
              statement: `Grants read access to ${principal?.displayName ?? access.principalId}`,
            },
            {
              kind: "membership",
              sourceObjectId: access.principalId,
              sourceObjectType: "group",
              statement: `Reachable by ${access.breadth} internal user(s)`,
              data: { audience: access.breadth },
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
            // Org-wide links are a known exfiltration vector (forwardable, leaks beyond intent).
            externalReach: access.audience === "anyone" ? 1 : 0.8,
            agentActionRisk: aiSurfacingRisk(breadthScore(ctx.pg, access)),
            // The org-wide link itself is a governance gap, independent of the file's label.
            governanceGap: Math.max(governanceGapScore(resource), 0.5),
            businessCriticality: criticalityScore(resource),
            confidence: 1,
          },
          summary: `${resource.name} is reachable through an ${label} sharing link.`,
          businessImpact: `Any of ${access.breadth} users — and anyone a link is forwarded to — can open ${resource.name}. Copilot can surface it to all of them.`,
        });
      }
    }
    return hits;
  },
};
