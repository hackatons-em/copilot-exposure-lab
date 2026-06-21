import type { ScoreComponentKey } from "@cel/types";

/**
 * Deterministic risk weights (max points per component), from
 * docs/spec/02_PRODUCT/07_RISK_SCORING_MODEL.md. They sum to 100.
 *
 * Note on `agentActionRisk`: read as "AI/agent surfacing-and-action risk" — the
 * core product thesis is that Copilot and agents make existing exposure easier
 * to discover or act on. So this component applies to permission findings too
 * (how readily Copilot can surface the exposed resource), not only to agents.
 */
export const WEIGHTS: Record<ScoreComponentKey, number> = {
  sensitivity: 25,
  exposureBreadth: 20,
  externalReach: 15,
  agentActionRisk: 15,
  governanceGap: 10,
  businessCriticality: 10,
  confidence: 5,
};

export const MAX_SCORE = 100;
