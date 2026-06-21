import type { ReportModel } from "./model.js";

/**
 * The model is the single source of truth — the LLM may only re-narrate it.
 * Severity, counts, and findings are computed deterministically by the rule
 * engine; this summary never decides or invents any of them.
 */
const SYSTEM_PROMPT =
  "You are summarizing an ALREADY-COMPUTED security report. Do NOT invent findings, numbers, or severities. " +
  "Write a 3-4 sentence executive summary for a CISO using only the provided counts and titles.";

/**
 * Generate an optional, clearly-flagged executive narrative for a report.
 *
 * Returns `undefined` unless BOTH `CEL_ENABLE_LLM === "true"` and
 * `ANTHROPIC_API_KEY` are set, so the default path (and all tests) stay fully
 * deterministic. The AI SDK is loaded lazily (dynamic import) so the deterministic
 * path never even imports it. Any error is swallowed and yields `undefined` —
 * never throws.
 */
export async function generateLlmSummary(model: ReportModel): Promise<string | undefined> {
  if (process.env.CEL_ENABLE_LLM !== "true" || !process.env.ANTHROPIC_API_KEY) {
    return undefined;
  }
  try {
    const { generateText } = await import("ai");
    const { anthropic } = await import("@ai-sdk/anthropic");
    // Pass ONLY the computed counts/total + the titles of critical/high findings.
    const payload = {
      total: model.total,
      bandCounts: model.bandCounts,
      criticalAndHigh: model.criticalAndHigh.map((f) => f.finding.title),
    };
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      prompt: `Report data (already computed, do not change):\n${JSON.stringify(payload, null, 2)}`,
    });
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
