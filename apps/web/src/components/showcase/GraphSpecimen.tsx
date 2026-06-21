"use client";

/**
 * Marketing specimen — the attack-path graph.
 *
 * A hand-drawn (NOT React Flow) exposure chain: Bob Novak (user) → Everyone
 * Except External (group) → org-wide link → 2026_salary_plan.xlsx (the critical
 * terminal node). Nodes are positioned absolutely over an SVG layer that draws
 * the connecting arrows; the final, critical edge animates with a flowing dashed
 * stroke. No API, no data — the layout is fixed. Reduced-motion-safe via the hook.
 */
import { useInView } from "@/lib/useInView";

type Kind = "user" | "group" | "link" | "file";

interface Node {
  id: string;
  label: string;
  meta: string;
  kind: Kind;
  /** Center, in the 100×100 percentage coordinate space of the canvas. */
  cx: number;
  cy: number;
}

const NODES: Node[] = [
  { id: "user", label: "Bob Novak", meta: "user", kind: "user", cx: 12, cy: 24 },
  { id: "group", label: "Everyone Except External", meta: "group", kind: "group", cx: 12, cy: 74 },
  { id: "link", label: "Org-wide link", meta: "sharing link", kind: "link", cx: 56, cy: 49 },
  { id: "file", label: "2026_salary_plan.xlsx", meta: "file · confidential", kind: "file", cx: 88, cy: 49 },
];

interface Edge {
  from: string;
  to: string;
  relation: string;
  critical?: boolean;
}

const EDGES: Edge[] = [
  { from: "user", to: "group", relation: "member of" },
  { from: "group", to: "link", relation: "grants" },
  { from: "link", to: "file", relation: "to", critical: true },
];

function nodeStyle(kind: Kind): string {
  switch (kind) {
    case "file":
      return "border-severity-critical/40 bg-severity-critical-soft";
    case "link":
      return "border-brand/30 bg-brand-soft";
    default:
      return "border-hairline bg-surface shadow-sm";
  }
}

function labelStyle(kind: Kind): string {
  if (kind === "file") return "text-severity-critical";
  if (kind === "link") return "text-brand";
  return "text-ink";
}

export function GraphSpecimen({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const byId = (id: string): Node => NODES.find((n) => n.id === id)!;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[28px] bg-brand-soft/40 blur-2xl" />

      <figure className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation-lg">
        <div className="flex items-center justify-between border-b border-hairline bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-severity-critical/70" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">exposure / path</span>
          </div>
          <span className="font-mono text-[10px] text-ink-faint">PATH-001</span>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-brand">
              via group membership
            </span>
          </div>

          <div className="relative aspect-[16/9] w-full rounded-md border border-hairline bg-canvas/70 bg-dotgrid">
            {/* Arrow layer — drawn under the nodes. */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <marker id="gs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="#9795a0" />
                </marker>
                <marker id="gs-arrow-crit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="#c0362c" />
                </marker>
              </defs>

              {EDGES.map((e) => {
                const a = byId(e.from);
                const b = byId(e.to);
                if (e.critical) {
                  return (
                    <line
                      key={`${e.from}-${e.to}`}
                      x1={a.cx}
                      y1={a.cy}
                      x2={b.cx}
                      y2={b.cy}
                      stroke="#c0362c"
                      strokeWidth={0.7}
                      strokeDasharray="2 1.6"
                      markerEnd="url(#gs-arrow-crit)"
                      className={inView ? "[animation:gs-dash_900ms_linear_infinite]" : ""}
                    />
                  );
                }
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={a.cx}
                    y1={a.cy}
                    x2={b.cx}
                    y2={b.cy}
                    stroke="#cfcec7"
                    strokeWidth={0.6}
                    markerEnd="url(#gs-arrow)"
                    style={{ opacity: inView ? 1 : 0, transition: "opacity 600ms ease" }}
                  />
                );
              })}
            </svg>

            {/* Local keyframes for the flowing critical edge. */}
            <style>{`@keyframes gs-dash { to { stroke-dashoffset: -7.2; } }`}</style>

            {/* Relation labels, positioned at edge midpoints. */}
            {EDGES.map((e) => {
              const a = byId(e.from);
              const b = byId(e.to);
              const mx = (a.cx + b.cx) / 2;
              const my = (a.cy + b.cy) / 2;
              return (
                <span
                  key={`lbl-${e.from}-${e.to}`}
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-surface/90 px-1 text-[9px] italic ${
                    e.critical ? "text-severity-critical" : "text-ink-soft"
                  }`}
                  style={{ left: `${mx}%`, top: `${my}%`, opacity: inView ? 1 : 0, transition: "opacity 600ms ease 300ms" }}
                >
                  {e.relation}
                </span>
              );
            })}

            {/* Nodes. */}
            {NODES.map((n, i) => (
              <div
                key={n.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2.5 py-1.5 ${nodeStyle(n.kind)}`}
                style={{
                  left: `${n.cx}%`,
                  top: `${n.cy}%`,
                  maxWidth: "44%",
                  opacity: inView ? 1 : 0,
                  transform: `translate(-50%, ${inView ? "-50%" : "-42%"})`,
                  transition: `opacity 500ms ease ${i * 120}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`,
                }}
              >
                <div className={`truncate text-[12px] font-medium leading-tight ${labelStyle(n.kind)}`}>{n.label}</div>
                <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-ink-faint">{n.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </figure>
    </div>
  );
}
