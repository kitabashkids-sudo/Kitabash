import { useEffect, useState } from 'react';
import { api, useApi } from '../../lib/api.ts';
import { navigate } from '../../lib/router.tsx';
import { Badge, Button, Card, Empty, Field, Icon, Input, Modal, Notice, Select, StatusPill, Textarea, toast } from '../../components/ui.tsx';
import { VisualHook } from '../../components/VisualHook.tsx';
import { KeyView } from '../../components/ResourcePanel.tsx';
import { StepHeader } from './Studio.tsx';

function JsonField({ label, value, onChange, rows = 8, hint }: { label: string; value: any; onChange: (v: any, ok: boolean) => void; rows?: number; hint?: string }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [bad, setBad] = useState('');
  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [JSON.stringify(value)]);
  return (
    <Field label={label} hint={bad ? <span className="text-bad">{bad}</span> : hint}>
      <textarea
        value={text}
        rows={rows}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const v = JSON.parse(e.target.value);
            setBad('');
            onChange(v, true);
          } catch (x) {
            setBad(`Invalid JSON: ${(x as Error).message}`);
            onChange(null, false);
          }
        }}
        className={`w-full rounded-xl border bg-paper p-3 font-mono text-xs ${bad ? 'border-bad' : 'border-line'} focus:outline-none`}
      />
    </Field>
  );
}

function ActivityEditor({ lessonId, activity, types, onClose, onSaved }: { lessonId: string; activity: any | null; types: any[]; onClose: () => void; onSaved: () => void }) {
  const runnable = types.filter((t) => t.availability !== 'extension-required');
  const [a, setA] = useState<any>(activity || { phase: 'perform', type: 'multiple_choice', title: '', instructions: '', config: {}, answer_key: {}, hints: [], points: 10 });
  const [valid, setValid] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const meta = types.find((t) => t.type === a.type);
  const example = (types.find((t) => t.type === (meta?.rendersAs || a.type)) || meta)?.example;
  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      const body = { phase: a.phase, type: a.type, title: a.title, instructions: a.instructions, config: a.config, answer_key: a.answer_key, hints: (a.hints || []).filter((h: string) => h.trim()), points: Number(a.points) || 10 };
      if (activity) await api(`/api/admin/activities/${activity.id}`, { method: 'PUT', body });
      else await api(`/api/admin/lessons/${lessonId}/activities`, { body });
      toast('Activity saved');
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Phase">
          <Select value={a.phase} onChange={(e) => setA({ ...a, phase: e.target.value })}>
            <option value="perform">Perform</option>
            <option value="probe">Probe</option>
          </Select>
        </Field>
        <Field label="Activity type" className="sm:col-span-2">
          <Select value={a.type} onChange={(e) => setA({ ...a, type: e.target.value })}>
            {runnable.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
                {t.availability === 'configurable' ? ' (preset)' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {meta && <p className="rounded-xl bg-sunk p-3 text-xs text-muted">{meta.description} · Completion: {meta.completion}</p>}
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <Field label="Title">
          <Input value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} />
        </Field>
        <Field label="Points">
          <Input type="number" min={0} max={100} value={a.points} onChange={(e) => setA({ ...a, points: e.target.value })} />
        </Field>
      </div>
      <Field label="Student instructions">
        <Input value={a.instructions} onChange={(e) => setA({ ...a, instructions: e.target.value })} />
      </Field>
      {example && (
        <Button size="sm" variant="ghost" icon="copy" onClick={() => setA({ ...a, config: example.config, answer_key: example.answer_key, hints: a.hints?.length ? a.hints : example.hints })}>
          Insert example configuration
        </Button>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <JsonField label="Configuration (student-visible)" value={a.config} onChange={(v, ok) => (setValid(ok), ok && setA((x: any) => ({ ...x, config: v })))} rows={12} />
        <JsonField label="Answer key (protected)" value={a.answer_key} onChange={(v, ok) => (setValid(ok), ok && setA((x: any) => ({ ...x, answer_key: v })))} rows={12} hint="Never sent to students; grading happens on the server." />
      </div>
      <Field label="Hints (one per line, revealed one at a time)">
        <Textarea value={(a.hints || []).join('\n')} onChange={(e) => setA({ ...a, hints: e.target.value.split('\n') })} />
      </Field>
      {err && <Notice tone="bad">{err}</Notice>}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" busy={busy} disabled={!valid || !a.title} onClick={save}>
          Save activity
        </Button>
      </div>
    </div>
  );
}

function LessonEditor({ lesson, types, reload, locked }: { lesson: any; types: any[]; reload: () => void; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [l, setL] = useState<any>(lesson);
  const [teacherOk, setTeacherOk] = useState(true);
  const [edit, setEdit] = useState<any | null | undefined>(undefined);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: presets } = useApi<any>(open ? '/api/activity-types' : null, [open]);
  const { data: assets } = useApi<any[]>(open ? '/api/admin/assets' : null, [open]);
  useEffect(() => {
    setL(lesson);
  }, [lesson]);
  const saveLesson = async () => {
    setBusy(true);
    setErr('');
    try {
      await api(`/api/admin/lessons/${lesson.id}`, { method: 'PATCH', body: { title: l.title, objective: l.objective, duration_minutes: Number(l.duration_minutes) || 20, learn: l.learn, hook: l.hook, teacher: l.teacher } });
      toast('Lesson saved');
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const setStatus = async (status: string) => {
    setErr('');
    try {
      await api(`/api/admin/lessons/${lesson.id}/status`, { body: { status } });
      toast(`Lesson ${status === 'approved' ? 'approved' : status === 'review' ? 'sent for review' : 'moved to draft'}`);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const cards = l.learn?.cards || [];
  const setCards = (c: any[]) => setL({ ...l, learn: { ...l.learn, cards: c } });
  const hook = l.hook || {};
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
        <Icon name={open ? 'down' : 'arrowR'} size={16} className="text-muted" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{lesson.title}</p>
          <p className="truncate text-xs text-muted">
            {lesson.activities.length} activities · {cards.length} learn cards {lesson.generated && '· AI/generator draft'}
          </p>
        </div>
        {lesson.generated && <Badge tone="teach">generated</Badge>}
        <StatusPill status={lesson.status} />
      </button>
      {open && (
        <div className="space-y-5 border-t border-line p-5">
          <fieldset disabled={locked} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <Field label="Lesson title">
                <Input value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} />
              </Field>
              <Field label="Learning objective">
                <Input value={l.objective} onChange={(e) => setL({ ...l, objective: e.target.value })} />
              </Field>
              <Field label="Minutes">
                <Input type="number" value={l.duration_minutes} onChange={(e) => setL({ ...l, duration_minutes: e.target.value })} />
              </Field>
            </div>

            <section>
              <h4 className="mb-2 text-sm font-bold">Learn — explanation cards</h4>
              <div className="space-y-2">
                {cards.map((c: any, i: number) => (
                  <div key={i} className="grid gap-2 rounded-2xl bg-sunk p-3 sm:grid-cols-[60px_1fr_auto]">
                    <Input value={c.emoji || ''} onChange={(e) => setCards(cards.map((x: any, j: number) => (j === i ? { ...x, emoji: e.target.value } : x)))} aria-label="Emoji" placeholder="💡" />
                    <div className="space-y-2">
                      <Input value={c.title || ''} placeholder="Card title" onChange={(e) => setCards(cards.map((x: any, j: number) => (j === i ? { ...x, title: e.target.value } : x)))} aria-label="Card title" />
                      <Textarea value={c.body} className="min-h-[60px]" onChange={(e) => setCards(cards.map((x: any, j: number) => (j === i ? { ...x, body: e.target.value } : x)))} aria-label="Card text" />
                      {c.sourceRef && <p className="text-xs text-muted">Source: {c.sourceRef}</p>}
                    </div>
                    <Button size="sm" variant="ghost" icon="trash" aria-label="Remove card" onClick={() => setCards(cards.filter((_: any, j: number) => j !== i))} />
                  </div>
                ))}
                <Button size="sm" icon="plus" onClick={() => setCards([...cards, { title: '', body: '', emoji: '💡' }])}>
                  Add card
                </Button>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-bold">3-second visual hook</h4>
                <Field label="Type">
                  <Select value={hook.kind === 'preset' || !hook.kind ? `preset:${hook.preset || ''}` : `${hook.kind}`} onChange={(e) => {
                    const [k, p] = e.target.value.split(':');
                    const preset = presets?.hookPresets.find((x: any) => x.id === p);
                    setL({ ...l, hook: k === 'preset' ? { ...hook, kind: 'preset', preset: p, params: preset ? JSON.parse(preset.params) : hook.params } : { ...hook, kind: k, preset: undefined } });
                  }}>
                    {presets?.hookPresets.map((p: any) => (
                      <option key={p.id} value={`preset:${p.id}`}>
                        Animation: {p.label}
                      </option>
                    ))}
                    <option value="video">Video from media library</option>
                    <option value="image">Image / SVG from media library</option>
                    <option value="none">No hook</option>
                  </Select>
                </Field>
                {hook.kind === 'video' || hook.kind === 'image' || hook.kind === 'svg' ? (
                  <Field label="Media asset">
                    <Select value={hook.assetId || ''} onChange={(e) => setL({ ...l, hook: { ...hook, assetId: e.target.value } })}>
                      <option value="">Choose…</option>
                      {assets?.filter((a) => (hook.kind === 'video' ? a.kind === 'video' : a.kind !== 'video' && a.kind !== 'audio')).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : hook.kind !== 'none' ? (
                  <JsonField label="Animation parameters" value={hook.params || {}} rows={4} onChange={(v, ok) => ok && setL((x: any) => ({ ...x, hook: { ...x.hook, params: v } }))} />
                ) : null}
                <Field label="Caption (always shown)">
                  <Input value={hook.caption || ''} onChange={(e) => setL({ ...l, hook: { ...hook, caption: e.target.value } })} />
                </Field>
                <Field label="Text alternative (screen readers)">
                  <Input value={hook.alt || ''} onChange={(e) => setL({ ...l, hook: { ...hook, alt: e.target.value } })} />
                </Field>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-bold">Preview</h4>
                <VisualHook hook={hook} compact />
              </div>
            </section>

            <details className="rounded-2xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-bold">Teacher resource panel content (Teach · Show · Facilitate · Resources · Assess)</summary>
              <p className="mt-2 mb-3 text-xs text-muted">Answer keys, activity guides, the knowledge library and the agent’s misconceptions are added to the panel automatically — you only author the extras here.</p>
              <JsonField label="Teacher content (JSON)" value={l.teacher} rows={16} onChange={(v, ok) => (setTeacherOk(ok), ok && setL((x: any) => ({ ...x, teacher: v })))} />
            </details>
          </fieldset>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold">Activities (Perform & Probe)</h4>
              {!locked && (
                <Button size="sm" icon="plus" onClick={() => setEdit(null)}>
                  Add activity
                </Button>
              )}
            </div>
            <ul className="space-y-2">
              {lesson.activities.map((a: any) => (
                <li key={a.id} className="rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{a.phase}</Badge>
                    <Badge tone="teach">{types.find((t) => t.type === a.type)?.label || a.type}</Badge>
                    <span className="min-w-0 flex-1 truncate font-semibold">{a.title}</span>
                    <span className="text-xs text-muted">{a.points} pts</span>
                    {!locked && (
                      <>
                        <Button size="sm" variant="ghost" icon="edit" onClick={() => setEdit(a)} aria-label={`Edit ${a.title}`} />
                        <Button size="sm" variant="ghost" icon="trash" aria-label={`Delete ${a.title}`} onClick={async () => confirm('Delete this activity?') && (await api(`/api/admin/activities/${a.id}`, { method: 'DELETE' }), reload())} />
                      </>
                    )}
                  </div>
                  <div className="mt-2 rounded-xl bg-sunk p-2.5 text-xs">
                    <KeyView type={a.type} config={a.config} keyData={a.answer_key} />
                  </div>
                </li>
              ))}
              {!lesson.activities.length && <p className="text-sm text-muted">No activities yet.</p>}
            </ul>
          </section>

          {err && <Notice tone="bad">{err}</Notice>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon="eye" onClick={() => navigate(`/lessons/${lesson.id}`)}>
                Preview as student
              </Button>
              <Button size="sm" icon="screen" onClick={() => navigate(`/teach/lessons/${lesson.id}`)}>
                Teacher view
              </Button>
            </div>
            {!locked && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="danger" icon="trash" onClick={async () => confirm('Delete this lesson?') && (await api(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' }), reload())}>
                  Delete
                </Button>
                <Button size="sm" busy={busy} disabled={!teacherOk} onClick={saveLesson}>
                  Save lesson
                </Button>
                {lesson.status === 'draft' && <Button size="sm" onClick={() => setStatus('review')}>Send for review</Button>}
                {lesson.status !== 'approved' && (
                  <Button size="sm" variant="good" icon="check" onClick={() => setStatus('approved')}>
                    Approve
                  </Button>
                )}
                {lesson.status !== 'draft' && <Button size="sm" variant="ghost" onClick={() => setStatus('draft')}>Back to draft</Button>}
              </div>
            )}
          </div>
        </div>
      )}
      <Modal open={edit !== undefined} onClose={() => setEdit(undefined)} title={edit ? 'Edit activity' : 'New activity'} wide>
        {edit !== undefined && <ActivityEditor lessonId={lesson.id} activity={edit} types={types} onClose={() => setEdit(undefined)} onSaved={reload} />}
      </Modal>
    </Card>
  );
}

export function CurriculumStep({ courseId, data, reload, locked, next }: { courseId: string; data: any; reload: () => void; locked: boolean; next: () => void }) {
  const { data: typeData } = useApi<any>('/api/activity-types');
  const [busy, setBusy] = useState(false);
  const [per, setPer] = useState(3);
  const [replace, setReplace] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const generate = async () => {
    setBusy(true);
    setErr('');
    setResult(null);
    try {
      const r = await api<any>(`/api/admin/courses/${courseId}/generate`, { body: { lessonsPerModule: per, replaceDrafts: replace } });
      setResult(r);
      toast(`Drafted ${r.lessons} lessons and ${r.activities} activities`);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const types = typeData?.types || [];
  const lessons = data.modules.flatMap((m: any) => m.lessons);
  return (
    <div className="space-y-5">
      <StepHeader n={4} title="Generate & edit the curriculum" actions={<Button variant="primary" onClick={next}>Next: test the agent <Icon name="arrowR" /></Button>}>
        Drafts one Learn → Perform → Probe lesson per objective, grounded in your knowledge library, with activities, answer keys, hints, a visual hook concept and the teacher panel. Everything stays a <strong>draft</strong> until you approve it.
      </StepHeader>
      {!locked && (
        <Card className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Lessons per module">
              <Select value={per} onChange={(e) => setPer(Number(e.target.value))} className="!w-28">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </Select>
            </Field>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace earlier unapproved generated drafts
            </label>
            <Button variant="primary" icon="sparkle" busy={busy} onClick={generate} className="ml-auto">
              Generate drafts from {data.course.objectives.length} objective{data.course.objectives.length === 1 ? '' : 's'}
            </Button>
          </div>
          {result?.warnings?.map((w: string) => (
            <Notice key={w} tone="warn" className="mt-3">
              {w}
            </Notice>
          ))}
          {err && <Notice tone="bad" className="mt-3">{err}</Notice>}
        </Card>
      )}
      {data.modules.length === 0 ? (
        <Empty title="No lessons yet" icon="layers">
          Generate drafts above, or add a module and write lessons by hand.
        </Empty>
      ) : (
        data.modules.map((m: any) => (
          <section key={m.id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-bold">{m.title}</h3>
              {!locked && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" icon="plus" onClick={async () => { const t = prompt('Lesson title'); if (t) { await api(`/api/admin/modules/${m.id}/lessons`, { body: { title: t } }); reload(); } }}>
                    Lesson
                  </Button>
                  <Button size="sm" variant="ghost" icon="trash" aria-label="Delete module" onClick={async () => confirm(`Delete module “${m.title}” and its lessons?`) && (await api(`/api/admin/modules/${m.id}`, { method: 'DELETE' }), reload())} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              {m.lessons.map((l: any) => (
                <LessonEditor key={l.id} lesson={l} types={types} reload={reload} locked={locked} />
              ))}
            </div>
          </section>
        ))
      )}
      {!locked && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!moduleTitle.trim()) return;
            await api(`/api/admin/courses/${courseId}/modules`, { body: { title: moduleTitle } });
            setModuleTitle('');
            reload();
          }}
        >
          <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="New module title" aria-label="New module title" className="!w-72" />
          <Button icon="plus">Add module</Button>
        </form>
      )}
      {lessons.length > 0 && (
        <p className="text-sm text-muted">
          {lessons.filter((l: any) => l.status === 'approved').length} of {lessons.length} lessons approved. Only approved lessons are shown to learners.
        </p>
      )}
    </div>
  );
}
