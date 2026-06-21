"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}

/**
 * Run an async loader on mount (and whenever `deps` change) entirely on the
 * client. Returns loading/error/data plus a manual `reload`.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: ReadonlyArray<unknown> = []): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // `loader` is intentionally not a dependency: callers pass an inline closure
  // and re-runs are driven explicitly by `deps` + `nonce`.
  const effectDeps = [...deps, nonce] as const;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) setError(messageOf(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, effectDeps);

  return { data, loading, error, reload };
}
