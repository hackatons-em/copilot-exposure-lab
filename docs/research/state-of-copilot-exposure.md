# The State of Copilot Exposure

A point-of-view on why Microsoft 365 Copilot turns a decade of quiet oversharing
into an instant data-exposure problem — and a taxonomy of the exposure archetypes
a deterministic engine can find before rollout.

> **Honesty note.** The quantitative figures below come from Copilot Exposure
> Lab's deterministic engine run over a **synthetic reference enterprise**, not
> from customer tenants. They are **illustrative**, included to show the *shape*
> of the problem at scale. We will publish aggregate, anonymized statistics from
> real pilots once we have them — and we will say so plainly when we do.

## The thesis

Permissions in M365 accreted over a decade: "share with everyone," broad
department groups, guest accounts that were never offboarded, sites whose
inheritance nobody audited. None of it was urgent because reaching a file still
required *knowing it existed and where it lived*.

Copilot removes that friction. A single natural-language prompt can retrieve and
summarize anything the asking user is technically permitted to see. The latent
permission surface becomes an active retrieval surface overnight. Security teams
need **proof of what Copilot would surface, before rollout** — not a postmortem.

## The exposure archetypes

Copilot Exposure Lab detects eight deterministic archetypes. Each is evidence-
backed (it points at the file, group, link, or agent that created it), scored
0–100, and mapped to MITRE ATT&CK + control frameworks.

| Archetype | What it is | ATT&CK |
|---|---|---|
| Org-wide link on sensitive file | "Anyone in the org" link to confidential content | T1213.002, T1530 |
| Broad department access | A large group granted direct read on sensitive content | T1213.002 |
| Inherited broad read | A site grants whole-org read; sensitive files inherit it | T1213.002, T1530 |
| Stale external access | A guest's access outlived its expiry | T1078.004 |
| Missing sensitivity label | Sensitive content with no Purview label (governance gap) | — |
| Agent send/egress action | A Copilot agent that can mail.send / call external connectors | T1567 |
| Orphaned agent owner | An agent owned by a departed/disabled account | T1078 |
| Risky connector | An agent wired to high-risk egress connectors | T1567 |

## Illustrative figures (synthetic reference tenant)

Run over a seeded, deterministic enterprise of **~1,100 principals, ~5,060
resources, and ~6,380 permission grants** — sized to mirror a real mid-market
M365 tenant — the engine produces, per tenant:

- **~1,330 exposure findings** — far beyond what a team can triage by hand.
- **~14 critical** and **~850 high** severity paths.
- A tenant exposure score that pins at the top of the scale for an un-remediated
  tenant — the entire point of collapsing thousands of findings into one tracked
  number.
- All eight archetypes present, because real enterprises exhibit all of them.

(See [`docs/spec/PERFORMANCE_BENCHMARK.md`](../spec/PERFORMANCE_BENCHMARK.md) for
how the reference tenant is generated and scanned in well under a second.)

The headline is not any single percentage — it is **volume × reachability**. At
this scale, manual review is hopeless; deterministic scoring and ranked, evidence-
backed findings are what make the surface governable.

## What we'll publish next

Once pilots are underway we intend to publish, with consent and anonymization:
the distribution of exposure scores across real tenants, the most common
archetype by industry, and median time-to-remediate once a team can *see* the
paths. Until then, treat the figures here as a model of the problem, not a
measurement of your environment.

— Copilot Exposure Lab
