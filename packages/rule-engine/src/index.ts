/**
 * @cel/rule-engine — the deterministic core of Copilot Exposure Lab.
 * Severity is computed here, never generated. No LLM imports (enforced by eslint).
 */
export { classifySensitivity } from "./sensitivity/classifier.js";
export type { SensitivitySignal, SensitivityResult } from "./sensitivity/classifier.js";
export { SENSITIVITY_KEYWORDS, SENSITIVE_LABELS } from "./sensitivity/signals.js";

export { buildPermissionGraph, PermissionGraph } from "./graph/permission-graph.js";
export type { EffectiveAccess, Audience } from "./graph/permission-graph.js";

export { fingerprint, hash, findingId, evidenceId, remediationId, pathId } from "./fingerprint.js";
export { clamp01, round, byId, sortBy, sortByDesc, unique } from "./util.js";

export { createRuleContext } from "./context.js";
export type { ContextOptions } from "./context.js";
export { allRules } from "./rules/index.js";
export type { ExposureRule, RuleContext, RuleHit, ScoringInputs, EvidenceInput } from "./rules/types.js";
export { BROAD_GROUP_THRESHOLD, SENSITIVE_THRESHOLD } from "./rules/shared.js";
