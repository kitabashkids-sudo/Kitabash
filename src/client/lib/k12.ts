// K-12 grade bands and levels for display.
export const BANDS = [
  { id: 'K-2', label: 'K–2', long: 'Early Years · KG–Grade 2', ages: [5, 7] },
  { id: '3-5', label: 'Grades 3–5', long: 'Primary · Grades 3–5', ages: [8, 10] },
  { id: '6-8', label: 'Grades 6–8', long: 'Middle School · Grades 6–8', ages: [11, 13] },
  { id: '9-12', label: 'Grades 9–12', long: 'High School · Grades 9–12', ages: [14, 17] },
  { id: 'Adult', label: 'Adults', long: 'Working professionals · 18+', ages: [18, 65] },
] as const;
export const bandLabel = (id?: string) => BANDS.find((b) => b.id === id)?.label || '';
export function bandForBirthYear(y?: number | null) {
  if (!y) return null;
  const age = new Date().getFullYear() - y;
  return age <= 7 ? 'K-2' : age <= 10 ? '3-5' : age <= 13 ? '6-8' : age <= 17 ? '9-12' : 'Adult';
}
export const LEVEL_TONE: Record<string, 'good' | 'teach' | 'accent'> = { beginner: 'good', intermediate: 'teach', advanced: 'accent' };
export const levelLabel = (l?: string) => (l ? l[0].toUpperCase() + l.slice(1) : '');
/** Library titles look like "Subject (Gr 3–5) Beginner: Name" — show just the name when badges already say the rest. */
/** Only strips that exact library prefix, so a teacher's own "Science: Plants" keeps its full title. */
const LIBRARY_PREFIX = /^[^:()]+ \([^)]+\) (Beginner|Intermediate|Advanced): /;
export const shortTitle = (c: { title: string; level?: string }) => c.title.replace(LIBRARY_PREFIX, '');
