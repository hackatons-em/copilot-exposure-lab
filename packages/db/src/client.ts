import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;

/** Create a Drizzle client bound to the schema. */
export function createDb(connectionString: string, max = 5): Database {
  const client = postgres(connectionString, { max });
  return drizzle(client, { schema });
}
