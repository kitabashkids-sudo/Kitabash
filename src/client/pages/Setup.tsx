import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { navigate } from '../lib/router.tsx';
import { useSession } from '../lib/session.tsx';
import { Button, Card, Field, Icon, Input, Notice, Spinner } from '../components/ui.tsx';
import { Logo } from '../components/Shell.tsx';

interface Status {
  needsSetup: boolean;
  requiresCode: boolean;
  database: string;
  storage: string;
  warning: string | null;
}

export function Setup() {
  const { refresh } = useSession();
  const [st, setSt] = useState<Status | null>(null);
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', code: '', loadDemo: true, demoPeople: false, installLibrary: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    api<Status>('/api/setup')
      .then((s) => (s.needsSetup ? setSt(s) : navigate('/login', true)))
      .catch((e) => setErr((e as Error).message));
  }, []);
  if (!st) return err ? <Notice tone="bad">{err}</Notice> : <Spinner label="Checking your installation" />;
  const mismatch = f.confirm && f.password !== f.confirm;
  const submit = async () => {
    setBusy(true);
    setErr('');
    try {
      await api('/api/setup', { body: { name: f.name, email: f.email, password: f.password, loadDemo: f.loadDemo, demoPeople: f.loadDemo && f.demoPeople, installLibrary: f.installLibrary, code: f.code || undefined } });
      await refresh();
      navigate('/admin', true);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-10 sm:items-center">
      <div className="w-full max-w-xl">
        <Logo />
        <h1 className="mt-6 text-3xl font-black">Welcome! Let’s set up Kitabash</h1>
        <p className="mt-1 text-muted">This takes one minute. You’ll create the first administrator account — that’s you.</p>

        <Card className="mt-6 p-5">
          <p className="mb-3 text-sm font-bold">Your installation</p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Icon name="check" className="text-good" /> Database: <strong>{st.database}</strong>
            </p>
            <p className="flex items-center gap-2">
              <Icon name="check" className="text-good" /> Files: <strong>{st.storage}</strong>
            </p>
          </div>
          {st.warning && (
            <Notice tone="warn" className="mt-3">
              {st.warning}
            </Notice>
          )}
        </Card>

        <Card className="mt-4 space-y-4 p-6">
          {st.requiresCode && (
            <Field label="Setup code" hint="On Render: open your service → Environment → copy the value of SETUP_CODE.">
              <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
            </Field>
          )}
          <Field label="Your name">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
          </Field>
          <Field label="Your email" hint="You’ll sign in with this.">
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password" hint="At least 8 characters.">
              <Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
            </Field>
            <Field label="Repeat password" hint={mismatch ? <span className="text-bad">Passwords don’t match</span> : undefined}>
              <Input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" />
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4">
            <input type="checkbox" className="mt-1 size-5" checked={f.installLibrary} onChange={(e) => setF({ ...f, installLibrary: e.target.checked })} />
            <span>
              <span className="block font-semibold">Install the full K-12 course library (recommended)</span>
              <span className="text-sm text-muted">Ready-to-teach courses for every subject, in grade bands K–2, 3–5, 6–8 and 9–12, each with Beginner, Intermediate and Advanced levels. It installs in the background — you can start using Kitabash straight away.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
            <input type="checkbox" className="mt-1 size-5" checked={f.loadDemo} onChange={(e) => setF({ ...f, loadDemo: e.target.checked })} />
            <span>
              <span className="block font-semibold">Add 4 sample courses</span>
              <span className="text-sm text-muted">Money Smart, Handwriting, Spoken English and a draft Maths course to explore. You can delete or archive them later.</span>
            </span>
          </label>
          {f.loadDemo && (
            <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
              <input type="checkbox" className="mt-1 size-5" checked={f.demoPeople} onChange={(e) => setF({ ...f, demoPeople: e.target.checked })} />
              <span>
                <span className="block font-semibold">Also add sample teacher, student and parent logins</span>
                <span className="text-sm text-muted">Handy for trying every screen. Their passwords are public (shown on the sign-in page), so <strong>don’t tick this on a site real children will use</strong>.</span>
              </span>
            </label>
          )}
          {err && <Notice tone="bad">{err}</Notice>}
          <Button variant="primary" size="lg" className="w-full" busy={busy} disabled={!f.name || !f.email || f.password.length < 8 || f.password !== f.confirm || (st.requiresCode && !f.code)} onClick={submit}>
            {busy ? (f.loadDemo ? 'Setting up and adding sample courses…' : 'Setting up…') : 'Create my account and start'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
