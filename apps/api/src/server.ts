import { createDb } from "@cel/db";
import { buildApp } from "./app.js";
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
  const store: Store = url ? new DrizzleStore(createDb(url)) : new MemoryStore();
  await bootstrapDemo(store);

  const app = buildApp({ store, logger: true });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`cel-api on :${port} — store=${url ? "postgres" : "memory"}, demo workspace ws-demo ready`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
