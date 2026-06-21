/**
 * @cel/graph-client — source-of-metadata abstraction for Copilot Exposure Lab.
 */
export type { GraphProvider } from "./provider.js";
export { SeedGraphClient, loadSeedGraph, DEFAULT_SEED_DIR } from "./seed-graph-client.js";

// Live Microsoft Graph provider (metadata-only, least-privilege, throttled).
export { MsGraphClient, DEFAULT_SCENARIOS } from "./graph/ms-graph-client.js";
export type { MsGraphClientOptions, Checkpoint } from "./graph/ms-graph-client.js";
export { createGraphRequester, withRetry, GraphError } from "./graph/requester.js";
export type { GraphRequester, GraphConfig, GraphPage, RetryOptions } from "./graph/requester.js";
