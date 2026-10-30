// Installs the Kitabash K-12 course library: each subject in its grade bands (K-2, 3-5, 6-8, 9-12),
// with Beginner, Intermediate and Advanced courses in every band.
// Courses are created through the same services as hand-made ones, so they pass the same
// validation, tutor sandbox tests and approval workflow before they are published.
// Idempotent: each installed course is remembered in the settings table by its spec key.
import { all, get, run, tx } from '../db/index.ts';
import * as C from '../services/courses.ts';
import * as A from '../services/agents.ts';
import * as K from '../services/knowledge.ts';
import * as ADM from '../services/admin.ts';
import { CATALOGUE } from '../demo/content.ts';
import { agentPatch, agesOf, courseTitle, courseGuide, expandLesson, gradeOf, lintCourse, specKey } from './expand.ts';
import { LIBRARY } from './catalog.ts';
import { BANDS } from './bands.ts';
import type { CourseSpec } from './types.ts';
import { platformFor, type Platform } from './platforms.ts';

/** Add the course's practice platform to its required tools (so it shows on the course and in search). */
export const withPlatform = (tools: string[], p: Platform | null) =>
  !p || tools.some((t) => t.toLowerCase().includes(p.name.toLowerCase())) ? tools : [...tools, p.url ? `${p.name} (${p.url})` : p.name[0].toUpperCase() + p.name.slice(1)];
import { FLAGSHIPS } from './flagship/all.ts';
import { installFlagship, flagshipInstalled } from './flagship/install.ts';
import { flagshipTitle, lessonsOf } from './flagship/expand.ts';

/** Library specs that a flagship course has replaced are no longer installed. */
export const REPLACED = new Set(FLAGSHIPS.map((f) => f.replaces).filter(Boolean) as string[]);
export const ACTIVE = LIBRARY.filter((s) => !REPLACED.has(specKey(s)));

const PROFICIENCY = { Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'advanced' } as const;

interface Job {
  running: boolean;
  done: number;
  total: number;
  current: string;
  errors: { key: string; title: string; error: string }[];
  startedAt: string;
  finishedAt?: string;
}
let job: Job | null = null;

async function setting(key: string) {
  return (await get<{ value: string }>('SELECT value FROM settings WHERE key=?', key))?.value;
}
async function setSetting(key: string, value: string) {
  await run(`INSERT INTO settings (key,value,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, key, value);
}

/** Make sure every catalogue category/subject exists (older databases may be missing some). */
export async function subjectIds(adminId: string) {
  const subj: Record<string, string> = {};
  for (const r of await all<{ id: string; name: string }>('SELECT id, name FROM subjects')) subj[r.name] = r.id;
  for (const [i, cat] of CATALOGUE.entries()) {
    let catId = (await get<{ id: string }>('SELECT id FROM categories WHERE name=?', cat.name))?.id;
    for (const s of cat.subjects) {
      if (subj[s]) continue;
      if (!catId) {
        catId = await ADM.addCategory(cat.name, cat.description, cat.icon, adminId);
        await run('UPDATE categories SET sort=? WHERE id=?', i, catId);
      }
      subj[s] = await ADM.addSubject(catId, s, '', adminId);
    }
  }
  return subj;
}

export async function installCourse(spec: CourseSpec, adminId: string, subj: Record<string, string>): Promise<string> {
  const lint = lintCourse(spec);
  if (lint.length) throw new Error(lint.join('; '));
  const lessons = spec.modules.flatMap((m) => m.lessons);
  return await tx(async () => {
    const cid = await C.createCourse(
      {
        subject_id: subj[spec.subject],
        title: courseTitle(spec),
        description: spec.description,
        age_min: agesOf(spec)[0],
        age_max: agesOf(spec)[1],
        grade_level: gradeOf(spec),
        grade_band: spec.band,
        proficiency: PROFICIENCY[spec.level],
        prerequisites: spec.prereq || [],
        objectives: lessons.map((l) => l.o),
        outcomes: spec.outcomes,
        duration_minutes: lessons.reduce((s, l) => s + (l.min || 30), 0),
        required_tools: withPlatform(spec.tools || ['Device with a browser'], platformFor(spec.subject, spec.band)),
        teaching_style: spec.style,
        assessment_approach: 'Every lesson: auto-checked Perform activities with instant feedback, then Probe questions that apply the idea to a new situation. Written answers are reviewed by the teacher against a 4-level rubric.',
        safety_requirements: spec.safety || 'No personal information is requested. Learners under 18 use the AI tutor and microphone only with guardian consent.',
        instructor_notes: spec.notes || '',
        student_intro: spec.intro,
        theme: spec.theme,
      },
      adminId,
    );
    await K.uploadResource(cid, { filename: `${specKey(spec)}-guide.md`, mime: 'text/markdown', data: Buffer.from(courseGuide(spec)) }, { title: `${courseTitle(spec)} — course guide`, audience: 'student' }, adminId);
    const lessonIds: string[] = [];
    for (const m of spec.modules) {
      const mid = await C.addModule(cid, m.title, m.summary || '');
      for (const ls of m.lessons) {
        const L = expandLesson(ls, spec);
        const lid = await C.addLesson(mid, L.title);
        await C.updateLesson(lid, { objective: L.objective, duration_minutes: L.duration, learn: { cards: L.cards, worksheet: L.worksheet, ...(L.build ? { build: L.build } : {}) }, hook: L.hook, teacher: L.teacher });
        for (const a of L.activities) await C.upsertActivity(lid, a as any);
        await run('INSERT INTO assessments (id,lesson_id,title,rubric,pass_pct) VALUES (?,?,?,?,60)', 'as_' + lid, lid, `${L.title} rubric`, L.teacher.assess!.rubric!);
        await C.setLessonStatus(lid, 'approved', adminId);
        lessonIds.push(lid);
      }
    }
    await A.saveAgentConfig(cid, agentPatch(spec), 'Course library configuration', adminId);
    await A.addStarterSuite(cid);
    const r = await A.runTests(cid, adminId);
    if (r.passed < r.total) {
      const failed = await all<{ prompt: string; response: string; checks: string }>(
        `SELECT c.prompt, t.response, t.checks FROM agent_test_runs t JOIN agent_test_cases c ON c.id=t.test_case_id JOIN agents a ON a.id=c.agent_id WHERE a.course_id=? AND t.passed=?`,
        cid, false,
      );
      throw new Error(`Tutor sandbox tests: ${r.passed}/${r.total} passed. ${failed.map((f) => `“${f.prompt}” → ${String(f.response).slice(0, 160)}`).join(' | ')}`);
    }
    await A.transitionAgentVersion(cid, 'review', adminId);
    await A.transitionAgentVersion(cid, 'approved', adminId);
    if (spec.pathway) {
      const p = spec.pathway;
      const tr = await ADM.addTrack(cid, { pathway: 'board', board: p.board, grade: p.grade, subject: p.subject, syllabus_code: '', syllabus_year: '', title: `${p.board} ${p.grade} ${p.subject} (designed to support — awaiting verification)` });
      for (const [i, topic] of p.topics.entries())
        await ADM.addMapping(tr, { topic, objective: lessons[i % lessons.length].o, assessment_format: 'Lesson activities + teacher-reviewed written answers', reference_source: '', lesson_id: lessonIds[i % lessonIds.length] });
    }
    await C.transitionCourse(cid, 'review', adminId);
    await C.transitionCourse(cid, 'approved', adminId);
    await C.transitionCourse(cid, 'published', adminId, 'Course library v1');
    await setSetting(`library:${specKey(spec)}`, cid);
    return cid;
  });
}

export async function libraryStatus() {
  const installed = new Map((await all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'library:%' AND key != 'library:job'")).map((r) => [r.key.slice(8), r.value]));
  // Forget courses that were deleted since.
  const live = new Set((await all<{ id: string }>('SELECT id FROM courses')).map((r) => r.id));
  const isIn = (key: string) => live.has(installed.get(key) || '');
  const categories = CATALOGUE.map((cat) => {
    const specs = ACTIVE.filter((s) => cat.subjects.includes(s.subject));
    const flags = FLAGSHIPS.filter((f) => cat.subjects.includes(f.subject));
    return { name: cat.name, total: specs.length + flags.length, installed: specs.filter((s) => isIn(specKey(s))).length + flags.filter((f) => isIn(f.key)).length };
  });
  const bands = BANDS.map((b) => {
    const specs = ACTIVE.filter((s) => s.band === b.id);
    const flags = FLAGSHIPS.filter((f) => f.band === b.id);
    return { id: b.id, label: `${b.label} (${b.grades})`, total: specs.length + flags.length, installed: specs.filter((s) => isIn(specKey(s))).length + flags.filter((f) => isIn(f.key)).length };
  });
  return {
    total: ACTIVE.length + FLAGSHIPS.length,
    installed: categories.reduce((s, c) => s + c.installed, 0),
    lessons: ACTIVE.reduce((s, c) => s + c.modules.reduce((n, m) => n + m.lessons.length, 0), 0) + FLAGSHIPS.reduce((n, f) => n + lessonsOf(f).length, 0),
    categories,
    bands,
    job,
  };
}

/** Install every (or one category's) not-yet-installed course. Runs in the background. */
export async function installLibrary(adminId: string, opts: { category?: string; log?: (s: string) => void } = {}) {
  if (job?.running) return { job, done: Promise.resolve(job) };
  const subj = await subjectIds(adminId);
  const live = new Set((await all<{ id: string }>('SELECT id FROM courses')).map((r) => r.id));
  const keep = new Set<string>();
  for (const r of await all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'library:%'")) if (live.has(r.value)) keep.add(r.key.slice(8));
  const cat = opts.category ? CATALOGUE.find((c) => c.name === opts.category) : null;
  const todo = ACTIVE.filter((s) => !keep.has(specKey(s)) && (!cat || cat.subjects.includes(s.subject)));
  const flagTodo = FLAGSHIPS.filter((f) => !keep.has(f.key) && (!cat || cat.subjects.includes(f.subject)));
  job = { running: true, done: 0, total: todo.length + flagTodo.length, current: '', errors: [], startedAt: new Date().toISOString() };
  const j = job;
  const work = (async () => {
    for (const s of todo) {
      j.current = courseTitle(s);
      try {
        await installCourse(s, adminId, subj);
        opts.log?.(`  ✓ ${courseTitle(s)}`);
      } catch (e) {
        j.errors.push({ key: specKey(s), title: courseTitle(s), error: (e as Error).message });
        opts.log?.(`  ✗ ${courseTitle(s)}: ${(e as Error).message}`);
      }
      j.done++;
    }
    for (const f of flagTodo) {
      j.current = flagshipTitle(f);
      try {
        if (!(await flagshipInstalled(f))) await installFlagship(f, adminId, subj);
        opts.log?.(`  ✓ ${flagshipTitle(f)} (flagship)`);
      } catch (e) {
        j.errors.push({ key: f.key, title: flagshipTitle(f), error: (e as Error).message });
        opts.log?.(`  ✗ ${flagshipTitle(f)}: ${(e as Error).message}`);
      }
      j.done++;
    }
    j.running = false;
    j.current = '';
    j.finishedAt = new Date().toISOString();
    return j;
  })();
  return { job: j, done: work };
}
