// Offline demo tutor — a deterministic, rule-based provider so the whole
// platform works with no API key. It follows the same agent configuration
// (hint ladder, misconceptions, grounding, sentence limits) but it is NOT a
// language model: replies are assembled from lesson text and retrieved
// course passages. The UI labels it "Offline demo tutor".
import type { AIProvider } from './index.ts';
import type { AgentContext } from '../runtime.ts';
import { bestSentences, tokenize } from '../../knowledge/retrieval.ts';

const pick = <T,>(arr: T[], seed: string) => arr[Math.abs([...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % arr.length];

function simplify(s: string, vocab: string): string {
  let out = s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  if (vocab === 'simple' && out.length > 180) out = out.slice(0, out.lastIndexOf(' ', 175)) + '…';
  return out;
}

function lessonSentences(ctx: AgentContext, q: string, n: number) {
  if (!ctx.lesson?.learnText) return [];
  const qt = new Set(tokenize(q));
  const bodies = ctx.lesson.learnText.split('\n').map((l) => l.replace(/^[^:]{1,40}:\s/, ''));
  return (bodies.join(' ').match(/[^.!?]+[.!?]+/g) || [])
    .filter((s) => !/^\s*By the end of this lesson/i.test(s))
    .map((s) => ({ s: s.trim(), k: tokenize(s).filter((w) => qt.has(w)).length }))
    .filter((x) => x.k > 0)
    .sort((a, b) => b.k - a.k)
    .slice(0, n)
    .map((x) => x.s);
}

function probe(ctx: AgentContext, seed: string) {
  const qs = ctx.config.interactionStyle === 'direct'
    ? ['Does that make sense?', 'Want to try the activity now?']
    : ['Can you think of an example from your own day?', 'Why do you think that is?', 'What would happen if it were the other way round?', 'How would you explain that to a friend?'];
  return pick(qs, seed);
}

function tutor(ctx: AgentContext): string {
  const c = ctx.config;
  const max = c.audience.maxSentences;
  const q = ctx.question;
  const mis = c.misconceptions.find((m) => q.toLowerCase().includes(m.trigger.toLowerCase()));
  const cite = (i: number) => (c.grounding.citeSources ? ` [S${i + 1}]` : '');

  if (ctx.intent === 'greeting') {
    return `Hi! I’m ${c.identity.name}, your learning helper${ctx.lesson ? ` for “${ctx.lesson.title}”` : ''}. Ask me about anything in this lesson, or say “hint” if you’re stuck.`;
  }

  if (ctx.intent === 'hint_request') {
    const authored = ctx.lesson?.activity?.hints || [];
    const level = ctx.hintLevel;
    if (authored[level]) return `Hint ${level + 1}: ${authored[level]}${authored[level + 1] ? ' Ask again if you need another.' : ''}`;
    const ladder = c.hintLadder[level] || c.hintLadder[c.hintLadder.length - 1];
    const s = bestSentences(q + ' ' + (ctx.lesson?.objective || ''), ctx.passages, 1)[0];
    const kind = ladder.split(':')[0];
    if (s) return `${kind} hint: think about this — “${simplify(s.sentence, c.audience.vocabulary)}”${cite(ctx.passages.indexOf(s.passage))} How could that help with your task?`;
    return `${kind} hint: look back at the lesson objective — “${ctx.lesson?.objective || ctx.course.objectives[0] || 'the key idea'}”. Which part of the task does it connect to?`;
  }

  const focus = ctx.intent === 'confused' ? `${q} ${ctx.lesson?.objective || ctx.course.objectives.join(' ')}` : q;
  const fromSources = bestSentences(focus, ctx.passages, Math.min(2, max - 1));
  const fromLesson = lessonSentences(ctx, focus, 2);
  const lines: string[] = [];
  if (mis) lines.push(mis.correction);

  if (ctx.intent === 'attempt' && c.interactionStyle !== 'direct') {
    lines.push('Good thinking — I like that you tried!');
    if (fromLesson[0] || fromSources[0]) lines.push(`Check your idea against this: ${simplify(fromLesson[0] || fromSources[0].sentence, c.audience.vocabulary)}${fromLesson[0] ? '' : cite(ctx.passages.indexOf(fromSources[0].passage))}`);
    lines.push('Tell me why you think your answer is right?');
    return lines.slice(0, max).join(' ');
  }

  if (ctx.intent === 'confused') lines.push('No problem — let’s take it step by step.');
  if (fromLesson.length) lines.push(...fromLesson.slice(0, 1).map((s) => simplify(s, c.audience.vocabulary)));
  for (const s of fromSources) {
    if (lines.length >= max - 1) break;
    if (!lines.some((l) => l.includes(s.sentence.slice(0, 40)))) lines.push(simplify(s.sentence, c.audience.vocabulary) + cite(ctx.passages.indexOf(s.passage)));
  }
  if (lines.length === (mis ? 1 : 0) + (ctx.intent === 'confused' ? 1 : 0)) {
    if (c.grounding.mode === 'off' || ctx.lesson) lines.push(`That connects to our goal: ${(ctx.lesson?.objective || ctx.course.objectives[0] || ctx.course.title).replace(/\.$/, '')}.`);
    else return 'I’m not sure about that one — I couldn’t find it in our course materials. Try asking it a different way, or ask your teacher.';
  }
  lines.push(probe(ctx, q));
  return lines.slice(0, max).join(' ');
}

function cofacilitate(ctx: AgentContext, task: string): string {
  const l = ctx.lesson;
  const topic = l?.objective || ctx.course.objectives[0] || ctx.course.title;
  const src = bestSentences(`${topic} ${ctx.question}`, ctx.passages, 3);
  const cites = (i: number) => ` [S${ctx.passages.indexOf(src[i].passage) + 1}]`;
  const ages = `${ctx.course.ageMin ?? ''}${ctx.course.ageMax ? '–' + ctx.course.ageMax : ''}`;
  switch (task) {
    case 'explain':
      return [
        `**Alternate explanation (ages ${ages || 'any'})**`,
        `Start concrete: hold up two real objects and ask learners which one connects to “${topic}”.`,
        src[0] ? `Then state the idea plainly: “${src[0].sentence}”${cites(0)}` : `Then state the idea in one sentence, using the lesson vocabulary.`,
        `Finish with a 10-second check: thumbs up / sideways / down.`,
      ].join('\n');
    case 'activity':
      return [
        `**Quick activity idea (5 min)**`,
        `“Stand on a side”: read 4 statements about ${topic}; learners move to the left wall (agree) or right wall (disagree), then one learner from each side explains why.`,
        src[1] ? `Use this source line as one statement: “${src[1].sentence}”${cites(1)}` : '',
        `Differentiate: give support learners picture cards; stretch learners write their own statement.`,
      ].filter(Boolean).join('\n');
    case 'example':
      return [`**Worked example**`, src[0] ? `From the course material: “${src[0].sentence}”${cites(0)}` : '', `Relate it to the learners’ day: school lunch, a bus ticket, a birthday gift. Ask: “Where does ${topic.toLowerCase()} show up here?”`].filter(Boolean).join('\n');
    case 'hints':
      return [`**Hint ladder for the current activity**`, ...(l?.activity?.hints?.length ? l.activity.hints : ctx.config.hintLadder).map((h, i) => `${i + 1}. ${h}`)].join('\n');
    case 'recap':
      return [
        `**Recap questions**`,
        `1. In your own words, what is ${topic.toLowerCase().replace(/^(understand|explain|identify|describe)\s+/, '')}?`,
        `2. Give one example from your life.`,
        `3. What is one mistake someone might make, and how would you fix it?`,
        ctx.config.misconceptions[0] ? `4. True or false: “${ctx.config.misconceptions[0].trigger}” — explain.` : '',
      ].filter(Boolean).join('\n');
    default:
      return tutor(ctx);
  }
}

export const offlineProvider: AIProvider = {
  id: 'mock',
  label: 'Offline demo tutor (rule-based, no AI model)',
  isLLM: false,
  configured: () => true,
  async generate(req) {
    const ctx = req.context;
    if (!ctx) return { text: 'Offline provider needs structured context.', provider: 'mock', model: 'offline-rules-v1' };
    const text = req.task === 'cofacilitate' ? cofacilitate(ctx, req.extra?.task || ctx.question) : tutor(ctx);
    return { text, provider: 'mock', model: 'offline-rules-v1' };
  },
};
