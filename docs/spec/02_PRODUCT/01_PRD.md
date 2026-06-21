# Product Requirements Document

## Problem
Security and M365 teams need to approve Copilot/Copilot Studio rollout but cannot easily prove which sensitive data or risky agent actions are exposed through existing permissions, links, labels, and agents.

## Goal
Run controlled exposure tests and generate an evidence-backed remediation report.

## Users
- Security architect.
- Microsoft 365 admin.
- SharePoint admin.
- Data governance lead.
- AI governance lead.

## Buyer
- CISO.
- Head of Information Security.
- CIO/Head of IT.
- VP Security Engineering.

## Must have
- Workspace.
- Demo dataset.
- Metadata ingestion.
- Permission graph.
- Scenario runner.
- Risk scoring.
- Findings dashboard.
- Finding evidence.
- Remediation guidance.
- Report export.
- Audit log.

## Should have
- Azure AI Search demo retrieval simulation.
- Markdown/HTML/PDF-ready report.
- CSV export.
- Microsoft Graph sandbox connector.

## Won't have in MVP
- Automatic remediation.
- Full content storage.
- Full Copilot runtime integration.
- Multi-cloud.
- SOC 2.
- Production-scale scanning.

## Acceptance criteria
- No finding without evidence.
- No evidence without source object IDs.
- No critical finding without remediation.
- No LLM-only severity.
- No broad access to real customer data for demo.
