// AI for Professionals — shared building blocks.
// Every industry track = Beginner, Intermediate, Advanced. Four lessons per course: some are written
// specifically for the industry; the rest come from the templates below, filled with that industry's
// own examples. The research behind each track is in docs/AI_USE_CASES.md.
import type { CourseSpec, LessonSpec, Theme } from '../types.ts';

export interface Industry {
  subject: string; // catalogue subject, e.g. 'AI for HR'
  field: string; // short field name used in sentences, e.g. 'HR'
  people: string; // who the course is for, e.g. 'HR professionals and people managers'
  tutor: [string, string];
  theme: Theme;
  tools?: string[];
  /** Beginner lesson 1: the landscape. */
  uses: [string, string, string][]; // emoji, use case, one-line description (3)
  aiFit: string[]; // tasks where an AI draft helps (4+)
  humanCall: string[]; // tasks needing human judgement or sign-off (3+)
  factCheck: string; // e.g. 'a salary benchmark for Bengaluru'
  /** Beginner lesson 2: prompting. */
  prompt: {
    task: string; // what the prompt is for
    bad: string;
    good: string;
    role: string; // the four parts of the good prompt, quoted from it
    context: string;
    ask: string;
    format: string;
    practice: string; // probe task
    practiceExemplar: string;
  };
  /** Intermediate lesson 3: quality and privacy. */
  privacy: {
    safe: string[]; // fine to use in an approved tool (3)
    unsafe: string[]; // personal / confidential — remove or don't paste (3)
    redact: string; // a sentence containing personal data
    redacted: string; // the same sentence anonymised
    checks: string[]; // 4 review checks in order
    law: string; // the rules that matter in this field
  };
  /** Advanced lesson 3: governance. */
  risks: [string, string][]; // risk → control (4, unique controls)
  lowRisk: string[]; // (3)
  highRisk: string[]; // (3)
  policyExemplar: string;
  /** Advanced lesson 4: capstone pilot. */
  pilot: {
    useCase: string;
    task: string; // the repeated task being measured
    before: number; // minutes per task today
    after: number; // minutes per task with AI + review
    perWeek: number; // tasks per person per week
    people: number; // people doing it
    quality: string; // the quality metric to watch alongside time
    exemplar: string;
  };
  beginner: { title: string; description: string; lessons: [LessonSpec, LessonSpec] };
  intermediate: { title: string; description: string; lessons: [LessonSpec, LessonSpec, LessonSpec] };
  advanced: { title: string; description: string; lessons: [LessonSpec, LessonSpec] };
}

const ADULT_TOOLS = ['A general-purpose AI assistant approved by your organisation', 'A spreadsheet tool', 'Your own (anonymised) work examples'];
const ADULT_SAFETY =
  'Never paste personal data, client confidential information or passwords into an AI tool your organisation has not approved. Every AI output that reaches a customer, patient, student, citizen or decision is checked by a named person.';

/** Shuffle-free option helper: correct answer first (the player shuffles nothing, so vary the position). */
function opts(correct: string, wrong: [string, string], pos: 0 | 1 | 2): { options: string[]; answer: number } {
  const o = [...wrong];
  o.splice(pos, 0, correct);
  return { options: o, answer: pos };
}

export function landscapeLesson(ind: Industry): LessonSpec {
  return {
    t: `What AI can and can’t do in ${ind.field}`,
    o: `Explain how generative AI works at a high level and pick ${ind.field} tasks where it helps — and where a human must decide.`,
    min: 30,
    hook: ['word', 'AI predicts likely words — it doesn’t “know” facts', 'how generative AI works'],
    cards: [
      ['🧠', 'How it works', 'Generative AI predicts the most likely next words from patterns in huge amounts of text. That makes it fluent and fast — and sometimes confidently wrong (a “hallucination”).'],
      ...ind.uses.map(([e, t, d]) => [e, t, d] as [string, string, string]),
      ['🧑‍⚖️', 'You stay accountable', `AI drafts, summarises and suggests. In ${ind.field}, people still own decisions, facts and anything that affects a person’s rights, money, health or job.`],
    ],
    acts: [
      {
        sort: `Good fit for an AI first draft, or needs human judgement?`,
        buckets: ['AI draft helps (human reviews)', 'Human judgement / sign-off'],
        items: [...ind.aiFit.slice(0, 4).map((t) => [t, 0] as [string, number]), ...ind.humanCall.slice(0, 3).map((t) => [t, 1] as [string, number])],
        why: 'AI is strong at drafting, summarising and pattern-spotting; people own judgement calls and decisions about individuals.',
      },
      {
        mcq: 'What is a “hallucination” in generative AI?',
        ...opts('A fluent, confident answer that is false or made up', ['A bug that crashes the app', 'When the AI refuses to answer'], 0),
        why: 'Models predict plausible text, so they can invent facts, numbers, names or sources.',
      },
      {
        phase: 'probe',
        mcq: `An AI tool gives you ${ind.factCheck} with no source. What should you do?`,
        ...opts('Verify it against a trusted source before using it', ['Use it — AI tools are trained on lots of data', 'Ask the same AI if it is sure, and use it if it says yes'], 1),
        why: 'Asking the model again isn’t verification. Check primary or official sources.',
      },
      {
        phase: 'probe',
        write: `List two tasks from your own ${ind.field} week where AI could save time, and one where you would not use it. Explain why.`,
        keywords: ['draft', 'summar', 'because', 'decision'],
        exemplar: `AI could draft first versions of routine documents and summarise long notes. I would not let it make the final decision on ${ind.humanCall[0].toLowerCase()}, because that needs context, fairness and accountability.`,
        minWords: 30,
      },
    ],
    teach: {
      explain: `Frame AI as a fast junior assistant: excellent at first drafts and summaries, poor at facts it can’t see and decisions about people. Walk through the ${ind.field} use cases on the cards.`,
      analogy: 'AI is like a very well-read intern who has never worked at your company: helpful, quick, sometimes confidently wrong.',
      vocab: [
        ['generative AI', 'AI that produces new text, images or audio from a prompt.'],
        ['hallucination', 'A confident but false output.'],
        ['human in the loop', 'A person reviews or approves AI output before it is used.'],
      ],
      demo: `Ask an AI assistant for ${ind.factCheck}; then show how to verify it and where it went wrong (or right).`,
      prompts: [
        ['Where could AI save you an hour this week?', 'Drafting, summarising, reformatting, first-pass analysis.'],
        ['What should AI never decide alone here?', ind.humanCall[0]],
      ],
      discuss: `What would go wrong if AI output in ${ind.field} were used without review?`,
      support: 'Give learners the sorted list of tasks and ask them to add one of their own to each column.',
      stretch: 'Explain why a fluent answer is not evidence of a correct answer.',
      mis: [
        ['AI looks things up so it is always correct', 'Most chat assistants generate text from patterns; unless connected to sources, they can invent facts. Verify.'],
        ['AI will replace the whole job', `AI changes tasks inside ${ind.field} work; judgement, relationships and accountability stay with people.`],
      ],
      sheet: `My AI opportunity list: three ${ind.field} tasks, time spent per week, AI role (draft / summarise / analyse), who reviews.`,
      exit: 'Name one task you will try with AI this week and how you will check the output.',
    },
  };
}

export function promptLesson(ind: Industry): LessonSpec {
  const p = ind.prompt;
  return {
    t: `Prompting for ${ind.field} work`,
    o: `Write clear prompts using Role, Context, Task and Format to get useful ${ind.field} drafts.`,
    min: 35,
    hook: ['upgrade', p.bad, p.good],
    cards: [
      ['🎭', 'Role', 'Tell the AI who to act as and who the audience is.'],
      ['📋', 'Context', 'Give the facts it needs — and only the facts it is allowed to see.'],
      ['🎯', 'Task and format', 'Say exactly what to produce, how long, in what structure and tone.'],
      ['🔁', 'Iterate', 'Treat the first answer as a draft: ask for changes, alternatives or a shorter version.'],
    ],
    acts: [
      {
        match: 'Match each part of the strong prompt to its job',
        pairs: [
          [p.role, 'Role'],
          [p.context, 'Context'],
          [p.ask, 'Task'],
          [p.format, 'Format'],
        ],
        why: 'Role, Context, Task, Format turn a vague request into a usable draft.',
      },
      {
        mcq: `Which prompt will give the most useful result for ${p.task}?`,
        ...opts(p.good, [p.bad, `Do ${p.task} really well.`], 2),
        why: 'Specific role, context, task and format beat vague instructions.',
      },
      {
        order: 'Put a good prompting workflow in order',
        steps: ['Decide the outcome you need', 'Write the prompt with Role, Context, Task, Format', 'Read the draft critically', 'Ask for specific improvements', 'Verify facts and finalise yourself'],
        why: 'Prompting is a loop: draft, critique, refine, verify.',
      },
      {
        phase: 'probe',
        write: `Write a Role–Context–Task–Format prompt for: ${p.practice}`,
        keywords: ['act as', 'context', 'write', 'format'],
        exemplar: p.practiceExemplar,
        minWords: 35,
      },
    ],
    teach: {
      explain: 'Most poor AI output comes from vague prompts. Teach the four-part structure, then show iteration: “make it shorter”, “give three options”, “ask me questions first”.',
      analogy: 'Prompting is briefing a new colleague: the clearer the brief, the better the first draft.',
      vocab: [
        ['prompt', 'The instruction you give an AI tool.'],
        ['iteration', 'Refining the output through follow-up prompts.'],
        ['few-shot example', 'A sample of the output you want, included in the prompt.'],
      ],
      demo: `Run the weak and the strong prompt for ${p.task} side by side and compare the outputs.`,
      prompts: [
        ['What is missing from the weak prompt?', 'Role, context, specific task and format.'],
        ['What would you ask next to improve the draft?', 'Shorter, warmer, add options, cite sources, follow our template.'],
      ],
      support: 'Provide a fill-in-the-blanks prompt template.',
      stretch: 'Add a few-shot example and a “ask me clarifying questions first” instruction.',
      mis: [
        ['Longer prompts are always better', 'Clear and specific beats long. Include what matters for the task and nothing confidential.'],
        ['The first answer is the final answer', 'Iterate: critique the draft and ask for targeted changes.'],
      ],
      sheet: 'Prompt template: Act as… / Context: … / Task: … / Format: … / Before answering, ask me up to 3 questions if anything is unclear.',
    },
  };
}

export function privacyLesson(ind: Industry): LessonSpec {
  const v = ind.privacy;
  return {
    t: `Quality checks and data privacy in ${ind.field}`,
    o: `Review AI output systematically and keep personal and confidential ${ind.field} data out of unapproved tools.`,
    min: 35,
    hook: ['upgrade', v.redact, v.redacted],
    cards: [
      ['🔍', 'Review every output', `Check facts and numbers, fit with policy, tone, and fairness before anything leaves your desk.`],
      ['🔐', 'Personal data', 'Names, phone numbers, IDs, health, financial or performance details about real people are personal data.'],
      ['⚖️', 'The rules', v.law],
      ['🧽', 'Anonymise', 'Replace identifying details with roles or placeholders, and use your organisation’s approved AI tools.'],
    ],
    acts: [
      {
        sort: 'Fine for an approved AI tool, or remove/anonymise first?',
        buckets: ['Fine to use', 'Remove or anonymise first'],
        items: [...v.safe.map((t) => [t, 0] as [string, number]), ...v.unsafe.map((t) => [t, 1] as [string, number])],
        why: 'Generic content is fine; identifiable or confidential information needs anonymising or an approved, secure tool.',
      },
      {
        order: 'Put the AI output review checklist in order',
        steps: v.checks,
        why: 'A consistent checklist catches errors before they reach people.',
      },
      {
        phase: 'probe',
        mcq: 'A colleague pasted a full spreadsheet of customer or employee records into a free public chatbot. What is the best first step?',
        ...opts('Stop, report it through your data-protection or IT process, and switch to an approved tool', ['Delete the chat and say nothing', 'It’s fine because the chatbot is popular'], 0),
        why: 'Possible data breaches must be reported quickly through the organisation’s process.',
      },
      {
        phase: 'probe',
        write: `Rewrite this so it is safe to use in an AI tool: “${v.redact}”`,
        keywords: ['[', ']'],
        exemplar: v.redacted,
        minWords: 8,
      },
    ],
    teach: {
      explain: 'Quality and privacy are two habits: review before use, anonymise before paste. Show the checklist and an anonymisation example.',
      analogy: 'Treat a public AI tool like a crowded lift: don’t say anything you wouldn’t want strangers to hear.',
      vocab: [
        ['personal data', 'Information that identifies a person directly or indirectly.'],
        ['anonymise', 'Remove or replace details so a person can’t be identified.'],
        ['approved tool', 'An AI tool your organisation has vetted for security and data handling.'],
      ],
      demo: 'Anonymise a realistic document live, then prompt with the safe version.',
      prompts: [
        ['What makes this text identifiable?', 'Names, IDs, contact details, unique combinations.'],
        ['What do you check before sending AI output?', v.checks.join(' → ')],
      ],
      support: 'Provide a list of common identifiers to search for and replace.',
      stretch: 'Discuss when even anonymised data can be re-identified (small teams, unique roles).',
      mis: [
        ['If I delete the chat the data is gone', 'Data may already be stored or used by the provider. Prevention and approved tools matter.'],
        ['Removing the name is enough', 'Other details (ID numbers, unique job titles, locations) can still identify someone.'],
      ],
      sheet: `Before-you-paste checklist and AI output review checklist for ${ind.field}.`,
    },
  };
}

export function governanceLesson(ind: Industry): LessonSpec {
  return {
    t: `Responsible AI and risk in ${ind.field}`,
    o: `Classify ${ind.field} AI uses by risk and choose controls that keep people safe and the organisation compliant.`,
    min: 40,
    hook: ['word', 'Low risk → light checks · High risk → strong controls', 'risk-based governance'],
    cards: [
      ['📊', 'Risk-based', 'The more an AI use affects a person’s rights, money, health, job or safety, the stronger the controls.'],
      ['🛡️', 'Controls', 'Human approval, testing for bias and accuracy, logging, clear disclosure, and a way to appeal or reach a human.'],
      ['📜', 'Rules that apply', ind.privacy.law],
      ['🗂️', 'Write it down', 'An AI use register lists each use case, its owner, risk level, data used and controls.'],
    ],
    acts: [
      {
        sort: 'Lower-risk or higher-risk AI use?',
        buckets: ['Lower risk', 'Higher risk'],
        items: [...ind.lowRisk.map((t) => [t, 0] as [string, number]), ...ind.highRisk.map((t) => [t, 1] as [string, number])],
        why: 'Risk rises when AI influences decisions about individuals or acts without review.',
      },
      {
        match: 'Match each risk to a control',
        pairs: ind.risks,
        why: 'Each risk needs a specific, owned control.',
      },
      {
        phase: 'probe',
        mcq: 'Who should be accountable for an AI-assisted decision?',
        ...opts('A named person or role in the organisation', ['The AI vendor', 'Nobody — the model decided'], 1),
        why: 'Accountability can’t be delegated to software.',
      },
      {
        phase: 'probe',
        write: `Write three lines of an AI use policy for your ${ind.field} team (what’s allowed, what’s not, who approves).`,
        keywords: ['allowed', 'not', 'approve', 'review'],
        exemplar: ind.policyExemplar,
        minWords: 35,
      },
    ],
    teach: {
      explain: 'Introduce proportional governance: classify use cases, apply controls that match the risk, keep a register, review regularly.',
      analogy: 'Like food safety: a café and a hospital kitchen both follow rules, but the hospital’s are stricter because the stakes are higher.',
      vocab: [
        ['bias', 'Systematically unfair outcomes for some groups.'],
        ['AI use register', 'A list of AI use cases with owners, risks and controls.'],
        ['explainability', 'Being able to give understandable reasons for an outcome.'],
      ],
      demo: 'Fill one row of an AI use register together for a real team use case.',
      prompts: [
        ['What makes this use case high risk?', 'It affects individuals’ rights, money, health, jobs or safety.'],
        ['Which control fits?', 'Human approval, testing, logging, disclosure, appeal route.'],
      ],
      support: 'Provide the register template with example rows.',
      stretch: 'Design a testing plan for bias in one high-risk use case.',
      mis: [
        ['Governance means banning AI', 'Good governance enables safe use by matching controls to risk.'],
        ['The vendor is responsible for outcomes', 'Your organisation remains accountable for how it uses the tool.'],
      ],
      sheet: 'AI use register: use case · owner · data · risk level · controls · review date.',
    },
  };
}

export function pilotLesson(ind: Industry): LessonSpec {
  const p = ind.pilot;
  const minsSaved = (p.before - p.after) * p.perWeek * p.people;
  const hoursPerMonth = Math.round((minsSaved * 4) / 60);
  // Distractors: total time today (forgot to subtract) and one week's saving (forgot ×4).
  const nums = [hoursPerMonth];
  for (const n of [Math.round((p.before * p.perWeek * p.people * 4) / 60), Math.round(minsSaved / 60), hoursPerMonth * 2, hoursPerMonth + 9]) if (!nums.includes(n) && nums.length < 3) nums.push(n);
  return {
    t: `Capstone: leading an AI pilot in ${ind.field}`,
    o: `Plan, measure and scale an AI pilot in ${ind.field} with a clear metric, baseline and decision rule.`,
    min: 45,
    hook: ['word', 'Pick one task · Measure before · Pilot · Decide', 'pilot playbook'],
    cards: [
      ['🎯', 'Choose well', 'Pick a frequent, low-to-medium risk task with clear value — not the flashiest demo.'],
      ['📏', 'Baseline first', 'Measure time, quality and errors today, so you can prove the difference.'],
      ['🧪', 'Pilot small', 'A few people, a few weeks, with review steps and feedback.'],
      ['📈', 'Decide and scale', 'Scale, adjust or stop based on the metric and on quality — then train people and update the AI register.'],
    ],
    acts: [
      {
        order: 'Put the pilot steps in order',
        steps: ['Pick one high-value, lower-risk task', 'Measure the baseline', 'Run a small pilot with human review', 'Compare results with the baseline', 'Scale, adjust or stop'],
        why: 'Measure before and after, or you can’t prove value.',
      },
      {
        mcq: `Pilot: ${p.task} takes ${p.before} min today and ${p.after} min with AI plus review. ${p.people} people each do it ${p.perWeek} times a week. Roughly how many hours are saved per month (4 weeks)?`,
        options: nums.map((n) => `${n} hours`),
        answer: 0,
        why: `(${p.before} − ${p.after}) × ${p.perWeek} × ${p.people} = ${minsSaved} minutes a week; × 4 ÷ 60 ≈ ${hoursPerMonth} hours.`,
      },
      {
        phase: 'probe',
        mcq: 'Time saved went up, but errors also went up. What should you do?',
        ...opts(`Pause scaling, fix the review step or prompts, and re-measure ${p.quality}`, ['Scale immediately — time is what matters', 'Stop measuring quality'], 0),
        why: 'Speed without quality destroys trust. Track both.',
      },
      {
        phase: 'probe',
        write: `Write a one-paragraph pilot plan for: ${p.useCase}. Include the metric, baseline, who reviews, and your decision rule.`,
        keywords: ['baseline', 'metric', 'review', 'weeks', 'scale'],
        exemplar: p.exemplar,
        minWords: 50,
      },
    ],
    teach: {
      explain: 'Most AI pilots fail from vague goals and no baseline. Coach learners to choose a frequent, measurable task and agree the decision rule before starting.',
      analogy: 'A pilot is a clinical trial for a workflow: small, measured, honest about results.',
      vocab: [
        ['baseline', 'The measurement before the change.'],
        ['decision rule', 'The agreed result that means scale, adjust or stop.'],
        ['change management', 'Helping people adopt a new way of working.'],
      ],
      demo: `Build the ROI calculation for ${p.task} in a spreadsheet live.`,
      prompts: [
        ['What will you measure besides time?', p.quality],
        ['What would make you stop the pilot?', 'Quality or risk gets worse, or users don’t adopt it.'],
      ],
      discuss: 'What will people worry about when AI arrives in their workflow, and how will you address it?',
      support: 'Provide a one-page pilot canvas.',
      stretch: 'Add cost (licences, training, review time) and compute payback.',
      mis: [
        ['A great demo proves value', 'Only measured results against a baseline prove value.'],
        ['Time saved is the only metric', `Track quality (${p.quality}) and adoption too.`],
      ],
      sheet: 'Pilot canvas: task · baseline · metric · reviewers · duration · decision rule · risks · training.',
      exit: 'Present your pilot plan in two minutes to a peer and ask for one challenge.',
    },
  };
}

/** Builds the three courses of an industry track. */
export function proTrack(ind: Industry): CourseSpec[] {
  const base = {
    subject: ind.subject,
    band: 'Adult' as const,
    theme: ind.theme,
    tutor: ind.tutor,
    tools: ind.tools || ADULT_TOOLS,
    safety: ADULT_SAFETY,
    style: 'Practical workshop: short explanation, real workplace examples, hands-on practice, and a review step every time.',
    outOfScope: ['personal legal advice', 'personal medical advice', 'personal investment advice'],
  };
  return [
    {
      ...base,
      level: 'Beginner',
      title: ind.beginner.title,
      description: ind.beginner.description,
      intro: `Start using AI safely and productively in ${ind.field} — no technical background needed.`,
      outcomes: [
        `Explains what generative AI can and can’t do in ${ind.field}`,
        'Writes clear Role–Context–Task–Format prompts',
        ...ind.beginner.lessons.map((l) => l.o.replace(/\.$/, '')),
      ],
      modules: [
        { title: 'Module 1: AI basics for your role', lessons: [landscapeLesson(ind), promptLesson(ind)] },
        { title: 'Module 2: Quick wins', lessons: ind.beginner.lessons },
      ],
    },
    {
      ...base,
      level: 'Intermediate',
      title: ind.intermediate.title,
      description: ind.intermediate.description,
      intro: `Turn one-off prompts into reliable ${ind.field} workflows you can trust and repeat.`,
      prereq: [ind.beginner.title],
      outcomes: [...ind.intermediate.lessons.map((l) => l.o.replace(/\.$/, '')), 'Reviews AI output and protects personal data'],
      modules: [
        { title: 'Module 1: Core workflows', lessons: [ind.intermediate.lessons[0], ind.intermediate.lessons[1]] },
        { title: 'Module 2: Quality, privacy and insight', lessons: [privacyLesson(ind), ind.intermediate.lessons[2]] },
      ],
    },
    {
      ...base,
      level: 'Advanced',
      title: ind.advanced.title,
      description: ind.advanced.description,
      intro: `Automate, govern and lead AI adoption in ${ind.field}.`,
      prereq: [ind.intermediate.title],
      outcomes: [...ind.advanced.lessons.map((l) => l.o.replace(/\.$/, '')), 'Applies risk-based governance', 'Plans and measures an AI pilot'],
      modules: [
        { title: 'Module 1: Automation and advanced use', lessons: ind.advanced.lessons },
        { title: 'Module 2: Governance and leadership', lessons: [governanceLesson(ind), pilotLesson(ind)] },
      ],
    },
  ];
}
