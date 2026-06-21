import type { Band, EvidenceItem, Finding, RemediationTask, ScanResult, ScenarioRun, TenantGraph } from "@cel/types";
import { createRuleContext } from "./context.js";
import { evidenceId, fingerprint, findingId, remediationId } from "./fingerprint.js";
import { remediationFor } from "./remediation/catalog.js";
import { threatFor } from "./threat/catalog.js";
import { allRules } from "./rules/index.js";
import type { RuleHit } from "./rules/types.js";
import { SCENARIO_LENSES } from "./scenarios/registry.js";
import { score } from "./scoring/scorer.js";
import { sortByDesc } from "./util.js";

export interface ScanOptions {
  /** Injected current time (ISO). Pass a fixed value for deterministic output. */
  now?: string;
  /** Persona used to anchor canonical exposure paths. Defaults to the normal-employee actor. */
  actorId?: string;
  /** Finding ids that have been remediated — marked resolved (proof-of-fix rerun). */
  appliedFixes?: string[];
}

const BAND_ORDER: Band[] = ["critical", "high", "medium", "low", "info"];

function chainKey(hit: RuleHit): string {
  if (hit.exposurePath) return hit.exposurePath.steps.map((s) => s.objectId).join(">");
  return `${hit.principalId ?? ""}>${hit.resourceId}`;
}

function countBands(findings: Finding[]): string {
  const counts = new Map<Band, number>();
  for (const f of findings) counts.set(f.risk.band, (counts.get(f.risk.band) ?? 0) + 1);
  const parts = BAND_ORDER.filter((b) => counts.get(b)).map((b) => `${counts.get(b)} ${b}`);
  return parts.join(", ") || "no findings";
}

/**
 * Run all rules over a tenant graph and produce findings, evidence, remediation,
 * and per-scenario runs. Fully deterministic given a fixed `now`.
 */
export function scan(graph: TenantGraph, opts: ScanOptions = {}): ScanResult {
  const now = opts.now ?? new Date().toISOString();
  const defaultActor = graph.scenarios.find((s) => s.key === "normal-employee")?.actorPrincipalId;
  const actorId = opts.actorId ?? defaultActor;
  const applied = new Set(opts.appliedFixes ?? []);
  const ctx = createRuleContext(graph, { now, actorId });

  // 1. Evaluate rules, dedupe by stable (rule, chain) key.
  const hitsByKey = new Map<string, RuleHit>();
  for (const rule of allRules) {
    for (const hit of rule.evaluate(ctx)) {
      const key = `${hit.ruleId}|${chainKey(hit)}`;
      if (!hitsByKey.has(key)) hitsByKey.set(key, hit);
    }
  }

  // 2. Materialize findings, evidence, remediation.
  const findings: Finding[] = [];
  const evidence: EvidenceItem[] = [];
  const remediationTasks: RemediationTask[] = [];

  for (const hit of hitsByKey.values()) {
    const fId = findingId(hit.ruleId, hit.resourceId, chainKey(hit));
    const resolved = applied.has(fId);
    const risk = score(hit.scoring);

    const evidenceIds: string[] = [];
    hit.evidence.forEach((e, idx) => {
      const eId = evidenceId(fId, e.kind, e.sourceObjectId, idx);
      evidence.push({
        id: eId,
        findingId: fId,
        kind: e.kind,
        sourceObjectId: e.sourceObjectId,
        sourceObjectType: e.sourceObjectType,
        statement: e.statement,
        data: e.data,
        observedAt: now,
      });
      evidenceIds.push(eId);
    });

    const tpl = remediationFor(hit.ruleId);
    const remId = remediationId(fId);
    remediationTasks.push({
      id: remId,
      findingId: fId,
      title: tpl.title,
      steps: tpl.steps,
      microsoftControl: tpl.microsoftControl,
      graphActionHint: tpl.graphActionHint,
      estimatedEffort: tpl.estimatedEffort,
      status: resolved ? "done" : "todo",
      fixVerified: resolved ? true : undefined,
    });

    findings.push({
      id: fId,
      ruleId: hit.ruleId,
      title: hit.title,
      resourceId: hit.resourceId,
      principalId: hit.principalId,
      risk,
      threat: threatFor(hit.ruleId),
      exposurePath: hit.exposurePath,
      evidenceIds,
      remediationTaskId: remId,
      scenarioIds: [],
      status: resolved ? "resolved" : "open",
      summary: hit.summary,
      businessImpact: hit.businessImpact,
      createdAt: now,
    });
  }

  // Invariants (non-negotiable): evidence has a source object; findings have evidence + remediation.
  for (const e of evidence) {
    if (!e.sourceObjectId) throw new Error(`Evidence ${e.id} is missing a sourceObjectId`);
  }
  for (const f of findings) {
    if (f.evidenceIds.length === 0) throw new Error(`Finding ${f.id} has no evidence`);
    if (!f.remediationTaskId) throw new Error(`Finding ${f.id} has no remediation`);
  }

  // 3. Scenario runs (lenses select relevant findings).
  const scenarioRuns: ScenarioRun[] = [];
  for (const scenario of graph.scenarios) {
    const lens = SCENARIO_LENSES[scenario.key];
    const matched = sortByDesc(
      findings.filter((f) => lens(f, { pg: ctx.pg, classify: ctx.classify, scenario })),
      (f) => f.risk.total,
      (f) => f.id,
    );
    for (const f of matched) {
      if (!f.scenarioIds.includes(scenario.id)) f.scenarioIds.push(scenario.id);
    }
    const paths = matched.map((f) => f.exposurePath).filter((p): p is NonNullable<typeof p> => Boolean(p));
    scenarioRuns.push({
      id: `run-${fingerprint(scenario.id)}`,
      scenarioId: scenario.id,
      runAt: now,
      paths,
      findingIds: matched.map((f) => f.id),
      summary: `${scenario.title}: ${matched.length} finding(s) — ${countBands(matched)}.`,
    });
  }

  return {
    findings: sortByDesc(findings, (f) => f.risk.total, (f) => f.id),
    evidence,
    remediationTasks,
    scenarioRuns,
    generatedAt: now,
  };
}

/** Run a single scenario and return only its findings/evidence/remediation. */
export function runScenario(graph: TenantGraph, scenarioIdOrKey: string, opts: ScanOptions = {}): ScanResult {
  const scenario = graph.scenarios.find((s) => s.id === scenarioIdOrKey || s.key === scenarioIdOrKey);
  const result = scan(graph, { ...opts, actorId: scenario?.actorPrincipalId ?? opts.actorId });
  if (!scenario) return result;
  const run = result.scenarioRuns.find((r) => r.scenarioId === scenario.id);
  const ids = new Set(run?.findingIds ?? []);
  const findings = result.findings.filter((f) => ids.has(f.id));
  return {
    findings,
    evidence: result.evidence.filter((e) => ids.has(e.findingId)),
    remediationTasks: result.remediationTasks.filter((t) => ids.has(t.findingId)),
    scenarioRuns: run ? [run] : [],
    generatedAt: result.generatedAt,
  };
}
