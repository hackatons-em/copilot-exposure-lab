import type { ConnectionMode } from "@cel/types";
import { SystemSeedClient } from "./systems/base.js";
import { generateLargeTenant, type LargeTenantOptions } from "./large-tenant.js";

/**
 * A {@link GraphProvider} over the seeded, deterministic enterprise-scale tenant
 * (~1k users, ~5k resources, ~6k grants). Lets the running app ingest a
 * realistic large tenant so the exposure graph + scoring are demoed at scale.
 * Metadata-only and fully synthetic — see large-tenant.ts.
 */
export class LargeTenantClient extends SystemSeedClient {
  readonly mode: ConnectionMode = "demo-seed";

  constructor(opts: LargeTenantOptions = {}) {
    super(generateLargeTenant(opts));
  }
}
