import type { TenantGraph } from "@cel/types";
import { simulateRetrieval } from "./simulate.js";

export interface CopilotCitation {
  resourceId: string;
  name: string;
  via: string;
  sensitivity: number;
}

export interface CopilotAnswer {
  actorId: string;
  actorName: string;
  prompt: string;
  /** Deterministic, factual narration — never invents content. */
  answer: string;
  citations: CopilotCitation[];
  /** True when the prompt would have Copilot ground on exposed sensitive data. */
  exposed: boolean;
}

const STOPWORDS = new Set([
  "the", "our", "what", "show", "me", "is", "in", "of", "for", "and", "to", "a", "an", "any", "about",
  "summarize", "summary", "give", "list", "tell", "find", "get", "can", "you", "please", "this", "that",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/**
 * Simulate what Microsoft 365 Copilot, grounded on what an actor can access,
 * would surface for a prompt — the visceral proof that "reachable" means
 * "Copilot will say it". Deterministic: ranks the actor's reachable sensitive
 * resources by keyword overlap with the prompt + sensitivity, and cites them.
 * No LLM, no invented content (this lives in the deterministic engine).
 */
export function simulateCopilotAnswer(
  graph: TenantGraph,
  opts: { actorId: string; prompt: string; limit?: number },
): CopilotAnswer {
  const limit = opts.limit ?? 3;
  const retrieval = simulateRetrieval(graph, { actorId: opts.actorId, limit: 50 });
  const promptTokens = new Set(tokenize(opts.prompt));

  const ranked = retrieval.items
    .map((item) => {
      const itemTokens = tokenize(`${item.name} ${item.topSignals.join(" ")}`);
      const overlap = itemTokens.filter((t) => promptTokens.has(t)).length;
      return { item, overlap, rank: overlap * 2 + item.sensitivity };
    })
    .sort((a, b) => b.rank - a.rank || (a.item.resourceId < b.item.resourceId ? -1 : 1));

  const matched = ranked.filter((r) => r.overlap > 0);
  const chosen = (matched.length > 0 ? matched : ranked).slice(0, matched.length > 0 ? limit : 2);
  const citations: CopilotCitation[] = chosen.map(({ item }) => ({
    resourceId: item.resourceId,
    name: item.name,
    via: item.via,
    sensitivity: item.sensitivity,
  }));

  const exposed = citations.length > 0;
  const answer = exposed
    ? `Grounded on what ${retrieval.actorName} can access, Copilot would draw on ${citations.length} sensitive document(s): ` +
      `${citations.map((c) => `"${c.name}"`).join(", ")}. ⚠ Each is reachable by ${retrieval.actorName} (e.g. via ${citations[0]!.via}) — ` +
      `so Copilot would surface its contents to them.`
    : `${retrieval.actorName} cannot reach any sensitive documents matching that prompt — Copilot would surface nothing exposed.`;

  return { actorId: opts.actorId, actorName: retrieval.actorName, prompt: opts.prompt, answer, citations, exposed };
}
