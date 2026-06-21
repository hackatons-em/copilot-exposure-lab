"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/components/WorkspaceProvider";

/**
 * Cinematic guided demo — a one-click, scripted walkthrough that auto-advances
 * through the hero narrative while navigating the REAL app, so the audience sees
 * the live product rather than screenshots or a coachmark mock.
 *
 * Design: a presenter-narration caption card fixed bottom-center over a low
 * scrim. The product stays visible and interactive; Exit/Esc work at any time.
 * Pure CSS transitions (no animation library); respects prefers-reduced-motion.
 */

/** Auto-advance cadence — long enough for each beat of the pitch to land. */
const AUTO_ADVANCE_MS = 6000;

/** Shared runtime passed to each step's onEnter so actions never reach for globals. */
interface StepContext {
  router: ReturnType<typeof useRouter>;
  runAssessment: () => Promise<void>;
  /** Memoized per run — the id of the headline critical finding, once resolved. */
  getCriticalFindingId: () => Promise<string | undefined>;
}

interface DemoStep {
  /** Stable key (used for transition keying + step ids). */
  key: string;
  /** Route the tour navigates to on enter (skipped when undefined, e.g. dynamic). */
  route?: string;
  eyebrow: string;
  title: string;
  caption: string;
  /**
   * Optional side effect run when the step becomes active. Must be resilient:
   * wrap risky work in try/catch and never throw — a thrown error is swallowed
   * by the controller, but guarding here keeps the narration smooth.
   */
  onEnter?: (ctx: StepContext) => Promise<void> | void;
}

const STEPS: DemoStep[] = [
  {
    key: "overview",
    route: "/overview",
    eyebrow: "The headline",
    title: "One score per tenant",
    caption:
      "Every tenant gets one Exposure Score. This one is Critical — here's why.",
    onEnter: async ({ runAssessment }) => {
      // Seed + scan only if there is nothing to show yet, so the gauge is live.
      try {
        const findings = await api.listFindings();
        if (findings.length === 0) await runAssessment();
      } catch {
        // If listing failed, run an assessment defensively; runAssessment is guarded.
        try {
          await runAssessment();
        } catch {
          /* never crash the tour */
        }
      }
    },
  },
  {
    key: "graph",
    route: "/graph",
    eyebrow: "The attack surface",
    title: "The whole picture",
    caption:
      "The whole attack surface as one picture: who can reach what, and how. Red paths are critical.",
  },
  {
    key: "critical-finding",
    // No static route — onEnter resolves the critical finding and navigates.
    eyebrow: "The path that matters",
    title: "A salary file, org-wide",
    caption:
      "One path stands out — a salary file reachable org-wide. Every finding traces to a source object.",
    onEnter: async ({ router, getCriticalFindingId }) => {
      const id = await getCriticalFindingId();
      if (id) router.push(`/findings/${id}`);
      else router.push("/findings"); // safe fallback — never a dead route
    },
  },
  {
    key: "copilot",
    route: "/copilot-sim",
    eyebrow: "The proof",
    title: "What Copilot would surface",
    caption:
      "And this is what Microsoft 365 Copilot would actually surface to that user — the exposure made real.",
  },
  {
    key: "proof-of-fix",
    eyebrow: "Proof, not promises",
    title: "Apply the fix, re-scan",
    caption:
      "Apply the Microsoft-native fix and re-scan: the path closes and the Exposure Score drops. Proof, not promises.",
    onEnter: async ({ router, getCriticalFindingId }) => {
      const id = await getCriticalFindingId();
      // Return to the critical finding so the presenter can click Apply fix live.
      // We deliberately do NOT mutate state here.
      if (id) router.push(`/findings/${id}`);
      else router.push("/overview");
    },
  },
  {
    key: "report",
    route: "/reports",
    eyebrow: "Own the proof",
    title: "Board-grade report",
    caption:
      "Export the board-grade report — evidence chains, remediation roadmap, exposure score. Own the proof.",
  },
];

interface GuidedDemoContextValue {
  active: boolean;
  start: () => void;
}

const GuidedDemoContext = createContext<GuidedDemoContextValue | undefined>(undefined);

export function useGuidedDemo(): GuidedDemoContextValue {
  const ctx = useContext(GuidedDemoContext);
  if (!ctx) throw new Error("useGuidedDemo must be used within a GuidedDemoProvider");
  return ctx;
}

export function GuidedDemoProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { runAssessment } = useWorkspace();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [paused, setPaused] = useState(false);
  /** Drives the bottom progress sliver so viewers feel the cadence. */
  const [tick, setTick] = useState(0);

  /** Resolved once per run and cached, so steps 3 + 5 hit the same finding. */
  const criticalIdRef = useRef<Promise<string | undefined> | undefined>(undefined);

  const reducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const getCriticalFindingId = useCallback((): Promise<string | undefined> => {
    if (!criticalIdRef.current) {
      criticalIdRef.current = (async () => {
        try {
          const critical = await api.listFindings({ severity: "critical" });
          const first = critical[0];
          if (first) return first.id;
          // Fall back to the single highest-scoring finding if no critical band.
          const all = await api.listFindings();
          const top = [...all].sort((a, b) => b.risk.total - a.risk.total)[0];
          return top?.id;
        } catch {
          return undefined;
        }
      })();
    }
    return criticalIdRef.current;
  }, []);

  const stepCtx = useMemo<StepContext>(
    () => ({ router, runAssessment, getCriticalFindingId }),
    [router, runAssessment, getCriticalFindingId],
  );

  // Keep a ref of the current pathname so enterStep can read it without being a dep.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  /** Run a step: navigate to its route, then fire its (guarded) onEnter. */
  const enterStep = useCallback(
    async (index: number) => {
      const step = STEPS[index];
      if (!step) return;
      if (step.route && pathnameRef.current !== step.route) {
        router.push(step.route);
      }
      if (step.onEnter) {
        try {
          await step.onEnter(stepCtx);
        } catch {
          // Resilient: a failed action must never crash the app or the tour.
        }
      }
    },
    [router, stepCtx],
  );

  const exit = useCallback(() => {
    setActive(false);
    setAutoAdvance(true);
    setPaused(false);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(STEPS.length - 1, index));
      setStepIndex(clamped);
      setTick((t) => t + 1);
      void enterStep(clamped);
    },
    [enterStep],
  );

  const start = useCallback(() => {
    criticalIdRef.current = undefined; // fresh resolution per run
    setStepIndex(0);
    setAutoAdvance(true);
    setPaused(false);
    setActive(true);
    setTick((t) => t + 1);
    void enterStep(0);
  }, [enterStep]);

  const next = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) {
      exit();
      return;
    }
    goTo(stepIndex + 1);
  }, [stepIndex, goTo, exit]);

  const back = useCallback(() => {
    if (stepIndex <= 0) return;
    goTo(stepIndex - 1);
  }, [stepIndex, goTo]);

  // Auto-advance timer — restarts on each step + on resume; pauses on hover.
  useEffect(() => {
    if (!active || !autoAdvance || paused) return;
    if (reducedMotion.current) return; // honor reduced motion: no auto motion
    const id = window.setTimeout(() => next(), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [active, autoAdvance, paused, next, tick]);

  // Esc exits at any time.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, exit, next, back]);

  const value = useMemo<GuidedDemoContextValue>(() => ({ active, start }), [active, start]);

  return (
    <GuidedDemoContext.Provider value={value}>
      {children}
      {active ? (
        <DemoOverlay
          step={STEPS[stepIndex]}
          index={stepIndex}
          total={STEPS.length}
          isLast={stepIndex === STEPS.length - 1}
          isFirst={stepIndex === 0}
          autoAdvance={autoAdvance}
          paused={paused}
          tick={tick}
          reducedMotion={reducedMotion.current}
          onBack={back}
          onNext={next}
          onExit={exit}
          onToggleAuto={() => setAutoAdvance((v) => !v)}
          onHoverChange={setPaused}
        />
      ) : null}
    </GuidedDemoContext.Provider>
  );
}

interface OverlayProps {
  step: DemoStep | undefined;
  index: number;
  total: number;
  isLast: boolean;
  isFirst: boolean;
  autoAdvance: boolean;
  paused: boolean;
  tick: number;
  reducedMotion: boolean;
  onBack: () => void;
  onNext: () => void;
  onExit: () => void;
  onToggleAuto: () => void;
  onHoverChange: (hovering: boolean) => void;
}

function DemoOverlay({
  step,
  index,
  total,
  isLast,
  isFirst,
  autoAdvance,
  paused,
  tick,
  reducedMotion,
  onBack,
  onNext,
  onExit,
  onToggleAuto,
  onHoverChange,
}: OverlayProps) {
  if (!step) return null;

  // The progress sliver animates over AUTO_ADVANCE_MS; remounting via `tick`
  // restarts it. Disabled when not auto-advancing, paused, or reduced motion.
  const showProgress = autoAdvance && !paused && !reducedMotion;

  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-live="polite">
      {/* Soft scrim — keeps the product visible; clicking it exits. It does not
          fully block the page (the card sits above and is interactive). */}
      <button
        type="button"
        aria-label="Exit guided demo"
        onClick={onExit}
        className="pointer-events-auto absolute inset-0 h-full w-full cursor-default border-0 bg-[#10101a]/20 transition-opacity duration-500"
        style={{
          animation: reducedMotion ? undefined : "cel-demo-scrim-in 400ms ease-out both",
        }}
        tabIndex={-1}
      />

      {/* Presenter narration card — fixed bottom-center. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-6 sm:pb-8">
        <div
          key={step.key}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          role="dialog"
          aria-label="Guided demo narration"
          className="pointer-events-auto relative w-full max-w-xl overflow-hidden rounded-lg border border-hairline bg-surface shadow-elevation-lg"
          style={{
            animation: reducedMotion ? undefined : "cel-demo-card-in 460ms cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Iris accent rail. */}
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand" />

          <div className="px-5 py-4 pl-6 sm:px-6 sm:pl-7">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow text-brand">
                Step {index + 1} / {total} · {step.eyebrow}
              </p>
              <button
                type="button"
                onClick={onExit}
                aria-label="Exit guided demo"
                className="-mr-1 rounded-md px-2 py-1 text-xs font-medium text-ink-faint transition-colors duration-150 hover:bg-surface-muted hover:text-ink"
              >
                Exit
              </button>
            </div>

            <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tightest text-ink">
              {step.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.caption}</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isFirst}
                  className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-all duration-150 hover:bg-surface-subtle disabled:cursor-not-allowed disabled:text-ink-faint disabled:shadow-none"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-md bg-brand px-3.5 py-1.5 text-xs font-medium text-white shadow-elevation transition-all duration-150 hover:bg-brand-strong active:translate-y-px"
                >
                  {isLast ? "Finish" : "Next"}
                </button>
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-ink-soft">
                <span
                  aria-hidden
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-150 ${
                    autoAdvance ? "bg-brand" : "bg-surface-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                      autoAdvance ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={onToggleAuto}
                  className="sr-only"
                  aria-label="Auto-advance the guided demo"
                />
                Auto-play
              </label>
            </div>
          </div>

          {/* Cadence sliver — visualizes the auto-advance timer for this step. */}
          <div aria-hidden className="h-0.5 w-full bg-surface-muted">
            {showProgress ? (
              <div
                key={tick}
                className="h-full bg-brand"
                style={{ animation: `cel-demo-progress ${AUTO_ADVANCE_MS}ms linear both` }}
              />
            ) : (
              <div className="h-full w-0 bg-brand" />
            )}
          </div>
        </div>
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}

/** Scoped keyframes — inlined so no global CSS edit is needed. */
const KEYFRAMES = `
@keyframes cel-demo-scrim-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes cel-demo-card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes cel-demo-progress { from { width: 0%; } to { width: 100%; } }
@media (prefers-reduced-motion: reduce) {
  @keyframes cel-demo-scrim-in { from { opacity: 1; } to { opacity: 1; } }
  @keyframes cel-demo-card-in { from { opacity: 1; transform: none; } to { opacity: 1; transform: none; } }
}
`;
