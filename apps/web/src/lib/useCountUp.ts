"use client";

import { useEffect, useRef, useState } from "react";

export interface UseCountUpOptions {
  /** Start animating only when true (wire to useInView). Default true. */
  active?: boolean;
  durationMs?: number;
  /** Decimal places to keep (default 0). */
  decimals?: number;
}

/**
 * Counts a number up to `target` once `active`, with an ease-out curve via
 * requestAnimationFrame. Reduced-motion (or SSR) → snaps to the target instantly.
 * Returns the current value, rounded to `decimals`.
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { active = true, durationMs = 1100, decimals = 0 } = options;
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || durationMs <= 0) {
      setValue(target);
      return;
    }
    const factor = 10 ** decimals;
    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased * factor) / factor);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, active, durationMs, decimals]);

  return value;
}
