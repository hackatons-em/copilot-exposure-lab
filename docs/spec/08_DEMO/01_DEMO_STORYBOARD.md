# Demo Storyboard

## Goal
Make a buyer say: "This is the proof we need before expanding Copilot."

## Scene 1 - Pain
A company wants to expand Copilot but has sensitive HR, legal, finance, security, and customer files in Microsoft 365.

## Scene 2 - Run assessment
Open Copilot Exposure Lab. Click Run exposure assessment. Select Normal employee scenario. Scope: SharePoint + OneDrive. Mode: Metadata-only.

## Scene 3 - Findings
Show critical/high findings:
1. Salary file accessible through org-wide link.
2. Customer contract folder exposed to broad Sales group.
3. Board deck inherited broad site permission.
4. Guest retained in confidential project.
5. Helpdesk agent can send sensitive summary externally.

## Scene 4 - Evidence
Open the HR salary finding:
Bob -> Everyone Except External Users -> organization-wide link -> salary file.

## Scene 5 - Remediation
Remove org-wide link, restrict to HR leadership, apply label, rerun.

## Scene 6 - Report
Export executive report.
