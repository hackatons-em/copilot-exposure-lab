# Copilot Exposure Lab — One-Pager

**Run a Copilot exposure drill before rollout. See the evidence, fix what matters first, prove the fix.**

A Microsoft-native security assessment that safely tests whether Microsoft 365 Copilot, Copilot Studio agents, and existing SharePoint / OneDrive permissions could expose sensitive company data — then gives your security team exact evidence and Microsoft-native remediation.

---

## The problem

Microsoft 365 Copilot inherits whatever your existing permissions allow. Those permissions are broad, inherited, stale, or link-based — and Copilot makes the sensitive content behind them *easy to discover*. Security teams need proof of what Copilot can reach **before** they expand it, and existing posture tools don't give the rollout team scenario-based evidence or proof-of-fix.

## What it does

1. Builds a permission + resource graph from Microsoft 365 metadata.
2. Runs realistic **exposure scenarios** — normal employee, contractor/guest, broad sharing, sensitive file, risky agent.
3. Produces **evidence-backed findings** — every finding traces a source object (file, site, user, group, permission, link, agent).
4. Scores risk with a **deterministic 0–100 model**.
5. Maps each finding to **Microsoft-native remediation**, then re-runs to **prove the fix**.
6. Exports a **CISO-ready report** (Markdown / HTML).

## The wedge

Don't sell "AI security." **Unblock the Copilot rollout** with exposure evidence and remediation — the one thing security review asks for and existing tools don't produce for the rollout team. Independent: it does **not** replace Microsoft Purview, Defender, or SharePoint Advanced Management.

## Proof points

| | |
|---|---|
| **Deterministic scoring** | A 0–100 scorer is the sole authority on severity. An LLM may summarize the report, but never decides severity or invents facts. Same input → same findings, scores, and report bytes. |
| **Evidence chains** | Every finding has an evidence chain to a real source object — e.g. *user → "Everyone Except External Users" → org-wide link → salary file*. No evidence, no finding. |
| **Exportable CISO report** | One report (MD/HTML) with findings by severity, evidence detail, and a prioritized Microsoft-native remediation plan. |
| **Customer-cloud option** | Deploy the whole stack inside your own Azure subscription so M365 metadata never leaves your tenant. |
| **Metadata-only & read-only** | Least-privilege, read-only Graph scopes. No document content, email bodies, or Teams messages stored. No write access, no automated changes. |
| **Proof-of-fix** | Apply the Microsoft-native fix, re-scan, and confirm the exposure path is closed. |

### What the demo shows

Against the Acme demo tenant, the drill surfaces **9 findings — 1 critical, 4 high, 4 medium**. The critical one: a **salary file reachable through an organization-wide sharing link**, with the full exposure path, the fix, and a re-scan that verifies it.

## Pricing

**Copilot Exposure Assessment — $10k–$25k** for a 2–4 week engagement. Deliverables: scoped assessment, findings dashboard, top exposure paths, remediation plan, executive report, and an optional proof-of-fix re-scan. (Product subscription tiers and an enterprise plan follow successful pilots.)

## Why now

Copilot rollouts are accelerating, but security and compliance teams are gating them on proof that sensitive data isn't over-reachable. Boards are asking the AI-risk question. The exposure paths already exist in the tenant — Copilot just makes them easy to find. A pre-rollout exposure drill turns "we think it's fine" into evidence, a prioritized fix list, and proof the fixes worked.

---

**Book a 30-minute exposure review.** · Contact: teamwork@loveiq.org

*Independent product. SOC 2 is on the roadmap (not yet certified). Does not replace Microsoft Purview, Defender, or SharePoint Advanced Management.*
