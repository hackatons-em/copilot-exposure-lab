# Demo company — Acme Health Finance Ltd

Metadata-only seed for the Copilot Exposure Lab demo. No document content — only the metadata needed to reason about exposure paths. Loaded and validated against `@cel/types` by `@cel/graph-client`'s `loadSeedGraph()`.

| File | Contents |
|---|---|
| `workspace.json` | workspace + tenant connection (demo-seed mode, requested Graph scopes) |
| `principals.json` | 9 users (incl. 1 offboarded maker) + 8 groups (incl. "Everyone Except External Users") |
| `resources.json` | 7 SharePoint sites, 5 sensitive files, 2 agents (a Copilot Studio helpdesk bot + a Power Automate flow) |
| `grants.json` | permission grants — direct, inherited (via parent site), org-wide link, and guest |
| `scenarios.json` | 5 exposure scenarios (normal-employee, contractor-guest, broad-sharing, sensitive-file, agent-action) |

## The 7 intentional issues

| # | Issue | Encoded by |
|---|---|---|
| 1 | HR salary file reachable through an **organization-wide link** | grant `pg-issue1-salary-orgwide` (`g-everyone` → `f-salary`, via `orgwide`) |
| 2 | Customer contracts exposed to a **broad Sales group** (42 members) | grant `pg-issue2-contracts-sales` (`g-sales` → `s-contracts`, inherited by `f-msa`) |
| 3 | Board site has **inherited broad read** | grant `pg-issue3-board-everyone` (`g-everyone` → `s-board`, inherited by `f-acq`) |
| 4 | **Contractor still has access** to Project Phoenix (expired) | grant `pg-issue4-phoenix-contractor` (`u-dev` guest → `s-phoenix`, `expirationAt` in the past) |
| 5 | Security doc **missing a sensitivity label** | `f-token` (`token_rotation_notes.docx`) has `sensitivityLabel: null` + secret/token tags |
| 6 | Helpdesk **agent can send email externally** | `a-helpdesk` `agentActions: ["mail.send", ...]` |
| 7 | **Agent owner is a departed maker** | `a-helpdesk` `ownerPrincipalId: u-tomas` where `u-tomas.active = false` |

## Hero exposure path (Normal employee → salary file)

```
Bob Novak (user)
  └─ member of → Everyone Except External Users (group)
       └─ granted via → organization-wide link (read)
            └─ targets → /HR/Compensation/2026_salary_plan.xlsx
```
