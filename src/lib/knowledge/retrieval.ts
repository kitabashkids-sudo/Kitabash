// Retrieval for agent grounding: BM25 over the course's knowledge chunks.
// This is retrieval-augmented generation (RAG): nothing is "trained" —
// relevant passages are fetched per question and placed in the prompt.
// It is kept separate from prompts and UI so it can be replaced by
// vector search (e.g. pgvector on Supabase) without touching callers.
import { all } from '../db/index.ts';

export interface Passage {
  chunkId: string;
  resourceId: string;
  resourceTitle: string;
  ref: string;
  text: string;
  score: number;
}

const STOP = new Set(
  'a an and are as at be but by can do does for from has have how i if in into is it its me my of on or our so than that the their them then there these they this to us was we what when where which who why will with you your about would should could just very also not no yes'.split(' '),
);

export function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);
}

function stem(w: string) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('es') && !w.endsWith('ses')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function bm25(query: string, docs: { id: string; text: string }[], k1 = 1.4, b = 0.75): Map<string, number> {
  const q = [...new Set(tokenize(query))];
  const toks = docs.map((d) => tokenize(d.text));
  const N = docs.length || 1;
  const avg = toks.reduce((s, t) => s + t.length, 0) / N || 1;
  const df = new Map<string, number>();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) || 0) + 1);
  const scores = new Map<string, number>();
  docs.forEach((d, i) => {
    const tf = new Map<string, number>();
    for (const w of toks[i]) tf.set(w, (tf.get(w) || 0) + 1);
    let s = 0;
    for (const w of q) {
      const f = tf.get(w);
      if (!f) continue;
      const n = df.get(w) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avg)));
    }
    if (s > 0) scores.set(d.id, s);
  });
  return scores;
}

export async function retrieve(courseId: string, query: string, k = 4, audience?: 'student'): Promise<Passage[]> {
  const rows = await all<{ id: string; resource_id: string; ref: string; text: string; title: string }>(
    `SELECT c.id, c.resource_id, c.ref, c.text, r.title FROM resource_chunks c
     JOIN resources r ON r.id = c.resource_id
     WHERE c.course_id = ? AND r.replaced_by IS NULL ${audience === 'student' ? "AND r.audience = 'student'" : ''}`,
    courseId,
  );
  if (!rows.length || !query.trim()) return [];
  const scores = bm25(query, rows);
  return rows
    .filter((r) => scores.has(r.id))
    .map((r) => ({ chunkId: r.id, resourceId: r.resource_id, resourceTitle: r.title, ref: r.ref, text: r.text, score: scores.get(r.id)! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** Best-matching sentences from passages (used by the offline tutor and generator). */
export function bestSentences(query: string, passages: Passage[], n = 2): { sentence: string; passage: Passage }[] {
  const q = new Set(tokenize(query));
  const cands: { sentence: string; passage: Passage; s: number }[] = [];
  for (const p of passages) {
    // Split by line first so headings (lines without end punctuation) never glue onto sentences.
    const lines = p.text.split(/\n+/).filter((l) => /[.!?]["”’)]?\s*$/.test(l.trim()) || l.trim().split(/\s+/).length > 12);
    for (const raw of lines.flatMap((l) => l.match(/(?:[^.!?]|[.!?](?=[”"’]?\s*[a-z,]))+[.!?]+[”"’)]?/g) || [l])) {
      const sentence = raw.trim();
      if (sentence.length < 25 || sentence.length > 320) continue;
      const t = tokenize(sentence);
      const overlap = t.filter((w) => q.has(w)).length;
      if (overlap) cands.push({ sentence, passage: p, s: overlap / Math.sqrt(t.length) + p.score * 0.05 });
    }
  }
  const seen = new Set<string>();
  return cands
    .sort((a, b) => b.s - a.s)
    .filter((c) => !seen.has(c.sentence) && (seen.add(c.sentence), true))
    .slice(0, n);
}
