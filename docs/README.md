# Docs

The complete build manual for Copilot Exposure Lab lives verbatim under [`spec/`](./spec). Read [`../CLAUDE.md`](../CLAUDE.md) first — it encodes the binding non-negotiables that override convenience.

## Spec map (`docs/spec/`)

| Area | Folder | Read for |
|---|---|---|
| Start here | [`00_START_HERE`](./spec/00_START_HERE) | plain-English overview, non-negotiables, $1k credits plan |
| Strategy | [`01_STRATEGY`](./spec/01_STRATEGY) | thesis, wedge, scope boundaries, success metrics |
| Product | [`02_PRODUCT`](./spec/02_PRODUCT) | PRD, workflows, user stories, **report spec**, **risk scoring model** |
| Validation | [`03_VALIDATION`](./spec/03_VALIDATION) | discovery plan, interview script, kill/build criteria |
| Architecture | [`04_ARCHITECTURE`](./spec/04_ARCHITECTURE) | system overview, Azure ref arch, **Graph integration**, **data model**, **API spec**, jobs |
| Security | [`05_SECURITY`](./spec/05_SECURITY) | security/permissions/threat models, privacy, audit |
| Design | [`06_DESIGN`](./spec/06_DESIGN) | principles, IA, screen specs, dashboard copy, visual style |
| Engineering | [`07_ENGINEERING`](./spec/07_ENGINEERING) | repo structure, epics/tickets, day-by-day, testing, DoD |
| Demo | [`08_DEMO`](./spec/08_DEMO) | storyboard, **demo dataset (Acme)**, script, checklist |
| GTM | [`09_GTM`](./spec/09_GTM) | ICP, prospecting, sequences, landing copy, pricing |
| Operations | [`10_OPERATIONS`](./spec/10_OPERATIONS) | operating system, weekly review, metrics |
| Enterprise | [`11_ENTERPRISE`](./spec/11_ENTERPRISE) | security packet, customer-cloud, SLA, marketplace |
| Templates | [`12_TEMPLATES`](./spec/12_TEMPLATES) | PRD/ticket/interview/SOW/**risk report** templates |
| Roadmap | [`13_ROADMAP`](./spec/13_ROADMAP) | 90-day, 12-month, end-state |
| Agent prompts | [`14_AGENT_PROMPTS`](./spec/14_AGENT_PROMPTS) | frontend/backend/security/growth agent briefs |
| References | [`spec/REFERENCES.md`](./spec/REFERENCES.md) | Microsoft Learn links — **verify before customer-facing claims** |

## Setup runbooks (added later in the build)

- `SETUP-GRAPH.md` — Entra app registration + admin consent for the live Microsoft Graph connector.
- `SETUP-AZURE.md` — provision + deploy to Azure (Container Apps, Postgres, etc.).

### Enterprise & GTM (deliverables)

Polished, customer-facing documents built from the spec and the real product.

- **Enterprise** ([`enterprise/`](./enterprise)) — [security packet](./enterprise/SECURITY_PACKET.md), [customer-cloud deployment](./enterprise/CUSTOMER_CLOUD_DEPLOYMENT.md), and [support & SLA](./enterprise/SUPPORT_AND_SLA.md) for the procurement/security review before a pilot.
- **GTM** ([`gtm/`](./gtm)) — [one-pager](./gtm/ONE_PAGER.md) and [outbound sequences](./gtm/OUTBOUND_SEQUENCES.md) (4 emails + 2 LinkedIn touches).
