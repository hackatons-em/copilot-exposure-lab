/** Small deterministic helpers shared across the engine. */

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Index an array of entities by `id`. */
export function byId<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) m.set(it.id, it);
  return m;
}

/** Stable sort by a string key (ascending). Does not mutate the input. */
export function sortBy<T>(items: readonly T[], key: (t: T) => string): T[] {
  return [...items].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/** Stable sort by a numeric key descending, ties broken by a string key ascending. */
export function sortByDesc<T>(items: readonly T[], num: (t: T) => number, tie: (t: T) => string): T[] {
  return [...items].sort((a, b) => {
    const d = num(b) - num(a);
    if (d !== 0) return d;
    const ta = tie(a);
    const tb = tie(b);
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
}

export function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}
