import type { ConnectionMode, TenantGraph } from "@cel/types";
import { SystemSeedClient, tagSystem } from "./base.js";
import { loadSystemGraph, systemSeedDir } from "./loader.js";

/** Default location of the bundled Google Workspace seed (`seed/google-workspace`). */
export const GOOGLE_WORKSPACE_SEED_DIR = systemSeedDir("google-workspace");

/** Load + validate the Google Workspace seed, tagged `system:google`. */
export function loadGoogleWorkspaceGraph(seedDir: string = GOOGLE_WORKSPACE_SEED_DIR): TenantGraph {
  return tagSystem(loadSystemGraph(seedDir), "google");
}

/**
 * Metadata-only Google Workspace provider. Normalizes Shared Drives, files,
 * Google Groups, and external collaborators into the standard {@link TenantGraph}
 * so the unchanged exposure rules fire over Drive sharing exactly as for M365.
 */
export class GoogleWorkspaceClient extends SystemSeedClient {
  readonly mode: ConnectionMode = "google-workspace";

  constructor(graph: TenantGraph = loadGoogleWorkspaceGraph()) {
    super(graph);
  }
}
