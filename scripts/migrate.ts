// Applies pending migrations to the configured database (SQLite, or Postgres/Supabase when DATABASE_URL is set).
import { loadEnv } from '../server/env.ts';
loadEnv();
import { initDb, closeDb, currentDialect } from '../src/lib/db/index.ts';
try {
  await initDb(); // applies any pending migrations
  console.log(`Database (${currentDialect()}) is up to date.`);
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await closeDb();
}
