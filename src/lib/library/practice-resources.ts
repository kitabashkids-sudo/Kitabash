// "More places to practise" links stored as student link resources on a course
// (so they show in the course's Knowledge list and in catalogue search).
import { all, id, run } from '../db/index.ts';
import { practiceLinks } from './platforms.ts';
import type { Band } from './types.ts';

/** Add the course's "More places to practise" links as student link resources (searchable, shown in Knowledge). */
export async function addPracticeResources(courseId: string, subject: string, band: Band, userId: string | null) {
  const have = new Set((await all<{ source: string }>("SELECT source FROM resources WHERE course_id=? AND kind='url'", courseId)).map((r) => r.source));
  let n = 0;
  for (const l of practiceLinks(subject, band)) {
    const url = new URL(l.url).toString();
    if (have.has(url)) continue;
    await run(
      "INSERT INTO resources (id,course_id,title,kind,source,audience,extraction_status,extraction_note,created_by) VALUES (?,?,?,'url',?,'student','url_unverified',?,?)",
      id('r_'), courseId, `Practise: ${l.name}`, url, l.what, userId,
    );
    n++;
  }
  return n;
}

