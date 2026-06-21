import type { Band, Finding, SourceObjectType } from "@cel/types";

export interface ExposureGraphNode {
  id: string;
  type: SourceObjectType;
  label: string;
  /** Worst severity of any finding whose path touches this node. */
  risk: Band;
  findingIds: string[];
}

export interface ExposureGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  risk: Band;
  findingIds: string[];
}

export interface ExposureGraphModel {
  nodes: ExposureGraphNode[];
  edges: ExposureGraphEdge[];
}

const BAND_ORDER: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const worse = (a: Band, b: Band): Band => (BAND_ORDER[a] <= BAND_ORDER[b] ? a : b);

/**
 * The visual attack graph: the union of every finding's exposure path. Nodes
 * (users, groups, links, resources) are merged across findings, so a hub like
 * "Everyone Except External Users" appears once with all the paths through it.
 * Each node/edge carries its worst severity + the findings it belongs to.
 * Deterministic; derived purely from finding exposure paths.
 */
export function buildExposureGraphModel(scanResult: { findings: Finding[] }): ExposureGraphModel {
  const nodes = new Map<string, ExposureGraphNode>();
  const edges = new Map<string, ExposureGraphEdge>();

  for (const f of scanResult.findings) {
    const steps = f.exposurePath?.steps ?? [];
    const band = f.risk.band;
    for (const s of steps) {
      const existing = nodes.get(s.objectId);
      if (existing) {
        existing.risk = worse(existing.risk, band);
        if (!existing.findingIds.includes(f.id)) existing.findingIds.push(f.id);
      } else {
        nodes.set(s.objectId, { id: s.objectId, type: s.objectType, label: s.label, risk: band, findingIds: [f.id] });
      }
    }
    for (let i = 0; i < steps.length - 1; i += 1) {
      const src = steps[i]!;
      const tgt = steps[i + 1]!;
      const id = `${src.objectId}->${tgt.objectId}`;
      const existing = edges.get(id);
      if (existing) {
        existing.risk = worse(existing.risk, band);
        if (!existing.findingIds.includes(f.id)) existing.findingIds.push(f.id);
      } else {
        edges.set(id, { id, source: src.objectId, target: tgt.objectId, relation: src.relation || "", risk: band, findingIds: [f.id] });
      }
    }
  }

  const byId = <T extends { id: string }>(a: T, b: T): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return { nodes: [...nodes.values()].sort(byId), edges: [...edges.values()].sort(byId) };
}
