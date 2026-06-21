# Performance benchmark — enterprise-scale scan

Copilot Exposure Lab's risk engine is deterministic and runs in-process. This
documents that it holds up at **real enterprise scale**, not just on the 7-issue
demo tenant. The numbers are reproducible: same seed → same tenant → same findings.

## The synthetic tenant

`generateLargeTenant({ seed: 1337 })` (in `@cel/graph-client`) builds a seeded,
deterministic enterprise — no `Math.random`, no wall-clock — that passes
`parseTenantGraph` and exercises every rule with realistic oversharing archetypes
(org-wide links on sensitive files, broad department groups, inherited whole-org
reads on confidential sites, stale guest grants, risky unmanaged agents, a
departed agent owner).

| Dimension   | Count |
|-------------|------:|
| Principals (users + groups) | **1,102** |
| Resources (sites, files, agents) | **5,060** |
| Permission grants (ACL entries) | **6,331** |
| Findings produced | **1,518** |
| └ Critical | 9 |
| └ High | 1,002 |
| └ Medium | 507 |

Grants deliberately outnumber resources — real tenants carry layered ACLs, not
one entry per object.

## Measured timing

Measured on a dev workstation (Node 24, single-threaded, warm):

| Phase | Time |
|-------|-----:|
| Tenant generation | ~38 ms |
| **Full scan (all rules + scoring + exposure paths)** | **~220 ms** |

The full deterministic analysis of a 5,000-resource / 6,300-grant tenant completes
in **well under a second**. The CI guard (`packages/rule-engine/src/perf.test.ts`)
asserts the scan stays under a deliberately generous **5 s** budget so it never
flakes on slow shared runners, while the local figure shows real headroom.

### Why it's fast

The permission graph resolves group membership, inheritance, links, guests and
org-wide access into each resource's effective audience. The expensive step —
expanding a principal's transitive membership closure — is **memoized**
(`PermissionGraph.membersOf`), because the same broad groups ("Everyone",
department groups) are referenced by thousands of grants. Memoizing this one
closure cut the large-tenant scan from ~3.7 s to ~0.22 s (≈17×) with byte-identical
output.

## Why scale is the point, not a footnote

At 1,518 findings, **manual triage is hopeless** — a security team cannot eyeball
five thousand resources. That is exactly the case for a deterministic exposure
score and ranked findings: the engine collapses an unmanageable pile into a single
tenant score and an ordered "fix these first" list, every run, reproducibly.

## Reproduce

```bash
pnpm --filter @cel/rule-engine test   # runs perf.test.ts among others
```

Or load it into the running app to see the exposure graph aggregate gracefully:

```bash
curl -X POST http://localhost:4000/api/workspaces/<workspaceId>/connections/large-demo/seed
```
