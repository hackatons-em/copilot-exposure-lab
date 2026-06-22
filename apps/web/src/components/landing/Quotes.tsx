import { Reveal } from "./Reveal";

/**
 * Illustrative, role-attributed quotes — NO fake company names or logos. The
 * "(illustrative)" label is load-bearing honesty: these represent the buyer
 * voices we build for, not endorsements we don't yet have.
 */
const QUOTES: { quote: string; role: string }[] = [
  {
    quote: "Finally, proof of what Copilot would surface — with the exact fix and a number my board can track.",
    role: "CISO, mid-market financial services",
  },
  {
    quote: "It found org-wide links to files we'd forgotten were shared a decade ago. The evidence chain made it undeniable.",
    role: "M365 administrator, healthcare",
  },
  {
    quote: "Deterministic scoring we can actually audit — not another AI black box telling us to trust it.",
    role: "Security architect, SaaS",
  },
];

export function Quotes() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">What we hear</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tightest text-ink md:text-4xl">
            Built for the people who answer for the risk
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            We&rsquo;re early, so these aren&rsquo;t customer endorsements. They&rsquo;re examples of the people we build
            for and the problems they tell us they have. We&rsquo;d rather say that plainly.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <Reveal key={q.role} delay={i * 70}>
              <figure className="flex h-full flex-col justify-between rounded-2xl border border-hairline bg-surface p-7 shadow-elevation">
                <blockquote className="text-base leading-relaxed text-ink">&ldquo;{q.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 text-sm text-ink-faint">
                  — {q.role}{" "}
                  <span className="font-mono text-[10px] uppercase tracking-wide">(illustrative)</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
