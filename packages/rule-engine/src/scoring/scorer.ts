import type { RiskScore, ScoreComponent, ScoreComponentKey } from "@cel/types";
import type { ScoringInputs } from "../rules/types.js";
import { clamp01, round } from "../util.js";
import { bandFor } from "./bands.js";
import { MAX_SCORE, WEIGHTS } from "./weights.js";

const COMPONENT_KEYS = Object.keys(WEIGHTS) as ScoreComponentKey[];

/**
 * The deterministic gate. Turns a rule's normalized 0..1 observations into a
 * 0-100 score and a severity band. This is the ONLY place severity is decided —
 * no LLM, no randomness, no time. Same inputs always yield the same score.
 */
export function score(inputs: ScoringInputs): RiskScore {
  const components: ScoreComponent[] = COMPONENT_KEYS.map((key) => {
    const raw = clamp01(inputs[key]);
    const weight = WEIGHTS[key];
    return { key, weight, raw, points: round(weight * raw) };
  });
  const total = Math.min(MAX_SCORE, components.reduce((sum, c) => sum + c.points, 0));
  return { total, band: bandFor(total), components };
}
