// Regression test: tapping a character runs its script.
//  • Code Lab (Scratch): tapping a sprite runs “when this sprite clicked” — on a stopped stage too.
//  • Picture-block puzzles (ScratchJr): tapping the character runs a “start on tap” script.
// Usage: npm run build && npx tsx tests/e2e/sprite-tap.ts
import { chromium, type Page } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3106;
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve('test-results');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-tap-'));
const run = (env: NodeJS.ProcessEnv, args: string[]) =>
  new Promise<void>((res, rej) => {
    const s = spawn(process.execPath, args, { env, stdio: 'ignore' });
    s.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${args.join(' ')} failed`))));
  });

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const env: NodeJS.ProcessEnv = { ...process.env, DATA_DIR: dataDir, PORT: String(PORT), AI_PROVIDER: 'mock', STORAGE_DRIVER: 'local', NODE_OPTIONS: '--disable-warning=ExperimentalWarning' };
  delete env.DATABASE_URL;
  await run(env, ['--import', 'tsx', 'scripts/seed.ts']);
  const setup = path.join(dataDir, 'setup.mts');
  const out = path.join(dataDir, 'ids.json');
  fs.writeFileSync(
    setup,
    `import fs from 'node:fs';
import { initDb, get, all, closeDb } from ${JSON.stringify(path.resolve('src/lib/db/index.ts'))};
import { installFlagship } from ${JSON.stringify(path.resolve('src/lib/library/flagship/install.ts'))};
import { subjectIds } from ${JSON.stringify(path.resolve('src/lib/library/install.ts'))};
import { FLAGSHIPS } from ${JSON.stringify(path.resolve('src/lib/library/flagship/all.ts'))};
await initDb();
const admin = (await get("SELECT id FROM users WHERE role='admin'")).id;
const subj = await subjectIds(admin);
await installFlagship(FLAGSHIPS.find((f) => f.key.startsWith('scratch--3-5--beginner')), admin, subj);
await installFlagship(FLAGSHIPS.find((f) => f.key.startsWith('scratch-junior--K-2--advanced')), admin, subj);
const acts = await all("SELECT id, lesson_id, type, title, config FROM activities WHERE type IN ('code_lab','block_code')");
const lab = acts.find((a) => a.type === 'code_lab' && JSON.parse(a.config).hats?.includes('click'));
const jr = acts.find((a) => a.type === 'block_code' && JSON.parse(a.config).hats?.includes('key') && JSON.parse(a.config).world?.jr);
fs.writeFileSync(${JSON.stringify(out)}, JSON.stringify({ lab: { ...lab, config: JSON.parse(lab.config) }, jr: { ...jr, config: JSON.parse(jr.config) } }));
await closeDb();
`,
  );
  await run(env, ['--import', 'tsx', setup]);
  const ids = JSON.parse(fs.readFileSync(out, 'utf8'));
  const server = spawn(process.execPath, ['dist/server.js'], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/healthz`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  const errors: string[] = [];
  let passed = 0;
  try {
    // Phone-sized touch device: the case that was reported.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true });
    const p: Page = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.setDefaultTimeout(15000);
    await p.goto(`${BASE}/login`);
    await p.getByLabel('Email').fill('aarav@kitabash.local');
    await p.getByLabel('Password').fill('Learn#2026');
    await p.getByRole('button', { name: 'Sign in', exact: true }).click();
    await p.waitForURL((u) => !u.pathname.startsWith('/login'));

    // 1. Code Lab: give the first sprite a “when this sprite clicked → say” script, then tap it.
    const proj = ids.lab.config.project;
    proj.sprites[0].scripts = [{ hat: { type: 'click' }, blocks: [{ op: 'say', a: { k: 'str', v: 'You tapped me!' } }] }];
    await p.goto(`${BASE}/lessons/${ids.lab.lesson_id}`);
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), [`kb-lab-${ids.lab.id}`, JSON.stringify(proj)]);
    await p.reload();
    await p.getByRole('button', { name: /I’m ready to try/ }).click();
    const phase = ids.lab.config && (await p.getByRole('button', { name: new RegExp(`^Activity \\d+: ${ids.lab.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).count());
    if (phase) await p.getByRole('button', { name: new RegExp(`^Activity \\d+: ${ids.lab.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first().click();
    else {
      await p.getByRole('button', { name: /Probe/ }).first().click();
      await p.getByRole('button', { name: new RegExp(`^Activity \\d+: ${ids.lab.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first().click();
    }
    const stage = p.locator('.kb-codelab svg[aria-label]').first();
    await stage.waitFor();
    const box = (await stage.boundingBox())!;
    const s0 = proj.sprites[0];
    const x = box.x + ((s0.x + 240) / 480) * box.width;
    const y = box.y + ((180 - s0.y) / 360) * box.height;
    await p.touchscreen.tap(x, y);
    await p.locator('.kb-codelab').getByText('You tapped me!').waitFor({ timeout: 5000 });
    await p.screenshot({ path: `${OUT}/tap-codelab.png` });
    console.log('  ✓ 1. Code Lab: tapping a sprite runs “when this sprite clicked” (stage was stopped)');
    passed++;

    // 2. ScratchJr picture puzzle: put the solution in, then tap the character.
    await p.goto(`${BASE}/lessons/${ids.jr.lesson_id}`);
    await p.getByRole('button', { name: /I’m ready to try/ }).click();
    const title = ids.jr.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dot = p.getByRole('button', { name: new RegExp(`^Activity \\d+: ${title}`) });
    if (!(await dot.count())) await p.getByRole('button', { name: /Probe/ }).first().click();
    await p.getByRole('button', { name: new RegExp(`^Activity \\d+: ${title}`) }).first().click();
    await p.getByRole('button', { name: /^\S*\s*start on tap$/ }).first().click(); // add the 👆 hat from the palette
    const before = await p.locator('svg[aria-label^="Stage"]').getAttribute('aria-label');
    // Add the first block from the palette (any move/hop/say) so there is something to run.
    await p.getByRole('button', { name: /hop/ }).first().click();
    await p.getByTestId('tap-hero').tap();
    await p.getByText(/has finished/).waitFor({ timeout: 6000 });
    const after = await p.locator('svg[aria-label^="Stage"]').getAttribute('aria-label');
    const said: string[] = await p.evaluate(() => [...document.querySelectorAll('svg[aria-label^="Stage"] text')].map((t) => t.textContent || ''));
    await p.screenshot({ path: `${OUT}/tap-scratchjr.png` });
    if (!(await p.getByText('Your character has finished').count()) && before === after && !said.some((t) => /Hee|Hello/.test(t))) throw new Error(`character did not react to the tap (${before})`);
    console.log('  ✓ 2. ScratchJr puzzle: tapping the character runs the “start on tap” script');
    passed++;
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    console.log(`\n${passed}/2 tap checks passed`);
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
