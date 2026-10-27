import { useState } from 'react';
import { api, useApi } from '../../lib/api.ts';
import { Badge, Button, Card, Empty, Field, Icon, Input, Notice, Select, Spinner, toast } from '../../components/ui.tsx';
import { ChatThread } from '../../components/TutorChat.tsx';
import { StepHeader } from './Studio.tsx';

const CATS = [
  ['typical', 'Typical question'],
  ['incorrect', 'Incorrect answer / answer-seeking'],
  ['misconception', 'Common misconception'],
  ['off_topic', 'Request outside the course'],
  ['age', 'Different age / skill level'],
  ['ambiguous', 'Incomplete or ambiguous'],
  ['unsupported', 'Unsupported question'],
  ['grounding', 'Source-grounded explanation'],
  ['safety', 'Safety / personal data'],
];

export function TestStep({ courseId, modules, next }: { courseId: string; modules: any[]; next: () => void }) {
  const { data, loading, reload } = useApi<any[]>(`/api/admin/courses/${courseId}/tests`);
  const [form, setForm] = useState({ category: 'typical', prompt: '', age: '', mustInclude: '', mustNotInclude: '', refusal: '', citation: false, escalation: '' });
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [age, setAge] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [chatKey, setChatKey] = useState(0);
  const lessons = modules.flatMap((m) => m.lessons);

  const runAll = async () => {
    setBusy('run');
    setErr('');
    try {
      const r = await api<any>(`/api/admin/courses/${courseId}/tests/run`, { body: {} });
      toast(`v${r.version}: ${r.passed}/${r.total} tests passed`, r.passed === r.total ? 'good' : 'bad');
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
    }
  };
  const add = async () => {
    setErr('');
    try {
      const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
      const tri = (s: string) => (s === 'yes' ? true : s === 'no' ? false : undefined);
      await api(`/api/admin/courses/${courseId}/tests`, {
        body: {
          category: form.category,
          prompt: form.prompt,
          student_age: form.age ? Number(form.age) : undefined,
          expectations: { mustInclude: list(form.mustInclude), mustNotInclude: list(form.mustNotInclude), expectRefusal: tri(form.refusal), expectCitation: form.citation || undefined, expectEscalation: tri(form.escalation) },
        },
      });
      setForm({ ...form, prompt: '', mustInclude: '', mustNotInclude: '' });
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const passed = data?.filter((t) => t.lastRun?.passed).length || 0;
  const ran = data?.filter((t) => t.lastRun).length || 0;
  return (
    <div className="space-y-5">
      <StepHeader
        n={5}
        title="Test the agent in the sandbox"
        actions={
          <>
            <Button icon="plus" onClick={async () => (await api(`/api/admin/courses/${courseId}/tests/starter`, { method: 'POST' }), reload())}>
              Add starter suite
            </Button>
            <Button variant="primary" icon="play" busy={busy === 'run'} disabled={!data?.length} onClick={runAll}>
              Run all tests
            </Button>
          </>
        }
      >
        Tests run against the <strong>draft</strong> configuration. Revise instructions, add examples or knowledge, then re-run. Results are stored per version and are required before approval.
      </StepHeader>
      {err && <Notice tone="bad">{err}</Notice>}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Test cases</h3>
              {ran > 0 && (
                <Badge tone={passed === ran ? 'good' : 'warn'}>
                  {passed}/{ran} passing
                </Badge>
              )}
            </div>
            {loading || !data ? (
              <Spinner />
            ) : !data.length ? (
              <Empty title="No tests yet" icon="flask">
                Add the starter suite to cover typical, off-topic, misconception, age and safety cases.
              </Empty>
            ) : (
              <ul className="space-y-2">
                {data.map((t) => (
                  <li key={t.id} className={`rounded-2xl border-2 p-3 ${!t.lastRun ? 'border-line' : t.lastRun.passed ? 'border-good/40' : 'border-bad/50'}`}>
                    <div className="flex items-start gap-2">
                      <Icon name={!t.lastRun ? 'clock' : t.lastRun.passed ? 'check' : 'x'} className={`mt-0.5 ${!t.lastRun ? 'text-muted' : t.lastRun.passed ? 'text-good' : 'text-bad'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">“{t.prompt}”</p>
                        <p className="mt-0.5 flex flex-wrap gap-1 text-xs">
                          <Badge>{t.category.replace('_', ' ')}</Badge>
                          {t.student_age && <Badge>age {t.student_age}</Badge>}
                        </p>
                        {t.lastRun && (
                          <>
                            <p className="mt-2 rounded-xl bg-sunk p-2.5 text-sm">{t.lastRun.response}</p>
                            <ul className="mt-2 flex flex-wrap gap-1">
                              {t.lastRun.checks.map((c: any, i: number) => (
                                <li key={i} title={c.detail}>
                                  <Badge tone={c.pass ? 'good' : 'bad'}>
                                    {c.pass ? '✓' : '✗'} {c.name}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                            {t.lastRun.checks.filter((c: any) => !c.pass && c.detail).map((c: any, i: number) => (
                              <p key={i} className="mt-1 text-xs text-bad">{c.detail}</p>
                            ))}
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button size="sm" variant="ghost" icon="play" aria-label="Run this test" busy={busy === t.id} onClick={async () => (setBusy(t.id), await api(`/api/admin/courses/${courseId}/tests/run`, { body: { testId: t.id } }).catch((e) => setErr(e.message)), setBusy(''), reload())} />
                        <Button size="sm" variant="ghost" icon="trash" aria-label="Delete test" onClick={async () => (await api(`/api/admin/courses/${courseId}/tests/${t.id}`, { method: 'DELETE' }), reload())} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="space-y-3 p-5">
            <h3 className="font-bold">Add a test case</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
              <Field label="Category">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Learner age">
                <Input type="number" min={3} max={99} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </Field>
            </div>
            <Field label="Learner message">
              <Input value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="What would a learner type?" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Reply must include (comma-separated)">
                <Input value={form.mustInclude} onChange={(e) => setForm({ ...form, mustInclude: e.target.value })} />
              </Field>
              <Field label="Reply must NOT include">
                <Input value={form.mustNotInclude} onChange={(e) => setForm({ ...form, mustNotInclude: e.target.value })} />
              </Field>
              <Field label="Should it redirect/decline?">
                <Select value={form.refusal} onChange={(e) => setForm({ ...form, refusal: e.target.value })}>
                  <option value="">Don’t check</option>
                  <option value="yes">Yes</option>
                  <option value="no">No — answer normally</option>
                </Select>
              </Field>
              <Field label="Should it escalate to a teacher?">
                <Select value={form.escalation} onChange={(e) => setForm({ ...form, escalation: e.target.value })}>
                  <option value="">Don’t check</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.citation} onChange={(e) => setForm({ ...form, citation: e.target.checked })} /> Must cite a course source
            </label>
            <div className="flex justify-end">
              <Button variant="primary" icon="plus" disabled={!form.prompt.trim()} onClick={add}>
                Add test
              </Button>
            </div>
          </Card>
        </div>
        <Card className="flex h-[640px] flex-col overflow-hidden xl:sticky xl:top-20">
          <div className="border-b border-line p-4">
            <h3 className="font-bold">Free-play sandbox</h3>
            <p className="text-xs text-muted">Chat with the draft agent as a learner. Not logged to insights.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Select value={age} onChange={(e) => (setAge(e.target.value), setChatKey((k) => k + 1))} aria-label="Simulated learner age">
                <option value="">Any age</option>
                {[6, 8, 10, 12, 14, 16].map((a) => (
                  <option key={a} value={a}>
                    Learner aged {a}
                  </option>
                ))}
              </Select>
              <Select value={lessonId} onChange={(e) => (setLessonId(e.target.value), setChatKey((k) => k + 1))} aria-label="Lesson context">
                <option value="">No lesson context</option>
                {lessons.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ChatThread key={chatKey} endpoint={`/api/admin/courses/${courseId}/sandbox`} payload={{ age: age ? Number(age) : undefined, lessonId: lessonId || undefined }} greeting="Sandbox ready. Try a typical question, a wrong answer, an off-topic request, or a safety scenario." suggestions={['Can you give me a hint?', 'Just tell me the answer', 'What is the capital of France?']} compact />
          </div>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={next}>
          Next: approve & publish <Icon name="arrowR" />
        </Button>
      </div>
    </div>
  );
}
