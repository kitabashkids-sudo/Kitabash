// Agent Training Studio — 7-step wizard per course (+ board mapping).
import { useEffect, useState } from 'react';
import { api, useApi } from '../../lib/api.ts';
import { Link, navigate, useRoute } from '../../lib/router.tsx';
import { Badge, Button, Card, Field, Icon, Input, ListEditor, Notice, Select, Spinner, StatusPill, Textarea, toast } from '../../components/ui.tsx';
import { KnowledgeStep } from './Knowledge.tsx';
import { AgentStep } from './AgentConfig.tsx';
import { CurriculumStep } from './Curriculum.tsx';
import { TestStep } from './Testing.tsx';
import { MappingStep } from './Mapping.tsx';

const STEPS = [
  { id: 'profile', label: 'Course profile', icon: 'edit', n: 1 },
  { id: 'knowledge', label: 'Knowledge', icon: 'book', n: 2 },
  { id: 'agent', label: 'Configure agent', icon: 'sparkle', n: 3 },
  { id: 'curriculum', label: 'Generate curriculum', icon: 'layers', n: 4 },
  { id: 'test', label: 'Test agent', icon: 'flask', n: 5 },
  { id: 'publish', label: 'Approve & publish', icon: 'shield', n: 6 },
  { id: 'insights', label: 'Monitor & improve', icon: 'chart', n: 7 },
  { id: 'mapping', label: 'Board mapping', icon: 'map', n: 0 },
] as const;
type StepId = (typeof STEPS)[number]['id'];

export function Studio({ id }: { id: string }) {
  const { search } = useRoute();
  const step = (search.get('step') as StepId) || 'profile';
  const { data, loading, error, reload } = useApi<any>(`/api/admin/courses/${id}`, [id]);
  const go = (s: string) => navigate(`/admin/courses/${id}?step=${s}`, true);
  if (error) return <Notice tone="bad">{error}</Notice>;
  if (loading && !data) return <Spinner />;
  if (!data) return null;
  const c = data.course;
  const locked = c.status === 'published';
  return (
    <div data-theme-accent={c.theme}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin" className="text-sm font-semibold text-muted hover:text-ink">
            <Icon name="arrowL" size={14} /> All courses
          </Link>
          <h1 className="mt-1 text-3xl font-black">{c.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            {c.category_name} › {c.subject_name} <StatusPill status={c.status} /> <span>v{c.version}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon="eye" onClick={() => navigate(`/courses/${c.id}`)}>
            Preview as student
          </Button>
          <Button
            size="sm"
            icon="copy"
            onClick={async () => {
              const r = await api<{ id: string }>(`/api/admin/courses/${c.id}/duplicate`, { body: {} });
              toast('Duplicated as a new draft');
              navigate(`/admin/courses/${r.id}`);
            }}
          >
            Duplicate
          </Button>
        </div>
      </div>
      {locked && !['publish', 'insights', 'test'].includes(step) && (
        <Notice tone="warn" className="mb-4">
          This course is <strong>published</strong> and read-only. Move it back to Draft (step 6) to edit, or duplicate it to prepare a new edition.
        </Notice>
      )}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Studio steps" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {STEPS.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} aria-current={step === s.id ? 'page' : undefined} className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${step === s.id ? 'bg-ink text-paper' : 'text-muted hover:bg-sunk hover:text-ink'}`}>
              <span className={`grid size-6 place-items-center rounded-full text-[11px] font-black ${step === s.id ? 'bg-paper text-ink' : 'bg-sunk'}`}>{s.n || <Icon name={s.icon} size={12} />}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {step === 'profile' && <ProfileStep course={c} locked={locked} onSaved={reload} next={() => go('knowledge')} />}
          {step === 'knowledge' && <KnowledgeStep courseId={c.id} next={() => go('agent')} />}
          {step === 'agent' && <AgentStep courseId={c.id} next={() => go('curriculum')} />}
          {step === 'curriculum' && <CurriculumStep courseId={c.id} data={data} reload={reload} locked={locked} next={() => go('test')} />}
          {step === 'test' && <TestStep courseId={c.id} modules={data.modules} next={() => go('publish')} />}
          {step === 'publish' && <PublishStep data={data} reload={reload} />}
          {step === 'insights' && <InsightsStep courseId={c.id} />}
          {step === 'mapping' && <MappingStep courseId={c.id} modules={data.modules} />}
        </div>
      </div>
    </div>
  );
}

export function StepHeader({ n, title, children, actions }: { n?: number; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {n ? <p className="text-xs font-bold tracking-wide text-accent-ink uppercase">Step {n}</p> : null}
        <h2 className="text-2xl font-black">{title}</h2>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function ProfileStep({ course, locked, onSaved, next }: { course: any; locked: boolean; onSaved: () => void; next: () => void }) {
  const { data: tax } = useApi<any[]>('/api/admin/taxonomy');
  const [f, setF] = useState<any>(course);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    setF(course);
  }, [course]);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const save = async (andNext = false) => {
    setBusy(true);
    setErr('');
    try {
      const body: any = {};
      for (const k of ['subject_id', 'title', 'description', 'age_min', 'age_max', 'grade_level', 'grade_band', 'proficiency', 'prerequisites', 'objectives', 'outcomes', 'duration_minutes', 'required_tools', 'teaching_style', 'assessment_approach', 'safety_requirements', 'instructor_notes', 'student_intro', 'theme', 'is_template', 'completion_criteria']) body[k] = f[k];
      for (const k of ['objectives', 'outcomes', 'prerequisites', 'required_tools']) body[k] = (body[k] || []).map((s: string) => s.trim()).filter(Boolean);
      for (const k of ['age_min', 'age_max', 'duration_minutes']) body[k] = body[k] === '' || body[k] === null ? null : Number(body[k]);
      await api(`/api/admin/courses/${course.id}`, { method: 'PATCH', body });
      toast('Course profile saved');
      onSaved();
      if (andNext) next();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const cc = f.completion_criteria || {};
  return (
    <Card className="p-6">
      <StepHeader n={1} title="Course profile">
        Who it’s for, what they’ll learn, and how you like to teach. The agent and the curriculum generator both read this.
      </StepHeader>
      <fieldset disabled={locked} className="grid gap-5 md:grid-cols-2">
        <Field label="Course name" className="md:col-span-2">
          <Input value={f.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Subject">
          <Select value={f.subject_id} onChange={(e) => set('subject_id', e.target.value)}>
            {tax?.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {c.subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Grade band (K-12 or adults) and level" hint="Courses with the same subject and grade band form a Beginner → Intermediate → Advanced path for learners.">
          <div className="flex gap-2">
            <Select value={f.grade_band || ''} onChange={(e) => set('grade_band', e.target.value)} aria-label="Grade band">
              <option value="">No band</option>
              <option value="K-2">K–2</option>
              <option value="3-5">Grades 3–5</option>
              <option value="6-8">Grades 6–8</option>
              <option value="9-12">Grades 9–12</option>
              <option value="Adult">Adults (18+)</option>
            </Select>
            <Input value={f.grade_level} onChange={(e) => set('grade_level', e.target.value)} placeholder="Grade label, e.g. Grades 3–5" aria-label="Grade label" />
            <Select value={f.proficiency} onChange={(e) => set('proficiency', e.target.value)} aria-label="Proficiency">
              {['beginner', 'intermediate', 'advanced'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>
        </Field>
        <Field label="Age group">
          <div className="flex items-center gap-2">
            <Input type="number" min={3} max={99} value={f.age_min ?? ''} onChange={(e) => set('age_min', e.target.value)} aria-label="Minimum age" />
            <span>to</span>
            <Input type="number" min={3} max={99} value={f.age_max ?? ''} onChange={(e) => set('age_max', e.target.value)} aria-label="Maximum age" />
          </div>
        </Field>
        <Field label="Duration (minutes)">
          <Input type="number" min={0} value={f.duration_minutes ?? ''} onChange={(e) => set('duration_minutes', e.target.value)} />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Learning objectives" hint="One per line item. Each objective becomes a draft lesson when you generate." className="md:col-span-2">
          <ListEditor value={f.objectives || []} onChange={(v) => set('objectives', v)} placeholder="Learners will be able to…" addLabel="Add objective" />
        </Field>
        <Field label="Desired learning outcomes">
          <ListEditor value={f.outcomes || []} onChange={(v) => set('outcomes', v)} placeholder="Outcome" addLabel="Add outcome" />
        </Field>
        <Field label="Prerequisites">
          <ListEditor value={f.prerequisites || []} onChange={(v) => set('prerequisites', v)} placeholder="Prerequisite" addLabel="Add prerequisite" />
        </Field>
        <Field label="Required tools">
          <ListEditor value={f.required_tools || []} onChange={(v) => set('required_tools', v)} placeholder="Tool" addLabel="Add tool" />
        </Field>
        <Field label="Theme colour">
          <div className="flex gap-2">
            {['sunrise', 'meadow', 'ocean', 'grape'].map((t) => (
              <button type="button" key={t} data-theme-accent={t} onClick={() => set('theme', t)} aria-pressed={f.theme === t} className={`h-10 flex-1 rounded-xl bg-accent text-xs font-bold text-white capitalize ${f.theme === t ? 'ring-4 ring-ink/20' : 'opacity-70'}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Preferred teaching style">
          <Textarea value={f.teaching_style} onChange={(e) => set('teaching_style', e.target.value)} />
        </Field>
        <Field label="Assessment approach & rules">
          <Textarea value={f.assessment_approach} onChange={(e) => set('assessment_approach', e.target.value)} />
        </Field>
        <Field label="Safety requirements">
          <Textarea value={f.safety_requirements} onChange={(e) => set('safety_requirements', e.target.value)} />
        </Field>
        <Field label="Instructor notes (teacher-only)">
          <Textarea value={f.instructor_notes} onChange={(e) => set('instructor_notes', e.target.value)} />
        </Field>
        <Field label="Student-facing introduction" className="md:col-span-2">
          <Input value={f.student_intro} onChange={(e) => set('student_intro', e.target.value)} />
        </Field>
        <Field label="Completion criteria">
          <div className="flex items-center gap-2 text-sm">
            Pass mark
            <Input type="number" min={0} max={100} className="w-20" value={cc.minScorePct ?? 60} onChange={(e) => set('completion_criteria', { ...cc, minScorePct: Number(e.target.value) })} />% across all approved lessons
          </div>
        </Field>
        <Field label="Template">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.is_template} onChange={(e) => set('is_template', e.target.checked)} /> Use as a reusable template (duplicate it to start new courses)
          </label>
        </Field>
      </fieldset>
      {err && <Notice tone="bad" className="mt-4">{err}</Notice>}
      {!locked && (
        <div className="mt-6 flex justify-end gap-2">
          <Button busy={busy} onClick={() => save(false)}>
            Save
          </Button>
          <Button variant="primary" busy={busy} onClick={() => save(true)}>
            Save & continue <Icon name="arrowR" />
          </Button>
        </div>
      )}
    </Card>
  );
}

function PublishStep({ data, reload }: { data: any; reload: () => void }) {
  const c = data.course;
  const agent = useApi<any>(`/api/admin/courses/${c.id}/agent`, [c.status]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const act = async (label: string, fn: () => Promise<any>) => {
    setBusy(label);
    setErr('');
    try {
      await fn();
      toast(label);
      await reload();
      await agent.reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
    }
  };
  const draft = agent.data?.draft;
  const lessons = data.modules.flatMap((m: any) => m.lessons);
  const LABEL: Record<string, string> = { draft: 'Back to draft', testing: 'Mark as testing', review: 'Submit for review', approved: 'Approve', published: 'Publish to students', archived: 'Archive' };
  return (
    <div className="space-y-5">
      <StepHeader n={6} title="Review, approve & publish">
        Only administrators can approve and publish. Publishing snapshots the course as a new version and publishes the approved agent configuration with it.
      </StepHeader>
      <Card className="p-5">
        <h3 className="mb-3 font-bold">Readiness checklist</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Icon name={lessons.some((l: any) => l.status === 'approved') ? 'check' : 'x'} className={lessons.some((l: any) => l.status === 'approved') ? 'text-good' : 'text-bad'} />
            {lessons.filter((l: any) => l.status === 'approved').length} of {lessons.length} lessons approved
          </li>
          <li className="flex items-center gap-2">
            <Icon name={draft?.status === 'approved' || agent.data?.published ? 'check' : 'x'} className={draft?.status === 'approved' || agent.data?.published ? 'text-good' : 'text-bad'} />
            Agent configuration {draft ? `v${draft.version} is ${draft.status}` : 'missing'}
            {agent.data?.published && ` · v${agent.data.published.version} live`}
          </li>
          {data.checks.issues.map((i: string) => (
            <li key={i} className="flex items-start gap-2 text-muted">
              <Icon name="flag" className="mt-0.5 text-warn" /> {i}
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold">
            Course <StatusPill status={c.status} />
          </h3>
          <p className="mt-1 text-sm text-muted">draft → testing → review → approved → published → archived</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.transitions.map((t: string) => (
              <Button key={t} size="sm" variant={t === 'published' ? 'primary' : t === 'approved' ? 'good' : 'secondary'} busy={busy === LABEL[t]} onClick={() => act(LABEL[t], () => api(`/api/admin/courses/${c.id}/transition`, { body: { to: t } }))}>
                {LABEL[t]}
              </Button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold">Agent {draft && <StatusPill status={draft.status} />}</h3>
          <p className="mt-1 text-sm text-muted">Sandbox tests must be run against the current version before review.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {draft?.status === 'draft' && <Button size="sm" onClick={() => act('Submitted for review', () => api(`/api/admin/courses/${c.id}/agent/transition`, { body: { to: 'review' } }))}>Submit for review</Button>}
            {draft?.status === 'testing' && <Button size="sm" onClick={() => act('Submitted for review', () => api(`/api/admin/courses/${c.id}/agent/transition`, { body: { to: 'review' } }))}>Submit for review</Button>}
            {draft?.status === 'review' && <Button size="sm" variant="good" onClick={() => act('Agent approved', () => api(`/api/admin/courses/${c.id}/agent/transition`, { body: { to: 'approved' } }))}>Approve agent</Button>}
            {draft?.status === 'approved' && c.status === 'published' && <Button size="sm" variant="primary" onClick={() => act('Agent published', () => api(`/api/admin/courses/${c.id}/agent/publish`, { method: 'POST' }))}>Publish agent now</Button>}
            {draft && ['review', 'approved', 'testing'].includes(draft.status) && <Button size="sm" variant="ghost" onClick={() => act('Back to draft', () => api(`/api/admin/courses/${c.id}/agent/transition`, { body: { to: 'draft' } }))}>Back to draft</Button>}
          </div>
        </Card>
      </div>
      {err && <Notice tone="bad">{err}</Notice>}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Course version history</h3>
          {data.versions.length === 0 && <p className="text-sm text-muted">No published versions yet.</p>}
          <ul className="space-y-2 text-sm">
            {data.versions.map((v: any) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-xl bg-sunk px-3 py-2">
                <span>
                  <strong>v{v.version}</strong> {v.label} <span className="text-muted">· {v.created_at.slice(0, 16)}</span>
                </span>
                {c.status !== 'published' && (
                  <Button size="sm" variant="ghost" onClick={() => confirm(`Replace current draft content with v${v.version}?`) && act(`Restored v${v.version}`, () => api(`/api/admin/courses/${c.id}/restore`, { body: { versionId: v.id } }))}>
                    Restore
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Agent configuration versions</h3>
          <ul className="space-y-2 text-sm">
            {agent.data?.versions.map((v: any) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-xl bg-sunk px-3 py-2">
                <span>
                  <strong>v{v.version}</strong> <StatusPill status={v.status} /> <span className="text-muted">{v.note}</span>
                </span>
                {v.approved_at && v.status !== 'published' && (
                  <Button size="sm" variant="ghost" onClick={() => act(`Rolled back to v${v.version}`, () => api(`/api/admin/courses/${c.id}/agent/rollback`, { body: { versionId: v.id } }))}>
                    Roll back
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function InsightsStep({ courseId }: { courseId: string }) {
  const { data, loading, reload } = useApi<any>(`/api/admin/courses/${courseId}/insights`);
  if (loading || !data) return <Spinner />;
  const t = data.agent.totals;
  const stat = (label: string, v: any, sub?: string) => (
    <Card className="p-4">
      <p className="text-xs font-bold text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl font-black">{v}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Card>
  );
  return (
    <div className="space-y-5">
      <StepHeader n={7} title="Monitor & improve" actions={<Button size="sm" icon="refresh" onClick={reload}>Refresh</Button>}>
        Privacy-conscious: learners are pseudonymised, personal details are redacted, and logs expire automatically. Nothing here changes the published agent — use it to decide what to edit, then re-test and re-approve.
      </StepHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stat('Questions', t.questions)}
        {stat('Grounded', t.questions ? `${Math.round((t.grounded / t.questions) * 100)}%` : '—', 'cited course sources')}
        {stat('Helpful', `${t.thumbsUp}👍 ${t.thumbsDown}👎`)}
        {stat('Escalations', t.escalations, 'safeguarding flags')}
        {stat('To review', data.reviewQueue, 'written answers')}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Frequently asked</h3>
          {data.agent.frequent.length === 0 && <p className="text-sm text-muted">No learner questions yet.</p>}
          <ul className="space-y-2 text-sm">
            {data.agent.frequent.map((f: any) => (
              <li key={f.key} className="flex justify-between gap-3">
                <span>“{f.example}”</span>
                <Badge>{f.n}×</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Unanswered or redirected</h3>
          {data.agent.unanswered.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
          <ul className="space-y-2 text-sm">
            {data.agent.unanswered.map((u: any, i: number) => (
              <li key={i} className="flex justify-between gap-3">
                <span>“{u.question}”</span>
                <Badge tone="warn">{u.intent.replace('_', ' ')}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Tip: add a knowledge source or a few-shot example covering these, then re-run the sandbox.</p>
        </Card>
      </div>
      <Card className="p-5">
        <h3 className="mb-3 font-bold">Activity completion & difficulty</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-2">Activity</th>
              <th>Phase</th>
              <th>Attempts</th>
              <th>Correct</th>
              <th>Avg hints</th>
            </tr>
          </thead>
          <tbody>
            {data.activityStats.map((a: any) => (
              <tr key={a.id} className="border-t border-line">
                <td className="py-2">
                  <span className="text-muted">{a.lesson} ·</span> {a.title}
                </td>
                <td>{a.phase}</td>
                <td>{a.attempts}</td>
                <td className={a.attempts && a.pct_correct < 50 ? 'font-bold text-bad' : ''}>{a.attempts ? `${a.pct_correct}%` : '—'}</td>
                <td>{a.attempts ? a.avg_hints : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">Activities under 50% correct are highlighted as content that may need review.</p>
      </Card>
    </div>
  );
}
