import type { Metadata } from "next";
import { MarketingChrome } from "@/components/landing/MarketingChrome";

export const metadata: Metadata = {
  title: "Security & Trust — Copilot Exposure Lab",
  description:
    "How Copilot Exposure Lab handles your data: read-only access through Microsoft Graph, we never read file contents, a risk score that's the same every time, a full audit trail, and an honest compliance status.",
};

const SCOPES = [
  { scope: "User.Read.All", why: "See who each account belongs to and whether it's still active, so we can catch people who left but were never removed." },
  { scope: "Group.Read.All", why: "See who is in which group, so we can work out who can actually reach a given file." },
  { scope: "Sites.Read.All", why: "See how SharePoint sites and libraries are structured, their sensitivity labels, and which permissions are passed down." },
  { scope: "Files.Read.All", why: "See file details, sharing links, and who can open each file — never the contents of the files." },
];

const INVARIANTS = [
  {
    title: "We never read file contents",
    body: "We read only descriptive details: sensitivity labels, who can open what, who is in which group, sharing links, and AI assistant settings. We never store the contents of documents, emails, or Teams messages, or any passwords.",
  },
  {
    title: "Read-only, minimum access",
    body: "We ask only for read-only access, and only to what we need. We have no permission to change anything, so the product cannot modify your tenant. That isn't a promise; it's built that way.",
  },
  {
    title: "We never apply fixes for you",
    body: "The fixes we write are advice. The product never runs them. A person on your team reviews each one and decides whether to run it.",
  },
  {
    title: "A risk score you can check",
    body: "Risk comes from a clear 0–100 model with deterministic scoring (the same inputs always produce the same score — no guessing, fully auditable). AI may help write summaries, but never decides risk or makes up facts. Our risk engine contains no AI code at all, and we test for that on every change.",
  },
  {
    title: "Nothing flagged without proof",
    body: "Every finding shows its evidence, and every piece of evidence points at a specific file, group, link, or assistant. If there's no evidence, there's no finding.",
  },
  {
    title: "Audited and kept separate",
    body: "Every action that changes anything is recorded in an audit log. Passwords and keys are never logged or shown. Each customer's data is kept separate, and deleting a workspace deletes its data.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-brand">{children}</span>;
}

export default function SecurityPage() {
  return (
    <MarketingChrome>
      <Eyebrow>Security &amp; Trust</Eyebrow>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tightest text-ink">
        We hold ourselves to the standard we help you reach.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        Copilot Exposure Lab is a security product, so trust comes first. The rules below aren't promises in a
        brochure. They are built into how the product works, and we test for them on every change.
      </p>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">What access we ask for</h2>
        <p className="mt-2 text-base text-ink-soft">
          These are the exact read-only permissions we request through Microsoft Graph (Microsoft&rsquo;s official API
          for your 365 data). Each one is explained, not just requested.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevation">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {SCOPES.map((s) => (
                <tr key={s.scope} className="border-b border-hairline last:border-0 align-top">
                  <td className="w-56 px-4 py-3 font-mono text-xs font-semibold text-brand">{s.scope}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">How we handle your data</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {INVARIANTS.map((item) => (
            <div key={item.title} className="h-full rounded-2xl border border-hairline bg-surface p-6 shadow-elevation">
              <h3 className="font-display text-base font-semibold tracking-tightest text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-hairline bg-surface-subtle/60 p-7">
        <h2 className="font-display text-xl font-semibold tracking-tightest text-ink">Compliance: where we honestly stand</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          We are early-stage and <strong className="text-ink">not SOC 2 certified yet</strong>. SOC 2 is an independent
          audit of how a company protects customer data. We built our data handling — read-only, minimum access, full
          audit trail, easy deletion — to make that audit straightforward, and we&rsquo;ll pursue SOC 2 Type II as we
          take on production customers. We&rsquo;d rather say this plainly than imply a certification we don&rsquo;t
          hold.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">Reporting a vulnerability</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          Email{" "}
          <a href="mailto:security@loveiq.org" className="font-medium text-brand no-underline hover:underline">
            security@loveiq.org
          </a>
          . We acknowledge within 3 business days and aim to share a remediation timeline within 10. Please act in good
          faith and give us reasonable time to remediate before disclosure. Full policy:{" "}
          <a
            href="https://github.com/hackatons-em/copilot-exposure-lab/blob/main/SECURITY.md"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand no-underline hover:underline"
          >
            SECURITY.md
          </a>
          .
        </p>
      </section>
    </MarketingChrome>
  );
}
