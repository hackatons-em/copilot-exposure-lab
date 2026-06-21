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

// Multi-system, metadata-only providers (Google Workspace, Slack, Salesforce) —
// each normalizes its world into the same TenantGraph the rule engine consumes.
export { SystemSeedClient, tagSystem } from "./systems/base.js";
export { loadSystemGraph, systemSeedDir } from "./systems/loader.js";
export { GoogleWorkspaceClient, loadGoogleWorkspaceGraph, GOOGLE_WORKSPACE_SEED_DIR } from "./systems/google-workspace-client.js";
export { SlackClient, loadSlackGraph, SLACK_SEED_DIR } from "./systems/slack-client.js";
export { SalesforceClient, loadSalesforceGraph, SALESFORCE_SEED_DIR } from "./systems/salesforce-client.js";
export { MultiSystemClient, loadMultiSystemGraph, mergeSystemGraphs } from "./systems/multi-system-client.js";
