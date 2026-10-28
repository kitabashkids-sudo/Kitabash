import { api, useApi } from '../lib/api.ts';
import { Badge, Card, Empty, Notice, PageHeader, ProgressBar, Spinner, toast } from '../components/ui.tsx';

export function GuardianHome() {
  const { data: res, loading, reload } = useApi<{ children: any[]; classes: any[] }>('/api/guardian');
  if (loading || !res) return <Spinner />;
  const data = res.children;
  const now = Date.now();
  const setConsent = async (k: any, ai: boolean, audio: boolean) => {
    await api('/api/guardian/consent', { body: { studentId: k.id, ai, audio } });
    toast('Permissions updated');
    reload();
  };
  return (
    <>
      <PageHeader eyebrow="Guardian" title="Your child’s learning">
        See progress and teacher feedback, and choose which features your child can use.
      </PageHeader>
      {!data.length && <Empty title="No learners linked yet">Ask the school administrator to link your account to your child.</Empty>}
      {res.classes.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="mb-3 text-xl font-black">Live classes</h2>
          <ul className="divide-y divide-line text-sm">
            {res.classes.map((c: any, i: number) => {
              const past = c.status === 'ended' || new Date(c.starts_at).getTime() < now - 3 * 3600_000;
              return (
                <li key={i} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{c.title}</span>
                    <span className="block text-muted">{c.child} · {c.course_title} · {new Date(c.starts_at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                  </span>
                  {c.status === 'live' ? <Badge tone="bad">Live now</Badge> : past ? (c.seconds ? <Badge tone="good">Attended · {Math.max(1, Math.round(c.seconds / 60))} min</Badge> : <Badge tone="warn">Missed</Badge>) : <Badge tone="teach">Upcoming</Badge>}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <div className="space-y-6">
        {data.map((k) => (
          <Card key={k.id} className="p-6">
            <h2 className="text-2xl font-black">{k.name}</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <section>
                <h3 className="mb-3 font-bold">Progress</h3>
                {k.courses.map((c: any) => (
                  <div key={c.title} className="mb-3">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">{c.title}</span>
                      <span className="text-muted">
                        {c.done}/{c.total}
                      </span>
                    </div>
                    <ProgressBar value={c.done} max={c.total} label={c.title} />
                  </div>
                ))}
                <h3 className="mt-5 mb-2 font-bold">Recent teacher feedback</h3>
                {k.feedback.length ? (
                  <ul className="space-y-2 text-sm">
                    {k.feedback.map((f: any, i: number) => (
                      <li key={i} className="rounded-xl bg-sunk p-3">
                        <span className="text-xs font-bold text-muted">{f.activity}</span>
                        <p>{f.comment}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No feedback yet.</p>
                )}
              </section>
              <section>
                <h3 className="mb-3 font-bold">Permissions</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
                    <input type="checkbox" className="mt-1 size-5" checked={k.consent_ai} onChange={(e) => setConsent(k, e.target.checked, k.consent_audio)} />
                    <span>
                      <span className="block font-semibold">AI learning helper</span>
                      <span className="text-sm text-muted">An AI chat that gives hints about lessons. It is told not to collect personal details; questions are stored without your child’s name and deleted after the retention period. Safety concerns are flagged to teachers.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
                    <input type="checkbox" className="mt-1 size-5" checked={k.consent_audio} onChange={(e) => setConsent(k, k.consent_ai, e.target.checked)} />
                    <span>
                      <span className="block font-semibold">Microphone & camera</span>
                      <span className="text-sm text-muted">For speaking practice (recordings stay in the browser and are never uploaded) and for live video classes with the teacher. Live classes are not recorded. When this is off, your child can still watch, listen and use the class chat.</span>
                    </span>
                  </label>
                </div>
                {k.consented_at && <p className="mt-2 text-xs text-muted">Last updated {k.consented_at}</p>}
                <Notice className="mt-4">To export or delete your child’s data, contact the school administrator.</Notice>
              </section>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
