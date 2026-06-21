import { DrizzleStore } from "@cel/api";
import { createDb } from "@cel/db";

/** Seed the Acme demo company into the database (idempotent on ws-demo). */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const store = new DrizzleStore(createDb(url));
  const id = process.env.DEMO_WORKSPACE_ID ?? "ws-demo";
  if (!(await store.getWorkspace(id))) {
    await store.createWorkspace({ id, name: "Acme Health Finance Ltd" });
  }
  const result = await store.seedDemo(id);
  console.log(`seeded demo into ${id}:`, result.counts);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
