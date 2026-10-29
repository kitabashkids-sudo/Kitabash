// Generates the flagship course media into library-media/<course>/:
//   npm run media:flagship -- docs     → course guide, lesson plans (+answer keys), worksheets, project briefs (PDF)
//   npm run media:flagship -- videos   → lesson explainer videos (MP4) with captions (VTT)
// Needs Chromium (Playwright) and, for videos, ffmpeg. Developer tool: the app itself doesn't need it.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { FLAGSHIPS } from '../src/lib/library/flagship/all.ts';
import { captionsVtt, expandFlagLesson, flagshipTitle, lessonNumber, lessonsOf, sceneTimings } from '../src/lib/library/flagship/expand.ts';
import { mediaDir } from '../src/lib/library/flagship/install.ts';
import type { FlagshipCourse, FlagshipLesson, Scene } from '../src/lib/library/flagship/types.ts';
import { renderBlocks } from '../src/lib/scratch/blocks.ts';
import { programToBlocks, run as runPuzzle, toScratch, type World, type Frame } from '../src/lib/scratch/puzzle.ts';
import { projectToBlocks } from '../src/lib/scratch/vm.ts';

const require = createRequire(import.meta.url);
function playwright() {
  try {
    return require('playwright');
  } catch {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const blocks = (src: string, scale = 1) => renderBlocks(src, { scale }).svg;

// ── Grid drawings (worksheets) and robot stages (videos) ───
function gridSvg(w: World, cell = 46, frame?: Frame, opts: { robot?: boolean } = {}) {
  const pad = w.coords ? 34 : 6;
  const W = w.cols * cell + pad + 6;
  const H = w.rows * cell + (w.coords ? 22 : 6) + 6;
  const out: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="system-ui, sans-serif">`];
  const walls = new Set((w.walls || []).map((c) => c.join(',')));
  const painted = new Set(frame?.painted || []);
  const target = new Set((w.paint || []).map((c) => c.join(',')));
  for (let r = 0; r < w.rows; r++)
    for (let c = 0; c < w.cols; c++) {
      const k = `${c},${r}`;
      const x = pad + c * cell;
      const y = 6 + r * cell;
      out.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${walls.has(k) ? '#b5654a' : painted.has(k) ? '#0FBD8C' : (c + r) % 2 ? '#f4f6fb' : '#ffffff'}" stroke="#c9d0de"/>`);
      if (target.has(k) && !painted.has(k)) out.push(`<rect x="${x + 4}" y="${y + 4}" width="${cell - 8}" height="${cell - 8}" rx="6" fill="none" stroke="#0FBD8C" stroke-width="2" stroke-dasharray="5 4"/>`);
    }
  const center = (c: number, r: number) => [pad + c * cell + cell / 2, 6 + r * cell + cell / 2];
  if (w.goal) {
    const [x, y] = center(w.goal[0], w.goal[1]);
    out.push(`<text x="${x}" y="${y + cell * 0.18}" font-size="${cell * 0.55}" text-anchor="middle">⭐</text>`);
  }
  for (const g of frame ? frame.gems.map((k) => k.split(',').map(Number)) : w.gems || []) {
    const [x, y] = center(g[0], g[1]);
    out.push(`<text x="${x}" y="${y + cell * 0.16}" font-size="${cell * 0.45}" text-anchor="middle">💎</text>`);
  }
  const st: { x: number; y: number; dir: Frame["dir"]; size?: number; hidden?: boolean } = frame || { x: w.start.x, y: w.start.y, dir: w.start.dir };
  const [sx, sy] = center(st.x, st.y);
  const deg = { N: 0, E: 90, S: 180, W: 270 }[st.dir];
  if (w.hero) out.push(`<g transform="translate(${sx} ${sy})" opacity="${st.hidden ? 0.15 : 1}"><text y="${cell * 0.2}" font-size="${cell * 0.66 * (1 + 0.25 * (st.size || 0))}" text-anchor="middle">${w.hero}</text></g>`);
  else if (opts.robot) out.push(`<g transform="translate(${sx} ${sy})"><text y="${cell * 0.18}" font-size="${cell * 0.6}" text-anchor="middle">🤖</text><g transform="rotate(${deg})"><path d="M0 ${-cell * 0.5} l7 10 h-14z" fill="#e5484d"/></g></g>`);
  else out.push(`<g transform="translate(${sx} ${sy}) rotate(${deg})"><path d="M0 -15 L11 9 L0 3 L-11 9 Z" fill="#9966FF" stroke="#5b3cc4" stroke-width="1.5"/></g>`);
  if (w.coords) {
    for (let c = 0; c < w.cols; c++) out.push(`<text x="${pad + c * cell + cell / 2}" y="${H - 4}" font-size="10" fill="#6b7280" text-anchor="middle">x ${toScratch(w, c, 0).x}</text>`);
    for (let r = 0; r < w.rows; r++) out.push(`<text x="2" y="${6 + r * cell + cell / 2 + 3}" font-size="10" fill="#6b7280">y ${toScratch(w, 0, r).y}</text>`);
  }
  out.push('</svg>');
  return out.join('');
}

// ── Shared print CSS ───────────────────────────────────────
const CSS = `
@page { size: A4; margin: 16mm 14mm 18mm; }
* { box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; color: #1d2230; font-size: 11pt; line-height: 1.45; margin: 0; }
h1 { font-size: 22pt; margin: 0 0 4pt; line-height: 1.15; }
h2 { font-size: 13.5pt; margin: 16pt 0 6pt; color: #5b3cc4; border-bottom: 2px solid #ece6ff; padding-bottom: 3pt; break-after: avoid; }
h3 { font-size: 11.5pt; margin: 10pt 0 4pt; break-after: avoid; }
p { margin: 0 0 6pt; }
.eyebrow { font-size: 9pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #9966FF; }
.meta { display: flex; flex-wrap: wrap; gap: 6pt; margin: 6pt 0 10pt; }
.chip { background: #f1ecff; color: #4b2fa8; border-radius: 99px; padding: 2pt 9pt; font-size: 9pt; font-weight: 700; }
.box { border: 1.5px solid #e3e6ee; border-radius: 10pt; padding: 8pt 10pt; margin: 6pt 0; break-inside: avoid; }
.box.accent { background: #f7f4ff; border-color: #ddd2ff; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 10pt; }
th, td { border: 1px solid #e3e6ee; padding: 5pt 6pt; vertical-align: top; text-align: left; }
th { background: #f7f4ff; }
ul, ol { margin: 2pt 0 6pt 16pt; padding: 0; }
li { margin: 1.5pt 0; }
.lines div { border-bottom: 1px solid #c9d0de; height: 22pt; }
.task { break-inside: avoid; margin: 10pt 0; }
.task h3 { margin-top: 0; }
.namebar { display: flex; gap: 14pt; font-size: 10pt; margin: 6pt 0 12pt; }
.namebar span { flex: 1; border-bottom: 1px solid #9aa3b8; padding-bottom: 2pt; }
.blocks svg { max-width: 100%; height: auto; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
.check { display: inline-block; width: 11pt; height: 11pt; border: 1.5px solid #5b3cc4; border-radius: 3pt; margin-right: 6pt; vertical-align: -1pt; }
.small { font-size: 9pt; color: #5b6275; }
.keyline { font-size: 10pt; }
pre.code { font: 9pt/1.4 ui-monospace, Menlo, monospace; background: #f4f5f9; border: 1px solid #dde1ea; border-radius: 6px; padding: 6px 8px; white-space: pre-wrap; }
.pagebreak { break-before: page; }
`;
const doc = (title: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
const lines = (n: number) => `<div class="lines">${'<div></div>'.repeat(n)}</div>`;
const list = (xs: string[]) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

function header(c: FlagshipCourse, l: FlagshipLesson | null, kind: string) {
  const n = l ? lessonNumber(c, l) : 0;
  const mod = l ? c.modules.find((m) => m.lessons.includes(l)) : null;
  return `<div class="eyebrow">${esc(kind)} · ${esc(flagshipTitle(c))}</div><h1>${l ? `Lesson ${n}: ${esc(l.title)}` : esc(c.title)}</h1>${
    l ? `<div class="meta"><span class="chip">${esc(mod?.title.split('·')[0].trim() || '')}</span><span class="chip">${l.minutes} minutes</span><span class="chip">${esc(l.concept)}</span><span class="chip">${esc(c.grade)} · ages ${c.ages[0]}–${c.ages[1]}</span></div>` : ''
  }`;
}

function rubricTable(rubric: { criterion: string; levels: readonly string[] }[]) {
  return `<table><tr><th style="width:20%">Criterion</th><th>1 · Beginning</th><th>2 · Developing</th><th>3 · Secure</th><th>4 · Excellent</th></tr>${rubric.map((r) => `<tr><th>${esc(r.criterion)}</th>${r.levels.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
}

function answerKey(c: FlagshipCourse, l: FlagshipLesson) {
  const L = expandFlagLesson(c, l);
  return L.activities
    .map((a: any, i: number) => {
      const k = a.answer_key;
      let ans = '';
      if (a.type === 'multiple_choice') {
        const opt = a.config.options.find((o: any) => o.id === k.correct[0]);
        ans = `<p class="keyline"><b>Answer:</b> ${esc(opt?.text || '')}</p>${opt?.blocks ? `<div class="blocks">${blocks(opt.blocks, 0.75)}</div>` : ''}`;
      } else if (a.type === 'ordering') ans = `<p class="keyline"><b>Order:</b> ${k.order.map((id: string) => esc(a.config.items.find((x: any) => x.id === id).text)).join(' → ')}</p>`;
      else if (a.type === 'matching') ans = `<p class="keyline">${a.config.left.map((x: any) => `${esc(x.text)} → ${esc(a.config.right.find((r: any) => r.id === k.pairs[x.id]).text)}`).join(' · ')}</p>`;
      else if (a.type === 'categorize') ans = `<p class="keyline">${a.config.buckets.map((b: any) => `<b>${esc(b.label)}:</b> ${a.config.items.filter((x: any) => k.placement[x.id] === b.id).map((x: any) => esc(x.text)).join(', ')}`).join('<br>')}</p>`;
      else if (a.type === 'fill_blank') ans = `<p class="keyline"><b>Answers:</b> ${Object.values(k.blanks).map((x: any) => esc(x[0])).join(' · ')}</p>`;
      else if (a.type === 'free_response') ans = `<p class="keyline"><b>Look for:</b> ${esc((k.keywords || []).join(', '))}. <b>Example:</b> ${esc(k.exemplar)}</p>`;
      else if (a.type === 'block_code') ans = `<p class="keyline"><b>One solution:</b></p><div class="blocks">${blocks(programToBlocks(k.solution, !!a.config?.world?.jr), 0.75)}</div>`;
      else if (a.type === 'python_lab') ans = `<p class="keyline"><b>Goals checked:</b> ${esc(a.config.goals.join(' · '))}</p><p class="keyline"><b>${a.config.mode === 'project' ? 'Example program' : 'One solution'}:</b></p><pre class="code">${esc(k.solution)}</pre>`;
      else if (a.type === 'code_lab') ans = `<p class="keyline"><b>Goals checked:</b> ${esc(a.config.goals.join(' · '))}</p><p class="keyline"><b>${a.config.mode === 'project' ? 'Example project' : 'One solution'}:</b></p>${projectToBlocks(k.solution).map((s) => `<p class="small"><b>${esc(s.sprite)}</b></p><div class="blocks">${blocks(s.blocks, 0.7)}</div>`).join('')}`;
      return `<div class="box"><p><b>${i + 1}. ${esc(a.title)}</b> <span class="small">(${a.phase} · ${esc(a.type.replace('_', ' '))})</span></p>${ans}</div>`;
    })
    .join('');
}

function lessonPlanHtml(c: FlagshipCourse, l: FlagshipLesson) {
  const t = l.teacher;
  const n = lessonNumber(c, l);
  return doc(
    `Lesson ${n} plan`,
    `${header(c, l, 'Lesson plan')}
<div class="box accent"><p><b>Objective:</b> ${esc(l.objective)}</p><p><b>Success criteria</b></p>${list(t.successCriteria)}</div>
<div class="two"><div><h2>Key vocabulary</h2><ul>${t.vocab.map(([a, b]) => `<li><b>${esc(a)}</b>: ${esc(b)}</li>`).join('')}</ul></div>
<div><h2>You will need</h2><ul><li>Projector with Kitabash (lesson video, Code Lab)</li><li>Devices: 1 per learner or pair</li><li>Printed worksheet (optional)</li>${l.project ? '<li>Printed project brief</li>' : ''}</ul></div></div>
<h2>Timed lesson plan (${l.minutes} min)</h2>
<table><tr><th style="width:12%">Time</th><th style="width:22%">Stage</th><th>What happens</th></tr>${t.plan.map((p) => `<tr><td>${p.minutes} min</td><td><b>${esc(p.stage)}</b></td><td>${esc(p.doing)}</td></tr>`).join('')}</table>
<h2>Unplugged warm-up</h2><p>${esc(t.unplugged)}</p>
<h2>Teaching the idea</h2><p>${esc(t.explain)}</p><p><b>Analogy:</b> ${esc(t.analogy)}</p><p><b>Live demo:</b> ${esc(t.demo)}</p>
<h2>Questions to ask</h2><table><tr><th>Ask</th><th>Listen for</th></tr>${t.prompts.map(([q, a]) => `<tr><td>${esc(q)}</td><td>${esc(a)}</td></tr>`).join('')}</table>
<h2>Differentiation</h2><div class="two"><div class="box"><b>Support</b><p>${esc(t.support)}</p></div><div class="box"><b>Stretch</b><p>${esc(t.stretch)}</p></div></div>
<h2>Common misconceptions</h2><table><tr><th>Misconception</th><th>How to fix it</th></tr>${t.mis.map(([m, f]) => `<tr><td>${esc(m)}</td><td>${esc(f)}</td></tr>`).join('')}</table>
<h2>Assessment</h2>${l.project ? `<p>Project rubric (also on the project brief):</p>${rubricTable(l.project.rubric)}` : '<p>Use the Code Lab results (auto-checked), the quick checks and the Probe answers. Written answers arrive in your review queue.</p>'}
<div class="two"><div class="box"><b>Exit ticket</b><p>${esc(t.exit)}</p></div><div class="box"><b>Homework</b><p>${esc(t.homework)}</p></div></div>
<h2 class="pagebreak">Answer key — Kitabash activities</h2>${answerKey(c, l)}
<h2>Answer key — worksheet</h2><ol>${l.worksheet.tasks.map((x) => `<li><b>${esc(x.heading.replace(/^\d+\.\s*/, ''))}:</b> ${esc(x.answer)}</li>`).join('')}</ol>
<p class="small">Kitabash original curriculum. Scratch is a project of the Scratch Foundation in collaboration with the MIT Media Lab; this course is not affiliated with or endorsed by them.</p>`,
  );
}

function worksheetHtml(c: FlagshipCourse, l: FlagshipLesson) {
  const w = l.worksheet;
  return doc(
    w.title,
    `${header(c, l, 'Worksheet')}<div class="namebar"><span>Name:</span><span>Class:</span><span>Date:</span></div><p>${esc(w.intro)}</p>
${w.tasks
  .map(
    (x) => `<div class="task box"><h3>${esc(x.heading)}</h3><p>${esc(x.instructions)}</p>${x.blocks ? `<div class="blocks">${blocks(x.blocks, 0.85)}</div>` : ''}${x.grid ? `<div>${gridSvg(x.grid.world, 44)}</div>` : ''}${x.items ? `<ol type="a">${x.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>` : ''}${x.lines ? lines(x.lines) : ''}</div>`,
  )
  .join('')}
<div class="box accent"><b>How did it go?</b> Colour a face: 😀 I can do it · 🙂 Nearly there · 🤔 I need help<br><span class="small">${l.teacher.successCriteria.map((s) => '□ ' + esc(s)).join('<br>')}</span></div>`,
  );
}

function projectHtml(c: FlagshipCourse, l: FlagshipLesson) {
  const p = l.project!;
  return doc(
    `Project brief: ${p.title}`,
    `${header(c, l, 'Project brief')}<div class="namebar"><span>Name:</span><span>Class:</span><span>Date:</span></div>
<div class="box accent"><b>Your mission</b><p>${esc(p.brief)}</p></div>
<h2>Checklist</h2><p>${p.requirements.map((r) => `<span class="check"></span>${esc(r)}`).join('<br>')}</p>
<h2>Milestones</h2><ol>${p.milestones.map((m) => `<li>${esc(m)} <span class="small">— done on: ________</span></li>`).join('')}</ol>
<h2>Plan it</h2><p>Sketch your stage and write what each sprite will do.</p>${lines(8)}
<h2>How it will be marked</h2>${rubricTable(p.rubric)}
<h2>Want more?</h2>${list(p.extensions)}
<h2>Two stars and a wish</h2><p class="small">Ask a friend to test your project.</p>⭐ ${lines(1)}⭐ ${lines(1)}🪄 ${lines(1)}`,
  );
}

function guideHtml(c: FlagshipCourse) {
  const ls = lessonsOf(c);
  return doc(
    `${c.title} — course guide`,
    `<div class="eyebrow">Course guide & syllabus · ${esc(c.grade)} · ages ${c.ages[0]}–${c.ages[1]}</div><h1>${esc(flagshipTitle(c))}</h1><p style="font-size:13pt">${esc(c.tagline)}</p>
<div class="box accent"><p>${esc(c.description)}</p></div>
<h2>What learners will be able to do</h2>${list(c.outcomes)}
<h2>How every lesson works</h2><table>
<tr><th>Watch</th><td>A short animated explainer video with captions (and an optional read-aloud).</td></tr>
<tr><th>Learn</th><td>Learn cards with the real coding blocks, and a step-by-step build-along.</td></tr>
<tr><th>Try it (Code Lab)</th><td>Code in the built-in Scratch-style Code Lab with a live stage. Challenges are checked automatically and give a clear next step; hints unlock one at a time.</td></tr>
<tr><th>Puzzles & quick checks</th><td>Robot puzzles and questions that build understanding, with instant feedback.</td></tr>
<tr><th>Probe</th><td>Debugging and “new situation” tasks to show real understanding.</td></tr>
<tr><th>Projects</th><td>Each module ends with a creative project built in the Code Lab and reviewed by the teacher with a rubric.</td></tr>
<tr><th>Printables</th><td>A worksheet for every lesson, a project brief for every project, and a lesson plan with answer keys for the teacher.</td></tr></table>
<h2>Scope and sequence</h2><table><tr><th>#</th><th>Lesson</th><th>Big idea</th><th>Learners build</th></tr>${ls
      .map((l, i) => `<tr><td>${i + 1}</td><td><b>${esc(l.title)}</b><br><span class="small">${esc(l.objective)}</span></td><td>${esc(l.concept)}</td><td>${esc(l.project ? `Project: ${l.project.title}` : l.build?.title || '')}</td></tr>`)
      .join('')}</table>
<h2>Modules</h2>${c.modules.map((m) => `<div class="box"><b>${esc(m.title)}</b><p>${esc(m.summary)}</p><p class="small">Big question: ${esc(m.bigQuestion)}</p></div>`).join('')}
<h2>Assessment</h2><p>Coding challenges are checked on the server by running the learner’s program. Quick checks give instant feedback. Written answers and the four projects are reviewed by the teacher against 4-level rubrics (Beginning · Developing · Secure · Excellent).</p>
<h2>What you need</h2>${list(c.tools)}
<h2>Before you start</h2>${list(c.prereq)}
<h2>Safety and privacy</h2><p>${esc(c.safety)}</p>
<h2>What comes next</h2><p>After this course: <b>${esc(c.nextCourse)}</b>, which goes deeper into clones, custom blocks, lists and bigger games.</p>
<p class="small">Kitabash original curriculum. Scratch is a project of the Scratch Foundation in collaboration with the MIT Media Lab; this course is not affiliated with or endorsed by them.</p>`,
  );
}

async function makeDocs(c: FlagshipCourse) {
  const dir = mediaDir(c);
  fs.mkdirSync(dir, { recursive: true });
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pdf = async (html: string, name: string) => {
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: path.join(dir, name), format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: `<div style="font-size:8px;color:#8a90a2;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>Kitabash · ${esc(c.title)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`, margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
    console.log('  ✓', name);
  };
  await pdf(guideHtml(c), 'course-guide.pdf');
  for (const l of lessonsOf(c)) {
    const nn = String(lessonNumber(c, l)).padStart(2, '0');
    await pdf(lessonPlanHtml(c, l), `l${nn}-plan.pdf`);
    await pdf(worksheetHtml(c, l), `l${nn}-worksheet.pdf`);
    if (l.project) await pdf(projectHtml(c, l), `l${nn}-project.pdf`);
  }
  await browser.close();
}

// ── Videos ────────────────────────────────────────────────
const VW = 1280;
const VH = 720;
const FPS = 15;

function videoPage(c: FlagshipCourse, l: FlagshipLesson) {
  const { lines: cues, duration } = sceneTimings(l);
  const n = lessonNumber(c, l);
  // Scene windows from caption timing.
  const windows = l.video.scenes.map((_, si) => {
    const mine = cues.filter((x) => x.scene === si);
    return { start: mine[0].start - 0.5, end: mine[mine.length - 1].end + 0.6, cues: mine };
  });
  const sceneData = l.video.scenes.map((s: Scene, si) => {
    const base = { kind: s.kind, heading: 'heading' in s ? s.heading : '', start: windows[si].start, end: windows[si].end, cues: windows[si].cues.map((x) => x.start) };
    switch (s.kind) {
      case 'title':
        return { ...base, title: s.title, subtitle: s.subtitle || '' };
      case 'bullets':
        return { ...base, bullets: s.bullets };
      case 'blocks':
        return { ...base, svg: renderBlocks(s.blocks, { scale: 2.1 }).svg, note: s.note || '' };
      case 'compare':
        return { ...base, left: { ...s.left, svg: renderBlocks(s.left.blocks, { scale: 1.45 }).svg }, right: { ...s.right, svg: renderBlocks(s.right.blocks, { scale: 1.45 }).svg } };
      case 'recap':
        return { ...base, points: s.points };
      case 'tour':
        return { ...base };
      case 'card':
        return { ...base, emoji: s.emoji, body: s.body };
      case 'code':
        return { ...base, code: s.code, output: s.output || '' };
      case 'stage': {
        const r = runPuzzle(s.world, s.program, { goal: !!s.world.goal });
        return { ...base, svg: renderBlocks(programToBlocks(s.program, !!s.world.jr), { scale: 1.7 }).svg, frames: r.frames.map((f) => gridSvg(s.world, Math.min(110, Math.floor(430 / Math.max(s.world.cols, s.world.rows))), f, { robot: true })) };
      }
    }
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${VW}px;height:${VH}px;overflow:hidden;font-family:'Helvetica Neue',Arial,'Noto Sans',sans-serif;background:#fbf8ff;color:#1d2230}
  #bg{position:absolute;inset:0;background:radial-gradient(circle at 85% 15%,#efe6ff 0,transparent 40%),radial-gradient(circle at 10% 90%,#e6f3ff 0,transparent 45%)}
  #top{position:absolute;left:48px;right:48px;top:28px;display:flex;justify-content:space-between;align-items:center;font-weight:800;color:#7b5cf0;font-size:20px;letter-spacing:.02em}
  #prog{position:absolute;left:0;bottom:0;height:8px;background:#9966FF}
  #stage{position:absolute;left:48px;right:48px;top:76px;bottom:96px}
  #cap{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);max-width:1100px;background:rgba(29,34,48,.88);color:#fff;font-size:30px;font-weight:600;line-height:1.3;padding:10px 22px;border-radius:14px;text-align:center}
  .h{font-size:50px;font-weight:900;margin:0 0 20px;line-height:1.05}
  .fade{transition:none}
  .bullet{display:flex;align-items:center;gap:22px;font-size:40px;font-weight:700;margin:20px 0;background:#fff;border-radius:22px;padding:18px 26px;box-shadow:0 4px 0 rgba(0,0,0,.06)}
  .bullet span{font-size:52px}
  .card{background:#fff;border-radius:26px;padding:24px;box-shadow:0 6px 0 rgba(0,0,0,.06)}
  .card svg{max-height:430px;max-width:100%;width:auto;height:auto;display:block}
  .cmp svg{max-height:300px}
  .note{font-size:28px;font-weight:700;color:#5b3cc4;margin-top:22px}
  .mark{font-size:56px;font-weight:900}
  .tour{position:relative;width:1184px;height:440px;border-radius:22px;background:#e9edf5;overflow:hidden}
  .zone{position:absolute;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#fff;transition:none}
  </style></head><body><div id="bg"></div><div id="top"><span>Kitabash · ${esc(c.title)}</span><span>Lesson ${n}</span></div><div id="stage"></div><div id="cap"></div><div id="prog"></div>
  <script>
  const S=${JSON.stringify(sceneData)};const D=${duration};const CUES=${JSON.stringify(cues.map((x) => ({ s: x.start, e: x.end, t: x.text })))};const capEl=document.getElementById('cap');
  const st=document.getElementById('stage');const pr=document.getElementById('prog');
  const e=(t)=>Math.max(0,Math.min(1,t));const ease=(t)=>1-Math.pow(1-e(t),3);
  let cur=-1,built=null;
  function build(s){
    if(s.kind==='title'){st.innerHTML='<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div id="t1" style="font-size:96px;font-weight:900;line-height:1">'+s.title+'</div><div id="t2" style="font-size:36px;font-weight:700;color:#7b5cf0;margin-top:22px">'+s.subtitle+'</div><div id="t3" style="margin-top:46px;display:flex;gap:16px">'+['#FFBF00','#4C97FF','#9966FF','#FFAB19','#59C059','#FF8C1A'].map(c=>'<div style="width:90px;height:44px;border-radius:12px;background:'+c+'"></div>').join('')+'</div></div>';}
    else if(s.kind==='bullets'){st.innerHTML='<div class="h">'+s.heading+'</div>'+s.bullets.map((b,i)=>'<div class="bullet" id="b'+i+'"><span>'+b.icon+'</span>'+b.text+'</div>').join('');}
    else if(s.kind==='blocks'){st.innerHTML='<div class="h">'+s.heading+'</div><div style="display:flex;gap:40px;align-items:flex-start"><div class="card" id="bk">'+s.svg+'</div>'+(s.note?'<div class="note" id="nt" style="max-width:420px">'+s.note+'</div>':'')+'</div>';}
    else if(s.kind==='compare'){st.innerHTML='<div class="h">'+s.heading+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:36px">'+[s.left,s.right].map((x,i)=>'<div class="card cmp" id="c'+i+'" style="border:5px solid '+(x.good?'#30a46c':'#e5484d')+'"><div style="display:flex;justify-content:space-between;align-items:center;font-size:28px;font-weight:800;margin-bottom:12px">'+x.label+'<span class="mark" style="color:'+(x.good?'#30a46c':'#e5484d')+'">'+(x.good?'✓':'✗')+'</span></div>'+x.svg+'</div>').join('')+'</div>';}
    else if(s.kind==='recap'){st.innerHTML='<div class="h">'+s.heading+'</div>'+s.points.map((p,i)=>'<div class="bullet" id="r'+i+'"><span>✅</span>'+p+'</div>').join('');}
    else if(s.kind==='tour'){const z=[['Stage','#4C97FF',820,20,344,220],['Sprites','#9966FF',820,256,344,164],['Block palette','#FFAB19',20,20,250,400],['Code area','#59C059',290,20,510,400]];st.innerHTML='<div class="h">'+s.heading+'</div><div class="tour">'+z.map((q,i)=>'<div class="zone" id="z'+i+'" style="left:'+q[2]+'px;top:'+q[3]+'px;width:'+q[4]+'px;height:'+q[5]+'px;background:'+q[1]+'">'+q[0]+'</div>').join('')+'</div>';}
    else if(s.kind==='card'){st.innerHTML='<div style="display:flex;gap:44px;align-items:center;height:100%"><div id="em" style="font-size:190px;line-height:1">'+s.emoji+'</div><div><div class="h">'+s.heading+'</div><div id="bd" style="font-size:36px;line-height:1.35;font-weight:600;max-width:820px">'+s.body.replace(/</g,'&lt;')+'</div></div></div>';}
    else if(s.kind==='code'){st.innerHTML='<div class="h">'+s.heading+'</div><div style="display:flex;gap:30px;align-items:flex-start"><pre id="cd" style="margin:0;background:#1d2230;color:#e8ecf5;border-radius:22px;padding:26px 30px;font:600 30px/1.45 ui-monospace,Menlo,monospace;max-width:760px;white-space:pre-wrap">'+s.code.replace(/</g,'&lt;')+'</pre>'+(s.output?'<div id="op" class="card" style="font:600 28px/1.4 ui-monospace,monospace;min-width:300px"><div style="font:800 18px sans-serif;color:#7b5cf0;margin-bottom:8px">OUTPUT</div><pre style="margin:0;white-space:pre-wrap">'+s.output.replace(/</g,'&lt;')+'</pre></div>':'')+'</div>';}
    else if(s.kind==='stage'){st.innerHTML='<div class="h">'+s.heading+'</div><div style="display:flex;gap:40px;align-items:flex-start"><div class="card">'+s.svg+'</div><div class="card" id="grid"></div></div>';}
  }
  window.draw=function(t){
    pr.style.width=(t/D*100)+'%';
    const cue=CUES.find(q=>t>=q.s&&t<q.e); capEl.textContent=cue?cue.t:''; capEl.style.display=cue?'block':'none';
    let i=S.findIndex(s=>t>=s.start&&t<s.end); if(i<0) i=t<S[0].start?0:S.length-1;
    const s=S[i]; if(i!==cur){cur=i;build(s);}
    const lt=t-s.start; const c=s.cues; const at=(k)=>c[Math.min(k,c.length-1)]-s.start;
    st.style.opacity=e(lt/0.4)*e((s.end-t)/0.3+0.2);
    if(s.kind==='title'){['t1','t2','t3'].forEach((id,k)=>{const el=document.getElementById(id);const p=ease((lt-k*0.35)/0.6);el.style.opacity=p;el.style.transform='translateY('+(30*(1-p))+'px)';});}
    if(s.kind==='bullets'){s.bullets.forEach((b,k)=>{const el=document.getElementById('b'+k);const when=k<c.length?at(k):at(c.length-1)+(k-c.length+1)*0.8;const p=ease((lt-Math.max(0.2,when))/0.5);el.style.opacity=p;el.style.transform='translateX('+(40*(1-p))+'px)';});}
    if(s.kind==='recap'){s.points.forEach((b,k)=>{const el=document.getElementById('r'+k);const p=ease((lt-0.3-k*0.7)/0.5);el.style.opacity=p;el.style.transform='scale('+(0.9+0.1*p)+')';});}
    if(s.kind==='blocks'){const el=document.getElementById('bk');const p=ease((lt-0.2)/0.7);el.style.opacity=p;el.style.transform='translateY('+(30*(1-p))+'px)';const nt=document.getElementById('nt');if(nt){const q=ease((lt-at(Math.min(1,c.length-1)))/0.6);nt.style.opacity=q;}}
    if(s.kind==='compare'){[0,1].forEach(k=>{const el=document.getElementById('c'+k);const p=ease((lt-0.2-k*Math.max(0.8,at(1)-0.3))/0.6);el.style.opacity=p;el.style.transform='translateY('+(30*(1-p))+'px)';});}
    if(s.kind==='tour'){[0,1,2,3].forEach(k=>{const el=document.getElementById('z'+k);const on=lt>=at(k+1)-0.2;el.style.opacity=on?1:0.25;el.style.transform=on&&lt<at(k+1)+1.2?'scale(1.04)':'scale(1)';el.style.boxShadow=on&&lt<at(k+1)+1.2?'0 0 0 8px rgba(255,255,255,.9)':'none';});}
    if(s.kind==='card'){const em=document.getElementById('em');const p=ease((lt-0.1)/0.6);em.style.transform='scale('+(0.6+0.4*p)+') rotate('+(-12*(1-p))+'deg)';em.style.opacity=p;const bd=document.getElementById('bd');bd.style.opacity=ease((lt-0.5)/0.6);}
    if(s.kind==='code'){const cd=document.getElementById('cd');const lines=s.code.split('\\n');const shown=Math.max(1,Math.min(lines.length,Math.floor((lt-0.3)/Math.max(0.5,(at(Math.min(1,c.length-1))+1)/lines.length))+1));cd.textContent=lines.slice(0,shown).join('\\n');const op=document.getElementById('op');if(op){op.style.opacity=ease((lt-at(c.length-1))/0.6);}}
    if(s.kind==='stage'){const g=document.getElementById('grid');const startRun=at(Math.min(1,c.length-1));const per=Math.max(0.35,Math.min(0.9,(s.end-s.start-startRun-1.5)/s.frames.length));const k=Math.max(0,Math.min(s.frames.length-1,Math.floor((lt-startRun)/per)));if(g.dataset.k!=String(k)){g.innerHTML=s.frames[k];g.dataset.k=k;}}
  };
  </script></body></html>`;
  return { html, duration };
}

async function makeVideos(c: FlagshipCourse, only?: number) {
  const dir = mediaDir(c);
  fs.mkdirSync(dir, { recursive: true });
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  for (const l of lessonsOf(c)) {
    const n = lessonNumber(c, l);
    if (only && only !== n) continue;
    const nn = String(n).padStart(2, '0');
    const { html, duration } = videoPage(c, l);
    await page.setContent(html, { waitUntil: 'load' });
    const out = path.join(dir, `l${nn}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p', '-vf', 'scale=1280:720', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const total = Math.ceil(duration * FPS);
    for (let f = 0; f < total; f++) {
      await page.evaluate((t: number) => (window as any).draw(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 82 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    fs.writeFileSync(path.join(dir, `l${nn}.vtt`), captionsVtt(l));
    console.log(`  ✓ l${nn}.mp4 (${duration}s, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
  }
  await browser.close();
}

// Usage: media:flagship -- docs|videos|all [courseKeyPrefix] [lessonNumber]
const what = process.argv[2] || 'docs';
const filter = process.argv[3] && !/^\d+$/.test(process.argv[3]) ? process.argv[3] : '';
const only = Number([...process.argv.slice(3)].find((a) => /^\d+$/.test(a))) || undefined;
for (const c of FLAGSHIPS.filter((f) => !filter || f.key.startsWith(filter))) {
  console.log(`${flagshipTitle(c)} → ${mediaDir(c)}`);
  if (what === 'docs' || what === 'all') await makeDocs(c);
  if (what === 'videos' || what === 'all') await makeVideos(c, only);
}
