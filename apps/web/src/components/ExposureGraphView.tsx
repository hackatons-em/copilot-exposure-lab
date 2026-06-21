"use client";

import { useMemo, type ComponentType } from "react";
import Dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type EdgeMarker,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ExposureGraphEdge, ExposureGraphModel, ExposureGraphNode } from "@/lib/api";
import {
  ActionIcon,
  AgentIcon,
  ConnectorIcon,
  DriveIcon,
  FileIcon,
  FolderIcon,
  GroupIcon,
  type IconProps,
  LinkIcon,
  PermissionIcon,
  SiteIcon,
  UserIcon,
} from "@/components/icons";

/**
 * Visual attack/exposure graph. Lays the model out left→right with dagre, then
 * renders it with React Flow. Node appearance is keyed off `type` (icon) and
 * `risk` (colored border/badge); critical resources stand out in red. Edges
 * carry the relation as their label and animate when risky.
 *
 * When `focusFindingId` is set (the finding-detail mini-graph), nodes/edges that
 * don't belong to that finding's path are dimmed so the focused chain stays
 * vivid. The component is deliberately read-only — no connect handles.
 */

type Band = ExposureGraphNode["risk"];

/** Band → hex. Mirrors the severity tokens used across the app (color lives here). */
const BAND_COLOR: Record<Band, string> = {
  critical: "#c0362c",
  high: "#c4570a",
  medium: "#b07a12",
  low: "#2f6f4f",
  info: "#56565f",
};

const BRAND = "#0071e3";
const BORDER = "#e6e5df";
const INK = "#16161a";

/** Bespoke thin-stroke icon per node type (no emoji). */
const TYPE_ICON: Record<ExposureGraphNode["type"], ComponentType<IconProps>> = {
  user: UserIcon,
  group: GroupIcon,
  link: LinkIcon,
  file: FileIcon,
  folder: FolderIcon,
  site: SiteIcon,
  drive: DriveIcon,
  agent: AgentIcon,
  connector: ConnectorIcon,
  permission: PermissionIcon,
  action: ActionIcon,
};

/** Resource-ish node types — these are the "things reached", highlighted when critical. */
const RESOURCE_TYPES = new Set<ExposureGraphNode["type"]>(["file", "folder", "drive", "site"]);

const NODE_WIDTH = 196;
const NODE_HEIGHT = 64;

/** Extra data we attach to each React Flow node so the custom renderer can style it. */
interface ExposureNodeData extends Record<string, unknown> {
  label: string;
  nodeType: ExposureGraphNode["type"];
  risk: Band;
  dimmed: boolean;
  emphasized: boolean;
}

type ExposureFlowNode = Node<ExposureNodeData, "exposure">;

/** Custom node: icon + label + a colored risk badge, bordered by band. */
function ExposureNode({ data }: NodeProps<ExposureFlowNode>) {
  const band = data.risk;
  const color = BAND_COLOR[band];
  const isCriticalResource = band === "critical" && RESOURCE_TYPES.has(data.nodeType);

  const borderColor = isCriticalResource ? BAND_COLOR.critical : band === "info" ? BORDER : color;
  const background = isCriticalResource ? "#fbedeb" : "#ffffff";
  const borderWidth = data.emphasized || isCriticalResource ? 2 : 1;

  return (
    <div
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        borderRadius: 10,
        border: `${borderWidth}px solid ${borderColor}`,
        background,
        boxShadow: data.emphasized ? "0 1px 4px rgba(26,31,41,0.12)" : "0 1px 2px rgba(26,31,41,0.05)",
        opacity: data.dimmed ? 0.28 : 1,
        transition: "opacity 150ms ease",
        padding: "8px 10px",
        boxSizing: "border-box",
      }}
    >
      {/* Handles are present so edges connect, but no interactive connecting is offered. */}
      <Handle type="target" position={Position.Left} isConnectable={false} style={{ opacity: 0, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span aria-hidden style={{ color: "#6e6e73", lineHeight: 0, marginTop: 1 }}>
          {(() => {
            const NodeIcon = TYPE_ICON[data.nodeType];
            return <NodeIcon size={16} />;
          })()}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
            }}
            title={data.label}
          >
            {data.label}
          </div>
          <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9795a0",
                fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              }}
            >
              {data.nodeType}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color,
                background: `${color}1a`,
                borderRadius: 999,
                padding: "1px 6px",
              }}
            >
              {band}
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const NODE_TYPES = { exposure: ExposureNode } as const;

const ARROW: EdgeMarker = { type: MarkerType.ArrowClosed, width: 16, height: 16 };

/** Severity ordering — critical first. Used to keep the highest-risk chains. */
const BAND_RANK: Record<Band, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

interface CappedGraph {
  model: ExposureGraphModel;
  shownFindings: number;
  totalFindings: number;
  shownNodes: number;
  totalNodes: number;
  truncated: boolean;
}

/**
 * At enterprise scale a tenant has thousands of nodes — unreadable and slow to lay
 * out. Keep whole exposure chains (never orphan nodes) for the highest-severity
 * findings first, until a node budget is hit. Returns the capped model plus the
 * counts needed for a "showing top N of M" note. No-op when already under budget.
 */
function capToTopRisk(model: ExposureGraphModel, maxNodes: number): CappedGraph {
  const totalNodes = model.nodes.length;
  const allFindingIds = new Set<string>();
  for (const n of model.nodes) for (const fid of n.findingIds) allFindingIds.add(fid);
  const totalFindings = allFindingIds.size;

  if (totalNodes <= maxNodes) {
    return { model, shownFindings: totalFindings, totalFindings, shownNodes: totalNodes, totalNodes, truncated: false };
  }

  // Best (lowest) band rank each finding touches → rank findings by severity.
  const findingRank = new Map<string, number>();
  for (const n of model.nodes) {
    const r = BAND_RANK[n.risk];
    for (const fid of n.findingIds) {
      findingRank.set(fid, Math.min(findingRank.get(fid) ?? 99, r));
    }
  }
  const nodesByFinding = new Map<string, string[]>();
  for (const n of model.nodes) {
    for (const fid of n.findingIds) {
      const list = nodesByFinding.get(fid) ?? [];
      list.push(n.id);
      nodesByFinding.set(fid, list);
    }
  }
  const orderedFindings = [...findingRank.keys()].sort((a, b) => {
    const byRank = (findingRank.get(a) ?? 99) - (findingRank.get(b) ?? 99);
    return byRank !== 0 ? byRank : a < b ? -1 : 1; // stable, deterministic
  });

  const keptNodeIds = new Set<string>();
  const keptFindings = new Set<string>();
  for (const fid of orderedFindings) {
    const nodeIds = nodesByFinding.get(fid) ?? [];
    const projected = new Set(keptNodeIds);
    for (const id of nodeIds) projected.add(id);
    if (projected.size > maxNodes && keptNodeIds.size > 0) break;
    for (const id of nodeIds) keptNodeIds.add(id);
    keptFindings.add(fid);
    if (keptNodeIds.size >= maxNodes) break;
  }

  const nodes = model.nodes.filter((n) => keptNodeIds.has(n.id));
  const edges = model.edges.filter((e) => keptNodeIds.has(e.source) && keptNodeIds.has(e.target));
  return {
    model: { nodes, edges },
    shownFindings: keptFindings.size,
    totalFindings,
    shownNodes: nodes.length,
    totalNodes,
    truncated: true,
  };
}

/** Run dagre and return positioned React Flow nodes + edges. */
function layout(model: ExposureGraphModel, focusFindingId?: string): { nodes: ExposureFlowNode[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 28, ranksep: 90, marginx: 16, marginy: 16 });

  for (const node of model.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  const nodeIds = new Set(model.nodes.map((n) => n.id));
  for (const edge of model.edges) {
    // Guard against edges that reference a node missing from the union.
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  Dagre.layout(g);

  const inFocus = (findingIds: string[]): boolean =>
    !focusFindingId || findingIds.includes(focusFindingId);

  const nodes: ExposureFlowNode[] = model.nodes.map((node) => {
    const pos = g.node(node.id);
    const x = pos ? pos.x - NODE_WIDTH / 2 : 0;
    const y = pos ? pos.y - NODE_HEIGHT / 2 : 0;
    const focused = inFocus(node.findingIds);
    return {
      id: node.id,
      type: "exposure",
      position: { x, y },
      data: {
        label: node.label,
        nodeType: node.type,
        risk: node.risk,
        dimmed: Boolean(focusFindingId) && !focused,
        emphasized: Boolean(focusFindingId) && focused,
      },
      draggable: true,
      connectable: false,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  const edges: Edge[] = model.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge: ExposureGraphEdge) => {
      const focused = inFocus(edge.findingIds);
      const dimmed = Boolean(focusFindingId) && !focused;
      const risky = edge.risk === "critical" || edge.risk === "high";
      const color = risky ? BAND_COLOR[edge.risk] : "#b8b6ad";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation.replace(/[-_]/g, " "),
        animated: risky && !dimmed,
        markerEnd: ARROW,
        style: { stroke: color, strokeWidth: risky ? 2 : 1.5, opacity: dimmed ? 0.2 : 1 },
        labelStyle: { fill: "#56565f", fontSize: 10, fontWeight: 500, fontStyle: "italic" },
        labelBgStyle: { fill: "#ffffff", fillOpacity: dimmed ? 0.2 : 0.85 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      } satisfies Edge;
    });

  return { nodes, edges };
}

export interface ExposureGraphViewProps {
  model: ExposureGraphModel;
  /** When set, dim everything not on this finding's path. */
  focusFindingId?: string;
  /** Container height in px (default 560 for the page; ~320 for the mini-graph). */
  height?: number;
  /** Max nodes rendered before aggregating to the top-risk subgraph (full-graph view). */
  maxNodes?: number;
}

export function ExposureGraphView({ model, focusFindingId, height = 560, maxNodes = 80 }: ExposureGraphViewProps) {
  // A single-finding mini-graph is always small; only the full graph needs capping.
  const capped = useMemo(
    () => (focusFindingId ? null : capToTopRisk(model, maxNodes)),
    [model, focusFindingId, maxNodes],
  );
  const renderModel = capped ? capped.model : model;
  const { nodes, edges } = useMemo(() => layout(renderModel, focusFindingId), [renderModel, focusFindingId]);

  if (model.nodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-surface/60 px-6 text-center"
        style={{ height }}
      >
        <h3 className="font-display text-lg font-semibold tracking-tightest text-ink">No exposure paths yet</h3>
        <p className="mt-1 max-w-md text-sm text-ink-soft">
          Run an exposure assessment to compute findings — the graph draws itself from every finding&apos;s path.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-hairline bg-surface-subtle shadow-elevation"
      style={{ height, width: "100%", position: "relative" }}
    >
      {capped?.truncated && (
        <div
          className="absolute left-3 top-3 z-10 rounded-md border border-hairline bg-surface/95 px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-ink-soft shadow-elevation backdrop-blur"
          title="At scale the graph aggregates to the highest-severity exposure chains so it stays readable."
        >
          Showing top {capped.shownFindings.toLocaleString()} of {capped.totalFindings.toLocaleString()} exposure paths
          {" · "}
          {capped.shownNodes} of {capped.totalNodes.toLocaleString()} nodes
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
        defaultEdgeOptions={{ markerEnd: ARROW }}
      >
        <Background color={BORDER} gap={18} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const data = n.data as ExposureNodeData | undefined;
            return data ? BAND_COLOR[data.risk] : BRAND;
          }}
          nodeStrokeWidth={2}
          maskColor="rgba(236,235,230,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
