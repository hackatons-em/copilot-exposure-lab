import type { EvidenceKind, ExposurePath, Resource, SourceObjectType, TenantGraph } from "@cel/types";
import type { PermissionGraph } from "../graph/permission-graph.js";
import type { SensitivityResult } from "../sensitivity/classifier.js";

/**
 * Normalized 0..1 observations a rule emits. The scorer (separate, deterministic)
 * turns these into the 0-100 severity. Rules NEVER assign severity themselves.
 */
export interface ScoringInputs {
  sensitivity: number;
  exposureBreadth: number;
  externalReach: number;
  agentActionRisk: number;
  governanceGap: number;
  businessCriticality: number;
  confidence: number;
}

/** Evidence as emitted by a rule, before ids are assigned by the pipeline. */
export interface EvidenceInput {
  kind: EvidenceKind;
  /** MANDATORY — the concrete object this evidence points at. */
  sourceObjectId: string;
  sourceObjectType: SourceObjectType;
  /** Factual statement, no opinion. */
  statement: string;
  data?: Record<string, unknown>;
}

/** A single rule match: a candidate finding with its evidence and scoring inputs. */
export interface RuleHit {
  ruleId: string;
  title: string;
  resourceId: string;
  /** Actor/principal at the start of the exposure path, if applicable. */
  principalId?: string;
  exposurePath?: ExposurePath;
  evidence: EvidenceInput[];
  scoring: ScoringInputs;
  summary: string;
  businessImpact: string;
}

export interface RuleContext {
  graph: TenantGraph;
  pg: PermissionGraph;
  classify: (r: Resource) => SensitivityResult;
  /** Injected current time (ISO) — deterministic; used for expiry checks. */
  now: string;
  /** Optional scenario persona used to anchor exposure paths. */
  actorId?: string;
}

export interface ExposureRule {
  id: string;
  title: string;
  evaluate(ctx: RuleContext): RuleHit[];
}
