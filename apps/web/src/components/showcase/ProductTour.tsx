"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  CopilotSimSpecimen,
  FixScriptSpecimen,
  GaugeSpecimen,
  GraphSpecimen,
  PlannerSpecimen,
  ReportSpecimen,
  ThreatMatrixSpecimen,
} from "./index";

interface TourTab {
  key: string;
  label: string;
  title: string;
  blurb: string;
  Specimen: ComponentType<{ className?: string }>;
}

const TABS: TourTab[] = [
  {
    key: "score",
    label: "Exposure score",
    title: "One number your board can track",
    blurb: "A single 0–100 score for your whole organization, with how you compare to peers. It goes down as you fix things.",
    Specimen: GaugeSpecimen,
  },
  {
    key: "graph",
    label: "Attack graph",
    title: "See the exact path to the data",
    blurb: "Every finding shows the path: who can reach what, and through which group, link, or AI assistant.",
    Specimen: GraphSpecimen,
  },
  {
    key: "copilot",
    label: "Copilot exposure",
    title: "What Copilot would actually surface",
    blurb: "Ask a question as a specific person and see the sensitive files Copilot would pull up for them.",
    Specimen: CopilotSimSpecimen,
  },
  {
    key: "fix",
    label: "Find + Fix",
    title: "The exact Microsoft fix, written for you",
    blurb: "Each finding comes with the exact Microsoft commands to close it, ready to copy. Advice only — never run for you.",
    Specimen: FixScriptSpecimen,
  },
  {
    key: "planner",
    label: "Remediation plan",
    title: "Fix these 5, drop the score the most",
    blurb: "Fixes ranked by how much risk each removes for the effort, with a live what-if. Turns a long list into a plan.",
    Specimen: PlannerSpecimen,
  },
  {
    key: "threat",
    label: "Threat model",
    title: "Mapped to the frameworks you report on",
    blurb: "Every check maps to MITRE ATT&CK and the NIST 800-53 / CISA security frameworks teams already report against.",
    Specimen: ThreatMatrixSpecimen,
  },
  {
    key: "report",
    label: "Board report",
    title: "A board-ready report in one click",
    blurb: "Your risk score, a heat map, the top risks, and a step-by-step fix plan. The same output every time.",
    Specimen: ReportSpecimen,
  },
];

const ADVANCE_MS = 6000;

export function ProductTour() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % TABS.length), ADVANCE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused]);

  const tab = TABS[active]!;
  const Specimen = tab.Specimen;

  return (
    <div
      className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Tab rail */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {TABS.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(i)}
              aria-current={isActive ? "true" : undefined}
              className={`group relative shrink-0 overflow-hidden rounded-lg border px-4 py-3 text-left transition-colors duration-200 lg:shrink ${
                isActive
                  ? "border-brand/40 bg-brand-soft/60"
                  : "border-hairline bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className={`text-sm font-semibold ${isActive ? "text-brand" : "text-ink"}`}>{t.label}</div>
              <p className="mt-0.5 hidden max-w-xs text-xs leading-relaxed text-ink-soft lg:block">{t.blurb}</p>
              {isActive && (
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-brand/15">
                  <span
                    key={`${active}-${paused}`}
                    className={`block h-full origin-left bg-brand animate-progress ${paused ? "[animation-play-state:paused]" : ""}`}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="min-w-0">
        <div key={active} className="animate-fade-in">
          <h3 className="font-display text-xl font-semibold tracking-tightest text-ink md:text-2xl">{tab.title}</h3>
          <p className="mt-1.5 max-w-xl text-base leading-relaxed text-ink-soft lg:hidden">{tab.blurb}</p>
          <div className="mt-5">
            <Specimen />
          </div>
        </div>
      </div>
    </div>
  );
}
