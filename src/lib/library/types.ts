// Compact authoring format for the Kitabash course library.
//
// Each course is written as a small, readable spec; `expand.ts` turns it into the full
// lesson structure (Learn cards, 3-second hook, Perform + Probe activities, the teacher's
// six-tab resource panel, rubric, knowledge guide and tutor configuration).
// Writing courses this way keeps hundreds of lessons consistent and reviewable.

export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type Band = 'K-2' | '3-5' | '6-8' | '9-12' | 'Adult';
export type Phase = 'perform' | 'probe';
export type Theme = 'sunrise' | 'meadow' | 'ocean' | 'grape';

/** 3-second visual hook shorthand. */
export type HookSpec =
  | ['word', string, string] // word-reveal: word, tagline
  | ['pattern', (number | string)[], number | string] // pattern-reveal: sequence, next
  | ['code', string, string] // code-output: code, output
  | ['phrase', string, string[]] // phrase-model: phrase, stressed words
  | ['upgrade', string, string] // speech-upgrade: before, after
  | ['budget', number, number, string] // budget-change: budget, expense, label (₹)
  | ['letter', string, string]; // letter-trace: glyph key (see glyphs.ts), caption

/** Activity shorthand. Correct answers are given by index / order so they are easy to review. */
export type ActSpec =
  | { mcq: string; options: string[]; answer: number; why: string; phase?: Phase; hint?: string; title?: string; wrong?: Record<number, string> }
  | { code: string; ask: string; options: string[]; answer: number; why: string; phase?: Phase; hint?: string; title?: string; lang?: string }
  | { sort: string; buckets: [string, string] | [string, string, string] | [string, string, string, string]; items: [string, number][]; why: string; phase?: Phase; hint?: string }
  | { order: string; steps: string[]; why: string; phase?: Phase; hint?: string; title?: string }
  | { match: string; pairs: [string, string][]; why: string; phase?: Phase; hint?: string }
  | { blanks: string; answers: string[][]; bank?: string[]; why: string; phase?: Phase; hint?: string; title?: string }
  | { write: string; keywords: string[]; exemplar: string; starters?: string[]; minWords?: number; phase?: Phase; title?: string }
  | { speak: string; checklist: string[]; tips?: string; phase?: Phase; title?: string }
  | { trace: string; glyph: string; phase?: Phase; hint?: string; title?: string }; // tracing over a glyph from glyphs.ts

export interface TeachSpec {
  explain: string; // teacher explanation (Teach tab)
  analogy: string;
  vocab: [string, string][];
  demo: string; // Show tab: live demo / board work
  prompts: [string, string][]; // Facilitate: question, expected answer
  discuss?: string;
  support: string; // differentiation
  stretch: string;
  mis: [string, string][]; // misconception, fix
  sheet: string; // printable worksheet / template body
  exit?: string; // exit ticket
  extension?: string;
}

export interface LessonSpec {
  t: string; // title
  o: string; // objective (one sentence, learner-facing)
  min?: number; // minutes (default 30)
  hook: HookSpec;
  cards: [string, string, string][]; // emoji, title, body
  acts: ActSpec[]; // at least one perform; at least one probe
  teach: TeachSpec;
}

export interface CourseSpec {
  subject: string; // must match a catalogue subject name
  band: Band; // K-12 grade band, or 'Adult' for professional courses
  level: Level; // level within the band
  title: string;
  description: string;
  ages?: [number, number]; // defaults to the band's ages
  grade?: string; // defaults to the band's grade label
  intro: string; // student-facing welcome line
  theme: Theme;
  tutor: [string, string]; // tutor name, purpose
  style: string; // teaching style
  outcomes: string[];
  prereq?: string[];
  tools?: string[];
  safety?: string;
  notes?: string; // instructor notes
  modules: { title: string; summary?: string; lessons: LessonSpec[] }[];
  outOfScope?: string[];
  tutorMis?: [string, string][]; // extra tutor misconception triggers
  /** Board / exam pathway this course is designed to support. Always installed as UNVERIFIED. */
  pathway?: { board: string; grade: string; subject: string; topics: string[] };
}
