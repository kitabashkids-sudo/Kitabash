// One-time upgrade for libraries installed before these features existed. For every installed
// library course it adds the "Do it in <platform>" build-along, the platform Perform activity, the
// teacher's platform link and the printable-worksheet task; for every library AND flagship course it
// adds the "More places to practise" links (Learn screen, teacher Resources, course link resources).
// Safe to run repeatedly — anything already present is skipped, and learner progress is untouched.
import { all, get, id, j, run } from '../db/index.ts';
import { validateActivity } from '../activities/registry.ts';
import { expandLesson, specKey } from './expand.ts';
import { ACTIVE, withPlatform } from './install.ts';
import { PLATFORM_TAG, platformFor, practiceLinks, practiceResources } from './platforms.ts';
import { addPracticeResources } from './practice-resources.ts';
import { FLAGSHIPS } from './flagship/all.ts';

const DONE_KEY = 'platforms:library-version'; // not under library:%, which maps spec keys to course ids
export const UPGRADE_VERSION = 'practice-v2';

type DbLesson = { id: string; title: string; learn: string; teacher: string };

/** Add practice links to a lesson's Learn content and teacher Resources if missing. Returns the new JSON. */
function withPractice(learn: any, teacher: any, links: ReturnType<typeof practiceLinks>) {
  if (!links.length) return { learn, teacher };
  const items: any[] = teacher.resources?.items || [];
  const add = practiceResources(links).filter((r) => !items.some((x) => x.url === r.url));
  return {
    learn: learn.practice?.length ? learn : { ...learn, practice: links },
    teacher: add.length ? { ...teacher, resources: { ...(teacher.resources || {}), items: [...items, ...add] } } : teacher,
  };
}

export async function upgradeLibraryPlatforms(log: (s: string) => void = () => {}) {
  const done = (await get<{ value: string }>('SELECT value FROM settings WHERE key=?', DONE_KEY))?.value;
  if (done === UPGRADE_VERSION) return { courses: 0, lessons: 0, skipped: true };
  const specs = new Map(ACTIVE.map((s) => [specKey(s), s]));
  const flags = new Map(FLAGSHIPS.map((f) => [f.key, f]));
  const installed = await all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'library:%'");
  let courses = 0;
  let lessons = 0;
  for (const row of installed) {
    const key = row.key.slice('library:'.length);
    const spec = specs.get(key);
    const flag = flags.get(key);
    if (!spec && !flag) continue; // job record or retired spec
    const course = await get<{ id: string; required_tools: string }>('SELECT id, required_tools FROM courses WHERE id=?', row.value);
    if (!course) continue;
    const subject = (spec || flag)!.subject;
    const band = (spec || flag)!.band;
    const links = practiceLinks(subject, band);
    const dbLessons = await all<DbLesson>('SELECT l.id, l.title, l.learn, l.teacher FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? ORDER BY m.position, l.position', course.id);
    const specLessons = spec ? spec.modules.flatMap((m) => m.lessons) : [];
    const p = spec ? platformFor(spec.subject, spec.band) : null;
    let changed = (await addPracticeResources(course.id, subject, band, null)) > 0;
    for (const [i, dl] of dbLessons.entries()) {
      let learn = j<any>(dl.learn, { cards: [] });
      let teacher = j<any>(dl.teacher, {});
      const before = JSON.stringify([learn, teacher]);
      // Library courses: platform activity, build-along, platform link, worksheet task.
      const ls = spec ? specLessons.find((x) => x.t === dl.title) || specLessons[i] : null;
      if (spec && ls && p) {
        const acts = await all<{ id: string; phase: string; position: number; config: string }>('SELECT id, phase, position, config FROM activities WHERE lesson_id=? ORDER BY position', dl.id);
        const L = expandLesson(ls, spec);
        if (!acts.some((a) => j<any>(a.config, {})?.tag === PLATFORM_TAG)) {
          const pa = L.activities.find((a: any) => a.config?.tag === PLATFORM_TAG);
          if (pa) {
            validateActivity(pa.type, pa.config, pa.answer_key);
            // Place it straight after the last Perform activity (shift the Probe activities down one).
            const lastPerform = acts.filter((a) => a.phase === 'perform').reduce((m, a) => Math.max(m, Number(a.position)), -1);
            const pos = lastPerform + 1;
            await run('UPDATE activities SET position=position+1 WHERE lesson_id=? AND position>=?', dl.id, pos);
            await run(
              'INSERT INTO activities (id,lesson_id,phase,type,title,instructions,position,config,answer_key,hints,points,required) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
              id('a_'), dl.id, pa.phase, pa.type, pa.title, pa.instructions || '', pos, pa.config, pa.answer_key, pa.hints || [], pa.points ?? 10, true,
            );
          }
          const items: any[] = teacher.resources?.items || [];
          const res = L.teacher.resources!.items![0];
          teacher = { ...teacher, resources: { ...(teacher.resources || {}), items: items.some((x: any) => x.title === res.title) ? items : [res, ...items] } };
        }
        learn = { ...learn, build: learn.build || L.build, worksheet: learn.worksheet || L.worksheet };
      }
      ({ learn, teacher } = withPractice(learn, teacher, links));
      if (JSON.stringify([learn, teacher]) !== before) {
        await run('UPDATE lessons SET learn=?, teacher=? WHERE id=?', learn, teacher, dl.id);
        lessons++;
        changed = true;
      }
    }
    if (changed) {
      if (p) await run('UPDATE courses SET required_tools=? WHERE id=?', withPlatform(j<string[]>(course.required_tools, []), p), course.id);
      courses++;
      log(`  + ${subject} ${band} ${(spec || flag)!.level}`);
    }
  }
  await run(`INSERT INTO settings (key,value,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, DONE_KEY, UPGRADE_VERSION);
  return { courses, lessons, skipped: false };
}
