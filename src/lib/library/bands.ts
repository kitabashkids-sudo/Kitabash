// K-12 grade bands and which subjects are offered in each (only where they suit the age).
import type { Band, Level } from './types.ts';

export const BANDS: { id: Band; label: string; grades: string; ages: [number, number] }[] = [
  { id: 'K-2', label: 'Early Years', grades: 'KG–Grade 2', ages: [5, 7] },
  { id: '3-5', label: 'Primary', grades: 'Grades 3–5', ages: [8, 10] },
  { id: '6-8', label: 'Middle School', grades: 'Grades 6–8', ages: [11, 13] },
  { id: '9-12', label: 'High School', grades: 'Grades 9–12', ages: [14, 17] },
];
export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
export const band = (id: Band) => BANDS.find((b) => b.id === id)!;

/** Suggested band for a learner's age (used for "Recommended for you"). */
export function bandForAge(age: number | null | undefined): Band | null {
  if (age == null) return null;
  if (age <= 7) return 'K-2';
  if (age <= 10) return '3-5';
  if (age <= 13) return '6-8';
  return '9-12';
}

const ALL: Band[] = ['K-2', '3-5', '6-8', '9-12'];
const P: Band[] = ['3-5', '6-8', '9-12'];
const S: Band[] = ['6-8', '9-12'];

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
};
