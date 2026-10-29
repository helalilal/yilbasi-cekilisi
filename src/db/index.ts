import "server-only";
import type { Sql, TransactionSql } from "postgres";

// Tiny SQL layer over two drivers:
//  - DATABASE_URL set  -> postgres.js (Neon / any Postgres, used on Vercel)
//  - DATABASE_URL unset -> PGlite in the OS temp dir (local development, no setup)

export type Row = Record<string, unknown>;

export interface Db {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  transaction<R>(fn: (tx: Db) => Promise<R>): Promise<R>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  admin_token_hash TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'tr',
  status TEXT NOT NULL DEFAULT 'open',
  drawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wishlist TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'tr',
  edit_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);
CREATE TABLE IF NOT EXISTS exclusions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_a_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_b_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assignments (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  giver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  email_status TEXT NOT NULL DEFAULT 'pending',
  emailed_at TIMESTAMPTZ,
  PRIMARY KEY (event_id, giver_id)
);
`;

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { prepare: false, max: 5 });
  const wrap = (s: Sql | TransactionSql): Db => ({
    async query<T>(text: string, params: unknown[] = []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await s.unsafe(text, params as any[])) as unknown as T[];
    },
    async transaction<R>(fn: (tx: Db) => Promise<R>) {
      if (s === sql) return (await sql.begin((tx) => fn(wrap(tx)))) as R;
      return fn(wrap(s));
    },
  });
  return wrap(sql);
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  // Kept outside the project so the dev server's file watcher ignores it.
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const pg = new PGlite(join(tmpdir(), "yilbasi-cekilisi-dev-db"));
  type Q = Pick<typeof pg, "query">;
  const wrap = (q: Q, root: boolean): Db => ({
    async query<T>(text: string, params: unknown[] = []) {
      return (await q.query<T>(text, params)).rows;
    },
    async transaction<R>(fn: (tx: Db) => Promise<R>) {
      if (root) return pg.transaction((tx) => fn(wrap(tx, false)));
      return fn(wrap(q, false));
    },
  });
  return wrap(pg, true);
}

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForDb.__db) {
    globalForDb.__db = (async () => {
      const url = process.env.DATABASE_URL;
      const db = url ? await createPostgres(url) : await createPglite();
      for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
        await db.query(stmt);
      }
      return db;
    })().catch((err) => {
      globalForDb.__db = undefined;
      throw err;
    });
  }
  return globalForDb.__db;
}
