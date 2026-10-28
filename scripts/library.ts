// Installs the K-12 course library from the command line: npm run library:install
// (The same install is available without a terminal: setup page, or Platform → Course library.)
import { loadEnv } from '../server/env.ts';
loadEnv();
import { initDb, closeDb, get } from '../src/lib/db/index.ts';
import { installLibrary, libraryStatus } from '../src/lib/library/install.ts';

await initDb();
try {
  const admin = await get<{ id: string }>("SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1");
  if (!admin) throw new Error('Create the first admin account (setup page or npm run db:seed) before installing the library.');
  const before = await libraryStatus();
  console.log(`Course library: ${before.installed}/${before.total} courses installed. Installing the rest…`);
  const { done } = await installLibrary(admin.id, { log: console.log });
  const job = await done;
  const after = await libraryStatus();
  console.log(`\nDone: ${after.installed}/${after.total} courses (${after.lessons} lessons). ${job.errors.length} error(s).`);
  if (job.errors.length) process.exitCode = 1;
} finally {
  await closeDb();
}
