// One-time upgrade for libraries installed before platform activities existed:
// adds the "Do it in <platform>" build-along, the platform Perform activity and the teacher's
// platform link to every lesson of every installed library course. Safe to run repeatedly —
// lessons that already have a platform activity are skipped, and learner progress is untouched.
import { all, get, id, j, run } from '../db/index.ts';
import { validateActivity } from '../activities/registry.ts';
import { expandLesson, specKey } from './expand.ts';
import { ACTIVE, withPlatform } from './install.ts';
import { PLATFORM_TAG, platformFor } from './platforms.ts';

const DONE_KEY = 'platforms:library-version'; // not under library:%, which maps spec keys to course ids

export async function upgradeLibraryPlatforms(log: (s: string) => void = () => {}) {
  const done = (await get<{ value: string }>('SELECT value FROM settings WHERE key=?', DONE_KEY))?.value;
  if (done === PLATFORM_TAG) return { courses: 0, lessons: 0, skipped: true };
  const specs = new Map(ACTIVE.map((s) => [specKey(s), s]));
  const installed = await all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'library:%'");
  let courses = 0;
  let lessons = 0;
  for (const row of installed) {
    const spec = specs.get(row.key.slice('library:'.length));
    if (!spec) continue; // flagship, job record or retired spec
    const course = await get<{ id: string; required_tools: string }>('SELECT id, required_tools FROM courses WHERE id=?', row.value);
    if (!course) continue;
    const p = platformFor(spec.subject, spec.band);
    if (!p) continue;
    const dbLessons = await all<{ id: string; title: string; learn: string; teacher: string }>(
      'SELECT l.id, l.title, l.learn, l.teacher FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? ORDER BY m.position, l.position',
      course.id,
    );
    const specLessons = spec.modules.flatMap((m) => m.lessons);
    let changed = false;
    for (const [i, dl] of dbLessons.entries()) {
      const ls = specLessons.find((x) => x.t === dl.title) || specLessons[i];
      if (!ls) continue;
      const acts = await all<{ id: string; phase: string; position: number; config: string }>('SELECT id, phase, position, config FROM activities WHERE lesson_id=? ORDER BY position', dl.id);
      if (acts.some((a) => j<any>(a.config, {})?.tag === PLATFORM_TAG)) continue;
      const L = expandLesson(ls, spec);
      const pa = L.activities.find((a: any) => a.config?.tag === PLATFORM_TAG);
      if (!pa) continue;
      validateActivity(pa.type, pa.config, pa.answer_key);
      // Place it straight after the last Perform activity (shift the Probe activities down one).
      const lastPerform = acts.filter((a) => a.phase === 'perform').reduce((m, a) => Math.max(m, Number(a.position)), -1);
      const pos = lastPerform + 1;
      await run('UPDATE activities SET position=position+1 WHERE lesson_id=? AND position>=?', dl.id, pos);
      await run(
        'INSERT INTO activities (id,lesson_id,phase,type,title,instructions,position,config,answer_key,hints,points,required) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        id('a_'), dl.id, pa.phase, pa.type, pa.title, pa.instructions || '', pos, pa.config, pa.answer_key, pa.hints || [], pa.points ?? 10, true,
      );
      const learn = j<any>(dl.learn, { cards: [] });
      const teacher = j<any>(dl.teacher, {});
      const items = teacher.resources?.items || [];
      const res = L.teacher.resources!.items![0];
      await run(
        'UPDATE lessons SET learn=?, teacher=? WHERE id=?',
        { ...learn, build: learn.build || L.build, worksheet: learn.worksheet || L.worksheet },
        { ...teacher, resources: { ...(teacher.resources || {}), items: items.some((x: any) => x.title === res.title) ? items : [res, ...items] } },
        dl.id,
      );
      lessons++;
      changed = true;
    }
    if (changed) {
      const tools = j<string[]>(course.required_tools, []);
      await run('UPDATE courses SET required_tools=? WHERE id=?', withPlatform(tools, p), course.id);
      courses++;
      log(`  + ${p.name}: ${spec.subject} ${spec.band} ${spec.level}`);
    }
  }
  await run(`INSERT INTO settings (key,value,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, DONE_KEY, PLATFORM_TAG);
  return { courses, lessons, skipped: false };
}
