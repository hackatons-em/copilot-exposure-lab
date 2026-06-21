# Copilot Exposure Lab — Security & Procurement Packet

*For the security, privacy, and procurement teams evaluating a pilot.*

This packet describes how Copilot Exposure Lab handles your Microsoft 365 data, what it can and cannot do, and the controls that protect it. It is written to be reviewed before a pilot and is specific to the product as built — it does not claim capabilities the product does not have.

| | |
|---|---|
| **Product** | Copilot Exposure Lab — a Microsoft-native exposure assessment for Microsoft 365 Copilot, Copilot Studio agents, and SharePoint / OneDrive permissions. |
| **What it is not** | Not a chatbot, not a replacement for Microsoft Purview, Defender, or SharePoint Advanced Management. It is an independent assessment that produces evidence-backed findings and remediation. |
| **Access required** | **Read-only**, **least-privilege** Microsoft Graph application permissions. **No write scopes.** |
| **Default data posture** | **Metadata-only.** No document content, email bodies, Teams messages, or credentials are stored. |
| **Training on customer data** | **No.** Customer data is never used to train models. |
| **Deletion** | Deleting a workspace cascades to all of its data. Full export is available before deletion. |
| **Compliance status** | SOC 2 is a roadmap item — **not yet certified.** See [Compliance posture](#10-compliance-posture). |

---

## 1. Overview & deployment models

The assessment builds a permission + resource graph from Microsoft 365 metadata, runs realistic exposure scenarios (normal employee, contractor/guest, broad sharing, sensitive file, risky agent), produces evidence-backed findings with deterministic risk scores, maps each finding to a Microsoft-native remediation, and can re-run to prove the fix. Output is a CISO-ready report (Markdown / HTML).

Two deployment models are offered:

| Model | Where data lives | Best for |
|---|---|---|
| **SaaS (metadata-only)** | Our Azure environment. Only **metadata** is ingested and stored — never document content. | Fast pilots; teams comfortable with a vendor holding M365 metadata. |
| **Customer-cloud** | Entirely inside **your** Azure subscription. Metadata, the permission graph, findings, and reports never leave your tenant. | Regulated buyers who will not let an early-stage vendor store M365 metadata. See [`CUSTOMER_CLOUD_DEPLOYMENT.md`](./CUSTOMER_CLOUD_DEPLOYMENT.md). |

In both models the analysis pipeline is identical: the same deterministic `scan()` engine that powers the demo runs over the live graph, so findings, evidence chains, scoring, and report shape do not change.

### Architecture (high level)

```
web (Next.js) → api (Fastify REST) → Postgres + jobs queue + Blob
worker polls jobs: graph ingest → permission graph → rule-engine → findings/evidence
                   scenario-run | report-gen (deterministic MD/HTML) | cleanup (retention)
```

### Data flow

1. An admin in the target tenant registers an Entra application and grants read-only consent (see [`../SETUP-GRAPH.md`](../SETUP-GRAPH.md)).
2. The connector ingests **metadata only** from Microsoft Graph, throttled and checkpointed per phase.
3. The metadata is normalized into a permission/resource graph and persisted (scope per deployment model).
4. The deterministic rule engine scores exposure paths and emits findings, each with an evidence chain and a remediation task.
5. A report is generated. The customer chooses what, if anything, to export or share.

---

## 2. Data handling — exactly what is and isn't stored

The connector requests **metadata only** by default. Full content is never required to find the high-risk exposure paths the product targets.

**Stored by default**

| Data | Example |
|---|---|
| Tenant / object metadata | user display names, UPNs, job titles, departments; group names + membership; site/file names, paths, web URLs |
| Permission grants | who has access, role, and *how* (direct, inherited, group-based, link-based, guest/external) |
| Findings | scored exposure paths (0–100, with severity band) |
| Evidence references | each evidence item carries a `sourceObjectId` pointing at the file/site/user/group/permission/link/agent it proves — **a reference, never the content** |
| Reports | generated Markdown / HTML exposure reports |
| Audit events | one append-only event per sensitive write (see [§5](#5-audit-logging)) |

**NOT stored (by default)**

| Not stored |
|---|
| Full document content / file bodies |
| Email bodies |
| Teams / chat messages |
| Credentials or client secrets (see [§4](#4-secrets-management)) |

The connector enforces this at the source: Microsoft Graph requests use least-privilege `$select` projections (e.g. for files: `id,name,webUrl,folder,file,parentReference`) — **metadata fields only, never the file body**. No `Mail.*` scope is requested, so message bodies are never reachable.

> **Privacy promise:** the assessment starts metadata-only. We do not need full document bodies to find many high-risk exposure paths.

---

## 3. Microsoft Graph permissions

Permissions are **read-only application permissions**, scope-limited, and each is explained to the customer in the UI before consent. **No write scopes. No `Mail.*` scopes.**

| Scope | Why it is needed | Access |
|---|---|---|
| `User.Read.All` | Enumerate users as principals in the permission graph (metadata: name, UPN, job title, department, account-enabled, user type). | Read-only |
| `Group.Read.All` | Read groups and membership to analyze broad-access and group-based exposure (e.g. "Everyone Except External Users"). | Read-only |
| `Sites.Read.All` | Enumerate SharePoint sites and their structure. | Read-only |
| `Files.Read.All` | Read drive items and their sharing permissions — **metadata and permission grants only, not file content**. | Read-only |

These four scopes are the defaults the live `MsGraphClient` requests. The product requests **no write permissions** in MVP/V1, so it cannot modify, delete, or share any tenant object. Remediation is always presented as Microsoft-native steps for *your* team to apply — the product does not perform automated remediation.

---

## 4. Secrets management

The Microsoft Graph connection uses a client secret supplied by the customer's admin. It is handled as a transient credential:

- **Used transiently** to acquire a token and build the connector, then discarded.
- **Never logged.** Secrets are not written to application logs.
- **Never returned** in any API response.
- **Never persisted** in the database — only the tenant name and connection mode are recorded.
- **Never included in reports or exports.**
- **Rotated on disconnect** — disconnecting a tenant invalidates the stored connection; the recommended practice is to rotate/remove the Entra client secret on the customer side.

In Azure deployments, secrets and connection strings are held in **Azure Key Vault** (RBAC-authorized, soft-delete enabled) and injected into the runtime as secret references — not baked into images or source.

> When connecting a live tenant, the audit log records only the **tenant name** and **mode** — never the secret.

---

## 5. Audit logging

Every API **write** emits an append-only `AuditEvent`. Audit events are **append-only**, contain **no secrets**, and contain **no document content**. Each event records: `id`, `workspaceId`, `actor`, `action`, `targetId`, `timestamp`, and an `action`-specific `detail` object.

Actions currently audited include:

| Area | Audited actions |
|---|---|
| Workspace | `workspace.create`, `workspace.delete` |
| Connections | `connection.demo.seed`, `connection.microsoft.start`, per-system seeds (`connection.google-workspace.seed`, `connection.slack.seed`, `connection.salesforce.seed`, `connection.multi-system.seed`) |
| Scans | `scan.run` (records finding count + severity bands) |
| Findings | `finding.update` (status changes and apply-fix) |
| Reports | `report.create`, `report.export` |
| Exports | `export.<format>` (e.g. Defender / Purview / Sentinel / Jira / ServiceNow / CSV) |
| Schedules | `schedule.create`, `schedule.update`, `schedule.delete` |
| Change notifications | `notification.received` (records change type + resource) |

Audit events are scoped to a workspace and retrievable via the API (`GET /api/workspaces/:id/audit-events`), so a reviewer can reconstruct exactly what was scanned, exported, and changed.

---

## 6. Data retention & deletion

The product is built to delete completely. Deleting a workspace **cascades** to all of its data — connection, principals, resources, permission grants, scenarios, scenario runs, findings, evidence, remediation tasks, reports, and audit events for that workspace.

A retention/cleanup job runs on the worker to drop aged data automatically. Default cutoffs:

| Data | Default retention |
|---|---|
| Tenant metadata | Until disconnect / delete |
| Graph connection / secret material | Until disconnect (secret itself never persisted) |
| File & permission metadata | 30–90 days in pilot |
| Findings | 90 days |
| Reports | 90 days (worker cleanup default 30 days for stored artifacts; configurable) |
| Finished jobs | 7 days |
| Audit logs | 180 days |
| Full document content | Not stored |

Supported deletion operations: delete workspace, disconnect tenant, delete a report, delete a scan run, and **export before deletion**.

---

## 7. Authentication & access (current state)

We state this honestly rather than overclaiming:

- **Workspace isolation is enforced today.** Every API route resolves and asserts the target workspace before acting, and all data (graph, findings, reports, audit) is partitioned by workspace.
- **Product RBAC and API authentication are on the roadmap.** The intended model is API-key / RBAC with roles **Owner / Admin / Analyst / Viewer**, plus **Microsoft Entra ID SSO** for V1. These are not yet enforced in the current build.
- **For pilots**, access to the assessment environment is controlled at the deployment boundary (network/identity controls on the hosting environment, or — in customer-cloud — by your own Azure RBAC).

Intended RBAC matrix (roadmap):

| Role | Connect | Scan | View findings | Export | Manage users | Delete |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Owner | yes | yes | yes | yes | yes | yes |
| Admin | yes | yes | yes | yes | no | no |
| Analyst | no | yes | yes | yes | no | no |
| Viewer | no | no | yes | no | no | no |

---

## 8. Threat model summary

| Threat | Mitigation |
|---|---|
| **Token / secret theft** | Secrets in Key Vault; never logged, returned, or persisted; rotated on disconnect. Least-privilege read-only scopes limit blast radius. |
| **Excessive data collection** | Metadata-only by default; least-privilege `$select` projections; no `Mail.*`; no document content. |
| **Cross-tenant / cross-workspace data leak** | Workspace isolation enforced on every route; data partitioned by workspace; isolation covered by tests. |
| **Bad / manipulable risk scoring** | Deterministic 0–100 scorer is the sole authority on severity; the rule engine imports no AI SDK; golden snapshot tests guard stability (same input → same findings, scores, report bytes). |
| **Unsafe remediation** | No write scopes; **no automated remediation** — fixes are presented for the customer's team to apply. |
| **LLM leakage / hallucination** | LLMs may summarize a report but **never decide severity or invent facts**; the AI narrative is env-gated and can be disabled; scoring never depends on it. |
| **Compromised operator / admin** | Append-only audit log on every write; customer-cloud option removes the vendor from the trust boundary entirely. |

---

## 9. Hosting & subprocessors

The product runs on **Microsoft Azure**. There are no third-party data subprocessors beyond Azure in the default architecture.

| Component | Azure service |
|---|---|
| Compute (api / worker / web) | Azure Container Apps (consumption; **no Kubernetes**) |
| Database | Azure Database for PostgreSQL Flexible Server (Burstable B1ms; TLS required) |
| Report artifacts | Azure Blob Storage (StorageV2; public blob access disabled; TLS 1.2 min) |
| Secrets | Azure Key Vault (RBAC-authorized; soft-delete enabled) |
| Retrieval simulation | Azure AI Search (free tier in demo) |
| Telemetry | Azure Monitor / Application Insights (30-day log retention) |

The demo/dev deployment is **single-region** with cost controls: cheapest viable tiers, short log retention, and a **$1000 monthly budget** with email alerts at **$100 / $250 / $500 / $800** (10/25/50/80%). Multi-region/HA is not part of the demo footprint.

---

## 10. Compliance posture

We are explicit about where we are:

- **SOC 2 is not yet certified.** It is on the roadmap (V2: SOC 2 Type I; V3: SOC 2 Type II). We do not claim certification we do not hold.
- **Pre-SOC 2 controls in place / being formalized:** access-control practices, append-only audit logging, change management, incident response, a documented data-retention policy, Key Vault-based secret management, backups, a vendor list (Azure only), and vulnerability management.
- **GDPR data-handling alignment:** metadata-only by default minimizes personal data; deletion cascades on workspace removal; export-before-deletion is supported; no training on customer data. The customer-cloud model keeps all data inside the customer's own tenant and legal boundary.
- **Pilot constraints (by design):** read-only, narrow scope, metadata-only default, no automated remediation, and the customer approves all exports.

---

## 11. Pilot scope (what a pilot covers)

- Read-only, narrow, customer-approved scope (specific tenant / sites / departments).
- Metadata-only by default; optional content sampling only if explicitly enabled by the customer.
- Findings review, executive report, remediation plan, and an optional proof-of-fix re-scan.
- The customer controls what is exported or shared.

---

## 12. Responsible disclosure & contact

- **Security / incident contact:** teamwork@loveiq.org
- **Responsible disclosure:** report suspected vulnerabilities to the address above with enough detail to reproduce. We will acknowledge, investigate, and coordinate remediation and disclosure. Please do not publicly disclose before we have had a reasonable opportunity to respond.

---

*This document reflects the product as currently built. Items marked "roadmap" are not yet implemented and are not represented as available. Verify Microsoft-specific claims against [Microsoft Learn](../spec/REFERENCES.md) before relying on them in a regulated context.*
