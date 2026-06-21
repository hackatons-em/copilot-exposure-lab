# Agent Coding Prompts

## Frontend
Build serious enterprise UI for Copilot Exposure Lab. Use mocked data first. Every finding must show severity, evidence chain, and remediation. No generic AI visuals. Follow screen specs.

## Backend
Build APIs, workspace isolation, deterministic rules, findings, reports, audit logs. Do not store full content by default. Every finding needs evidence.

## Rule engine
Implement deterministic sensitivity, broad access, link, guest, and agent-action rules. LLMs cannot decide severity.

## Graph connector
Build Microsoft Graph metadata connector with least privilege, retry, throttling, checkpointing, and no full document body ingestion by default.

## Report generator
Generate executive/technical report using findings as source of truth. LLM summaries optional; no invented facts.
