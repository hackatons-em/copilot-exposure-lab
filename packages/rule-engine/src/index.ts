/**
 * @cel/rule-engine — the deterministic core of Copilot Exposure Lab.
 * Severity is computed here, never generated. No LLM imports (enforced by eslint).
 */
export { classifySensitivity } from "./sensitivity/classifier.js";
export type { SensitivitySignal, SensitivityResult } from "./sensitivity/classifier.js";
export { SENSITIVITY_KEYWORDS, SENSITIVE_LABELS } from "./sensitivity/signals.js";

export { buildPermissionGraph, PermissionGraph } from "./graph/permission-graph.js";
export type { EffectiveAccess, Audience } from "./graph/permission-graph.js";

export { buildExposureGraphModel } from "./graph/exposure-graph.js";
export type { ExposureGraphModel, ExposureGraphNode, ExposureGraphEdge } from "./graph/exposure-graph.js";

export { fingerprint, hash, findingId, evidenceId, remediationId, pathId } from "./fingerprint.js";
export { clamp01, round, byId, sortBy, sortByDesc, unique } from "./util.js";

export { createRuleContext } from "./context.js";
export type { ContextOptions } from "./context.js";
export { allRules } from "./rules/index.js";
export type { ExposureRule, RuleContext, RuleHit, ScoringInputs, EvidenceInput } from "./rules/types.js";
export { BROAD_GROUP_THRESHOLD, SENSITIVE_THRESHOLD } from "./rules/shared.js";

export { score } from "./scoring/scorer.js";
export { tenantExposureScore } from "./scoring/tenant-score.js";
export type { TenantExposure } from "./scoring/tenant-score.js";
export { bandFor, bandLabel } from "./scoring/bands.js";
export { WEIGHTS, MAX_SCORE } from "./scoring/weights.js";
export { remediationFor } from "./remediation/catalog.js";
export type { RemediationTemplate } from "./remediation/catalog.js";
export { SCENARIO_LENSES } from "./scenarios/registry.js";

export { scan, runScenario } from "./pipeline.js";
export type { ScanOptions } from "./pipeline.js";

export { simulateRetrieval } from "./retrieval/simulate.js";
export type { RetrievalItem, RetrievalResult, SimulateRetrievalOptions } from "./retrieval/simulate.js";
