import type { AgentSummary, Band, Finding, TenantGraph } from "@cel/types";

/**
 * Copilot Studio agent governance inventory. One row per agent resource: its owner
 * (and whether that account is still active), declared actions + connectors, an
 * egress flag, and the findings it triggered with a worst-severity band. Pure +
 * deterministic — built from the tenant graph + the scan's findings.
 */

const BAND_ORDER: Band[] = ["critical", "high", "medium", "low", "info"];

function worstBand(bands: Band[]): Band {
  for (const b of BAND_ORDER) if (bands.includes(b)) return b;
  return "info";
}

const EGRESS_CONNECTOR = /http|webhook|sql|outlook/i;

export function buildAgentInventory(graph: TenantGraph, scanResult: { findings: Finding[] }): AgentSummary[] {
  const principalById = new Map(graph.principals.map((p) => [p.id, p]));
  const findingsByResource = new Map<string, Finding[]>();
  for (const f of scanResult.findings) {
    const list = findingsByResource.get(f.resourceId) ?? [];
    list.push(f);
    findingsByResource.set(f.resourceId, list);
  }

  const summaries: AgentSummary[] = graph.resources
    .filter((r) => r.kind === "agent")
    .map((a) => {
      const owner = a.ownerPrincipalId ? principalById.get(a.ownerPrincipalId) : undefined;
      const findings = findingsByResource.get(a.id) ?? [];
      const connectors = a.connectors ?? [];
      const hasEgress =
        a.agentActions.includes("mail.send") ||
        a.agentActions.some((x) => x.startsWith("external")) ||
        connectors.some((c) => EGRESS_CONNECTOR.test(c));
      return {
        id: a.id,
        name: a.name,
        ownerId: a.ownerPrincipalId,
        ownerName: owner?.displayName ?? a.ownerPrincipalId ?? "—",
        ownerActive: owner ? owner.active !== false : false,
        actions: a.agentActions,
        connectors,
        authMode: a.authMode,
        publication: a.publication,
        riskBand: worstBand(findings.map((f) => f.risk.band)),
        findingIds: findings.map((f) => f.id),
        findingCount: findings.length,
        hasEgress,
      } satisfies AgentSummary;
    });

  summaries.sort(
    (a, b) =>
      BAND_ORDER.indexOf(a.riskBand) - BAND_ORDER.indexOf(b.riskBand) ||
      b.findingCount - a.findingCount ||
      (a.id < b.id ? -1 : 1),
  );
  return summaries;
}
