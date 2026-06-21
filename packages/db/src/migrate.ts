import { runMigrations } from "./migrate-fn.js";

/** CLI: apply migrations. Run with DATABASE_URL set. */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  await runMigrations(url);
  console.log("migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
