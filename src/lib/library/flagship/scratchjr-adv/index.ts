// Flagship course: ScratchJr Game Builders (K–2, Advanced).
import type { FlagshipCourse } from '../types.ts';
import { T1, T2, T3, T4, T5, T6 } from './m1.ts';
import { T7, T8, T9, T10, T11, T12 } from './m2.ts';

export const SCRATCHJR_ADVANCED: FlagshipCourse = {
  key: 'scratch-junior--K-2--advanced@2',
  replaces: 'scratch-junior--K-2--advanced',
  subject: 'Scratch Junior',
  band: 'K-2',
  level: 'Advanced',
  title: 'Game Builders',
  tagline: 'Tap starts, forever loops, scores, messages and bumps — build your first real games.',
  description:
    'The third ScratchJr course for ages 6–7. Children learn how games work: tap-to-start interaction, forever loops, keeping score, planning paths through mazes, messages between characters, bump (collision) rules, designing fair levels, and testing and fixing games. Projects: Tap Game, Gem Collector, Relay Race and a capstone My First Game. Every lesson has a short video, a build-along for the ScratchJr app, picture-block puzzles that check themselves, an active warm-up, a worksheet and a teacher plan.',
  intro: 'Hello, game builder! Let’s learn the secrets of games — and make your own.',
  theme: 'grape',
  ages: [6, 7],
  grade: 'KG–Grade 2',
  tutor: ['Pip', 'A friendly, patient robot helper who speaks in very short, simple sentences, gives one small hint at a time and celebrates every try.'],
  tools: ['Tablet or computer with a modern browser', 'Optional: the free ScratchJr app (iPad, Android tablet or Chromebook) for the projects', 'Paper and crayons for game plans'],
  outcomes: [
    'Start scripts with a tap as well as the green flag',
    'Choose between counted and forever loops',
    'Keep score by adding 1 for each thing collected',
    'Plan paths through mazes and find shorter ways',
    'Use messages so characters take turns',
    'Make game rules with bumps (collisions)',
    'Design fair levels that get harder',
    'Test games and fix bugs in rules and scores',
    'Design, build and present an original game',
  ],
  prereq: ['Scratch Junior (K–2) Intermediate: Story Makers, or confident use of ScratchJr moves, looks, repeat and pages'],
  style: 'Game-play led: a short video, an active warm-up game, picture-block puzzles with instant feedback, then a game project in the ScratchJr app. Very little reading; adults can read instructions aloud.',
  notes: 'Lessons are 30 minutes (projects 35; capstone 2 × 30). The picture puzzles use “👆 start on tap” in place of ScratchJr messages where needed. Projects are built in the free ScratchJr app and checked with a simple checklist (reflections can be dictated to an adult).',
  safety: 'Children use only first names and never share photos of themselves or others outside the class. ScratchJr projects stay on the device. Young learners use the AI tutor only with an adult present and guardian consent.',
  nextCourse: 'Scratch (Gr 3–5) Beginner',
  modules: [
    { title: 'Module 1 · Game starts', summary: 'Tap to start and forever loops. Project: Tap Game.', bigQuestion: 'How do players make games happen?', lessons: [T1, T2, T3] },
    { title: 'Module 2 · Score and paths', summary: 'Keeping score and solving mazes. Project: Gem Collector Game.', bigQuestion: 'How do games count and challenge us?', lessons: [T4, T5, T6] },
    { title: 'Module 3 · Messages and bumps', summary: 'Messages between characters and bump rules. Project: Relay Race.', bigQuestion: 'How do characters work together?', lessons: [T7, T8, T9] },
    { title: 'Module 4 · Make a real game', summary: 'Level design, testing and a capstone game.', bigQuestion: 'How do game designers make games fun and fair?', lessons: [T10, T11, T12] },
  ],
};
