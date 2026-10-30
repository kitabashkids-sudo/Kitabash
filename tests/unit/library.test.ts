// Course library: every spec is well-formed, every activity passes the activity registry,
// the catalogue is complete (Starter/Intermediate/Advanced for every subject), and the
// whole library installs and publishes through the real services.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb } from './helpers.ts';
import { LIBRARY } from '../../src/lib/library/catalog.ts';
import { courseTitle, expandLesson, lintCourse, specKey } from '../../src/lib/library/expand.ts';
import { LEVELS, SUBJECT_BANDS } from '../../src/lib/library/bands.ts';
import { validateActivity } from '../../src/lib/activities/registry.ts';
import { CATALOGUE } from '../../src/lib/demo/content.ts';

const SUBJECTS = CATALOGUE.flatMap((c) => c.subjects);

test('library specs are well-formed', () => {
  const issues = LIBRARY.flatMap(lintCourse);
  assert.deepEqual(issues, []);
  const keys = LIBRARY.map(specKey);
  assert.equal(new Set(keys).size, keys.length, 'duplicate subject/level');
  const titles = LIBRARY.map(courseTitle);
  assert.equal(new Set(titles).size, titles.length, 'duplicate course title');
  for (const c of LIBRARY) {
    assert.ok(SUBJECTS.includes(c.subject), `unknown subject ${c.subject}`);
    assert.ok(SUBJECT_BANDS[c.subject]?.includes(c.band), `${c.subject} is not offered in band ${c.band}`);
  }
  assert.deepEqual(SUBJECTS.filter((s) => !SUBJECT_BANDS[s]), [], 'every subject has bands');
});

test('every library activity passes the activity registry', () => {
  for (const c of LIBRARY)
    for (const m of c.modules)
      for (const l of m.lessons) {
        const L = expandLesson(l, c);
        for (const a of L.activities) assert.doesNotThrow(() => validateActivity(a.type, a.config, a.answer_key), `${c.title} / ${l.t} / ${a.title}`);
        // An ordering activity must never start already solved.
        for (const a of L.activities.filter((x) => x.type === 'ordering')) assert.notDeepEqual((a.config as any).items.map((i: any) => i.id), (a.answer_key as any).order, `${l.t}: ordering starts solved`);
      }
});

test('catalogue is complete: every subject has Beginner, Intermediate and Advanced in each of its grade bands', { skip: process.env.LIBRARY_PARTIAL ? 'partial library' : false }, () => {
  const missing = SUBJECTS.flatMap((s) => SUBJECT_BANDS[s].flatMap((b) => LEVELS.filter((lv) => !LIBRARY.some((c) => c.subject === s && c.band === b && c.level === lv)).map((lv) => `${s} ${b} ${lv}`)));
  assert.deepEqual(missing, []);
});

let db: any;
before(async () => {
  await freshDb();
  const { seed } = await import('../../scripts/seed.ts');
  await seed({ quiet: true });
  db = await import('../../src/lib/db/index.ts');
});
after(async () => {
  await db?.closeDb();
});

test('the whole library installs, publishes and is idempotent', { timeout: 600_000 }, async () => {
  const I = await import('../../src/lib/library/install.ts');
  const admin = (await db.get("SELECT id FROM users WHERE role='admin'")).id;
  const first: any = await I.installLibrary(admin);
  const job = await first.done;
  assert.deepEqual(job.errors, []);
  const expected = I.ACTIVE.length + (await import('../../src/lib/library/flagship/all.ts')).FLAGSHIPS.length;
  assert.equal(job.done, expected);
  const st = await I.libraryStatus();
  assert.equal(st.installed, expected);
  assert.equal(st.total, expected);
  const published = await db.get("SELECT COUNT(*) n FROM courses WHERE status='published'");
  assert.ok(Number(published.n) >= expected);
  // Second run installs nothing new.
  const again: any = await I.installLibrary(admin);
  assert.equal((await again.done).total, 0);
  // A student can open a library lesson and the tutor answers from the course guide.
  const course = await db.get('SELECT id, grade_band, pathway FROM courses WHERE title=?', courseTitle(LIBRARY[0]));
  assert.equal(course.grade_band, LIBRARY[0].band);
  const lesson = await db.get("SELECT id FROM lessons WHERE course_id=? AND status='approved' ORDER BY position LIMIT 1", course.id);
  const L = await import('../../src/lib/services/learning.ts');
  const auth = await import('../../src/lib/auth.ts');
  const student = await auth.login('aarav@kitabash.local', 'Learn#2026');
  const ADM = await import('../../src/lib/services/admin.ts');
  await ADM.adminEnrol(student.id, course.id);
  const view = await L.lessonForLearner(student, lesson.id);
  assert.ok(view.lesson.learn.cards.length >= 2);
  assert.ok(view.activities.some((a: any) => a.phase === 'perform') && view.activities.some((a: any) => a.phase === 'probe'));
  assert.ok(!('answer_key' in view.activities[0]), 'answer keys must not reach students');
});

test('every tracing glyph can be passed by an accurate trace and failed by a scribble', async () => {
  const { GLYPHS } = await import('../../src/lib/library/glyphs.ts');
  const { gradeActivity } = await import('../../src/lib/activities/registry.ts');
  for (const [k, guide] of Object.entries(GLYPHS)) {
    const cfg = { glyph: k, guide, tolerance: 10 };
    const key = { minCoverage: 0.7, minPrecision: 0.55 };
    // Simulate a real pointer stroke: dense points that wobble ±2 around the guide.
    const wobble = guide.map((s) => s.flatMap(([x, y], i) => {
      if (i === s.length - 1) return [[x, y + 1]];
      const [nx, ny] = s[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(nx - x, ny - y) / 2));
      return Array.from({ length: n }, (_, t) => [x + ((nx - x) * t) / n + (t % 2 ? 2 : -2), y + ((ny - y) * t) / n + 1]);
    }));
    assert.equal(gradeActivity('tracing', 10, cfg, key, { strokes: wobble }).correct, true, `accurate trace of ${k} should pass`);
    assert.equal(gradeActivity('tracing', 10, cfg, key, { strokes: [[[5, 5], [10, 95], [95, 5]]] }).correct, false, `scribble on ${k} should fail`);
  }
});

test('submitting the intended answer scores full marks on every auto-graded library activity', async () => {
  const { gradeActivity } = await import('../../src/lib/activities/registry.ts');
  const failures: string[] = [];
  for (const c of LIBRARY)
    for (const m of c.modules)
      for (const l of m.lessons) {
        const lesson = expandLesson(l, c);
        for (const a of lesson.activities as any[]) {
          const k = a.answer_key;
          let r: any;
          if (a.type === 'multiple_choice' || a.type === 'code_output') r = { selected: k.correct };
          else if (a.type === 'fill_blank') r = { answers: Object.fromEntries(Object.entries(k.blanks).map(([b, xs]: any) => [b, xs[0]])) };
          else if (a.type === 'ordering') r = { order: k.order };
          else if (a.type === 'matching') r = { pairs: k.pairs };
          else if (a.type === 'categorize') r = { placement: k.placement };
          else continue;
          const g = gradeActivity(a.type, a.points, a.config, k, r);
          if (!g.correct) failures.push(`${c.subject} ${c.band} ${c.level} / ${l.t} / ${a.title}`);
        }
      }
  assert.deepEqual(failures, []);
});
