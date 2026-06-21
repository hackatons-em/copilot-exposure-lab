# Sample exposure report

A real, deterministic Copilot Exposure Assessment report generated from the
Acme Health Finance Ltd demo company — the kind of artifact a CISO receives.

- [`acme-exposure-report.md`](./acme-exposure-report.md) — Markdown
- [`acme-exposure-report.html`](./acme-exposure-report.html) — print-ready HTML (open in a browser → Print to PDF)

9 findings (1 critical, 4 high, 4 medium), each with an evidence chain (every
item traced to a source object), a deterministic 0–100 score, and a
Microsoft-native remediation. Regenerate with `pnpm --filter @cel/report sample`.
