// Prints which subject × grade band × level courses exist in the library (for authors).
import { LIBRARY } from '../src/lib/library/catalog.ts';
import { LEVELS, SUBJECT_BANDS } from '../src/lib/library/bands.ts';
import { CATALOGUE } from '../src/lib/demo/content.ts';

let have = 0, need = 0;
for (const cat of CATALOGUE) {
  const missing: string[] = [];
  for (const s of cat.subjects)
    for (const b of SUBJECT_BANDS[s] || [])
      for (const lv of LEVELS) {
        need++;
        if (LIBRARY.some((c) => c.subject === s && c.band === b && c.level === lv)) have++;
        else missing.push(`${s} ${b} ${lv}`);
      }
  console.log(`${cat.name}: ${missing.length ? `${missing.length} missing` : 'complete'}`);
}
const lessons = LIBRARY.reduce((n, c) => n + c.modules.reduce((m, x) => m + x.lessons.length, 0), 0);
console.log(`\n${have}/${need} courses, ${lessons} lessons`);
