import { createDb, runMigrations } from "@cel/db";
import { buildApp } from "./app.js";
import { parseApiKeys } from "./auth.js";
import { DrizzleStore } from "./store/drizzle.js";
import { MemoryStore } from "./store/memory.js";
import type { Store } from "./store/types.js";

/** Create a ready-to-demo Acme workspace if one doesn't already exist. */
async function bootstrapDemo(store: Store): Promise<void> {
  const existing = await store.getWorkspace("ws-demo");
  if (existing) return;
  await store.createWorkspace({ id: "ws-demo", name: "Acme Health Finance Ltd" });
  await store.seedDemo("ws-demo");
  await store.runScan("ws-demo");
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url && process.env.RUN_MIGRATIONS === "true") {
    await runMigrations(url);
  }
  const store: Store = url ? new DrizzleStore(createDb(url)) : new MemoryStore();
  await bootstrapDemo(store);

  // API-key RBAC is OFF unless CEL_API_KEYS is set (comma-separated key:role
  // pairs, e.g. `k_admin123:admin,k_view456:viewer`). When unset, the API stays
  // open — the deployed demo keeps working with no credential.
  const apiKeys = parseApiKeys(process.env.CEL_API_KEYS);

  const app = buildApp({ store, logger: true, ...(apiKeys ? { apiKeys } : {}) });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
  const authState = apiKeys ? `enforced (${apiKeys.length} key(s))` : "off (open demo)";
  app.log.info(
    `cel-api on :${port} — store=${url ? "postgres" : "memory"}, auth=${authState}, demo workspace ws-demo ready`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
