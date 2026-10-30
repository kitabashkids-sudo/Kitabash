// Flagship course: Scratch Algorithms Lab (Grades 6–8, Advanced).
import type { FlagshipCourse } from '../types.ts';
import { J1, J2, J3 } from './m1.ts';
import { J4, J5, J6 } from './m2.ts';
import { J7, J8, J9 } from './m3.ts';
import { J10, J11, J12 } from './m4.ts';

export const SCRATCH_6_8_ADVANCED: FlagshipCourse = {
  key: 'scratch--6-8--advanced@2',
  replaces: 'scratch--6-8--advanced',
  subject: 'Scratch',
  band: '6-8',
  level: 'Advanced',
  title: 'Algorithms Lab',
  tagline: 'Search, sort, encrypt and recurse — then carry it all across to Python.',
  description:
    'The final middle-school Scratch course. Learners implement and measure classic algorithms — linear and binary search, swapping and bubble sort, string processing and the Caesar cipher, and recursion with fractals — then translate their thinking into Python. Projects: Search Showdown, Live Leaderboard, Secret Messenger and a capstone Algorithm App with a Python version. Every lesson has a video, build-along, auto-checked Code Lab challenges (tested with sample inputs), a worksheet and a teacher lesson plan.',
  intro: 'Think like a computer scientist: design algorithms, measure them, and write them in Python.',
  theme: 'meadow',
  ages: [12, 14],
  grade: 'Grades 6–8',
  tutor: ['Byte', 'A calm, encouraging coding mentor who helps middle-schoolers design, trace and measure algorithms and translate blocks into Python — with questions and hints rather than answers.'],
  tools: ['Laptop or Chromebook with a modern browser and a keyboard', 'The built-in Kitabash Code Lab (no account needed)', 'Optional: Scratch (scratch.mit.edu) and a free online Python editor'],
  outcomes: [
    'Implement linear and binary search and handle “not found”',
    'Measure algorithms by counting steps and compare their efficiency',
    'Swap safely with a temporary variable and implement bubble sort',
    'Describe linear, logarithmic and quadratic growth informally',
    'Process strings character by character (count, reverse, palindromes)',
    'Encrypt and decrypt with a Caesar cipher using modular arithmetic',
    'Write recursive procedures with a base case, including fractals',
    'Translate between Scratch and Python (loops, conditionals, lists, functions)',
    'Design an algorithm in pseudocode, implement it, test it and present it',
  ],
  prereq: ['Scratch (Gr 6–8) Intermediate: Data & Simulations, or confident use of lists, procedures with inputs and validation'],
  style: 'Computer-science lab: each lesson introduces an algorithm, traces it unplugged, builds it in a Code Lab challenge checked with sample inputs, measures it, and shows the Python equivalent.',
  notes: 'Lessons are 45 minutes (projects 50; capstone 2 × 45). Some algorithms take a few seconds to run in the Code Lab — that’s expected and a good talking point about efficiency. Projects arrive in your review queue with the learner’s program and the rubric.',
  safety: 'Cipher lessons are for fun and learning; remind learners never to use made-up ciphers to protect real passwords or personal data. Sharing to scratch.mit.edu is optional and needs a parent-approved account for under-13s. Learners under 18 use the AI tutor only with guardian consent.',
  nextCourse: 'Python (Gr 6–8) Beginner',
  modules: [
    { title: 'Module 1 · Searching', summary: 'Linear and binary search, step counting and efficiency. Project: Search Showdown.', bigQuestion: 'How do computers find things so fast?', lessons: [J1, J2, J3] },
    { title: 'Module 2 · Sorting', summary: 'Swapping, bubble passes, bubble sort and quadratic growth. Project: Live Leaderboard.', bigQuestion: 'What does it cost to put things in order?', lessons: [J4, J5, J6] },
    { title: 'Module 3 · Strings and secrets', summary: 'Character processing, palindromes and the Caesar cipher. Project: Secret Messenger.', bigQuestion: 'How can code read, change and hide text?', lessons: [J7, J8, J9] },
    { title: 'Module 4 · Recursion and Python', summary: 'Recursion and fractals, translating to Python, then a capstone Algorithm App.', bigQuestion: 'How do the big ideas carry over to text code?', lessons: [J10, J11, J12] },
  ],
};
