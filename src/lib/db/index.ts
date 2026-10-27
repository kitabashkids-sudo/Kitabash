// Data-access layer with two interchangeable backends:
//   • SQLite (node:sqlite) — default, zero setup, for local development and tests.
//   • PostgreSQL / Supabase — used when DATABASE_URL is set.
// Services write portable SQL with `?` placeholders; this module translates for Postgres.
// Transactions use AsyncLocalStorage so nested service calls join the open transaction.
import { DatabaseSync } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PgPool, PgConnection, parseConnectionString } from './pg.ts';

export type Row = Record<string, any>;
export type Dialect = 'sqlite' | 'postgres';

export function dataDir(): string {
  return path.resolve(process.env.DATA_DIR || './data');
}

export function uploadsDir(): string {
  const d = path.join(dataDir(), 'uploads');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function migrationsDir(dialect: Dialect): string {
  const candidates = [path.resolve(process.cwd(), 'db/migrations', dialect), path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../db/migrations', dialect)];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`db/migrations/${dialect} folder not found`);
}

// ── Backend state ───────────────────────────────────────────
let dialect: Dialect = 'sqlite';
let sqlite: DatabaseSync | null = null;
let pool: PgPool | null = null;
let ready: Promise<void> | null = null;

interface TxStore {
  pg?: PgConnection;
  depth: number;
}
const als = new AsyncLocalStorage<TxStore>();

/** Simple async mutex so SQLite transactions don't interleave with other requests. */
let sqliteLock: Promise<void> = Promise.resolve();
let sqliteLocked = false;

export function currentDialect(): Dialect {
  return dialect;
}

export interface InitOptions {
  sqliteFile?: string; // ':memory:' for tests
  databaseUrl?: string | null;
}

/** Open the configured database and apply pending migrations. Safe to call repeatedly. */
export function initDb(opts: InitOptions = {}): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const url = opts.databaseUrl === undefined ? process.env.DATABASE_URL : opts.databaseUrl;
    if (url) {
      dialect = 'postgres';
      pool = new PgPool(parseConnectionString(url));
    } else {
      dialect = 'sqlite';
      const file = opts.sqliteFile || path.join(dataDir(), 'kitabash.sqlite');
      if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
      sqlite = new DatabaseSync(file);
      sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;');
    }
    await migrate();
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export async function closeDb() {
  await ready?.catch(() => {});
  sqlite?.close();
  sqlite = null;
  await pool?.end();
  pool = null;
  ready = null;
}

export async function migrate(): Promise<string[]> {
  const files = fs.readdirSync(migrationsDir(dialect)).filter((f) => f.endsWith('.sql')).sort();
  const ran: string[] = [];
  if (dialect === 'sqlite') {
    const d = sqlite!;
    d.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`);
    const applied = new Set((d.prepare('SELECT name FROM schema_migrations').all() as Row[]).map((r) => r.name));
    for (const f of files) {
      if (applied.has(f)) continue;
      d.exec('BEGIN');
      try {
        d.exec(fs.readFileSync(path.join(migrationsDir(dialect), f), 'utf8'));
        d.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(f);
        d.exec('COMMIT');
        ran.push(f);
      } catch (e) {
        d.exec('ROLLBACK');
        throw new Error(`Migration ${f} failed: ${(e as Error).message}`);
      }
    }
    return ran;
  }
  const c = await pool!.acquire();
  try {
    // Advisory lock: safe when several app instances start at once.
    await c.query('SELECT pg_advisory_lock(727274)');
    await c.simple(`CREATE TABLE IF NOT EXISTS public.schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()); ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;`);
    const applied = new Set((await c.query('SELECT name FROM public.schema_migrations')).rows.map((r) => r.name));
    for (const f of files) {
      if (applied.has(f)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir(dialect), f), 'utf8');
      try {
        await c.simple(`BEGIN;\n${sql}\n;INSERT INTO public.schema_migrations (name) VALUES ('${f.replace(/'/g, "''")}');\nCOMMIT;`);
        ran.push(f);
      } catch (e) {
        await c.simple('ROLLBACK').catch(() => {});
        throw new Error(`Migration ${f} failed: ${(e as Error).message}`);
      }
    }
  } finally {
    await c.query('SELECT pg_advisory_unlock(727274)').catch(() => {});
    pool!.release(c);
  }
  return ran;
}

// ── SQL translation (portable SQL → Postgres) ──────────────
const pgCache = new Map<string, string>();
export function toPostgres(sql: string): string {
  const hit = pgCache.get(sql);
  if (hit) return hit;
  let s = sql
    .replace(/datetime\('now',\s*\?\)/g, '(now() + CAST(? AS interval))')
    .replace(/datetime\('now'\)/g, 'now()');
  let ignore = false;
  s = s.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, () => ((ignore = true), 'INSERT INTO'));
  // ? → $n, skipping quoted strings
  let out = '';
  let n = 0;
  let q: string | null = null;
  for (const ch of s) {
    if (q) {
      out += ch;
      if (ch === q) q = null;
    } else if (ch === "'" || ch === '"') {
      q = ch;
      out += ch;
    } else if (ch === '?') out += `$${++n}`;
    else out += ch;
  }
  if (ignore) out = out.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
  pgCache.set(sql, out);
  return out;
}

function norm(v: any) {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v !== null && typeof v === 'object' && !(v instanceof Uint8Array)) return JSON.stringify(v);
  return v;
}

async function waitForSqlite() {
  // Outside a transaction: wait until no other request holds the SQLite transaction lock.
  while (sqliteLocked && !als.getStore()) await sqliteLock;
}

async function ensureReady() {
  if (!ready) await initDb();
  else await ready;
}

export async function all<T = Row>(sql: string, ...params: any[]): Promise<T[]> {
  await ensureReady();
  const p = params.map(norm);
  if (dialect === 'sqlite') {
    await waitForSqlite();
    return sqlite!.prepare(sql).all(...p) as T[];
  }
  const store = als.getStore();
  const r = store?.pg ? await store.pg.query(toPostgres(sql), p) : await pool!.query(toPostgres(sql), p);
  return r.rows as T[];
}

export async function get<T = Row>(sql: string, ...params: any[]): Promise<T | undefined> {
  return (await all<T>(sql, ...params))[0];
}

export async function run(sql: string, ...params: any[]): Promise<{ changes: number }> {
  await ensureReady();
  const p = params.map(norm);
  if (dialect === 'sqlite') {
    await waitForSqlite();
    const r = sqlite!.prepare(sql).run(...p);
    return { changes: Number(r.changes) };
  }
  const store = als.getStore();
  const r = store?.pg ? await store.pg.query(toPostgres(sql), p) : await pool!.query(toPostgres(sql), p);
  return { changes: r.rowCount };
}

/** Run fn in a transaction. Nested calls use savepoints on the same connection. */
export async function tx<T>(fn: () => Promise<T> | T): Promise<T> {
  await ensureReady();
  const outer = als.getStore();
  if (outer) {
    const sp = `sp${++outer.depth}`;
    await exec(`SAVEPOINT ${sp}`, outer);
    try {
      const v = await fn();
      await exec(`RELEASE SAVEPOINT ${sp}`, outer);
      return v;
    } catch (e) {
      await exec(`ROLLBACK TO SAVEPOINT ${sp}`, outer);
      throw e;
    } finally {
      outer.depth--;
    }
  }
  if (dialect === 'sqlite') {
    let release!: () => void;
    const prev = sqliteLock;
    sqliteLock = new Promise<void>((r) => (release = r));
    await prev;
    sqliteLocked = true;
    const store: TxStore = { depth: 0 };
    try {
      return await als.run(store, async () => {
        sqlite!.exec('BEGIN');
        try {
          const v = await fn();
          sqlite!.exec('COMMIT');
          return v;
        } catch (e) {
          sqlite!.exec('ROLLBACK');
          throw e;
        }
      });
    } finally {
      sqliteLocked = false;
      release();
    }
  }
  const conn = await pool!.acquire();
  const store: TxStore = { pg: conn, depth: 0 };
  try {
    return await als.run(store, async () => {
      await conn.query('BEGIN');
      try {
        const v = await fn();
        await conn.query('COMMIT');
        return v;
      } catch (e) {
        await conn.query('ROLLBACK').catch(() => {});
        throw e;
      }
    });
  } finally {
    pool!.release(conn);
  }
}

async function exec(sql: string, store: TxStore) {
  if (dialect === 'sqlite') sqlite!.exec(sql);
  else await store.pg!.query(sql);
}

export function id(prefix = ''): string {
  return prefix + crypto.randomBytes(9).toString('base64url');
}

export function j<T = any>(s: unknown, fallback: T): T {
  if (s !== null && typeof s === 'object') return s as T;
  if (typeof s !== 'string' || s === '') return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .slice(0, 60) || 'item'
  );
}

export async function uniqueSlug(table: 'courses' | 'subjects' | 'categories', base: string): Promise<string> {
  let s = slugify(base);
  let n = 1;
  while (await get(`SELECT 1 FROM ${table} WHERE slug = ?`, s)) s = `${slugify(base)}-${++n}`;
  return s;
}

export async function audit(userId: string | null, action: string, entity: string, entityId: string | null, detail = '') {
  await run('INSERT INTO audit_log (id,user_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?,?)', id('al_'), userId, action, entity, entityId, detail.slice(0, 1000));
}
