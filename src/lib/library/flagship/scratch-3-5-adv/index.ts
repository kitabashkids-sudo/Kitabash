// Flagship course: Scratch Arcade Engineers (Grades 3–5, Advanced).
import type { FlagshipCourse } from '../types.ts';
import { A1, A2, A3 } from './m1.ts';
import { A4, A5, A6 } from './m2.ts';
import { A7, A8, A9 } from './m3.ts';
import { A10, A11, A12 } from './m4.ts';

export const SCRATCH_3_5_ADVANCED: FlagshipCourse = {
  key: 'scratch--3-5--advanced@2',
  replaces: 'scratch--3-5--advanced',
  subject: 'Scratch',
  band: '3-5',
  level: 'Advanced',
  title: 'Arcade Engineers',
  tagline: 'Clones, gravity, lists and your own blocks — engineer real arcade games.',
  description:
    'The third course in the Scratch pathway. Learners engineer arcade games with the techniques real game makers use: clones for many enemies and items, velocity and gravity for jumping, lists for words, inventories and passwords, custom blocks with inputs, and game states with menus and levels. Three projects (Starfall Catcher, Jumpy Platformer, Guess the Animal) and a capstone original game. Every lesson has a video, a build-along, Code Lab challenges checked automatically, a worksheet and a teacher lesson plan.',
  intro: 'Welcome, arcade engineer! You’ll learn the tricks behind real games — and then build your own.',
  theme: 'sunrise',
  ages: [9, 11],
  grade: 'Grades 3–5',
  tutor: ['Pip', 'A friendly robot coding coach who helps young game makers plan, debug and improve their Scratch games with hints rather than answers.'],
  tools: ['Laptop or Chromebook with a modern browser (a keyboard helps for games)', 'The built-in Kitabash Code Lab (no account needed)', 'Optional: Scratch (scratch.mit.edu or the Scratch app)'],
  outcomes: [
    'Create and delete clones that each run their own behaviour',
    'Use polling loops for smooth game controls',
    'Model velocity and gravity with variables to make jumping',
    'Store, read, search and randomly select items in lists',
    'Define custom blocks with inputs to remove repetition',
    'Coordinate menus, levels and game over with broadcasts and state variables',
    'Playtest, tune and improve games based on feedback',
    'Design, build and present an original arcade game',
  ],
  prereq: ['Scratch (Gr 3–5) Intermediate: Story, Quiz & Music Studio, or confident use of loops, variables, broadcasts and ask/answer'],
  style: 'Game-engineering studio: watch → build along → Code Lab challenges → apply in a game project. Each module adds one “pro technique” and ends with a playable game.',
  notes: 'Lessons are 45 minutes (projects 50; capstone 2 × 45). A physical keyboard is recommended for the game lessons. Code Lab challenges are checked automatically; projects arrive in your review queue with the learner’s program and the rubric.',
  safety: 'Games never ask for real names, addresses or passwords — password lessons use made-up words only. The Code Lab runs inside Kitabash; sharing to scratch.mit.edu is optional and needs a parent-approved account for under-13s. Learners under 18 use the AI tutor only with guardian consent.',
  nextCourse: 'Scratch (Gr 6–8) Beginner',
  modules: [
    { title: 'Module 1 · Clones', summary: 'One sprite, many copies: falling stars, catching games and tidy clean-up. Project: Starfall Catcher.', bigQuestion: 'How do games make so many things at once?', lessons: [A1, A2, A3] },
    { title: 'Module 2 · Game physics', summary: 'Velocity, gravity and jumping with smooth controls. Project: Jumpy Platformer.', bigQuestion: 'How do games make movement feel real?', lessons: [A4, A5, A6] },
    { title: 'Module 3 · Lists', summary: 'Store, read, search and randomly pick items. Project: Guess the Animal.', bigQuestion: 'How can a program remember lots of things?', lessons: [A7, A8, A9] },
    { title: 'Module 4 · Engineer it', summary: 'Custom blocks, game states and levels, then a capstone original arcade game.', bigQuestion: 'How do engineers keep big programs organised?', lessons: [A10, A11, A12] },
  ],
};
