import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { navigate } from '../lib/router.tsx';
import { useSession } from '../lib/session.tsx';
import { Button, Field, Input, Notice } from '../components/ui.tsx';
import { Logo } from '../components/Shell.tsx';

const DEMO = [
  { role: 'Admin', email: 'admin@kitabash.local', pw: 'Admin#2026', blurb: 'Agent Training Studio, curriculum, publishing' },
  { role: 'Teacher', email: 'teacher@kitabash.local', pw: 'Teach#2026', blurb: 'Live teaching workspace & resource panel' },
  { role: 'Student', email: 'aarav@kitabash.local', pw: 'Learn#2026', blurb: 'Aarav, 10 — guardian consent given' },
  { role: 'Student (no consent)', email: 'meera@kitabash.local', pw: 'Learn#2026', blurb: 'Meera, 9 — AI helper & recording locked' },
  { role: 'Guardian', email: 'parent@kitabash.local', pw: 'Parent#2026', blurb: 'Progress and consent controls' },
];

export function Login() {
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    api<any>('/api/setup')
      .then((s) => (s.needsSetup ? navigate('/setup', true) : setDemo(!!s.demoAccounts)))
      .catch(() => {});
  }, []);
  const submit = async (e?: string, p?: string) => {
    setBusy(true);
    setErr('');
    try {
      const r = await api<any>('/api/auth/login', { body: { email: e ?? email, password: p ?? pw } });
      await refresh();
      navigate(r.user.role === 'admin' ? '/admin' : r.user.role === 'instructor' ? '/teach' : '/', true);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-accent p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="[&_rect]:fill-white [&_path]:fill-[var(--accent)]">
          <Logo />
        </div>
        <div>
          <h1 className="max-w-md text-5xl leading-[1.05] font-black">Learn by doing. Every subject.</h1>
          <ul className="mt-8 space-y-3 text-lg font-semibold">
            {['Engaging learning.', 'Easy understanding.', 'Practical activities.', 'Less teacher preparation.'].map((t, i) => (
              <li key={t} className="kb-rise flex items-center gap-3" style={{ animationDelay: `${i * 120}ms` }}>
                <span className="grid size-7 place-items-center rounded-full bg-white/20 text-sm">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/75">Learn → Perform → Probe, powered by configurable AI learning agents.</p>
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute top-24 -right-10 size-40 rounded-full bg-white/10" />
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-3xl font-black">Welcome back</h2>
          <p className="mt-1 text-muted">Sign in to continue learning.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Field label="Email">
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            </Field>
            {err && <Notice tone="bad">{err}</Notice>}
            <Button variant="primary" size="lg" className="w-full" busy={busy}>
              Sign in
            </Button>
          </form>
          {demo && <div className="mt-8">
            <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Demo accounts (sample data)</p>
            <div className="grid gap-2">
              {DEMO.map((d) => (
                <button key={d.email} onClick={() => submit(d.email, d.pw)} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-2.5 text-left hover:border-accent">
                  <span>
                    <span className="block text-sm font-bold">{d.role}</span>
                    <span className="block text-xs text-muted">{d.blurb}</span>
                  </span>
                  <span className="text-xs font-semibold text-accent-ink">Sign in →</span>
                </button>
              ))}
            </div>
          </div>}
        </div>
      </section>
    </div>
  );
}
