# Risk Scoring Model

## Total score
0-100 deterministic score.

| Component | Max |
|---|---:|
| Sensitivity | 25 |
| Exposure breadth | 20 |
| External reach | 15 |
| Agent/action risk | 15 |
| Governance gap | 10 |
| Business criticality | 10 |
| Confidence | 5 |

## Severity bands
- 90-100 Critical.
- 70-89 High.
- 40-69 Medium.
- 10-39 Low.
- 0-9 Info.

## Sensitivity signals
salary, payroll, compensation, legal, contract, board, customer, password, secret, token, confidential, HR, Finance, Legal, Executive, Security.

## Exposure signals
Anyone link, organization-wide link, Everyone group, large department group, guest, external, inherited broad site permission.

## Agent/action signals
Email/send action, external connector, maker authentication, broad credential, orphaned owner, unmanaged publication.

## Rule
LLMs can summarize, but deterministic rules decide severity.
