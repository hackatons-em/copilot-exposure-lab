import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Apply all pending migrations from ./drizzle. Run with DATABASE_URL set. */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = resolve(here, "../drizzle");
  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder });
  await client.end();
  console.log("migrations applied from", migrationsFolder);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
