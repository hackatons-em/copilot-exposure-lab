import type { EvidenceItem, Finding } from "@cel/types";
import type { RemediationTemplate } from "./catalog.js";

/**
 * Generates the EXACT, copy-pasteable Microsoft remediation for a finding, wired
 * to the finding's real source-object ids. Deterministic per (rule, ids) — no LLM,
 * no randomness, no wall-clock.
 *
 * NON-NEGOTIABLE: this is advisory output. It is never executed by the product
 * (the engine is read-only / least-privilege). Placeholders the engine cannot know
 * from metadata (drive id, label GUID, new owner) are written as <ANGLE_BRACKETS>
 * for a human to fill before running.
 */
export interface FixScript {
  language: "powershell";
  /** The Microsoft tooling the script uses. */
  tooling: string;
  /** The copy-pasteable script body. */
  script: string;
  /** Honest caveats shown alongside the script. */
  caveats: string[];
}

/** First evidence source id of a given object type, if present. */
function idOf(evidence: EvidenceItem[], type: string): string | undefined {
  return evidence.find((e) => e.sourceObjectType === type)?.sourceObjectId;
}

const REVIEW_CAVEAT = "Advisory only — review every line before running. The product never executes this for you.";
const PLACEHOLDER_CAVEAT = "Values in <ANGLE_BRACKETS> aren't knowable from metadata — fill them in before running.";
const SCOPE_CAVEAT = "Run as an account with the least privilege needed for this change, and confirm the blast radius first.";

function header(finding: Finding, tooling: string): string[] {
  return [
    "# ============================================================",
    "#  Copilot Exposure Lab — generated remediation (ADVISORY)",
    `#  Finding : ${finding.id}`,
    `#  Title   : ${finding.title}`,
    `#  Rule    : ${finding.ruleId}`,
    `#  Tooling : ${tooling}`,
    "#  REVIEW BEFORE RUNNING — this script is NOT auto-executed.",
    "# ============================================================",
    "",
  ];
}

interface Body {
  tooling: string;
  lines: string[];
  caveats?: string[];
}

/** Per-rule script body, wired to the finding's ids. */
function bodyFor(finding: Finding, evidence: EvidenceItem[]): Body {
  const resourceId = finding.resourceId;

  switch (finding.ruleId) {
    case "org-wide-link": {
      const linkId = idOf(evidence, "link") ?? idOf(evidence, "permission") ?? "<permissionId>";
      return {
        tooling: "Microsoft Graph PowerShell",
        lines: [
          "Connect-MgGraph -Scopes 'Files.ReadWrite.All','Sites.ReadWrite.All'",
          "",
          "# Remove the organization-wide sharing link exposing this file.",
          "$driveId = '<driveId>'   # the drive that holds the item below",
          `$itemId  = '${resourceId}'`,
          `$permId  = '${linkId}'`,
          "Remove-MgDriveItemPermission -DriveId $driveId -DriveItemId $itemId -PermissionId $permId -Confirm:$false",
          "",
          "# Verify the link is gone:",
          "Get-MgDriveItemPermission -DriveId $driveId -DriveItemId $itemId | Format-Table Id, Link",
        ],
        caveats: [PLACEHOLDER_CAVEAT],
      };
    }

    case "broad-dept-access": {
      const groupId = idOf(evidence, "group") ?? "<groupId>";
      const permId = idOf(evidence, "permission") ?? "<permissionId>";
      return {
        tooling: "Microsoft Graph PowerShell",
        lines: [
          "Connect-MgGraph -Scopes 'Files.ReadWrite.All','Sites.ReadWrite.All'",
          "",
          "# Revoke the broad department group's direct grant on this sensitive item,",
          "# then re-share to the specific people who actually need it.",
          "$driveId = '<driveId>'",
          `$itemId  = '${resourceId}'`,
          `$permId  = '${permId}'   # grant to group ${groupId}`,
          "Remove-MgDriveItemPermission -DriveId $driveId -DriveItemId $itemId -PermissionId $permId -Confirm:$false",
        ],
        caveats: [PLACEHOLDER_CAVEAT],
      };
    }

    case "inherited-broad-read": {
      const siteId = idOf(evidence, "site") ?? "<siteUrl>";
      return {
        tooling: "PnP PowerShell",
        lines: [
          "Connect-PnPOnline -Url '<siteUrl>' -Interactive",
          "",
          "# This sensitive content inherits a whole-organization read grant from its site.",
          "# Break role inheritance on the library/item and remove the 'Everyone except",
          "# external users' claim so access is scoped deliberately.",
          `# Site exposing the inherited grant: ${siteId}`,
          "$list = Get-PnPList -Identity '<libraryName>'",
          "Set-PnPList -Identity $list -BreakRoleInheritance -CopyRoleAssignments",
          "$everyone = Get-PnPUser | Where-Object { $_.Title -like 'Everyone except external*' }",
          "if ($everyone) { Set-PnPListPermission -Identity $list -User $everyone.LoginName -RemoveRole 'Read' }",
        ],
        caveats: [PLACEHOLDER_CAVEAT],
      };
    }

    case "stale-external-access": {
      const guestId = idOf(evidence, "user") ?? "<guestUserId>";
      const permId = idOf(evidence, "permission") ?? "<permissionId>";
      return {
        tooling: "Microsoft Graph PowerShell",
        lines: [
          "Connect-MgGraph -Scopes 'Sites.ReadWrite.All','User.ReadWrite.All'",
          "",
          "# Remove the expired guest's access, then disable the dormant guest account.",
          "$driveId = '<driveId>'",
          `$itemId  = '${resourceId}'`,
          `$permId  = '${permId}'`,
          `$guestId = '${guestId}'`,
          "Remove-MgDriveItemPermission -DriveId $driveId -DriveItemId $itemId -PermissionId $permId -Confirm:$false",
          "Update-MgUser -UserId $guestId -AccountEnabled:$false",
        ],
        caveats: [PLACEHOLDER_CAVEAT, SCOPE_CAVEAT],
      };
    }

    case "missing-label": {
      return {
        tooling: "PnP PowerShell",
        lines: [
          "Connect-PnPOnline -Url '<siteUrl>' -Interactive",
          "",
          "# Apply the appropriate Purview sensitivity label to this unlabeled sensitive file.",
          `$fileUrl = '<serverRelativeUrlFor:${resourceId}>'`,
          "$labelId = '<sensitivityLabelGuid>'   # e.g. the 'Confidential' label id from Purview",
          "Set-PnPFileSensitivityLabel -Url $fileUrl -SensitivityLabelId $labelId",
        ],
        caveats: [PLACEHOLDER_CAVEAT],
      };
    }

    case "agent-send-action": {
      const agentId = idOf(evidence, "agent") ?? resourceId;
      return {
        tooling: "Power Platform admin PowerShell",
        lines: [
          "Add-PowerAppsAccount",
          "",
          "# Constrain this agent's high-impact actions (e.g. mail.send) with a DLP policy",
          "# that blocks the risky connectors in its environment.",
          "$env = '<environmentName>'",
          `# Agent (Copilot Studio bot) under review: ${agentId}`,
          "New-AdminDlpPolicy -DisplayName 'CEL — restrict agent egress' -EnvironmentName $env",
          "# Then move Office 365 Outlook / HTTP connectors into the 'Blocked' group:",
          "# Set-AdminDlpPolicyConnectorGroup -PolicyName <policyId> -ConnectorGroup Blocked -Connectors @('shared_office365','shared_webcontents')",
        ],
        caveats: [PLACEHOLDER_CAVEAT, SCOPE_CAVEAT],
      };
    }

    case "orphaned-agent-owner": {
      const agentId = idOf(evidence, "agent") ?? resourceId;
      const ownerId = idOf(evidence, "user") ?? "<departedOwnerId>";
      return {
        tooling: "Power Platform admin PowerShell",
        lines: [
          "Add-PowerAppsAccount",
          "",
          "# Reassign this agent from its departed owner to an active, accountable owner.",
          "$env = '<environmentName>'",
          `$app = '${agentId}'`,
          `# Current (departed) owner: ${ownerId}`,
          "$newOwner = '<newOwnerAadObjectId>'",
          "Set-AdminPowerAppOwner -AppName $app -AppOwner $newOwner -EnvironmentName $env",
        ],
        caveats: [PLACEHOLDER_CAVEAT],
      };
    }

    case "risky-connector": {
      const connector = idOf(evidence, "connector") ?? "<connectorName>";
      return {
        tooling: "Power Platform admin PowerShell",
        lines: [
          "Add-PowerAppsAccount",
          "",
          "# Block the risky connector this agent uses via a Data Loss Prevention policy.",
          "$env = '<environmentName>'",
          `# Connector flagged: ${connector}  (agent: ${resourceId})`,
          "New-AdminDlpPolicy -DisplayName 'CEL — block risky connector' -EnvironmentName $env",
          "# Set-AdminDlpPolicyConnectorGroup -PolicyName <policyId> -ConnectorGroup Blocked -Connectors @('<connectorId>')",
        ],
        caveats: [PLACEHOLDER_CAVEAT, SCOPE_CAVEAT],
      };
    }

    default:
      return {
        tooling: "Microsoft 365 admin",
        lines: [
          "# No scripted remediation template for this rule yet.",
          `# Resource under review: ${resourceId}`,
          "# Follow the remediation steps on this finding manually.",
        ],
      };
  }
}

/**
 * Build the advisory fix script for a finding. `remediation` is accepted for
 * context (its steps may inform the human reviewer) but never affects the cmdlets.
 */
export function generateFixScript(
  finding: Finding,
  evidence: EvidenceItem[],
  remediation?: RemediationTemplate,
): FixScript {
  const body = bodyFor(finding, evidence);
  const lines = [...header(finding, body.tooling), ...body.lines];
  if (remediation?.microsoftControl) {
    lines.push("", `# Microsoft control: ${remediation.microsoftControl}`);
  }
  return {
    language: "powershell",
    tooling: body.tooling,
    script: lines.join("\n"),
    caveats: [REVIEW_CAVEAT, ...(body.caveats ?? [])],
  };
}
