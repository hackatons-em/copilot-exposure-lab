# Outbound Sequences — Ready to Send

Polished, send-ready outbound for Copilot Exposure Lab: a 4-touch email sequence and 2 LinkedIn touches. Keep every claim honest to what the demo actually shows.

## Who to target (ICP)

- **Company:** 500–5,000 employees, Microsoft 365 E5 / Microsoft-heavy, with a **Copilot pilot or rollout** underway and sensitive SharePoint / OneDrive / Teams data.
- **Industries:** financial services, insurance, healthcare, legal, professional services, B2B SaaS, government contractors, research/education with sensitive data.
- **Titles:** CISO, Head of Information Security, VP Security Engineering, Director of Security Architecture, CIO, Head of IT, Director of Microsoft 365, Data Governance Lead.
- **Trigger events:** Copilot rollout, Copilot Studio project, Purview/SAM implementation, security audit, board AI-risk question, hiring for M365 governance/security.

## The value prop (one line)

> **Run a Copilot exposure drill before rollout: evidence of what Copilot can reach, the Microsoft-native remediation, and proof-of-fix.**

## CTA

**Book a 30-minute exposure review.** (Honest framing: it's a working-session demo against our Acme demo tenant — not a free scan of their environment.)

## Placeholders

`{{FirstName}}` · `{{Company}}` · `{{Industry}}` · `{{TriggerEvent}}` (e.g. "your Copilot rollout") · `{{SenderName}}` · `{{BookingLink}}`

---

## Email sequence (4 touches)

### Touch 1 — Day 1 — Security architect / practitioner angle

**Subject:** Copilot rollout exposure question

Hi {{FirstName}},

Quick question before {{Company}} expands Microsoft 365 Copilot: how are you testing whether Copilot can surface sensitive SharePoint or OneDrive content through oversharing, broad groups, or stale links?

We run a safe **Copilot exposure drill** — it simulates realistic exposure paths, shows the exact files, permissions, and agents involved, and produces Microsoft-native remediation steps for the M365/security team. Metadata-only, read-only, deterministic scoring.

Worth comparing notes for 20 minutes?

{{SenderName}}

---

### Touch 2 — Day 3 — Concrete proof (the salary example)

**Subject:** Re: Copilot rollout exposure question

Hi {{FirstName}},

One concrete example from our demo tenant: a normal employee should never see HR compensation data — but a salary file had an **organization-wide sharing link**, so it was reachable org-wide, and Copilot makes that exposure easy to discover.

Our drill surfaced **9 findings** there (1 critical, 4 high, 4 medium). For the salary file it shows the full path — *user → "Everyone Except External Users" group → org-wide link → salary file* — the Microsoft-native fix, and a re-scan that proves the fix.

Would a pre-rollout exposure report like that be useful for your security review?

{{SenderName}}

---

### Touch 3 — Day 7 — CISO / value framing

**Subject:** Pre-rollout Copilot exposure assessment

Hi {{FirstName}},

Many teams are expanding Microsoft 365 Copilot before they can prove which sensitive data is reachable through existing M365 permissions and agent configurations. That's the gap that shows up in security review.

Copilot Exposure Lab is a controlled, **metadata-first** exposure assessment: it shows the top Copilot / Copilot Studio agent exposure paths with an evidence chain on every finding, deterministic 0–100 risk scores (an LLM never decides severity), Microsoft-native remediation, and an exportable CISO report. There's a **customer-cloud** option so nothing leaves your tenant.

We're independent — we don't replace Purview, Defender, or SharePoint Advanced Management; we give the rollout team the scenario-based evidence and proof-of-fix those tools don't.

Open to a 30-minute exposure review?

{{SenderName}}

---

### Touch 4 — Day 12 — Break-up

**Subject:** Closing the loop on Copilot exposure

Hi {{FirstName}},

I'll stop here so I'm not cluttering your inbox. If {{TriggerEvent}} is still moving and you want evidence of what Copilot can reach — plus the fix and proof-of-fix — before it's fully rolled out, the door's open:

{{BookingLink}}

Either way, good luck with the rollout.

{{SenderName}}

---

## LinkedIn touches (2)

### LinkedIn Touch 1 — Connection request (note ≤ 300 chars)

Hi {{FirstName}} — I work on pre-rollout Microsoft 365 Copilot exposure testing (which sensitive SharePoint/OneDrive content Copilot can reach via oversharing, broad groups, stale links). Given {{TriggerEvent}}, thought it'd be worth connecting.

### LinkedIn Touch 2 — Follow-up message (after they accept)

Thanks for connecting, {{FirstName}}. Short version of what we do: a safe Copilot **exposure drill** before rollout — it simulates realistic exposure paths, shows the exact files/permissions/agents, scores risk deterministically, and gives Microsoft-native remediation plus proof-of-fix.

In our demo tenant it found a salary file reachable through an org-wide link — exactly the kind of thing security review wants caught before Copilot is everywhere. Worth a 30-minute exposure review? {{BookingLink}}

---

## Honesty guardrails for reps

- The drill the prospect sees runs on the **Acme demo tenant** (9 findings: 1 critical / 4 high / 4 medium). A scan of *their* tenant happens in a **paid pilot**, not the intro call.
- It's **metadata-only and read-only** — no document content stored, no write access, no automated changes. Say so; it removes the biggest objection.
- Risk scoring is **deterministic** — an LLM may summarize, but never sets severity.
- We **do not replace** Purview / Defender / SharePoint Advanced Management. We complement them with scenario-based evidence and proof-of-fix.
- **SOC 2 is not certified** — it's on the roadmap. Don't imply otherwise.
