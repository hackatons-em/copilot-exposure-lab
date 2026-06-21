import type { ConnectionMode, TenantGraph } from "@cel/types";
import { SystemSeedClient, tagSystem } from "./base.js";
import { loadSystemGraph, systemSeedDir } from "./loader.js";

/** Default location of the bundled Slack seed (`seed/slack`). */
export const SLACK_SEED_DIR = systemSeedDir("slack");

/** Load + validate the Slack seed, tagged `system:slack`. */
export function loadSlackGraph(seedDir: string = SLACK_SEED_DIR): TenantGraph {
  return tagSystem(loadSystemGraph(seedDir), "slack");
}

/**
 * Metadata-only Slack provider. Normalizes channels (as sites), shared files,
 * channel membership (as groups), and Slack Connect external users into the
 * standard {@link TenantGraph} so the unchanged exposure rules fire over Slack
 * sharing exactly as for M365.
 */
export class SlackClient extends SystemSeedClient {
  readonly mode: ConnectionMode = "slack";

  constructor(graph: TenantGraph = loadSlackGraph()) {
    super(graph);
  }
}
