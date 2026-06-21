# Plain-English Explanation

## What is it?

A security testing tool for Microsoft Copilot and Microsoft 365 data.

Companies are adding Microsoft 365 Copilot and Copilot Studio agents. These tools can use data from SharePoint, OneDrive, Teams, Outlook, and connected systems. That is useful, but risky if files are overshared or agents can take unsafe actions.

Copilot Exposure Lab runs a safe "fire drill" before rollout.

## What does it check?

- Can a normal employee surface sensitive HR, legal, finance, customer, or board documents?
- Are sensitive SharePoint or OneDrive files reachable through broad groups or old links?
- Are guests or contractors still able to access confidential project sites?
- Are Copilot Studio-style agents using unsafe actions or broad permissions?
- Can the security team prove a remediation actually fixed the exposure path?

## What does it output?

- A finding.
- Evidence chain.
- Risk score.
- Business impact.
- Exact remediation.
- Exportable report.
- Proof-of-fix after retest.

## What it is not

- Not a chatbot.
- Not a Purview replacement.
- Not a Defender replacement.
- Not a generic dashboard.
- Not a consulting-only business.
- Not full document-content ingestion by default.
