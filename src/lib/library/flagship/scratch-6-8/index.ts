// Flagship course: Scratch Code Foundations (Grades 6–8, Beginner).
import type { FlagshipCourse } from '../types.ts';
import { G1, G2, G3 } from './m1.ts';
import { G4, G5, G6 } from './m2.ts';
import { G7, G8, G9 } from './m3.ts';
import { G10, G11, G12 } from './m4.ts';

export const SCRATCH_6_8_BEGINNER: FlagshipCourse = {
  key: 'scratch--6-8--beginner@2',
  replaces: 'scratch--6-8--beginner',
  subject: 'Scratch',
  band: '6-8',
  level: 'Beginner',
  title: 'Code Foundations',
  tagline: 'Algorithms, loops, logic and game loops — the big ideas of programming, built in Scratch.',
  description:
    'A fast-paced first course for middle-school learners. Each module teaches a core computer-science idea — algorithms and events, iteration, variables and Boolean logic, and the game loop — through Code Lab challenges and a real project (Interactive Poster, Generative Art, Smart Assistant App, and an original Arcade Game capstone). Every lesson links the Scratch blocks to the equivalent Python, so learners are ready for text-based code. Each lesson has a video, a build-along, auto-checked Code Lab challenges, a worksheet and a teacher lesson plan.',
  intro: 'Learn the big ideas of programming — fast — and build things you’re proud of.',
  theme: 'meadow',
  ages: [11, 14],
  grade: 'Grades 6–8',
  tutor: ['Byte', 'A calm, encouraging coding mentor who helps middle-schoolers reason about their code, debug methodically and connect blocks to text-based languages — with questions and hints rather than answers.'],
  tools: ['Laptop or Chromebook with a modern browser and a keyboard', 'The built-in Kitabash Code Lab (no account needed)', 'Optional: Scratch (scratch.mit.edu)'],
  outcomes: [
    'Write, trace and debug precise algorithms',
    'Build event-driven programs with parallel scripts and broadcasts',
    'Use counted and forever loops, including nested loops',
    'Generalise solutions with variables and operators (e.g. any polygon)',
    'Handle user input and build messages with join',
    'Make decisions with if-else chains and Boolean logic (AND, OR, NOT)',
    'Test programs with normal, boundary and invalid inputs',
    'Build a game loop with collisions, state variables, timers and difficulty',
    'Read simple Python equivalents of Scratch code',
    'Design, build, playtest and present an original game',
  ],
  prereq: ['None — this course starts from the beginning, at a pace suited to ages 11–14'],
  style: 'Concept-first: a short video and a “why it matters” idea, a build-along, auto-checked Code Lab challenges, then a project. Every lesson shows the Python equivalent to bridge to text code.',
  notes: 'Lessons are 45 minutes (projects 50; capstone 2 × 45). Code Lab challenges are checked automatically; projects arrive in your review queue with the learner’s program and the rubric. Python snippets are for reading only — no Python setup is needed.',
  safety: 'Apps and games never ask for real personal information (full names, addresses, school or passwords). Sharing to scratch.mit.edu is optional and needs a parent-approved account for under-13s. Learners under 18 use the AI tutor only with guardian consent.',
  nextCourse: 'Scratch (Gr 6–8) Intermediate',
  modules: [
    { title: 'Module 1 · Algorithms and events', summary: 'Precise instructions, debugging, and event-driven programs. Project: Interactive Poster.', bigQuestion: 'How do we tell a computer exactly what to do — and when?', lessons: [G1, G2, G3] },
    { title: 'Module 2 · Iteration', summary: 'Counted and forever loops, polygons, conditions in loops and nested loops. Project: Generative Art.', bigQuestion: 'How do loops give computers their power?', lessons: [G4, G5, G6] },
    { title: 'Module 3 · Data and decisions', summary: 'Variables, input, operators, if-else chains and Boolean logic. Project: Smart Assistant App.', bigQuestion: 'How do programs remember and decide?', lessons: [G7, G8, G9] },
    { title: 'Module 4 · Game engineering', summary: 'The game loop, collisions, timers and difficulty, then a capstone arcade game.', bigQuestion: 'What makes a game work — and feel fair?', lessons: [G10, G11, G12] },
  ],
};
