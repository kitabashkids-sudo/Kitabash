// Expands compact course specs (types.ts) into the full structures the app stores.
import type { LearnCard, TeacherContent, VisualHook } from '../lessonTypes.ts';
import type { ActSpec, CourseSpec, HookSpec, LessonSpec } from './types.ts';
import { band } from './bands.ts';
import { GLYPHS, glyphLabel } from './glyphs.ts';
import { platformActivity, platformBuild, platformFor, platformResource, practiceLinks, practiceResources } from './platforms.ts';

const OPT = 'abcdefgh';
const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';

export const pathwayKey = (c: Pick<CourseSpec, 'subject' | 'band'>) => `${slug(c.subject)}--${c.band}`;
export const specKey = (c: Pick<CourseSpec, 'subject' | 'band' | 'level'>) => `${pathwayKey(c)}--${c.level.toLowerCase()}`;
export const agesOf = (c: CourseSpec): [number, number] => c.ages || band(c.band).ages;
export const gradeOf = (c: CourseSpec) => c.grade || band(c.band).grades;
const SHORT: Record<string, string> = { 'K-2': 'K–2', '3-5': 'Gr 3–5', '6-8': 'Gr 6–8', '9-12': 'Gr 9–12', Adult: 'Professional' };
/** Full catalogue title, e.g. "Financial Literacy (Gr 3–5) Beginner: What Is Money?" */
export const courseTitle = (c: CourseSpec) => `${c.subject} (${SHORT[c.band]}) ${c.level}: ${c.title}`;

export function expandHook(h: HookSpec, objective: string): VisualHook {
  const base = { kind: 'preset' as const, objective, durationMs: 3000 };
  switch (h[0]) {
    case 'word':
      return { ...base, preset: 'word-reveal', params: { word: h[1], tagline: h[2] }, caption: `${h[1]} — ${h[2]}`, alt: `The words “${h[1]}” appear, followed by: ${h[2]}.` };
    case 'pattern':
      return { ...base, preset: 'pattern-reveal', params: { sequence: h[1], next: h[2] }, caption: `${h[1].join(', ')}, … what comes next? ${h[2]}`, alt: `The sequence ${h[1].join(', ')} appears one term at a time, then the next term ${h[2]} is revealed.` };
    case 'code':
      return { ...base, preset: 'code-output', params: { code: h[1], output: h[2] }, caption: `Run it: ${h[1].split('\n')[0]} → ${h[2]}`, alt: `A short program is shown: ${h[1].replace(/\n/g, ' ; ')}. When it runs, the output is: ${h[2]}.` };
    case 'phrase':
      return { ...base, preset: 'phrase-model', params: { phrase: h[1], stress: h[2] }, caption: `Say it: “${h[1]}”`, alt: `The phrase “${h[1]}” is shown with the words ${h[2].join(', ')} highlighted for stress.` };
    case 'upgrade':
      return { ...base, preset: 'speech-upgrade', params: { before: h[1], after: h[2] }, caption: `Before: “${h[1]}” → After: “${h[2]}”`, alt: `A plain sentence “${h[1]}” transforms into a more powerful one: “${h[2]}”.` };
    case 'budget':
      return { ...base, preset: 'budget-change', params: { budget: h[1], expense: h[2], label: h[3], currency: '₹' }, caption: `₹${h[1]} budget — add ${h[3]} ₹${h[2]} and watch what is left.`, alt: `A budget bar of ${h[1]} rupees shrinks to ${h[1] - h[2]} when ${h[3]} costing ${h[2]} is added.` };
    case 'letter':
      return { ...base, preset: 'letter-trace', params: { letter: h[1], strokes: GLYPHS[h[1]] || [] }, caption: h[2], alt: `An animated pen writes ${glyphLabel(h[1])}, stroke by stroke, starting at the green dot. ${h[2]}` };
  }
}

const DEFAULT_HINT = 'Look back at the Learn cards, then rule out the answers you know are wrong.';

export function expandActivity(a: ActSpec, i: number, lesson: LessonSpec) {
  const phase = a.phase || 'perform';
  if ('mcq' in a || 'code' in a) {
    const isCode = 'code' in a;
    const options = a.options.map((t, j) => ({ id: OPT[j], text: t }));
    const feedbackByOption = 'wrong' in a && a.wrong ? Object.fromEntries(Object.entries(a.wrong).map(([k, v]) => [OPT[Number(k)], v])) : undefined;
    return {
      phase,
      type: isCode ? 'code_output' : 'multiple_choice',
      title: a.title || (isCode ? 'Predict the output' : phase === 'probe' ? 'New situation' : i === 0 ? 'Quick check' : 'Apply it'),
      instructions: isCode ? 'Read the code carefully, then choose what it will do.' : 'Choose the best answer.',
      config: isCode ? { code: a.code, question: a.ask, options, language: (a as any).lang || 'text' } : { question: a.mcq, options },
      answer_key: { correct: [OPT[a.answer]], explanation: a.why, ...(feedbackByOption ? { feedbackByOption } : {}) },
      hints: [a.hint || DEFAULT_HINT],
      points: 10,
    };
  }
  if ('sort' in a) {
    const buckets = a.buckets.map((b, j) => ({ id: `b${j}`, label: b }));
    const items = a.items.map(([t], j) => ({ id: `i${j}`, text: t }));
    return {
      phase,
      type: 'categorize',
      title: a.sort,
      instructions: `Sort each card into the right group. On a phone, tap a card then tap a group.`,
      config: { buckets, items },
      answer_key: { placement: Object.fromEntries(a.items.map(([, b], j) => [`i${j}`, `b${b}`])), explanation: a.why },
      hints: [a.hint || `Check each card against the Learn cards: which group's description fits it best?`],
      points: Math.min(20, a.items.length * 2),
    };
  }
  if ('order' in a) {
    const items = a.steps.map((t, j) => ({ id: `s${j}`, text: t }));
    // Shuffle deterministically (reverse + rotate) so the starting order is never the answer.
    const shown = [...items].reverse();
    shown.push(shown.shift()!);
    return {
      phase,
      type: 'ordering',
      title: a.title || 'Put it in order',
      instructions: 'Put the items in the right order. Use the arrow buttons or drag.',
      config: { prompt: a.order, items: shown },
      answer_key: { order: items.map((x) => x.id), explanation: a.why },
      hints: [a.hint || 'Which one has to happen first? Start there and build the chain.'],
      points: 8,
    };
  }
  if ('match' in a) {
    const left = a.pairs.map(([l], j) => ({ id: `l${j}`, text: l }));
    const rightIdx = a.pairs.map((_, j) => j);
    const right = [...rightIdx.slice(1), rightIdx[0]].map((j) => ({ id: `r${j}`, text: a.pairs[j][1] }));
    return {
      phase,
      type: 'matching',
      title: a.match,
      instructions: 'Match each item on the left with the best item on the right.',
      config: { prompt: a.match, left, right },
      answer_key: { pairs: Object.fromEntries(a.pairs.map((_, j) => [`l${j}`, `r${j}`])), explanation: a.why },
      hints: [a.hint || 'Start with the pair you are most sure about, then the choices get easier.'],
      points: Math.min(16, a.pairs.length * 2),
    };
  }
  if ('blanks' in a) {
    const blanks = Object.fromEntries(a.answers.map((ans, j) => [String(j + 1), ans]));
    return {
      phase,
      type: 'fill_blank',
      title: a.title || 'Fill the gaps',
      instructions: a.bank ? 'Type into each gap, or tap a word from the word bank.' : 'Type the missing word into each gap.',
      config: { text: a.blanks, ...(a.bank ? { wordBank: a.bank } : {}) },
      answer_key: { blanks, explanation: a.why },
      hints: [a.hint || 'Read the whole sentence first — the words around each gap are clues.'],
      points: Math.min(15, a.answers.length * 3),
    };
  }
  if ('write' in a) {
    return {
      phase: a.phase || 'probe',
      type: 'free_response',
      title: a.title || 'Explain your thinking',
      instructions: 'Write your answer in your own words. There is no single right answer — your teacher will read it.',
      config: { prompt: a.write, minWords: a.minWords ?? 12, sentenceStarters: a.starters || ['I think…', 'because…', 'For example…'] },
      answer_key: { keywords: a.keywords, exemplar: a.exemplar },
      hints: ['Give a reason and an example — that makes your thinking easy to follow.'],
      points: 10,
    };
  }
  if ('speak' in a) {
    return {
      phase,
      type: 'speaking',
      title: a.title || 'Say it aloud',
      instructions: 'Listen to the model, then say it yourself. Recording is optional and stays on your device.',
      config: { phrase: a.speak, checklist: a.checklist, ...(a.tips ? { tips: [a.tips] } : {}) },
      answer_key: {},
      hints: ['Say it slowly first, then at normal speed.'],
      points: 10,
    };
  }
  if ('trace' in a) {
    return {
      phase,
      type: 'tracing',
      title: a.title || `Trace ${a.glyph.length === 1 ? a.glyph : glyphLabel(a.glyph)}`,
      instructions: a.trace,
      config: { glyph: a.glyph, guide: GLYPHS[a.glyph] || [], tolerance: 10 },
      answer_key: { minCoverage: 0.7, minPrecision: 0.55 },
      hints: [a.hint || 'Start at the green dot and follow the numbers for each stroke.'],
      points: 10,
    };
  }
  throw new Error(`Unknown activity in lesson “${lesson.t}”`);
}

export function expandTeacher(l: LessonSpec, hook: VisualHook): TeacherContent {
  const t = l.teach;
  const perform = l.acts.filter((a) => (a.phase || ('write' in a ? 'probe' : 'perform')) === 'perform').length;
  const probe = l.acts.length - perform;
  const min = l.min || 30;
  return {
    teach: { explanation: t.explain, analogies: [t.analogy], vocabulary: t.vocab.map(([term, definition]) => ({ term, definition })) },
    show: {
      items: [
        { title: '3-second hook', kind: 'hook', description: `${hook.caption}. Play it before the Learn cards, then ask: “What do you notice?”` },
        { title: 'Live demonstration', kind: 'demo', description: t.demo },
      ],
    },
    facilitate: {
      prompts: t.prompts.map(([prompt, expected]) => ({ prompt, expected })),
      discussion: t.discuss ? [t.discuss] : [],
      differentiation: { support: t.support, stretch: t.stretch },
      timing: `Hook 1 min · Learn ${Math.round(min * 0.25)} min · Perform ${Math.round(min * 0.4)} min (${perform} activit${perform === 1 ? 'y' : 'ies'}) · Probe ${Math.round(min * 0.25)} min (${probe}) · Wrap-up ${Math.max(2, min - 1 - Math.round(min * 0.25) - Math.round(min * 0.4) - Math.round(min * 0.25))} min`,
    },
    resources: {
      items: [
        { title: `${l.t} — worksheet (print)`, kind: 'worksheet', body: t.sheet },
        { title: 'Exit ticket', kind: 'template', body: t.exit || `One thing I learned about ${l.t.toLowerCase()}: ___ . One question I still have: ___ .` },
      ],
    },
    assess: {
      questions: t.prompts.slice(0, 2).map(([q]) => q),
      rubric: [
        { criterion: 'Understanding', levels: ['Not yet: needs the key idea retaught', 'Developing: recalls the idea with support', 'Secure: applies it correctly in the activities', 'Extending: explains it and applies it to a new situation'] },
        { criterion: 'Reasoning & communication', levels: ['No reason given', 'Repeats the definition', 'Explains with a relevant example', 'Explains clearly, with examples and links to other ideas'] },
      ],
      misconceptions: t.mis.map(([misconception, fix]) => ({ misconception, fix })),
    },
    extension: t.extension ? [t.extension] : [],
  };
}

/**
 * Expand one lesson. With the course spec, the lesson also gets its real-world platform
 * (see platforms.ts): a "Do it in <platform>" build-along on the Learn screen, a Perform
 * activity done in that platform, and a platform link in the teacher's Resources tab.
 */
export function expandLesson(l: LessonSpec, spec?: Pick<CourseSpec, 'subject' | 'band'>) {
  const hook = expandHook(l.hook, l.o);
  const p = spec ? platformFor(spec.subject, spec.band) : null;
  const teacher = expandTeacher(l, hook);
  const activities: any[] = l.acts.map((a, i) => expandActivity(a, i, l));
  if (p && spec) {
    // Insert after the last Perform activity, so learners practise first and then build.
    const at = activities.map((a) => a.phase).lastIndexOf('perform') + 1;
    activities.splice(at, 0, platformActivity(p, spec, l));
    teacher.resources!.items!.unshift(platformResource(p));
  }
  const practice = spec ? practiceLinks(spec.subject, spec.band) : [];
  if (practice.length) teacher.resources!.items!.push(...practiceResources(practice));
  return {
    title: l.t,
    objective: l.o,
    duration: l.min || 30,
    hook,
    cards: l.cards.map(([emoji, title, body]) => ({ emoji, title, body })) as LearnCard[],
    worksheet: { title: `${l.t} — worksheet`, task: l.teach.sheet },
    ...(practice.length ? { practice } : {}),
    ...(p && spec ? { build: platformBuild(p, spec, l), platform: p } : {}),
    activities,
    teacher,
  };
}

/** Markdown guide uploaded as the course's knowledge source, so the tutor answers from it. */
export function courseGuide(c: CourseSpec): string {
  const out = [`# ${courseTitle(c)} — Course guide (Kitabash original)`, '', c.description, ''];
  const p = platformFor(c.subject, c.band);
  if (p) out.push(`## Where we practise: ${p.name}`, '', p.about, p.account, ...(p.url ? [`Link: ${p.url}`] : []), `How to hand in: ${p.save}`, '');
  const more = practiceLinks(c.subject, c.band);
  if (more.length) out.push('## More places to practise', '', ...more.map((l) => `- **${l.name}** (${l.url}): ${l.what}`), '');
  for (const m of c.modules) {
    out.push(`# ${m.title}`, '');
    for (const l of m.lessons) {
      out.push(`## ${l.t}`, '', `Goal: ${l.o}`, '');
      for (const [, title, body] of l.cards) out.push(`### ${title}`, body, '');
      out.push(`### Explanation`, l.teach.explain, '', `### Think of it like this`, l.teach.analogy, '');
      out.push('### Key words', ...l.teach.vocab.map(([t, d]) => `- **${t}**: ${d}`), '');
      if (l.teach.mis.length) out.push('### Common mistakes', ...l.teach.mis.map(([m, f]) => `- Mistake: ${m}. Better: ${f}`), '');
    }
  }
  return out.join('\n');
}

/** Safety message for adult learners (the child version tells them to find a trusted adult). */
export const ADULT_ESCALATION =
  'Thank you for telling me — this matters more than the lesson. Please talk to someone you trust: your manager, HR or a colleague, and contact local emergency services if you are in danger. If you are having thoughts of harming yourself, please reach out to a mental-health helpline such as Tele-MANAS (14416 in India) now. This conversation has been flagged for your trainer.';

export function agentPatch(c: CourseSpec) {
  const lessons = c.modules.flatMap((m) => m.lessons);
  const young = agesOf(c)[0] < 9;
  const adult = c.band === 'Adult';
  return {
    identity: { name: c.tutor[0], purpose: c.tutor[1] },
    ...(young ? { audience: { vocabulary: 'simple', complexity: 1, maxSentences: 3 } } : {}),
    ...(adult
      ? {
          audience: { vocabulary: 'standard', complexity: 4, maxSentences: 6 },
          tone: 'Professional, practical and respectful of the learner’s experience. Use their industry’s language, keep answers concise and action-oriented.',
          examplesPolicy: `Use realistic workplace examples from ${c.subject.replace(/^AI for /, '')} work in India and globally. One example at a time; never invent statistics.`,
          escalation: { triggers: ['harassing me at work', 'unsafe at work'], message: ADULT_ESCALATION },
        }
      : {}),
    misconceptions: [
      ...(c.tutorMis || []).map(([trigger, correction]) => ({ trigger, correction })),
      ...lessons.flatMap((l) => l.teach.mis.slice(0, 1)).slice(0, 6).map(([m, f]) => ({ trigger: m.toLowerCase().replace(/[.“”"]/g, '').split(/\s+/).slice(0, 5).join(' '), correction: f })),
    ],
    ...(c.outOfScope?.length
      ? { outOfScope: { topics: c.outOfScope, actions: ['Doing graded work for the learner', 'Giving personal advice outside the course'], redirect: `That’s outside our ${c.subject} course. Let’s get back to the lesson — or ask your ${adult ? 'trainer' : 'teacher'}!` } }
      : adult
        ? { outOfScope: { topics: [], actions: ['Doing graded work for the learner', 'Giving legal, medical or financial advice for a specific personal situation'], redirect: `That’s outside our ${c.subject} course. Let’s get back to the lesson — or ask your trainer.` } }
        : {}),
    grounding: { mode: 'prefer', citeSources: !young },
  };
}

/** Structural checks used by tests and by the installer before touching the database. */
export function lintCourse(c: CourseSpec): string[] {
  const issues: string[] = [];
  const where = `${c.subject} / ${c.band} / ${c.level}`;
  const [a0, a1] = agesOf(c);
  const [b0, b1] = band(c.band).ages;
  if (a0 > a1) issues.push(`${where}: ages reversed`);
  if (a1 < b0 - 1 || a0 > b1 + 1) issues.push(`${where}: ages ${a0}–${a1} don't fit band ${c.band}`);
  if (!c.modules.length) issues.push(`${where}: no modules`);
  for (const m of c.modules)
    for (const l of m.lessons) {
      const w = `${where} / ${l.t}`;
      if (l.cards.length < 2) issues.push(`${w}: needs at least 2 Learn cards`);
      const phases = l.acts.map((a) => a.phase || ('write' in a ? 'probe' : 'perform'));
      if (!phases.includes('perform')) issues.push(`${w}: needs a Perform activity`);
      if (!phases.includes('probe')) issues.push(`${w}: needs a Probe activity`);
      for (const a of l.acts) {
        if (('mcq' in a || 'code' in a) && (a.answer < 0 || a.answer >= a.options.length)) issues.push(`${w}: answer index out of range`);
        if ('mcq' in a && new Set(a.options).size !== a.options.length) issues.push(`${w}: duplicate options`);
        if ('sort' in a && a.items.some(([, b]) => b < 0 || b >= a.buckets.length)) issues.push(`${w}: sort bucket out of range`);
        if ('sort' in a && a.buckets.some((_, b) => !a.items.some(([, x]) => x === b))) issues.push(`${w}: a sort bucket is empty`);
        if ('blanks' in a) {
          const n = [...a.blanks.matchAll(/\[\[(\w+)\]\]/g)].length;
          if (n !== a.answers.length) issues.push(`${w}: ${n} blanks but ${a.answers.length} answer lists`);
          if (a.bank) for (const ans of a.answers) if (!ans.some((x) => a.bank!.includes(x))) issues.push(`${w}: word bank lacks an answer (${ans[0]})`);
        }
        if ('trace' in a && !GLYPHS[a.glyph]) issues.push(`${w}: unknown tracing glyph “${a.glyph}”`);
        if ('order' in a && a.steps.length < 3) issues.push(`${w}: ordering needs 3+ steps`);
        if ('match' in a && new Set(a.pairs.map((p) => p[1])).size !== a.pairs.length) issues.push(`${w}: duplicate match targets`);
      }
      if (l.hook[0] === 'letter' && !GLYPHS[l.hook[1]]) issues.push(`${w}: unknown hook glyph “${l.hook[1]}”`);
      if (!l.teach.vocab.length) issues.push(`${w}: no vocabulary`);
      if (!l.teach.mis.length) issues.push(`${w}: no misconceptions`);
    }
  return issues;
}
