import type { ExposureDrift, ScanSnapshot } from "./types.js";

/** Drift between the current snapshot and the previous one. */
export function computeDrift(curr: ScanSnapshot, prev: ScanSnapshot): ExposureDrift {
  const currSet = new Set(curr.fingerprints);
  const prevSet = new Set(prev.fingerprints);
  return {
    scoreDelta: curr.exposureScore - prev.exposureScore,
    criticalDelta: (curr.bands.critical ?? 0) - (prev.bands.critical ?? 0),
    newFindingIds: curr.fingerprints.filter((f) => !prevSet.has(f)),
    resolvedFindingIds: prev.fingerprints.filter((f) => !currSet.has(f)),
    previousAt: prev.takenAt,
  };
}
