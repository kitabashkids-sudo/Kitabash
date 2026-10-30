// Flagship course: Scratch Game Makers (Grades 3–5, Beginner).
import type { FlagshipCourse } from '../types.ts';
import { L1, L2, L3 } from './m1.ts';
import { L4, L5, L6 } from './m2.ts';
import { L7, L8, L9 } from './m3.ts';
import { L10, L11, L12 } from './m4.ts';

export const SCRATCH_3_5_BEGINNER: FlagshipCourse = {
  key: 'scratch--3-5--beginner@2',
  replaces: 'scratch--3-5--beginner',
  subject: 'Scratch',
  band: '3-5',
  level: 'Beginner',
  title: 'Scratch Game Makers',
  tagline: 'Code your own animations and games — from your first script to your own arcade game.',
  description:
    'A 12-lesson project-based coding course. Learners build real programs in the built-in Code Lab (or Scratch): an animated name, a dance party, a catching game and their own arcade game. Every lesson has an explainer video, a build-along, block-coding challenges that are checked automatically, a printable worksheet and a teacher lesson plan.',
  intro: 'Welcome, game maker! In this course you’ll learn to code by making things: animations, a dance party, and your very own arcade game. Let’s go!',
  theme: 'grape',
  ages: [8, 10],
  grade: 'Grades 3–5',
  tutor: ['Pip', 'A friendly robot coding coach who helps young learners think through Scratch problems step by step, gives hints instead of answers, and celebrates debugging.'],
  tools: ['Laptop, Chromebook or tablet with a modern browser', 'The built-in Kitabash Code Lab (no account needed)', 'Optional: Scratch (scratch.mit.edu or the Scratch app)', 'Printed worksheets (optional)'],
  outcomes: [
    'Write programs as sequences of instructions and explain why order matters',
    'Use events (green flag, keys, clicks, messages) to start scripts',
    'Use repeat and forever loops for patterns and animation',
    'Use if-then and if-else with sensing conditions to make decisions',
    'Use x–y coordinates and random numbers to position and move sprites',
    'Create and use variables such as score, lives and time',
    'Coordinate sprites with broadcast messages and build win/lose endings',
    'Plan, build, test, debug, improve and present an original game',
  ],
  prereq: ['Basic mouse or touch skills', 'Reading simple sentences (videos have captions and an optional read-aloud)'],
  style: 'Project-based and hands-on: watch → build along → solve coding challenges → apply in a project. Concepts spiral: each module adds one big idea and reuses the earlier ones.',
  notes:
    'Each lesson is 45 minutes (projects 50; capstone 2 × 45). Every lesson has a timed lesson plan (PDF), a worksheet with an answer key, and an unplugged warm-up. Code Lab challenges are graded automatically on the server; projects come to your review queue with the learner’s actual program and the rubric. Real Scratch is optional: the Code Lab covers everything needed.',
  safety: 'No personal information is requested. The Code Lab runs inside Kitabash; sharing to scratch.mit.edu is optional and needs a parent-approved account for under-13s. Learners under 18 use the AI tutor only with guardian consent.',
  nextCourse: 'Scratch (Gr 3–5) Intermediate',
  modules: [
    { title: 'Module 1 · Hello, Scratch! Sequences and events', summary: 'Meet the stage and sprites, write your first scripts, and make things happen when keys are pressed or sprites are clicked. Project: My Animated Name.', bigQuestion: 'How do we tell a computer exactly what to do — and when?', lessons: [L1, L2, L3] },
    { title: 'Module 2 · Loops and animation', summary: 'Spot patterns, use repeat and forever loops, draw with the pen and animate with costumes. Project: Dance Party.', bigQuestion: 'How can a few blocks do a lot of work?', lessons: [L4, L5, L6] },
    { title: 'Module 3 · Decisions and game play', summary: 'Teach sprites to decide with if-then, use coordinates and random numbers, and build your first real game. Project: Catch the Apple.', bigQuestion: 'How do games react to what the player does?', lessons: [L7, L8, L9] },
    { title: 'Module 4 · Variables and game design', summary: 'Keep score with variables, connect sprites with messages, debug like a pro, and design your own arcade game. Capstone: My Arcade Game.', bigQuestion: 'How do we design a complete game that others want to play?', lessons: [L10, L11, L12] },
  ],
};


