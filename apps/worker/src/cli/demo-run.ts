import { DrizzleStore } from "@cel/api";
import { createDb } from "@cel/db";

/** Run a scan against the seeded demo workspace and print the findings table. */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const store = new DrizzleStore(createDb(url));
  const id = process.env.DEMO_WORKSPACE_ID ?? "ws-demo";
  if (!(await store.getWorkspace(id))) {
    console.error(`workspace ${id} not found — run seed:demo first`);
    process.exit(1);
  }
  const summary = await store.runScan(id);
  const result = await store.getScanResult(id);
  console.log(`\nScan ${summary.scanRunId} — ${summary.findingCount} findings:\n`);
  for (const f of result?.findings ?? []) {
    console.log(`  ${String(f.risk.total).padStart(3)} ${f.risk.band.padEnd(8)} ${f.ruleId.padEnd(22)} ${f.resourceId}`);
  }
  console.log("\nbands:", summary.bands);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
