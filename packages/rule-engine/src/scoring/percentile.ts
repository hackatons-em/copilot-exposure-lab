/**
 * Peer percentile for a tenant exposure score, against a fixed, deterministic
 * baseline distribution of "comparable tenants".
 *
 * HONESTY: the baseline is SYNTHETIC and illustrative — it is not (yet) real pilot
 * data. It exists to give the headline score context ("worse than X% of peers")
 * without claiming a benchmark we haven't earned. When real pilot data exists, swap
 * the array. It is sorted ascending and never empty, so the math stays simple.
 */
const PEER_BASELINE: readonly number[] = [
  8, 11, 14, 17, 19, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70,
  72, 74, 76, 78, 80, 83, 86, 89, 92, 96, 97, 98, 99,
];

export interface PeerPercentile {
  /** % of comparable tenants this tenant is MORE exposed than (0-100). */
  worseThanPct: number;
  /** Size of the (synthetic) comparison set. */
  sampleSize: number;
  /** True so callers can label the figure as illustrative, not measured. */
  synthetic: true;
}

/**
 * The share of baseline peers strictly less exposed than `score`. A higher number
 * is worse: "worse than 85% of comparable tenants". Deterministic.
 */
export function tenantPercentile(score: number): PeerPercentile {
  const below = PEER_BASELINE.filter((s) => s < score).length;
  const worseThanPct = Math.round((below / PEER_BASELINE.length) * 100);
  return { worseThanPct, sampleSize: PEER_BASELINE.length, synthetic: true };
}
