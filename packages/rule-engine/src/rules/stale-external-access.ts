import { criticalityScore, externalReachScore, governanceGapScore, topSensitivityLabel } from "./shared.js";
import type { EvidenceInput, ExposureRule, RuleHit } from "./types.js";

/** Issue 4: an external guest / contractor still has access (often past expiry). */
export const staleExternalAccessRule: ExposureRule = {
  id: "stale-external-access",
  title: "External guest retains access to a confidential resource",
  evaluate(ctx) {
    const hits: RuleHit[] = [];
    const nowMs = new Date(ctx.now).getTime();
    for (const resource of ctx.pg.allResources()) {
      const sens = ctx.classify(resource);
      for (const access of ctx.pg.effectiveAccess(resource.id)) {
        if (access.inheritedFrom) continue; // report on the directly-granted resource
        const principal = ctx.pg.principal(access.principalId);
        const isExternal = access.via === "guest" || principal?.isExternal === true || principal?.kind === "external";
        if (!isExternal) continue;
        const path = ctx.pg.buildExposurePath(access, resource.id, ctx.actorId);
        const expired = !!access.grant.expirationAt && new Date(access.grant.expirationAt).getTime() < nowMs;
        const evidence: EvidenceInput[] = [
          {
            kind: "permission",
            sourceObjectId: access.grant.id,
            sourceObjectType: "permission",
            statement: `Guest grant: ${principal?.displayName ?? access.principalId} has read on ${resource.name}`,
          },
          {
            kind: "ownership",
            sourceObjectId: access.principalId,
            sourceObjectType: "user",
            statement: `${principal?.displayName} is an external user (${principal?.email ?? "external domain"})`,
          },
          {
            kind: "sensitivity",
            sourceObjectId: resource.id,
            sourceObjectType: resource.kind,
            statement: `Sensitive content: ${topSensitivityLabel(sens)}`,
          },
        ];
        if (expired) {
          evidence.splice(1, 0, {
            kind: "permission",
            sourceObjectId: access.grant.id,
            sourceObjectType: "permission",
            statement: `Access expired ${access.grant.expirationAt} but was never removed`,
            data: { expirationAt: access.grant.expirationAt },
          });
        }
        hits.push({
          ruleId: this.id,
          title: this.title,
          resourceId: resource.id,
          principalId: access.principalId,
          exposurePath: path,
          evidence,
          scoring: {
            sensitivity: Math.max(sens.rawScore, 0.5),
            exposureBreadth: 0.3,
            externalReach: externalReachScore(access),
            agentActionRisk: 0,
            governanceGap: expired ? 0.8 : governanceGapScore(resource),
            businessCriticality: criticalityScore(resource),
            confidence: expired ? 1 : 0.85,
          },
          summary: `External user ${principal?.displayName} still has access to ${resource.name}${expired ? " (expired)" : ""}.`,
          businessImpact: `A contractor/guest outside the company can reach ${resource.name}. If their account or domain is compromised, so is this content.`,
        });
      }
    }
    return hits;
  },
};
