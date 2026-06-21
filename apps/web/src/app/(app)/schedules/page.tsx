"use client";

import { useCallback, useState, type FormEvent } from "react";
import {
  api,
  type CreateScheduleBody,
  type Schedule,
  type ScheduleAction,
} from "@/lib/api";
import { formatCadence, formatDateTime, titleCase } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";
import { TrustCopy } from "@/components/TrustCopy";

const SCHEDULE_TRUST = [
  "Schedules only enqueue the same deterministic scan you can run by hand — same seed, same findings.",
  "The worker fires due schedules on a fixed cadence; no document contents are read or stored.",
  "Disable a schedule to pause it without losing its configuration.",
];

/** Human-friendly cadence presets mapped to minutes. */
const CADENCE_OPTIONS: { label: string; minutes: number }[] = [
  { label: "Hourly", minutes: 60 },
  { label: "Daily", minutes: 1440 },
  { label: "Weekly", minutes: 10080 },
];

const ACTION_OPTIONS: ScheduleAction[] = ["scan", "report"];

export default function SchedulesPage() {
  const { dataVersion } = useWorkspace();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync<Schedule[]>(() => api.listSchedules(), [dataVersion]);

  const [name, setName] = useState("");
  const [cadenceMinutes, setCadenceMinutes] = useState(1440);
  const [action, setAction] = useState<ScheduleAction>("scan");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  const create = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (creating) return;
      const trimmed = name.trim();
      if (trimmed.length === 0) return;
      setCreating(true);
      setFormError(undefined);
      try {
        const body: CreateScheduleBody = { name: trimmed, action, cadenceMinutes };
        await api.createSchedule(body);
        setName("");
        toast.success(`Schedule "${trimmed}" created.`);
        reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create the schedule.";
        setFormError(message);
        toast.error(message);
      } finally {
        setCreating(false);
      }
    },
    [action, cadenceMinutes, creating, name, reload, toast],
  );

  const toggleEnabled = useCallback(
    async (schedule: Schedule) => {
      setBusyId(schedule.id);
      try {
        await api.updateSchedule(schedule.id, { enabled: !schedule.enabled });
        reload();
      } catch {
        // Surface nothing inline per-row; the list reload reflects the real state.
      } finally {
        setBusyId(undefined);
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (schedule: Schedule) => {
      setBusyId(schedule.id);
      try {
        await api.deleteSchedule(schedule.id);
        toast.success(`Schedule "${schedule.name}" deleted.`);
        reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not delete the schedule.");
      } finally {
        setBusyId(undefined);
      }
    },
    [reload, toast],
  );

  const fieldClass =
    "mt-1 w-full rounded-md border border-surface-border bg-surface px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30";

  return (
    <>
      <PageHeader
        title="Schedules"
        description="Run the deterministic exposure assessment on a cadence. Each schedule enqueues a scan (or report) job for this workspace when it is due."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading ? (
            <LoadingState label="Loading schedules…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="No schedules yet"
              description="Create a schedule to run the assessment automatically on an hourly, daily, or weekly cadence."
            />
          ) : (
            <div className="space-y-3">
              {data.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-hairline bg-surface p-5 shadow-elevation"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-ink">{schedule.name}</h2>
                      <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-inset ring-surface-border">
                        {titleCase(schedule.action)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          schedule.enabled
                            ? "bg-brand-soft text-brand ring-brand/20"
                            : "bg-surface-muted text-ink-faint ring-surface-border"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${
                            schedule.enabled ? "bg-severity-low" : "bg-ink-faint"
                          }`}
                        />
                        {schedule.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-ink-soft sm:grid-cols-2">
                      <div className="flex gap-1.5">
                        <dt className="text-ink-faint">Cadence</dt>
                        <dd className="text-ink">{formatCadence(schedule.cadenceMinutes)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-ink-faint">Next run</dt>
                        <dd className="text-ink">{formatDateTime(schedule.nextRunAt)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-ink-faint">Last run</dt>
                        <dd className="text-ink">{formatDateTime(schedule.lastRunAt)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      busy={busyId === schedule.id}
                      onClick={() => void toggleEnabled(schedule)}
                    >
                      {schedule.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      busy={busyId === schedule.id}
                      onClick={() => void remove(schedule)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <section className="rounded-2xl border border-hairline bg-surface p-6 shadow-elevation">
            <h2 className="text-sm font-semibold text-ink">New schedule</h2>
            <form onSubmit={create} className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className="block text-xs font-medium text-ink-soft sm:col-span-3">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nightly exposure scan"
                  className={fieldClass}
                />
              </label>
              <label className="block text-xs font-medium text-ink-soft">
                Cadence
                <select
                  className={fieldClass}
                  value={cadenceMinutes}
                  onChange={(e) => setCadenceMinutes(Number(e.target.value))}
                >
                  {CADENCE_OPTIONS.map((opt) => (
                    <option key={opt.minutes} value={opt.minutes}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-ink-soft">
                Action
                <select
                  className={fieldClass}
                  value={action}
                  onChange={(e) => setAction(e.target.value as ScheduleAction)}
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {titleCase(opt)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button type="submit" busy={creating} disabled={creating || name.trim().length === 0}>
                  Create schedule
                </Button>
              </div>
            </form>
            {formError ? <p className="mt-3 text-xs text-severity-critical">{formError}</p> : null}
          </section>

          <TrustCopy lines={SCHEDULE_TRUST} />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">How schedules work</h2>
          <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-elevation">
            <p className="text-sm text-ink-soft">
              The worker checks for due schedules on every poll. When a schedule&apos;s next run time has passed, it
              enqueues a job — a scan, or a report generated from the latest scan — and advances the next run time by
              the cadence.
            </p>
            <p className="mt-3 text-xs text-ink-faint">
              Cadences map to fixed intervals: Hourly (60m), Daily (1440m), Weekly (10080m). The same seed always
              produces the same findings, so scheduled runs stay deterministic.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
