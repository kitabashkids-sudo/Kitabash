// API routes. Every handler states its permission explicitly.
import { storage } from '../src/lib/storage.ts';
import { route, setSessionCookie, clearSessionCookie, type Ctx } from './http.ts';
import { v, parse, HttpError } from '../src/lib/validate.ts';
import { login, createSession, destroySession, requirePerm, requireUser, can, consentFor, ageOf, PERMISSIONS, type Permission } from '../src/lib/auth.ts';
import { get, all, run } from '../src/lib/db/index.ts';
import * as C from '../src/lib/services/courses.ts';
import * as L from '../src/lib/services/learning.ts';
import * as A from '../src/lib/services/agents.ts';
import * as K from '../src/lib/services/knowledge.ts';
import * as ADM from '../src/lib/services/admin.ts';
import * as T from '../src/lib/services/teaching.ts';
import * as S from '../src/lib/services/setup.ts';
import { respond, rateLimit, insights } from '../src/lib/agent/runtime.ts';
import { generateCurriculum } from '../src/lib/agent/generator.ts';
import { ACTIVITY_TYPES } from '../src/lib/activities/registry.ts';
import { HOOK_PRESETS } from '../src/lib/lessonTypes.ts';

const strList = (max = 60) => v.arr(v.str({ max: 500 }), { optional: true, max });
const opt = (s = 5000) => v.str({ optional: true, max: s });

async function sendFile(c: Ctx, file: { key: string; mime: string; name?: string }) {
  const data = await storage().read(file.key);
  if (!data) throw new HttpError(404, 'File missing from storage');
  const isSvg = file.mime === 'image/svg+xml';
  c.res.writeHead(200, {
    'content-type': file.mime,
    'content-length': data.length,
    'cache-control': 'private, max-age=300',
    // Uploaded documents download rather than render; SVG gets a locked-down CSP.
    ...(isSvg ? { 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    ...(file.name ? { 'content-disposition': `attachment; filename="${file.name.replace(/[^\w.\- ]/g, '_')}"` } : {}),
  });
  c.res.end(data);
}

// ── First-run setup (only works while there are no users) ──
route('GET', '/api/setup', async () => S.setupStatus());
route('POST', '/api/setup', async (c) => {
  const b = parse(
    v.obj({
      name: v.str({ min: 1, max: 120 }),
      email: v.str({ max: 200, pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ }),
      password: v.str({ min: 8, max: 200, trim: false }),
      loadDemo: v.bool({ optional: true }),
      demoPeople: v.bool({ optional: true }),
      code: v.str({ optional: true, max: 200 }),
    }),
    await c.body(),
  );
  const adminId = await S.runSetup(b);
  const sess = await createSession(adminId);
  setSessionCookie(c.res, sess.token, sess.expires);
  return { ok: true };
});

// ── Auth ───────────────────────────────────────────────────
const loginAttempts = new Map<string, number[]>();
route('POST', '/api/auth/login', async (c) => {
  const b = parse(v.obj({ email: v.str({ max: 200 }), password: v.str({ max: 200, trim: false }) }), await c.body());
  const ip = c.req.socket.remoteAddress || 'x';
  const now = Date.now();
  const recent = (loginAttempts.get(ip) || []).filter((t) => now - t < 15 * 60_000);
  if (recent.length >= 20) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
  recent.push(now);
  loginAttempts.set(ip, recent);
  const user = await login(b.email.toLowerCase(), b.password);
  const s = await createSession(user.id);
  setSessionCookie(c.res, s.token, s.expires);
  return { user };
});
route('POST', '/api/auth/logout', async (c) => {
  if (c.token) await destroySession(c.token);
  clearSessionCookie(c.res);
});
route('GET', '/api/me', async (c) => {
  if (!c.user) return { user: null };
  return {
    user: c.user,
    age: ageOf(c.user),
    consent: await consentFor(c.user),
    permissions: (Object.keys(PERMISSIONS) as Permission[]).filter((p) => can(c.user, p)),
  };
});

// ── Catalogue & learning ───────────────────────────────────
route('GET', '/api/catalog', async (c) => (requirePerm(c.user, 'catalog.read'), await L.catalogue()));
route('GET', '/api/activity-types', async () => ({ types: Object.values(ACTIVITY_TYPES).map(({ validate, grade, ...m }) => m), hookPresets: HOOK_PRESETS }));
route('GET', '/api/my', async (c) => await L.myLearning(requireUser(c.user)));
route('GET', '/api/courses/:id/learn', async (c) => await L.studentCourse(requireUser(c.user), c.params.id));
route('POST', '/api/courses/:id/enrol', async (c) => await L.enrol(requirePerm(c.user, 'learn'), c.params.id));
route('GET', '/api/lessons/:id/learn', async (c) => await L.lessonForLearner(requirePerm(c.user, 'learn'), c.params.id));
route('POST', '/api/lessons/:id/phase', async (c) => {
  const b = parse(v.obj({ phase: v.oneOf(['learn', 'perform', 'probe'] as const) }), await c.body());
  await L.setPhase(requirePerm(c.user, 'learn'), c.params.id, b.phase);
});
route('POST', '/api/activities/:id/attempt', async (c) => {
  const u = requirePerm(c.user, 'learn');
  const b = parse(v.obj({ response: v.json(), hintsUsed: v.int({ optional: true, min: 0, max: 50 }) }), await c.body());
  return await L.submitAttempt(u, c.params.id, b.response, b.hintsUsed || 0);
});

const msgSchema = v.arr(v.obj({ role: v.oneOf(['user', 'assistant'] as const), content: v.str({ max: 2000 }) }), { max: 30, min: 1 });
route('POST', '/api/tutor', async (c) => {
  const u = requirePerm(c.user, 'learn');
  const consent = await consentFor(u);
  if (!consent.ai) throw new HttpError(403, 'Your parent or guardian needs to allow the AI helper first.');
  rateLimit(`tutor:${u.id}`);
  const b = parse(v.obj({ courseId: v.str({ max: 40 }), lessonId: opt(40), activityId: opt(40), messages: msgSchema }), await c.body());
  const course = await C.getCourse(b.courseId);
  if (u.role === 'student' && course.status !== 'published') throw new HttpError(404, 'Course not available');
  return await respond({ courseId: course.id, lessonId: b.lessonId || undefined, activityId: b.activityId || undefined, messages: b.messages, surface: 'tutor', userId: u.id, learnerAge: ageOf(u) });
});
route('POST', '/api/tutor/rate', async (c) => {
  requireUser(c.user);
  const b = parse(v.obj({ logId: v.str({ max: 40 }), rating: v.int({ min: -1, max: 1 }) }), await c.body());
  await run('UPDATE agent_logs SET rating=? WHERE id=?', b.rating, b.logId);
});

route('GET', '/api/assets/:id/file', async (c) => {
  requireUser(c.user);
  await sendFile(c, await ADM.assetFile(c.params.id));
});
route('GET', '/api/resources/:id/file', async (c) => {
  const u = requireUser(c.user);
  const f = await K.resourceFile(c.params.id);
  if (f.audience === 'teacher') requirePerm(u, 'teacher.content');
  await sendFile(c, f);
});

// ── Teacher workspace ──────────────────────────────────────
route('GET', '/api/teach/courses', async (c) => (requirePerm(c.user, 'teacher.content'), await T.teachCourses()));
route('GET', '/api/teach/lessons/:id', async (c) => (requirePerm(c.user, 'teacher.content'), await T.teacherLesson(c.params.id)));
route('POST', '/api/teach/cofacilitate', async (c) => {
  const u = requirePerm(c.user, 'teacher.cofacilitate');
  rateLimit(`cofac:${u.id}`);
  const b = parse(v.obj({ lessonId: v.str({ max: 40 }), task: v.oneOf(['explain', 'activity', 'example', 'hints', 'recap', 'ask'] as const), question: opt(1500), activityId: opt(40) }), await c.body());
  const l = await get('SELECT course_id, title, objective FROM lessons WHERE id=?', b.lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  const prompts: Record<string, string> = {
    explain: `Give me an alternate explanation of “${l.objective}” for this age group, with an analogy.`,
    activity: `Suggest a quick 5-minute classroom activity for “${l.objective}”, with differentiation.`,
    example: `Give a worked example for “${l.objective}”.`,
    hints: 'Write a 3-step hint ladder for the current activity.',
    recap: `Write 3–4 recap questions for “${l.objective}”.`,
    ask: b.question || 'Help me teach this lesson.',
  };
  return await respond({ courseId: l.course_id, lessonId: b.lessonId, activityId: b.activityId || undefined, messages: [{ role: 'user', content: prompts[b.task] }], surface: 'cofacilitator', userId: u.id, extra: { task: b.task } });
});
route('GET', '/api/teach/courses/:id/report', async (c) => (requirePerm(c.user, 'student.review'), await L.courseReport(c.params.id)));
route('POST', '/api/teach/attempts/:id/feedback', async (c) => {
  const u = requirePerm(c.user, 'student.review');
  const b = parse(v.obj({ comment: v.str({ min: 1, max: 2000 }), score: v.int({ optional: true, min: 0, max: 1000 }) }), await c.body());
  await L.addFeedback(u.id, c.params.id, b.comment, b.score);
});

// ── Guardian ───────────────────────────────────────────────
route('GET', '/api/guardian', async (c) => await L.guardianView(requirePerm(c.user, 'guardian.view').id));
route('POST', '/api/guardian/consent', async (c) => {
  const u = requirePerm(c.user, 'guardian.view');
  const b = parse(v.obj({ studentId: v.str({ max: 40 }), ai: v.bool(), audio: v.bool() }), await c.body());
  await L.setConsent(u.id, b.studentId, { ai: b.ai, audio: b.audio });
});

// ── Admin: taxonomy ────────────────────────────────────────
route('GET', '/api/admin/taxonomy', async (c) => (requirePerm(c.user, 'catalog.read'), await ADM.taxonomy()));
route('POST', '/api/admin/categories', async (c) => {
  const u = requirePerm(c.user, 'taxonomy.edit');
  const b = parse(v.obj({ name: v.str({ min: 2, max: 80 }), description: opt(500), icon: opt(20) }), await c.body());
  return { id: await ADM.addCategory(b.name, b.description, b.icon, u.id) };
});
route('PATCH', '/api/admin/categories/:id', async (c) => {
  requirePerm(c.user, 'taxonomy.edit');
  await ADM.updateCategory(c.params.id, parse(v.obj({ name: v.str({ optional: true, max: 80 }), description: opt(500), icon: opt(20) }), await c.body()));
});
route('DELETE', '/api/admin/categories/:id', async (c) => (requirePerm(c.user, 'taxonomy.edit'), await ADM.deleteCategory(c.params.id)));
route('POST', '/api/admin/subjects', async (c) => {
  const u = requirePerm(c.user, 'taxonomy.edit');
  const b = parse(v.obj({ category_id: v.str({ max: 40 }), name: v.str({ min: 2, max: 80 }), description: opt(500) }), await c.body());
  return { id: await ADM.addSubject(b.category_id, b.name, b.description, u.id) };
});
route('PATCH', '/api/admin/subjects/:id', async (c) => {
  requirePerm(c.user, 'taxonomy.edit');
  const b = await c.body();
  await ADM.updateSubject(c.params.id, parse(v.obj({ name: v.str({ optional: true, max: 80 }), description: opt(500), category_id: opt(40) }), b));
});
route('DELETE', '/api/admin/subjects/:id', async (c) => (requirePerm(c.user, 'taxonomy.edit'), await ADM.deleteSubject(c.params.id)));

// ── Admin: courses ─────────────────────────────────────────
const courseShape = {
  subject_id: v.str({ max: 40 }),
  title: v.str({ min: 3, max: 120 }),
  description: opt(3000),
  age_min: v.int({ optional: true, min: 3, max: 99 }),
  age_max: v.int({ optional: true, min: 3, max: 99 }),
  grade_level: opt(80),
  proficiency: opt(40),
  prerequisites: strList(),
  objectives: strList(),
  outcomes: strList(),
  duration_minutes: v.int({ optional: true, min: 0, max: 100000 }),
  required_tools: strList(),
  teaching_style: opt(2000),
  assessment_approach: opt(2000),
  safety_requirements: opt(2000),
  instructor_notes: opt(5000),
  student_intro: opt(2000),
  theme: opt(20),
  is_template: v.bool({ optional: true }),
};
const partial = (shape: Record<string, any>) => {
  // Make every field optional for PATCH while keeping its validator.
  return (val: unknown, p: string) => {
    if (!val || typeof val !== 'object') throw new HttpError(400, 'body must be an object');
    const out: any = {};
    for (const k of Object.keys(shape)) if ((val as any)[k] !== undefined) out[k] = shape[k]((val as any)[k], k);
    if ((val as any).completion_criteria !== undefined) out.completion_criteria = v.json({ maxBytes: 2000 })((val as any).completion_criteria, 'completion_criteria');
    return out;
  };
};

route('GET', '/api/admin/courses', async (c) => (requirePerm(c.user, 'course.edit'), await C.listCourses()));
route('POST', '/api/admin/courses', async (c) => {
  const u = requirePerm(c.user, 'course.edit');
  return { id: await C.createCourse(parse(v.obj(courseShape), await c.body()) as any, u.id) };
});
route('GET', '/api/admin/courses/:id', async (c) => {
  requirePerm(c.user, 'course.edit');
  const course = await C.getCourse(c.params.id);
  return { course, modules: await C.courseTree(course.id, { includeKeys: true }), checks: await C.publishChecks(course.id), versions: await C.courseVersions(course.id), transitions: C.COURSE_TRANSITIONS[course.status as C.Status] };
});
route('PATCH', '/api/admin/courses/:id', async (c) => {
  const u = requirePerm(c.user, 'course.edit');
  await C.updateCourse(c.params.id, parse(partial(courseShape) as any, await c.body()), u.id);
});
route('POST', '/api/admin/courses/:id/duplicate', async (c) => {
  const u = requirePerm(c.user, 'course.edit');
  const b = parse(v.obj({ title: opt(120) }), await c.body());
  return { id: await C.duplicateCourse(c.params.id, u.id, b.title || undefined) };
});
route('POST', '/api/admin/courses/:id/transition', async (c) => {
  const b = parse(v.obj({ to: v.oneOf(['draft', 'testing', 'review', 'approved', 'published', 'archived'] as const), note: opt(300) }), await c.body());
  const u = requirePerm(c.user, b.to === 'published' ? 'course.publish' : b.to === 'approved' ? 'course.approve' : 'course.edit');
  return await C.transitionCourse(c.params.id, b.to, u.id, b.note);
});
route('POST', '/api/admin/courses/:id/restore', async (c) => {
  const u = requirePerm(c.user, 'course.edit');
  const b = parse(v.obj({ versionId: v.str({ max: 40 }) }), await c.body());
  await C.restoreCourseVersion(c.params.id, b.versionId, u.id);
});
route('POST', '/api/admin/courses/:id/generate', async (c) => {
  const u = requirePerm(c.user, 'course.edit');
  rateLimit(`gen:${u.id}`, 6);
  const b = parse(v.obj({ lessonsPerModule: v.int({ optional: true, min: 1, max: 6 }), replaceDrafts: v.bool({ optional: true }) }), await c.body());
  return await generateCurriculum(c.params.id, { lessonsPerModule: b.lessonsPerModule || 3, replaceDrafts: b.replaceDrafts });
});
route('POST', '/api/admin/courses/:id/modules', async (c) => {
  requirePerm(c.user, 'course.edit');
  const b = parse(v.obj({ title: v.str({ min: 1, max: 120 }), summary: opt(500) }), await c.body());
  return { id: await C.addModule(c.params.id, b.title, b.summary) };
});
route('PATCH', '/api/admin/modules/:id', async (c) => {
  requirePerm(c.user, 'course.edit');
  await C.updateModule(c.params.id, parse(v.obj({ title: v.str({ optional: true, max: 120 }), summary: opt(500) }), await c.body()));
});
route('DELETE', '/api/admin/modules/:id', async (c) => (requirePerm(c.user, 'course.edit'), await C.deleteModule(c.params.id)));
route('POST', '/api/admin/modules/:id/lessons', async (c) => {
  requirePerm(c.user, 'course.edit');
  const b = parse(v.obj({ title: v.str({ min: 1, max: 120 }) }), await c.body());
  return { id: await C.addLesson(c.params.id, b.title) };
});
route('PATCH', '/api/admin/lessons/:id', async (c) => {
  requirePerm(c.user, 'course.edit');
  const b = parse(
    v.obj({ title: v.str({ optional: true, max: 120 }), objective: opt(500), duration_minutes: v.int({ optional: true, min: 1, max: 600 }), learn: v.json({ optional: true }), hook: v.json({ optional: true }), teacher: v.json({ optional: true }) }),
    await c.body(),
  );
  const patch: any = { ...b };
  // Optional text fields parse missing values as ''; treat those as "not provided".
  for (const k of Object.keys(patch)) if (patch[k] === undefined || patch[k] === null || patch[k] === '') delete patch[k];
  await C.updateLesson(c.params.id, patch);
});
route('DELETE', '/api/admin/lessons/:id', async (c) => (requirePerm(c.user, 'course.edit'), await C.deleteLesson(c.params.id)));
route('POST', '/api/admin/lessons/:id/status', async (c) => {
  const b = parse(v.obj({ status: v.oneOf(['draft', 'review', 'approved'] as const) }), await c.body());
  const u = requirePerm(c.user, b.status === 'approved' ? 'course.approve' : 'course.edit');
  await C.setLessonStatus(c.params.id, b.status, u.id);
});
const activityShape = v.obj({
  phase: v.oneOf(['learn', 'perform', 'probe'] as const),
  type: v.str({ max: 40 }),
  title: v.str({ min: 1, max: 160 }),
  instructions: opt(2000),
  config: v.json({ maxBytes: 100_000 }),
  answer_key: v.json({ maxBytes: 50_000 }),
  hints: v.arr(v.str({ max: 500 }), { optional: true, max: 8 }),
  points: v.int({ optional: true, min: 0, max: 100 }),
  required: v.bool({ optional: true }),
});
route('POST', '/api/admin/lessons/:id/activities', async (c) => {
  requirePerm(c.user, 'course.edit');
  return { id: await C.upsertActivity(c.params.id, parse(activityShape, await c.body()) as any) };
});
route('PUT', '/api/admin/activities/:id', async (c) => {
  requirePerm(c.user, 'course.edit');
  const a = await get('SELECT lesson_id FROM activities WHERE id=?', c.params.id);
  if (!a) throw new HttpError(404, 'Activity not found');
  return { id: await C.upsertActivity(a.lesson_id, parse(activityShape, await c.body()) as any, c.params.id) };
});
route('DELETE', '/api/admin/activities/:id', async (c) => (requirePerm(c.user, 'course.edit'), await C.deleteActivity(c.params.id)));

// ── Admin: knowledge library ───────────────────────────────
route('GET', '/api/admin/courses/:id/resources', async (c) => (requirePerm(c.user, 'knowledge.manage'), await K.listResources(c.params.id)));
route('PUT', '/api/admin/courses/:id/resources', async (c) => {
  const u = requirePerm(c.user, 'knowledge.manage');
  const filename = decodeURIComponent(String(c.req.headers['x-filename'] || ''));
  if (!filename) throw new HttpError(400, 'Missing file name');
  const data = await c.raw(16 * 1024 * 1024);
  const audience = c.query.get('audience') === 'student' ? 'student' : 'teacher';
  return await K.uploadResource(c.params.id, { filename, mime: String(c.req.headers['content-type'] || ''), data }, { title: (c.query.get('title') || '').slice(0, 160), audience }, u.id, c.query.get('replaces') || undefined);
});
route('POST', '/api/admin/courses/:id/links', async (c) => {
  const u = requirePerm(c.user, 'knowledge.manage');
  const b = parse(v.obj({ url: v.str({ max: 2000 }), title: opt(160) }), await c.body());
  return { id: await K.addUrl(c.params.id, b.url, b.title, u.id) };
});
route('POST', '/api/admin/resources/:id/verify', async (c) => (requirePerm(c.user, 'knowledge.manage'), await K.verifyUrl(c.params.id)));
route('GET', '/api/admin/resources/:id', async (c) => (requirePerm(c.user, 'knowledge.manage'), await K.previewResource(c.params.id)));
route('PATCH', '/api/admin/resources/:id', async (c) => {
  requirePerm(c.user, 'knowledge.manage');
  const b = parse(v.obj({ title: opt(160), audience: v.oneOf(['teacher', 'student'] as const, { optional: true }) }), await c.body());
  await K.updateResourceMeta(c.params.id, { title: b.title || undefined, audience: b.audience });
});
route('DELETE', '/api/admin/resources/:id', async (c) => {
  const u = requirePerm(c.user, 'knowledge.manage');
  await K.deleteResource(c.params.id, u.id);
});
route('GET', '/api/admin/courses/:id/search', async (c) => (requirePerm(c.user, 'knowledge.manage'), await K.searchKnowledge(c.params.id, (c.query.get('q') || '').slice(0, 300))));

// ── Admin: agent studio ────────────────────────────────────
route('GET', '/api/admin/courses/:id/agent', async (c) => (requirePerm(c.user, 'agent.configure'), await A.agentOverview(c.params.id)));
route('PUT', '/api/admin/courses/:id/agent', async (c) => {
  const u = requirePerm(c.user, 'agent.configure');
  const b = parse(v.obj({ config: v.json({ maxBytes: 100_000 }), note: opt(300) }), await c.body());
  return { versionId: await A.saveAgentConfig(c.params.id, b.config, b.note, u.id) };
});
route('POST', '/api/admin/courses/:id/agent/transition', async (c) => {
  const b = parse(v.obj({ to: v.oneOf(['draft', 'testing', 'review', 'approved'] as const) }), await c.body());
  const u = requirePerm(c.user, b.to === 'approved' ? 'agent.publish' : 'agent.configure');
  await A.transitionAgentVersion(c.params.id, b.to, u.id);
});
route('POST', '/api/admin/courses/:id/agent/publish', async (c) => await A.publishAgent(c.params.id, requirePerm(c.user, 'agent.publish').id));
route('POST', '/api/admin/courses/:id/agent/rollback', async (c) => {
  const u = requirePerm(c.user, 'agent.publish');
  await A.rollbackAgent(c.params.id, parse(v.obj({ versionId: v.str({ max: 40 }) }), await c.body()).versionId, u.id);
});
route('GET', '/api/admin/agent-versions/:id', async (c) => {
  requirePerm(c.user, 'agent.configure');
  const r = await get('SELECT * FROM agent_versions WHERE id=?', c.params.id);
  if (!r) throw new HttpError(404, 'Version not found');
  return { ...r, config: JSON.parse(r.config) };
});
route('GET', '/api/admin/courses/:id/tests', async (c) => (requirePerm(c.user, 'agent.test'), await A.listTests(c.params.id)));
route('POST', '/api/admin/courses/:id/tests', async (c) => {
  requirePerm(c.user, 'agent.test');
  const b = parse(
    v.obj({
      category: v.oneOf(['typical', 'incorrect', 'misconception', 'off_topic', 'age', 'ambiguous', 'unsupported', 'grounding', 'safety'] as const),
      prompt: v.str({ min: 1, max: 1000 }),
      student_age: v.int({ optional: true, min: 3, max: 99 }),
      expectations: v.obj({ mustInclude: strList(10), mustNotInclude: strList(10), expectRefusal: v.json({ optional: true }), expectCitation: v.json({ optional: true }), expectEscalation: v.json({ optional: true }) }),
    }),
    await c.body(),
  );
  const e: any = { ...b.expectations };
  for (const k of ['expectRefusal', 'expectCitation', 'expectEscalation']) if (typeof e[k] !== 'boolean') delete e[k];
  return { id: await A.addTest(c.params.id, { ...b, expectations: e }) };
});
route('POST', '/api/admin/courses/:id/tests/starter', async (c) => (requirePerm(c.user, 'agent.test'), { added: await A.addStarterSuite(c.params.id) }));
route('DELETE', '/api/admin/courses/:id/tests/:tid', async (c) => (requirePerm(c.user, 'agent.test'), await A.deleteTest(c.params.id, c.params.tid)));
route('POST', '/api/admin/courses/:id/tests/run', async (c) => {
  const u = requirePerm(c.user, 'agent.test');
  rateLimit(`tests:${u.id}`, 10);
  const b = parse(v.obj({ testId: opt(40) }), await c.body());
  return await A.runTests(c.params.id, u.id, b.testId || undefined);
});
route('POST', '/api/admin/courses/:id/sandbox', async (c) => {
  const u = requirePerm(c.user, 'agent.test');
  rateLimit(`sandbox:${u.id}`);
  const b = parse(v.obj({ messages: msgSchema, lessonId: opt(40), age: v.int({ optional: true, min: 3, max: 99 }) }), await c.body());
  const ov = await A.agentOverview(c.params.id);
  return await respond({ courseId: c.params.id, lessonId: b.lessonId || undefined, messages: b.messages, surface: 'sandbox', userId: u.id, learnerAge: b.age, config: ov.draft?.config, log: false });
});
route('GET', '/api/admin/courses/:id/insights', async (c) => {
  requirePerm(c.user, 'insights.read');
  const rep = await L.courseReport(c.params.id);
  return { agent: await insights(c.params.id), activityStats: rep.activityStats, learners: rep.learners.length, reviewQueue: rep.reviewQueue.length };
});

// ── Admin: curriculum mapping ──────────────────────────────
route('GET', '/api/admin/courses/:id/tracks', async (c) => (requirePerm(c.user, 'mapping.edit'), await ADM.listTracks(c.params.id)));
route('POST', '/api/admin/courses/:id/tracks', async (c) => {
  requirePerm(c.user, 'mapping.edit');
  const b = parse(v.obj({ pathway: v.oneOf(['board', 'olympiad', 'general'] as const), board: opt(80), grade: opt(40), subject: opt(80), syllabus_code: opt(40), syllabus_year: opt(20), title: v.str({ min: 2, max: 160 }) }), await c.body());
  return { id: await ADM.addTrack(c.params.id, b) };
});
route('DELETE', '/api/admin/tracks/:id', async (c) => (requirePerm(c.user, 'mapping.edit'), await ADM.deleteTrack(c.params.id)));
route('POST', '/api/admin/tracks/:id/mappings', async (c) => {
  requirePerm(c.user, 'mapping.edit');
  const b = parse(v.obj({ topic: v.str({ min: 1, max: 300 }), objective: opt(1000), assessment_format: opt(300), reference_source: opt(500), lesson_id: opt(40) }), await c.body());
  return { id: await ADM.addMapping(c.params.id, { ...b, lesson_id: b.lesson_id || null }) };
});
route('POST', '/api/admin/tracks/:id/import', async (c) => {
  requirePerm(c.user, 'mapping.edit');
  return { imported: await ADM.importMappings(c.params.id, parse(v.obj({ csv: v.str({ max: 500_000 }) }), await c.body()).csv) };
});
route('POST', '/api/admin/mappings/:id/review', async (c) => {
  const b = parse(v.obj({ status: v.oneOf(['unverified', 'in_review', 'approved', 'rejected'] as const), lessonId: opt(40) }), await c.body());
  const u = requirePerm(c.user, b.status === 'approved' ? 'mapping.approve' : 'mapping.edit');
  await ADM.reviewMapping(c.params.id, b.status, u.id, b.lessonId || null);
});
route('DELETE', '/api/admin/mappings/:id', async (c) => (requirePerm(c.user, 'mapping.edit'), await ADM.deleteMapping(c.params.id)));

// ── Admin: assets ──────────────────────────────────────────
route('GET', '/api/admin/assets', async (c) => (requirePerm(c.user, 'assets.read'), await ADM.listAssets(c.query.get('q') || undefined)));
const assetMeta = (c: Ctx) => ({
  title: (c.query.get('title') || '').slice(0, 160),
  tags: (c.query.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20),
  alt_text: (c.query.get('alt') || '').slice(0, 500),
  captions: (c.query.get('captions') || '').slice(0, 2000),
});
route('PUT', '/api/admin/assets', async (c) => {
  const u = requirePerm(c.user, 'assets.manage');
  const filename = decodeURIComponent(String(c.req.headers['x-filename'] || ''));
  return { id: await ADM.uploadAsset({ filename, data: await c.raw(26 * 1024 * 1024) }, assetMeta(c), u.id) };
});
route('PUT', '/api/admin/assets/:id', async (c) => {
  const u = requirePerm(c.user, 'assets.manage');
  const filename = decodeURIComponent(String(c.req.headers['x-filename'] || ''));
  return { id: await ADM.uploadAsset({ filename, data: await c.raw(26 * 1024 * 1024) }, assetMeta(c), u.id, c.params.id) };
});
route('PATCH', '/api/admin/assets/:id', async (c) => {
  requirePerm(c.user, 'assets.manage');
  const b = parse(v.obj({ title: opt(160), tags: strList(20), alt_text: opt(500), captions: opt(2000) }), await c.body());
  await ADM.updateAssetMeta(c.params.id, { title: b.title || undefined, tags: b.tags.length ? b.tags : undefined, alt_text: b.alt_text || undefined, captions: b.captions || undefined });
});
route('DELETE', '/api/admin/assets/:id', async (c) => (requirePerm(c.user, 'assets.manage'), await ADM.deleteAsset(c.params.id)));

// ── Admin: platform ────────────────────────────────────────
route('GET', '/api/admin/integrations', async (c) => (requirePerm(c.user, 'integrations.manage'), await ADM.integrationStatus()));
route('GET', '/api/admin/users', async (c) => {
  requirePerm(c.user, 'users.manage');
  return { users: await ADM.listUsers(), links: await all('SELECT * FROM guardian_links'), enrolments: await all('SELECT user_id, course_id FROM enrolments') };
});
route('POST', '/api/admin/users', async (c) => {
  const u = requirePerm(c.user, 'users.manage');
  const b = parse(v.obj({ email: v.str({ max: 200, pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ }), name: v.str({ min: 1, max: 120 }), role: v.oneOf(['admin', 'instructor', 'student', 'guardian'] as const), password: v.str({ min: 8, max: 200, trim: false }), birth_year: v.int({ optional: true, min: 1900, max: new Date().getFullYear() }) }), await c.body());
  return { id: await ADM.adminCreateUser({ ...b, email: b.email.toLowerCase() }, u.id) };
});
route('POST', '/api/admin/guardian-links', async (c) => {
  requirePerm(c.user, 'users.manage');
  const b = parse(v.obj({ guardianId: v.str({ max: 40 }), studentId: v.str({ max: 40 }) }), await c.body());
  await ADM.linkGuardian(b.guardianId, b.studentId);
});
route('POST', '/api/admin/enrolments', async (c) => {
  requirePerm(c.user, 'users.manage');
  const b = parse(v.obj({ userId: v.str({ max: 40 }), courseId: v.str({ max: 40 }) }), await c.body());
  await ADM.adminEnrol(b.userId, b.courseId);
});
route('DELETE', '/api/admin/users/:id', async (c) => await ADM.deleteLearnerData(c.params.id, requirePerm(c.user, 'users.manage').id));
route('GET', '/api/admin/users/:id/export', async (c) => (requirePerm(c.user, 'users.manage'), await ADM.exportLearnerData(c.params.id)));
route('GET', '/api/admin/audit', async (c) => (requirePerm(c.user, 'users.manage'), await ADM.auditLog()));
route('POST', '/api/admin/retention/purge', async (c) => (requirePerm(c.user, 'users.manage'), { purged: await ADM.purgeOldLogs() }));
