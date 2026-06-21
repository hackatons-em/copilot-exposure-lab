# Copilot Exposure Lab - Complete Build Manual

This is a repo-style Markdown workspace for building **Copilot Exposure Lab**: a Microsoft-native security product that safely tests whether Microsoft 365 Copilot, Copilot Studio agents, and Microsoft 365 permissions could expose sensitive company data.

The pack is written for founders, developers, designers, security reviewers, and coding agents. It includes strategy, validation, architecture, UX, tickets, demo scripts, GTM, enterprise readiness, and long-term roadmap.

## Product in one sentence

Copilot Exposure Lab runs safe exposure drills against Microsoft 365 Copilot readiness and Copilot Studio-style agent risks, then gives security teams exact evidence and remediation steps before rollout.

## Current assumption

This is a **validation-first build**, not a blind commitment. The uploaded startup master prompt requires a real pain, specific ICP, buyer, demo, 8-12 week MVP, revenue path, defensibility, and hard kill gates. It explicitly rejects ideas below the 9/10 bar. This pack therefore builds the demo/MVP while forcing buyer validation.

## Hard resource constraint

You have about **$1,000 in Microsoft/Azure credits**. Treat this as enough for:
- Demo tenant / sandbox work.
- Azure prototype.
- Metadata-only scanner.
- Dashboard and report generator.
- 20-40 buyer demos.

Not enough for:
- Full production SaaS.
- Enterprise-grade compliance.
- High-volume customer scans.
- Always-on infrastructure.
- Expensive monitoring or Kubernetes.

## How to use this pack

1. Read `00_START_HERE/00_FILE_INDEX.md`.
2. Follow `07_ENGINEERING/03_DAY_BY_DAY_PLAN.md` for the first 14 days.
3. Build the demo from `08_DEMO/`.
4. Run customer discovery from `03_VALIDATION/`.
5. Kill or continue using `03_VALIDATION/05_KILL_AND_BUILD_CRITERIA.md`.
6. Only after validation, move to V1 and customer pilots.

## The first demo must prove

A normal employee, stale guest, broad group, unsafe link, or risky agent path can expose sensitive data. The product identifies the path, explains why it matters, and tells the admin what to fix.
