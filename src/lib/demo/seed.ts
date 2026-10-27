// Demo / starter content, created through the same services the app uses so it passes
// the same validation and approval workflow. Used by `npm run db:seed` and by the
// first-run setup page (no command line needed).
import { all, get, run } from '../db/index.ts';
import { createUser } from '../auth.ts';
import * as C from '../services/courses.ts';
import * as A from '../services/agents.ts';
import * as K from '../services/knowledge.ts';
import * as ADM from '../services/admin.ts';
import { CATALOGUE, MONEY_GUIDE, MATHS_GUIDE, L_NEEDS, L_BUDGET, L_HANDWRITING, L_SPOKEN } from './content.ts';

type Log = (...a: any[]) => void;

/** Sample accounts with PUBLISHED passwords — only for local demos, never on a public site. */
export const DEMO_USERS = [
  { email: 'admin@kitabash.local', name: 'Asha (Admin)', role: 'admin' as const, password: 'Admin#2026', birth_year: null },
  { email: 'teacher@kitabash.local', name: 'Mr. Rao (Instructor)', role: 'instructor' as const, password: 'Teach#2026', birth_year: null },
  { email: 'aarav@kitabash.local', name: 'Aarav', role: 'student' as const, password: 'Learn#2026', birth_year: new Date().getFullYear() - 10 },
  { email: 'meera@kitabash.local', name: 'Meera', role: 'student' as const, password: 'Learn#2026', birth_year: new Date().getFullYear() - 9 },
  { email: 'parent@kitabash.local', name: 'Priya (Aarav’s parent)', role: 'guardian' as const, password: 'Parent#2026', birth_year: null },
];

/** Starter catalogue (categories + subjects). Idempotent. Returns subject name → id. */
export async function seedCatalogue(admin: string): Promise<Record<string, string>> {
  const subj: Record<string, string> = {};
  if (await get('SELECT 1 FROM categories LIMIT 1')) {
    for (const r of await all('SELECT id, name FROM subjects')) subj[r.name] = r.id;
    return subj;
  }
  for (const [i, cat] of CATALOGUE.entries()) {
    const cid = await ADM.addCategory(cat.name, cat.description, cat.icon, admin);
    await run('UPDATE categories SET sort=? WHERE id=?', i, cid);
    for (const s of cat.subjects) subj[s] = await ADM.addSubject(cid, s, '', admin);
  }
  return subj;
}

/** The four demo courses (3 published, 1 draft for the Studio walkthrough). */
export async function seedDemoCourses(admin: string, subj: Record<string, string>, log: Log = () => {}): Promise<string[]> {
  // Helper to build a lesson through the services
  const buildLesson = async (moduleId: string, L: any) => {
    const lid = await C.addLesson(moduleId, L.title);
    await C.updateLesson(lid, { objective: L.objective, duration_minutes: L.duration, learn: { cards: L.cards }, hook: L.hook, teacher: L.teacher });
    for (const a of L.activities) await C.upsertActivity(lid, a);
    if (L.teacher.assess?.rubric) await run('INSERT INTO assessments (id,lesson_id,title,rubric,pass_pct) VALUES (?,?,?,?,60)', 'as_' + lid, lid, `${L.title} rubric`, L.teacher.assess.rubric);
    await C.setLessonStatus(lid, 'approved', admin);
    return lid;
  };

  const approveAndPublish = async (courseId: string, agentPatch: any) => {
    await A.saveAgentConfig(courseId, agentPatch, 'Seeded configuration', admin);
    await A.addStarterSuite(courseId);
    const r = await A.runTests(courseId, admin);
    log(`   sandbox tests: ${r.passed}/${r.total} passed`);
    await A.transitionAgentVersion(courseId, 'review', admin);
    await A.transitionAgentVersion(courseId, 'approved', admin);
    await C.transitionCourse(courseId, 'review', admin);
    await C.transitionCourse(courseId, 'approved', admin);
    await C.transitionCourse(courseId, 'published', admin, 'Initial release');
  };

  // ── Course 1: Money Smart (flagship demo) ──
  log('• Money Smart');
  const money = await C.createCourse(
    {
      subject_id: subj['Financial Literacy'], title: 'Money Smart: Needs, Wants & Budgets',
      description: 'Learn the difference between needs and wants, then plan your own budget with a real-feeling school trip simulation.',
      age_min: 8, age_max: 11, grade_level: 'Grades 3–5', proficiency: 'beginner',
      prerequisites: ['Add and subtract numbers up to 1000'],
      objectives: [L_NEEDS.objective, L_BUDGET.objective],
      outcomes: ['Explains the difference between needs and wants with examples', 'Plans a budget that covers needs, stays within limits and saves'],
      duration_minutes: 55, required_tools: ['Device with browser', 'Optional: printed picture cards'],
      teaching_style: 'Warm and playful. Use everyday Indian contexts (pocket money, school trips, the monsoon). Celebrate reasoning.',
      assessment_approach: 'Formative: sorting and simulations auto-checked; reasoning probes reviewed by the teacher with a 4-level rubric.',
      safety_requirements: 'No real money or bank details. Do not ask about family income.',
      instructor_notes: 'Avoid judging families’ spending. Frame wants positively. Learners from different backgrounds will have different needs — welcome that discussion.',
      student_intro: 'Become a money detective! 🕵️ Find out what we really need, and plan your own budget.', theme: 'sunrise',
    },
    admin,
  );
  await K.uploadResource(money, { filename: 'money-smart-teacher-guide.md', mime: 'text/markdown', data: Buffer.from(MONEY_GUIDE) }, { title: 'Money Smart teacher guide', audience: 'student' }, admin);
  await K.addUrl(money, 'https://www.rbi.org.in/financialeducation/', 'RBI Financial Education (reference link)', admin);
  const m1 = await C.addModule(money, 'Module 1: Smart choices', 'Needs, wants and budgets');
  await buildLesson(m1, L_NEEDS);
  await buildLesson(m1, L_BUDGET);
  await approveAndPublish(money, {
    identity: { name: 'Penny', purpose: 'A friendly money detective who helps children think about needs, wants and budgets.' },
    misconceptions: [
      { trigger: 'wants are bad', correction: 'Wants aren’t bad at all! We just plan for them after our needs are covered.' },
      { trigger: 'needs are expensive', correction: 'Price doesn’t decide — water is cheap, but it’s definitely a need.' },
      { trigger: 'spend it all', correction: 'Keeping some money as savings is a smart part of every budget.' },
    ],
    outOfScope: { topics: ['stock tips', 'crypto', 'bitcoin', 'betting', 'gambling', 'lottery', 'loan', 'credit card'], actions: ['Advising on real family finances', 'Doing homework for the learner'], redirect: 'That’s a grown-up money topic outside our lesson. Let’s get back to needs, wants and budgets — or ask your teacher!' },
    grounding: { mode: 'prefer', citeSources: true },
    examples: [{ student: 'is a bicycle a need?', ideal: 'Great question — it depends! If you ride it to school every day, it might be a need. If it’s just for fun, it’s more of a want. What do you use a bicycle for?' }],
  });
  const tr = await ADM.addTrack(money, { pathway: 'board', board: 'CBSE', grade: 'Class 4', subject: 'EVS / Life skills', syllabus_code: '', syllabus_year: '2026–27', title: 'CBSE (illustrative — awaiting verification)' });
  await ADM.addMapping(tr, { topic: 'Needs and wants (illustrative)', objective: 'Distinguish needs from wants', assessment_format: 'Activity + oral', reference_source: '', lesson_id: null });
  await ADM.addTrack(money, { pathway: 'olympiad', board: 'Financial literacy olympiad (example)', grade: 'Grade 4–5', subject: 'Financial literacy', syllabus_code: '', syllabus_year: '', title: 'Olympiad practice pathway (example)' });

  // ── Course 2: Handwriting ──
  log('• Handwriting');
  const hw = await C.createCourse(
    { subject_id: subj['Handwriting & Penmanship'], title: 'Handwriting: Curly Caterpillar Letters', description: 'Practise forming c, a and friends with tracing on screen.', age_min: 5, age_max: 7, grade_level: 'KG–Grade 1', proficiency: 'beginner', objectives: [L_HANDWRITING.objective], duration_minutes: 15, required_tools: ['Touch screen or mouse', 'Pencil and lined paper'], teaching_style: 'Very short sentences. Lots of praise. Model, then practise.', assessment_approach: 'Tracing coverage and accuracy; teacher observation of paper practice.', student_intro: 'Let’s make curly letters! 🐛', theme: 'meadow' },
    admin,
  );
  const hm = await C.addModule(hw, 'Module 1: c-family letters');
  await buildLesson(hm, L_HANDWRITING);
  await approveAndPublish(hw, { identity: { name: 'Inky', purpose: 'A gentle helper for young children learning letter formation.' }, audience: { vocabulary: 'simple', complexity: 1, maxSentences: 3 }, grounding: { mode: 'prefer', citeSources: false } });

  // ── Course 3: Spoken English ──
  log('• Spoken English');
  const sp = await C.createCourse(
    { subject_id: subj['Spoken English'], title: 'Spoken English: Polite Requests', description: 'Ask for things politely with the right words and tone.', age_min: 9, age_max: 12, grade_level: 'Grades 4–6', proficiency: 'beginner', objectives: [L_SPOKEN.objective], duration_minutes: 20, required_tools: ['Microphone (optional)'], teaching_style: 'Encouraging, practical, role-play focused.', assessment_approach: 'Auto-checked phrase work; self-assessed speaking; teacher-reviewed rewrite.', safety_requirements: 'Audio recording requires guardian consent and stays on the device.', student_intro: 'Sound friendly and confident when you ask for something! 🗣️', theme: 'ocean' },
    admin,
  );
  const sm = await C.addModule(sp, 'Module 1: Everyday requests');
  await buildLesson(sm, L_SPOKEN);
  await approveAndPublish(sp, { identity: { name: 'Echo', purpose: 'A speaking coach who helps learners phrase requests politely.' } });

  // ── Course 4: Draft — demonstrates the Agent Training Studio ──
  log('• Patterns (draft for the studio demo)');
  const pt = await C.createCourse(
    { subject_id: subj['Mathematics'], title: 'Maths: Patterns & Sequences', description: 'Spot the rule, predict the next term and explain your thinking.', age_min: 9, age_max: 11, grade_level: 'Grades 4–5', proficiency: 'beginner', objectives: ['Find the rule in a growing number pattern and predict the next term.', 'Explain how to check that a pattern rule works for every term.'], duration_minutes: 40, teaching_style: 'Discovery-first: let learners guess the rule before telling them.', assessment_approach: 'Prediction questions plus written explanations.', student_intro: 'Become a pattern detective! 🔢', theme: 'grape' },
    admin,
  );
  await K.uploadResource(pt, { filename: 'patterns-notes.md', mime: 'text/markdown', data: Buffer.from(MATHS_GUIDE) }, { title: 'Patterns & sequences notes', audience: 'student' }, admin);
  await A.saveAgentConfig(pt, { misconceptions: [{ trigger: 'the rule only needs to work for the first two', correction: 'A rule must work for every pair of neighbouring terms — always check them all.' }] }, 'Draft', admin);
  return [money, hw, sp, pt];
}

/** Demo teacher, students and guardian, linked and enrolled. */
export async function seedDemoPeople(courseIds: string[]): Promise<void> {
  const ids: Record<string, string> = {};
  for (const u of DEMO_USERS.filter((u) => u.role !== 'admin')) ids[u.role + (u.email.startsWith('meera') ? '2' : '')] = await createUser(u);
  await run("INSERT INTO guardian_links (guardian_id,student_id,consent_ai,consent_audio,consented_at) VALUES (?,?,1,1,datetime('now'))", ids.guardian, ids.student);
  for (const c of courseIds.slice(0, 3)) {
    await ADM.adminEnrol(ids.student, c);
    await ADM.adminEnrol(ids.student2, c);
  }
}
