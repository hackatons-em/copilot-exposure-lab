import type { ScanResult } from "@cel/types";
import { type ExportArtifact, type ExportContext, bandLabel, joinFindings } from "./common.js";

interface DefenderEntity {
  type: "resource" | "user";
  id: string;
}

interface DefenderAlert {
  title: string;
  severity: string;
  category: "AIExposure";
  status: string;
  description: string;
  entities: DefenderEntity[];
  recommendedAction: string;
}

/**
 * Microsoft Defender-style alert records, one per finding. Entities link the
 * affected resource and (where known) the principal. Deterministic transform.
 */
export function toDefenderAlerts(scanResult: ScanResult, _ctx: ExportContext): ExportArtifact {
  const joined = joinFindings(scanResult);

  const alerts: DefenderAlert[] = joined.map(({ finding, remediation }) => {
    const entities: DefenderEntity[] = [{ type: "resource", id: finding.resourceId }];
    if (finding.principalId) entities.push({ type: "user", id: finding.principalId });
    return {
      title: finding.title,
      severity: bandLabel(finding.risk.band),
      category: "AIExposure",
      status: finding.status,
      description: `${finding.summary} ${finding.businessImpact}`,
      entities,
      recommendedAction: remediation?.title ?? "",
    };
  });

  return {
    filename: "copilot-exposure-defender-alerts.json",
    contentType: "application/json",
    body: JSON.stringify(alerts, null, 2),
  };
}
