// Client side of the activity engine: maps a registered type to its component,
// and wraps every activity with the same hint ladder, submit, feedback and retry UX.
import { useEffect, useState, type ComponentType } from 'react';
import { api } from '../../lib/api.ts';
import { Button, Icon, Notice, Badge } from '../ui.tsx';
import { MultipleChoice, FillBlank, Ordering, Matching, Categorize, FreeResponse } from './basic.tsx';
import { BudgetSim, Tracing, Speaking } from './rich.tsx';
import { BlockCode, CodeLabActivity, Project, PythonLabActivity } from './coding.tsx';
import type { ActivityData, ActivityProps, GradeResult } from './types.ts';

interface ClientType {
  Component: ComponentType<ActivityProps>;
  ready: (v: any, a: ActivityData) => boolean;
}

export const CLIENT_TYPES: Record<string, ClientType> = {
  multiple_choice: { Component: MultipleChoice, ready: (v) => v?.selected?.length > 0 },
  code_output: { Component: MultipleChoice, ready: (v) => v?.selected?.length > 0 },
  fill_blank: { Component: FillBlank, ready: (v, a) => [...String(a.config.text).matchAll(/\[\[(\w+)\]\]/g)].every((m) => (v?.answers?.[m[1]] || '').trim()) },
  ordering: { Component: Ordering, ready: (v) => !!v?.order },
  matching: { Component: Matching, ready: (v, a) => a.config.left.every((l: any) => v?.pairs?.[l.id]) },
  categorize: { Component: Categorize, ready: (v, a) => a.config.items.every((i: any) => v?.placement?.[i.id]) },
  budget_sim: { Component: BudgetSim, ready: (v) => v?.chosen?.length > 0 },
  tracing: { Component: Tracing, ready: (v) => v?.offline || v?.strokes?.flat().length > 3 },
  speaking: { Component: Speaking, ready: (v) => Object.values(v?.selfCheck || {}).some(Boolean) },
  block_code: { Component: BlockCode, ready: (v) => (v?.program?.blocks?.length || 0) > 0 },
  code_lab: { Component: CodeLabActivity, ready: (v) => !!v?.project?.sprites?.some((s: any) => s.scripts?.some((sc: any) => sc.blocks?.length)) },
  python_lab: { Component: PythonLabActivity, ready: (v) => !!(v?.code || '').trim() },
  project: { Component: Project, ready: (v) => !!v && (Object.values(v.done || {}).some(Boolean) || !!v.url || !!v.offline || !!(v.reflection || '').trim()) },
  free_response: { Component: FreeResponse, ready: (v, a) => (v?.text || '').trim().split(/\s+/).filter(Boolean).length >= (a.config.minWords || 5) },
};

const CELEBRATE = ['Brilliant!', 'You nailed it!', 'Superb thinking!', 'Spot on!', 'Great work!'];

export function ActivityRunner({
  activity,
  previous,
  onGraded,
  consentAudio,
  preview,
  onAskTutor,
}: {
  activity: ActivityData;
  previous?: GradeResult | null;
  onGraded?: (r: GradeResult) => void;
  consentAudio?: boolean;
  preview?: boolean; // staff preview: still graded server-side, flagged as preview
  onAskTutor?: (activityId: string) => void;
}) {
  const t = CLIENT_TYPES[activity.type];
  const [value, setValue] = useState<any>(null);
  const [result, setResult] = useState<GradeResult | null>(previous || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const locked = !!result && !busy && (result.correct || result.needsReview);

  useEffect(() => {
    if (!activity.config.timerSeconds || result) return;
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(i);
  }, [activity.config.timerSeconds, result, startedAt]);

  if (!t) return <Notice tone="warn">This activity type (“{activity.type}”) needs a developer-built component and can’t run yet.</Notice>;

  const submit = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api<GradeResult>(`/api/activities/${activity.id}/attempt`, { body: { response: value, hintsUsed: hintsShown } });
      setResult(r);
      onGraded?.(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const retry = () => {
    setResult(null);
  };

  const { Component } = t;
  const timeLimit = activity.config.timerSeconds as number | undefined;
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby={`act-${activity.id}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`act-${activity.id}`} className="text-xl font-bold">
            {activity.title}
          </h3>
          {activity.instructions && <p className="mt-0.5 text-sm text-muted">{activity.instructions}</p>}
        </div>
        <div className="flex items-center gap-2">
          {timeLimit && !result && (
            <button onClick={() => setShowTimer((s) => !s)} className="rounded-full bg-sunk px-2.5 py-1 text-xs font-bold text-muted" aria-label={showTimer ? 'Hide timer' : 'Show timer'}>
              {showTimer ? `⏱ ${elapsed}s / ${timeLimit}s (optional)` : '⏱ show'}
            </button>
          )}
          <Badge tone="accent">{activity.points} pts</Badge>
        </div>
      </header>

      <Component activity={activity} value={value} setValue={setValue} locked={locked || busy} result={result} consentAudio={consentAudio} />

      {hintsShown > 0 && (
        <ol className="mt-4 space-y-2" aria-label="Hints">
          {activity.hints.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="kb-rise flex gap-2 rounded-2xl bg-warn-soft px-4 py-2.5 text-sm">
              <Icon name="bulb" className="mt-0.5 text-warn" />
              <span>
                <strong>Hint {i + 1}:</strong> {h}
              </span>
            </li>
          ))}
        </ol>
      )}

      {result && (
        <div className="kb-rise mt-4" aria-live="polite">
          <Notice tone={result.correct ? 'good' : result.needsReview ? 'teach' : 'warn'} icon={result.correct ? 'check' : result.needsReview ? 'eye' : 'bulb'}>
            <p className="font-bold">{result.correct ? CELEBRATE[activity.id.charCodeAt(2) % CELEBRATE.length] : result.needsReview ? 'Sent to your teacher' : 'Almost — have another go!'}</p>
            <p className="mt-0.5">{result.feedback}</p>
            <p className="mt-1 text-xs text-muted">
              Score {result.score}/{result.maxScore ?? activity.points}
              {preview && ' · staff preview (recorded under your account)'}
            </p>
          </Notice>
        </div>
      )}
      {err && <Notice tone="bad" className="mt-4">{err}</Notice>}

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {activity.hints.length > 0 && hintsShown < activity.hints.length && !locked && (
            <Button size="sm" variant="ghost" icon="bulb" onClick={() => setHintsShown((n) => n + 1)}>
              {hintsShown ? 'Another hint' : 'Hint'}
            </Button>
          )}
          {onAskTutor && !locked && (
            <Button size="sm" variant="ghost" icon="chat" onClick={() => onAskTutor(activity.id)}>
              Ask the helper
            </Button>
          )}
        </div>
        {result && !locked ? (
          <Button variant="primary" icon="refresh" onClick={retry}>
            Try again
          </Button>
        ) : !locked ? (
          <Button variant="primary" icon="check" busy={busy} disabled={!t.ready(value, activity)} onClick={submit}>
            Check
          </Button>
        ) : null}
      </footer>
    </section>
  );
}
