import type { TenantGraph } from "@cel/types";
import { buildPermissionGraph } from "./graph/permission-graph.js";
import type { RuleContext } from "./rules/types.js";
import { classifySensitivity } from "./sensitivity/classifier.js";

export interface ContextOptions {
  /** Injected current time (ISO). Defaults to now; pass a fixed value for determinism. */
  now?: string;
  /** Scenario persona used to anchor exposure paths. */
  actorId?: string;
}

/** Assemble the shared, deterministic context the rules evaluate against. */
export function createRuleContext(graph: TenantGraph, opts: ContextOptions = {}): RuleContext {
  return {
    graph,
    pg: buildPermissionGraph(graph),
    classify: classifySensitivity,
    now: opts.now ?? new Date().toISOString(),
    actorId: opts.actorId,
  };
}
