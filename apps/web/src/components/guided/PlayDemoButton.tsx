"use client";

import { Button } from "@/components/Button";
import { useGuidedDemo } from "@/components/guided/GuidedDemo";

/**
 * Header control that launches the cinematic guided demo. Refined secondary
 * button with a small play glyph — sits beside "Run exposure assessment".
 */
export function PlayDemoButton() {
  const { start, active } = useGuidedDemo();

  return (
    <Button
      variant="secondary"
      onClick={start}
      disabled={active}
      aria-label="Play guided demo"
      className="hidden sm:inline-flex"
    >
      <PlayGlyph />
      Play guided demo
    </Button>
  );
}

function PlayGlyph() {
  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      className="-ml-0.5 text-brand"
    >
      <path d="M4 2.8v10.4a.7.7 0 0 0 1.06.6l8.4-5.2a.7.7 0 0 0 0-1.2l-8.4-5.2A.7.7 0 0 0 4 2.8Z" fill="currentColor" />
    </svg>
  );
}
