"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

interface RunResult {
  ok: boolean;
  message: string;
}

interface WorkspaceContextValue {
  /** Monotonic counter bumped after any successful scan/seed — pages watch it to reload. */
  dataVersion: number;
  scanning: boolean;
  lastRun: RunResult | undefined;
  /** Run the deterministic exposure assessment (auto-seeds first if needed). */
  runAssessment: () => Promise<void>;
  /** Re-seed the demo company then re-scan. */
  reseedAndScan: () => Promise<void>;
  /** Bump the data version so dependent pages reload (e.g. after a tenant connect). */
  bumpDataVersion: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [dataVersion, setDataVersion] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [lastRun, setLastRun] = useState<RunResult | undefined>(undefined);
  const inFlight = useRef(false);

  const ensureSeeded = useCallback(async () => {
    // Seed only when there is no connection yet, so the scan has a graph to read.
    try {
      const connections = await api.listConnections();
      if (connections.length === 0) {
        await api.seedDemo();
        return;
      }
    } catch {
      // If listing connections failed, attempt a seed defensively.
      await api.seedDemo();
    }
  }, []);

  const runAssessment = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setScanning(true);
    try {
      await ensureSeeded();
      const summary = await api.runScan();
      setLastRun({
        ok: true,
        message: `Scan complete — ${summary.findingCount} finding${summary.findingCount === 1 ? "" : "s"}.`,
      });
      setDataVersion((v) => v + 1);
    } catch (err) {
      setLastRun({ ok: false, message: err instanceof Error ? err.message : "Scan failed." });
    } finally {
      setScanning(false);
      inFlight.current = false;
    }
  }, [ensureSeeded]);

  const reseedAndScan = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setScanning(true);
    try {
      await api.seedDemo();
      const summary = await api.runScan();
      setLastRun({
        ok: true,
        message: `Demo re-seeded and re-scanned — ${summary.findingCount} findings.`,
      });
      setDataVersion((v) => v + 1);
    } catch (err) {
      setLastRun({ ok: false, message: err instanceof Error ? err.message : "Re-seed failed." });
    } finally {
      setScanning(false);
      inFlight.current = false;
    }
  }, []);

  const bumpDataVersion = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({ dataVersion, scanning, lastRun, runAssessment, reseedAndScan, bumpDataVersion }),
    [dataVersion, scanning, lastRun, runAssessment, reseedAndScan, bumpDataVersion],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
