import type { EstimatedEffort } from "@cel/types";

export interface RemediationTemplate {
  title: string;
  steps: string[];
  microsoftControl: string;
  estimatedEffort: EstimatedEffort;
  /** V1: the Graph call that would perform the fix. Never auto-executed in MVP. */
  graphActionHint?: string;
}

/** Maps each rule to a concrete, Microsoft-native remediation. */
const CATALOG: Record<string, RemediationTemplate> = {
  "org-wide-link": {
    title: "Remove the organization-wide link and restrict to the intended audience",
    steps: [
      "Delete the organization-wide / 'people in your org' sharing link on the file.",
      "Grant access only to the specific team that needs it (e.g. HR Leadership).",
      "Apply a sensitivity label (e.g. Confidential) to enforce handling downstream.",
      "Set the SharePoint site/library default sharing to 'Specific people'.",
    ],
    microsoftControl: "SharePoint sharing policy + Purview sensitivity label",
    estimatedEffort: "low",
    graphActionHint: "DELETE /drives/{driveId}/items/{itemId}/permissions/{permId}",
  },
  "broad-dept-access": {
    title: "Narrow the broad group grant to the intended audience",
    steps: [
      "Replace the broad department group on the site/library with a scoped security group.",
      "Review and break role inheritance where the broad grant flows down.",
      "Confirm the new audience with the content owner.",
    ],
    microsoftControl: "SharePoint permissions + Entra group membership",
    estimatedEffort: "medium",
    graphActionHint: "DELETE /sites/{siteId}/permissions/{permId}",
  },
  "inherited-broad-read": {
    title: "Break inheritance and remove whole-org read on sensitive content",
    steps: [
      "Stop inheriting permissions on the sensitive library/file.",
      "Remove the 'Everyone except external users' read grant inherited from the site.",
      "Grant access explicitly to the board/executive audience only.",
    ],
    microsoftControl: "SharePoint unique permissions",
    estimatedEffort: "medium",
  },
  "stale-external-access": {
    title: "Revoke the external guest's access and enforce expiration",
    steps: [
      "Remove the guest's access to the site/file.",
      "Review and disable the guest account in Entra ID if the engagement ended.",
      "Enable guest access reviews and link expiration so this can't recur.",
    ],
    microsoftControl: "Entra ID access reviews + SharePoint guest expiration",
    estimatedEffort: "low",
    graphActionHint: "DELETE /sites/{siteId}/permissions/{permId}",
  },
  "missing-label": {
    title: "Apply a sensitivity label to the file",
    steps: [
      "Apply the appropriate Purview sensitivity label (e.g. Confidential).",
      "Enable auto-labeling policies for this content type so new files are covered.",
      "Confirm DLP and Copilot honor the label after it's applied.",
    ],
    microsoftControl: "Microsoft Purview sensitivity labels + auto-labeling",
    estimatedEffort: "low",
  },
  "agent-send-action": {
    title: "Restrict the agent's risky actions and connectors",
    steps: [
      "Remove or gate the agent's send-mail / external connector actions.",
      "Require approval / DLP policy for outbound actions from agents.",
      "Scope the agent's data access to only what it needs.",
    ],
    microsoftControl: "Copilot Studio governance + Power Platform DLP policy",
    estimatedEffort: "medium",
  },
  "orphaned-agent-owner": {
    title: "Reassign or retire the orphaned agent",
    steps: [
      "Reassign ownership to an active, accountable maker or team.",
      "Review the agent's actions and permissions, or retire it if unused.",
      "Add the environment to managed publication with owner reviews.",
    ],
    microsoftControl: "Power Platform managed environments + ownership review",
    estimatedEffort: "low",
  },
};

const DEFAULT: RemediationTemplate = {
  title: "Review and remediate the exposure",
  steps: ["Review the evidence chain.", "Remove unnecessary access.", "Apply the appropriate Microsoft control."],
  microsoftControl: "Microsoft 365 admin controls",
  estimatedEffort: "medium",
};

export function remediationFor(ruleId: string): RemediationTemplate {
  return CATALOG[ruleId] ?? DEFAULT;
}
