// Flagship course: Scratch Data & Simulations (Grades 6–8, Intermediate).
import type { FlagshipCourse } from '../types.ts';
import { H1, H2, H3 } from './m1.ts';
import { H4, H5, H6 } from './m2.ts';
import { H7, H8, H9 } from './m3.ts';
import { H10, H11, H12 } from './m4.ts';

export const SCRATCH_6_8_INTERMEDIATE: FlagshipCourse = {
  key: 'scratch--6-8--intermediate@2',
  replaces: 'scratch--6-8--intermediate',
  subject: 'Scratch',
  band: '6-8',
  level: 'Intermediate',
  title: 'Data & Simulations',
  tagline: 'Lists, procedures, models and robust apps — think like a software engineer and a scientist.',
  description:
    'The second middle-school Scratch course. Learners store and analyse data with lists (traversal, totals, averages, maximum and minimum), organise code with procedures, decomposition and refactoring, model the world with random simulations and agent-based models, and build robust data-driven apps with validation and menus. Projects: Survey Analyser, Procedural City, My Simulation and a capstone Data App. Every lesson links to the equivalent Python and includes a video, build-along, auto-checked Code Lab challenges, a worksheet and a teacher lesson plan.',
  intro: 'Level up: real data, reusable code and simulations of the real world.',
  theme: 'meadow',
  ages: [11, 14],
  grade: 'Grades 6–8',
  tutor: ['Byte', 'A calm, encouraging coding mentor who helps middle-schoolers reason about data, procedures and simulations, debug methodically and connect blocks to Python — with questions and hints rather than answers.'],
  tools: ['Laptop or Chromebook with a modern browser and a keyboard', 'The built-in Kitabash Code Lab (no account needed)', 'Optional: Scratch (scratch.mit.edu)'],
  outcomes: [
    'Store data in lists and traverse them with an index variable',
    'Calculate totals, counts, averages, maximums and minimums',
    'Collect and analyse survey data responsibly',
    'Define procedures with parameters and explain parameter vs argument',
    'Decompose problems and refactor repeated code',
    'Simulate random events and explain the law of large numbers',
    'Build step-by-step and agent-based models and question their assumptions',
    'Design data-driven programs with parallel lists',
    'Validate input and build menus that handle every choice',
    'Read the Python equivalents of lists, functions and loops',
  ],
  prereq: ['Scratch (Gr 6–8) Beginner: Code Foundations, or confident use of loops, variables, if-else and the game loop'],
  style: 'Problem-based: each lesson poses a real problem (data, design or science), builds the idea in a Code Lab challenge, and links it to Python. Each module ends with an open project.',
  notes: 'Lessons are 45 minutes (projects 50; capstone 2 × 45). Code Lab challenges are checked automatically, including with sample inputs; projects arrive in your review queue with the learner’s program and the rubric.',
  safety: 'Surveys collect anonymous, non-sensitive answers only — never names with personal data. Sharing to scratch.mit.edu is optional and needs a parent-approved account for under-13s. Learners under 18 use the AI tutor only with guardian consent.',
  nextCourse: 'Scratch (Gr 6–8) Advanced',
  modules: [
    { title: 'Module 1 · Lists and data', summary: 'Traversal, accumulators, averages and extremes. Project: Survey Analyser.', bigQuestion: 'How do programs turn raw data into insight?', lessons: [H1, H2, H3] },
    { title: 'Module 2 · Procedures and design', summary: 'Parameters, decomposition, abstraction and refactoring. Project: Procedural City.', bigQuestion: 'How do engineers keep big programs manageable?', lessons: [H4, H5, H6] },
    { title: 'Module 3 · Simulations', summary: 'Probability, random walks, models and agents. Project: My Simulation.', bigQuestion: 'How can code help us understand the real world?', lessons: [H7, H8, H9] },
    { title: 'Module 4 · Data-driven apps', summary: 'Quiz engines with parallel lists, validation and menus, then a capstone Data App.', bigQuestion: 'What makes an app robust and useful?', lessons: [H10, H11, H12] },
  ],
};
