// Seeds demo data. Usage: npm run db:seed  (or db:reset to wipe first)
// Everything is created through the same services the app uses, so the
// seeded courses pass the same validation and approval workflow.
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from '../server/env.ts';
loadEnv();
import { initDb, closeDb, dataDir, get, all, run, currentDialect } from '../src/lib/db/index.ts';
import { createUser } from '../src/lib/auth.ts';
import { DEMO_USERS, seedCatalogue, seedDemoCourses, seedDemoPeople } from '../src/lib/demo/seed.ts';
export { DEMO_USERS };

export async function seed(opts: { reset?: boolean; quiet?: boolean } = {}) {
  const log = (...a: any[]) => !opts.quiet && console.log(...a);
  if (opts.reset) {
    await initDb();
    if (currentDialect() === 'postgres') {
      // Drops ONLY Kitabash's own tables (listed in the migration), then re-runs migrations.
      const dir = path.resolve('db/migrations/postgres');
      const sql = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
      const tables = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/g)].map((m) => m[1]);
      log(`Resetting ${tables.length} Kitabash tables in PostgreSQL…`);
      await run(`DROP TABLE IF EXISTS ${[...tables, 'schema_migrations'].join(', ')} CASCADE`);
      await closeDb();
    } else {
      await closeDb();
      for (const f of ['kitabash.sqlite', 'kitabash.sqlite-wal', 'kitabash.sqlite-shm']) fs.rmSync(path.join(dataDir(), f), { force: true });
    }
    fs.rmSync(path.join(dataDir(), 'uploads'), { recursive: true, force: true });
  }
  await initDb();
  log(`Database: ${currentDialect() === 'postgres' ? 'PostgreSQL (DATABASE_URL)' : 'SQLite'}`);
  if (await get('SELECT 1 FROM users LIMIT 1')) {
    log('Database already has data — skipping seed. Use `npm run db:reset` to start fresh.');
    return;
  }
  const admin = await createUser(DEMO_USERS[0]);
  const subj = await seedCatalogue(admin);
  const courses = await seedDemoCourses(admin, subj, log);
  await seedDemoPeople(courses);
  log(`\nSeeded ${(await all('SELECT id FROM courses')).length} courses, ${(await all('SELECT id FROM subjects')).length} subjects.`);
  log('Demo accounts:');
  for (const u of DEMO_USERS) log(`  ${u.role.padEnd(10)} ${u.email.padEnd(26)} ${u.password}`);
}

if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) {
  try {
    await seed({ reset: process.argv.includes('--reset') });
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
