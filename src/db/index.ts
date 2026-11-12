import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { pool?: Pool; db?: DB };

function create(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = globalForDb.pool ?? new Pool({ connectionString: url, max: 10 });
  globalForDb.pool = pool;
  return drizzle(pool, { schema });
}

/** Lazily created so that importing this module never needs a database. */
export function getDb(): DB {
  if (!globalForDb.db) globalForDb.db = create();
  return globalForDb.db;
}

export { schema };
