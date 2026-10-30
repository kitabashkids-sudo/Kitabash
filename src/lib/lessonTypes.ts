// Shared lesson content shapes (used by server and client).

export interface LearnCard {
  title?: string;
  body: string;
  emoji?: string;
  sourceRef?: string; // "Resource title · page 3"
  blocks?: string; // Scratch-style blocks (src/lib/scratch/blocks.ts syntax)
}

/** Explainer video shown at the start of the Learn phase. Captions live on the asset. */
export interface LessonVideo {
  assetId: string;
  title: string;
  durationSec?: number;
}

/** Follow-along steps the learner does in a real tool (e.g. Scratch) alongside the lesson. */
export interface BuildAlong {
  title: string;
  intro?: string;
  tool?: { name: string; url: string };
  steps: { title: string; text: string; blocks?: string; tip?: string }[];
}

export interface Download {
  title: string;
  resourceId: string;
  kind: 'worksheet' | 'project-brief' | 'guide' | 'lesson-plan' | 'rubric' | 'answers' | 'slides';
}

export interface LearnContent {
  cards: LearnCard[];
  video?: LessonVideo;
  build?: BuildAlong;
  downloads?: Download[]; // student-facing files
  worksheet?: { title: string; task: string }; // printable worksheet task (the page itself is generated from the activities)
}

export type HookPreset = 'word-reveal' | 'letter-trace' | 'pattern-reveal' | 'budget-change' | 'code-output' | 'phrase-model' | 'speech-upgrade';

export interface VisualHook {
  kind?: 'preset' | 'video' | 'svg' | 'image' | 'none';
  preset?: HookPreset;
  params?: Record<string, any>;
  assetId?: string; // from the asset library (video/svg/image)
  caption?: string; // always shown; also the text alternative
  alt?: string; // longer description for screen readers
  objective?: string;
  durationMs?: number; // ~3000
}

export interface TeacherContent {
  teach?: { explanation?: string; analogies?: string[]; vocabulary?: { term: string; definition: string }[] };
  show?: { items?: { title: string; kind: 'hook' | 'asset' | 'diagram' | 'example' | 'demo'; assetId?: string; description?: string }[] };
  facilitate?: {
    prompts?: { prompt: string; expected?: string }[];
    discussion?: string[];
    differentiation?: { support?: string; stretch?: string };
    timing?: string;
  };
  resources?: { items?: { title: string; kind: 'worksheet' | 'template' | 'link' | 'sample' | 'note'; url?: string; body?: string }[] };
  assess?: { questions?: string[]; rubric?: { criterion: string; levels: string[] }[]; misconceptions?: { misconception: string; fix: string }[] };
  extension?: string[];
  downloads?: Download[]; // teacher-only files (lesson plan, rubric, answer key)
  plan?: { minutes: number; stage: string; doing: string }[]; // timed lesson plan
}

export const HOOK_PRESETS: { id: HookPreset; label: string; params: string }[] = [
  { id: 'word-reveal', label: 'Key word reveal', params: '{ "word": "Needs", "tagline": "things we must have" }' },
  { id: 'letter-trace', label: 'Letter being formed', params: '{ "letter": "a" }' },
  { id: 'pattern-reveal', label: 'Pattern reveals next value', params: '{ "sequence": [2,4,6,8], "next": 10 }' },
  { id: 'budget-change', label: 'Budget changes when an expense is added', params: '{ "budget": 100, "expense": 30, "label": "Bus fare", "currency": "₹" }' },
  { id: 'code-output', label: 'Code produces output', params: '{ "code": "print(2 + 3)", "output": "5" }' },
  { id: 'phrase-model', label: 'Spoken phrase modelled', params: '{ "phrase": "Could you help me, please?", "stress": ["help"] }' },
  { id: 'speech-upgrade', label: 'Speech opening becomes more compelling', params: '{ "before": "Today I will talk about water.", "after": "Imagine turning on the tap… and nothing comes out." }' },
];
