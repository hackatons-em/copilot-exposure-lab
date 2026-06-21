import { loadSeedGraph } from "@cel/graph-client";
import { scan } from "@cel/rule-engine";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateLlmSummary } from "./llm.js";
import { buildReportModel } from "./model.js";
import { renderMarkdown } from "./markdown.js";

const graph = loadSeedGraph();
const scanResult = scan(graph, { now: "2026-06-21T00:00:00.000Z" });
const model = buildReportModel({ workspace: graph.workspace, scanResult, scenarios: graph.scenarios });

describe("generateLlmSummary (env-gated, deterministic by default)", () => {
  const original = { enable: process.env.CEL_ENABLE_LLM, key: process.env.ANTHROPIC_API_KEY };

  beforeEach(() => {
    delete process.env.CEL_ENABLE_LLM;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (original.enable === undefined) delete process.env.CEL_ENABLE_LLM;
    else process.env.CEL_ENABLE_LLM = original.enable;
    if (original.key === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = original.key;
  });

  it("returns undefined when the feature flag is unset", async () => {
    await expect(generateLlmSummary(model)).resolves.toBeUndefined();
  });

  it("returns undefined when enabled but the API key is missing", async () => {
    process.env.CEL_ENABLE_LLM = "true";
    await expect(generateLlmSummary(model)).resolves.toBeUndefined();
  });
});

describe("renderMarkdown with an llmSummary", () => {
  it("renders a clearly-labeled AI narrative callout including the text", () => {
    const summary = "Acme faces one critical and four high exposure findings requiring prompt remediation.";
    const md = renderMarkdown({ ...model, llmSummary: summary });
    expect(md).toContain("AI narrative summary");
    expect(md).toContain("AI-generated narrative — does not affect scoring or findings.");
    expect(md).toContain(summary);
  });

  it("renders nothing extra when llmSummary is unset (default output unchanged)", () => {
    const md = renderMarkdown(model);
    expect(md).not.toContain("AI narrative summary");
    expect(md).not.toContain("AI-generated narrative");
  });
});
