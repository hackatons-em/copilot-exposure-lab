# Security Policy

Copilot Exposure Lab is a security product. We hold ourselves to the posture we
help customers reach.

## Reporting a vulnerability

Email **security@loveiq.org** with the details and, if possible, a proof of
concept. Please do not open a public issue for security reports.

- We acknowledge reports within **3 business days**.
- We aim to provide a remediation timeline within **10 business days**.
- We will credit reporters who wish to be named once a fix ships.

Please act in good faith: don't access data that isn't yours, don't degrade
service, and give us reasonable time to remediate before any disclosure.

## Product security posture

These are architectural invariants, enforced in code — not aspirations:

- **Metadata-only.** The connector requests read-only Microsoft Graph scopes and
  never stores document contents, email bodies, Teams messages, or credentials.
  Only metadata (labels, permissions, group membership, sharing links, agent
  configuration) is processed.
- **Least privilege.** Graph scopes are read-only and scope-limited
  (`User.Read.All`, `Group.Read.All`, `Sites.Read.All`, `Files.Read.All`). There
  are **no write scopes** — the product cannot modify your tenant.
- **No auto-remediation.** Generated fix scripts are **advisory**. They are never
  executed by the product; a human reviews and runs them.
- **Deterministic scoring.** Severity is computed by a transparent 0–100 model.
  LLMs may summarize, but never decide severity or invent facts. The rule engine
  imports no AI SDK (enforced by an ESLint `no-restricted-imports` rule).
- **Evidence-backed.** Every finding carries an evidence chain; every evidence
  item points at a concrete source object id. No evidence → no finding.
- **Secrets never logged or returned.** Client secrets used to connect a live
  tenant are used transiently to acquire a token and are never persisted, logged,
  or echoed back.
- **Audited writes.** Every state-changing API call emits an `AuditEvent`.
- **Workspace isolation + deletion.** Data is scoped per workspace; deleting a
  workspace removes its associated data.

## Compliance roadmap (honest status)

We are an early-stage product. We are **not** SOC 2 certified yet. We have
designed the data handling (metadata-only, least privilege, audit, deletion) to
make that path straightforward, and will pursue SOC 2 Type II as we take on
production customers. We would rather state this plainly than imply a
certification we don't hold.

## Supported versions

This is a single actively-developed line. Security fixes land on `main` and the
deployed environment is updated from there.
