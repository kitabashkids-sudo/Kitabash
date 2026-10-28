import { useEffect, useRef, useState } from 'react';
import { api, upload, useApi } from '../../lib/api.ts';
import { useRoute, navigate } from '../../lib/router.tsx';
import { Badge, Button, Card, Empty, Field, Icon, Input, Modal, Notice, PageHeader, ProgressBar, Select, Spinner, StatusPill, Tabs, toast, categoryIcon } from '../../components/ui.tsx';

// ── Media asset library ────────────────────────────────────
export function Library() {
  const [q, setQ] = useState('');
  const { data, loading, reload } = useApi<any[]>(`/api/admin/assets${q ? `?q=${encodeURIComponent(q)}` : ''}`, [q]);
  const [form, setForm] = useState<any>(null);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const save = async () => {
    setErr('');
    try {
      const meta = { title: form.title, tags: form.tags, alt: form.alt, captions: form.captions };
      if (form.file) await upload(form.id ? `/api/admin/assets/${form.id}` : '/api/admin/assets', form.file, meta);
      else await api(`/api/admin/assets/${form.id}`, { method: 'PATCH', body: { title: form.title, tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean), alt_text: form.alt, captions: form.captions } });
      toast('Asset saved');
      setForm(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <>
      <PageHeader eyebrow="Media library" title="Learning media" actions={<Button variant="primary" icon="upload" onClick={() => setForm({ title: '', tags: '', alt: '', captions: '', file: null })}>Upload media</Button>}>
        Reusable videos, images, SVG animations and audio for 3-second hooks and teacher demos. Every asset needs a text alternative. Uploaded SVGs are sanitised.
      </PageHeader>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or tag…" className="mb-5 !w-80" aria-label="Search media" />
      {loading || !data ? (
        <Spinner />
      ) : !data.length ? (
        <Empty title="No media yet" icon="image">
          Upload an MP4/WebM clip, PNG/JPG/WebP image, SVG animation or audio file. Automated video generation is not configured — media is uploaded by your team.
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="grid aspect-video place-items-center bg-sunk">
                {a.kind === 'video' ? <video src={`/api/assets/${a.id}/file`} muted controls className="h-full w-full object-cover" /> : a.kind === 'audio' ? <Icon name="speaker" size={32} className="text-muted" /> : <img src={`/api/assets/${a.id}/file`} alt={a.alt_text} className="h-full w-full object-contain" />}
              </div>
              <div className="p-3">
                <p className="truncate font-semibold">{a.title}</p>
                <p className="text-xs text-muted">
                  {a.kind} · v{a.version} · {Math.round(a.size_bytes / 1024)} KB
                </p>
                <div className="mt-1 flex flex-wrap gap-1">{a.tags.map((t: string) => <Badge key={t}>{t}</Badge>)}</div>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => setForm({ id: a.id, title: a.title, tags: a.tags.join(', '), alt: a.alt_text, captions: a.captions, file: null })}>
                    Edit / replace
                  </Button>
                  <Button size="sm" variant="ghost" icon="trash" aria-label="Delete" onClick={async () => { if (!confirm('Delete this asset?')) return; try { await api(`/api/admin/assets/${a.id}`, { method: 'DELETE' }); reload(); } catch (e) { toast((e as Error).message, 'bad'); } }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit media' : 'Upload media'}>
        {form && (
          <div className="space-y-3">
            <Field label={form.id ? 'Replace file (optional)' : 'File'}>
              <div className="flex items-center gap-2">
                <Button icon="upload" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
                <span className="truncate text-sm text-muted">{form.file?.name || 'No file chosen'}</span>
                <input ref={fileRef} type="file" accept=".mp4,.webm,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp3,.m4a,.wav" className="hidden" onChange={(e) => setForm({ ...form, file: e.target.files?.[0], title: form.title || e.target.files?.[0]?.name.replace(/\.[^.]+$/, '') })} />
              </div>
            </Field>
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Tags (comma-separated)">
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="handwriting, letter a, hook" />
            </Field>
            <Field label="Text alternative (required)">
              <Input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Describe what the media shows" />
            </Field>
            <Field label="Captions / transcript">
              <Input value={form.captions} onChange={(e) => setForm({ ...form, captions: e.target.value })} />
            </Field>
            {err && <Notice tone="bad">{err}</Notice>}
            <div className="flex justify-end">
              <Button variant="primary" disabled={(!form.id && !form.file) || !form.alt.trim()} onClick={save}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ── Platform: catalogue structure, activity engine, integrations, people, audit ──
type PTab = 'library' | 'catalogue' | 'activities' | 'integrations' | 'people' | 'audit';

export function Platform() {
  const { search } = useRoute();
  const tab = (search.get('tab') as PTab) || 'library';
  return (
    <>
      <PageHeader eyebrow="Platform" title="Platform settings" />
      <Tabs<PTab>
        className="mb-6"
        value={tab}
        onChange={(t) => navigate(`/admin/platform?tab=${t}`, true)}
        tabs={[
          { id: 'library', label: 'Course library', icon: 'book' },
          { id: 'catalogue', label: 'Catalogue structure', icon: 'layers' },
          { id: 'activities', label: 'Activity engine', icon: 'play' },
          { id: 'integrations', label: 'Integrations', icon: 'plug' },
          { id: 'people', label: 'People & privacy', icon: 'users' },
          { id: 'audit', label: 'Audit log', icon: 'shield' },
        ]}
      />
      {tab === 'library' && <CourseLibrary />}
      {tab === 'catalogue' && <Taxonomy />}
      {tab === 'activities' && <ActivityTypes />}
      {tab === 'integrations' && <Integrations />}
      {tab === 'people' && <People />}
      {tab === 'audit' && <Audit />}
    </>
  );
}

function CourseLibrary() {
  const { data, reload } = useApi<any>('/api/admin/library');
  const [busy, setBusy] = useState(false);
  const running = data?.job?.running;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(reload, 1500);
    return () => clearInterval(t);
  }, [running, reload]);
  if (!data) return <Spinner />;
  const install = async (category?: string) => {
    setBusy(true);
    try {
      await api('/api/admin/library/install', { body: { category } });
      reload();
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setBusy(false);
    }
  };
  const all = data.installed >= data.total;
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black">K-12 course library</h2>
            <p className="mt-1 text-muted">
              Ready-to-teach courses for every subject in four grade bands (K–2, 3–5, 6–8, 9–12), each with Beginner, Intermediate and Advanced levels — {data.total} courses, {data.lessons} lessons. Every lesson has a 3-second hook, Learn cards, Perform and Probe activities, the teacher resource panel, a rubric and a tutor trained on the course guide. Courses install as published; you can edit, unpublish or archive any of them.
            </p>
          </div>
          <Button variant="primary" icon="download" busy={busy || running} disabled={all || running} onClick={() => void install()}>
            {all ? 'All installed' : running ? 'Installing…' : `Install ${data.total - data.installed} course${data.total - data.installed === 1 ? '' : 's'}`}
          </Button>
        </div>
        <div className="mt-5">
          <ProgressBar value={running ? data.job.done : data.installed} max={running ? data.job.total || 1 : data.total} label="Library installed" />
          <p className="mt-2 text-sm text-muted">{running ? `Installing ${data.job.done + 1} of ${data.job.total}: ${data.job.current}` : `${data.installed} of ${data.total} installed`}</p>
        </div>
        {data.job?.errors?.length > 0 && (
          <Notice tone="bad" className="mt-4">
            {data.job.errors.length} course(s) could not be installed:
            <ul className="mt-1 list-disc pl-5">{data.job.errors.slice(0, 5).map((e: any) => <li key={e.key}><strong>{e.title}</strong>: {e.error}</li>)}</ul>
          </Notice>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">By grade band</h3>
          <ul className="space-y-3">
            {data.bands.map((b: any) => (
              <li key={b.id}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{b.label}</span><span className="text-muted">{b.installed}/{b.total}</span></div>
                <ProgressBar value={b.installed} max={b.total || 1} label={b.label} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-bold">By category</h3>
          <ul className="space-y-2">
            {data.categories.map((c: any) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-sm"><span className="font-semibold">{c.name}</span> <span className="text-muted">{c.installed}/{c.total}</span></span>
                {c.installed < c.total && <Button size="sm" disabled={running || busy} onClick={() => void install(c.name)}>Install</Button>}
                {c.total > 0 && c.installed >= c.total && <Badge tone="good">Installed</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Taxonomy() {
  const { data, reload } = useApi<any[]>('/api/admin/taxonomy');
  const [cat, setCat] = useState({ name: '', description: '' });
  const [sub, setSub] = useState<Record<string, string>>({});
  const run = async (fn: () => Promise<any>, msg: string) => {
    try {
      await fn();
      toast(msg);
      reload();
    } catch (e) {
      toast((e as Error).message, 'bad');
    }
  };
  if (!data) return <Spinner />;
  return (
    <div className="space-y-4">
      <Notice tone="teach">Add any category or subject — no code changes. New subjects immediately become available when creating courses.</Notice>
      {data.map((c) => (
        <Card key={c.id} className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Icon name={categoryIcon(c.icon)} />
            </span>
            <div className="flex-1">
              <p className="font-bold">{c.name}</p>
              <p className="text-sm text-muted">{c.description}</p>
            </div>
            {c.subjects.length === 0 && <Button size="sm" variant="ghost" icon="trash" aria-label="Delete category" onClick={() => run(() => api(`/api/admin/categories/${c.id}`, { method: 'DELETE' }), 'Category deleted')} />}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.subjects.map((s: any) => (
              <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-sunk py-1 pr-1.5 pl-3 text-sm">
                {s.name}
                {s.course_count > 0 ? <Badge>{s.course_count}</Badge> : <button aria-label={`Delete ${s.name}`} onClick={() => run(() => api(`/api/admin/subjects/${s.id}`, { method: 'DELETE' }), 'Subject deleted')} className="text-muted hover:text-bad"><Icon name="x" size={13} /></button>}
              </span>
            ))}
            <form className="inline-flex gap-1" onSubmit={(e) => { e.preventDefault(); if (sub[c.id]?.trim()) run(() => api('/api/admin/subjects', { body: { category_id: c.id, name: sub[c.id] } }), 'Subject added').then(() => setSub({ ...sub, [c.id]: '' })); }}>
              <input value={sub[c.id] || ''} onChange={(e) => setSub({ ...sub, [c.id]: e.target.value })} placeholder="New subject…" aria-label={`New subject in ${c.name}`} className="h-8 w-36 rounded-full border border-dashed border-line bg-transparent px-3 text-sm focus:border-accent focus:outline-none" />
            </form>
          </div>
        </Card>
      ))}
      <Card className="p-5">
        <h3 className="mb-3 font-bold">Add a category</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <Input value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} placeholder="e.g. Arts & Music" aria-label="Category name" />
          <Input value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} placeholder="Short description" aria-label="Category description" />
          <Button variant="primary" icon="plus" disabled={cat.name.length < 2} onClick={() => run(() => api('/api/admin/categories', { body: cat }), 'Category added').then(() => setCat({ name: '', description: '' }))}>
            Add
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActivityTypes() {
  const { data } = useApi<any>('/api/activity-types');
  if (!data) return <Spinner />;
  const groups = [
    ['built-in', 'Built-in types — create unlimited activities by configuration'],
    ['configurable', 'Configurable presets — no code; render with a built-in type'],
    ['extension-required', 'Need a developer-built component (see docs/ACTIVITY_EXTENSIONS.md)'],
  ];
  return (
    <div className="space-y-6">
      {groups.map(([g, label]) => (
        <section key={g}>
          <h3 className="mb-3 flex items-center gap-2 font-bold">
            <StatusPill status={g} /> {label}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {data.types.filter((t: any) => t.availability === g).map((t: any) => (
              <Card key={t.type} className="p-4 text-sm">
                <p className="font-bold">
                  {t.label} <code className="ml-1 rounded bg-sunk px-1.5 text-xs text-muted">{t.type}</code>
                </p>
                <p className="mt-1 text-muted">{t.description}</p>
                {t.availability !== 'extension-required' && (
                  <dl className="mt-2 grid grid-cols-[90px_1fr] gap-x-2 gap-y-1 text-xs">
                    <dt className="font-bold">Inputs</dt>
                    <dd>{t.inputs}</dd>
                    <dt className="font-bold">Feedback</dt>
                    <dd>{t.feedback}</dd>
                    <dt className="font-bold">Completion</dt>
                    <dd>{t.completion}</dd>
                    <dt className="font-bold">Accessibility</dt>
                    <dd>{t.accessibility}</dd>
                  </dl>
                )}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Integrations() {
  const { data } = useApi<any[]>('/api/admin/integrations');
  if (!data) return <Spinner />;
  return (
    <div className="space-y-3">
      <Notice tone="teach">Keys are read from the server environment only — never entered or stored in the browser. Each integration is optional and has a manual alternative.</Notice>
      {data.map((i) => (
        <Card key={i.key} className="flex flex-wrap items-start gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-bold">{i.name}</p>
            <p className="text-sm text-muted">{i.purpose}</p>
            <p className="mt-1 text-sm">{i.detail}</p>
            <p className="mt-1 text-xs text-muted">Manual alternative: {i.manual}</p>
          </div>
          <StatusPill status={i.status} />
        </Card>
      ))}
    </div>
  );
}

function People() {
  const { data, reload } = useApi<any>('/api/admin/users');
  const { data: courses } = useApi<any[]>('/api/admin/courses');
  const [form, setForm] = useState({ name: '', email: '', role: 'student', password: '', birth_year: '' });
  const [link, setLink] = useState({ guardianId: '', studentId: '' });
  const [enrol, setEnrol] = useState({ userId: '', courseId: '' });
  const [exp, setExp] = useState<any>(null);
  const run = async (fn: () => Promise<any>, msg: string) => {
    try {
      await fn();
      toast(msg);
      reload();
    } catch (e) {
      toast((e as Error).message, 'bad');
    }
  };
  if (!data) return <Spinner />;
  const students = data.users.filter((u: any) => u.role === 'student');
  const guardians = data.users.filter((u: any) => u.role === 'guardian');
  return (
    <div className="space-y-5">
      <Card className="overflow-x-auto p-5">
        <h3 className="mb-3 font-bold">Accounts</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Consent (AI / audio)</th>
              <th>Courses</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.users.map((u: any) => {
              const l = data.links.filter((x: any) => x.student_id === u.id);
              return (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2 font-semibold">{u.name}</td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <Badge>{u.role}</Badge>
                  </td>
                  <td className="text-xs">{u.role === 'student' ? (l.length ? `${l.some((x: any) => x.consent_ai) ? '✓' : '✗'} / ${l.some((x: any) => x.consent_audio) ? '✓' : '✗'}` : 'no guardian linked') : '—'}</td>
                  <td>{data.enrolments.filter((e: any) => e.user_id === u.id).length}</td>
                  <td className="text-right whitespace-nowrap">
                    {u.role !== 'admin' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={async () => setExp(await api(`/api/admin/users/${u.id}/export`))}>
                          Export
                        </Button>
                        <Button size="sm" variant="ghost" icon="trash" aria-label={`Erase ${u.name}`} onClick={() => confirm(`Permanently erase ${u.name} and all their learning records?`) && run(() => api(`/api/admin/users/${u.id}`, { method: 'DELETE' }), 'Account and data erased')} />
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="space-y-3 p-5">
          <h3 className="font-bold">Add account</h3>
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="Role">
              {['student', 'guardian', 'instructor', 'admin'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
            <Input placeholder="Birth year" value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} aria-label="Birth year" />
          </div>
          <Input type="password" placeholder="Temporary password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-label="Password" />
          <Button variant="primary" onClick={() => run(() => api('/api/admin/users', { body: { ...form, birth_year: form.birth_year ? Number(form.birth_year) : undefined } }), 'Account created').then(() => setForm({ name: '', email: '', role: 'student', password: '', birth_year: '' }))}>
            Create
          </Button>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="font-bold">Link guardian ↔ student</h3>
          <p className="text-xs text-muted">Under-18 learners need a linked guardian’s consent before using the AI helper or recording audio.</p>
          <Select value={link.guardianId} onChange={(e) => setLink({ ...link, guardianId: e.target.value })} aria-label="Guardian">
            <option value="">Guardian…</option>
            {guardians.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select value={link.studentId} onChange={(e) => setLink({ ...link, studentId: e.target.value })} aria-label="Student">
            <option value="">Student…</option>
            {students.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Button onClick={() => run(() => api('/api/admin/guardian-links', { body: link }), 'Linked')}>Link</Button>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="font-bold">Enrol a learner</h3>
          <Select value={enrol.userId} onChange={(e) => setEnrol({ ...enrol, userId: e.target.value })} aria-label="Learner">
            <option value="">Learner…</option>
            {students.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select value={enrol.courseId} onChange={(e) => setEnrol({ ...enrol, courseId: e.target.value })} aria-label="Course">
            <option value="">Course…</option>
            {courses?.filter((c) => c.status === 'published').map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
          <Button onClick={() => run(() => api('/api/admin/enrolments', { body: enrol }), 'Enrolled')}>Enrol</Button>
        </Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="font-bold">Data retention</h3>
          <p className="text-sm text-muted">AI helper logs are pseudonymous and auto-deleted after the retention period (AI_LOG_RETENTION_DAYS, default 90). Learning records are kept until an account is erased.</p>
        </div>
        <Button onClick={() => run(async () => toast(`Purged ${(await api<any>('/api/admin/retention/purge', { method: 'POST' })).purged} expired log entries`), 'Retention policy applied')}>Apply retention now</Button>
      </Card>
      <Modal open={!!exp} onClose={() => setExp(null)} title="Learner data export" wide>
        <pre className="max-h-[60vh] overflow-auto rounded-xl bg-sunk p-3 text-xs">{JSON.stringify(exp, null, 2)}</pre>
      </Modal>
    </div>
  );
}

function Audit() {
  const { data } = useApi<any[]>('/api/admin/audit');
  if (!data) return <Spinner />;
  return (
    <Card className="overflow-x-auto p-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-2">When</th>
            <th>Who</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-line">
              <td className="py-1.5 whitespace-nowrap text-muted">{a.created_at}</td>
              <td>{a.user_name || '—'}</td>
              <td className="font-semibold">{a.action}</td>
              <td>{a.entity}</td>
              <td className="max-w-xs truncate text-muted">{a.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
