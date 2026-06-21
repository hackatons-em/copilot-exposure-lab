/**
 * Deterministic, dependency-free fingerprints. Same inputs → same id, on every
 * platform and every run. This is what lets a finding keep its identity across
 * reruns (so status + proof-of-fix attach to the right finding) and what makes
 * golden snapshots stable. No crypto, no randomness, no time.
 */

/** FNV-1a 32-bit hash → 8 hex chars. */
export function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Stable id from ordered parts (joined with a separator that can't collide). */
export function fingerprint(...parts: string[]): string {
  return hash(parts.join(""));
}

export const findingId = (ruleId: string, resourceId: string, principalChain: string): string =>
  `fnd-${fingerprint(ruleId, resourceId, principalChain)}`;

export const evidenceId = (ownerFindingId: string, kind: string, sourceObjectId: string, index: number): string =>
  `ev-${fingerprint(ownerFindingId, kind, sourceObjectId, String(index))}`;

export const remediationId = (ownerFindingId: string): string => `rem-${fingerprint(ownerFindingId)}`;

export const pathId = (steps: string): string => `path-${fingerprint(steps)}`;
