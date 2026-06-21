# API Spec

## Workspaces
- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/{id}`

## Connections
- `POST /api/workspaces/{id}/connections/demo/seed`
- `POST /api/workspaces/{id}/connections/microsoft/start`
- `GET /api/workspaces/{id}/connections`
- `DELETE /api/workspaces/{id}/connections/{connectionId}`

## Scans
- `POST /api/workspaces/{id}/scans`
- `GET /api/workspaces/{id}/scans/{scanRunId}`

## Scenarios
- `GET /api/workspaces/{id}/scenarios`
- `POST /api/workspaces/{id}/scenarios`
- `POST /api/workspaces/{id}/scenarios/{scenarioId}/run`

## Findings
- `GET /api/workspaces/{id}/findings`
- `GET /api/workspaces/{id}/findings/{findingId}`
- `PATCH /api/workspaces/{id}/findings/{findingId}`

## Reports
- `POST /api/workspaces/{id}/reports`
- `GET /api/workspaces/{id}/reports/{reportId}`
- `GET /api/workspaces/{id}/reports/{reportId}/download`

## Audit
- `GET /api/workspaces/{id}/audit-events`

## Rules
- Every write logs audit event.
- Every long job returns run ID.
- Every API enforces workspace isolation.
- Never return secrets.
