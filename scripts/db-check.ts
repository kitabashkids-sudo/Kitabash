// `npm run db:check` — verifies the configured database and file storage end to end.
// Use it right after pasting your Supabase connection string into .env.
import { loadEnv } from '../server/env.ts';
loadEnv();
import { initDb, closeDb, currentDialect, all, get } from '../src/lib/db/index.ts';
import { storage } from '../src/lib/storage.ts';
import { explainDbError } from '../src/lib/db/pg.ts';

const ok = (m: string) => console.log(`  ✓ ${m}`);
const bad = (m: string) => console.log(`  ✗ ${m}`);
let failed = false;

console.log('\nKitabash connection check\n');
try {
  await initDb();
  ok(`Connected to ${currentDialect() === 'postgres' ? 'PostgreSQL' : 'SQLite'} and migrations are applied`);
  if (currentDialect() === 'postgres') {
    const v = await get<{ v: string }>('SELECT version() AS v');
    ok(v!.v.split(',')[0]);
    const ssl = await get<{ ssl: boolean }>('SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()');
    ssl?.ssl ? ok('Connection is encrypted (TLS)') : console.log('  • Connection is not using TLS (fine for local Postgres; Supabase needs sslmode=require)');
    const t = await all<{ tablename: string; rowsecurity: boolean }>("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'");
    const open = t.filter((x) => !x.rowsecurity).map((x) => x.tablename);
    open.length ? (bad(`Tables without Row Level Security: ${open.join(', ')}`), (failed = true)) : ok(`Row Level Security enabled on all ${t.length} tables`);
    const anon = await get<{ n: number }>("SELECT COUNT(*) n FROM information_schema.role_table_grants WHERE grantee IN ('anon','authenticated') AND table_schema='public'");
    anon && anon.n > 0 ? (bad(`Supabase API roles still have ${anon.n} table grants — re-run migrations`), (failed = true)) : ok('Supabase public API roles (anon/authenticated) have no table access');
  }
  const users = await get<{ n: number }>('SELECT COUNT(*) n FROM users');
  users!.n ? ok(`${users!.n} user accounts found`) : console.log('  • No users yet — run `npm run db:seed` for demo data');
} catch (e) {
  bad(`Database: ${explainDbError(e)}`);
  failed = true;
}
try {
  const s = storage();
  const key = `healthcheck/${Date.now()}.txt`;
  await s.put(key, Buffer.from('kitabash'), 'text/plain');
  const back = await s.read(key);
  await s.remove(key);
  back?.toString() === 'kitabash' ? ok(`File storage works (${s.driver === 'supabase' ? `Supabase Storage, bucket "${process.env.SUPABASE_STORAGE_BUCKET || 'kitabash'}"` : 'local disk'})`) : (bad('File storage read-back mismatch'), (failed = true));
} catch (e) {
  bad(`File storage: ${(e as Error).message}`);
  failed = true;
}
await closeDb();
console.log(failed ? '\nSome checks failed — see README → Troubleshooting.\n' : '\nAll good. Start the app with `npm start`.\n');
process.exitCode = failed ? 1 : 0;
