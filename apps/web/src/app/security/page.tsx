import type { Metadata } from "next";
import { MarketingChrome } from "@/components/landing/MarketingChrome";

export const metadata: Metadata = {
  title: "Security & Trust — Copilot Exposure Lab",
  description:
    "How Copilot Exposure Lab handles your data: read-only metadata-only Microsoft Graph access, deterministic scoring, audited writes, and an honest compliance roadmap.",
};

const SCOPES = [
  { scope: "User.Read.All", why: "Resolve who principals are and whether accounts are active (offboarding gaps)." },
  { scope: "Group.Read.All", why: "Expand group membership to compute who can actually reach a resource." },
  { scope: "Sites.Read.All", why: "Read site/library structure, sensitivity labels, and inheritance." },
  { scope: "Files.Read.All", why: "Read file metadata, sharing links, and permissions — never contents." },
];

const INVARIANTS = [
  {
    title: "Metadata-only",
    body: "We ingest labels, permissions, group membership, sharing links, and agent configuration. We never store document contents, email bodies, Teams messages, or credentials.",
  },
  {
    title: "Least privilege, read-only",
    body: "Every Graph scope is read-only and scope-limited. There are no write scopes — the product cannot modify your tenant, by construction.",
  },
  {
    title: "No auto-remediation",
    body: "Generated fix scripts are advisory. They are never executed by the product; a human reviews and runs them.",
  },
  {
    title: "Deterministic scoring",
    body: "Severity comes from a transparent 0–100 model — same input, same score. LLMs may summarize, but never decide risk or invent facts. The rule engine imports no AI SDK (enforced in CI).",
  },
  {
    title: "Evidence-backed",
    body: "Every finding carries an evidence chain; every evidence item points at a concrete source object id. No evidence → no finding.",
  },
  {
    title: "Audited & isolated",
    body: "Every state-changing call emits an audit event. Secrets are never logged or returned. Data is scoped per workspace; deleting a workspace removes its data.",
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
        We hold ourselves to the posture we help you reach.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        Copilot Exposure Lab is a security product. These are architectural invariants enforced in code — not
        marketing claims.
      </p>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">Microsoft Graph scopes</h2>
        <p className="mt-2 text-base text-ink-soft">Read-only and scope-limited. Each one is explained, not just requested.</p>
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
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">Data-handling invariants</h2>
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
        <h2 className="font-display text-xl font-semibold tracking-tightest text-ink">Compliance roadmap — honest status</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          We are early-stage and <strong className="text-ink">not SOC 2 certified yet</strong>. We designed the data
          handling — metadata-only, least privilege, audit, deletion — to make that path straightforward, and will
          pursue SOC 2 Type II as we take on production customers. We&rsquo;d rather say this plainly than imply a
          certification we don&rsquo;t hold.
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
