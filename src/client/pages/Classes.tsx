import { useState } from 'react';
import { api, useApi } from '../lib/api.ts';
import { Link, navigate } from '../lib/router.tsx';
import { useSession } from '../lib/session.tsx';
import { Badge, Button, Card, Empty, Field, Input, Modal, Notice, PageHeader, Select, Spinner, toast } from '../components/ui.tsx';

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** A session can be joined from 15 minutes before its start until its scheduled end (or while live). */
export function joinable(s: any) {
  if (s.status === 'live') return true;
  if (s.status !== 'scheduled') return false;
  const start = new Date(s.starts_at).getTime();
  return Date.now() >= start - 15 * 60_000 && Date.now() <= start + (s.duration_min || 60) * 60_000;
}

function SessionStatus({ s }: { s: any }) {
  if (s.status === 'live') return <Badge tone="bad">● Live now</Badge>;
  if (s.status === 'ended') return <Badge>Ended</Badge>;
  if (s.status === 'cancelled') return <Badge tone="warn">Cancelled</Badge>;
  return joinable(s) ? <Badge tone="good">Starting soon</Badge> : <Badge tone="teach">Scheduled</Badge>;
}

/** Compact "next live classes" card used on student, teacher and admin homes. */
export function UpcomingClasses({ title = 'Live classes', limit = 4 }: { title?: string; limit?: number }) {
  const { data } = useApi<any[]>('/api/live/upcoming');
  const { me } = useSession();
  if (!data || !data.length) return null;
  const host = me?.user?.role === 'admin' || me?.user?.role === 'instructor';
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <Link to="/classes" className="text-sm font-semibold text-accent-ink">All classes →</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.slice(0, limit).map((s) => (
          <Card key={s.id} className="flex items-center gap-4 p-4" data-theme-accent={s.theme}>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-center leading-none">
              <span className="text-[10px] font-bold text-accent-ink uppercase">{new Date(s.starts_at).toLocaleDateString(undefined, { month: 'short' })}</span>
              <span className="text-lg font-black">{new Date(s.starts_at).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{s.title}</p>
              <p className="truncate text-sm text-muted">{s.course_title} · {new Date(s.starts_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
              <div className="mt-1"><SessionStatus s={s} /></div>
            </div>
            {me?.user?.role !== 'guardian' && (joinable(s) || host) && (
              <Button size="sm" variant={s.status === 'live' ? 'primary' : host ? 'teach' : 'secondary'} onClick={() => navigate(`/live/${s.id}`)}>
                {host ? (s.status === 'live' ? 'Rejoin' : 'Start') : 'Join'}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function NewBatch({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (id: string) => void }) {
  const { data: courses } = useApi<any[]>(open ? '/api/admin/courses' : null, [open]);
  const { data: users } = useApi<any>(open ? '/api/admin/users' : null, [open]);
  const [f, setF] = useState({ course_id: '', name: '', instructor_id: '', schedule_note: '', capacity: 10, starts_on: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const teachers = (users?.users || []).filter((u: any) => u.role === 'instructor' || u.role === 'admin');
  return (
    <Modal open={open} onClose={onClose} title="New class group">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr('');
          try {
            const r = await api<{ id: string }>('/api/classes', { body: { ...f, capacity: Number(f.capacity) || 10 } });
            onDone(r.id);
          } catch (x) {
            setErr((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Course">
          <Select required value={f.course_id} onChange={(e) => setF({ ...f, course_id: e.target.value, name: f.name || (courses || []).find((c) => c.id === e.target.value)?.title + ' — Group A' })}>
            <option value="">Choose a course…</option>
            {(courses || []).map((c) => (
              <option key={c.id} value={c.id}>{c.title}{c.status !== 'published' ? ` (${c.status})` : ''}</option>
            ))}
          </Select>
        </Field>
        <Field label="Group name" hint="Parents and students see this, e.g. “Phonics Starter — Sat 10am”.">
          <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} />
        </Field>
        <Field label="Teacher">
          <Select value={f.instructor_id} onChange={(e) => setF({ ...f, instructor_id: e.target.value })}>
            <option value="">Me</option>
            {teachers.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Schedule note" hint="Shown to families.">
            <Input value={f.schedule_note} placeholder="Saturdays 10:00–10:45" onChange={(e) => setF({ ...f, schedule_note: e.target.value })} maxLength={200} />
          </Field>
          <Field label="Max students">
            <Input type="number" min={1} max={50} value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} />
          </Field>
        </div>
        {err && <Notice tone="bad">{err}</Notice>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy}>Create group</Button>
        </div>
      </form>
    </Modal>
  );
}

export function ClassesPage() {
  const { me } = useSession();
  const role = me?.user?.role;
  const { data, loading, reload } = useApi<any[]>('/api/classes');
  const [creating, setCreating] = useState(false);
  if (loading || !data) return <Spinner />;
  return (
    <>
      <PageHeader
        eyebrow="Live classes"
        title={role === 'student' ? 'My classes' : 'Class groups'}
        actions={role === 'admin' && <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New class group</Button>}
      >
        {role === 'student'
          ? 'Your live classes with your teacher. The Join button appears 15 minutes before class starts.'
          : 'A class group is one course, one teacher and up to ~10 students. Schedule live video classes for the group, teach the lesson together, and see attendance afterwards.'}
      </PageHeader>
      <UpcomingClasses title="Coming up" limit={6} />
      <h2 className="mb-3 text-xl font-black">{role === 'student' ? 'My groups' : 'All groups'}</h2>
      {!data.length && (
        <Empty title="No class groups yet" icon="users">
          {role === 'admin' ? 'Create a group, add students, then schedule classes.' : role === 'student' ? 'When your school adds you to a class, it appears here.' : 'Ask an admin to assign you a class group.'}
        </Empty>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((b) => (
          <Card key={b.id} as="button" onClick={() => navigate(`/classes/${b.id}`)} className="flex flex-col p-5 text-left transition hover:-translate-y-0.5" data-theme-accent={b.theme}>
            <div className="flex items-center justify-between gap-2">
              <Badge tone="accent">{b.course_title}</Badge>
              {b.status === 'archived' && <Badge>archived</Badge>}
            </div>
            <h3 className="mt-2 text-lg leading-snug font-bold">{b.name}</h3>
            <p className="mt-1 text-sm text-muted">{b.instructor_name ? `Teacher: ${b.instructor_name}` : 'No teacher assigned'} · {b.member_count}/{b.capacity} students</p>
            {b.schedule_note && <p className="mt-1 text-sm">{b.schedule_note}</p>}
            <p className="mt-auto pt-3 text-sm font-semibold text-accent-ink">{b.next_session ? `Next: ${when(b.next_session)}` : 'No upcoming classes'}</p>
          </Card>
        ))}
      </div>
      <NewBatch
        open={creating}
        onClose={() => setCreating(false)}
        onDone={(id) => {
          setCreating(false);
          reload();
          navigate(`/classes/${id}`);
        }}
      />
    </>
  );
}

function ScheduleForm({ batchId, lessons, onDone }: { batchId: string; lessons: any[]; onDone: () => void }) {
  const tomorrow = new Date(Date.now() + 864e5);
  tomorrow.setMinutes(0, 0, 0);
  const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const [f, setF] = useState({ title: '', lesson_id: lessons[0]?.id || '', starts_at: local(tomorrow), duration_min: 45, repeat_weeks: 1, external_url: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr('');
        try {
          const lesson = lessons.find((l) => l.id === f.lesson_id);
          const r = await api<{ ids: string[] }>(`/api/classes/${batchId}/sessions`, {
            body: { ...f, title: f.title || lesson?.title || 'Live class', starts_at: new Date(f.starts_at).toISOString(), lesson_id: f.lesson_id || undefined, external_url: f.external_url || undefined },
          });
          toast(r.ids.length > 1 ? `${r.ids.length} classes scheduled` : 'Class scheduled');
          onDone();
        } catch (x) {
          setErr((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Lesson to teach">
        <Select value={f.lesson_id} onChange={(e) => setF({ ...f, lesson_id: e.target.value })}>
          <option value="">No specific lesson</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </Select>
      </Field>
      <Field label="Title" hint="Leave blank to use the lesson title.">
        <Input value={f.title} maxLength={160} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </Field>
      <Field label="Starts">
        <Input type="datetime-local" required value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minutes">
          <Input type="number" min={10} max={300} value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: Number(e.target.value) })} />
        </Field>
        <Field label="Repeat weekly" hint="Number of weeks">
          <Input type="number" min={1} max={52} value={f.repeat_weeks} onChange={(e) => setF({ ...f, repeat_weeks: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Zoom / Meet link (optional)" hint="Only if you prefer an outside meeting tool. Leave blank to use Kitabash video." className="sm:col-span-2">
        <Input type="url" placeholder="https://…" value={f.external_url} onChange={(e) => setF({ ...f, external_url: e.target.value })} />
      </Field>
      {err && <Notice tone="bad" className="sm:col-span-2">{err}</Notice>}
      <div className="sm:col-span-2">
        <Button variant="teach" icon="plus" busy={busy}>Schedule</Button>
      </div>
    </form>
  );
}

function Members({ batch, onDone }: { batch: any; onDone: () => void }) {
  const { data } = useApi<any>('/api/admin/users');
  const [sel, setSel] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const { data: detail } = useApi<any>(`/api/classes/${batch.id}`, [batch.id]);
  if (!data || !detail) return <Spinner />;
  const current = sel || new Set<string>(detail.roster.map((r: any) => r.id));
  const students = data.users.filter((u: any) => u.role === 'student' && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-3">
      <Input placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
      <p className="text-sm text-muted">{current.size} of {batch.capacity} places used</p>
      <div className="thin-scroll max-h-72 space-y-1 overflow-y-auto">
        {students.map((u: any) => (
          <label key={u.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-sunk">
            <input
              type="checkbox"
              checked={current.has(u.id)}
              onChange={(e) => {
                const n = new Set(current);
                e.target.checked ? n.add(u.id) : n.delete(u.id);
                setSel(n);
              }}
            />
            <span className="font-semibold">{u.name}</span>
            <span className="text-xs text-muted">{u.email}</span>
          </label>
        ))}
        {!students.length && <p className="text-sm text-muted">No student accounts found. Add students under Platform → People.</p>}
      </div>
      <Button
        variant="primary"
        busy={busy}
        disabled={current.size > batch.capacity}
        onClick={async () => {
          setBusy(true);
          try {
            await api(`/api/classes/${batch.id}/members`, { method: 'PUT', body: { userIds: [...current] } });
            toast('Students saved — they are enrolled in the course too');
            onDone();
          } catch (x) {
            toast((x as Error).message, 'bad');
          } finally {
            setBusy(false);
          }
        }}
      >
        Save students
      </Button>
    </div>
  );
}

export function ClassDetail({ id }: { id: string }) {
  const { me } = useSession();
  const { data, loading, error, reload } = useApi<any>(`/api/classes/${id}`, [id]);
  const [members, setMembers] = useState(false);
  const [showPast, setShowPast] = useState(false);
  if (error) return <Notice tone="bad">{error}</Notice>;
  if (loading || !data) return <Spinner />;
  const { batch, role, sessions, lessons, roster } = data;
  const host = role !== 'student';
  const admin = me?.user?.role === 'admin';
  const now = Date.now();
  const upcoming = sessions.filter((s: any) => s.status === 'live' || (s.status === 'scheduled' && new Date(s.starts_at).getTime() + s.duration_min * 60_000 > now));
  const past = sessions.filter((s: any) => !upcoming.includes(s)).reverse();
  const cancel = async (s: any) => {
    if (!confirm(`Cancel “${s.title}” on ${when(s.starts_at)}?`)) return;
    await api(`/api/live/${s.id}`, { method: 'PATCH', body: { status: 'cancelled' } });
    toast('Class cancelled');
    reload();
  };
  const row = (s: any) => (
    <li key={s.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{s.title}</p>
        <p className="text-sm text-muted">{when(s.starts_at)} · {s.duration_min} min{s.external_url ? ' · external link' : ''}</p>
      </div>
      <SessionStatus s={s} />
      {s.status !== 'ended' && s.status !== 'cancelled' && (host || joinable(s)) && (
        <Button size="sm" variant={host ? 'teach' : 'primary'} onClick={() => navigate(`/live/${s.id}`)}>
          {host ? (s.status === 'live' ? 'Rejoin' : 'Start class') : 'Join'}
        </Button>
      )}
      {host && s.status === 'scheduled' && <Button size="sm" variant="ghost" onClick={() => void cancel(s)}>Cancel</Button>}
      {host && s.status === 'ended' && <Button size="sm" icon="chart" onClick={() => navigate(`/live/${s.id}/report`)}>Report</Button>}
    </li>
  );
  return (
    <>
      <Link to="/classes" className="text-sm font-semibold text-muted">← Classes</Link>
      <PageHeader
        eyebrow={batch.course_title}
        title={batch.name}
        actions={admin && <Button icon="users" onClick={() => setMembers(true)}>Students</Button>}
      >
        {batch.instructor_name ? `Teacher: ${batch.instructor_name}` : 'No teacher assigned'}
        {batch.schedule_note ? ` · ${batch.schedule_note}` : ''} · {host ? `${roster.length}/${batch.capacity} students` : 'Live class group'}
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-2 text-lg font-bold">Upcoming classes</h2>
            {upcoming.length ? <ul>{upcoming.map(row)}</ul> : <p className="text-sm text-muted">Nothing scheduled yet.</p>}
            {past.length > 0 && (
              <>
                <button className="mt-3 text-sm font-semibold text-muted" onClick={() => setShowPast(!showPast)}>
                  {showPast ? 'Hide' : 'Show'} past classes ({past.length})
                </button>
                {showPast && <ul className="mt-2">{past.map(row)}</ul>}
              </>
            )}
          </Card>
          {host && (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">Schedule a class</h2>
              <ScheduleForm batchId={batch.id} lessons={lessons} onDone={reload} />
            </Card>
          )}
        </div>
        <div className="space-y-6">
          {host && (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">Students</h2>
              {!roster.length && <p className="text-sm text-muted">No students yet.{admin ? ' Use “Students” to add them.' : ''}</p>}
              <ul className="space-y-2">
                {roster.map((r: any) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-accent-soft font-black text-accent-ink">{r.name[0]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.name}</span>
                      <span className="text-xs text-muted">{r.lessons_done}/{data.lessonCount} lessons · {r.classes_attended} classes attended</span>
                    </span>
                  </li>
                ))}
              </ul>
              {host && <Link to={`/teach/courses/${batch.course_id}/report`} className="mt-4 inline-block text-sm font-semibold text-teach">Full progress report →</Link>}
            </Card>
          )}
          <Card className="p-5">
            <h2 className="mb-2 text-lg font-bold">Lessons in this course</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {lessons.map((l: any) => (
                <li key={l.id}>
                  <Link to={host ? `/teach/lessons/${l.id}` : `/lessons/${l.id}`} className="hover:underline">{l.title}</Link>
                </li>
              ))}
            </ol>
          </Card>
          {host && (
            <Notice tone="teach" icon="shield">
              Students see and hear only you by default. You can let them see each other from the People tab during class. Students under 18 need a guardian’s audio permission to turn on camera or microphone.
            </Notice>
          )}
        </div>
      </div>
      <Modal open={members} onClose={() => setMembers(false)} title={`Students in ${batch.name}`}>
        {members && (
          <Members
            batch={batch}
            onDone={() => {
              setMembers(false);
              reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}
