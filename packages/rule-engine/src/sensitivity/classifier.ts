import type { Resource } from "@cel/types";
import { clamp01 } from "../util.js";
import { SENSITIVE_LABELS, SENSITIVITY_KEYWORDS } from "./signals.js";

export interface SensitivitySignal {
  /** The matched term, e.g. "salary". */
  signal: string;
  weight: number;
  /** Where it matched: "name" | "path" | "label" | "tag". */
  matchedIn: string;
  /** The resource this signal describes (every signal is traceable). */
  sourceObjectId: string;
}

export interface SensitivityResult {
  signals: SensitivitySignal[];
  /** 0..1 — the sensitivity component input for the scorer. */
  rawScore: number;
}

function tokenize(text: string): string {
  // Lowercase; split CamelCase, underscores, and non-alphanumerics into spaces.
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase();
}

/**
 * Deterministically classify how sensitive a resource is from its metadata
 * (name, path, label, tags). No content is read. The raw score is the strongest
 * matched signal plus a small bonus for breadth of distinct matches, capped at 1.
 */
export function classifySensitivity(resource: Resource): SensitivityResult {
  const signals: SensitivitySignal[] = [];
  const haystacks: { text: string; where: string }[] = [
    { text: tokenize(resource.name), where: "name" },
    { text: tokenize(resource.path ?? ""), where: "path" },
  ];
  for (const tag of resource.sensitivityTags) {
    haystacks.push({ text: tokenize(tag), where: "tag" });
  }

  const seen = new Set<string>();
  for (const kw of SENSITIVITY_KEYWORDS) {
    for (const h of haystacks) {
      const found = ` ${h.text} `.includes(` ${kw.term} `);
      if (found && !seen.has(kw.term + h.where)) {
        seen.add(kw.term + h.where);
        signals.push({ signal: kw.term, weight: kw.weight, matchedIn: h.where, sourceObjectId: resource.id });
        break; // one signal per keyword (record the first place it matched)
      }
    }
  }

  // A present sensitivity label can itself raise sensitivity.
  if (resource.sensitivityLabel) {
    const label = resource.sensitivityLabel.toLowerCase();
    for (const l of SENSITIVE_LABELS) {
      if (label.includes(l.match)) {
        signals.push({ signal: `label:${resource.sensitivityLabel}`, weight: l.weight, matchedIn: "label", sourceObjectId: resource.id });
        break;
      }
    }
  }

  const distinctTerms = new Set(signals.map((s) => s.signal));
  const maxWeight = signals.reduce((m, s) => Math.max(m, s.weight), 0);
  const rawScore = clamp01(maxWeight + 0.05 * Math.max(0, distinctTerms.size - 1));

  return { signals, rawScore };
}
