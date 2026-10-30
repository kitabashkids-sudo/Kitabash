// Real-world platforms for every course: coverage, generated activities, grading, the upgrade of
// already-installed libraries, the catalogue search and the printable-worksheet data.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb } from './helpers.ts';
import { LIBRARY } from '../../src/lib/library/catalog.ts';
import { expandLesson, specKey } from '../../src/lib/library/expand.ts';
import { MAPPED_SUBJECTS, PLATFORM_TAG, platformFor } from '../../src/lib/library/platforms.ts';
import { gradeActivity, validateActivity } from '../../src/lib/activities/registry.ts';
import { runWebChecks } from '../../src/lib/web/checks.ts';

const platformAct = (L: any) => L.activities.find((a: any) => a.config?.tag === PLATFORM_TAG);

test('every library course has a platform, a build-along and a valid platform activity in every lesson', () => {
  const missing = LIBRARY.filter((c) => !platformFor(c.subject, c.band)).map((c) => `${c.subject} ${c.band}`);
  assert.deepEqual(missing, []);
  for (const c of LIBRARY)
    for (const m of c.modules)
      for (const l of m.lessons) {
        const L: any = expandLesson(l, c);
        const pa = platformAct(L);
        assert.ok(pa, `${c.subject} / ${l.t}: no platform activity`);
        assert.equal(pa.phase, 'perform');
        assert.doesNotThrow(() => validateActivity(pa.type, pa.config, pa.answer_key), `${c.subject} / ${l.t}`);
        assert.ok(L.build?.steps.length >= 3, `${c.subject} / ${l.t}: build-along`);
        assert.ok(L.worksheet?.task, `${c.subject} / ${l.t}: worksheet`);
        // Platform activity sits after the Perform activities and before Probe.
        const phases = L.activities.map((a: any) => a.phase);
        assert.ok(phases.indexOf('probe') === -1 || phases.indexOf('probe') > phases.indexOf('perform'));
        if (L.build.tool) assert.match(L.build.tool.url, /^https:\/\//);
      }
  // Python → Python Lab, web → Web Lab, everything else → hand-in on the real platform.
  const py = LIBRARY.find((c) => c.subject === 'Python')!;
  assert.equal(platformAct(expandLesson(py.modules[0].lessons[0], py)).type, 'python_lab');
  const web = LIBRARY.find((c) => c.subject === 'Web Development')!;
  assert.equal(platformAct(expandLesson(web.modules[0].lessons[0], web)).type, 'web_lab');
  const maths = LIBRARY.find((c) => c.subject === 'Mathematics' && c.band === '9-12')!;
  assert.equal(platformAct(expandLesson(maths.modules[0].lessons[0], maths)).config.platform.name, 'Desmos Graphing Calculator');
  assert.ok(MAPPED_SUBJECTS.length >= 40);
});

test('platform hand-in: link, offline-only and reflection rules', () => {
  const maths = LIBRARY.find((c) => c.subject === 'Mathematics' && c.band === '9-12')!;
  const pa = platformAct(expandLesson(maths.modules[0].lessons[0], maths));
  const all = Object.fromEntries(pa.config.requirements.map((_: string, i: number) => [i, true]));
  const refl = 'I typed the equation into Desmos, added a slider for the coefficient and watched the roots move along the x axis each time.';
  assert.equal(gradeActivity('project', 15, pa.config, {}, { done: all, url: 'https://www.desmos.com/calculator/abc123', reflection: refl }).correct, true);
  assert.equal(gradeActivity('project', 15, pa.config, {}, { done: all, offline: true, reflection: refl }).correct, true);
  const bad = gradeActivity('project', 15, pa.config, {}, { done: all, url: 'javascript:alert(1)', reflection: refl });
  assert.equal(bad.correct, false);
  assert.match(bad.feedback, /desmos\.com/);
  // Handwriting has no link — only "I showed my teacher".
  const hw = LIBRARY.find((c) => c.subject === 'Handwriting & Penmanship')!;
  const hp = platformAct(expandLesson(hw.modules[0].lessons[0], hw));
  assert.equal(hp.config.offlineOnly, true);
  const hall = Object.fromEntries(hp.config.requirements.map((_: string, i: number) => [i, true]));
  assert.equal(gradeActivity('project', 15, hp.config, {}, { done: hall, url: 'https://example.com/x', reflection: 'I wrote my letters slowly and neatly today' }).correct, false);
  assert.equal(gradeActivity('project', 15, hp.config, {}, { done: hall, offline: true, reflection: 'I wrote my letters slowly and neatly today' }).correct, true);
  // Scratch flagship projects keep their Scratch-only link rule.
  const scratchCfg = { brief: 'Make a game', requirements: ['a', 'b'], reflection: 'Why?' };
  const r = 'This is my reflection about my game and how I made the sprite move with the arrow keys.';
  assert.equal(gradeActivity('project', 10, scratchCfg, {}, { done: { 0: true, 1: true }, url: 'https://scratch.mit.edu/projects/123456', reflection: r }).correct, true);
  assert.equal(gradeActivity('project', 10, scratchCfg, {}, { done: { 0: true, 1: true }, url: 'https://example.com/123', reflection: r }).correct, false);
});

test('Web Lab checks and grading', () => {
  const web = LIBRARY.find((c) => c.subject === 'Web Development')!;
  const pa = platformAct(expandLesson(web.modules[0].lessons[0], web));
  const empty = gradeActivity('web_lab', 15, pa.config, pa.answer_key, { html: '<p>hi</p>', reflection: '' });
  assert.equal(empty.correct, false);
  assert.match(empty.feedback, /heading/i);
  const good = gradeActivity('web_lab', 15, pa.config, pa.answer_key, { html: pa.answer_key.solution, reflection: 'I built a page with a heading, a paragraph, a list, a link and some CSS colours, and fixed a missing closing tag on the way.' });
  assert.equal(good.correct, true);
  assert.equal(good.needsReview, true);
  assert.equal(gradeActivity('web_lab', 15, pa.config, pa.answer_key, { html: 42 }).score, 0);
  const r = runWebChecks('<!-- <h1>x</h1> --><style>p{color:red}</style><p>Hello</p>', [{ t: 'tag', tags: ['h1'], msg: 'h' }, { t: 'css', props: ['color'], msg: 'c' }, { t: 'text', min: 5, msg: 't' }]);
  assert.deepEqual(r.results.map((x) => x.ok), [false, true, true]);
});

test('Python Lab platform activity accepts a working program', () => {
  const py = LIBRARY.find((c) => c.subject === 'Python')!;
  const pa = platformAct(expandLesson(py.modules[0].lessons[0], py));
  const ok = gradeActivity('python_lab', 15, pa.config, pa.answer_key, { code: '# greet\nprint("Hello, Kitabash!")', reflection: 'My program prints a greeting. The hardest part was remembering the quotes around the text in print and the brackets.' });
  assert.equal(ok.correct, true, ok.feedback);
  assert.equal(gradeActivity('python_lab', 15, pa.config, pa.answer_key, { code: 'print(', reflection: '' }).correct, false);
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

test('installed courses carry the platform; the upgrade back-fills older installs once', async () => {
  const I = await import('../../src/lib/library/install.ts');
  const U = await import('../../src/lib/library/platform-upgrade.ts');
  const admin = (await db.get("SELECT id FROM users WHERE role='admin'")).id;
  const subj = await I.subjectIds(admin);
  const spec = I.ACTIVE.find((c) => c.subject === 'Mathematics' && c.band === '6-8')!;
  const cid = await I.installCourse(spec, admin, subj);
  const tools = JSON.parse((await db.get('SELECT required_tools FROM courses WHERE id=?', cid)).required_tools);
  assert.ok(tools.some((t: string) => t.includes('GeoGebra')));
  const count = async () => Number((await db.get("SELECT COUNT(*) n FROM activities a JOIN lessons l ON l.id=a.lesson_id WHERE l.course_id=? AND a.type='project'", cid)).n);
  const lessons = Number((await db.get('SELECT COUNT(*) n FROM lessons WHERE course_id=?', cid)).n);
  assert.equal(await count(), lessons);
  // Simulate an install from before platforms existed.
  await db.run("DELETE FROM activities WHERE type='project' AND lesson_id IN (SELECT id FROM lessons WHERE course_id=?)", cid);
  for (const l of await db.all('SELECT id, learn FROM lessons WHERE course_id=?', cid)) {
    const learn = JSON.parse(l.learn);
    delete learn.build;
    delete learn.worksheet;
    await db.run('UPDATE lessons SET learn=? WHERE id=?', learn, l.id);
  }
  await db.run("DELETE FROM settings WHERE key='platforms:library-version'");
  const r = await U.upgradeLibraryPlatforms();
  assert.equal(r.lessons, lessons);
  assert.equal(await count(), lessons);
  const lesson = await db.get("SELECT id, learn, status FROM lessons WHERE course_id=? ORDER BY position LIMIT 1", cid);
  assert.equal(JSON.parse(lesson.learn).build.tool.name, 'GeoGebra');
  assert.ok(JSON.parse(lesson.learn).worksheet.task);
  assert.equal(lesson.status, 'approved', 'upgrade must not send lessons back to review');
  // Positions: platform activity right after the last Perform activity.
  const acts = await db.all('SELECT phase, type FROM activities WHERE lesson_id=? ORDER BY position', lesson.id);
  const at = acts.findIndex((a: any) => a.type === 'project');
  assert.ok(acts.slice(0, at).every((a: any) => a.phase === 'perform') && acts.slice(at + 1).every((a: any) => a.phase === 'probe'));
  // Second run does nothing.
  assert.equal((await U.upgradeLibraryPlatforms()).skipped, true);
  assert.equal(await count(), lessons);
  // Students see the activity and the build-along, never the key.
  const auth = await import('../../src/lib/auth.ts');
  const L = await import('../../src/lib/services/learning.ts');
  const student = await auth.login('aarav@kitabash.local', 'Learn#2026');
  const view = await L.lessonForLearner(student, lesson.id);
  assert.ok(view.lesson.learn.build.steps.length >= 3);
  assert.ok(view.activities.some((a: any) => a.config.tag === PLATFORM_TAG));
  assert.equal(specKey(spec).length > 0, true);
});

test('catalogue search finds courses, lessons and files; teacher files stay hidden from students', async () => {
  const auth = await import('../../src/lib/auth.ts');
  const L = await import('../../src/lib/services/learning.ts');
  const student = await auth.login('aarav@kitabash.local', 'Learn#2026');
  const admin = await db.get("SELECT * FROM users WHERE role='admin'");
  const byPlatform = await L.catalogSearch(student, 'geogebra');
  assert.ok(byPlatform.courses.some((c: any) => c.subject === 'Mathematics'), 'platform names are searchable');
  const s = await L.catalogSearch(student, 'MATHEMATICS guide');
  assert.ok(s.files.length >= 1, 'course guide file is found');
  assert.ok(s.files.every((f: any) => f.audience === 'student'));
  assert.match(s.files[0].url, /^\/api\/resources\/.+\/file$/);
  const lessonHit = await L.catalogSearch(student, 'needs wants');
  assert.ok(lessonHit.lessons.length + lessonHit.courses.length > 0);
  assert.deepEqual((await L.catalogSearch(student, ' % _ ')).courses, []);
  const teacherFile = await db.get("SELECT r.title FROM resources r JOIN courses c ON c.id=r.course_id WHERE r.audience='teacher' AND c.status='published' LIMIT 1");
  if (teacherFile) {
    const word = String(teacherFile.title).split(/\s+/).find((w: string) => w.length > 3)!;
    assert.ok((await L.catalogSearch(student, word)).files.every((f: any) => f.audience === 'student'));
    assert.ok((await L.catalogSearch(admin, word)).files.some((f: any) => f.audience === 'teacher'));
  }
});
