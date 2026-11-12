import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import type { DB } from "@/db";

let pool: Pool | null = null;
let db: DB | null = null;

export async function testDb(): Promise<DB> {
  if (!db) {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) throw new Error("TEST_DATABASE_URL is not set");
    pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
  }
  return db;
}

export async function resetDb(d: DB) {
  await d.execute(sql`
    TRUNCATE audit_log, credit_entries, payments, payouts, attendance, lessons, series,
      group_members, groups, students, guardians, teachers, wallets, sessions, users, settings
    RESTART IDENTITY CASCADE`);
}

export async function closeDb() {
  await pool?.end();
  pool = null;
  db = null;
}
