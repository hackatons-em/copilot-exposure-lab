"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the whole
 * document, so it can't rely on app CSS — styles are inline. Rare by design.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbfbf9",
          color: "#16161a",
          fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c0362c", margin: 0 }}>
          Application error
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "12px 0 0", letterSpacing: "-0.02em" }}>
          Copilot Exposure Lab hit a fatal error.
        </h1>
        <p style={{ fontSize: 15, color: "#56565f", maxWidth: 460, marginTop: 8 }}>
          Reload to recover. If this persists, the page may be temporarily unavailable.
        </p>
        {error.digest ? (
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#9795a0", marginTop: 8 }}>ref: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 24,
            border: "none",
            borderRadius: 10,
            backgroundColor: "#0071e3",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
