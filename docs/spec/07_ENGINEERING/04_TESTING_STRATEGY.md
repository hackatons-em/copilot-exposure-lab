# Testing Strategy

## Unit tests
- Sensitivity classifier.
- Permission breadth rules.
- Link exposure.
- Guest/external access.
- Agent action rules.
- Risk scoring.

## Integration tests
- Seed demo.
- Run scan.
- Build permission graph.
- Run scenario.
- Generate findings.
- Export report.

## Graph tests
- Mock Graph responses.
- 429 retry handling.
- Partial failure.
- Checkpoint resume.
- Scope-limited scan.

## Security tests
- Workspace isolation.
- Role authorization.
- Secrets not logged.
- Report access control.
- Delete workspace removes data.

## Demo test
Before every demo: seed, run scenarios, confirm findings, export report, check UI.
