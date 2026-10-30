import type { PyCheck } from '../../python/checks.ts';
// Flagship courses: full lessons with an explainer video, build-along steps in a real tool,
// block-coding puzzles, projects, lesson plans, worksheets, project briefs and rubrics.
import type { Goals, Program, World, Op, Cond } from '../../scratch/puzzle.ts';
import type { ActSpec, HookSpec } from '../types.ts';
import type { Band, Theme } from '../types.ts';
import type { LabAct } from './scratch-3-5/lab.ts';
export type { LabAct };

/** One scene of a lesson video. `say` lines become the captions (and the read-aloud narration). */
export type Scene =
  | { kind: 'title'; title: string; subtitle?: string; say: string[] }
  | { kind: 'bullets'; heading: string; bullets: { icon: string; text: string }[]; say: string[] }
  | { kind: 'blocks'; heading: string; blocks: string; note?: string; say: string[] }
  | { kind: 'stage'; heading: string; world: World; program: Program; say: string[]; note?: string }
  | { kind: 'compare'; heading: string; left: { label: string; blocks: string; good: boolean }; right: { label: string; blocks: string; good: boolean }; say: string[] }
  | { kind: 'tour'; heading: string; say: string[] } // labelled Scratch editor layout
  | { kind: 'recap'; heading: string; points: string[]; say: string[] }
  | { kind: 'card'; heading: string; emoji: string; body: string; say: string[] }
  | { kind: 'code'; heading: string; code: string; lang?: string; output?: string; say: string[] };

export type PuzzleAct = {
  puzzle: string; // title
  goalText: string;
  world: World;
  palette: Op[];
  conds?: Cond[];
  hats?: ('flag' | 'key')[];
  start?: Program;
  lock?: Partial<Record<Op, number>>;
  goals: Goals;
  solution: Program;
  explain: string; // shown when solved
  hints: string[];
  phase?: 'perform' | 'probe';
  points?: number;
};

export type BlocksMcq = {
  bmcq: string; // question
  blocks?: string; // script shown with the question
  options: (string | { text: string; blocks: string })[];
  answer: number;
  why: string;
  wrong?: Record<number, string>;
  hint?: string;
  title?: string;
  phase?: 'perform' | 'probe';
};

export type BlocksOrder = {
  border: string; // prompt
  steps: { text: string; blocks: string }[]; // in the correct order
  why: string;
  hint?: string;
  title?: string;
  phase?: 'perform' | 'probe';
};

export type ProjectAct = {
  projectAct: true;
  title: string;
  brief: string;
  requirements: string[];
  reflection: string;
  tips: string[];
  minWords?: number;
};

/** A Python Lab activity: write real Python, run it, auto-checked on the server. */
export type PyAct = {
  py: string; // the task
  title: string;
  mode?: 'challenge' | 'project';
  starter: string;
  goals: [string, PyCheck][];
  inputs?: string[]; // sample inputs (used by checks that give none)
  solution: string;
  explain: string;
  hints: string[];
  reflection?: string;
  requirements?: string[];
  minWords?: number;
  phase?: 'perform' | 'probe';
  points?: number;
};

export type FAct = ActSpec | PuzzleAct | BlocksMcq | BlocksOrder | ProjectAct | LabAct | PyAct;

export interface WorksheetTask {
  heading: string;
  instructions: string;
  blocks?: string; // script printed with the task
  grid?: { world: World; label?: string }; // printed stage grid to draw on
  lines?: number; // answer lines
  items?: string[]; // numbered sub-questions or a word bank
  answer: string; // for the teacher's answer key
}

export interface FlagshipLesson {
  key: string;
  title: string;
  objective: string;
  concept: string;
  minutes: number;
  hook: HookSpec;
  video: { title: string; scenes: Scene[] };
  cards: { emoji: string; title: string; body: string; blocks?: string }[];
  build?: { title: string; intro: string; steps: { title: string; text: string; blocks?: string; tip?: string }[] };
  acts: FAct[];
  teacher: {
    explain: string;
    analogy: string;
    vocab: [string, string][];
    demo: string;
    unplugged: string; // a no-computer warm-up
    prompts: [string, string][];
    support: string;
    stretch: string;
    mis: [string, string][];
    plan: { minutes: number; stage: string; doing: string }[];
    successCriteria: string[];
    homework: string;
    exit: string;
  };
  worksheet: { title: string; intro: string; tasks: WorksheetTask[] };
  project?: {
    title: string;
    brief: string;
    requirements: string[];
    milestones: string[];
    rubric: { criterion: string; levels: [string, string, string, string] }[];
    extensions: string[];
  };
}

export interface FlagshipCourse {
  key: string; // stable install key
  replaces?: string; // spec key of the older library course this one replaces
  subject: string;
  band: Band;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
  tagline: string;
  description: string;
  intro: string;
  theme: Theme;
  ages: [number, number];
  grade: string;
  tutor: [string, string];
  tools: string[];
  outcomes: string[];
  prereq: string[];
  style: string;
  notes: string;
  safety: string;
  nextCourse: string;
  modules: { title: string; summary: string; bigQuestion: string; lessons: FlagshipLesson[] }[];
}
