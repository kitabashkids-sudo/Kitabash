import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Fresh isolated database per test file.
 * Default: in-memory SQLite. Set TEST_DATABASE_URL to run the same tests on Postgres
 * (the database's public schema is WIPED first — never point this at real data).
 */
export async function freshDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-test-'));
  process.env.DATA_DIR = dir;
  process.env.AI_PROVIDER = 'mock';
  process.env.SESSION_SECRET = 'test-secret-test-secret-123';
  const db = await import('../../src/lib/db/index.ts');
  await db.closeDb();
  const url = process.env.TEST_DATABASE_URL;
  if (url) {
    await resetPostgres(url);
    await db.initDb({ databaseUrl: url });
  } else await db.initDb({ sqliteFile: ':memory:', databaseUrl: null });
  return { dir, db };
}

export async function resetPostgres(url: string) {
  const { PgConnection, parseConnectionString } = await import('../../src/lib/db/pg.ts');
  const c = new PgConnection(parseConnectionString(url));
  await c.connect();
  await c.simple('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;');
  c.close();
}
