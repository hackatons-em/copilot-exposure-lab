# Support & SLA — Proposed Pilot Terms

> **Status: proposed pilot terms.** This outlines the support model offered during a **paid pilot**. It is not a contractual enterprise SLA. Formal, contractual SLAs are offered only once operational readiness is in place; we will not promise an enterprise SLA before then.

## Support model (pilot)

Pilots are founder-led and high-touch. Support runs through a shared channel agreed at kickoff.

| | |
|---|---|
| **Model** | Founder-led, hands-on for the duration of the pilot |
| **Channels** | Email, plus a shared Slack or Teams channel for the pilot |
| **Hours** | Business hours, target same-business-day acknowledgement |
| **Primary contact** | teamwork@loveiq.org |

## What a pilot includes

- **Kickoff** — scope the tenant/sites/departments, confirm metadata-only vs optional content sampling, confirm reviewer and deployment model (SaaS vs customer-cloud).
- **Setup support** — help with Entra app registration, least-privilege consent, and (for customer-cloud) the Azure deployment.
- **Findings review** — walk through the exposure findings, evidence chains, and severity.
- **Report walkthrough** — review the CISO-ready report and prioritized remediation plan.
- **Remediation review** — review the Microsoft-native fixes with your M365/security team and (optionally) re-scan to prove the fix.

## Proposed response targets by severity

Targets are acknowledgement/response objectives during the pilot, business hours, on a best-effort basis.

| Severity | Definition | Response target |
|---|---|---|
| **Sev 1** | Customer data or security incident (e.g. suspected data exposure caused by the product) | Immediate — same business day, prioritized |
| **Sev 2** | Assessment blocked — the pilot cannot proceed (scan/connection/report failure) | Same business day |
| **Sev 3** | Non-critical product issue — a defect with a workaround | Within 2 business days |
| **Sev 4** | Question or feature request | Within 5 business days |

## Scope — what's covered

**Covered**

- Help connecting a sandbox or in-scope production tenant with least-privilege, read-only access.
- Running scans, reviewing findings/evidence, generating and exporting the report.
- Guidance on the Microsoft-native remediation steps the product recommends.
- For customer-cloud: support deploying the stack into your subscription.

**Not covered**

- **Performing remediation in your tenant.** The product is read-only with **no write scopes and no automated remediation**; your team applies the fixes. We review and advise only.
- Acting as a replacement for Microsoft Purview, Defender, or SharePoint Advanced Management.
- 24/7 on-call, contractual uptime guarantees, or production-grade enterprise SLAs (roadmap, gated on operational readiness).
- Custom development outside the agreed pilot scope.

## Security incident contact

For suspected security incidents or vulnerabilities, contact **teamwork@loveiq.org** (Sev 1). See the [Security Packet](./SECURITY_PACKET.md#12-responsible-disclosure--contact) for responsible-disclosure handling.

---

*Severity levels and response targets above are the proposed framework for pilots and will be finalized in the pilot agreement.*
