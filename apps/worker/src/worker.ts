import { DrizzleStore } from "@cel/api";
import { createDb } from "@cel/db";
import { createBlobUploader } from "./blob.js";
import { drain } from "./poller.js";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const db = createDb(url);
  const store = new DrizzleStore(db);
  const blob = createBlobUploader();
  const intervalMs = Number(process.env.WORKER_POLL_MS ?? 2000);
  console.log(`cel-worker started — polling jobs every ${intervalMs}ms`);

  for (;;) {
    try {
      const n = await drain(db, store, blob);
      if (n > 0) console.log(`processed ${n} job(s)`);
    } catch (err) {
      console.error("poll error:", err);
    }
    await sleep(intervalMs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
