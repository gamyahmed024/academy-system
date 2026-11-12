import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { pool?: Pool; db?: DB };

/**
 * On Vercel every function instance has its own pool, and Supabase's session
 * pooler (port 5432) allows only 15 clients in total, so a few busy instances
 * used it up and pages failed. At runtime we use the transaction pooler
 * (port 6543), which shares connections between clients, and keep each
 * instance's pool small. Migrations at build time still use the URL as given.
 */
export function runtimeUrl(url: string, onVercel = !!process.env.VERCEL): string {
  if (!onVercel) return url;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "5432") {
      u.port = "6543";
      return u.toString();
    }
  } catch {
    // not a URL we understand: use it as is
  }
  return url;
}

function create(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const onVercel = !!process.env.VERCEL;
  const pool =
    globalForDb.pool ??
    new Pool({
      connectionString: runtimeUrl(url, onVercel),
      max: onVercel ? 3 : 10,
      idleTimeoutMillis: onVercel ? 5_000 : 10_000,
    });
  globalForDb.pool = pool;
  return drizzle(pool, { schema });
}

/** Lazily created so that importing this module never needs a database. */
export function getDb(): DB {
  if (!globalForDb.db) globalForDb.db = create();
  return globalForDb.db;
}

export { schema };
