# Outbound Sequences

## Security architect email
Subject: Copilot rollout exposure question

Hi {{Name}}, quick question - before expanding Microsoft 365 Copilot, how are you testing whether Copilot can surface sensitive SharePoint or OneDrive content through oversharing, broad groups, or stale links?

We are building a safe Copilot exposure drill: it simulates realistic exposure paths, shows the exact files/permissions/agents involved, and produces remediation steps for the M365/security team.

Worth comparing notes for 20 minutes?

## CISO email
Subject: Pre-rollout Copilot exposure assessment

Hi {{Name}}, many teams are expanding Microsoft 365 Copilot before they can prove which sensitive data is reachable through existing M365 permissions and agent configurations.

We are building Copilot Exposure Lab: a controlled, metadata-first exposure assessment that shows top Copilot/agent data exposure paths and Microsoft-native remediation steps.

Would a pre-rollout exposure report be useful for your security review?

## Follow-up
One concrete example: a normal employee should not see HR compensation data, but if an HR file has an org-wide link, Copilot can make that exposure easier to discover. We show the path, the fix, and proof after remediation.
