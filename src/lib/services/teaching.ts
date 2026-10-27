// Teacher workspace: assembles the right-hand resource panel automatically
// from the lesson, its activities (incl. answer keys), the course knowledge
// library, the media library, the agent's misconception list and approved
// curriculum mappings. Staff-only.
import { all, get, j } from '../db/index.ts';
import { HttpError } from '../validate.ts';
import { getCourse, hydrateActivity, hydrateLesson } from './courses.ts';
import { publishedOrDraftConfig } from '../agent/runtime.ts';
import { ACTIVITY_TYPES, effectiveType } from '../activities/registry.ts';
import type { TeacherContent } from '../lessonTypes.ts';

export async function teacherLesson(lessonId: string) {
  const l = await get('SELECT * FROM lessons WHERE id=?', lessonId);
  if (!l) throw new HttpError(404, 'Lesson not found');
  const course = await getCourse(l.course_id);
  const lesson = hydrateLesson(l, true);
  const t: TeacherContent = lesson.teacher || {};
  const activities = (await all('SELECT * FROM activities WHERE lesson_id=? ORDER BY phase, position', lessonId)).map((a) => hydrateActivity(a, true));
  const { config } = await publishedOrDraftConfig(course.id, course.status === 'published' ? 'published' : 'draft');
  const resources = await all("SELECT id,title,kind,source,mime,audience,extraction_status FROM resources WHERE course_id=? AND replaced_by IS NULL ORDER BY title", course.id);
  const assetIds = new Set<string>([lesson.hook?.assetId, ...(t.show?.items || []).map((i) => i.assetId)].filter(Boolean) as string[]);
  const assets = assetIds.size ? await all(`SELECT id,title,kind,mime,alt_text,captions FROM assets WHERE id IN (${[...assetIds].map(() => '?').join(',')})`, ...assetIds) : [];
  const rubrics = (await all('SELECT title, rubric, pass_pct FROM assessments WHERE lesson_id=?', lessonId)).map((r) => ({ ...r, rubric: j(r.rubric, []) }));
  const mappings = await all(
    `SELECT t.board,t.grade,t.syllabus_code,t.syllabus_year,m.topic,m.review_status,m.reference_source FROM curriculum_mappings m JOIN curriculum_tracks t ON t.id=m.track_id WHERE m.lesson_id=?`,
    lessonId,
  );
  const siblings = await all('SELECT l.id,l.title,l.status FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? ORDER BY m.position,l.position', course.id);

  // Assemble the six panel tabs. Authored content first, then auto-derived.
  const panel = {
    teach: {
      objective: lesson.objective,
      courseObjectives: course.objectives,
      explanation: t.teach?.explanation || lesson.learn.cards.map((c: any) => c.body).join(' '),
      analogies: t.teach?.analogies || [],
      vocabulary: t.teach?.vocabulary || [],
      instructorNotes: course.instructor_notes,
    },
    show: {
      hook: lesson.hook,
      items: t.show?.items || [],
      assets,
      learnCards: lesson.learn.cards,
    },
    facilitate: {
      prompts: t.facilitate?.prompts || [],
      discussion: t.facilitate?.discussion || [],
      differentiation: t.facilitate?.differentiation || {},
      timing: t.facilitate?.timing || '',
      activityGuides: activities.map((a) => ({ id: a.id, title: a.title, phase: a.phase, type: ACTIVITY_TYPES[effectiveType(a.type)]?.label || a.type, instructions: a.instructions, hints: a.hints })),
    },
    resources: {
      items: t.resources?.items || [],
      library: resources,
      sourceRefs: lesson.source_refs,
      extension: t.extension || [],
    },
    assess: {
      questions: t.assess?.questions || [],
      answerKeys: activities.map((a) => ({ id: a.id, title: a.title, phase: a.phase, type: a.type, config: a.config, key: a.answer_key })),
      rubric: t.assess?.rubric?.length ? t.assess.rubric : rubrics[0]?.rubric || [],
      misconceptions: [...(t.assess?.misconceptions || []), ...config.misconceptions.map((m) => ({ misconception: m.trigger, fix: m.correction }))],
      mappings,
    },
  };
  return { course: { id: course.id, title: course.title, status: course.status, age_min: course.age_min, age_max: course.age_max, theme: course.theme }, lesson: { ...lesson, teacher: undefined }, activities, panel, siblings };
}

export async function teachCourses() {
  return await all(
    `SELECT c.id,c.title,c.status,c.theme,s.name subject, (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id) lessons,
       (SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=c.id ORDER BY m.position,l.position LIMIT 1) first_lesson
     FROM courses c JOIN subjects s ON s.id=c.subject_id WHERE c.status IN ('published','approved','review','testing','draft') AND c.is_template=0 ORDER BY c.status='published' DESC, c.title`,
  );
}
