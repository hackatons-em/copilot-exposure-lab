import type { Band, Finding, ScanResult } from "@cel/types";
import { type ExportArtifact, type ExportContext, joinFindings } from "./common.js";

interface PurviewAction {
  resourceId: string;
  recommendedLabel: "Highly Confidential" | "Confidential" | "General";
  rationale: string;
  findingIds: string[];
}

interface PurviewMapping {
  workspace: string;
  generatedAt: string;
  actions: PurviewAction[];
}

const BAND_RANK: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

function labelFor(bands: Set<Band>): PurviewAction["recommendedLabel"] {
  if (bands.has("critical")) return "Highly Confidential";
  if (bands.has("high")) return "Confidential";
  return "General";
}

/**
 * Microsoft Purview labeling recommendations, one per resource that has findings.
 * Resources are emitted in first-seen order (engine order, descending risk) so
 * the output is deterministic. Pure transform — no time or random.
 */
export function toPurviewMapping(scanResult: ScanResult, ctx: ExportContext): ExportArtifact {
  const joined = joinFindings(scanResult);

  const order: string[] = [];
  const byResource = new Map<string, Finding[]>();
  for (const { finding } of joined) {
    const list = byResource.get(finding.resourceId);
    if (list) {
      list.push(finding);
    } else {
      byResource.set(finding.resourceId, [finding]);
      order.push(finding.resourceId);
    }
  }

  const actions: PurviewAction[] = order.map((resourceId) => {
    const findings = byResource.get(resourceId) ?? [];
    const bands = new Set<Band>(findings.map((f) => f.risk.band));
    // Top finding titles: highest band first, de-duplicated, stable.
    const topTitles = [...findings]
      .sort((a, b) => BAND_RANK[a.risk.band] - BAND_RANK[b.risk.band])
      .map((f) => f.title);
    const uniqueTitles = [...new Set(topTitles)];
    return {
      resourceId,
      recommendedLabel: labelFor(bands),
      rationale: uniqueTitles.join("; "),
      findingIds: findings.map((f) => f.id),
    };
  });

  const mapping: PurviewMapping = {
    workspace: ctx.workspaceName,
    generatedAt: scanResult.generatedAt,
    actions,
  };

  return {
    filename: "copilot-exposure-purview.json",
    contentType: "application/json",
    body: JSON.stringify(mapping, null, 2),
  };
}
