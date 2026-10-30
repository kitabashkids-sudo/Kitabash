// Installs a flagship course through the normal services (validation, tutor tests, approval workflow),
// with its lesson videos and PDFs from library-media/<course>/ when they have been generated.
import fs from 'node:fs';
import path from 'node:path';
import { all, get, run, tx } from '../../db/index.ts';
import * as C from '../../services/courses.ts';
import * as A from '../../services/agents.ts';
import * as K from '../../services/knowledge.ts';
import * as ADM from '../../services/admin.ts';
import { agentPatch } from '../expand.ts';
import type { CourseSpec } from '../types.ts';
import type { Download } from '../../lessonTypes.ts';
import { captionsVtt, expandFlagLesson, flagshipGuideMarkdown, flagshipTitle, lessonNumber, lessonsOf, lintFlagship, sceneTimings } from './expand.ts';
import type { FlagshipCourse } from './types.ts';

export const mediaSlug = (c: FlagshipCourse) => c.key.split('@')[0].replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
export const mediaDir = (c: FlagshipCourse) => path.resolve(process.env.LIBRARY_MEDIA_DIR || 'library-media', mediaSlug(c));
const file = (c: FlagshipCourse, name: string) => {
  const p = path.join(mediaDir(c), name);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
};

async function setSetting(key: string, value: string) {
  await run(`INSERT INTO settings (key,value,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, key, value);
}

/** Minimal CourseSpec view so the shared tutor configuration can be reused. */
function asSpec(c: FlagshipCourse): CourseSpec {
  return {
    subject: c.subject,
    band: c.band,
    level: c.level,
    title: c.title,
    description: c.description,
    ages: c.ages,
    intro: c.intro,
    theme: c.theme,
    tutor: c.tutor,
    style: c.style,
    outcomes: c.outcomes,
    outOfScope: ['Doing a learner’s project for them', 'Sharing personal information online'],
    modules: c.modules.map((m) => ({ title: m.title, lessons: m.lessons.map((l) => ({ t: l.title, o: l.objective, hook: l.hook, cards: [], acts: [], teach: { explain: l.teacher.explain, analogy: l.teacher.analogy, vocab: l.teacher.vocab, demo: l.teacher.demo, prompts: l.teacher.prompts, support: l.teacher.support, stretch: l.teacher.stretch, mis: l.teacher.mis, sheet: '' } })) })),
  };
}

export async function installFlagship(c: FlagshipCourse, adminId: string, subj: Record<string, string>): Promise<string> {
  const lint = lintFlagship(c);
  if (lint.length) throw new Error(lint.join('; '));
  const lessons = lessonsOf(c);
  const cid = await tx(async () => {
    const cid = await C.createCourse(
      {
        subject_id: subj[c.subject],
        title: flagshipTitle(c),
        description: c.description,
        age_min: c.ages[0],
        age_max: c.ages[1],
        grade_level: c.grade,
        grade_band: c.band,
        proficiency: c.level.toLowerCase() as any,
        prerequisites: c.prereq,
        objectives: lessons.map((l) => l.objective),
        outcomes: c.outcomes,
        duration_minutes: lessons.reduce((s, l) => s + l.minutes, 0),
        required_tools: c.tools,
        teaching_style: c.style,
        assessment_approach: 'Every lesson: block-coding challenges checked automatically on the server, quick checks with instant feedback, and Probe tasks that apply the idea to something new. Module projects and the capstone are reviewed by the teacher with a 4-level rubric, running the learner’s actual program.',
        safety_requirements: c.safety,
        instructor_notes: c.notes,
        student_intro: c.intro,
        theme: c.theme,
      },
      adminId,
    );
    // Knowledge for the tutor + course-level printables.
    await K.uploadResource(cid, { filename: `${mediaSlug(c)}-guide.md`, mime: 'text/markdown', data: Buffer.from(flagshipGuideMarkdown(c)) }, { title: `${c.title} — tutor knowledge`, audience: 'teacher' }, adminId);
    const guide = file(c, 'course-guide.pdf');
    if (guide) await K.uploadResource(cid, { filename: 'course-guide.pdf', mime: 'application/pdf', data: guide }, { title: 'Course guide & syllabus', audience: 'student' }, adminId);

    for (const m of c.modules) {
      const mid = await C.addModule(cid, m.title, m.summary);
      for (const l of m.lessons) {
        const n = lessonNumber(c, l);
        const nn = String(n).padStart(2, '0');
        const L = expandFlagLesson(c, l);
        const lid = await C.addLesson(mid, L.title);
        // Video + captions
        let video;
        const mp4 = file(c, `l${nn}.mp4`);
        if (mp4) {
          const aid = await ADM.uploadAsset({ filename: `l${nn}.mp4`, data: mp4 }, { title: `${c.title} · Lesson ${n} video: ${l.video.title}`, tags: ['flagship', mediaSlug(c)], alt_text: `Animated explainer: ${l.video.title}. ${l.video.scenes.map((s) => s.say.join(' ')).join(' ')}`.slice(0, 2000), captions: captionsVtt(l) }, adminId);
          video = { assetId: aid, title: l.video.title, durationSec: sceneTimings(l).duration };
        }
        // Printables
        const downloads: Download[] = [];
        const teacherDownloads: Download[] = [];
        const ws = file(c, `l${nn}-worksheet.pdf`);
        if (ws) downloads.push({ title: `Worksheet — Lesson ${n}`, kind: 'worksheet', resourceId: (await K.uploadResource(cid, { filename: `l${nn}-worksheet.pdf`, mime: 'application/pdf', data: ws }, { title: `Worksheet — Lesson ${n}: ${l.title}`, audience: 'student' }, adminId)).id });
        const brief = file(c, `l${nn}-project.pdf`);
        if (brief) downloads.push({ title: `Project brief — ${l.project?.title}`, kind: 'project-brief', resourceId: (await K.uploadResource(cid, { filename: `l${nn}-project.pdf`, mime: 'application/pdf', data: brief }, { title: `Project brief — ${l.project?.title}`, audience: 'student' }, adminId)).id });
        const plan = file(c, `l${nn}-plan.pdf`);
        if (plan) teacherDownloads.push({ title: `Lesson plan & answer key — Lesson ${n}`, kind: 'lesson-plan', resourceId: (await K.uploadResource(cid, { filename: `l${nn}-plan.pdf`, mime: 'application/pdf', data: plan }, { title: `Lesson plan — Lesson ${n}: ${l.title}`, audience: 'teacher' }, adminId)).id });
        await C.updateLesson(lid, {
          objective: L.objective,
          duration_minutes: L.duration,
          learn: { cards: L.cards, ...(video ? { video } : {}), ...(L.build ? { build: L.build } : {}), downloads },
          hook: L.hook,
          teacher: { ...L.teacher, downloads: teacherDownloads },
        });
        for (const a of L.activities) await C.upsertActivity(lid, a as any);
        await run('INSERT INTO assessments (id,lesson_id,title,rubric,pass_pct) VALUES (?,?,?,?,60)', 'as_' + lid, lid, `${L.title} rubric`, L.rubric);
        await C.setLessonStatus(lid, 'approved', adminId);
      }
    }
    await A.saveAgentConfig(cid, agentPatch(asSpec(c)), 'Flagship course configuration', adminId);
    await A.addStarterSuite(cid);
    const r = await A.runTests(cid, adminId);
    if (r.passed < r.total) throw new Error(`Tutor sandbox tests: ${r.passed}/${r.total} passed.`);
    await A.transitionAgentVersion(cid, 'review', adminId);
    await A.transitionAgentVersion(cid, 'approved', adminId);
    await C.transitionCourse(cid, 'review', adminId);
    await C.transitionCourse(cid, 'approved', adminId);
    await C.transitionCourse(cid, 'published', adminId, 'Flagship course v2');
    await setSetting(`library:${c.key}`, cid);
    return cid;
  });
  // Retire the older version this course replaces (learner progress stays on the old course).
  if (c.replaces) {
    const old = (await get<{ value: string }>('SELECT value FROM settings WHERE key=?', `library:${c.replaces}`))?.value;
    const oldCourse = old ? await get<{ id: string; status: string }>('SELECT id, status FROM courses WHERE id=?', old) : null;
    if (oldCourse && oldCourse.status === 'published') await C.transitionCourse(oldCourse.id, 'archived', adminId, `Replaced by ${flagshipTitle(c)}`);
  }
  return cid;
}

export async function flagshipInstalled(c: FlagshipCourse) {
  const id = (await get<{ value: string }>('SELECT value FROM settings WHERE key=?', `library:${c.key}`))?.value;
  return !!id && !!(await get('SELECT 1 FROM courses WHERE id=?', id));
}
export { all };
