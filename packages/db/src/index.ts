/** @cel/db — Postgres schema + Drizzle client for Copilot Exposure Lab. */
export * from "./schema.js";
export { createDb } from "./client.js";
export type { Database } from "./client.js";
export { runMigrations } from "./migrate-fn.js";
