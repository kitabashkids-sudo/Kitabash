// First-run setup: when the database has no users, the browser shows a setup page where
// the person who deployed Kitabash creates the first admin account and, optionally,
// loads the demo courses. No command line needed. Once any user exists, setup is closed.
import { get, tx, currentDialect } from '../db/index.ts';
import { createUser } from '../auth.ts';
import { HttpError } from '../validate.ts';
import { storage } from '../storage.ts';
import { DEMO_USERS, seedCatalogue, seedDemoCourses, seedDemoPeople } from '../demo/seed.ts';

export async function setupStatus() {
  const anyUser = await get('SELECT 1 FROM users LIMIT 1');
  const demo = await get("SELECT 1 FROM users WHERE email = 'teacher@kitabash.local' LIMIT 1");
  // Hosts like Render's free plan wipe the server disk on every restart.
  const ephemeral = !!(process.env.RENDER || process.env.EPHEMERAL_DISK);
  const warning =
    ephemeral && currentDialect() !== 'postgres'
      ? 'This server has no permanent storage, so your data would be lost when it restarts. Add your Supabase connection (DATABASE_URL) in the hosting settings first, then reload this page.'
      : ephemeral && storage().driver !== 'supabase'
        ? 'Your data is safe in the database, but uploaded files (course documents, media) would be lost when this server restarts. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the hosting settings to keep them.'
        : null;
  return {
    needsSetup: !anyUser,
    requiresCode: !!process.env.SETUP_CODE,
    demoAccounts: !!demo,
    database: currentDialect() === 'postgres' ? (/supabase/.test(process.env.DATABASE_URL || '') ? 'Supabase' : 'PostgreSQL') : 'Local file (SQLite)',
    storage: storage().driver === 'supabase' ? 'Supabase Storage' : 'Server disk',
    warning,
  };
}

let running = false;

export async function runSetup(input: { name: string; email: string; password: string; loadDemo: boolean; demoPeople: boolean; code?: string }) {
  if (process.env.SETUP_CODE && input.code !== process.env.SETUP_CODE) throw new HttpError(403, 'The setup code is not correct.');
  if (running) throw new HttpError(409, 'Setup is already running. Please wait.');
  running = true;
  try {
    const adminId = await tx(async () => {
      if (await get('SELECT 1 FROM users LIMIT 1')) throw new HttpError(409, 'Kitabash is already set up. Please sign in.');
      return createUser({ email: input.email.toLowerCase(), name: input.name, role: 'admin', password: input.password });
    });
    const subj = await seedCatalogue(adminId);
    if (input.loadDemo) {
      const courses = await seedDemoCourses(adminId, subj);
      if (input.demoPeople) await seedDemoPeople(courses);
    }
    return adminId;
  } finally {
    running = false;
  }
}

export { DEMO_USERS };
