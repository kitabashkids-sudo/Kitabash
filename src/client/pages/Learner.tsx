import { UpcomingClasses } from './Classes.tsx';
import { useEffect, useRef, useState } from 'react';
import { api, useApi } from '../lib/api.ts';
import { Link, navigate } from '../lib/router.tsx';
import { useSession } from '../lib/session.tsx';
import { Badge, Button, Card, Empty, Icon, Notice, PageHeader, ProgressBar, Spinner, categoryIcon, toast } from '../components/ui.tsx';
import { BANDS, LEVEL_TONE, bandForBirthYear, bandLabel, levelLabel, shortTitle } from '../lib/k12.ts';

function LevelBadges({ c }: { c: any }) {
  if (!c.grade_band) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge>{bandLabel(c.grade_band)}</Badge>
      {c.level && <Badge tone={LEVEL_TONE[c.level]}>{levelLabel(c.level)}</Badge>}
    </span>
  );
}

function MiniCourse({ c, note }: { c: any; note?: string }) {
  return (
    <Link to={`/courses/${c.slug}`} className="group">
      <Card className="h-full p-4 transition group-hover:-translate-y-0.5" data-theme-accent={c.theme}>
        {note && <p className="mb-1 text-xs font-bold text-muted">{note}</p>}
        {c.subject && <p className="text-xs font-bold text-accent-ink">{c.subject}</p>}
        <h3 className="mt-0.5 font-bold leading-snug">{shortTitle(c)}</h3>
        <div className="mt-2"><LevelBadges c={c} /></div>
      </Card>
    </Link>
  );
}

export function Achievements({ items }: { items: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((a) => (
        <div key={a.id} className={`rounded-2xl border p-3 text-center ${a.earned ? 'border-accent/40 bg-accent-soft' : 'border-line bg-card opacity-70'}`} title={a.description}>
          <div className={`text-3xl ${a.earned ? '' : 'grayscale'}`} aria-hidden>
            {a.emoji}
          </div>
          <p className="mt-1 text-sm font-bold">{a.label}</p>
          <p className="text-xs text-muted">{a.earned ? 'Earned!' : a.target ? `${a.progress}/${a.target}` : a.description}</p>
        </div>
      ))}
    </div>
  );
}

export function StudentHome() {
  const { me } = useSession();
  const { data, loading } = useApi<any>('/api/my');
  if (loading || !data) return <Spinner />;
  return (
    <>
      <PageHeader eyebrow="My learning" title={`Hi ${me?.user?.name.split(' ')[0]}! 👋`}>
        Pick up where you left off, or explore something new.
      </PageHeader>
      <UpcomingClasses />
      {me?.consent?.requiresGuardian && !me.consent.ai && (
        <Notice tone="warn" icon="shield" className="mb-6">
          The AI helper and voice recording are switched off until your parent or guardian allows them. Everything else works!
        </Notice>
      )}
      {data.courses.length === 0 ? (
        <Empty title="No courses yet" icon="book">
          <Link to="/catalog" className="font-semibold text-accent-ink underline">
            Explore the catalogue
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.courses.map((c: any) => (
            <Link key={c.id} to={`/courses/${c.slug}`} className="group">
              <Card className="h-full overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-pop)]" data-theme-accent={c.theme}>
                <div className="h-2 bg-accent" />
                <div className="p-5">
                  <LevelBadges c={c} />
                  <h3 className="mt-1.5 text-lg leading-snug font-bold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {c.done} of {c.total} lessons complete
                  </p>
                  <ProgressBar value={c.done} max={c.total} className="mt-3" label={`${c.title} progress`} />
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-ink">
                    {c.done === 0 ? 'Start' : c.done === c.total ? 'Review' : 'Continue'} <Icon name="arrowR" size={15} />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {data.continuePath?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-bold">Level up 🚀</h2>
          <p className="mb-4 text-sm text-muted">You finished a course — here’s the next step on your path.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.continuePath.map((c: any) => <MiniCourse key={c.id} c={c} note={`Next after ${shortTitle({ title: c.after, level: 'x' })}`} />)}
          </div>
        </section>
      )}
      {data.recommended?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-bold">Recommended for {data.band?.grades}</h2>
          <p className="mb-4 text-sm text-muted">Beginner courses picked for your grade. Each one leads to Intermediate and Advanced.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended.map((c: any) => <MiniCourse key={c.id} c={c} />)}
          </div>
        </section>
      )}
      <h2 className="mt-10 mb-3 text-xl font-bold">Badges</h2>
      <p className="mb-4 text-sm text-muted">Badges reward how you learn — explaining, persisting and working independently.</p>
      <Achievements items={data.achievements} />
    </>
  );
}

/** Wrap matched search words in <mark>. */
function Hl({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return (
    <>
      {String(text)
        .split(re)
        .map((part, i) => (i % 2 ? <mark key={i} className="rounded bg-warn-soft px-0.5 text-ink">{part}</mark> : <span key={i}>{part}</span>))}
    </>
  );
}

type Kind = 'all' | 'courses' | 'lessons' | 'files';

function SearchResults({ q, band, level, filterCourse }: { q: string; band: string; level: string; filterCourse: (c: any) => boolean }) {
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<Kind>('all');
  useEffect(() => {
    let off = false;
    setBusy(true);
    const t = setTimeout(() => {
      api(`/api/catalog/search?q=${encodeURIComponent(q)}`)
        .then((r) => !off && setRes(r))
        .catch(() => !off && setRes({ courses: [], lessons: [], files: [] }))
        .finally(() => !off && setBusy(false));
    }, 220);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, [q]);
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  if (!res) return <Spinner label="Searching" />;
  const fits = (x: any) => (band === 'all' || x.grade_band === band) && (level === 'all' || x.level === level);
  const courses = res.courses.filter(filterCourse);
  const lessons = res.lessons.filter(fits);
  const files = res.files;
  const total = courses.length + lessons.length + files.length;
  const chip = (on: boolean) => `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? 'bg-accent text-white' : 'bg-card border border-line hover:bg-sunk'}`;
  const show = (k: Kind) => kind === 'all' || kind === k;
  return (
    <div aria-live="polite" className={busy ? 'opacity-70 transition' : 'transition'}>
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Result type">
        {(
          [
            ['all', `All (${total})`],
            ['courses', `Courses (${courses.length})`],
            ['lessons', `Lessons (${lessons.length})`],
            ['files', `Files & worksheets (${files.length})`],
          ] as [Kind, string][]
        ).map(([k, label]) => (
          <button key={k} className={chip(kind === k)} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {label}
          </button>
        ))}
      </div>
      {!total && !busy && (
        <Empty title={`Nothing found for “${q}”`} icon="search">
          Try a shorter word, a subject (“maths”, “python”), a platform (“Desmos”, “Canva”) or clear the age and level filters.
        </Empty>
      )}
      <div className="space-y-8">
        {show('courses') && courses.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Courses</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c: any) => (
                <Link key={c.id} to={`/courses/${c.slug}`} className="group">
                  <Card className="h-full p-4 transition group-hover:-translate-y-0.5" data-theme-accent={c.theme}>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="accent">
                        <Hl text={c.subject} terms={terms} />
                      </Badge>
                      <LevelBadges c={c} />
                    </div>
                    <h3 className="mt-2 leading-snug font-bold">
                      <Hl text={shortTitle(c)} terms={terms} />
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      <Hl text={c.description} terms={terms} />
                    </p>
                    <p className="mt-2 text-xs font-semibold text-muted">{c.lesson_count} lessons</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
        {show('lessons') && lessons.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Lessons</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
              {lessons.map((l: any) => (
                <li key={l.id}>
                  <Link to={`/lessons/${l.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-sunk">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <Icon name="play" size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        <Hl text={l.title} terms={terms} />
                      </span>
                      <span className="block truncate text-sm text-muted">
                        <Hl text={l.objective} terms={terms} />
                      </span>
                      <span className="block text-xs text-muted">
                        {l.subject} · {shortTitle({ title: l.course_title })}
                        {l.grade_band ? ` · ${bandLabel(l.grade_band)}` : ''}
                        {l.level ? ` · ${levelLabel(l.level)}` : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {show('files') && files.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Files &amp; worksheets</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {files.map((f: any) => (
                <li key={f.id} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-[10px] font-black text-accent">{f.type}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      <Hl text={f.title} terms={terms} />
                    </span>
                    <Link to={`/courses/${f.course_slug}`} className="block truncate text-xs text-muted hover:underline">
                      {f.subject} · {shortTitle({ title: f.course_title })}
                      {f.audience === 'teacher' ? ' · teacher only' : ''}
                    </Link>
                  </span>
                  <a href={f.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 text-sm font-semibold text-white" aria-label={`${f.kind === 'url' ? 'Open' : 'Download'} ${f.title}`}>
                    <Icon name={f.kind === 'url' ? 'link' : 'download'} size={14} /> {f.kind === 'url' ? 'Open' : 'Get'}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export function Catalog() {
  const { data, loading } = useApi<any[]>('/api/catalog');
  const { me } = useSession();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get('q') || '');
  const [band, setBand] = useState<string>(() => (me?.user?.role === 'student' && bandForBirthYear(me.user.birth_year)) || 'all');
  const [level, setLevel] = useState<string>('all');
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // "/" focuses the search box from anywhere on the page.
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        box.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    const u = new URL(location.href);
    if (q.trim()) u.searchParams.set('q', q.trim());
    else u.searchParams.delete('q');
    history.replaceState(history.state, '', u);
  }, [q]);
  if (loading || !data) return <Spinner />;
  const bandOk = (c: any) => band === 'all' || c.grade_band === band || (!c.grade_band && c.age_min != null && BANDS.find((b) => b.id === band)!.ages[0] <= c.age_max && c.age_min <= BANDS.find((b) => b.id === band)!.ages[1]);
  const filterCourse = (c: any) => bandOk(c) && (level === 'all' || c.level === level);
  const searching = q.trim().length >= 2;
  const filtered = band !== 'all' || level !== 'all';
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold transition ${on ? 'bg-ink text-paper' : 'bg-card border border-line hover:bg-sunk'}`;
  return (
    <>
      <PageHeader eyebrow="Explore" title="What do you want to learn?">
        Language, academics, life skills, technology and AI for working professionals — all built around doing, not just reading.
      </PageHeader>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mb-4 max-w-2xl">
        <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          ref={box}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQ('')}
          placeholder="Search courses, lessons, worksheets and files…"
          aria-label="Search courses, lessons and files"
          className="h-13 w-full rounded-full border border-line bg-card pr-24 pl-11 text-base [&::-webkit-search-cancel-button]:appearance-none shadow-[var(--shadow-card)] focus:border-accent focus:outline-none"
        />
        {q ? (
          <button type="button" onClick={() => (setQ(''), box.current?.focus())} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-3 py-1 text-sm font-semibold text-muted hover:bg-sunk" aria-label="Clear search">
            Clear
          </button>
        ) : (
          <kbd className="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-line px-2 py-0.5 text-xs text-muted sm:block">/</kbd>
        )}
      </form>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Age group">
        <button className={chip(band === 'all')} aria-pressed={band === 'all'} onClick={() => setBand('all')}>All ages</button>
        {BANDS.map((b) => (
          <button key={b.id} className={chip(band === b.id)} aria-pressed={band === b.id} onClick={() => setBand(b.id)} title={b.long}>{b.label}</button>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Level">
        {['all', 'beginner', 'intermediate', 'advanced'].map((l) => (
          <button key={l} className={chip(level === l)} aria-pressed={level === l} onClick={() => setLevel(l)}>{l === 'all' ? 'All levels' : levelLabel(l)}</button>
        ))}
      </div>
      {searching ? (
        <SearchResults q={q.trim()} band={band} level={level} filterCourse={filterCourse} />
      ) : (
      <div className="space-y-10">
        {filtered && !data.some((cat) => cat.subjects.some((s: any) => s.courses.some(filterCourse))) && (
          <p className="text-muted">No courses match these filters yet. Try another age group or level.</p>
        )}
        {data.map((cat) => {
          const courses = cat.subjects.flatMap((s: any) => s.courses.map((c: any) => ({ ...c, subject: s.name }))).filter(filterCourse);
          if (filtered && !courses.length) return null;
          return (
            <section key={cat.id}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Icon name={categoryIcon(cat.icon)} />
                </span>
                <div>
                  <h2 className="text-xl font-bold">{cat.name}</h2>
                  <p className="text-sm text-muted">{cat.description}</p>
                </div>
              </div>
              {courses.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((c: any) => (
                    <Link key={c.id} to={`/courses/${c.slug}`} className="group">
                      <Card className="h-full p-5 transition group-hover:-translate-y-0.5" data-theme-accent={c.theme}>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="accent">{c.subject}</Badge>
                          <LevelBadges c={c} />
                        </div>
                        <h3 className="mt-2 text-lg leading-snug font-bold">{shortTitle(c)}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
                        <p className="mt-3 text-xs font-semibold text-muted">
                          {c.age_min && `Ages ${c.age_min}–${c.age_max} · `}
                          {c.lesson_count} lesson{c.lesson_count === 1 ? '' : 's'}
                          {c.duration_minutes ? ` · ${c.duration_minutes} min` : ''}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cat.subjects.slice(0, 12).map((s: any) => (
                    <span key={s.id} className="rounded-full border border-dashed border-line px-3 py-1 text-sm text-muted">
                      {s.name}
                    </span>
                  ))}
                  <span className="px-1 py-1 text-sm text-muted">— courses coming soon</span>
                </div>
              )}
            </section>
          );
        })}
      </div>
      )}
    </>
  );
}

export function CoursePage({ id }: { id: string }) {
  const { data, loading, error, reload } = useApi<any>(`/api/courses/${id}/learn`, [id]);
  const { me } = useSession();
  const [busy, setBusy] = useState(false);
  if (error) return <Notice tone="bad">{error}</Notice>;
  if (loading || !data) return <Spinner />;
  const c = data.course;
  const lessons = data.modules.flatMap((m: any) => m.lessons);
  const done = lessons.filter((l: any) => l.progress?.status === 'completed').length;
  const enrol = async () => {
    setBusy(true);
    try {
      await api(`/api/courses/${c.id}/enrol`, { method: 'POST' });
      toast('You’re in! Let’s go.');
      await reload();
    } finally {
      setBusy(false);
    }
  };
  const next = data.recommendations.find((r: any) => r.kind === 'next');
  return (
    <div data-theme-accent={c.theme}>
      {data.preview && (
        <Notice tone="teach" icon="eye" className="mb-4">
          Staff preview — this course is <strong>{c.status}</strong>. Students can’t see it yet{lessons.some((l: any) => l.status !== 'approved') ? ', and unapproved lessons stay hidden after publishing' : ''}.
        </Notice>
      )}
      <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-accent p-6 text-white sm:p-10">
        <p className="text-sm font-bold text-white/80">
          {c.subject_name}
          {c.grade_band ? ` · ${bandLabel(c.grade_band)} · ${levelLabel(c.level)}` : ''}
          {c.age_min && ` · Ages ${c.age_min}–${c.age_max}`}
        </p>
        <h1 className="mt-1 max-w-2xl text-3xl leading-tight font-black sm:text-5xl">{shortTitle(c)}</h1>
        <p className="mt-3 max-w-xl text-lg text-white/90">{c.student_intro || c.description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!data.enrolled && me?.user?.role === 'student' ? (
            <Button size="lg" className="bg-white !text-ink hover:bg-white/90" busy={busy} onClick={enrol}>
              Join this course
            </Button>
          ) : next ? (
            <Button size="lg" className="bg-white !text-ink hover:bg-white/90" icon="play" onClick={() => navigate(`/lessons/${next.lessonId}`)}>
              {next.reason}
            </Button>
          ) : null}
          <span className="text-sm font-semibold text-white/85">
            {done}/{lessons.length} lessons done
          </span>
          {lessons.length > 0 && done >= lessons.length && data.pathway?.next && (
            <Button size="lg" className="bg-white !text-ink hover:bg-white/90" icon="up" onClick={() => navigate(`/courses/${data.pathway.next.slug}`)}>
              Level up: {levelLabel(data.pathway.next.level)}{data.pathway.next.grade_band !== c.grade_band ? ` · ${bandLabel(data.pathway.next.grade_band)}` : ''}
            </Button>
          )}
        </div>
        {data.mappings.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[...new Set(data.mappings.map((m: any) => `${m.board} ${m.grade}`))].map((b: any) => (
              <span key={b} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                Reviewed alignment: {b}
              </span>
            ))}
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-xl font-bold">Your learning journey</h2>
          {data.modules.map((m: any) => (
            <div key={m.id} className="mb-6">
              <p className="text-sm font-bold tracking-wide text-muted uppercase">{m.title}</p>
              {m.summary && <p className="mb-3 text-sm text-muted">{m.summary}</p>}
              {!m.summary && <div className="mb-3" />}
              <ol className="relative space-y-3 before:absolute before:top-4 before:bottom-4 before:left-[27px] before:w-1 before:rounded-full before:bg-line">
                {m.lessons.map((l: any, i: number) => {
                  const st = l.progress?.status;
                  return (
                    <li key={l.id} className="relative">
                      <Link to={`/lessons/${l.id}`} className="group flex items-center gap-4 rounded-[var(--radius-card)] p-2 hover:bg-card">
                        <span className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-full border-4 border-paper font-display text-xl font-black shadow-sm ${st === 'completed' ? 'bg-good text-white' : st ? 'bg-accent text-white' : 'bg-card text-ink'}`}>
                          {st === 'completed' ? <Icon name="check" size={24} /> : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold group-hover:text-accent-ink">{l.title}</span>
                          <span className="block text-sm text-muted">
                            {l.duration_minutes} min · {l.activityCount} activities
                            {l.progress?.max ? ` · ${l.progress.score}/${l.progress.max} pts` : ''}
                            {l.status !== 'approved' && ' · '}
                            {l.status !== 'approved' && <Badge tone="warn">{l.status}</Badge>}
                          </span>
                        </span>
                        <Icon name="arrowR" className="text-muted group-hover:text-accent" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
          {lessons.length === 0 && <Empty title="No lessons published yet" />}
        </div>
        <aside className="space-y-6">
          {data.pathway?.steps?.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-1 font-bold">Your {c.subject_name} path</h3>
              <p className="mb-3 text-sm text-muted">{bandLabel(c.grade_band)} · three levels, each building on the last.</p>
              <ol className="space-y-2">
                {data.pathway.steps.map((s: any, i: number) => {
                  const complete = s.total > 0 && s.done >= s.total;
                  return (
                    <li key={s.id}>
                      <Link to={`/courses/${s.slug}`} aria-current={s.current ? 'page' : undefined} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${s.current ? 'bg-accent-soft ring-2 ring-accent' : 'bg-sunk hover:bg-accent-soft'}`}>
                        <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${complete ? 'bg-good text-white' : 'bg-card'}`}>{complete ? <Icon name="check" size={16} /> : i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-muted">{levelLabel(s.level)}{s.enrolled && !complete ? ` · ${s.done}/${s.total}` : ''}</span>
                          <span className="block truncate font-semibold">{shortTitle(s)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {data.pathway.next && data.pathway.next.grade_band !== c.grade_band && (
                <Link to={`/courses/${data.pathway.next.slug}`} className="mt-3 block text-sm font-semibold text-accent-ink">
                  Then: {bandLabel(data.pathway.next.grade_band)} — {shortTitle(data.pathway.next)} →
                </Link>
              )}
            </Card>
          )}
          {data.materials?.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 font-bold">Course materials</h3>
              <ul className="space-y-2">
                {data.materials.map((r: any) => (
                  <li key={r.id}>
                    <a href={`/api/resources/${r.id}/file`} className="flex items-center gap-3 rounded-2xl bg-sunk px-3 py-2.5 hover:bg-accent-soft">
                      <Icon name="download" size={16} className="shrink-0 text-accent" />
                      <span className="text-sm font-semibold">{r.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {data.recommendations.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 font-bold">Up next for you</h3>
              <ul className="space-y-2">
                {data.recommendations.map((r: any, i: number) => (
                  <li key={i}>
                    <Link to={r.lessonId ? `/lessons/${r.lessonId}` : `/courses/${r.courseId}`} className="block rounded-2xl bg-sunk px-4 py-3 hover:bg-accent-soft">
                      <span className="block text-xs font-bold text-muted">{r.reason}</span>
                      <span className="font-semibold">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div>
            <h3 className="mb-3 font-bold">Badges in this course</h3>
            <div className="[&>div]:grid-cols-2 [&>div]:sm:grid-cols-2">
              <Achievements items={data.achievements} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
