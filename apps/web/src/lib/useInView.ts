"use client";

import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  /** Fire once then disconnect (default true). */
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Generalized scroll-in detection (the engine behind <Reveal/>). Returns a ref to
 * attach and whether it has entered the viewport. Respects prefers-reduced-motion
 * by reporting in-view immediately, so motion-driven UI still renders its end state.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
): { ref: React.RefObject<T | null>; inView: boolean } {
  const { once = true, rootMargin = "0px 0px -10% 0px", threshold = 0.15 } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
