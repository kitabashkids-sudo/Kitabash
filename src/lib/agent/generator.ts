// Curriculum draft generator. Produces EDITABLE DRAFTS linked to the course
// profile and knowledge sources. Nothing generated is visible to students
// until an administrator reviews, approves and publishes it.
//
// - With an LLM provider: asks for one lesson per objective as JSON, validates
//   every activity against the registry, falls back per-lesson on failure.
// - Offline: builds source-grounded scaffolds (cloze items from source
//   sentences, explanation probes, teacher panels from the agent config).
import { all, get, run, id, j, tx } from '../db/index.ts';
import { retrieve, bestSentences, type Passage } from '../knowledge/retrieval.ts';
import { validateActivity } from '../activities/registry.ts';
import { activeProvider, type AIProvider } from './providers/index.ts';
import { publishedOrDraftConfig, loadCourseCtx } from './runtime.ts';
import type { AgentConfig } from './config.ts';
import type { LearnCard, TeacherContent, VisualHook } from '../lessonTypes.ts';
import { HttpError } from '../validate.ts';

interface DraftActivity {
  phase: 'perform' | 'probe';
  type: string;
  title: string;
  instructions: string;
  config: any;
  answer_key: any;
  hints: string[];
  points: number;
}
interface DraftLesson {
  title: string;
  objective: string;
  cards: LearnCard[];
  hook: VisualHook;
  teacher: TeacherContent;
  activities: DraftActivity[];
  sourceRefs: { resourceId: string; ref: string; title: string }[];
}

const STOP = new Set('about above after again against because before being below between both could does doing during each from further have having here into itself just more most other ought ourselves same should some such than that their theirs them themselves then there these they this those through under until very what when where which while whom why will with would your yours also many much like make made used uses using things thing want wants need'.split(' '));

async function keyTerms(courseId: string, extra: string, n = 14): Promise<string[]> {
  const rows = await all<{ text: string }>('SELECT c.text FROM resource_chunks c JOIN resources r ON r.id=c.resource_id WHERE c.course_id=? AND r.replaced_by IS NULL', courseId);
  const docs = [...rows.map((r) => r.text), extra];
  const df = new Map<string, number>();
  const tf = new Map<string, number>();
  for (const d of docs) {
    const ws = (d.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).filter((w) => !STOP.has(w));
    for (const w of ws) tf.set(w, (tf.get(w) || 0) + 1);
    for (const w of new Set(ws)) df.set(w, (df.get(w) || 0) + 1);
  }
  const N = docs.length;
  return [...tf.entries()]
    .filter(([w, f]) => f >= 2 || N <= 2)
    .map(([w, f]) => [w, f * Math.log(1 + N / (df.get(w) || 1))] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const shortTitle = (o: string) => cap(o.replace(/^(students?|learners?) (will|should|can) /i, '').replace(/^(be able to )/i, '').replace(/\.$/, '')).slice(0, 70);

async function offlineLesson(courseId: string, objective: string, terms: string[], config: AgentConfig, idx: number, used: Set<string> = new Set()): Promise<DraftLesson> {
  const passages = await retrieve(courseId, objective, 5);
  const sents = bestSentences(objective + ' ' + terms.slice(0, 4).join(' '), passages, 5);
  const refOf = (p: Passage) => `${p.resourceTitle} · ${p.ref}`;
  const cards: LearnCard[] = [{ title: 'Today’s big idea', body: `By the end of this lesson you will be able to ${objective.replace(/^./, (c) => c.toLowerCase()).replace(/\.$/, '')}.`, emoji: '🎯' }];
  for (const s of sents.slice(0, 3)) cards.push({ title: 'Key point', body: s.sentence, sourceRef: refOf(s.passage), emoji: '💡' });
  if (cards.length === 1) cards.push({ title: 'Explanation (needs author input)', body: 'No matching passage was found in the knowledge library for this objective. Upload a source or write the explanation here before approving.', emoji: '✍️' });

  // Pick a key term that appears in a source sentence → cloze items
  const termInSentence = (t: string) => sents.find((s) => new RegExp(`\\b${t}\\b`, 'i').test(s.sentence));
  const lessonTerms = terms.filter((t) => termInSentence(t) || objective.toLowerCase().includes(t));
  const main = lessonTerms.find((t) => !used.has(t)) || lessonTerms[0] || terms[idx % Math.max(terms.length, 1)] || objective.split(/\s+/).filter((w) => w.length > 4)[0]?.toLowerCase() || 'idea';
  used.add(main);
  const others = terms.filter((t) => t !== main && !(t.endsWith('s') && t.slice(0, -1) === main) && !(main.endsWith('s') && main.slice(0, -1) === t)).slice(0, 6);

  const activities: DraftActivity[] = [];
  const s1 = termInSentence(main);
  if (s1) {
    const bank = [main, ...others.slice(idx % 3, (idx % 3) + 2)].sort();
    activities.push({
      phase: 'perform',
      type: 'fill_blank',
      title: 'Complete the key sentence',
      instructions: 'Fill the gap using the word bank. Read the whole sentence first!',
      config: { text: s1.sentence.replace(new RegExp(`\\b${main}\\b`, 'i'), '[[1]]'), wordBank: bank },
      answer_key: { blanks: { '1': [main] }, explanation: `“${main}” completes the idea from the lesson.` },
      hints: [`The missing word is one of the lesson’s key words.`, `It starts with “${main[0]}”.`],
      points: 10,
    });
  }
  const s2 = sents.find((s) => s !== s1 && others.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(s.sentence)));
  const t2 = s2 && others.find((t) => new RegExp(`\\b${t}\\b`, 'i').test(s2.sentence));
  if (s2 && t2) {
    const distract = [main, ...others.filter((t) => t !== t2)].slice(0, 3);
    const opts = [t2, ...distract].sort().map((t, i) => ({ id: String.fromCharCode(97 + i), text: t }));
    activities.push({
      phase: 'perform',
      type: 'multiple_choice',
      title: 'Which word fits?',
      instructions: 'Choose the word that completes the sentence.',
      config: { question: s2.sentence.replace(new RegExp(`\\b${t2}\\b`, 'i'), '_____'), options: opts },
      answer_key: { correct: [opts.find((o) => o.text === t2)!.id], explanation: `The source says: “${s2.sentence}”` },
      hints: ['Read the sentence aloud with each option.', 'Which option makes the sentence true according to the lesson?'],
      points: 10,
    });
  }
  if (!activities.length) {
    activities.push({
      phase: 'perform',
      type: 'free_response',
      title: 'Try it out',
      instructions: 'Show what you know with an example.',
      config: { prompt: `Give one real-life example that shows: ${objective}`, minWords: 8, sentenceStarters: ['One example is…', 'I noticed that…'] },
      answer_key: { keywords: [main, ...others.slice(0, 2)] },
      hints: ['Think about something you did today.'],
      points: 10,
    });
  }
  activities.push({
    phase: 'probe',
    type: 'free_response',
    title: 'Explain your thinking',
    instructions: 'Answer in your own words. There is no single right answer — show your reasoning.',
    config: { prompt: `In your own words: why does “${main}” matter when we ${objective.replace(/^./, (c) => c.toLowerCase()).replace(/\.$/, '')}? Give an example.`, minWords: 12, sentenceStarters: ['I think…', 'This matters because…', 'For example…'] },
    answer_key: { keywords: [main, ...others.slice(0, 3)], exemplar: sents[0]?.sentence || '' },
    hints: ['Start with “I think…” and add “because…”.'],
    points: 10,
  });

  const vocab = [main, ...others.slice(0, 3)]
    .map((t) => ({ term: t, definition: sents.find((s) => new RegExp(`\\b${t}\\b`, 'i').test(s.sentence))?.sentence || '(add a learner-friendly definition)' }));

  const teacher: TeacherContent = {
    teach: {
      explanation: sents.slice(0, 3).map((s) => s.sentence).join(' ') || 'Add a short teacher explanation.',
      analogies: [`[Draft — please edit] Compare “${main}” to something learners use every day.`],
      vocabulary: vocab,
    },
    show: { items: [{ title: '3-second hook', kind: 'hook', description: `“${cap(main)}” revealed with its meaning.` }] },
    facilitate: {
      prompts: [
        { prompt: `What do you already know about ${main}?`, expected: 'Prior knowledge; accept all ideas and note misconceptions.' },
        { prompt: `Where might you see ${main} at home or school?`, expected: 'Concrete everyday examples.' },
      ],
      discussion: [`Think–pair–share: ${objective}`],
      differentiation: { support: 'Pre-teach the key words with pictures; allow oral answers for the probe.', stretch: 'Ask learners to create their own question for a partner.' },
      timing: 'Learn 5 min · Perform 10 min · Probe 5 min',
    },
    resources: { items: passages.slice(0, 3).map((p) => ({ title: `${p.resourceTitle} (${p.ref})`, kind: 'note' as const, body: p.text.slice(0, 400) })) },
    assess: {
      questions: [`Explain ${main} in one sentence.`, `Give an example and a non-example of ${main}.`],
      rubric: [
        { criterion: 'Understanding', levels: ['Not yet', 'Partly correct', 'Correct', 'Correct with own example'] },
        { criterion: 'Reasoning', levels: ['No reason given', 'Simple reason', 'Clear reason', 'Clear reason linked to source'] },
      ],
      misconceptions: config.misconceptions.map((m) => ({ misconception: m.trigger, fix: m.correction })),
    },
    extension: [`Create a mini-poster teaching ${main} to a younger learner.`],
  };

  return {
    title: shortTitle(objective),
    objective,
    cards,
    hook: { kind: 'preset', preset: 'word-reveal', params: { word: cap(main), tagline: (vocab[0].definition.length < 70 ? vocab[0].definition : `key idea of this lesson`).replace(/\.$/, '') }, caption: `${cap(main)} — today’s key word.`, alt: `The word ${main} appears letter by letter with a short meaning underneath.`, objective, durationMs: 3000 },
    teacher,
    activities,
    sourceRefs: passages.slice(0, 4).map((p) => ({ resourceId: p.resourceId, ref: p.ref, title: p.resourceTitle })),
  };
}

const LESSON_SCHEMA = `Return ONLY a JSON object with this exact shape (no markdown):
{"title": string,
 "cards": [{"title": string, "body": string (≤ 60 words, age-appropriate), "emoji": string, "sourceRef": string|null}],  // 2–4 cards
 "hook": {"preset": "word-reveal"|"pattern-reveal"|"budget-change"|"code-output"|"phrase-model"|"speech-upgrade"|"letter-trace", "params": object, "caption": string, "alt": string},
 "activities": [  // 1–2 with phase "perform", then 1–2 with phase "probe"
   {"phase": "perform"|"probe", "type": one of the activity types below, "title": string, "instructions": string, "config": object, "answer_key": object, "hints": [string, string], "points": 10}],
 "teacher": {"teach": {"explanation": string, "analogies": [string], "vocabulary": [{"term": string, "definition": string}]},
   "show": {"items": [{"title": string, "kind": "demo"|"example"|"diagram", "description": string}]},
   "facilitate": {"prompts": [{"prompt": string, "expected": string}], "discussion": [string], "differentiation": {"support": string, "stretch": string}, "timing": string},
   "resources": {"items": [{"title": string, "kind": "worksheet"|"template"|"note", "body": string}]},
   "assess": {"questions": [string], "rubric": [{"criterion": string, "levels": [string,string,string,string]}], "misconceptions": [{"misconception": string, "fix": string}]},
   "extension": [string]}}
Activity types and their config/answer_key shapes:
- multiple_choice: config {question, options:[{id,text}], code?}, answer_key {correct:[optionId], explanation, feedbackByOption?:{optionId: text}}
- fill_blank: config {text with [[1]] [[2]] placeholders, wordBank?:[string]}, answer_key {blanks:{"1":[accepted answers]}, explanation}
- ordering: config {prompt, items:[{id,text}]}, answer_key {order:[ids in correct order]}
- matching: config {left:[{id,text}], right:[{id,text}]}, answer_key {pairs:{leftId:rightId}}
- categorize: config {buckets:[{id,label}], items:[{id,text,emoji?}]}, answer_key {placement:{itemId:bucketId}, explanations?:{itemId:text}}
- budget_sim: config {scenario, budget:number, currency, items:[{id,name,cost,emoji}]}, answer_key {required:[itemIds], minSavings:number}
- speaking: config {phrase, lang:"en-IN", tips:[string], checklist:[string]}, answer_key {}
- free_response: config {prompt, minWords, sentenceStarters:[string]}, answer_key {keywords:[string], exemplar}
Choose activity types that suit the SUBJECT (e.g. finance → categorize/budget_sim; language → fill_blank/speaking; process → ordering).`;

async function llmLesson(provider: AIProvider, course: any, config: AgentConfig, objective: string, passages: Passage[]): Promise<DraftLesson> {
  const system = `You are an expert instructional designer writing a Learn → Perform → Probe lesson for Kitabash.
Course: ${course.title} (${course.subject}); ages ${course.ageMin ?? '?'}–${course.ageMax ?? '?'}; proficiency: ${course.proficiency}.
Teaching style: ${config.tone}. Questioning: ${config.questioningStrategy}. Assessment: ${config.assessmentRules}.
Known misconceptions: ${config.misconceptions.map((m) => m.trigger).join('; ') || 'none listed'}.
Ground content in the SOURCES when relevant; do not invent curriculum-board alignment claims. Keep student text short and concrete.
${LESSON_SCHEMA}`;
  const user = `Lesson objective: ${objective}\n\nSOURCES:\n${passages.map((p, i) => `[S${i + 1}] ${p.resourceTitle}, ${p.ref}: ${p.text.slice(0, 1000)}`).join('\n\n') || '(no sources uploaded)'}`;
  const res = await provider.generate({ task: 'generate', system, messages: [{ role: 'user', content: user }], maxTokens: 4000, json: true });
  const raw = res.text.slice(res.text.indexOf('{'), res.text.lastIndexOf('}') + 1);
  const d = JSON.parse(raw);
  const activities: DraftActivity[] = [];
  for (const a of d.activities || []) {
    try {
      validateActivity(a.type, a.config, a.answer_key);
      activities.push({ phase: a.phase === 'probe' ? 'probe' : 'perform', type: a.type, title: String(a.title || 'Activity').slice(0, 120), instructions: String(a.instructions || '').slice(0, 600), config: a.config, answer_key: a.answer_key, hints: (a.hints || []).map(String).slice(0, 4), points: 10 });
    } catch (e) {
      console.warn('[generator] dropped invalid activity:', (e as Error).message);
    }
  }
  if (!activities.some((a) => a.phase === 'perform')) throw new Error('No valid perform activity in model output');
  return {
    title: String(d.title || shortTitle(objective)).slice(0, 120),
    objective,
    cards: (d.cards || []).slice(0, 5).map((c: any) => ({ title: String(c.title || ''), body: String(c.body || ''), emoji: c.emoji ? String(c.emoji).slice(0, 4) : undefined, sourceRef: c.sourceRef || undefined })),
    hook: { kind: 'preset', preset: d.hook?.preset || 'word-reveal', params: d.hook?.params || {}, caption: d.hook?.caption || '', alt: d.hook?.alt || d.hook?.caption || '', objective, durationMs: 3000 },
    teacher: d.teacher || {},
    activities,
    sourceRefs: passages.slice(0, 4).map((p) => ({ resourceId: p.resourceId, ref: p.ref, title: p.resourceTitle })),
  };
}

export async function generateCurriculum(courseId: string, opts: { lessonsPerModule?: number; replaceDrafts?: boolean; provider?: AIProvider } = {}) {
  const { row, ctx } = await loadCourseCtx(courseId);
  if (row.status === 'published') throw new HttpError(409, 'This course is published. Duplicate it or move it back to draft before generating.');
  const objectives = ctx.objectives.filter((o) => o.trim());
  if (!objectives.length) throw new HttpError(400, 'Add at least one learning objective in the course profile first.');
  const { config } = await publishedOrDraftConfig(courseId, 'draft');
  const provider = opts.provider || activeProvider();
  const terms = await keyTerms(courseId, `${row.title} ${row.description} ${objectives.join(' ')}`);
  const warnings: string[] = [];
  const hasSources = !!await get('SELECT 1 FROM resource_chunks WHERE course_id=? LIMIT 1', courseId);
  if (!hasSources) warnings.push('No extracted knowledge sources yet — drafts are scaffolds based on the objectives only.');
  if (!provider.isLLM) warnings.push('Generated with the offline generator (no AI model configured): source-grounded scaffolds that need teacher editing before approval.');

  const drafts: DraftLesson[] = [];
  const usedTerms = new Set<string>();
  for (let i = 0; i < objectives.length; i++) {
    if (provider.isLLM) {
      try {
        drafts.push(await llmLesson(provider, { ...ctx, proficiency: row.proficiency }, config, objectives[i], await retrieve(courseId, objectives[i], 5)));
        continue;
      } catch (e) {
        warnings.push(`Lesson ${i + 1}: model output was invalid (${(e as Error).message.slice(0, 80)}); used the offline scaffold instead.`);
      }
    }
    drafts.push(await offlineLesson(courseId, objectives[i], terms, config, i, usedTerms));
  }

  const perModule = Math.max(1, Math.min(6, opts.lessonsPerModule || 3));
  return await tx(async () => {
    if (opts.replaceDrafts) {
      await run("DELETE FROM lessons WHERE course_id=? AND generated=1 AND status='draft'", courseId);
      await run('DELETE FROM modules WHERE course_id=? AND id NOT IN (SELECT DISTINCT module_id FROM lessons)', courseId);
    }
    const startPos = ((await get('SELECT MAX(position) m FROM modules WHERE course_id=?', courseId))?.m ?? -1) + 1;
    let lessonCount = 0;
    let activityCount = 0;
    for (let m = 0; m * perModule < drafts.length; m++) {
      const group = drafts.slice(m * perModule, (m + 1) * perModule);
      const mid = id('m_');
      await run('INSERT INTO modules (id,course_id,title,summary,position) VALUES (?,?,?,?,?)', mid, courseId, `Module ${startPos + m + 1}: ${group[0].title}`, `Covers: ${group.map((g) => g.title).join('; ')}`, startPos + m);
      for (const [li, d] of group.entries()) {
        const lid = id('l_');
        await run(
          'INSERT INTO lessons (id,module_id,course_id,title,objective,position,status,learn,hook,teacher,source_refs,generated) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)',
          lid, mid, courseId, d.title, d.objective, li, 'draft', { cards: d.cards }, d.hook, d.teacher, d.sourceRefs,
        );
        lessonCount++;
        for (const [ai, a] of d.activities.entries()) {
          await run('INSERT INTO activities (id,lesson_id,phase,type,title,instructions,position,config,answer_key,hints,points) VALUES (?,?,?,?,?,?,?,?,?,?,?)', id('a_'), lid, a.phase, a.type, a.title, a.instructions, ai, a.config, a.answer_key, a.hints, a.points);
          activityCount++;
        }
        const probes = d.teacher.assess?.rubric;
        if (probes?.length) await run('INSERT INTO assessments (id,lesson_id,title,rubric,pass_pct) VALUES (?,?,?,?,60)', id('as_'), lid, `${d.title} — probe rubric`, probes);
      }
    }
    await run("UPDATE courses SET updated_at=datetime('now') WHERE id=?", courseId);
    return { lessons: lessonCount, activities: activityCount, provider: provider.id, warnings };
  });
}
