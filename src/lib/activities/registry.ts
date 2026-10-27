// ─────────────────────────────────────────────────────────────
// Activity registry — the universal activity engine.
//
// Each activity TYPE is code (a definition here + a React component in
// src/client/components/activities). Each activity INSTANCE is data
// (config + answer key + hints in the `activities` table), so admins
// create unlimited activities of the registered types without code.
//
// Adding a NEW type is a developer task — see docs/ACTIVITY_EXTENSIONS.md.
// This file is pure TypeScript (no Node APIs) so the client can import
// the metadata; grading always runs on the server.
// ─────────────────────────────────────────────────────────────

export type Phase = 'learn' | 'perform' | 'probe';

export interface GradeResult {
  score: number; // 0..points
  correct: boolean;
  feedback: string;
  needsReview: boolean; // teacher should look at it
  detail?: Record<string, unknown>; // per-item correctness for the UI (never the key itself)
}

export interface ActivityDefinition {
  type: string;
  label: string;
  description: string;
  availability: 'built-in' | 'configurable' | 'extension-required';
  inputs: string; // what the learner does
  feedback: string; // what feedback they get
  completion: string; // when it counts as complete
  accessibility: string; // keyboard / screen-reader / motion notes
  subjects: string[]; // typical fits (informational)
  /** Throws a readable Error if the config/key are unusable. */
  validate?: (config: any, key: any) => void;
  grade?: (config: any, key: any, response: any) => Omit<GradeResult, 'score'> & { ratio: number };
  example?: { config: any; answer_key: any; hints: string[] };
  /** For configurable presets: the built-in type they render with. */
  rendersAs?: string;
}

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}'\s.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const need = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(msg);
};
const ids = (list: any[]) => new Set((list || []).map((x) => x?.id));
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function distance2(a: number[], b: number[]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

const defs: ActivityDefinition[] = [
  {
    type: 'multiple_choice',
    label: 'Multiple choice',
    description: 'One or more correct options, with optional code/visual stem and misconception-specific feedback per option.',
    availability: 'built-in',
    inputs: 'Select one option (or several when multi=true).',
    feedback: 'Immediate right/wrong plus the explanation; wrong options can carry targeted misconception feedback.',
    completion: 'A submitted answer. Full score only when the selection exactly matches the key.',
    accessibility: 'Native radio/checkbox semantics, full keyboard support, visible focus, no colour-only feedback.',
    subjects: ['all'],
    validate(c, k) {
      need(c?.question, 'config.question is required');
      need(Array.isArray(c?.options) && c.options.length >= 2, 'config.options needs at least 2 options');
      need(Array.isArray(k?.correct) && k.correct.length >= 1, 'answer_key.correct must list at least one option id');
      const o = ids(c.options);
      for (const x of k.correct) need(o.has(x), `answer_key.correct references unknown option "${x}"`);
    },
    grade(c, k, r) {
      const sel: string[] = Array.isArray(r?.selected) ? r.selected.map(String) : [];
      const correctSet = new Set<string>(k.correct);
      const ok = sel.length === correctSet.size && sel.every((s) => correctSet.has(s));
      const wrongPick = sel.find((s) => !correctSet.has(s));
      const targeted = wrongPick && k.feedbackByOption?.[wrongPick];
      return {
        ratio: ok ? 1 : 0,
        correct: ok,
        needsReview: false,
        feedback: ok ? k.explanation || 'Correct!' : targeted || 'Not quite — look again and try a hint if you need one.',
      };
    },
    example: {
      config: { question: 'Which is a need?', options: [{ id: 'a', text: 'Water' }, { id: 'b', text: 'Video game' }] },
      answer_key: { correct: ['a'], explanation: 'We need water to live.', feedbackByOption: { b: 'Fun, but we can live without it.' } },
      hints: ['Which one would you need every single day to stay healthy?'],
    },
  },
  {
    type: 'fill_blank',
    label: 'Fill in the blanks',
    description: 'Text with [[n]] placeholders; each blank accepts a list of answers. Optional word bank.',
    availability: 'built-in',
    inputs: 'Type into each blank or pick from the word bank.',
    feedback: 'Per-blank right/wrong marks; partial credit.',
    completion: 'All blanks submitted. Correct when every blank matches an accepted answer (case/punctuation-insensitive).',
    accessibility: 'Each blank is a labelled text input ("Blank 1 of 3"); word bank is a list of buttons.',
    subjects: ['language', 'grammar', 'science', 'maths'],
    validate(c, k) {
      need(typeof c?.text === 'string', 'config.text is required');
      const blanks = [...c.text.matchAll(/\[\[(\w+)\]\]/g)].map((m) => m[1]);
      need(blanks.length > 0, 'config.text needs at least one [[1]] style blank');
      for (const b of blanks) need(Array.isArray(k?.blanks?.[b]) && k.blanks[b].length, `answer_key.blanks.${b} needs accepted answers`);
    },
    grade(c, k, r) {
      const blanks = [...String(c.text).matchAll(/\[\[(\w+)\]\]/g)].map((m) => m[1]);
      const perBlank: Record<string, boolean> = {};
      for (const b of blanks) perBlank[b] = (k.blanks[b] as string[]).some((a) => norm(a) === norm(r?.answers?.[b]));
      const right = Object.values(perBlank).filter(Boolean).length;
      const ratio = right / blanks.length;
      return {
        ratio,
        correct: ratio === 1,
        needsReview: false,
        detail: { perBlank },
        feedback: ratio === 1 ? k.explanation || 'All blanks correct!' : `${right} of ${blanks.length} blanks correct.`,
      };
    },
  },
  {
    type: 'ordering',
    label: 'Ordering / sequencing',
    description: 'Put steps, events, story parts or values in the right order.',
    availability: 'built-in',
    inputs: 'Drag items, or use the ↑/↓ buttons on each item.',
    feedback: 'Shows which positions are correct; partial credit by position.',
    completion: 'Order submitted. Correct when every position matches.',
    accessibility: 'Move-up/move-down buttons with labels; live region announces new position. Drag is optional.',
    subjects: ['storytelling', 'science process', 'coding', 'maths'],
    validate(c, k) {
      need(Array.isArray(c?.items) && c.items.length >= 2, 'config.items needs at least 2 items');
      need(Array.isArray(k?.order) && k.order.length === c.items.length, 'answer_key.order must list every item id');
      const o = ids(c.items);
      for (const x of k.order) need(o.has(x), `answer_key.order references unknown item "${x}"`);
    },
    grade(c, k, r) {
      const order: string[] = Array.isArray(r?.order) ? r.order.map(String) : [];
      const positions = k.order.map((idv: string, i: number) => order[i] === idv);
      const ratio = positions.filter(Boolean).length / k.order.length;
      return { ratio, correct: ratio === 1, needsReview: false, detail: { positions }, feedback: ratio === 1 ? k.explanation || 'Perfect order!' : `${positions.filter(Boolean).length} of ${k.order.length} in the right place.` };
    },
  },
  {
    type: 'matching',
    label: 'Matching',
    description: 'Match each left item to one right item (terms ↔ definitions, words ↔ pictures, inputs ↔ outputs).',
    availability: 'built-in',
    inputs: 'Choose a match for each left item from a dropdown, or tap-to-pair.',
    feedback: 'Per-pair right/wrong; partial credit.',
    completion: 'All pairs submitted.',
    accessibility: 'Each left item has a labelled select element; no drag required.',
    subjects: ['vocabulary', 'science', 'coding', 'finance'],
    validate(c, k) {
      need(Array.isArray(c?.left) && c.left.length >= 2, 'config.left needs at least 2 items');
      need(Array.isArray(c?.right) && c.right.length >= 2, 'config.right needs at least 2 items');
      const r = ids(c.right);
      for (const l of c.left) need(r.has(k?.pairs?.[l.id]), `answer_key.pairs.${l.id} must reference a right item`);
    },
    grade(c, k, r) {
      const perPair: Record<string, boolean> = {};
      for (const l of c.left) perPair[l.id] = r?.pairs?.[l.id] === k.pairs[l.id];
      const right = Object.values(perPair).filter(Boolean).length;
      const ratio = right / c.left.length;
      return { ratio, correct: ratio === 1, needsReview: false, detail: { perPair }, feedback: ratio === 1 ? k.explanation || 'All matched!' : `${right} of ${c.left.length} pairs correct.` };
    },
  },
  {
    type: 'categorize',
    label: 'Drag and drop sorting',
    description: 'Sort items into labelled buckets (needs vs wants, living vs non-living, noun vs verb…).',
    availability: 'built-in',
    inputs: 'Drag cards into buckets, or tap a card then tap a bucket button.',
    feedback: 'Per-card right/wrong with optional per-card explanations.',
    completion: 'Every card placed and submitted.',
    accessibility: 'Every card has bucket buttons as a keyboard/screen-reader alternative to drag.',
    subjects: ['finance', 'science', 'grammar', 'EVS'],
    validate(c, k) {
      need(Array.isArray(c?.buckets) && c.buckets.length >= 2, 'config.buckets needs at least 2 buckets');
      need(Array.isArray(c?.items) && c.items.length >= 2, 'config.items needs at least 2 items');
      const b = ids(c.buckets);
      for (const it of c.items) need(b.has(k?.placement?.[it.id]), `answer_key.placement.${it.id} must reference a bucket`);
    },
    grade(c, k, r) {
      const perItem: Record<string, boolean> = {};
      for (const it of c.items) perItem[it.id] = r?.placement?.[it.id] === k.placement[it.id];
      const right = Object.values(perItem).filter(Boolean).length;
      const ratio = right / c.items.length;
      const wrong = c.items.filter((it: any) => !perItem[it.id]);
      const why = wrong.map((it: any) => k.explanations?.[it.id]).filter(Boolean).slice(0, 2).join(' ');
      return { ratio, correct: ratio === 1, needsReview: false, detail: { perItem }, feedback: ratio === 1 ? k.explanation || 'Everything is in the right place!' : `${right} of ${c.items.length} sorted correctly. ${why}`.trim() };
    },
  },
  {
    type: 'budget_sim',
    label: 'Budget simulation (scenario decision)',
    description: 'Spend a fixed budget on items; live balance bar; graded on essentials covered, staying in budget and saving.',
    availability: 'built-in',
    inputs: 'Toggle items into a basket; optionally explain the choice.',
    feedback: 'Live remaining balance; on submit, which essentials were missed and whether the savings goal was met.',
    completion: 'Basket submitted.',
    accessibility: 'Items are toggle buttons with aria-pressed; balance announced in a live region; bar has text equivalent.',
    subjects: ['financial literacy', 'entrepreneurship', 'maths'],
    validate(c, k) {
      need(typeof c?.budget === 'number' && c.budget > 0, 'config.budget must be a positive number');
      need(Array.isArray(c?.items) && c.items.length >= 2, 'config.items needs at least 2 items');
      const o = ids(c.items);
      for (const x of k?.required || []) need(o.has(x), `answer_key.required references unknown item "${x}"`);
    },
    grade(c, k, r) {
      const chosen = new Set<string>((r?.chosen || []).map(String));
      const total = c.items.filter((i: any) => chosen.has(i.id)).reduce((s: number, i: any) => s + i.cost, 0);
      const left = c.budget - total;
      const missing = (k.required || []).filter((x: string) => !chosen.has(x));
      const inBudget = left >= 0;
      const saved = left >= (k.minSavings || 0);
      const parts = [missing.length === 0, inBudget, saved];
      const ratio = parts.filter(Boolean).length / parts.length;
      const names = (xs: string[]) => xs.map((x) => c.items.find((i: any) => i.id === x)?.name).join(', ');
      const fb = [
        missing.length ? `You missed an essential: ${names(missing)}.` : 'All the essentials are covered.',
        inBudget ? `You stayed within budget with ${c.currency || ''}${left} left.` : `You overspent by ${c.currency || ''}${-left}.`,
        k.minSavings ? (saved ? 'You met the savings goal!' : `Try to keep at least ${c.currency || ''}${k.minSavings} as savings.`) : '',
      ].filter(Boolean).join(' ');
      return { ratio, correct: ratio === 1, needsReview: false, detail: { total, left, missingCount: missing.length }, feedback: fb };
    },
  },
  {
    type: 'tracing',
    label: 'Drawing and tracing',
    description: 'Trace a letter, numeral or shape over a guide. Scored on coverage of the guide and staying near it.',
    availability: 'built-in',
    inputs: 'Draw with finger, stylus or mouse on a canvas over a dotted guide; clear and retry.',
    feedback: 'Coverage % and accuracy %, with a tip about which part was missed.',
    completion: 'A trace submitted. Correct when coverage and accuracy exceed the key thresholds.',
    accessibility: 'Animated stroke-order demo respects reduced motion; a "mark as practised offline" option is offered for learners who cannot use a pointer (teacher can verify).',
    subjects: ['handwriting', 'early maths', 'art'],
    validate(c, k) {
      need(Array.isArray(c?.guide) && c.guide.length >= 1, 'config.guide must be a list of strokes');
      for (const s of c.guide) need(Array.isArray(s) && s.length >= 2, 'each guide stroke needs at least 2 [x,y] points');
      need(typeof k?.minCoverage === 'number', 'answer_key.minCoverage (0–1) is required');
    },
    grade(c, k, r) {
      if (r?.offline === true) return { ratio: 0.5, correct: false, needsReview: true, feedback: 'Marked as practised on paper — your teacher will check it.' };
      const tol2 = (c.tolerance ?? 9) ** 2;
      const strokes: number[][][] = Array.isArray(r?.strokes) ? r.strokes : [];
      const pts = strokes.flat().filter((p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(n))).slice(0, 5000);
      // Densify guide so coverage is meaningful
      const guide: number[][] = [];
      for (const s of c.guide as number[][][]) {
        for (let i = 0; i < s.length - 1; i++) {
          const [a, b] = [s[i], s[i + 1]];
          const steps = Math.max(1, Math.ceil(Math.sqrt(distance2(a, b)) / 3));
          for (let t = 0; t < steps; t++) guide.push([a[0] + ((b[0] - a[0]) * t) / steps, a[1] + ((b[1] - a[1]) * t) / steps]);
        }
        guide.push(s[s.length - 1]);
      }
      if (pts.length < 3) return { ratio: 0, correct: false, needsReview: false, feedback: 'Draw over the dotted guide, then check.' };
      const covered = guide.filter((g) => pts.some((p) => distance2(g, p) <= tol2)).length / guide.length;
      const precise = pts.filter((p) => guide.some((g) => distance2(g, p) <= tol2 * 2.25)).length / pts.length;
      const ok = covered >= k.minCoverage && precise >= (k.minPrecision ?? 0.5);
      const ratio = Math.min(1, (covered + precise) / 2 / Math.max(k.minCoverage, 0.01));
      return {
        ratio: ok ? 1 : Math.min(0.9, ratio),
        correct: ok,
        needsReview: false,
        detail: { coverage: Math.round(covered * 100), accuracy: Math.round(precise * 100) },
        feedback: ok
          ? `Lovely formation! Coverage ${Math.round(covered * 100)}%, accuracy ${Math.round(precise * 100)}%.`
          : covered < k.minCoverage
            ? `You covered ${Math.round(covered * 100)}% of the letter. Try to trace the whole shape, following the arrows.`
            : `Good coverage — now try to stay closer to the dotted line (accuracy ${Math.round(precise * 100)}%).`,
      };
    },
  },
  {
    type: 'speaking',
    label: 'Listening and speaking practice',
    description: 'Hear a model phrase (browser text-to-speech), record yourself (browser microphone, kept on the device), play back and self-check.',
    availability: 'built-in',
    inputs: 'Listen, record, play back, tick a self-check list.',
    feedback: 'Self-assessment against the checklist. No automated pronunciation scoring in this build — that requires a configured speech-assessment integration.',
    completion: 'Self-check submitted (recording optional; requires guardian consent for under-18 learners).',
    accessibility: 'Text of the phrase is always visible; recording is optional; works without audio by reading aloud to a teacher.',
    subjects: ['spoken English', 'public speaking', 'languages'],
    validate(c) {
      need(c?.phrase, 'config.phrase is required');
      need(Array.isArray(c?.checklist) && c.checklist.length >= 1, 'config.checklist needs at least 1 item');
    },
    grade(c, _k, r) {
      const ticks = (c.checklist as string[]).filter((_, i) => r?.selfCheck?.[i] === true).length;
      const ratio = ticks / c.checklist.length;
      return { ratio, correct: ratio >= 0.75, needsReview: false, feedback: ratio >= 0.75 ? 'Great self-check! Keep practising aloud.' : 'Pick one checklist item to focus on and record again.' };
    },
  },
  {
    type: 'free_response',
    label: 'Writing, reflection and explanation',
    description: 'Open response with optional sentence starters. Auto-checks length and key ideas; teacher reviews against a rubric.',
    availability: 'built-in',
    inputs: 'Write in a text area; use sentence starters; word count shown.',
    feedback: 'Immediate: length check and which key ideas were mentioned (without revealing the list). Final: teacher review.',
    completion: 'Submitted with at least the minimum word count. Always flagged for teacher review.',
    accessibility: 'Labelled textarea, live word count, starters are buttons that insert text.',
    subjects: ['all — probe questions, creative writing, reflections'],
    validate(c) {
      need(c?.prompt, 'config.prompt is required');
    },
    grade(c, k, r) {
      const text = String(r?.text || '');
      const minW = c.minWords ?? 5;
      const enough = words(text) >= minW;
      const kws: string[] = k?.keywords || [];
      const hits = kws.filter((w) => norm(text).includes(norm(w))).length;
      const kwRatio = kws.length ? hits / kws.length : enough ? 1 : 0;
      const ratio = enough ? 0.5 + 0.5 * Math.min(1, kwRatio * 1.5) : 0;
      return {
        ratio,
        correct: enough && kwRatio >= 0.34,
        needsReview: true,
        detail: { words: words(text), ideasMentioned: hits },
        feedback: !enough
          ? `Write a little more — aim for at least ${minW} words.`
          : kwRatio >= 0.34
            ? 'Thoughtful answer! Your teacher will add comments.'
            : 'Thanks! Try to explain your reasoning with a reason or example. Your teacher will review this.',
      };
    },
  },

  // ── Configurable presets: no new code, they render with a built-in type ──
  {
    type: 'code_output',
    label: 'Code: predict the output',
    description: 'Multiple choice with a code stem (config.code). Covers "a code instruction producing an output".',
    availability: 'configurable',
    rendersAs: 'multiple_choice',
    inputs: 'Read code, choose the output.',
    feedback: 'As multiple choice.',
    completion: 'As multiple choice.',
    accessibility: 'Code shown in a monospaced, selectable block; screen readers read it as text.',
    subjects: ['Scratch', 'Python', 'web'],
  },
  {
    type: 'timed_challenge',
    label: 'Timed optional challenge',
    description: 'Any built-in activity with config.timerSeconds. The timer is visible but never reduces the score; learners can hide it.',
    availability: 'configurable',
    inputs: 'As the underlying activity.',
    feedback: 'As the underlying activity, plus time taken.',
    completion: 'As the underlying activity.',
    accessibility: 'Timer can be hidden; never auto-submits.',
    subjects: ['Olympiad', 'maths facts'],
  },

  // ── Need developer-built components (honest status) ──
  ...[
    ['coding_sandbox', 'Coding and debugging workspace', 'Run and modify real code. Needs a sandboxed runner (e.g. Pyodide/Skulpt in the browser, or an official Scratch/MakeCode embed where its terms allow).'],
    ['visual_simulation', 'Visual simulations', 'Physics/chemistry/maths simulations. Needs per-simulation components or an embeddable simulation provider whose licence allows embedding.'],
    ['interactive_diagram', 'Interactive diagrams', 'Label/hotspot diagrams over images. Needs a hotspot editor component.'],
    ['audio_listening', 'Audio listening comprehension', 'Play uploaded audio then answer. Partly possible now: attach audio as a lesson asset and follow with multiple choice.'],
    ['project_submission', 'Projects and portfolio submissions', 'File upload + rubric review by a teacher. Needs student file storage with retention controls.'],
  ].map(
    ([type, label, description]) =>
      ({
        type,
        label,
        description,
        availability: 'extension-required',
        inputs: '—',
        feedback: '—',
        completion: '—',
        accessibility: 'Must meet the same checklist as built-in types (docs/ACTIVITY_EXTENSIONS.md).',
        subjects: [],
      }) as ActivityDefinition,
  ),
];

export const ACTIVITY_TYPES: Record<string, ActivityDefinition> = Object.fromEntries(defs.map((d) => [d.type, d]));

/** The type whose grader/component actually runs for an activity. */
export function effectiveType(type: string): string {
  return ACTIVITY_TYPES[type]?.rendersAs || type;
}

export function isRunnable(type: string): boolean {
  const d = ACTIVITY_TYPES[effectiveType(type)];
  return !!d && d.availability === 'built-in' && !!d.grade;
}

export function validateActivity(type: string, config: any, key: any): void {
  const t = effectiveType(type);
  const d = ACTIVITY_TYPES[t];
  if (!d) throw new Error(`Unknown activity type "${type}"`);
  if (!isRunnable(t)) throw new Error(`Activity type "${type}" needs a developer-built component and cannot be used yet.`);
  d.validate?.(config, key);
}

export function gradeActivity(type: string, points: number, config: any, key: any, response: any): GradeResult {
  const d = ACTIVITY_TYPES[effectiveType(type)];
  if (!d?.grade) throw new Error(`Activity type "${type}" cannot be graded`);
  const g = d.grade(config, key, response);
  const ratio = Math.max(0, Math.min(1, g.ratio));
  return { score: Math.round(points * ratio), correct: g.correct, feedback: g.feedback, needsReview: g.needsReview, detail: g.detail };
}
