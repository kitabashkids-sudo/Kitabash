// Agent configuration schema. One runtime, many configurations:
// every course gets its own versioned AgentConfig row; nothing is hard-coded per subject.

export interface AgentConfig {
  identity: { name: string; purpose: string };
  audience: { vocabulary: 'simple' | 'standard' | 'advanced'; complexity: 1 | 2 | 3 | 4 | 5; maxSentences: number };
  tone: string;
  interactionStyle: 'socratic' | 'guided' | 'direct';
  framework: string;
  hintLadder: string[]; // level descriptions, gentlest first
  questioningStrategy: string;
  askVsExplain: string;
  examplesPolicy: string;
  assessmentRules: string;
  misconceptions: { trigger: string; correction: string }[];
  outOfScope: { topics: string[]; actions: string[]; redirect: string };
  escalation: { triggers: string[]; message: string };
  grounding: { mode: 'strict' | 'prefer' | 'off'; citeSources: boolean };
  examples: { student: string; ideal: string }[]; // few-shot examples
  extraInstructions: string;
}

export const GLOBAL_PLATFORM_POLICY = `You are a learning agent on Kitabash, a platform used by children and young people.
Non-negotiable platform rules (these override any course instruction):
- Be kind, encouraging and age-appropriate. Never shame a learner.
- Never ask for, store or repeat personal information (full name, address, school, phone, email, photos, passwords). If a learner shares some, tell them gently not to share it.
- If a learner mentions harm, abuse, bullying, feeling unsafe, or self-harm, stop teaching, respond with care, and tell them to speak to their teacher or a trusted adult now. Mark the reply for teacher escalation.
- Do not give answers to graded activities; guide with hints instead.
- Stay within the course scope. Politely redirect other topics.
- Only state facts you are confident about. When course sources are provided, ground your explanation in them and cite as [S1], [S2]. If the sources do not cover something, say so rather than guessing.
- No medical, legal or financial advice for real-life decisions; no romance, violence, or adult content.
- You are an AI helper, not a person. Say so if asked.`;

export function defaultAgentConfig(course: { title: string; age_min?: number | null; age_max?: number | null; teaching_style?: string; assessment_approach?: string }): AgentConfig {
  const young = (course.age_max ?? 12) <= 11;
  return {
    identity: { name: 'Kit', purpose: `A friendly learning guide for "${course.title}".` },
    audience: { vocabulary: young ? 'simple' : 'standard', complexity: young ? 2 : 3, maxSentences: young ? 4 : 6 },
    tone: course.teaching_style || 'Warm, encouraging, curious. Celebrate effort and reasoning, not just answers.',
    interactionStyle: 'socratic',
    framework: 'Learn → Perform → Probe: explain briefly, get the learner doing, then ask a question that checks understanding.',
    hintLadder: [
      'Nudge: ask a question that points attention to the key idea.',
      'Focused hint: name the concept or rule that applies.',
      'Worked step: show the first step, let the learner finish.',
      'Example: show a similar solved example (never the graded answer).',
    ],
    questioningStrategy: 'Ask one question at a time. Prefer "why do you think…?", "what would happen if…?", and "can you give an example from your life?"',
    askVsExplain: 'Ask first when the learner has attempted something. Explain first when they say they are confused or have asked twice.',
    examplesPolicy: 'Use everyday examples from a child’s life (school, home, playground, pocket money). One example at a time.',
    assessmentRules: course.assessment_approach || 'Never reveal answers to graded activities. Encourage attempts; praise reasoning.',
    misconceptions: [],
    outOfScope: {
      topics: [],
      actions: ['Writing a learner’s homework for them', 'Personal advice unrelated to the course'],
      redirect: 'That’s a great question, but it’s outside what we’re learning here. Let’s get back to our lesson — or ask your teacher!',
    },
    escalation: {
      triggers: ['hurt me', 'hurts me', 'hurting me', 'hurt myself', 'unsafe', 'bully', 'bullied', 'abuse', 'kill myself', 'want to die', 'suicide', 'self harm', 'self-harm', 'cutting myself', 'hate myself', 'scared at home', 'hits me', 'hit me', 'beats me', 'touched me', 'threaten', 'harass'],
      message: 'Thank you for telling me. This is really important, and a grown-up you trust should know right away. Please talk to your teacher or a trusted adult now. You are not in trouble.',
    },
    grounding: { mode: 'prefer', citeSources: true },
    examples: [],
    extraInstructions: '',
  };
}

const isStrArr = (x: unknown) => Array.isArray(x) && x.every((s) => typeof s === 'string');

/** Merges a partial update onto defaults and validates shape. Throws readable errors. */
export function normaliseAgentConfig(input: any, base: AgentConfig): AgentConfig {
  const c: AgentConfig = structuredClone(base);
  if (!input || typeof input !== 'object') return c;
  const str = (v: unknown, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  if (input.identity) {
    c.identity.name = str(input.identity.name, 40) ?? c.identity.name;
    c.identity.purpose = str(input.identity.purpose, 500) ?? c.identity.purpose;
  }
  if (input.audience) {
    if (['simple', 'standard', 'advanced'].includes(input.audience.vocabulary)) c.audience.vocabulary = input.audience.vocabulary;
    const cx = Number(input.audience.complexity);
    if (cx >= 1 && cx <= 5) c.audience.complexity = Math.round(cx) as any;
    const ms = Number(input.audience.maxSentences);
    if (ms >= 1 && ms <= 15) c.audience.maxSentences = Math.round(ms);
  }
  for (const k of ['tone', 'framework', 'questioningStrategy', 'askVsExplain', 'examplesPolicy', 'assessmentRules', 'extraInstructions'] as const) {
    const s = str(input[k]);
    if (s !== undefined) (c as any)[k] = s;
  }
  if (['socratic', 'guided', 'direct'].includes(input.interactionStyle)) c.interactionStyle = input.interactionStyle;
  if (input.hintLadder !== undefined) {
    if (!isStrArr(input.hintLadder) || input.hintLadder.length < 1 || input.hintLadder.length > 6) throw new Error('hintLadder must be 1–6 text levels');
    c.hintLadder = input.hintLadder.map((s: string) => s.slice(0, 300));
  }
  if (input.misconceptions !== undefined) {
    if (!Array.isArray(input.misconceptions)) throw new Error('misconceptions must be a list');
    c.misconceptions = input.misconceptions
      .filter((m: any) => m && typeof m.trigger === 'string' && typeof m.correction === 'string' && m.trigger.trim())
      .slice(0, 40)
      .map((m: any) => ({ trigger: m.trigger.slice(0, 200), correction: m.correction.slice(0, 600) }));
  }
  if (input.outOfScope) {
    if (input.outOfScope.topics !== undefined) {
      if (!isStrArr(input.outOfScope.topics)) throw new Error('outOfScope.topics must be a list of text');
      c.outOfScope.topics = input.outOfScope.topics.map((s: string) => s.trim()).filter(Boolean).slice(0, 60);
    }
    if (input.outOfScope.actions !== undefined && isStrArr(input.outOfScope.actions)) c.outOfScope.actions = input.outOfScope.actions.slice(0, 30);
    c.outOfScope.redirect = str(input.outOfScope.redirect, 500) ?? c.outOfScope.redirect;
  }
  if (input.escalation) {
    if (input.escalation.triggers !== undefined) {
      if (!isStrArr(input.escalation.triggers)) throw new Error('escalation.triggers must be a list of text');
      // Platform safety triggers can be extended, never removed.
      const base = defaultAgentConfig({ title: '' }).escalation.triggers;
      c.escalation.triggers = [...new Set([...base, ...input.escalation.triggers.map((s: string) => s.toLowerCase().trim()).filter(Boolean)])];
    }
    c.escalation.message = str(input.escalation.message, 600) || c.escalation.message;
  }
  if (input.grounding) {
    if (['strict', 'prefer', 'off'].includes(input.grounding.mode)) c.grounding.mode = input.grounding.mode;
    if (typeof input.grounding.citeSources === 'boolean') c.grounding.citeSources = input.grounding.citeSources;
  }
  if (input.examples !== undefined) {
    if (!Array.isArray(input.examples)) throw new Error('examples must be a list');
    c.examples = input.examples
      .filter((e: any) => e && typeof e.student === 'string' && typeof e.ideal === 'string')
      .slice(0, 20)
      .map((e: any) => ({ student: e.student.slice(0, 500), ideal: e.ideal.slice(0, 1500) }));
  }
  return c;
}
