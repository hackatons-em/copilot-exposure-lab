import type { FindingStatus, RemediationStatus } from "@cel/types";
import { titleCase } from "@/lib/format";

const PILL_BASE = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium";

const FINDING_STATUS_STYLE: Record<FindingStatus, string> = {
  open: "border border-hairline bg-surface-subtle text-ink-soft",
  acknowledged: "border border-hairline bg-surface-subtle text-ink-soft",
  remediating: "bg-brand-soft text-brand",
  resolved: "bg-severity-low-soft text-severity-low",
  "accepted-risk": "bg-severity-medium-soft text-severity-medium",
};

export function FindingStatusPill({ status }: { status: FindingStatus }) {
  return <span className={`${PILL_BASE} ${FINDING_STATUS_STYLE[status]}`}>{titleCase(status)}</span>;
}

export function RemediationStatusPill({ status, verified }: { status: RemediationStatus; verified?: boolean }) {
  if (status === "done") {
    return (
      <span className={`${PILL_BASE} bg-severity-low-soft text-severity-low`}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-low" />
        {verified ? "Fixed · verified" : "Fixed"}
      </span>
    );
  }
  return (
    <span className={`${PILL_BASE} border border-hairline bg-surface-subtle text-ink-soft`}>To do</span>
  );
}
