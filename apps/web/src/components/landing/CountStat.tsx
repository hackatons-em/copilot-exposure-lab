"use client";

import { useCountUp } from "@/lib/useCountUp";
import { useInView } from "@/lib/useInView";

/**
 * A big number that counts up when it scrolls into view. Reduced-motion users see
 * the final value immediately (handled inside the hooks).
 */
export function CountStat({
  value,
  className,
  suffix,
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const display = useCountUp(value, { active: inView });
  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
