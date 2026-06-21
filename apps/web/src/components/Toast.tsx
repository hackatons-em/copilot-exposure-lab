"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const ACCENT: Record<ToastVariant, string> = {
  success: "bg-severity-low",
  error: "bg-severity-critical",
  info: "bg-brand",
};

const DISMISS_MS = 4500;

/**
 * Lightweight, dependency-free toast system. Mount once (above WorkspaceProvider)
 * so any surface — and the provider itself — can call useToast(). Toasts stack
 * bottom-right, auto-dismiss, and animate in via the shared fade (motion-safe).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = (idRef.current += 1);
      setItems((list) => [...list, { id, message, variant }]);
      window.setTimeout(() => remove(id), DISMISS_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (m) => toast(m, "success"),
      error: (m) => toast(m, "error"),
      info: (m) => toast(m, "info"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-fade-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 shadow-elevation-lg"
          >
            <span aria-hidden className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ACCENT[t.variant]}`} />
            <p className="flex-1 text-sm leading-snug text-ink">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
              className="-mr-1 -mt-0.5 shrink-0 rounded p-1 text-ink-faint transition-colors hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
