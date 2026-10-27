import { useState } from 'react';
import { api, useApi } from '../../lib/api.ts';
import { navigate } from '../../lib/router.tsx';
import { Badge, Button, Card, Field, Input, Modal, Notice, PageHeader, Select, Spinner, StatusPill, Tabs } from '../../components/ui.tsx';

export function NewCourseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: tax } = useApi<any[]>(open ? '/api/admin/taxonomy' : null, [open]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api<{ id: string }>('/api/admin/courses', { body: { title, subject_id: subject } });
      onClose();
      navigate(`/admin/courses/${r.id}?step=profile`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create a new course">
      <p className="mb-4 text-sm text-muted">No code needed. You’ll fill in the full profile next, then add knowledge, configure the agent and generate lessons.</p>
      <div className="space-y-4">
        <Field label="Course name">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Science: Plants & Photosynthesis" autoFocus />
        </Field>
        <Field label="Subject" hint="Missing a subject? Add it under Platform → Catalogue structure.">
          <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Choose…</option>
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
        {err && <Notice tone="bad">{err}</Notice>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} disabled={title.trim().length < 3 || !subject} onClick={create}>
            Create course
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminHome() {
  const { data, loading } = useApi<any[]>('/api/admin/courses');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  if (loading || !data) return <Spinner />;
  const counts = data.reduce((m: any, c: any) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
  const rows = data.filter((c) => filter === 'all' || c.status === filter);
  return (
    <>
      <PageHeader
        eyebrow="Agent Training Studio"
        title="Courses & learning agents"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>
            New course
          </Button>
        }
      >
        Create any course, ground its AI agent in your materials, generate and review lessons, test the agent, then publish.
      </PageHeader>
      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        tabs={[{ id: 'all', label: `All (${data.length})` }, ...['draft', 'testing', 'review', 'approved', 'published', 'archived'].filter((s) => counts[s]).map((s) => ({ id: s, label: `${s[0].toUpperCase() + s.slice(1)} (${counts[s]})` }))]}
      />
      <div className="grid gap-3">
        {rows.map((c) => (
          <Card key={c.id} as="button" onClick={() => navigate(`/admin/courses/${c.id}`)} className="flex flex-wrap items-center gap-4 p-4 text-left transition hover:border-accent" data-theme-accent={c.theme}>
            <span className="h-12 w-1.5 rounded-full bg-accent" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted">
                {c.category_name} › {c.subject_name}
              </p>
              <p className="truncate text-lg font-bold">{c.title}</p>
            </div>
            <span className="text-sm text-muted">
              {c.approved_count}/{c.lesson_count} lessons approved
            </span>
            {c.is_template && <Badge tone="teach">template</Badge>}
            <StatusPill status={c.status} />
          </Card>
        ))}
      </div>
      <NewCourseModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
