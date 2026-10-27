import { useEffect, useMemo, useState } from 'react';
import { api, useApi } from '../lib/api.ts';
import { Link, navigate } from '../lib/router.tsx';
import { useSession } from '../lib/session.tsx';
import { Button, Icon, Notice, Spinner } from '../components/ui.tsx';
import { VisualHook } from '../components/VisualHook.tsx';
import { ActivityRunner } from '../components/activities/index.tsx';
import { TutorDrawer } from '../components/TutorChat.tsx';
import type { GradeResult } from '../components/activities/types.ts';

type Phase = 'learn' | 'perform' | 'probe' | 'done';
const PHASES: { id: Phase; label: string; verb: string; icon: string }[] = [
  { id: 'learn', label: 'Learn', verb: 'Discover the idea', icon: 'bulb' },
  { id: 'perform', label: 'Perform', verb: 'Try it yourself', icon: 'play' },
  { id: 'probe', label: 'Probe', verb: 'Show your thinking', icon: 'search' },
];

export function LearnCards({ cards }: { cards: any[] }) {
  const [i, setI] = useState(0);
  if (!cards.length) return null;
  const c = cards[i];
  return (
    <div>
      <div key={i} className="kb-rise rounded-[var(--radius-card)] border border-line bg-card p-6 shadow-[var(--shadow-card)] sm:p-8" aria-live="polite">
        <div className="flex items-start gap-4">
          {c.emoji && (
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
              {c.emoji}
            </span>
          )}
          <div>
            {c.title && <h3 className="text-2xl font-black">{c.title}</h3>}
            <p className="mt-2 text-lg leading-relaxed">{c.body}</p>
            {c.sourceRef && <p className="mt-3 text-xs font-semibold text-muted">Source: {c.sourceRef}</p>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button size="sm" variant="ghost" icon="arrowL" disabled={i === 0} onClick={() => setI(i - 1)}>
          Back
        </Button>
        <div className="flex gap-1.5" role="tablist" aria-label="Learn cards">
          {cards.map((_, j) => (
            <button key={j} role="tab" aria-selected={j === i} aria-label={`Card ${j + 1}`} onClick={() => setI(j)} className={`h-2.5 rounded-full transition-all ${j === i ? 'w-7 bg-accent' : 'w-2.5 bg-line'}`} />
          ))}
        </div>
        <Button size="sm" variant="ghost" disabled={i === cards.length - 1} onClick={() => setI(i + 1)}>
          Next <Icon name="arrowR" size={15} />
        </Button>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['var(--accent)', 'var(--good)', 'var(--warn)', 'var(--teach)'];
  return (
    <div className="kb-confetti pointer-events-none absolute inset-x-0 top-0 h-0" aria-hidden>
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % 4], animationDelay: `${(i % 7) * 60}ms` }} />
      ))}
    </div>
  );
}

export function LessonPlayer({ id }: { id: string }) {
  const { me } = useSession();
  const { data, loading, error } = useApi<any>(`/api/lessons/${id}/learn`, [id]);
  const [phase, setPhase] = useState<Phase>('learn');
  const [results, setResults] = useState<Record<string, GradeResult>>({});
  const [step, setStep] = useState(0);
  const [tutor, setTutor] = useState<{ open: boolean; activity?: string | null }>({ open: false });

  useEffect(() => {
    if (!data) return;
    // restore best previous result per activity
    const r: Record<string, GradeResult> = {};
    for (const a of data.attempts) {
      const prev = r[a.activity_id];
      if (!prev || a.score >= prev.score) r[a.activity_id] = { score: a.score, correct: !!a.correct, feedback: a.feedback, needsReview: !!a.needs_review, maxScore: a.max_score };
    }
    setResults(r);
    setPhase(data.progress.status === 'completed' ? 'learn' : (data.progress.phase as Phase) || 'learn');
    setStep(0);
  }, [data]);

  const acts = useMemo(() => ({ perform: (data?.activities || []).filter((a: any) => a.phase === 'perform'), probe: (data?.activities || []).filter((a: any) => a.phase === 'probe') }), [data]);

  const goPhase = (p: Phase) => {
    setPhase(p);
    setStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (p !== 'done' && me?.user?.role === 'student') void api(`/api/lessons/${id}/phase`, { body: { phase: p } }).catch(() => {});
  };

  if (error) return <Notice tone="bad">{error}</Notice>;
  if (loading || !data) return <Spinner label="Opening lesson" />;
  const { lesson, course } = data;
  const isStaff = me?.user?.role === 'admin' || me?.user?.role === 'instructor';
  const list = phase === 'perform' ? acts.perform : phase === 'probe' ? acts.probe : [];
  const current = list[step];
  const allDone = data.activities.every((a: any) => results[a.id]);
  const score = Object.values(results).reduce((s, r) => s + r.score, 0);
  const max = data.activities.reduce((s: number, a: any) => s + a.points, 0);

  const nextStep = () => {
    if (step < list.length - 1) setStep(step + 1);
    else if (phase === 'perform') goPhase(acts.probe.length ? 'probe' : 'done');
    else goPhase('done');
  };

  return (
    <div data-theme-accent={course.theme} className="mx-auto max-w-3xl">
      {isStaff && course.status !== 'published' && (
        <Notice tone="teach" icon="eye" className="mb-4">
          Staff preview of a <strong>{course.status}</strong> course. Attempts are graded and saved under your staff account.
        </Notice>
      )}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <Icon name="arrowL" size={15} /> {course.title}
        </Link>
        <Button size="sm" variant="secondary" icon="sparkle" onClick={() => setTutor({ open: true, activity: current?.id })}>
          Helper
        </Button>
      </div>
      <h1 className="text-3xl leading-tight font-black sm:text-4xl">{lesson.title}</h1>
      <p className="mt-1 text-muted">🎯 {lesson.objective}</p>

      {/* Phase stepper */}
      <nav className="my-6 grid grid-cols-3 gap-2" aria-label="Lesson phases">
        {PHASES.map((p, i) => {
          const on = phase === p.id;
          const doneP = p.id === 'learn' ? phase !== 'learn' : (p.id === 'perform' ? acts.perform : acts.probe).every((a: any) => results[a.id]) && (p.id === 'perform' ? acts.perform : acts.probe).length > 0;
          return (
            <button key={p.id} onClick={() => goPhase(p.id)} aria-current={on ? 'step' : undefined} className={`rounded-2xl border-2 px-3 py-2.5 text-left transition ${on ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:border-accent/40'}`}>
              <span className="flex items-center gap-2 text-xs font-bold text-muted">
                <span className={`grid size-5 place-items-center rounded-full text-[10px] ${doneP ? 'bg-good text-white' : on ? 'bg-accent text-white' : 'bg-sunk'}`}>{doneP ? '✓' : i + 1}</span>
                {p.label}
              </span>
              <span className="mt-0.5 hidden text-sm font-semibold sm:block">{p.verb}</span>
            </button>
          );
        })}
      </nav>

      {phase === 'learn' && (
        <div className="space-y-6">
          <VisualHook hook={lesson.hook} />
          <LearnCards cards={lesson.learn.cards || []} />
          <div className="flex justify-end">
            <Button variant="primary" size="lg" onClick={() => goPhase(acts.perform.length ? 'perform' : 'probe')}>
              I’m ready to try <Icon name="arrowR" />
            </Button>
          </div>
        </div>
      )}

      {(phase === 'perform' || phase === 'probe') && (
        <div className="space-y-4">
          {list.length > 1 && (
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              {list.map((a: any, i: number) => (
                <button key={a.id} onClick={() => setStep(i)} aria-label={`Activity ${i + 1}: ${a.title}`} className={`grid size-8 place-items-center rounded-full text-xs font-black ${i === step ? 'bg-ink text-paper' : results[a.id]?.correct ? 'bg-good text-white' : results[a.id] ? 'bg-teach-soft text-teach' : 'bg-sunk'}`}>
                  {results[a.id]?.correct ? '✓' : i + 1}
                </button>
              ))}
              <span className="ml-1">
                {step + 1} of {list.length}
              </span>
            </div>
          )}
          {current ? (
            <ActivityRunner
              key={current.id}
              activity={current}
              previous={results[current.id]}
              consentAudio={!!me?.consent?.audio}
              preview={isStaff}
              onGraded={(r) => setResults((x) => ({ ...x, [current.id]: x[current.id] && x[current.id].score > r.score ? { ...x[current.id] } : r }))}
              onAskTutor={(aid) => setTutor({ open: true, activity: aid })}
            />
          ) : (
            <Notice>No activities in this phase.</Notice>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" icon="arrowL" onClick={() => (step > 0 ? setStep(step - 1) : goPhase(phase === 'probe' ? 'perform' : 'learn'))}>
              Back
            </Button>
            <Button variant={current && results[current.id] ? 'primary' : 'secondary'} onClick={nextStep}>
              {step < list.length - 1 ? 'Next activity' : phase === 'perform' ? 'On to Probe' : 'Finish lesson'} <Icon name="arrowR" />
            </Button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card p-8 text-center shadow-[var(--shadow-card)]">
          {allDone && <Confetti />}
          <div className="text-6xl" aria-hidden>
            {allDone ? '🎉' : '🧭'}
          </div>
          <h2 className="mt-3 text-3xl font-black">{allDone ? 'Lesson complete!' : 'Nearly there!'}</h2>
          <p className="mt-2 text-muted">
            {allDone ? `You scored ${score} of ${max} points. Your written answers go to your teacher for feedback.` : `You’ve done ${Object.keys(results).length} of ${data.activities.length} activities. Finish the rest to complete the lesson.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!allDone && (
              <Button variant="secondary" onClick={() => goPhase(data.activities.find((a: any) => !results[a.id])?.phase || 'perform')}>
                Finish remaining activities
              </Button>
            )}
            {data.next ? (
              <Button variant="primary" size="lg" icon="play" onClick={() => navigate(`/lessons/${data.next.id}`)}>
                Next: {data.next.title}
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={() => navigate(`/courses/${course.slug}`)}>
                Back to course
              </Button>
            )}
          </div>
        </div>
      )}

      <TutorDrawer open={tutor.open} onClose={() => setTutor({ open: false })} courseId={course.id} lessonId={lesson.id} activityId={tutor.activity} consentAi={!!me?.consent?.ai} />
    </div>
  );
}
