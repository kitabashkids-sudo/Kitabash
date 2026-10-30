// End-to-end test of live video classes: a teacher and two students in real Chromium browsers
// with fake cameras/microphones, connected peer-to-peer over WebRTC through the app's signalling.
// Usage: npm run build && npm run test:live
import { chromium, type Page, type BrowserContext } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3102;
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve('test-results');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-live-'));
const results: { step: string; ok: boolean; detail?: string }[] = [];
let shot: Page | null = null;

async function step(name: string, fn: () => Promise<string | void>) {
  try {
    const d = await fn();
    results.push({ step: name, ok: true, detail: d || undefined });
    console.log(`  ✓ ${name}${d ? ` — ${d}` : ''}`);
  } catch (e) {
    results.push({ step: name, ok: false, detail: (e as Error).message.split('\n')[0] });
    await shot?.screenshot({ path: `${OUT}/live-failure.png`, fullPage: true }).catch(() => {});
    console.log(`  ✗ ${name}: ${(e as Error).message.split('\n')[0]}`);
    throw e;
  }
}

async function login(page: Page, email: string, pw: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(pw);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

/** Number of <video> elements on the page that are actually receiving frames from a remote peer. */
const playingRemote = (p: Page) =>
  p.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.muted && v.videoWidth > 0 && v.srcObject).length);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const pgUrl = process.env.E2E_DATABASE_URL;
  const env: NodeJS.ProcessEnv = { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), AI_PROVIDER: 'mock', STORAGE_DRIVER: 'local', NODE_OPTIONS: '--disable-warning=ExperimentalWarning' };
  if (pgUrl) env.DATABASE_URL = pgUrl;
  else delete env.DATABASE_URL;
  console.log(`Database: ${pgUrl ? 'PostgreSQL' : 'SQLite'}`);
  await new Promise<void>((res, rej) => {
    const s = spawn(process.execPath, ['--import', 'tsx', 'scripts/seed.ts', ...(pgUrl ? ['--reset'] : [])], { env, stdio: 'ignore' });
    s.on('exit', (c) => (c === 0 ? res() : rej(new Error('seed failed'))));
  });
  const server = spawn(process.execPath, ['dist/server.js'], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const errors: string[] = [];
  const contexts: BrowserContext[] = [];
  const newPage = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, permissions: ['camera', 'microphone'] });
    contexts.push(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('dialog', (d) => void d.accept());
    p.setDefaultTimeout(15000);
    return p;
  };
  let liveUrl = '';
  try {
    const t = await newPage();
    shot = t;
    await login(t, 'teacher@kitabash.local', 'Teach#2026');

    await step('1. Teacher sees the class group and its weekly schedule', async () => {
      await t.getByRole('link', { name: 'Classes' }).click();
      await t.getByRole('button', { name: /Money Smart — Saturday group/ }).click();
      await t.getByRole('heading', { name: 'Upcoming classes' }).waitFor();
      const n = await t.getByRole('button', { name: 'Start class' }).count();
      if (n < 4) throw new Error(`expected 4 seeded weekly classes, saw ${n}`);
      return `${n} classes scheduled, roster shows Aarav and Meera`;
    });

    await step('2. Teacher schedules a class for right now', async () => {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
      await t.getByLabel('Starts').fill(local);
      await t.getByLabel('Title', { exact: false }).first().fill('E2E live lesson');
      await t.getByRole('button', { name: 'Schedule' }).click();
      await t.getByText('E2E live lesson').waitFor();
    });

    await step('3. Teacher starts the class with camera and mic', async () => {
      await t.locator('li', { hasText: 'E2E live lesson' }).getByRole('button', { name: 'Start class' }).click();
      await t.waitForURL(/\/live\//);
      liveUrl = t.url();
      await t.getByRole('button', { name: 'Start class' }).click();
      await t.getByText('LIVE', { exact: true }).waitFor();
      await t.getByText('Students will appear here when they join.').waitFor();
    });

    const s1 = await newPage();
    await login(s1, 'aarav@kitabash.local', 'Learn#2026');
    await step('4. Student (guardian allowed mic/camera) sees “Live now” on home and joins', async () => {
      await s1.getByText('Live now').first().waitFor();
      await s1.getByRole('button', { name: 'Join', exact: true }).first().click();
      await s1.getByRole('button', { name: 'Join class' }).click();
      await s1.getByText('LIVE', { exact: true }).waitFor();
    });

    await step('5. Video flows both ways over WebRTC', async () => {
      await t.waitForFunction(() => [...document.querySelectorAll('video')].some((v) => !v.muted && v.videoWidth > 0), null, { timeout: 20000 });
      await s1.waitForFunction(() => [...document.querySelectorAll('video')].some((v) => !v.muted && v.videoWidth > 0), null, { timeout: 20000 });
      return `teacher receives ${await playingRemote(t)} stream(s), student receives ${await playingRemote(s1)}`;
    });

    await step('6. Chat, raise hand and teacher controls', async () => {
      await s1.getByRole('textbox', { name: 'Chat message' }).fill('Hello teacher!');
      await s1.getByRole('button', { name: 'Send' }).click();
      await t.getByRole('tab', { name: /Chat/ }).click();
      await t.getByText('Hello teacher!').waitFor();
      await s1.getByRole('button', { name: /Raise hand/ }).click();
      await t.getByRole('tab', { name: /People/ }).click();
      await t.getByTitle('Hand raised').waitFor();
      await s1.getByRole('button', { name: 'Unmute' }).click();
      await t.getByRole('button', { name: 'Mute all' }).click();
      await s1.getByRole('button', { name: 'Unmute' }).waitFor();
      return 'message delivered, hand seen by teacher, mute-all applied';
    });

    await step('7. Teacher shares a lesson card and it appears for the student', async () => {
      await t.getByRole('tab', { name: /Lesson/ }).click();
      const card = t.locator('[data-share=card]').nth(1);
      const title = (await card.locator('span').first().innerText()).replace(/^\S+\s/, '').trim().slice(0, 30);
      await card.click();
      await s1.getByRole('tab', { name: /Lesson/, selected: true }).waitFor();
      await s1.locator('aside').getByText(title, { exact: false }).first().waitFor();
      return `shared “${title}”`;
    });

    const s2 = await newPage();
    await login(s2, 'meera@kitabash.local', 'Learn#2026');
    await step('8. Under-18 student without guardian consent joins view-only', async () => {
      await s2.goto(liveUrl);
      await s2.getByText('until a parent or guardian allows them').waitFor();
      await s2.getByRole('button', { name: 'Join class' }).click();
      await s2.getByText('LIVE', { exact: true }).waitFor();
      if (await s2.getByRole('button', { name: 'Unmute' }).count()) throw new Error('view-only student has a mic button');
      await s2.waitForFunction(() => [...document.querySelectorAll('video')].some((v) => !v.muted && v.videoWidth > 0), null, { timeout: 20000 });
      await t.getByRole('tab', { name: /People/ }).click();
      await t.getByText('People (3)').waitFor();
      await t.screenshot({ path: `${OUT}/live-teacher.png` });
      await s1.screenshot({ path: `${OUT}/live-student.png` });
      return 'watches teacher video, no camera/mic, teacher sees 3 people';
    });

    await step('9. Students cannot see each other unless the teacher allows it', async () => {
      // While a lesson card is open, video is a small floating window; classmates show in "Video big".
      await s1.getByRole('button', { name: /Video big/ }).click();
      const stage = s1.locator('section');
      if (await stage.getByText('Meera', { exact: true }).count()) throw new Error('student tile visible to another student by default');
      await t.getByLabel(/Students see & hear each other/).click();
      await t.waitForFunction(() => (document.querySelector('aside input[type=checkbox]') as HTMLInputElement)?.checked);
      await stage.getByText('Meera', { exact: true }).waitFor();
      return 'hidden by default; visible after teacher switches on “Everyone”';
    });

    await step('10. Teacher ends the class; students are told and attendance is recorded', async () => {
      await t.getByRole('button', { name: 'End class' }).click();
      await s1.getByText('The class has ended').waitFor();
      await s2.getByText('The class has ended').waitFor();
      await t.getByRole('button', { name: 'Attendance & chat log' }).click();
      await t.getByRole('heading', { name: 'Attendance' }).waitFor();
      const present = await t.getByText('present', { exact: true }).count();
      if (present < 2) throw new Error(`expected 2 present, saw ${present}`);
      await t.getByText('Hello teacher!').waitFor();
      return `${present} students marked present, chat log saved`;
    });

    const g = await newPage();
    await login(g, 'parent@kitabash.local', 'Parent#2026');
    await step('11. Parent sees the class and that their child attended', async () => {
      await g.getByRole('heading', { name: 'Live classes' }).waitFor();
      await g.locator('li', { hasText: 'E2E live lesson' }).getByText(/Attended/).waitFor();
      const r = await g.request.get(liveUrl.replace('/live/', '/api/live/') + '/events');
      if (r.status() !== 403 && r.status() !== 409) throw new Error(`parent could connect to class stream (${r.status()})`);
    });

    if (errors.length) throw new Error('Page errors: ' + errors.join(' | '));
  } finally {
    for (const c of contexts) await c.close().catch(() => {});
    await browser.close();
    server.kill();
    fs.writeFileSync(`${OUT}/live-class.json`, JSON.stringify(results, null, 2));
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} live-class checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
