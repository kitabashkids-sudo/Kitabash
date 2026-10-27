// Browser test of the no-command-line first run: empty database → setup page → admin + demo courses.
// Usage: npm run build && npx tsx tests/e2e/first-run.ts   (E2E_DATABASE_URL to use Postgres)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3101;
const BASE = `http://localhost:${PORT}`;
const pgUrl = process.env.E2E_DATABASE_URL;
const env: NodeJS.ProcessEnv = { ...process.env, DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'kb-first-')), PORT: String(PORT), SETUP_CODE: 'open-sesame', STORAGE_DRIVER: 'local', NODE_OPTIONS: '--disable-warning=ExperimentalWarning' };
if (pgUrl) env.DATABASE_URL = pgUrl;
else delete env.DATABASE_URL;

const ok: string[] = [];
const check = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(`FAILED: ${msg}`);
  ok.push(msg);
  console.log(`  ✓ ${msg}`);
};

async function main() {
  if (pgUrl) {
    const { resetPostgres } = await import('../unit/helpers.ts');
    await resetPostgres(pgUrl);
  }
  const server = spawn(process.execPath, ['dist/server.js'], { env, stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  const errors: string[] = [];
  try {
    console.log(`Database: ${pgUrl ? 'PostgreSQL' : 'SQLite'}`);
    const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.setDefaultTimeout(30000);
    await p.goto(BASE);
    await p.waitForURL(/\/setup$/);
    check(true, 'Brand-new site opens the setup page automatically');
    await p.getByText('Database:').waitFor();
    await p.getByLabel('Your name').fill('Head Teacher');
    await p.getByLabel('Your email').fill('Head@School.example');
    await p.getByLabel(/^Password/).fill('correct horse 1');
    await p.getByLabel('Repeat password').fill('correct horse 1');
    await p.getByLabel('Setup code').fill('wrong');
    await p.getByRole('button', { name: /Create my account/ }).click();
    await p.getByText('The setup code is not correct.').waitFor();
    check(true, 'Wrong setup code is rejected');
    await p.getByLabel('Setup code').fill('open-sesame');
    await p.screenshot({ path: 'test-results/first-run-setup.png', fullPage: true });
    await p.getByRole('button', { name: /Create my account/ }).click();
    await p.waitForURL(/\/admin$/, { timeout: 60000 });
    await p.getByText('Money Smart: Needs, Wants & Budgets').waitFor();
    check(true, 'Admin account created, signed in, 4 sample courses loaded');
    const again = await p.evaluate(async () => (await fetch('/api/setup', { method: 'POST', headers: { 'content-type': 'application/json', 'x-kitabash': '1' }, body: JSON.stringify({ name: 'x', email: 'x@y.zz', password: '12345678', code: 'open-sesame' }) })).status);
    check(again === 409, 'Setup cannot be run a second time');
    await p.getByRole('button', { name: 'Sign out' }).click();
    await p.waitForURL(/\/login$/);
    await p.getByText('Welcome back').waitFor();
    check((await p.getByText('Demo accounts').count()) === 0, 'No public demo logins are shown on a real installation');
    await p.getByLabel('Email').fill('head@school.example');
    await p.getByLabel('Password').fill('correct horse 1');
    await p.getByRole('button', { name: 'Sign in', exact: true }).click();
    await p.waitForURL(/\/admin$/);
    check(true, 'The new admin can sign back in (email is case-insensitive)');
    await p.goto(`${BASE}/setup`);
    await p.waitForURL(/\/login|\/admin/);
    check(true, 'Visiting /setup afterwards redirects away');
    check(errors.length === 0, 'No browser errors');
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\n${ok.length} checks passed.`);
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
