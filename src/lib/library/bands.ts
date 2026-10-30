// K-12 grade bands and which subjects are offered in each (only where they suit the age).
import type { Band, Level } from './types.ts';

export const BANDS: { id: Band; label: string; grades: string; ages: [number, number] }[] = [
  { id: 'K-2', label: 'Early Years', grades: 'KG–Grade 2', ages: [5, 7] },
  { id: '3-5', label: 'Primary', grades: 'Grades 3–5', ages: [8, 10] },
  { id: '6-8', label: 'Middle School', grades: 'Grades 6–8', ages: [11, 13] },
  { id: '9-12', label: 'High School', grades: 'Grades 9–12', ages: [14, 17] },
  { id: 'Adult', label: 'Adult Learners', grades: 'Adults (18+)', ages: [18, 65] },
];
export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
export const band = (id: Band) => BANDS.find((b) => b.id === id)!;

/** Suggested band for a learner's age (used for "Recommended for you"). */
export function bandForAge(age: number | null | undefined): Band | null {
  if (age == null) return null;
  if (age <= 7) return 'K-2';
  if (age <= 10) return '3-5';
  if (age <= 13) return '6-8';
  if (age <= 17) return '9-12';
  return 'Adult';
}

const ALL: Band[] = ['K-2', '3-5', '6-8', '9-12'];
const P: Band[] = ['3-5', '6-8', '9-12'];
const S: Band[] = ['6-8', '9-12'];
const A: Band[] = ['Adult'];

/** Industry AI tracks for working adults (see docs/AI_USE_CASES.md). */
export const PRO_SUBJECTS = [
  'AI for HR', 'AI for Sales', 'AI for Marketing', 'AI for Education', 'AI for Customer Support',
  'AI for Finance & Accounting', 'AI for Healthcare', 'AI for Legal', 'AI for Operations & Supply Chain', 'AI for Real Estate',
  'AI for Small Business', 'AI for Software & IT', 'AI for Banking', 'AI for Insurance', 'AI for Retail & E-commerce',
  'AI for Manufacturing', 'AI for Hospitality', 'AI for Government & Public Sector', 'AI for Media & Content', 'AI for Agriculture',
];

/** Subject → grade bands where it is offered. Every listed band has Beginner, Intermediate and Advanced. */
export const SUBJECT_BANDS: Record<string, Band[]> = {
  // Language & Communication
  'Handwriting & Penmanship': ALL,
  'Spoken English': ALL,
  'English Grammar & Vocabulary': ALL,
  'Reading Comprehension': ALL,
  'Creative Writing': P,
  'Storytelling': ['K-2', '3-5', '6-8'],
  'Public Speaking': P,
  'Debate & Communication': S,
  'Presentation Skills': S,
  // Academic Learning
  'Mathematics': ALL,
  'Science': ALL,
  'English': ALL,
  'Environmental Studies': ['K-2', '3-5'],
  'Logical Reasoning': P,
  'Critical Thinking': P,
  'Olympiad Preparation': P,
  'Problem Solving': P,
  'Homework & Revision Support': P,
  // School Board Curriculum
  'CBSE': P,
  'ICSE / CISCE': P,
  'Cambridge IGCSE': S,
  // Life & Financial Skills
  'Financial Literacy': ALL,
  'Saving & Budgeting': ALL,
  'Needs vs Wants': ['K-2', '3-5', '6-8'],
  'Money Management': S,
  'Financial Decision-Making': S,
  'Entrepreneurship': P,
  'Digital Citizenship': ALL,
  'Study Skills': P,
  // Coding, AI & Technology
  'Scratch Junior': ['K-2'],
  'Scratch': ['3-5', '6-8'],
  'Python': S,
  'MIT App Inventor': S,
  'Micro:bit': ['3-5', '6-8'],
  'Web Development': S,
  'Artificial Intelligence': P,
  'Prompt Engineering': S,
  'AI-Assisted Website Creation': S,
  'Robotics': P,
  'Minecraft Education (MakeCode)': ['3-5', '6-8'],
  'No-code Automation & AI Agents': S,
  // AI for Professionals (adults only)
  ...Object.fromEntries(PRO_SUBJECTS.map((s) => [s, A])),
};
