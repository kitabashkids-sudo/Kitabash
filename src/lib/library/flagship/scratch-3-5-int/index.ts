// Flagship course: Scratch Story, Quiz & Music Studio (Grades 3–5, Intermediate).
import type { FlagshipCourse } from '../types.ts';
import { I1, I2, I3 } from './m1.ts';
import { I4, I5, I6 } from './m2.ts';
import { I7, I8, I9 } from './m3.ts';
import { I10, I11, I12 } from './m4.ts';

export const SCRATCH_3_5_INTERMEDIATE: FlagshipCourse = {
  key: 'scratch--3-5--intermediate@2',
  replaces: 'scratch--3-5--intermediate',
  subject: 'Scratch',
  band: '3-5',
  level: 'Intermediate',
  title: 'Story, Quiz & Music Studio',
  tagline: 'Pattern art, choose-your-path stories, quiz shows and music machines — coded by you.',
  description:
    'The second course in the Scratch pathway. Learners deepen loops (nested loops, variables in loops), build interactive stories with messages and questions, make quiz games with operators, random numbers, scores and timers, and compose music with notes and keyboard instruments. Four projects and a capstone interactive show. Every lesson has a video, a build-along, Code Lab challenges checked automatically, a worksheet and a teacher lesson plan.',
  intro: 'Welcome back, coder! This time you’ll make art, stories that listen, quiz shows and music. Ready to create?',
  theme: 'ocean',
  ages: [8, 10],
  grade: 'Grades 3–5',
  tutor: ['Pip', 'A friendly robot coding coach who helps young creators plan, debug and improve their Scratch projects with hints rather than answers.'],
  tools: ['Laptop, Chromebook or tablet with a modern browser', 'The built-in Kitabash Code Lab (no account needed)', 'Headphones for the music lessons', 'Optional: Scratch (scratch.mit.edu or the Scratch app)'],
  outcomes: [
    'Use nested loops and variables inside loops to generate patterns',
    'Coordinate characters and scenes with broadcast messages',
    'Collect input with ask and answer, and branch with if-else',
    'Use operators to calculate and check answers',
    'Generate random questions and keep score with variables',
    'Use the timer to add time limits',
    'Compose melodies and rhythms with notes, beats and loops',
    'Turn keys and sprites into instruments and sync animation to music',
    'Plan, build, test and present an original interactive show',
  ],
  prereq: ['Scratch (Gr 3–5) Beginner: Scratch Game Makers, or equivalent experience with events, loops, if-then and variables'],
  style: 'Project-based and creative: watch → build along → Code Lab challenges → apply in a project. Each module explores a different medium (art, stories, games, music) with the same core ideas.',
  notes: 'Lessons are 45 minutes (projects 50; capstone 2 × 45). Music lessons need sound: headphones help in a classroom. Code Lab challenges are checked automatically; projects arrive in your review queue with the learner’s program and the rubric.',
  safety: 'Learners never ask for or share private information in their stories and quizzes (only first names or choices). The Code Lab runs inside Kitabash; sharing to scratch.mit.edu is optional and needs a parent-approved account for under-13s. Learners under 18 use the AI tutor only with guardian consent.',
  nextCourse: 'Scratch (Gr 3–5) Advanced',
  modules: [
    { title: 'Module 1 · Pattern art', summary: 'Nested loops and variables inside loops make flowers, rows and spirals. Project: Pattern Art Gallery.', bigQuestion: 'How can a few rules create beautiful art?', lessons: [I1, I2, I3] },
    { title: 'Module 2 · Interactive stories', summary: 'Characters take turns with messages, scenes change, and stories listen to the reader. Project: Choose-Your-Path Story.', bigQuestion: 'How can a story change depending on the reader?', lessons: [I4, I5, I6] },
    { title: 'Module 3 · Quiz and maths games', summary: 'Operators, random questions, scores and timers. Project: Quiz Show.', bigQuestion: 'How does a computer check if you’re right?', lessons: [I7, I8, I9] },
    { title: 'Module 4 · Music machines', summary: 'Notes, melodies, rhythms and keyboard instruments, then a capstone interactive show.', bigQuestion: 'How can code make music and bring everything together?', lessons: [I10, I11, I12] },
  ],
};
