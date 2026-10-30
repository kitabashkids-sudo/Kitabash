// Flagship course: ScratchJr Little Coders (K–2, Beginner).
import type { FlagshipCourse } from '../types.ts';
import { K1, K2, K3 } from './m1.ts';
import { K4, K5, K6 } from './m2.ts';
import { K7, K8, K9 } from './m3.ts';
import { K10, K11, K12 } from './m4.ts';

export const SCRATCHJR_BEGINNER: FlagshipCourse = {
  key: 'scratch-junior--K-2--beginner@2',
  replaces: 'scratch-junior--K-2--beginner',
  subject: 'Scratch Junior',
  band: 'K-2',
  level: 'Beginner',
  title: 'Little Coders',
  tagline: 'Arrows, repeats, talking and treasure — first coding adventures with picture blocks.',
  description:
    'A first coding course for ages 5–7, designed for children who are still learning to read. Children move characters with picture arrow blocks, add numbers to blocks, start scripts with the green flag, spot patterns and use repeat loops, make characters talk, collect treasure, and find and fix bugs. Every lesson has a short animated video, a build-along for the ScratchJr app, picture-block puzzles that check themselves, a talk-and-move activity, a printable worksheet and a teacher plan. Projects: Trip to the Park, Dance Party, Treasure Hunt and a capstone Story Show.',
  intro: 'Hello, little coder! Let’s make characters move, dance, talk and find treasure!',
  theme: 'sunrise',
  ages: [5, 7],
  grade: 'KG–Grade 2',
  tutor: ['Pip', 'A friendly, patient robot helper who speaks in very short, simple sentences, gives one small hint at a time and celebrates every try.'],
  tools: ['Tablet or computer with a modern browser', 'Optional: the free ScratchJr app (iPad, Android tablet or Chromebook) for the projects', 'Paper and crayons for maps and plans'],
  outcomes: [
    'Move a character with arrow blocks in the right order (sequence)',
    'Change the number on a block to move further',
    'Start a script with the green flag (events)',
    'Spot patterns and use a repeat block (loops)',
    'Make a character talk at the right moment',
    'Plan a path to collect every gem',
    'Find and fix a bug by watching and changing one block',
    'Make code shorter with numbers and repeats',
    'Plan, build and present a short story in ScratchJr',
  ],
  prereq: ['None — made for children who are just starting to read'],
  style: 'Play-based and visual: a short video, an unplugged movement game, picture-block puzzles with instant feedback, then a mini-project in the ScratchJr app. Very little reading is needed; adults can read instructions aloud.',
  notes: 'Lessons are 30 minutes (projects 35; capstone 2 × 30). The picture puzzles run in Kitabash; projects are built in the free ScratchJr app and checked with a simple checklist (reflections can be dictated to an adult). A taped floor grid makes the unplugged warm-ups even better.',
  safety: 'Children use only first names and never share photos of themselves or others outside the class. ScratchJr projects stay on the device. Young learners use the AI tutor only with an adult present and guardian consent.',
  nextCourse: 'Scratch Junior (K–2) Intermediate',
  modules: [
    { title: 'Module 1 · Arrows and order', summary: 'Picture arrows, numbers on blocks and first sequences. Project: Trip to the Park.', bigQuestion: 'How do we tell a character where to go?', lessons: [K1, K2, K3] },
    { title: 'Module 2 · Start and repeat', summary: 'The green flag and repeat loops. Project: Dance Party.', bigQuestion: 'How do we start code and repeat a pattern?', lessons: [K4, K5, K6] },
    { title: 'Module 3 · Talk and collect', summary: 'Speech bubbles and collecting gems. Project: Treasure Hunt.', bigQuestion: 'How can characters talk and find things?', lessons: [K7, K8, K9] },
    { title: 'Module 4 · Fix it and show it', summary: 'Debugging, short code and a capstone Story Show.', bigQuestion: 'How do coders fix mistakes and share their work?', lessons: [K10, K11, K12] },
  ],
};
