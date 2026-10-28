import { UpcomingClasses } from './Classes.tsx';
import { useEffect, useState } from 'react';
import { api, useApi } from '../lib/api.ts';
import { Link, navigate } from '../lib/router.tsx';
import { Badge, Button, Card, Empty, Icon, Notice, PageHeader, Spinner, StatusPill, Textarea, Input, toast } from '../components/ui.tsx';
import { ResourcePanel, KeyView } from '../components/ResourcePanel.tsx';
import { VisualHook } from '../components/VisualHook.tsx';
import { LearnCards } from './LessonPlayer.tsx';
import { ActivityRunner } from '../components/activities/index.tsx';

export function TeachHome() {
  const { data, loading } = useApi<any[]>('/api/teach/courses');
  if (loading || !data) return <Spinner />;
  return (
    <>
      <PageHeader eyebrow="Teach" title="Ready-to-teach lessons">
        Open any lesson to get the teaching workspace: the activity in the centre, everything you need on the right — explanations, demos, prompts, answer keys and an AI co-facilitator.
      </PageHeader>
      <UpcomingClasses title="Your live classes" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <Card key={c.id} className="flex flex-col p-5" data-theme-accent={c.theme}>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="accent">{c.subject}</Badge>
              <StatusPill status={c.status} />
            </div>
            <h3 className="mt-2 text-lg leading-snug font-bold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted">{c.lessons} lessons</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {c.first_lesson ? (
                <Button size="sm" variant="teach" icon="screen" onClick={() => navigate(`/teach/lessons/${c.first_lesson}`)}>
                  Teach
                </Button>
              ) : (
                <span className="text-sm text-muted">No lessons yet</span>
              )}
              <Button size="sm" icon="chart" onClick={() => navigate(`/teach/courses/${c.id}/report`)}>
                Progress
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function TeachLesson({ id }: { id: string }) {
  const { data, loading, error } = useApi<any>(`/api/teach/lessons/${id}`, [id]);
  const [panel, setPanel] = useState(true);
  const [projection, setProjection] = useState(false);
  const [phase, setPhase] = useState<'learn' | 'perform' | 'probe'>('learn');
  const [showKeys, setShowKeys] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('projection', projection);
    if (projection) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    return () => document.documentElement.classList.remove('projection');
  }, [projection]);
  useEffect(() => {
    const onFs = () => !document.fullscreenElement && setProjection(false);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  useEffect(() => {
    setPhase('learn');
  }, [id]);

  if (error) return <Notice tone="bad">{error}</Notice>;
  if (loading || !data) return <Spinner label="Preparing your workspace" />;
  const { lesson, course, activities, siblings } = data;
  const idx = siblings.findIndex((s: any) => s.id === id);
  const list = activities.filter((a: any) => a.phase === phase);

  return (
    <div data-theme-accent={course.theme} className="-mx-4 -my-8 flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* Teacher toolbar */}
      <div className="hide-in-projection flex flex-wrap items-center gap-2 border-b border-line bg-card px-4 py-2">
        <Link to="/teach" className="text-sm font-semibold text-muted hover:text-ink">
          <Icon name="arrowL" size={15} /> Teach
        </Link>
        <span className="text-muted">/</span>
        <span className="truncate text-sm font-bold">{course.title}</span>
        <select aria-label="Jump to lesson" value={id} onChange={(e) => navigate(`/teach/lessons/${e.target.value}`)} className="h-8 max-w-[220px] rounded-full border border-line bg-paper px-3 text-sm">
          {siblings.map((s: any, i: number) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.title} {s.status !== 'approved' ? `(${s.status})` : ''}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" variant="ghost" icon="arrowL" disabled={idx <= 0} onClick={() => navigate(`/teach/lessons/${siblings[idx - 1].id}`)} aria-label="Previous lesson" />
          <Button size="sm" variant="ghost" icon="arrowR" disabled={idx >= siblings.length - 1} onClick={() => navigate(`/teach/lessons/${siblings[idx + 1].id}`)} aria-label="Next lesson" />
          <Button size="sm" icon="eye" onClick={() => window.open(`/lessons/${id}`, '_blank', 'noopener')}>
            Student preview
          </Button>
          <Button size="sm" icon="screen" onClick={() => setProjection(true)}>
            Project
          </Button>
          <Button size="sm" variant={panel ? 'teach' : 'secondary'} icon="panel" aria-pressed={panel} onClick={() => setPanel(!panel)}>
            Panel
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Central activity area */}
        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {projection && (
            <button onClick={() => setProjection(false)} className="fixed top-3 right-3 z-50 rounded-full bg-ink/80 px-3 py-1.5 text-sm font-bold text-paper">
              Exit projection
            </button>
          )}
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-black sm:text-4xl">{lesson.title}</h1>
            <p className="mt-1 text-muted">🎯 {lesson.objective}</p>
            <div className="my-5 flex gap-2" role="tablist" aria-label="Lesson phase">
              {(['learn', 'perform', 'probe'] as const).map((p, i) => (
                <button key={p} role="tab" aria-selected={phase === p} onClick={() => setPhase(p)} className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-display font-black capitalize ${phase === p ? 'border-accent bg-accent-soft' : 'border-line bg-card'}`}>
                  {i + 1}. {p}
                </button>
              ))}
            </div>
            {phase === 'learn' ? (
              <div className="space-y-6">
                <VisualHook hook={lesson.hook} />
                <LearnCards cards={lesson.learn.cards || []} />
              </div>
            ) : (
              <div className="space-y-6">
                {list.map((a: any) => (
                  <div key={a.id}>
                    <ActivityRunner activity={a} preview consentAudio />
                    {showKeys && !projection && (
                      <div className="hide-in-projection mt-2 rounded-2xl border-2 border-dashed border-warn bg-warn-soft p-3 text-sm">
                        <p className="mb-1 flex items-center gap-1 text-xs font-bold">
                          <Icon name="lock" size={12} /> Answer key (teacher only)
                        </p>
                        <KeyView type={a.type} config={a.config} keyData={a.answer_key} />
                      </div>
                    )}
                  </div>
                ))}
                {!list.length && <Empty title={`No ${phase} activities`} />}
              </div>
            )}
          </div>
        </section>

        {/* Persistent right resource panel (desktop) / drawer (mobile) */}
        {panel && !projection && (
          <aside className="hide-in-projection fixed inset-x-0 bottom-0 z-30 h-[60dvh] rounded-t-[var(--radius-card)] border-t border-line bg-card shadow-[var(--shadow-pop)] lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100dvh-4rem-45px)] lg:w-[400px] lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none xl:w-[440px]" aria-label="Teacher resource panel">
            <ResourcePanel data={data} onShowAnswers={setShowKeys} />
          </aside>
        )}
      </div>
    </div>
  );
}

export function CourseReport({ id }: { id: string }) {
  const { data, loading, reload } = useApi<any>(`/api/teach/courses/${id}/report`, [id]);
  const [fb, setFb] = useState<Record<string, { comment: string; score: string }>>({});
  if (loading || !data) return <Spinner />;
  const send = async (aid: string) => {
    const f = fb[aid];
    if (!f?.comment?.trim()) return;
    await api(`/api/teach/attempts/${aid}/feedback`, { body: { comment: f.comment, score: f.score === '' || f.score === undefined ? undefined : Number(f.score) } });
    toast('Feedback saved');
    await reload();
  };
  return (
    <>
      <PageHeader eyebrow="Progress report" title={data.course.title} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Learners</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-2">Name</th>
                <th>Lessons done</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.learners.map((l: any) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="py-2 font-semibold">{l.name}</td>
                  <td>{l.completed}</td>
                  <td>{l.max ? `${l.score}/${l.max} (${Math.round((l.score / l.max) * 100)}%)` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Activity difficulty</h2>
          <ul className="space-y-2 text-sm">
            {data.activityStats.map((a: any) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate">
                  {a.lesson} · <strong>{a.title}</strong>
                </span>
                <span className="w-28 shrink-0">
                  <span className="block h-2 overflow-hidden rounded-full bg-sunk">
                    <span className="block h-full bg-good" style={{ width: `${a.pct_correct || 0}%` }} />
                  </span>
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-muted">{a.attempts ? `${a.pct_correct}% · ${a.attempts} tries` : 'no tries'}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <h2 className="mt-8 mb-3 text-xl font-bold">Written answers to review ({data.reviewQueue.length})</h2>
      {data.reviewQueue.length === 0 && <Empty title="All caught up" icon="check" />}
      <div className="space-y-3">
        {data.reviewQueue.map((r: any) => (
          <Card key={r.id} className="p-5">
            <p className="text-xs font-bold text-muted">
              {r.learner} · {r.lesson} · {r.activity}
            </p>
            {r.prompt && <p className="mt-1 text-sm text-muted">Q: {r.prompt}</p>}
            <p className="mt-2 rounded-xl bg-sunk p-3">{r.response?.text || (r.response?.offline ? 'Practised on paper' : JSON.stringify(r.response))}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <Textarea className="min-h-[44px]" placeholder="Encouraging feedback…" value={fb[r.id]?.comment || ''} onChange={(e) => setFb({ ...fb, [r.id]: { ...fb[r.id], comment: e.target.value } })} aria-label="Feedback" />
              <Input type="number" min={0} max={r.max_score} placeholder={`Score /${r.max_score}`} value={fb[r.id]?.score ?? ''} onChange={(e) => setFb({ ...fb, [r.id]: { ...fb[r.id], score: e.target.value } })} aria-label="Score override" />
              <Button variant="teach" onClick={() => send(r.id)}>
                Send
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
