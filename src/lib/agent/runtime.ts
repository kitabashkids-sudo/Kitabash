// ─────────────────────────────────────────────────────────────
// Universal agent runtime. Assembles, per request:
//   global platform policy → course profile → agent config version →
//   learner age → lesson/activity context → retrieved passages
// then runs deterministic safety gates, calls the provider adapter,
// post-processes citations and logs pseudonymously.
// ─────────────────────────────────────────────────────────────
import crypto from 'node:crypto';
import { get, all, run, id, j } from '../db/index.ts';
import { retrieve, tokenize, bm25, type Passage } from '../knowledge/retrieval.ts';
import { GLOBAL_PLATFORM_POLICY, type AgentConfig, defaultAgentConfig } from './config.ts';
import { activeProvider, type AIProvider } from './providers/index.ts';
import { HttpError } from '../validate.ts';

export type Intent = 'greeting' | 'hint_request' | 'answer_request' | 'confused' | 'attempt' | 'question' | 'off_topic' | 'escalate' | 'out_of_scope';

export interface AgentContext {
  surface: 'tutor' | 'cofacilitator' | 'sandbox';
  course: { id: string; title: string; subject: string; ageMin: number | null; ageMax: number | null; objectives: string[]; description: string };
  config: AgentConfig;
  lesson?: { id: string; title: string; objective: string; learnText: string; activity?: { title: string; instructions: string; hints: string[]; type: string } };
  passages: Passage[];
  intent: Intent;
  hintLevel: number;
  learnerAge: number | null;
  question: string;
  piiDetected: boolean;
}

export interface AgentReply {
  reply: string;
  citations: { n: number; resourceId: string; resourceTitle: string; ref: string }[];
  meta: { intent: Intent; grounded: boolean; escalated: boolean; refused: boolean; answered: boolean; provider: string; model: string; hintLevel: number; logId?: string };
}

// ── Deterministic classifiers (shared by every provider) ───
const RX = {
  greeting: /^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b[\s!.]*$/i,
  hint: /\b(hint|clue|i'?m stuck|stuck|another hint|give me a tip|nudge)\b/i,
  answer: /\b(tell me the answer|give me the answer|what('?s| is) the answer|just tell me|answer (key|is)|solve it for me|do it for me|write it for me|do my homework)\b/i,
  confused: /\b(don'?t (get|understand)|confus|lost|what does .* mean|makes no sense|i don'?t know)\b/i,
  attempt: /\b(i think|is it|my answer|i chose|i picked|maybe it'?s|because)\b/i,
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
  phone: /(\+?\d[\d\s-]{8,}\d)/g,
  address: /\b(my address is|i live at|i live in|my school is)\b/i,
};

export function classifyIntent(text: string): Intent {
  const t = text.trim().replace(/[‘’]/g, "'");
  if (RX.greeting.test(t)) return 'greeting';
  if (RX.answer.test(t)) return 'answer_request';
  if (RX.hint.test(t)) return 'hint_request';
  if (RX.confused.test(t)) return 'confused';
  if (RX.attempt.test(t)) return 'attempt';
  return 'question';
}

export function detectPII(text: string): boolean {
  RX.email.lastIndex = RX.phone.lastIndex = 0;
  return RX.email.test(text) || RX.phone.test(text) || RX.address.test(text);
}

export function redact(text: string): string {
  return text.replace(RX.email, '[email removed]').replace(RX.phone, '[number removed]');
}

/**
 * Phrase matcher for safeguarding triggers and out-of-scope topics.
 * Single words match any word that STARTS with them ("bully" → bullying, bullied, bullies);
 * multi-word phrases match on word boundaries ("kill myself"). Errs towards matching:
 * a false escalation is a gentle message; a missed one is a safeguarding failure.
 */
export function matchesAny(text: string, phrases: string[]): string | null {
  const normal = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim();
  const t = normal(text);
  const words = t.split(' ');
  for (const p of phrases) {
    const q = normal(p);
    if (!q) continue;
    if (!q.includes(' ')) {
      if (q.length >= 4 ? words.some((w) => w.startsWith(q)) : words.includes(q)) return p;
    } else if (` ${t} `.includes(` ${q}`)) return p;
  }
  return null;
}

// ── Context assembly ──────────────────────────────────────
export async function loadCourseCtx(courseId: string) {
  const c = await get(
    `SELECT c.*, s.name AS subject_name FROM courses c JOIN subjects s ON s.id=c.subject_id WHERE c.id=?`,
    courseId,
  );
  if (!c) throw new HttpError(404, 'Course not found');
  return {
    row: c,
    ctx: { id: c.id, title: c.title, subject: c.subject_name, ageMin: c.age_min, ageMax: c.age_max, objectives: j<string[]>(c.objectives, []), description: c.description },
  };
}

export async function publishedOrDraftConfig(courseId: string, which: 'published' | 'draft'): Promise<{ config: AgentConfig; versionId: string | null; version: number | null }> {
  const agent = await get('SELECT * FROM agents WHERE course_id=?', courseId);
  const vid = agent ? (which === 'published' ? agent.published_version_id : agent.draft_version_id || agent.published_version_id) : null;
  const ver = vid ? await get('SELECT * FROM agent_versions WHERE id=?', vid) : null;
  if (ver) return { config: j<AgentConfig>(ver.config, defaultAgentConfig({ title: '' })), versionId: ver.id, version: ver.version };
  const { row } = await loadCourseCtx(courseId);
  return { config: defaultAgentConfig(row as any), versionId: null, version: null };
}

async function lessonCtx(lessonId?: string, activityId?: string): Promise<AgentContext['lesson']> {
  if (!lessonId) return undefined;
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) return undefined;
  const learn = j<{ cards: { title?: string; body: string }[] }>(l.learn, { cards: [] });
  const a = activityId ? await get('SELECT title,instructions,hints,type FROM activities WHERE id=? AND lesson_id=?', activityId, lessonId) : null;
  return {
    id: l.id,
    title: l.title,
    objective: l.objective,
    learnText: learn.cards.map((c) => `${c.title ? c.title + ': ' : ''}${c.body}`).join('\n'),
    activity: a ? { title: a.title, instructions: a.instructions, hints: j<string[]>(a.hints, []), type: a.type } : undefined,
  };
}

export function buildSystemPrompt(ctx: AgentContext): string {
  const c = ctx.config;
  const ages = ctx.course.ageMin || ctx.course.ageMax ? `${ctx.course.ageMin ?? '?'}–${ctx.course.ageMax ?? '?'}` : 'not specified';
  const parts = [
    GLOBAL_PLATFORM_POLICY,
    ctx.surface === 'cofacilitator'
      ? '\nYou are now assisting the TEACHER (an adult) as a co-facilitator: give concise, practical classroom-ready material. Answer keys may be discussed.'
      : '',
    `\n## Course\nTitle: ${ctx.course.title}\nSubject: ${ctx.course.subject}\nLearner ages: ${ages}${ctx.learnerAge ? ` (this learner is about ${ctx.learnerAge})` : ''}\nObjectives:\n${ctx.course.objectives.map((o) => `- ${o}`).join('\n')}`,
    `\n## Your role\nName: ${c.identity.name}. ${c.identity.purpose}\nTone: ${c.tone}\nInteraction style: ${c.interactionStyle}. ${c.framework}\nVocabulary: ${c.audience.vocabulary}; complexity ${c.audience.complexity}/5; at most ${c.audience.maxSentences} sentences per reply.\nQuestioning: ${c.questioningStrategy}\nAsk vs explain: ${c.askVsExplain}\nExamples: ${c.examplesPolicy}\nAssessment rules: ${c.assessmentRules}`,
    `\n## Hint ladder (use level ${ctx.hintLevel + 1} now if giving a hint)\n${c.hintLadder.map((h, i) => `${i + 1}. ${h}`).join('\n')}`,
  ];
  if (c.misconceptions.length) parts.push(`\n## Misconceptions to watch for\n${c.misconceptions.map((m) => `- If the learner thinks "${m.trigger}": ${m.correction}`).join('\n')}`);
  parts.push(`\n## Out of scope\nTopics: ${c.outOfScope.topics.join(', ') || '(anything unrelated to the course)'}\nActions you must not do: ${c.outOfScope.actions.join('; ')}\nWhen out of scope, say: "${c.outOfScope.redirect}"`);
  if (ctx.lesson) {
    parts.push(`\n## Current lesson\n${ctx.lesson.title} — objective: ${ctx.lesson.objective}\n${ctx.lesson.learnText.slice(0, 1500)}`);
    if (ctx.lesson.activity) parts.push(`Current activity: ${ctx.lesson.activity.title} — ${ctx.lesson.activity.instructions}\nAuthor's hints (reveal one at a time): ${ctx.lesson.activity.hints.join(' | ')}`);
  }
  if (ctx.passages.length) {
    parts.push(`\n## Course sources (cite as [S#])\n${ctx.passages.map((p, i) => `[S${i + 1}] (${p.resourceTitle}, ${p.ref}) ${p.text.slice(0, 1200)}`).join('\n\n')}`);
  }
  parts.push(
    `\n## Grounding\nMode: ${c.grounding.mode}. ${
      c.grounding.mode === 'strict'
        ? 'Only answer from the course sources or lesson text. If they do not cover it, say you are not sure and suggest asking the teacher.'
        : c.grounding.mode === 'prefer'
          ? 'Prefer the course sources; you may add simple well-known facts, but never contradict the sources.'
          : 'Use general knowledge carefully.'
    }${c.grounding.citeSources ? ' Cite sources you used as [S1] etc.' : ''}`,
  );
  if (c.examples.length) parts.push(`\n## Example replies\n${c.examples.map((e) => `Learner: ${e.student}\nIdeal: ${e.ideal}`).join('\n\n')}`);
  if (c.extraInstructions) parts.push(`\n## Additional course instructions\n${c.extraInstructions}`);
  return parts.join('\n');
}

/** Lesson learn-cards as searchable passages (cited as "Lesson: <title>"). */
async function lessonPassages(courseId: string, query: string, approvedOnly: boolean): Promise<Passage[]> {
  const rows = await all(`SELECT id, title, learn FROM lessons WHERE course_id=? ${approvedOnly ? "AND status='approved'" : ''}`, courseId);
  const docs = rows.flatMap((l) =>
    j<{ cards: { title?: string; body: string }[] }>(l.learn, { cards: [] }).cards.map((c, i) => ({ id: `${l.id}#${i}`, lessonId: l.id, title: l.title, text: c.body })),
  );
  if (!docs.length) return [];
  const scores = bm25(query, docs);
  return docs
    .filter((d) => scores.has(d.id))
    .map((d) => ({ chunkId: d.id, resourceId: `lesson:${d.lessonId}`, resourceTitle: `Lesson: ${d.title}`, ref: 'learn card', text: d.text, score: scores.get(d.id)! }));
}

// ── Rate limiting (per user, sliding minute) ──────────────
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, perMin = Number(process.env.AI_RATE_LIMIT_PER_MIN || 20)) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < 60_000);
  if (arr.length >= perMin) throw new HttpError(429, 'You’re asking very fast! Take a breath and try again in a minute.');
  arr.push(now);
  buckets.set(key, arr);
}

export function learnerRef(userId: string) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret').update(userId).digest('hex').slice(0, 16);
}

// ── Main entry ────────────────────────────────────────────
export interface RespondInput {
  courseId: string;
  lessonId?: string;
  activityId?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  surface: AgentContext['surface'];
  userId: string;
  learnerAge?: number | null;
  config?: AgentConfig; // sandbox passes the draft version explicitly
  provider?: AIProvider;
  log?: boolean;
  extra?: any;
}

export async function respond(input: RespondInput): Promise<AgentReply> {
  const msgs = input.messages.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  const last = [...msgs].reverse().find((m) => m.role === 'user');
  if (!last || !last.content.trim()) throw new HttpError(400, 'Ask a question first.');
  const question = last.content.trim();
  const { ctx: course } = await loadCourseCtx(input.courseId);
  const config = input.config || (await publishedOrDraftConfig(input.courseId, input.surface === 'sandbox' ? 'draft' : 'published')).config;
  const provider = input.provider || activeProvider();
  const lesson = await lessonCtx(input.lessonId, input.activityId);
  const priorHints = msgs.filter((m) => m.role === 'user' && classifyIntent(m.content) === 'hint_request').length - (classifyIntent(question) === 'hint_request' ? 1 : 0);

  const ctx: AgentContext = {
    surface: input.surface,
    course,
    config,
    lesson,
    passages: [],
    intent: classifyIntent(question),
    hintLevel: Math.max(0, Math.min(config.hintLadder.length - 1, priorHints)),
    learnerAge: input.learnerAge ?? null,
    question,
    piiDetected: detectPII(question),
  };

  const finish = async (reply: string, flags: Partial<AgentReply['meta']>, citations: AgentReply['citations'] = [], providerInfo = { provider: 'policy', model: 'deterministic' }): Promise<AgentReply> => {
    const meta: AgentReply['meta'] = {
      intent: ctx.intent,
      grounded: citations.length > 0,
      escalated: false,
      refused: false,
      answered: true,
      hintLevel: ctx.hintLevel,
      ...providerInfo,
      ...flags,
    };
    if (input.log !== false) {
      const logId = id('lg_');
      await run(
        'INSERT INTO agent_logs (id,course_id,lesson_id,surface,learner_ref,question,intent,grounded,answered,escalated) VALUES (?,?,?,?,?,?,?,?,?,?)',
        logId, input.courseId, input.lessonId || null, input.surface, learnerRef(input.userId), redact(question).slice(0, 500), meta.intent, meta.grounded, meta.answered, meta.escalated,
      );
      meta.logId = logId;
    }
    return { reply, citations, meta };
  };

  // 1. Safeguarding gate — always deterministic, never delegated to a model.
  // Platform triggers always apply, even to configurations saved before they were added.
  if (matchesAny(question, [...defaultAgentConfig({ title: '' }).escalation.triggers, ...config.escalation.triggers])) {
    ctx.intent = 'escalate';
    return finish(config.escalation.message, { escalated: true, answered: false });
  }
  const piiNote = ctx.piiDetected ? 'Quick reminder: please don’t share personal details like your phone number, email or address here. ' : '';

  // 2. Configured out-of-scope topics.
  if (input.surface !== 'cofacilitator' && matchesAny(question, config.outOfScope.topics)) {
    ctx.intent = 'out_of_scope';
    return finish(piiNote + config.outOfScope.redirect, { refused: true, answered: false });
  }

  // 3. Graded-answer requests: guide, don't give.
  if (ctx.intent === 'answer_request' && input.surface !== 'cofacilitator') {
    const h = lesson?.activity?.hints?.[0];
    return finish(
      `${piiNote}I can’t give you the answer — but I can help you find it! ${h ? `Here’s a hint: ${h}` : `Let’s start with this: ${config.hintLadder[0].replace(/^[^:]+:\s*/, '')}`} What do you think?`,
      { refused: true },
    );
  }

  // 4. Retrieval (kept separate from prompting).
  // Vague messages ("I don't get it") search by the lesson/course objective instead.
  const query = ctx.intent === 'confused' || ctx.intent === 'greeting' ? `${question} ${lesson?.objective || course.objectives.join(' ')}` : `${question} ${lesson?.objective || ''}`;
  // Course knowledge files + the course's own lesson text are both searched.
  ctx.passages = [...(await retrieve(input.courseId, query, 4)), ...(await lessonPassages(input.courseId, query, input.surface === 'tutor'))]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // 5. Topic-relevance check for the offline provider (LLMs follow the scope instructions).
  if (!provider.isLLM && input.surface !== 'cofacilitator' && ['question', 'attempt'].includes(ctx.intent)) {
    const vocab = new Set(tokenize([course.title, course.subject, course.description, ...course.objectives, lesson?.title, lesson?.objective, lesson?.learnText, lesson?.activity?.instructions].join(' ')));
    const qTok = tokenize(question);
    const overlap = qTok.filter((w) => vocab.has(w)).length;
    if (!ctx.passages.length && overlap === 0) {
      ctx.intent = 'off_topic';
      return finish(piiNote + config.outOfScope.redirect, { refused: true, answered: false });
    }
  }

  // 6. Strict grounding: nothing in sources → say so.
  if (config.grounding.mode === 'strict' && !ctx.passages.length && ['question', 'confused'].includes(ctx.intent) && !lesson?.learnText) {
    return finish(`${piiNote}I’m not sure about that one — it isn’t in our course materials, and I don’t want to guess. Could you ask your teacher?`, { answered: false });
  }

  // 7. Provider call.
  const system = buildSystemPrompt(ctx);
  const safeMsgs = msgs.map((m) => ({ ...m, content: redact(m.content) }));
  let res;
  try {
    res = await provider.generate({ task: input.surface === 'cofacilitator' ? 'cofacilitate' : 'tutor', system, messages: safeMsgs, context: ctx, extra: input.extra, maxTokens: 700 });
  } catch (e) {
    console.error('[agent] provider failed:', (e as Error).message);
    return finish('Sorry — I couldn’t think of an answer just now. Please try again, or ask your teacher.', { answered: false }, [], { provider: provider.id, model: 'error' });
  }

  // 8. Citations: map [S#] markers to sources.
  const used = new Set<number>();
  for (const m of res.text.matchAll(/\[S(\d+)\]/g)) used.add(Number(m[1]));
  const citations = [...used]
    .filter((n) => ctx.passages[n - 1])
    .sort((a, b) => a - b)
    .map((n) => ({ n, resourceId: ctx.passages[n - 1].resourceId, resourceTitle: ctx.passages[n - 1].resourceTitle, ref: ctx.passages[n - 1].ref }));
  return finish(piiNote + res.text.trim(), {}, citations, { provider: res.provider, model: res.model });
}

export async function insights(courseId: string) {
  const byIntent = await all('SELECT intent, COUNT(*) n FROM agent_logs WHERE course_id=? GROUP BY intent ORDER BY n DESC', courseId);
  const unanswered = await all("SELECT question, intent, created_at FROM agent_logs WHERE course_id=? AND answered=0 AND surface!='sandbox' ORDER BY created_at DESC LIMIT 25", courseId);
  const escalations = (await get("SELECT COUNT(*) n FROM agent_logs WHERE course_id=? AND escalated=1 AND surface!='sandbox'", courseId))?.n || 0;
  const total = await get("SELECT COUNT(*) n, SUM(grounded) g, SUM(CASE WHEN rating=1 THEN 1 ELSE 0 END) up, SUM(CASE WHEN rating=-1 THEN 1 ELSE 0 END) down FROM agent_logs WHERE course_id=? AND surface!='sandbox'", courseId);
  const questions = await all<{ question: string }>("SELECT question FROM agent_logs WHERE course_id=? AND surface='tutor' AND intent IN ('question','confused') ORDER BY created_at DESC LIMIT 400", courseId);
  // Frequent-question clustering: group by top content words (privacy-safe aggregate).
  const groups = new Map<string, { key: string; n: number; example: string }>();
  for (const q of questions) {
    const key = [...new Set(tokenize(q.question))].slice(0, 3).sort().join(' ');
    if (!key) continue;
    const g = groups.get(key) || { key, n: 0, example: q.question };
    g.n++;
    groups.set(key, g);
  }
  return {
    totals: { questions: total?.n || 0, grounded: total?.g || 0, thumbsUp: total?.up || 0, thumbsDown: total?.down || 0, escalations },
    byIntent,
    frequent: [...groups.values()].sort((a, b) => b.n - a.n).slice(0, 10),
    unanswered,
  };
}
