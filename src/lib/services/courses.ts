// Course + curriculum management: CRUD, duplication, templates, versioning,
// and the draft → testing → review → approved → published → archived workflow.
import { all, get, run, id, j, tx, uniqueSlug, audit } from '../db/index.ts';
import { HttpError } from '../validate.ts';
import { validateActivity } from '../activities/registry.ts';
import { defaultAgentConfig } from '../agent/config.ts';

export type Status = 'draft' | 'testing' | 'review' | 'approved' | 'published' | 'archived';

export const COURSE_TRANSITIONS: Record<Status, Status[]> = {
  draft: ['testing', 'review', 'archived'],
  testing: ['draft', 'review'],
  review: ['draft', 'approved'],
  approved: ['draft', 'published'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

const JSON_FIELDS = ['prerequisites', 'objectives', 'outcomes', 'required_tools', 'completion_criteria'] as const;

export function hydrateCourse(r: any) {
  if (!r) return r;
  const out = { ...r };
  for (const f of JSON_FIELDS) out[f] = j(r[f], f === 'completion_criteria' ? {} : []);
  out.is_template = !!r.is_template;
  return out;
}

export async function listCourses(opts: { status?: string; publishedOnly?: boolean } = {}) {
  const rows = await all(
    `SELECT c.*, s.name subject_name, s.slug subject_slug, cat.name category_name, cat.slug category_slug, cat.icon category_icon,
      (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id) lesson_count,
      (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id AND l.status='approved') approved_count
     FROM courses c JOIN subjects s ON s.id=c.subject_id JOIN categories cat ON cat.id=s.category_id
     ${opts.publishedOnly ? "WHERE c.status='published'" : opts.status ? 'WHERE c.status=?' : ''}
     ORDER BY cat.sort, c.title`,
    ...(opts.status && !opts.publishedOnly ? [opts.status] : []),
  );
  return rows.map(hydrateCourse);
}

export async function getCourse(courseId: string) {
  const c = await get(
    `SELECT c.*, s.name subject_name, s.category_id, cat.name category_name, cat.slug category_slug FROM courses c
     JOIN subjects s ON s.id=c.subject_id JOIN categories cat ON cat.id=s.category_id WHERE c.id=? OR c.slug=?`,
    courseId, courseId,
  );
  if (!c) throw new HttpError(404, 'Course not found');
  return hydrateCourse(c);
}

export interface CourseInput {
  subject_id: string;
  title: string;
  description?: string;
  age_min?: number | null;
  age_max?: number | null;
  grade_level?: string;
  grade_band?: string;
  proficiency?: string;
  prerequisites?: string[];
  objectives?: string[];
  outcomes?: string[];
  duration_minutes?: number | null;
  required_tools?: string[];
  teaching_style?: string;
  assessment_approach?: string;
  safety_requirements?: string;
  completion_criteria?: any;
  instructor_notes?: string;
  student_intro?: string;
  theme?: string;
  is_template?: boolean;
}

export async function createCourse(input: CourseInput, userId: string): Promise<string> {
  if (!await get('SELECT 1 FROM subjects WHERE id=?', input.subject_id)) throw new HttpError(400, 'Choose a valid subject.');
  if (input.age_min && input.age_max && input.age_min > input.age_max) throw new HttpError(400, 'Minimum age must be ≤ maximum age.');
  const cid = id('c_');
  return await tx(async () => {
    await run(
      `INSERT INTO courses (id,subject_id,title,slug,description,age_min,age_max,grade_level,proficiency,prerequisites,objectives,outcomes,duration_minutes,required_tools,teaching_style,assessment_approach,safety_requirements,instructor_notes,student_intro,theme,is_template,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      cid, input.subject_id, input.title, await uniqueSlug('courses', input.title), input.description || '', input.age_min ?? null, input.age_max ?? null,
      input.grade_level || '', input.proficiency || 'beginner', input.prerequisites || [], input.objectives || [], input.outcomes || [], input.duration_minutes ?? 0,
      input.required_tools || [], input.teaching_style || '', input.assessment_approach || '', input.safety_requirements || '', input.instructor_notes || '',
      input.student_intro || '', input.theme || 'sunrise', !!input.is_template, userId,
    );
    await syncPathway(cid, input.grade_band);
    await ensureAgent(cid, userId);
    await audit(userId, 'create', 'course', cid, input.title);
    return cid;
  });
}

export async function updateCourse(courseId: string, input: Partial<CourseInput>, userId: string) {
  const c = await getCourse(courseId);
  if (c.status === 'published') throw new HttpError(409, 'Published courses are read-only. Move it back to Draft to edit; it is hidden from students until you republish. (Tip: duplicate it to prepare a new edition while this one stays live.)');
  const fields: string[] = [];
  const vals: any[] = [];
  const allowed: (keyof CourseInput)[] = ['subject_id', 'title', 'description', 'age_min', 'age_max', 'grade_level', 'proficiency', 'prerequisites', 'objectives', 'outcomes', 'duration_minutes', 'required_tools', 'teaching_style', 'assessment_approach', 'safety_requirements', 'completion_criteria', 'instructor_notes', 'student_intro', 'theme', 'is_template'];
  for (const k of allowed) if (input[k] !== undefined) (fields.push(`${k}=?`), vals.push(input[k]));
  if (!fields.length && input.grade_band === undefined) return;
  if (fields.length) await run(`UPDATE courses SET ${fields.join(',')}, updated_at=datetime('now') WHERE id=?`, ...vals, c.id);
  await syncPathway(c.id, input.grade_band);
  await audit(userId, 'update', 'course', c.id, fields.join(','));
}

const BAND_IDS = ['K-2', '3-5', '6-8', '9-12', 'Adult'];
/** Keep level (= proficiency) and pathway (= subject + grade band) in step for the level ladder. */
async function syncPathway(courseId: string, gradeBand?: string) {
  if (gradeBand !== undefined) {
    if (gradeBand && !BAND_IDS.includes(gradeBand)) throw new HttpError(400, 'Grade band must be K-2, 3-5, 6-8 or 9-12.');
    await run('UPDATE courses SET grade_band=? WHERE id=?', gradeBand, courseId);
  }
  const c = (await get('SELECT subject_id, grade_band, proficiency FROM courses WHERE id=?', courseId))!;
  await run('UPDATE courses SET level=?, pathway=? WHERE id=?', c.proficiency || '', c.grade_band ? `${c.subject_id}--${c.grade_band}` : '', courseId);
}

export async function ensureAgent(courseId: string, userId: string | null) {
  let a = await get('SELECT * FROM agents WHERE course_id=?', courseId);
  if (!a) {
    const aid = id('ag_');
    const c = await get('SELECT * FROM courses WHERE id=?', courseId);
    const vid = id('av_');
    await run('INSERT INTO agents (id,course_id,draft_version_id) VALUES (?,?,?)', aid, courseId, vid);
    await run('INSERT INTO agent_versions (id,agent_id,version,config,status,note,created_by) VALUES (?,?,?,?,?,?,?)', vid, aid, 1, defaultAgentConfig(c as any), 'draft', 'Initial configuration', userId);
    a = await get('SELECT * FROM agents WHERE id=?', aid);
  }
  return a!;
}

// ── Structure (modules / lessons / activities) ─────────────
export async function courseTree(courseId: string, opts: { includeKeys: boolean; approvedOnly?: boolean }) {
  const modules = await all('SELECT * FROM modules WHERE course_id=? ORDER BY position', courseId);
  const lessons = await all(`SELECT * FROM lessons WHERE course_id=? ${opts.approvedOnly ? "AND status='approved'" : ''} ORDER BY position`, courseId);
  const acts = await all(`SELECT a.* FROM activities a JOIN lessons l ON l.id=a.lesson_id WHERE l.course_id=? ORDER BY a.position`, courseId);
  return modules
    .map((m) => ({
      ...m,
      lessons: lessons
        .filter((l) => l.module_id === m.id)
        .map((l) => ({
          ...hydrateLesson(l, opts.includeKeys),
          activities: acts.filter((a) => a.lesson_id === l.id).map((a) => hydrateActivity(a, opts.includeKeys)),
        })),
    }))
    .filter((m) => !opts.approvedOnly || m.lessons.length);
}

export function hydrateLesson(l: any, includeTeacher: boolean) {
  const out: any = { ...l, learn: j(l.learn, { cards: [] }), hook: j(l.hook, {}), source_refs: j(l.source_refs, []), generated: !!l.generated };
  if (includeTeacher) out.teacher = j(l.teacher, {});
  else delete out.teacher;
  return out;
}

export function hydrateActivity(a: any, includeKey: boolean) {
  const out: any = { ...a, config: j(a.config, {}), hints: j(a.hints, []), required: !!a.required };
  if (includeKey) out.answer_key = j(a.answer_key, {});
  else delete out.answer_key;
  return out;
}

async function assertEditable(courseId: string) {
  const c = await get('SELECT status FROM courses WHERE id=?', courseId);
  if (!c) throw new HttpError(404, 'Course not found');
  if (c.status === 'published') throw new HttpError(409, 'Published courses are read-only. Move the course back to Draft first.');
}

export async function addModule(courseId: string, title: string, summary = '') {
  await assertEditable(courseId);
  const pos = ((await get('SELECT MAX(position) m FROM modules WHERE course_id=?', courseId))?.m ?? -1) + 1;
  const mid = id('m_');
  await run('INSERT INTO modules (id,course_id,title,summary,position) VALUES (?,?,?,?,?)', mid, courseId, title, summary, pos);
  return mid;
}

export async function updateModule(moduleId: string, patch: { title?: string; summary?: string }) {
  const m = await get('SELECT * FROM modules WHERE id=?', moduleId);
  if (!m) throw new HttpError(404, 'Module not found');
  await assertEditable(m.course_id);
  await run('UPDATE modules SET title=COALESCE(?,title), summary=COALESCE(?,summary) WHERE id=?', patch.title ?? null, patch.summary ?? null, moduleId);
}

export async function deleteModule(moduleId: string) {
  const m = await get('SELECT * FROM modules WHERE id=?', moduleId);
  if (!m) throw new HttpError(404, 'Module not found');
  await assertEditable(m.course_id);
  await run('DELETE FROM modules WHERE id=?', moduleId);
}

export async function addLesson(moduleId: string, title: string) {
  const m = await get('SELECT * FROM modules WHERE id=?', moduleId);
  if (!m) throw new HttpError(404, 'Module not found');
  await assertEditable(m.course_id);
  const pos = ((await get('SELECT MAX(position) m FROM lessons WHERE module_id=?', moduleId))?.m ?? -1) + 1;
  const lid = id('l_');
  await run('INSERT INTO lessons (id,module_id,course_id,title,position) VALUES (?,?,?,?,?)', lid, moduleId, m.course_id, title, pos);
  return lid;
}

export async function updateLesson(lessonId: string, patch: { title?: string; objective?: string; duration_minutes?: number; learn?: any; hook?: any; teacher?: any }) {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  await assertEditable(l.course_id);
  const sets: string[] = [];
  const vals: any[] = [];
  for (const k of ['title', 'objective', 'duration_minutes', 'learn', 'hook', 'teacher'] as const) if (patch[k] !== undefined) (sets.push(`${k}=?`), vals.push(patch[k]));
  if (patch.learn && !Array.isArray(patch.learn.cards)) throw new HttpError(400, 'learn.cards must be a list');
  // Any edit to approved content sends it back to review.
  if (sets.length) await run(`UPDATE lessons SET ${sets.join(',')}, status=CASE WHEN status='approved' THEN 'review' ELSE status END, updated_at=datetime('now') WHERE id=?`, ...vals, lessonId);
}

export async function setLessonStatus(lessonId: string, status: 'draft' | 'review' | 'approved', userId: string) {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  await assertEditable(l.course_id);
  if (status === 'approved') {
    const acts = await all('SELECT * FROM activities WHERE lesson_id=?', lessonId);
    if (!acts.some((a) => a.phase === 'perform')) throw new HttpError(400, 'A lesson needs at least one Perform activity before approval.');
    for (const a of acts) {
      try {
        validateActivity(a.type, j(a.config, {}), j(a.answer_key, {}));
      } catch (e) {
        throw new HttpError(400, `Activity “${a.title}”: ${(e as Error).message}`);
      }
    }
  }
  await run("UPDATE lessons SET status=?, updated_at=datetime('now') WHERE id=?", status, lessonId);
  await audit(userId, `lesson.${status}`, 'lesson', lessonId);
}

export async function deleteLesson(lessonId: string) {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  await assertEditable(l.course_id);
  await run('DELETE FROM lessons WHERE id=?', lessonId);
}

export interface ActivityInput {
  phase: 'learn' | 'perform' | 'probe';
  type: string;
  title: string;
  instructions?: string;
  config: any;
  answer_key: any;
  hints?: string[];
  points?: number;
  required?: boolean;
}

export async function upsertActivity(lessonId: string, a: ActivityInput, activityId?: string) {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  await assertEditable(l.course_id);
  try {
    validateActivity(a.type, a.config, a.answer_key);
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
  if (activityId) {
    const ex = await get('SELECT * FROM activities WHERE id=? AND lesson_id=?', activityId, lessonId);
    if (!ex) throw new HttpError(404, 'Activity not found');
    await run('UPDATE activities SET phase=?,type=?,title=?,instructions=?,config=?,answer_key=?,hints=?,points=?,required=? WHERE id=?', a.phase, a.type, a.title, a.instructions || '', a.config, a.answer_key, a.hints || [], a.points ?? 10, a.required ?? true, activityId);
  } else {
    const pos = ((await get('SELECT MAX(position) m FROM activities WHERE lesson_id=?', lessonId))?.m ?? -1) + 1;
    activityId = id('a_');
    await run('INSERT INTO activities (id,lesson_id,phase,type,title,instructions,position,config,answer_key,hints,points,required) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', activityId, lessonId, a.phase, a.type, a.title, a.instructions || '', pos, a.config, a.answer_key, a.hints || [], a.points ?? 10, a.required ?? true);
  }
  await run("UPDATE lessons SET status=CASE WHEN status='approved' THEN 'review' ELSE status END, updated_at=datetime('now') WHERE id=?", lessonId);
  return activityId;
}

export async function deleteActivity(activityId: string) {
  const a = await get('SELECT a.*, l.course_id FROM activities a JOIN lessons l ON l.id=a.lesson_id WHERE a.id=?', activityId);
  if (!a) throw new HttpError(404, 'Activity not found');
  await assertEditable(a.course_id);
  await run('DELETE FROM activities WHERE id=?', activityId);
}

// ── Workflow ───────────────────────────────────────────────
export async function snapshot(courseId: string) {
  return { course: await getCourse(courseId), modules: await courseTree(courseId, { includeKeys: true }) };
}

export async function publishChecks(courseId: string): Promise<{ ok: boolean; issues: string[] }> {
  const issues: string[] = [];
  const lessons = await all('SELECT status FROM lessons WHERE course_id=?', courseId);
  if (!lessons.length) issues.push('The course has no lessons.');
  else if (!lessons.some((l) => l.status === 'approved')) issues.push('At least one lesson must be approved.');
  const pending = lessons.filter((l) => l.status !== 'approved').length;
  if (pending) issues.push(`${pending} lesson(s) are not approved and will be hidden from students.`);
  const agent = await get('SELECT * FROM agents WHERE course_id=?', courseId);
  const draft = agent?.draft_version_id ? await get('SELECT status FROM agent_versions WHERE id=?', agent.draft_version_id) : null;
  if (!agent?.published_version_id && draft?.status !== 'approved') issues.push('The course agent configuration must be approved (Agent → Review & approve).');
  const unverified = (await get("SELECT COUNT(*) n FROM curriculum_mappings m JOIN curriculum_tracks t ON t.id=m.track_id WHERE t.course_id=? AND m.review_status!='approved'", courseId))?.n || 0;
  if (unverified) issues.push(`${unverified} curriculum mapping(s) are unverified and will not be shown to learners.`);
  const blocking = issues.filter((i) => !i.includes('will be hidden') && !i.includes('will not be shown'));
  return { ok: blocking.length === 0, issues };
}

export async function transitionCourse(courseId: string, to: Status, userId: string, note = '') {
  const c = await getCourse(courseId);
  const from = c.status as Status;
  if (!COURSE_TRANSITIONS[from].includes(to)) throw new HttpError(409, `Cannot move a course from ${from} to ${to}.`);
  if (to === 'approved' || to === 'published') {
    const pc = await publishChecks(c.id);
    if (!pc.ok) throw new HttpError(409, `Not ready: ${pc.issues.join(' ')}`);
  }
  return await tx(async () => {
    if (to === 'published') {
      const ver = ((await get('SELECT MAX(version) v FROM course_versions WHERE course_id=?', c.id))?.v || 0) + 1;
      await run('INSERT INTO course_versions (id,course_id,version,label,snapshot,created_by) VALUES (?,?,?,?,?,?)', id('cv_'), c.id, ver, note || `Published v${ver}`, await snapshot(c.id), userId);
      await run('UPDATE courses SET version=? WHERE id=?', ver, c.id);
      // Publish the approved agent config alongside the course.
      const agent = await get('SELECT * FROM agents WHERE course_id=?', c.id);
      const draft = agent?.draft_version_id ? await get('SELECT * FROM agent_versions WHERE id=?', agent.draft_version_id) : null;
      if (agent && draft && draft.status === 'approved') {
        if (agent.published_version_id) await run("UPDATE agent_versions SET status='archived' WHERE id=?", agent.published_version_id);
        await run("UPDATE agent_versions SET status='published' WHERE id=?", draft.id);
        await run('UPDATE agents SET published_version_id=? WHERE id=?', draft.id, agent.id);
      }
    }
    await run("UPDATE courses SET status=?, updated_at=datetime('now') WHERE id=?", to, c.id);
    await audit(userId, `course.${to}`, 'course', c.id, note);
    return { from, to };
  });
}

export async function courseVersions(courseId: string) {
  return await all('SELECT id,version,label,created_at,created_by FROM course_versions WHERE course_id=? ORDER BY version DESC', courseId);
}

/** Restore content from a published snapshot into the (draft) course. */
export async function restoreCourseVersion(courseId: string, versionId: string, userId: string) {
  const c = await getCourse(courseId);
  if (c.status === 'published') throw new HttpError(409, 'Move the course to Draft before restoring an earlier version.');
  const v = await get('SELECT * FROM course_versions WHERE id=? AND course_id=?', versionId, c.id);
  if (!v) throw new HttpError(404, 'Version not found');
  const snap = j<any>(v.snapshot, null);
  await tx(async () => {
    await run('DELETE FROM modules WHERE course_id=?', c.id);
    await importTree(c.id, snap.modules, false);
    await audit(userId, 'course.restore', 'course', c.id, `v${v.version}`);
  });
}

async function importTree(courseId: string, modules: any[], resetStatus: boolean) {
  for (const m of modules) {
    const mid = id('m_');
    await run('INSERT INTO modules (id,course_id,title,summary,position) VALUES (?,?,?,?,?)', mid, courseId, m.title, m.summary || '', m.position);
    for (const l of m.lessons) {
      const lid = id('l_');
      await run(
        'INSERT INTO lessons (id,module_id,course_id,title,objective,duration_minutes,position,status,learn,hook,teacher,source_refs,generated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        lid, mid, courseId, l.title, l.objective, l.duration_minutes || 20, l.position, resetStatus ? 'draft' : l.status, l.learn, l.hook, l.teacher || {}, resetStatus ? [] : l.source_refs || [], !!l.generated,
      );
      for (const a of l.activities) await run('INSERT INTO activities (id,lesson_id,phase,type,title,instructions,position,config,answer_key,hints,points,required) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', id('a_'), lid, a.phase, a.type, a.title, a.instructions, a.position, a.config, a.answer_key || {}, a.hints, a.points, a.required);
    }
  }
}

/** Duplicate a course (or instantiate a template) as a new draft. Knowledge files are not copied. */
export async function duplicateCourse(courseId: string, userId: string, title?: string) {
  const src = await getCourse(courseId);
  return await tx(async () => {
    const newId = await createCourse({ ...src, title: title || `${src.title} (copy)`, is_template: false }, userId);
    await run('UPDATE courses SET completion_criteria=? WHERE id=?', src.completion_criteria, newId);
    await importTree(newId, await courseTree(src.id, { includeKeys: true }), true);
    // Copy agent config (as draft v1)
    const srcAgent = await get('SELECT * FROM agents WHERE course_id=?', src.id);
    const srcVer = srcAgent ? await get('SELECT config FROM agent_versions WHERE id=?', srcAgent.draft_version_id || srcAgent.published_version_id) : null;
    if (srcVer) {
      const ag = await get('SELECT * FROM agents WHERE course_id=?', newId);
      await run('UPDATE agent_versions SET config=?, note=? WHERE id=?', srcVer.config, `Copied from ${src.title}`, ag!.draft_version_id);
    }
    await audit(userId, 'duplicate', 'course', newId, `from ${src.id}`);
    return newId;
  });
}
