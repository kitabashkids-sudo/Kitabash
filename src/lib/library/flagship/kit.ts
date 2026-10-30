// Authoring kit for flagship courses: write the learning content once; the lesson video script,
// worksheet and timed lesson plan are generated from it (each can still be written by hand).
import type { FAct, FlagshipLesson, Scene, WorksheetTask } from './types.ts';

export interface LessonInput {
  title: string;
  objective: string;
  concept: string;
  minutes?: number;
  hook: FlagshipLesson['hook'];
  intro?: string; // first narration line of the video
  cards: FlagshipLesson['cards'];
  scenes?: Scene[]; // extra video scenes (e.g. a robot run or a compare), shown after the cards
  video?: FlagshipLesson['video']; // full hand-written video (overrides the generated one)
  build?: FlagshipLesson['build'];
  acts: FAct[];
  teacher: Omit<FlagshipLesson['teacher'], 'plan' | 'successCriteria'> & { plan?: FlagshipLesson['teacher']['plan']; successCriteria: string[] };
  tasks?: WorksheetTask[]; // extra worksheet tasks (added after the generated ones)
  worksheet?: FlagshipLesson['worksheet'];
  project?: FlagshipLesson['project'];
}

const sentences = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z“"(0-9])/)
    .map((x) => x.trim())
    .filter(Boolean);
const short = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function autoVideo(n: number, x: LessonInput): FlagshipLesson['video'] {
  const scenes: Scene[] = [
    {
      kind: 'title',
      title: x.title.replace(/^Project: /, ''),
      subtitle: `Lesson ${n} · ${x.concept}`,
      say: [x.intro || (x.project ? `It’s project time! ${sentences(x.project.brief)[0]}` : `In this lesson, you will learn to ${lowerFirst(x.objective.replace(/\.$/, ''))}.`)],
    },
  ];
  for (const c of x.cards) {
    const say = sentences(c.body).slice(0, 3);
    if (c.blocks) scenes.push({ kind: 'blocks', heading: c.title, blocks: c.blocks, note: short(sentences(c.body)[0] || '', 90), say });
    else scenes.push({ kind: 'card', heading: c.title, emoji: c.emoji, body: c.body, say });
  }
  scenes.push(...(x.scenes || []));
  // Picture-puzzle lessons: show the character solving the first puzzle.
  const pz = !x.scenes && (x.acts.find((a) => 'puzzle' in a) as Extract<FAct, { puzzle: string }> | undefined);
  if (pz) scenes.push({ kind: 'stage', heading: `Watch: ${pz.puzzle}`, world: pz.world, program: pz.solution, say: [pz.goalText, pz.explain] });
  scenes.push({ kind: 'recap', heading: 'Remember', points: x.teacher.successCriteria.map((s) => short(s.replace(/^I can /, ''), 54)), say: ['Great work! Let’s remember what we learned.', x.project ? 'Now plan it, build it, test it, and share it!' : 'Now build along, then try the challenges. You’ve got this!'] });
  return { title: x.title, scenes };
}

const OPT = 'ABCDEFGH';
function taskFromAct(a: FAct, i: number): WorksheetTask | null {
  const h = `${i}.`;
  if ('mcq' in a) return { heading: `${h} ${a.title || 'Choose the answer'}`, instructions: a.mcq + ' Circle one.', items: a.options.map((o, j) => `${OPT[j]}. ${o}`), answer: `${OPT[a.answer]}. ${a.options[a.answer]} — ${a.why}` };
  if ('bmcq' in a)
    return {
      heading: `${h} ${a.title || 'Read the code'}`,
      instructions: a.bmcq + ' Circle one.',
      blocks: a.blocks,
      items: a.options.map((o, j) => `${OPT[j]}. ${typeof o === 'string' ? o : `${o.text} (script ${o.text})`}`),
      answer: `${OPT[a.answer]} — ${a.why}`,
    };
  if ('code' in a) return { heading: `${h} ${a.title || 'Predict the output'}`, instructions: `${a.ask} Code: ${a.code.replace(/\n/g, ' ⏎ ')}`, items: a.options.map((o, j) => `${OPT[j]}. ${o}`), answer: `${OPT[a.answer]}. ${a.options[a.answer]}` };
  if ('blanks' in a) return { heading: `${h} ${a.title || 'Fill the gaps'}`, instructions: a.blanks.replace(/\[\[\w+\]\]/g, '________') + (a.bank ? ` (Word bank: ${a.bank.join(', ')})` : ''), answer: a.answers.map((x) => x[0]).join(' · ') };
  if ('order' in a) {
    const shuffled = [...a.steps].reverse();
    shuffled.push(shuffled.shift()!);
    return { heading: `${h} ${a.title || 'Put it in order'}`, instructions: `${a.order} Number them 1–${a.steps.length}.`, items: shuffled.map((s) => `___ ${s}`), answer: a.steps.map((s, j) => `${j + 1} ${s}`).join(' · ') };
  }
  if ('border' in a) {
    const shuffled = [...a.steps].reverse();
    return { heading: `${h} ${a.title || 'Put the blocks in order'}`, instructions: `${a.border} Number them 1–${a.steps.length}.`, items: shuffled.map((s) => `___ ${s.text}`), answer: a.steps.map((s, j) => `${j + 1} ${s.text}`).join(' · ') };
  }
  if ('match' in a) {
    const right = [...a.pairs.map((p) => p[1])].reverse();
    return { heading: `${h} ${a.match}`, instructions: 'Draw a line from each word to its match.', items: a.pairs.map((p, j) => `${p[0]}   ……   ${OPT[j]}. ${right[j]}`), answer: a.pairs.map((p) => `${p[0]} → ${p[1]}`).join(' · ') };
  }
  if ('sort' in a) return { heading: `${h} ${a.sort}`, instructions: `Write each item in the right group: ${a.buckets.join(' / ')}.`, items: a.items.map(([t]) => `${t} → ________`), answer: a.buckets.map((b, j) => `${b}: ${a.items.filter((x) => x[1] === j).map((x) => x[0]).join(', ')}`).join(' · ') };
  if ('write' in a) return { heading: `${h} ${a.title || 'Explain your thinking'}`, instructions: a.write, lines: 5, answer: a.exemplar };
  if ('py' in a) return { heading: `${h} Plan your program`, instructions: `Before you type it: ${a.py} Write the steps in plain English (pseudocode), then the Python you will use.`, lines: 7, answer: `Goals: ${a.goals.map((g) => g[0]).join('; ')}. One solution:\n${a.solution}` };
  if ('lab' in a) return { heading: `${h} Plan your code`, instructions: `Before you build it: ${a.lab} Write or draw the blocks you will use.`, lines: 6, answer: `Goals: ${a.goals.map((g) => g[0]).join('; ')}.` };
  return null;
}

export function autoWorksheet(n: number, x: LessonInput): FlagshipLesson['worksheet'] {
  const tasks: WorksheetTask[] = [];
  const vocab = x.teacher.vocab.slice(0, 4);
  if (vocab.length >= 2) {
    const defs = [...vocab.map((v) => v[1])].reverse();
    tasks.push({ heading: '1. Key words', instructions: 'Match each word to what it means. Write the letter.', items: vocab.map((v, j) => `${v[0]} ___      ${OPT[j]}. ${defs[j]}`), answer: vocab.map((v) => `${v[0]} = ${v[1]}`).join(' · ') });
  }
  const picks = x.acts.filter((a) => !('puzzle' in a) && !('projectAct' in a) && !('speak' in a) && !('trace' in a) && !('lab' in a && a.mode === 'project') && !('py' in a && a.mode === 'project'));
  for (const a of picks) {
    if (tasks.length >= 5) break;
    const t = taskFromAct(a, tasks.length + 1);
    if (t) tasks.push(t);
  }
  if (x.project) {
    tasks.push({ heading: `${tasks.length + 1}. My plan`, instructions: `Plan your project: ${x.project.brief} Sketch it and list what each part will do.`, lines: 7, answer: 'A clear plan that covers every requirement.' });
    tasks.push({ heading: `${tasks.length + 1}. Checklist`, instructions: 'Tick each one when your project does it.', items: x.project.requirements.map((r) => `☐ ${r}`), answer: 'All requirements met.' });
    tasks.push({ heading: `${tasks.length + 1}. Two stars and a wish`, instructions: 'Ask a friend to test your project. Write two things they liked and one idea to improve it.', lines: 4, answer: 'Kind, specific feedback and an improvement.' });
  }
  for (const t of x.tasks || []) tasks.push({ ...t, heading: `${tasks.length + 1}. ${t.heading.replace(/^\d+\.\s*/, '')}` });
  return { title: `Lesson ${n} — ${x.title}`, intro: x.project ? 'Plan your project and practise the key ideas.' : 'Practise what you learned today. Read each task carefully.', tasks };
}

export function autoPlan(x: LessonInput, minutes: number): FlagshipLesson['teacher']['plan'] {
  const perform = x.acts.filter((a) => ((a as any).phase || ('write' in a || 'projectAct' in a ? 'probe' : 'perform')) === 'perform');
  const probe = x.acts.filter((a) => !perform.includes(a));
  const name = (a: FAct) => (a as any).title || (a as any).puzzle || (a as any).sort || (a as any).match || 'activity';
  if (x.project) {
    const build = minutes - 5 - 5 - 7 - 8;
    return [
      { minutes: 5, stage: 'Warm-up (unplugged)', doing: x.teacher.unplugged },
      { minutes: 5, stage: 'Watch & plan', doing: 'Play the project video; learners plan on the project brief.' },
      { minutes: build, stage: 'Build', doing: `Build-along steps, then ${perform.map(name).join(', ') || 'the project'}. Check in halfway: everyone has something working.` },
      { minutes: 7, stage: 'Test & peer feedback', doing: 'Swap and test each other’s work: two stars and a wish.' },
      { minutes: 8, stage: 'Improve & submit', doing: `Improve one thing; ${probe.map(name).join(', ') || 'submit'}.` },
    ];
  }
  const fixed = 5 + 5 + (x.build ? 8 : 0) + 4;
  const rest = minutes - fixed;
  const pf = Math.round(rest * 0.62);
  return [
    { minutes: 5, stage: 'Warm-up (unplugged)', doing: x.teacher.unplugged },
    { minutes: 5, stage: 'Watch', doing: 'Play the lesson video with captions; pause at each heading and ask a question.' },
    ...(x.build ? [{ minutes: 8, stage: 'Build along', doing: `${x.build.title}: learners follow the steps.` }] : []),
    { minutes: pf, stage: 'Perform', doing: perform.map(name).join(', ') },
    { minutes: rest - pf, stage: 'Probe', doing: probe.map(name).join(', ') },
    { minutes: 4, stage: 'Wrap-up', doing: `Exit ticket: ${x.teacher.exit}` },
  ];
}

/** Build a full flagship lesson from compact input. */
export function lesson(n: number, x: LessonInput): FlagshipLesson {
  const minutes = x.minutes ?? (x.project ? 50 : 45);
  return {
    key: `l${String(n).padStart(2, '0')}`,
    title: x.title,
    objective: x.objective,
    concept: x.concept,
    minutes,
    hook: x.hook,
    video: x.video || autoVideo(n, x),
    cards: x.cards,
    build: x.build,
    acts: x.acts,
    teacher: { ...x.teacher, plan: x.teacher.plan || autoPlan(x, minutes) },
    worksheet: x.worksheet || autoWorksheet(n, x),
    project: x.project,
  };
}
