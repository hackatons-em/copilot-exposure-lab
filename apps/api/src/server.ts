import { buildApp } from "./app.js";
import { MemoryStore } from "./store/memory.js";

/**
 * Dev/standalone entry. Uses the in-memory store and boots a ready-to-demo
 * Acme workspace so the API is usable immediately. The Postgres-backed
 * DrizzleStore is wired in when DATABASE_URL is present (see store/drizzle).
 */
async function main(): Promise<void> {
  const store = new MemoryStore();
  const demo = await store.createWorkspace({ id: "ws-demo", name: "Acme Health Finance Ltd" });
  await store.seedDemo(demo.id);
  await store.runScan(demo.id);

  const app = buildApp({ store, logger: true });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`cel-api listening on :${port} (demo workspace ${demo.id} ready)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
