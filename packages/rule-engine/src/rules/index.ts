import { agentSendActionRule } from "./agent-send-action.js";
import { broadDeptAccessRule } from "./broad-dept-access.js";
import { connectorRiskRule } from "./connector-risk.js";
import { inheritedBroadReadRule } from "./inherited-broad-read.js";
import { missingLabelRule } from "./missing-label.js";
import { orgWideLinkRule } from "./org-wide-link.js";
import { orphanedAgentOwnerRule } from "./orphaned-agent-owner.js";
import { staleExternalAccessRule } from "./stale-external-access.js";
import type { ExposureRule } from "./types.js";

/** The deterministic exposure rule registry, in stable order. */
export const allRules: readonly ExposureRule[] = [
  orgWideLinkRule,
  broadDeptAccessRule,
  inheritedBroadReadRule,
  staleExternalAccessRule,
  missingLabelRule,
  agentSendActionRule,
  orphanedAgentOwnerRule,
  connectorRiskRule,
];

export {
  orgWideLinkRule,
  broadDeptAccessRule,
  inheritedBroadReadRule,
  staleExternalAccessRule,
  missingLabelRule,
  agentSendActionRule,
  orphanedAgentOwnerRule,
  connectorRiskRule,
};
export type { ExposureRule, RuleContext, RuleHit, ScoringInputs, EvidenceInput } from "./types.js";
