// Flagship course: ScratchJr Story Makers (K–2, Intermediate).
import type { FlagshipCourse } from '../types.ts';
import { S1, S2, S3, S4, S5, S6 } from './m1.ts';
import { S7, S8, S9, S10, S11, S12 } from './m2.ts';

export const SCRATCHJR_INTERMEDIATE: FlagshipCourse = {
  key: 'scratch-junior--K-2--intermediate@2',
  replaces: 'scratch-junior--K-2--intermediate',
  subject: 'Scratch Junior',
  band: 'K-2',
  level: 'Intermediate',
  title: 'Story Makers',
  tagline: 'Talking characters, magic looks, hops, scenes and storyboards — tell stories with code.',
  description:
    'The second ScratchJr course for ages 5–7. Children make characters hold conversations, change how they look (grow, shrink, hide, show), hop and dance with repeat loops, build stories with a beginning, middle and end, move between scenes, turn storyboards into code and become bug detectives. Projects: Talking Pets, Animal Parade, Fairy Tale Retell and a capstone Animated Story. Every lesson has a short video, a build-along for the ScratchJr app, picture-block puzzles that check themselves, a talk-and-move activity, a worksheet and a teacher plan.',
  intro: 'Welcome back, story maker! Let’s make characters talk, change and go on adventures.',
  theme: 'ocean',
  ages: [5, 7],
  grade: 'KG–Grade 2',
  tutor: ['Pip', 'A friendly, patient robot helper who speaks in very short, simple sentences, gives one small hint at a time and celebrates every try.'],
  tools: ['Tablet or computer with a modern browser', 'Optional: the free ScratchJr app (iPad, Android tablet or Chromebook) for the projects', 'Paper and crayons for storyboards'],
  outcomes: [
    'Make characters say several lines in order and take turns',
    'Use grow, shrink, hide and show to tell a story',
    'Use hop and repeat loops with several blocks inside',
    'Build a story with a beginning, middle and end',
    'Make characters exit and enter scenes (pages)',
    'Turn a storyboard into code',
    'Find and fix more than one bug',
    'Plan, build and present an animated story',
  ],
  prereq: ['Scratch Junior (K–2) Beginner: Little Coders, or experience with arrow blocks, the green flag and repeat'],
  style: 'Story-led and visual: a short video, a pretend-play warm-up, picture-block puzzles with instant feedback, then a story project in the ScratchJr app. Very little reading; adults can read instructions aloud.',
  notes: 'Lessons are 30 minutes (projects 35; capstone 2 × 30). Projects are built in the free ScratchJr app and checked with a simple checklist (reflections can be dictated to an adult). Familiar fairy tales make planning easier.',
  safety: 'Children use only first names and never share photos of themselves or others outside the class. ScratchJr projects stay on the device. Young learners use the AI tutor only with an adult present and guardian consent.',
  nextCourse: 'Scratch Junior (K–2) Advanced',
  modules: [
    { title: 'Module 1 · Talk and change', summary: 'Conversations and looks blocks. Project: Talking Pets.', bigQuestion: 'How can characters talk and change?', lessons: [S1, S2, S3] },
    { title: 'Module 2 · Movement magic', summary: 'Hops, chunks and loops. Project: Animal Parade.', bigQuestion: 'How do loops make characters dance?', lessons: [S4, S5, S6] },
    { title: 'Module 3 · Story time', summary: 'Beginning, middle and end; scenes. Project: Fairy Tale Retell.', bigQuestion: 'How do we tell a story with code?', lessons: [S7, S8, S9] },
    { title: 'Module 4 · Plan, fix and show', summary: 'Debugging, storyboards and a capstone Animated Story.', bigQuestion: 'How do story makers plan and fix their work?', lessons: [S10, S11, S12] },
  ],
};
