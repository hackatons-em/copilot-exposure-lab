"use client";

import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Accessible, animated FAQ accordion. Height animates via the grid 0fr→1fr trick
 * (no JS measurement, no layout thrash); the chevron rotates. Motion is disabled
 * for reduced-motion users by the global CSS guard.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-subtle"
            >
              <span className="text-base font-medium text-ink">{item.q}</span>
              <span
                aria-hidden
                className={`shrink-0 text-ink-faint transition-transform duration-300 ease-spring ${isOpen ? "rotate-45" : ""}`}
              >
                {/* plus → rotates toward an x when open */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-spring ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
