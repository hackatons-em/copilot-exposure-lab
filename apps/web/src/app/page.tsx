import Link from "next/link";

const VALUE_PROPS = [
  {
    title: "Simulate exposure paths",
    body: "Run safe drills as real personas — a normal employee, a contractor guest, a Copilot Studio agent — and see exactly what sensitive data each could reach.",
  },
  {
    title: "Show evidence, not vibes",
    body: "Every finding is backed by a concrete evidence chain pointing at the file, group, link, or agent that created the exposure. No black-box AI guesses.",
  },
  {
    title: "Fix what matters first",
    body: "Deterministic 0–100 risk scores rank findings, with Microsoft-native remediation steps and a re-run that proves the fix closed the path.",
  },
];

const PROOF_BULLETS = [
  "Metadata-first — never stores full document contents",
  "Deterministic scoring — same input always yields the same score",
  "Exportable CISO report — Markdown or HTML",
  "Customer-cloud path — runs in your own Microsoft tenant",
  "No full-document storage — labels, permissions, and links only",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold text-ink">Copilot Exposure Lab</span>
          <Link
            href="/overview"
            className="rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white no-underline hover:bg-brand/90"
          >
            Open the lab
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-soft ring-1 ring-inset ring-surface-border">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-severity-low" />
            Read-only · metadata-only · Microsoft-native
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
            Run a Copilot Exposure Drill Before Rollout
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-soft">
            Safely test whether Microsoft 365 Copilot, Copilot Studio agents, and your existing SharePoint and
            OneDrive permissions could surface sensitive company data — before you turn Copilot loose across the
            tenant.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/overview"
              className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white no-underline hover:bg-brand/90"
            >
              Run an exposure assessment
            </Link>
            <span className="text-sm text-ink-faint">No write access. Document contents are never stored.</span>
          </div>
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="rounded-lg border border-surface-border bg-surface-subtle p-5">
              <h2 className="text-base font-semibold text-ink">{prop.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{prop.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-surface-border bg-surface-subtle p-6 md:p-8">
          <h2 className="text-lg font-semibold text-ink">Built for the security buyer</h2>
          <p className="mt-1 text-sm text-ink-soft">
            For CISOs, security architects, and M365 admins who need defensible evidence before enabling Copilot.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PROOF_BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-severity-low">
                  ✓
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link
              href="/overview"
              className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white no-underline hover:bg-brand/90"
            >
              Open the lab
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-surface-border">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-ink-faint">
          Independent product. Does not replace Microsoft Purview, Defender, or SharePoint Advanced Management.
        </div>
      </footer>
    </div>
  );
}
