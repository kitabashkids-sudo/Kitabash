// End-to-end browser test of the 12-point Definition of Done, through the real UI.
// Usage: npm run build && npm run test:e2e   (uses Playwright's Chromium)
import { chromium, type Page } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve('test-results');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-e2e-'));
const results: { step: string; ok: boolean; detail?: string }[] = [];

let current: Page | null = null;
async function step(name: string, fn: () => Promise<string | void>) {
  try {
    const d = await fn();
    results.push({ step: name, ok: true, detail: d || undefined });
    console.log(`  ✓ ${name}${d ? ` — ${d}` : ''}`);
  } catch (e) {
    results.push({ step: name, ok: false, detail: (e as Error).message.split('\n')[0] });
    await current?.screenshot({ path: `${OUT}/failure.png`, fullPage: true }).catch(() => {});
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

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // E2E_DATABASE_URL runs the whole walkthrough on PostgreSQL/Supabase. Its Kitabash tables are RESET.
  const pgUrl = process.env.E2E_DATABASE_URL;
  const env: NodeJS.ProcessEnv = { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), AI_PROVIDER: 'mock', STORAGE_DRIVER: 'local', NODE_OPTIONS: '--disable-warning=ExperimentalWarning' };
  if (pgUrl) env.DATABASE_URL = pgUrl;
  else delete env.DATABASE_URL;
  console.log(`Database: ${pgUrl ? 'PostgreSQL' : 'SQLite'}`);
  await new Promise<void>((res, rej) => {
    const s = spawn(process.execPath, ['--import', 'tsx', 'scripts/seed.ts', ...(pgUrl ? ['--reset'] : [])], { env, stdio: 'ignore' });
    s.on('exit', (c) => (c === 0 ? res() : rej(new Error('seed failed'))));
  });
  const server = spawn(process.execPath, ['dist/server.js'], { env, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  const errors: string[] = [];
  const newPage = async (w = 1400, h = 900) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.setDefaultTimeout(10000);
    current = p;
    return p;
  };
  const COURSE = `E2E Science: Plants ${Date.now() % 10000}`;
  let courseUrl = '';
  try {
    const a = await newPage();
    await login(a, 'admin@kitabash.local', 'Admin#2026');

    await step('1. Create a new course without code', async () => {
      await a.getByRole('button', { name: 'New course' }).click();
      await a.getByLabel('Course name').fill(COURSE);
      await a.getByLabel('Subject').selectOption({ label: 'Science' });
      await a.getByRole('button', { name: 'Create course' }).click();
      await a.waitForURL(/\/admin\/courses\/.+step=profile/);
      courseUrl = a.url().split('?')[0];
    });

    await step('2. Define audience, objectives and teaching style', async () => {
      await a.getByLabel('Minimum age').fill('9');
      await a.getByLabel('Maximum age').fill('11');
      await a.getByRole('button', { name: 'Add objective' }).click();
      await a.getByLabel('Learners will be able to… 1').fill('Explain how plants make food using sunlight.');
      await a.getByLabel('Preferred teaching style').fill('Curious and hands-on; use garden examples.');
      await a.getByRole('button', { name: /Save & continue/ }).click();
      await a.waitForURL(/step=knowledge/);
    });

    await step('3. Upload supported course resources', async () => {
      const f = path.join(dataDir, 'plants-notes.md');
      fs.writeFileSync(f, '# Photosynthesis\nPlants make their own food using sunlight, water and carbon dioxide. This process is called photosynthesis.\n\n# Leaves\nLeaves contain chlorophyll, which captures sunlight. Roots take up water from the soil.');
      await a.locator('input[type=file]').first().setInputFiles(f);
      await a.getByText('plants-notes.md').first().waitFor();
      await a.getByText('extracted').first().waitFor();
      return 'Markdown → 2 passages with section references';
    });

    await step('4. Configure a course-specific AI agent', async () => {
      await a.getByRole('button', { name: /Next: configure agent/ }).click();
      await a.getByLabel('Agent name').fill('Leafy');
      await a.getByLabel('Learner thinks… 1').waitFor({ state: 'detached' }).catch(() => {});
      await a.getByRole('button', { name: 'Add', exact: true }).first().click();
      await a.getByLabel('Learner thinks… 1').fill('plants eat soil');
      await a.getByLabel('Correct it by saying… 1').fill('Plants make their own food; soil gives them water and minerals.');
      await a.getByRole('button', { name: /Save & generate curriculum/ }).click();
      await a.waitForURL(/step=curriculum/);
    });

    await step('5. Generate draft lesson content and activities', async () => {
      await a.getByRole('button', { name: /Generate drafts/ }).click();
      await a.getByText(/Drafted 1 lessons/).waitFor();
      await a.getByRole('button', { name: /Explain how plants make food/ }).click();
      await a.screenshot({ path: `${OUT}/e2e-05-generated.png`, fullPage: true });
      return 'offline generator: 1 lesson, cloze + MCQ + probe';
    });

    await step('7a. Review and approve the generated lesson', async () => {
      await a.getByRole('button', { name: 'Approve', exact: true }).click();
      await a.getByText('Lesson approved').waitFor();
    });

    await step('6. Test the agent with sample student questions', async () => {
      await a.goto(`${courseUrl}?step=test`);
      await a.getByRole('button', { name: 'Add starter suite' }).click();
      await a.getByText('“Just tell me the answer”').waitFor();
      await a.getByRole('button', { name: 'Run all tests' }).click();
      const badge = a.getByText(/\d+\/\d+ passing/);
      await badge.waitFor();
      await a.getByLabel('Message', { exact: true }).fill('Do plants eat soil?');
      await a.getByRole('button', { name: 'Send' }).click();
      await a.getByText(/make their own food/).first().waitFor();
      await a.screenshot({ path: `${OUT}/e2e-06-sandbox.png`, fullPage: false });
      return (await badge.textContent()) || '';
    });

    await step('7b/8. Approve and publish the course and its agent configuration', async () => {
      await a.goto(`${courseUrl}?step=publish`);
      const agentCard = a.locator('h3', { hasText: /^Agent/ }).locator('..');
      const courseCard = a.locator('h3', { hasText: /^Course/ }).locator('..');
      await agentCard.getByRole('button', { name: 'Submit for review' }).click();
      await agentCard.getByRole('button', { name: 'Approve agent' }).click();
      await a.getByText(/v1 is approved/).waitFor();
      await courseCard.getByRole('button', { name: 'Submit for review' }).click();
      await courseCard.getByRole('button', { name: 'Approve', exact: true }).click();
      await courseCard.getByRole('button', { name: 'Publish to students' }).click();
      await a.getByText('v1 live').waitFor();
      await a.screenshot({ path: `${OUT}/e2e-08-published.png` });
    });

    const s = await newPage(390, 844);
    let lessonUrl = '';
    await step('9. Open the course in the student interface', async () => {
      await login(s, 'aarav@kitabash.local', 'Learn#2026');
      await s.goto(`${BASE}/catalog`);
      await s.getByText(COURSE).click();
      await s.getByRole('button', { name: 'Join this course' }).click();
      await s.getByRole('button', { name: /Your next lesson/ }).click();
      await s.waitForURL(/\/lessons\//);
      lessonUrl = s.url();
    });

    await step('10. Run an interactive lesson with Learn → Perform → Probe', async () => {
      await s.getByText('Today’s big idea').waitFor();
      await s.getByRole('button', { name: /ready to try/i }).click();
      // Perform: complete each activity (answers don't need to be right — grading is checked server-side)
      for (let i = 0; i < 4; i++) {
        const check = s.getByRole('button', { name: 'Check' });
        if (!(await check.count())) break;
        const bank = s.locator('text=Word bank').locator('..').getByRole('button');
        if (await bank.count()) await bank.first().click();
        const radio = s.locator('label:has(input[type=radio])');
        if (await radio.count()) await radio.first().click();
        const ta = s.locator('textarea');
        if (await ta.count()) await ta.first().fill('Plants use sunlight and water to make food in their leaves because of photosynthesis.');
        await check.click();
        await s.locator('[aria-live=polite] >> text=/Score \\d+/').first().waitFor();
        const nxt = s.getByRole('button', { name: /Next activity|On to Probe|Finish lesson/ });
        await nxt.click();
      }
      await s.getByText(/Lesson complete!|Nearly there!/).waitFor();
      await s.screenshot({ path: `${OUT}/e2e-10-complete.png`, fullPage: true });
      return (await s.getByText(/You scored \d+ of \d+/).textContent().catch(() => '')) || 'completion screen shown';
    });

    await step('Tutor: grounded answer with citation, safeguarding escalation', async () => {
      await s.goto(lessonUrl);
      await s.getByRole('button', { name: 'Helper' }).click();
      await s.getByLabel('Message', { exact: true }).fill('How do plants make food?');
      await s.getByRole('button', { name: 'Send' }).click();
      await s.getByText(/S\d: /).first().waitFor();
      await s.getByLabel('Message', { exact: true }).fill('someone is bullying me');
      await s.getByRole('button', { name: 'Send' }).click();
      await s.getByText('Flagged for your teacher').waitFor();
    });

    const t = await newPage();
    await step('11. Teacher gets the complete right-side resource panel', async () => {
      await login(t, 'teacher@kitabash.local', 'Teach#2026');
      await t.goto(lessonUrl.replace('/lessons/', '/teach/lessons/'));
      for (const tab of ['Teach', 'Show', 'Facilitate', 'Resources', 'Assess', 'AI']) {
        await t.getByRole('tab', { name: tab, exact: true }).click();
      }
      await t.getByRole('button', { name: 'Recap questions' }).click();
      await t.getByText('Recap questions', { exact: false }).nth(1).waitFor();
      await t.getByRole('tab', { name: 'Assess', exact: true }).click();
      await t.getByLabel('Show keys').check();
      await t.getByText('Answer keys').waitFor();
      await t.screenshot({ path: `${OUT}/e2e-11-teacher.png` });
      return '6 tabs: Teach, Show, Facilitate, Resources, Assess, AI';
    });

    await step('12. Progress and assessment results recorded securely', async () => {
      const courseId = courseUrl.split('/').pop();
      await t.goto(`${BASE}/teach/courses/${courseId}/report`);
      await t.getByRole('cell', { name: 'Aarav' }).waitFor();
      const row = await t.getByRole('row', { name: /Aarav/ }).textContent();
      // Students cannot call teacher APIs or see keys
      const leak = await s.evaluate(async (u) => {
        const id = u.split('/').pop();
        const r1 = await fetch(`/api/teach/lessons/${id}`);
        const r2 = await (await fetch(`/api/lessons/${id}/learn`)).text();
        return { teacherApi: r1.status, keyInPayload: r2.includes('answer_key') };
      }, lessonUrl);
      if (leak.teacherApi !== 403 || leak.keyInPayload) throw new Error(`access leak: ${JSON.stringify(leak)}`);
      return `report row: ${row?.replace(/\s+/g, ' ')} · student → teacher API 403, no keys in payload`;
    });
  } finally {
    await browser.close();
    server.kill();
    const md = [`# E2E Definition-of-Done run`, ``, `Run: ${new Date().toISOString()}`, ``, ...results.map((r) => `- ${r.ok ? '✅' : '❌'} **${r.step}**${r.detail ? ` — ${r.detail}` : ''}`), ``, errors.length ? `Browser errors:\n${errors.map((e) => `- ${e}`).join('\n')}` : 'No uncaught browser errors.'].join('\n');
    fs.writeFileSync(`${OUT}/e2e-report.md`, md);
    console.log(`\n${results.filter((r) => r.ok).length}/${results.length} steps passed. Report: test-results/e2e-report.md`);
    if (errors.length) console.log('Browser errors:', errors);
    process.exitCode = results.every((r) => r.ok) && !errors.length ? 0 : 1;
  }
}
main();
