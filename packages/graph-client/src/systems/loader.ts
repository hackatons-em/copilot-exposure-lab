import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTenantGraph, type TenantGraph } from "@cel/types";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the directory of a bundled system seed (repo `seed/<system>`),
 * relative to this module — mirrors `DEFAULT_SEED_DIR` in seed-graph-client.
 */
export function systemSeedDir(system: string): string {
  // src/systems/ -> up 4 -> repo root, then seed/<system>.
  return resolve(HERE, "../../../../seed", system);
}

/**
 * Read a single-file system seed (`graph.json`) from `seedDir`, parse it, and
 * validate against `@cel/types`. Throws (with a zod path) on any invariant
 * violation — same contract as `loadSeedGraph`, just one JSON file per system.
 */
export function loadSystemGraph(seedDir: string): TenantGraph {
  const raw: unknown = JSON.parse(readFileSync(resolve(seedDir, "graph.json"), "utf8"));
  return parseTenantGraph(raw);
}
