# Threat Model

## Assets
- Microsoft metadata.
- Permission graph.
- Findings/reports.
- Graph tokens.
- Customer identity metadata.

## Threats
- Token theft.
- Excessive data collection.
- Cross-tenant data leak.
- Bad risk scoring.
- Unsafe remediation.
- LLM leakage.
- Compromised admin.

## Mitigations
- Key Vault.
- Least privilege.
- Metadata-only default.
- Workspace isolation tests.
- Customer-cloud option.
- Append-only audit logs.
- No automatic remediation in MVP.
- LLM summaries can be disabled.
