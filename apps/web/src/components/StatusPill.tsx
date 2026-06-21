import type { FindingStatus, RemediationStatus } from "@cel/types";
import { titleCase } from "@/lib/format";

const FINDING_STATUS_STYLE: Record<FindingStatus, string> = {
  open: "bg-surface-muted text-ink-soft ring-surface-border",
  acknowledged: "bg-surface-muted text-ink-soft ring-surface-border",
  remediating: "bg-brand-soft text-brand ring-brand/30",
  resolved: "bg-severity-low/10 text-severity-low ring-severity-low/30",
  "accepted-risk": "bg-severity-medium/10 text-severity-medium ring-severity-medium/30",
};

export function FindingStatusPill({ status }: { status: FindingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${FINDING_STATUS_STYLE[status]}`}
    >
      {titleCase(status)}
    </span>
  );
}

export function RemediationStatusPill({ status, verified }: { status: RemediationStatus; verified?: boolean }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-severity-low/10 px-2 py-0.5 text-xs font-medium text-severity-low ring-1 ring-inset ring-severity-low/30">
        {verified ? "Fixed · verified" : "Fixed"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-inset ring-surface-border">
      To do
    </span>
  );
}
