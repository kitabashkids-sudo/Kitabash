// End-to-end check of platform activities, Web Lab, printable worksheets, catalogue search and the
// live-class layout (big activity area, teacher resources, student screen share), in real Chromium.
// Screenshots go to test-results/. Usage: npm run build && npm run test:platforms
import { chromium, type Page, type BrowserContext } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3104;
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve('test-results');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-plat-'));
let passed = 0;
let shot: Page | null = null;

async function step(name: string, fn: () => Promise<string | void>) {
  try {
    const d = await fn();
    passed++;
    console.log(`  ✓ ${name}${d ? ` — ${d}` : ''}`);
  } catch (e) {
    await shot?.screenshot({ path: `${OUT}/platforms-failure.png`, fullPage: true }).catch(() => {});
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
const run = (env: NodeJS.ProcessEnv, args: string[]) =>
  new Promise<void>((res, rej) => {
    const s = spawn(process.execPath, args, { env, stdio: 'inherit' });
    s.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${args.join(' ')} failed`))));
  });

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const env: NodeJS.ProcessEnv = { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), AI_PROVIDER: 'mock', STORAGE_DRIVER: 'local', NODE_OPTIONS: '--disable-warning=ExperimentalWarning' };
  delete env.DATABASE_URL;
  await run(env, ['--import', 'tsx', 'scripts/seed.ts']);
  // Install a few library courses with different platforms.
  const installer = path.join(dataDir, 'install-some.mts');
  fs.writeFileSync(
    installer,
    `import { initDb, get, closeDb } from ${JSON.stringify(path.resolve('src/lib/db/index.ts'))};
import * as I from ${JSON.stringify(path.resolve('src/lib/library/install.ts'))};
await initDb();
const admin = (await get("SELECT id FROM users WHERE role='admin'")).id;
const subj = await I.subjectIds(admin);
for (const [s, b, l] of [['Mathematics', '6-8', 'Beginner'], ['Web Development', '6-8', 'Beginner'], ['Python', '6-8', 'Beginner'], ['Needs vs Wants', 'K-2', 'Beginner']])
  await I.installCourse(I.ACTIVE.find((c) => c.subject === s && c.band === b && c.level === l), admin, subj);
await closeDb();
`,
  );
  await run(env, ['--import', 'tsx', installer]);
  const server = spawn(process.execPath, ['dist/server.js'], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--auto-select-desktop-capture-source=Entire screen', '--auto-accept-this-tab-capture'] });
  const errors: string[] = [];
  const contexts: BrowserContext[] = [];
  const newPage = async (w = 1440, h = 900) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, permissions: ['camera', 'microphone'] });
    contexts.push(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('dialog', (d) => void d.accept());
    p.setDefaultTimeout(15000);
    return p;
  };
  try {
    const s = await newPage();
    shot = s;
    await login(s, 'aarav@kitabash.local', 'Learn#2026');

    await step('1. Catalogue search finds courses by platform, plus lessons and files', async () => {
      await s.goto(`${BASE}/catalog`);
      await s.getByRole('button', { name: 'All ages' }).click();
      await s.getByRole('searchbox', { name: /Search courses/ }).fill('geogebra');
      await s.getByRole('heading', { name: 'Courses', exact: true }).waitFor();
      await s.getByRole('searchbox', { name: /Search courses/ }).fill('mathematics');
      await s.getByRole('button', { name: /^Lessons \([1-9]/ }).waitFor();
      await s.getByRole('heading', { name: 'Files & worksheets' }).waitFor();
      await s.screenshot({ path: `${OUT}/p1-catalogue-search.png` });
      const files = await s.locator('section', { hasText: 'Files & worksheets' }).locator('li').count();
      await s.getByRole('button', { name: /^Lessons \(/ }).click();
      const lessons = await s.locator('section', { hasText: 'Lessons' }).locator('li').count();
      if (!files || !lessons) throw new Error(`files ${files}, lessons ${lessons}`);
      return `${lessons} lessons, ${files} files for “mathematics”; ?q= kept in the URL: ${new URL(s.url()).searchParams.get('q')}`;
    });

    await step('2. A maths lesson shows “Do it in GeoGebra” build-along and the printable worksheet', async () => {
      await s.locator('section', { hasText: 'Lessons' }).getByRole('link').first().click();
      await s.waitForURL(/\/lessons\//);
      await s.getByRole('link', { name: /Open GeoGebra/ }).waitFor();
      await s.getByText('Printable worksheet').waitFor();
      await s.getByRole('heading', { name: 'More places to practise' }).scrollIntoViewIfNeeded();
      await s.screenshot({ path: `${OUT}/p2b-practice-links.png` });
      const links = await s.locator('section[aria-label="More places to practise"] a').count();
      if (links < 3) throw new Error(`only ${links} practice links`);
      await s.getByText('Do it in GeoGebra').first().scrollIntoViewIfNeeded();
      await s.screenshot({ path: `${OUT}/p2-build-along.png` });
    });

    await step('3. Printable worksheet opens a print-ready page without answer keys', async () => {
      const [pop] = await Promise.all([s.context().waitForEvent('page'), s.getByRole('button', { name: 'Print / save as PDF' }).click()]);
      await pop.waitForLoadState();
      await pop.getByText('Key ideas').waitFor();
      await pop.getByText('Name:').waitFor();
      await pop.setViewportSize({ width: 900, height: 1200 });
      await pop.screenshot({ path: `${OUT}/p3-worksheet.png`, fullPage: true });
      const html = await pop.content();
      if (/answer_key|"correct"/.test(html)) throw new Error('answer key leaked');
      const n = await pop.locator('h3').count();
      await pop.close();
      return `${n} questions on the sheet`;
    });

    await step('4. Platform hand-in activity in the Perform phase', async () => {
      await s.getByRole('button', { name: /I’m ready to try/ }).click();
      const dots = s.getByRole('button', { name: /^Activity \d+: Do it in GeoGebra/ });
      await dots.click();
      await s.getByText('Your mission · GeoGebra').waitFor();
      for (const box of await s.locator('fieldset input[type=checkbox]').all()) await box.check();
      await s.getByLabel('Your GeoGebra link').fill('https://www.geogebra.org/m/abcd1234');
      await s.getByLabel('Reflection').fill('I used GeoGebra to plot the points and check my answers by dragging them around the grid until they matched.');
      await s.getByRole('button', { name: 'Check', exact: true }).click();
      await s.getByText(/Project submitted/).waitFor();
      await s.screenshot({ path: `${OUT}/p4-platform-handin.png`, fullPage: true });
    });

    await step('5. Web Lab: live preview and server checks', async () => {
      await s.goto(`${BASE}/catalog?q=web+development`);
      await s.getByRole('button', { name: 'All ages' }).click();
      await s.getByRole('button', { name: /^Lessons \(/ }).click();
      await s.locator('section', { hasText: 'Lessons' }).getByRole('link').first().click();
      await s.getByRole('button', { name: /I’m ready to try/ }).click();
      await s.getByRole('button', { name: /^Activity \d+: Web Lab/ }).click();
      const ed = s.getByLabel('HTML and CSS editor');
      await ed.fill('<style>h1 { color: #b4400a; }</style>\n<h1>My first page</h1>\n<p>This is my very first web page. I love cricket, painting and building things with code!</p>');
      await s.frameLocator('iframe[title="Preview of your web page"]').getByText('My first page').waitFor();
      await s.getByLabel('Reflection').fill('I made a heading and a paragraph and gave the heading an orange colour with CSS so it stands out.');
      await s.getByRole('button', { name: 'Check', exact: true }).click();
      await s.getByText(/Page submitted|Before your teacher/).first().waitFor();
      await s.screenshot({ path: `${OUT}/p5-web-lab.png`, fullPage: true });
    });

    // ── Live class ──
    const t = await newPage();
    shot = t;
    await login(t, 'teacher@kitabash.local', 'Teach#2026');
    await step('6. Teacher starts a live class', async () => {
      await t.getByRole('link', { name: 'Classes' }).click();
      await t.getByRole('button', { name: /Money Smart — Saturday group/ }).click();
      const now = new Date();
      await t.getByLabel('Starts').fill(new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
      await t.getByLabel('Title', { exact: false }).first().fill('Layout check');
      await t.getByRole('button', { name: 'Schedule' }).click();
      await t.locator('li', { hasText: 'Layout check' }).getByRole('button', { name: 'Start class' }).click();
      await t.waitForURL(/\/live\//);
      await t.getByRole('button', { name: 'Start class' }).click();
      await t.getByText('LIVE', { exact: true }).waitFor();
    });
    const st = await newPage();
    await login(st, 'aarav@kitabash.local', 'Learn#2026');
    await step('7. Teacher shares an activity: it opens full screen for the student, teacher video is a tiny floating window', async () => {
      await st.getByRole('button', { name: 'Join', exact: true }).first().click();
      await st.getByRole('button', { name: 'Join class' }).click();
      await st.getByText('LIVE', { exact: true }).waitFor();
      await t.waitForFunction(() => [...document.querySelectorAll('video')].some((v) => !v.muted && v.videoWidth > 0), null, { timeout: 20000 });
      await t.locator('[data-share=activity]').first().click();
      await st.getByTestId('maximized').waitFor();
      await st.getByTestId('class-stage').getByRole('button', { name: 'Check', exact: true }).waitFor();
      await st.waitForTimeout(800);
      const stage = await st.getByTestId('class-stage').boundingBox();
      const pip = await st.getByTestId('pip').boundingBox();
      await st.screenshot({ path: `${OUT}/p6-live-student-activity.png` });
      const vp = st.viewportSize()!;
      if (!stage || !pip || stage.width < vp.width - 2 || stage.height < vp.height - 80 || pip.width > 160) throw new Error(`stage ${stage?.width}×${stage?.height}, pip ${pip?.width}px`);
      const result = `activity fills ${Math.round(stage.width)}×${Math.round(stage.height)}px of ${vp.width}×${vp.height}; teacher video ${Math.round(pip.width)}px floating`;
      await st.getByRole('button', { name: 'Exit full screen' }).click();
      await st.getByRole('button', { name: /Maximize/ }).waitFor();
      await st.screenshot({ path: `${OUT}/p6b-live-student-lesson-big.png` });
      await st.getByRole('tab', { name: /Lesson & worksheet/ }).click();
      await st.locator('aside').getByText('Printable worksheet').waitFor();
      return result;
    });

    await step('8. Teacher sees the resources panel during class', async () => {
      await t.getByRole('tab', { name: 'Resources', exact: true }).first().click();
      await t.locator('aside').getByRole('tab', { name: 'Resources', exact: true }).last().click();
      await t.waitForTimeout(400);
      await t.screenshot({ path: `${OUT}/p7-live-teacher-resources.png` });
      await t.locator('aside').getByRole('tab', { name: 'Teach' }).click();
      await t.locator('aside').getByText('Objective').first().waitFor();
    });

    await step('9. Student shares their screen; teacher can stop it or switch it off', async () => {
      await st.getByRole('button', { name: 'Share screen' }).click();
      await st.getByRole('button', { name: 'Stop sharing' }).waitFor({ timeout: 10000 });
      await t.getByText('· sharing screen').first().waitFor();
      await t.waitForTimeout(1200);
      await t.screenshot({ path: `${OUT}/p8-live-teacher-sees-student-screen.png` });
      await t.getByRole('tab', { name: /People/ }).click();
      await t.getByRole('button', { name: 'Stop share' }).click();
      await st.getByRole('button', { name: 'Share screen' }).waitFor();
      await t.getByLabel(/Students can share their screen/).click();
      await st.getByRole('button', { name: 'Share screen' }).waitFor({ state: 'detached' });
      return 'shared, stopped by teacher, then disabled for the class';
    });
    await t.getByRole('button', { name: 'End class' }).click();
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    console.log(`\n${passed}/9 platform & live-layout checks passed`);
  } finally {
    for (const c of contexts) await c.close().catch(() => {});
    await browser.close();
    server.kill();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
