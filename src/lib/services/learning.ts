// Learner-facing services: catalogue, enrolment, lesson delivery (keys stripped),
// server-side grading, progress, achievements and recommendations.
import { all, get, run, id, j, tx } from '../db/index.ts';
import { HttpError } from '../validate.ts';
import { gradeActivity } from '../activities/registry.ts';
import { courseTree, getCourse, hydrateActivity, hydrateLesson } from './courses.ts';
import { ageOf, type User } from '../auth.ts';
import { BANDS, bandForAge } from '../library/bands.ts';

const isStaff = (u: User) => u.role === 'admin' || u.role === 'instructor';

export async function catalogue() {
  const cats = await all('SELECT * FROM categories ORDER BY sort, name');
  const subjects = await all('SELECT * FROM subjects ORDER BY name');
  const courses = await all(
    `SELECT c.id,c.slug,c.title,c.description,c.age_min,c.age_max,c.grade_level,c.proficiency,c.duration_minutes,c.theme,c.subject_id,c.grade_band,c.level,c.pathway,
      (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id AND l.status='approved') lesson_count
     FROM courses c WHERE c.status='published' ORDER BY c.title`,
  );
  courses.sort((a, b) => bandIdx(a.grade_band) - bandIdx(b.grade_band) || levelIdx(a.level) - levelIdx(b.level) || String(a.title).localeCompare(b.title));
  return cats.map((cat) => ({
    ...cat,
    subjects: subjects.filter((s) => s.category_id === cat.id).map((s) => ({ ...s, courses: courses.filter((c) => c.subject_id === s.id) })),
  }));
}

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];
const levelIdx = (l: string) => (LEVEL_ORDER.includes(l) ? LEVEL_ORDER.indexOf(l) : 9);
const bandIdx = (b: string) => {
  const i = BANDS.findIndex((x) => x.id === b);
  return i < 0 ? 9 : i;
};

/**
 * The learner's path for a course: every level in the same subject + grade band, then the
 * first course of the next band. Powers the level ladder and "next course" suggestions.
 */
export async function pathway(user: User, courseId: string) {
  const c = await getCourse(courseId);
  if (!c.pathway) return { steps: [], next: null };
  const steps = (
    await all(
      `SELECT c.id, c.slug, c.title, c.level, c.grade_band,
         (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id AND l.status='approved') total,
         (SELECT COUNT(*) FROM lesson_progress p WHERE p.course_id=c.id AND p.user_id=? AND p.status='completed') done,
         (SELECT COUNT(*) FROM enrolments e WHERE e.course_id=c.id AND e.user_id=?) enrolled
       FROM courses c WHERE c.pathway=? AND c.status='published'`,
      user.id, user.id, c.pathway,
    )
  ).sort((a, b) => levelIdx(a.level) - levelIdx(b.level));
  const at = steps.findIndex((s) => s.id === c.id);
  let next = at >= 0 ? steps[at + 1] || null : null;
  if (!next) {
    // Top of this band → first course of the same subject in the next grade band.
    const nb = BANDS[bandIdx(c.grade_band) + 1];
    if (nb) {
      const cand = await all(`SELECT id, slug, title, level, grade_band FROM courses WHERE subject_id=? AND grade_band=? AND status='published'`, c.subject_id, nb.id);
      next = cand.sort((a, b) => levelIdx(a.level) - levelIdx(b.level))[0] || null;
    }
  }
  return { steps: steps.map((s) => ({ ...s, current: s.id === c.id, total: Number(s.total), done: Number(s.done), enrolled: Number(s.enrolled) > 0 })), next };
}

/** Access rule for lesson content: students → published course + approved lesson; staff → anything (preview). */
function assertCanView(user: User, course: any, lesson?: any) {
  if (isStaff(user)) return;
  if (course.status !== 'published') throw new HttpError(404, 'This course is not available.');
  if (lesson && lesson.status !== 'approved') throw new HttpError(404, 'This lesson is not available.');
}

export async function enrol(user: User, courseId: string) {
  const c = await getCourse(courseId);
  assertCanView(user, c);
  await run('INSERT OR IGNORE INTO enrolments (id,user_id,course_id) VALUES (?,?,?)', id('e_'), user.id, c.id);
}

export async function studentCourse(user: User, courseId: string) {
  const c = await getCourse(courseId);
  assertCanView(user, c);
  const preview = isStaff(user) && c.status !== 'published';
  const tree = await courseTree(c.id, { includeKeys: false, approvedOnly: !isStaff(user) });
  const prog = await all('SELECT * FROM lesson_progress WHERE user_id=? AND course_id=?', user.id, c.id);
  const mappings = await all(
    `SELECT t.board, t.grade, t.syllabus_code, t.syllabus_year, m.topic, m.lesson_id FROM curriculum_mappings m JOIN curriculum_tracks t ON t.id=m.track_id
     WHERE t.course_id=? AND m.review_status='approved'`,
    c.id,
  );
  const enrolled = !!await get('SELECT 1 FROM enrolments WHERE user_id=? AND course_id=?', user.id, c.id);
  const strip = ({ instructor_notes, safety_requirements, ...rest }: any) => rest;
  return {
    course: isStaff(user) ? c : strip(c),
    preview,
    enrolled,
    modules: tree.map((m) => ({
      ...m,
      lessons: m.lessons.map((l: any) => {
        const p = prog.find((x) => x.lesson_id === l.id);
        return { id: l.id, title: l.title, objective: l.objective, status: l.status, duration_minutes: l.duration_minutes, activityCount: l.activities.length, hookEmoji: l.learn.cards?.[0]?.emoji, progress: p ? { status: p.status, phase: p.phase, score: p.score, max: p.max_score } : null };
      }),
    })),
    mappings,
    // Course-level printables for learners (course guide, project briefs). Per-lesson files live in each lesson.
    materials: await all(
      "SELECT id, title, mime FROM resources WHERE course_id=? AND audience='student' AND kind='file' AND replaced_by IS NULL AND mime='application/pdf' AND title NOT LIKE 'Worksheet%' ORDER BY title",
      c.id,
    ),
    achievements: await achievements(user, c.id),
    recommendations: await recommendations(user, c.id),
    pathway: await pathway(user, c.id),
  };
}

export async function lessonForLearner(user: User, lessonId: string) {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  const c = await getCourse(l.course_id);
  assertCanView(user, c, l);
  const acts = (await all('SELECT * FROM activities WHERE lesson_id=? ORDER BY phase, position', lessonId)).map((a) => hydrateActivity(a, false));
  const attempts = await all('SELECT activity_id, score, max_score, correct, feedback, needs_review, created_at FROM attempts WHERE user_id=? AND lesson_id=? ORDER BY created_at', user.id, lessonId);
  const siblings = (await all("SELECT id,title,position,module_id,status FROM lessons WHERE course_id=? ORDER BY (SELECT position FROM modules WHERE id=module_id), position", c.id)).filter((s) => isStaff(user) || s.status === 'approved');
  const idx = siblings.findIndex((s) => s.id === lessonId);
  const progress = await get('SELECT * FROM lesson_progress WHERE user_id=? AND lesson_id=?', user.id, lessonId);
  if (!progress && user.role === 'student') await run('INSERT OR IGNORE INTO lesson_progress (user_id,lesson_id,course_id) VALUES (?,?,?)', user.id, lessonId, c.id);
  return {
    course: { id: c.id, title: c.title, slug: c.slug, theme: c.theme, age_min: c.age_min, age_max: c.age_max, status: c.status },
    lesson: hydrateLesson(l, false),
    activities: acts,
    attempts,
    progress: progress || { phase: 'learn', status: 'in_progress', score: 0, max_score: 0 },
    prev: siblings[idx - 1] || null,
    next: siblings[idx + 1] || null,
  };
}

export async function submitAttempt(user: User, activityId: string, response: unknown, hintsUsed: number) {
  const a = await get('SELECT * FROM activities WHERE id=?', activityId);
  if (!a) throw new HttpError(404, 'Activity not found');
  const l = await get('SELECT * FROM lessons WHERE id=?', a.lesson_id);
  if (!l) throw new HttpError(404, 'Lesson not found');
  const c = await getCourse(l.course_id);
  assertCanView(user, c, l);
  if (JSON.stringify(response ?? null).length > 60_000) throw new HttpError(413, 'Response too large');
  const g = gradeActivity(a.type, a.points, j(a.config, {}), j(a.answer_key, {}), response);
  const attemptId = id('at_');
  const prior = (await get('SELECT COUNT(*) n FROM attempts WHERE user_id=? AND activity_id=?', user.id, activityId))?.n || 0;
  await tx(async () => {
    await run(
      'INSERT INTO attempts (id,user_id,activity_id,lesson_id,response,score,max_score,correct,needs_review,hints_used,feedback) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      attemptId, user.id, activityId, l.id, response ?? null, g.score, a.points, g.correct, g.needsReview, Math.max(0, Math.min(20, hintsUsed | 0)), g.feedback,
    );
    await recomputeLesson(user.id, l.id, c.id);
  });
  // Reveal the worked explanation only after a correct answer or 2 tries.
  return { attemptId, ...g, attemptNumber: prior + 1, maxScore: a.points, canRetry: !g.correct };
}

async function recomputeLesson(userId: string, lessonId: string, courseId: string) {
  const acts = await all('SELECT id, points, required FROM activities WHERE lesson_id=?', lessonId);
  const best = await all('SELECT activity_id, MAX(score) s FROM attempts WHERE user_id=? AND lesson_id=? GROUP BY activity_id', userId, lessonId);
  const score = best.reduce((s, b) => s + b.s, 0);
  const max = acts.reduce((s, a) => s + a.points, 0);
  const done = acts.filter((a) => a.required).every((a) => best.some((b) => b.activity_id === a.id));
  await run(
    `INSERT INTO lesson_progress (user_id,lesson_id,course_id,score,max_score,status,completed_at,phase) VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(user_id,lesson_id) DO UPDATE SET score=excluded.score, max_score=excluded.max_score,
       status=CASE WHEN lesson_progress.status='completed' THEN 'completed' ELSE excluded.status END,
       completed_at=COALESCE(lesson_progress.completed_at, excluded.completed_at)`,
    userId, lessonId, courseId, score, max, done ? 'completed' : 'in_progress', done ? new Date().toISOString() : null, done ? 'probe' : 'perform',
  );
}

export async function setPhase(user: User, lessonId: string, phase: 'learn' | 'perform' | 'probe') {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  await run(
    `INSERT INTO lesson_progress (user_id,lesson_id,course_id,phase) VALUES (?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET phase=excluded.phase`,
    user.id, lessonId, l.course_id, phase,
  );
}

export async function achievements(user: User, courseId?: string) {
  const where = courseId ? 'AND lesson_id IN (SELECT id FROM lessons WHERE course_id=?)' : '';
  const args = courseId ? [user.id, courseId] : [user.id];
  const completed = (await get(`SELECT COUNT(*) n FROM lesson_progress WHERE user_id=? AND status='completed' ${courseId ? 'AND course_id=?' : ''}`, ...args))?.n || 0;
  const probes = (await get(`SELECT COUNT(*) n FROM attempts a JOIN activities x ON x.id=a.activity_id WHERE a.user_id=? AND x.phase='probe' ${where.replace(/lesson_id/g, 'a.lesson_id')}`, ...args))?.n || 0;
  const hintFree = (await get(`SELECT COUNT(*) n FROM attempts WHERE user_id=? AND correct=1 AND hints_used=0 ${where}`, ...args))?.n || 0;
  const persevered = (await get(`SELECT COUNT(*) n FROM (SELECT activity_id FROM attempts WHERE user_id=? ${where} GROUP BY activity_id HAVING COUNT(*)>=2 AND MAX(correct)=1) t`, ...args))?.n || 0;
  // Badges reward learning behaviours (reasoning, persistence), not just speed or points.
  return [
    { id: 'first-steps', label: 'First steps', emoji: '🌱', description: 'Completed your first lesson', earned: completed >= 1 },
    { id: 'deep-thinker', label: 'Deep thinker', emoji: '🧠', description: 'Explained your reasoning in 3 probe questions', earned: probes >= 3, progress: Math.min(probes, 3), target: 3 },
    { id: 'never-give-up', label: 'Never give up', emoji: '💪', description: 'Got something right after trying again', earned: persevered >= 1 },
    { id: 'independent', label: 'Independent learner', emoji: '🦉', description: '5 correct answers without hints', earned: hintFree >= 5, progress: Math.min(hintFree, 5), target: 5 },
  ];
}

export async function recommendations(user: User, courseId: string) {
  const recs: { kind: string; title: string; lessonId?: string; courseId?: string; reason: string }[] = [];
  const lessons = await all(`SELECT l.id,l.title FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? AND l.status='approved' ORDER BY m.position, l.position`, courseId);
  const prog = await all('SELECT * FROM lesson_progress WHERE user_id=? AND course_id=?', user.id, courseId);
  const next = lessons.find((l) => prog.find((p) => p.lesson_id === l.id)?.status !== 'completed');
  if (next) recs.push({ kind: 'next', title: next.title, lessonId: next.id, reason: prog.some((p) => p.lesson_id === next.id) ? 'Pick up where you left off' : 'Your next lesson' });
  for (const p of prog) {
    if (p.status === 'completed' && p.max_score && p.score / p.max_score < 0.6) {
      const l = lessons.find((x) => x.id === p.lesson_id);
      if (l) recs.push({ kind: 'review', title: l.title, lessonId: l.id, reason: 'Revisit this one — practice makes it stick' });
    }
  }
  if (!next) {
    const c = await get('SELECT subject_id FROM courses WHERE id=?', courseId);
    const other = await all("SELECT c.id,c.title FROM courses c JOIN subjects s ON s.id=c.subject_id WHERE c.status='published' AND c.id!=? AND s.category_id=(SELECT category_id FROM subjects WHERE id=?) LIMIT 2", courseId, c?.subject_id);
    for (const o of other) recs.push({ kind: 'course', title: o.title, courseId: o.id, reason: 'You finished this course — try this next' });
  }
  return recs.slice(0, 3);
}

export async function myLearning(user: User) {
  const rows = await all(
    `SELECT c.id,c.slug,c.title,c.theme,c.level,c.grade_band,
       (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id AND l.status='approved') total,
       (SELECT COUNT(*) FROM lesson_progress p WHERE p.course_id=c.id AND p.user_id=e.user_id AND p.status='completed') done
     FROM enrolments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? AND c.status='published' ORDER BY e.created_at DESC`,
    user.id,
  );
  // Continue the path: finished courses whose next step the learner hasn't joined yet.
  const continuePath: any[] = [];
  for (const r of rows.filter((r) => Number(r.total) > 0 && Number(r.done) >= Number(r.total))) {
    const nx = (await pathway(user, r.id)).next;
    if (nx && !rows.some((x) => x.id === nx.id) && !continuePath.some((x) => x.id === nx.id)) continuePath.push({ ...nx, after: r.title });
  }
  // Recommended for your grade: beginner courses in the learner's band, one per subject.
  const myBand = bandForAge(ageOf(user));
  let recommended: any[] = [];
  if (myBand) {
    const cand = await all(
      `SELECT c.id, c.slug, c.title, c.description, c.theme, c.level, c.grade_band, s.name subject FROM courses c JOIN subjects s ON s.id=c.subject_id
       WHERE c.status='published' AND c.grade_band=? AND c.level='beginner' AND c.id NOT IN (SELECT course_id FROM enrolments WHERE user_id=?) ORDER BY c.title`,
      myBand, user.id,
    );
    const seen = new Set<string>();
    recommended = cand.filter((x) => !seen.has(x.subject) && seen.add(x.subject)).slice(0, 6);
  }
  return { courses: rows, achievements: await achievements(user), continuePath, recommended, band: myBand && BANDS.find((b) => b.id === myBand) };
}

// ── Instructor/guardian reporting ───────────────────────────
export async function courseReport(courseId: string) {
  const c = await getCourse(courseId);
  const learners = await all(
    `SELECT u.id,u.name, (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id=u.id AND p.course_id=? AND p.status='completed') completed,
        (SELECT COALESCE(SUM(score),0) FROM lesson_progress p WHERE p.user_id=u.id AND p.course_id=?) score,
        (SELECT COALESCE(SUM(max_score),0) FROM lesson_progress p WHERE p.user_id=u.id AND p.course_id=?) max
     FROM enrolments e JOIN users u ON u.id=e.user_id WHERE e.course_id=? ORDER BY u.name`,
    c.id, c.id, c.id, c.id,
  );
  const activityStats = await all(
    `SELECT x.id, x.title, x.phase, l.title lesson, COUNT(a.id) attempts, ROUND(AVG(a.correct)*100) pct_correct, ROUND(AVG(a.hints_used),1) avg_hints
     FROM activities x JOIN lessons l ON l.id=x.lesson_id LEFT JOIN attempts a ON a.activity_id=x.id WHERE l.course_id=? GROUP BY x.id, l.id ORDER BY l.position, x.position`,
    c.id,
  );
  const reviewQueue = (await all(
    `SELECT a.id, a.response, a.score, a.max_score, a.created_at, u.name learner, x.title activity, x.config, l.title lesson,
       (SELECT comment FROM instructor_feedback f WHERE f.attempt_id=a.id ORDER BY created_at DESC LIMIT 1) feedback,
       x.type, (SELECT s.rubric FROM assessments s WHERE s.lesson_id=l.id LIMIT 1) rubric
     FROM attempts a JOIN users u ON u.id=a.user_id JOIN activities x ON x.id=a.activity_id JOIN lessons l ON l.id=a.lesson_id
     WHERE l.course_id=? AND a.needs_review=1 ORDER BY a.created_at DESC LIMIT 50`,
    c.id,
  )).map((r) => {
    const cfg = j<any>(r.config, {});
    return { ...r, response: j(r.response, {}), prompt: cfg.prompt || cfg.reflection, requirements: cfg.requirements, rubric: r.type === 'project' || r.type === 'code_lab' || r.type === 'python_lab' ? j(r.rubric, []) : undefined, config: undefined };
  });
  return { course: { id: c.id, title: c.title }, learners, activityStats, reviewQueue };
}

export async function addFeedback(instructorId: string, attemptId: string, comment: string, scoreOverride: number | null) {
  const a = await get('SELECT * FROM attempts WHERE id=?', attemptId);
  if (!a) throw new HttpError(404, 'Attempt not found');
  if (scoreOverride !== null && (scoreOverride < 0 || scoreOverride > a.max_score)) throw new HttpError(400, `Score must be 0–${a.max_score}`);
  await tx(async () => {
    await run('INSERT INTO instructor_feedback (id,attempt_id,instructor_id,comment,score_override) VALUES (?,?,?,?,?)', id('f_'), attemptId, instructorId, comment, scoreOverride);
    if (scoreOverride !== null) await run('UPDATE attempts SET score=?, needs_review=0 WHERE id=?', scoreOverride, attemptId);
    else await run('UPDATE attempts SET needs_review=0 WHERE id=?', attemptId);
    const l = await get('SELECT course_id FROM lessons WHERE id=?', a.lesson_id);
    if (l) await recomputeLesson(a.user_id, a.lesson_id, l.course_id);
  });
}

export async function guardianView(guardianId: string) {
  const kids = await all('SELECT u.id,u.name,u.birth_year,g.consent_ai,g.consent_audio,g.consented_at FROM guardian_links g JOIN users u ON u.id=g.student_id WHERE g.guardian_id=?', guardianId);
  return Promise.all(kids.map(async (k) => ({
    ...k,
    consent_ai: !!k.consent_ai,
    consent_audio: !!k.consent_audio,
    courses: await all(
      `SELECT c.title, (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id AND l.status='approved') total,
         (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id=? AND p.course_id=c.id AND p.status='completed') done
       FROM enrolments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=?`,
      k.id, k.id,
    ),
    feedback: await all(
      `SELECT f.comment, f.created_at, x.title activity FROM instructor_feedback f JOIN attempts a ON a.id=f.attempt_id JOIN activities x ON x.id=a.activity_id WHERE a.user_id=? ORDER BY f.created_at DESC LIMIT 5`,
      k.id,
    ),
  })));
}

export async function setConsent(guardianId: string, studentId: string, consent: { ai: boolean; audio: boolean }) {
  const link = await get('SELECT 1 FROM guardian_links WHERE guardian_id=? AND student_id=?', guardianId, studentId);
  if (!link) throw new HttpError(403, 'You are not linked to this learner.');
  await run("UPDATE guardian_links SET consent_ai=?, consent_audio=?, consented_at=datetime('now') WHERE guardian_id=? AND student_id=?", consent.ai, consent.audio, guardianId, studentId);
}
