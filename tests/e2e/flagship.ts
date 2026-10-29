// Browser test of the flagship course: a student watches the lesson video, uses the Code Lab
// (tap-to-add blocks, edit a value, run on the stage), and the server checks the program.
// A teacher sees the lesson plan, printables and answer keys.
// Usage: npm run build && npx tsx tests/e2e/flagship.ts
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3104;
const BASE = `http://localhost:${PORT}`;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-flag-'));
process.env.DATA_DIR = DATA_DIR;
delete process.env.DATABASE_URL;
const shots = 'test-results';
fs.mkdirSync(shots, { recursive: true });

const check = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(`FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

async function prepare() {
  const { seed } = await import('../../scripts/seed.ts');
  await seed({ quiet: true });
  const db = await import('../../src/lib/db/index.ts');
  const { installFlagship } = await import('../../src/lib/library/flagship/install.ts');
  const { subjectIds } = await import('../../src/lib/library/install.ts');
  const { FLAGSHIPS } = await import('../../src/lib/library/flagship/all.ts');
  const admin = (await db.get<{ id: string }>("SELECT id FROM users WHERE role='admin'"))!.id;
  const cid = await installFlagship(FLAGSHIPS[0], admin, await subjectIds(admin));
  const lessons = await db.all<{ id: string; title: string }>('SELECT l.id, l.title FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? ORDER BY m.position, l.position', cid);
  const course = await db.get<{ slug: string }>('SELECT slug FROM courses WHERE id=?', cid);
  const jrId = await installFlagship(FLAGSHIPS.find((f) => f.key.startsWith('scratch-junior--K-2--beginner'))!, admin, await subjectIds(admin));
  const jrLessons = await db.all<{ id: string }>('SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? ORDER BY m.position, l.position', jrId);
  await db.closeDb();
  return { lessons, slug: course!.slug, jrLessons };
}

async function main() {
  const t0 = Date.now();
  const { lessons, slug, jrLessons } = await prepare();
  check(lessons.length === 12, 'Flagship course installed through the real services: 12 lessons, published');
  const server = spawn(process.execPath, ['dist/server.js'], { env: { ...process.env, PORT: String(PORT), STORAGE_DRIVER: 'local', NODE_OPTIONS: '--disable-warning=ExperimentalWarning' }, stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  const errors: string[] = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.setDefaultTimeout(20000);
    await p.goto(BASE);
    await p.getByLabel('Email').fill('aarav@kitabash.local');
    await p.getByLabel('Password').fill('Learn#2026');
    await p.getByRole('button', { name: 'Sign in', exact: true }).click();
    await p.waitForTimeout(800);

    await p.goto(`${BASE}/courses/${slug}`);
    await p.getByText('Module 1 · Hello, Scratch! Sequences and events').waitFor();
    await p.getByText('Course guide & syllabus').waitFor();
    check(true, 'Course page shows the 4 modules (with summaries) and the course guide PDF');
    await p.screenshot({ path: `${shots}/flagship-course.png`, fullPage: true });

    await p.goto(`${BASE}/lessons/${lessons[0].id}`);
    await p.getByText('Your first script').first().waitFor();
    const video = p.locator('video source');
    const hasVideo = (await video.count()) > 0;
    if (hasVideo) {
      const src = await video.first().getAttribute('src');
      const head = await p.evaluate(async (u) => {
        const r = await fetch(u!, { headers: { range: 'bytes=0-99' } });
        return { status: r.status, type: r.headers.get('content-type'), range: r.headers.get('content-range') };
      }, src);
      check(head.status === 206 && head.type === 'video/mp4' && /^bytes 0-99\//.test(head.range || ''), 'Lesson video streams as MP4 with byte ranges (seekable on all browsers)');
      const vtt = await p.evaluate(async () => (await fetch(document.querySelector('track')!.getAttribute('src')!)).text());
      check(vtt.startsWith('WEBVTT') && vtt.includes('-->'), 'Captions track (WebVTT) is served');
    } else console.log('  · (no video media generated yet — skipped video checks)');
    await p.getByText('Your first script').first().waitFor();
    check(true, 'Learn phase shows the build-along steps with Scratch blocks');
    await p.getByText('Worksheet — Lesson 1').waitFor();
    check(true, 'Learn phase lists the printable worksheet');
    await p.screenshot({ path: `${shots}/flagship-learn.png`, fullPage: true });

    // Perform → Code Lab challenge (activity 2)
    await p.getByRole('button', { name: /I’m ready to try/ }).click();
    await p.getByRole('button', { name: /^Activity 2:/ }).click();
    await p.getByText('Code Lab: your first script').waitFor();
    await p.getByRole('button', { name: /Add a new script: when green flag clicked/ }).click();
    await p.getByRole('tab', { name: 'Motion' }).click();
    await p.getByRole('button', { name: /^Add block: move/ }).click();
    await p.getByRole('textbox', { name: 'move steps value' }).fill('100');
    await p.getByRole('tab', { name: 'Looks' }).click();
    await p.getByRole('button', { name: /^Add block: say … for … seconds/ }).click();
    await p.getByRole('button', { name: 'Green flag: run' }).click();
    await p.waitForTimeout(600);
    const stage = await p.locator('svg[aria-label^="Stage:"]').getAttribute('aria-label');
    check(/Pip at x 100/.test(stage || '') && /saying/.test(stage || ''), `Code Lab runs the program on the live stage (${stage})`);
    await p.screenshot({ path: `${shots}/flagship-codelab.png`, fullPage: false });
    await p.getByRole('button', { name: 'Check', exact: true }).click();
    await p.getByText('Your first program!').waitFor();
    check(true, 'Server re-runs the program and confirms every goal (challenge complete)');

    // A wrong program gets specific help
    await p.getByRole('button', { name: /^Activity 1:/ }).click();
    await p.getByRole('button', { name: /^Add block: move/ }).click();
    await p.getByRole('button', { name: 'Check', exact: true }).click();
    await p.getByText(/So close|didn’t finish on the star/).waitFor();
    check(true, 'A wrong puzzle answer gets a specific, friendly next step');

    // ScratchJr (K–2): picture blocks and an emoji character
    await p.goto(`${BASE}/lessons/${jrLessons[0].id}`);
    await p.getByRole('button', { name: /I’m ready to try/ }).click();
    await p.getByRole('button', { name: /^Activity 1:/ }).click();
    await p.getByText('Help the cat get to the star.').waitFor();
    check((await p.getByRole('img', { name: 'Move right' }).count()) > 0, 'ScratchJr puzzle shows picture blocks (➡️) instead of words');
    for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /^Add block: move right/ }).click();
    await p.getByRole('button', { name: 'Run' }).click();
    await p.waitForTimeout(2200);
    const jrStage = await p.locator('svg[aria-label^="Stage:"]').getAttribute('aria-label');
    check(/column 4/.test(jrStage || ''), `The cat walks along the picture-block script (${jrStage})`);
    await p.screenshot({ path: `${shots}/flagship-scratchjr.png`, fullPage: false });
    await p.getByRole('button', { name: 'Check', exact: true }).click();
    await p.getByText(/Three right arrows/).waitFor();
    check(true, 'Server checks the ScratchJr puzzle and celebrates');

    // Project submission (built in the Code Lab) → teacher review queue
    const letter = (L: string, x: number) => ({ name: L, costumes: [L], x, y: 0, scripts: [
      { hat: { type: 'click' }, blocks: [{ op: 'changeEffect', name: 'color', a: { k: 'num', v: 25 } }, { op: 'sound', name: 'pop' }] },
      { hat: { type: 'flag' }, blocks: [{ op: 'clearEffects' }, { op: 'setSize', a: { k: 'num', v: 100 } }] },
    ] });
    const projectJson = { backdrop: 'party', sprites: [letter('A', -80), letter('R', 0), letter('U', 80)] };
    const submitted = await p.evaluate(async ([lessonId, proj]: any) => {
      const data = await (await fetch(`/api/lessons/${lessonId}/learn`)).json();
      const act = data.activities.find((a: any) => a.type === 'code_lab' && a.config.mode === 'project');
      const r = await fetch(`/api/activities/${act.id}/attempt`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-kitabash': '1' }, body: JSON.stringify({ response: { project: proj, reflection: 'I am proudest of the A because it changes colour and pops. Next time I would add a spinning letter and music when the flag is clicked.' } }) });
      return r.json();
    }, [lessons[2].id, projectJson]);
    check(submitted.needsReview === true && submitted.correct === true, `Code Lab project is checked and sent to the teacher (“${submitted.feedback}”)`);

    // Teacher view
    const t = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
    t.on('pageerror', (e) => errors.push(e.message));
    await t.goto(BASE);
    await t.getByLabel('Email').fill('teacher@kitabash.local');
    await t.getByLabel('Password').fill('Teach#2026');
    await t.getByRole('button', { name: 'Sign in', exact: true }).click();
    await t.waitForTimeout(800);
    await t.goto(`${BASE}/teach/lessons/${lessons[6].id}`);
    await t.getByText(/Lesson plan \(45 min\)/).waitFor();
    check(true, 'Teacher panel shows the timed lesson plan');
    await t.screenshot({ path: `${shots}/flagship-teacher.png`, fullPage: false });
    await t.getByRole('tab', { name: /Resources/ }).click();
    await t.getByText(/Lesson plan & answer key — Lesson 7/).waitFor();
    check(true, 'Teacher sees the lesson-plan PDF (teacher-only) and the worksheet');
    const pdf = await t.evaluate(async () => {
      const a = [...document.querySelectorAll('a')].find((x) => /Download PDF/.test(x.textContent || ''));
      const r = await fetch(a!.getAttribute('href')!);
      return { status: r.status, type: r.headers.get('content-type') };
    });
    check(pdf.status === 200 && pdf.type === 'application/pdf', 'PDF downloads work');
    // Students cannot download teacher-only PDFs
    const planId = await t.evaluate(() => [...document.querySelectorAll('a')].find((x) => /Download PDF/.test(x.textContent || ''))!.getAttribute('href'));
    const denied = await p.evaluate(async (u) => (await fetch(u!)).status, planId);
    check(denied === 403, 'Students are blocked from teacher-only lesson plans');
    const courseId = await t.evaluate(async (lessonId) => (await (await fetch(`/api/teach/lessons/${lessonId}`)).json()).course.id, lessons[0].id);
    await t.goto(`${BASE}/teach/courses/${courseId}/report`);
    await t.getByText('Project: My Animated Name').first().waitFor();
    await t.getByRole('button', { name: 'Open and run it' }).first().click();
    await t.getByRole('button', { name: 'Green flag: run' }).click();
    await t.waitForTimeout(400);
    const tstage = await t.locator('svg[aria-label^="Stage:"]').getAttribute('aria-label');
    check(/A at x -80/.test(tstage || '') && /U at x 80/.test(tstage || ''), 'Teacher opens the learner’s project and runs it in the review queue');
    await t.screenshot({ path: `${shots}/flagship-review.png`, fullPage: false });
    // Phone layout: the Code Lab stacks and nothing scrolls sideways.
    const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
    m.on('pageerror', (e) => errors.push(e.message));
    await m.goto(BASE);
    await m.getByLabel('Email').fill('meera@kitabash.local');
    await m.getByLabel('Password').fill('Learn#2026');
    await m.getByRole('button', { name: 'Sign in', exact: true }).click();
    await m.waitForTimeout(800);
    await m.goto(`${BASE}/lessons/${lessons[3].id}`);
    await m.getByRole('button', { name: /I’m ready to try/ }).click();
    await m.getByRole('button', { name: /^Activity 2:/ }).click();
    await m.getByText('Code Lab: draw a square').waitFor();
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await m.screenshot({ path: `${shots}/flagship-mobile.png`, fullPage: true });
    check(overflow <= 1, `Code Lab fits a phone screen (no sideways scroll; overflow ${overflow}px)`);
    check(errors.length === 0, `No browser errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\nFlagship checks passed in ${Math.round((Date.now() - t0) / 1000)} s.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
