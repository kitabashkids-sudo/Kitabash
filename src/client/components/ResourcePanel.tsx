// Teacher resource panel — six tabs assembled automatically from lesson + course data.
import { useState } from 'react';
import { api } from '../lib/api.ts';
import { Badge, Button, Icon, Notice, Tabs } from './ui.tsx';
import { VisualHook } from './VisualHook.tsx';
import { ScratchBlocks } from './ScratchBlocks.tsx';
import { programToBlocks } from '../../lib/scratch/puzzle.ts';
import { projectToBlocks } from '../../lib/scratch/vm.ts';

type Tab = 'teach' | 'show' | 'facilitate' | 'resources' | 'assess' | 'ai';

const H = ({ children }: { children: React.ReactNode }) => <h4 className="mt-5 mb-2 text-xs font-bold tracking-wide text-muted uppercase first:mt-0">{children}</h4>;

/** Human-readable answer key for any registered activity type. */
export function KeyView({ type, config, keyData }: { type: string; config: any; keyData: any }) {
  const byId = (list: any[] = [], id: string) => list.find((x) => x.id === id)?.text || list.find((x) => x.id === id)?.label || list.find((x) => x.id === id)?.name || id;
  switch (type) {
    case 'block_code':
      return (
        <div>
          <p className="text-muted">One solution:</p>
          {keyData.solution && <ScratchBlocks code={programToBlocks(keyData.solution, !!config?.world?.jr)} scale={0.8} />}
          {keyData.explanation && <p className="mt-1 text-muted">{keyData.explanation}</p>}
        </div>
      );
    case 'python_lab':
      return (
        <div>
          <p className="text-muted">Goals checked: {(config.goals || []).join(' · ')}</p>
          {keyData.solution && <pre className="mt-1 overflow-x-auto rounded-lg bg-[#14161f] p-2 font-mono text-[12px] text-[#e8ecf5]">{keyData.solution}</pre>}
          {keyData.explanation && <p className="mt-1 text-muted">{keyData.explanation}</p>}
        </div>
      );
    case 'code_lab':
      return (
        <div>
          <p className="text-muted">Goals checked: {(config.goals || []).join(' · ')}</p>
          {keyData.solution &&
            projectToBlocks(keyData.solution).map((s) => (
              <div key={s.sprite} className="mt-1">
                <p className="text-xs font-bold">{s.sprite}</p>
                <ScratchBlocks code={s.blocks} scale={0.75} />
              </div>
            ))}
        </div>
      );
    case 'multiple_choice':
    case 'code_output':
      return (
        <div>
          <p>✅ {keyData.correct?.map((c: string) => byId(config.options, c)).join(', ')}</p>
          {keyData.explanation && <p className="mt-1 text-muted">{keyData.explanation}</p>}
          {keyData.feedbackByOption &&
            Object.entries(keyData.feedbackByOption).map(([k, v]) => (
              <p key={k} className="mt-1 text-xs text-muted">
                If “{byId(config.options, k)}”: {String(v)}
              </p>
            ))}
        </div>
      );
    case 'fill_blank':
      return <p>{Object.entries(keyData.blanks || {}).map(([b, a]: any) => `Blank ${b}: ${a.join(' / ')}`).join(' · ')}</p>;
    case 'ordering':
      return <ol className="list-decimal pl-5">{(keyData.order || []).map((o: string) => <li key={o}>{byId(config.items, o)}</li>)}</ol>;
    case 'matching':
      return <ul>{Object.entries(keyData.pairs || {}).map(([l, r]: any) => <li key={l}>{byId(config.left, l)} → {byId(config.right, r)}</li>)}</ul>;
    case 'categorize':
      return (
        <div className="grid grid-cols-2 gap-2">
          {config.buckets?.map((b: any) => (
            <div key={b.id}>
              <p className="font-bold">{b.label}</p>
              <p className="text-muted">{config.items.filter((i: any) => keyData.placement?.[i.id] === b.id).map((i: any) => i.text).join(', ')}</p>
            </div>
          ))}
        </div>
      );
    case 'budget_sim':
      return <p>Must include: {(keyData.required || []).map((x: string) => byId(config.items, x)).join(', ')} · keep ≥ {config.currency}{keyData.minSavings || 0}</p>;
    case 'tracing':
      return <p>Pass at ≥{Math.round((keyData.minCoverage || 0) * 100)}% coverage and ≥{Math.round((keyData.minPrecision || 0.5) * 100)}% accuracy.</p>;
    case 'speaking':
      return <p className="text-muted">Self-assessed checklist; listen for: {config.checklist?.join('; ')}</p>;
    case 'free_response':
      return (
        <div>
          <p>Look for: {(keyData.keywords || []).join(', ') || '—'}</p>
          {keyData.exemplar && <p className="mt-1 text-muted">Exemplar: “{keyData.exemplar}”</p>}
        </div>
      );
    default:
      return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(keyData, null, 1)}</pre>;
  }
}

function CoFacilitator({ lessonId }: { lessonId: string }) {
  const [items, setItems] = useState<{ q: string; a: string; cites: any[]; provider: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const ask = async (task: string, label: string, question?: string) => {
    setBusy(task);
    setErr('');
    try {
      const r = await api<any>('/api/teach/cofacilitate', { body: { lessonId, task, question } });
      setItems((x) => [{ q: label, a: r.reply, cites: r.citations, provider: r.meta.provider }, ...x]);
      setQ('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const quick = [
    ['explain', 'Alternate explanation'],
    ['activity', 'Quick activity'],
    ['example', 'Worked example'],
    ['hints', 'Hint ladder'],
    ['recap', 'Recap questions'],
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {quick.map(([t, l]) => (
          <Button key={t} size="sm" variant="secondary" busy={busy === t} onClick={() => ask(t, l)}>
            {l}
          </Button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) void ask('ask', q, q);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this lesson…" aria-label="Ask the co-facilitator" className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-sm focus:border-teach focus:outline-none" />
        <Button variant="teach" size="sm" icon="arrowR" aria-label="Ask" busy={busy === 'ask'} />
      </form>
      {err && <Notice tone="bad" className="mt-3">{err}</Notice>}
      <div className="mt-4 space-y-3">
        {items.map((it, i) => (
          <div key={i} className="kb-rise rounded-2xl bg-teach-soft p-3 text-sm">
            <p className="mb-1 text-xs font-bold text-teach">{it.q}</p>
            <p className="whitespace-pre-wrap">{it.a.replace(/\*\*(.+?)\*\*/g, '$1')}</p>
            {it.cites?.length > 0 && <p className="mt-2 text-[11px] text-muted">Sources: {it.cites.map((c) => `S${c.n} ${c.resourceTitle} (${c.ref})`).join('; ')}</p>}
            {it.provider === 'mock' && <p className="mt-1 text-[11px] text-muted">Offline demo co-facilitator (template-based; connect an AI provider for richer answers).</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourcePanel({ data, onShowAnswers }: { data: any; onShowAnswers?: (show: boolean) => void }) {
  const [tab, setTab] = useState<Tab>('teach');
  const p = data.panel;
  const [reveal, setReveal] = useState(false);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-3 py-2.5">
        <Tabs<Tab>
          wrap
          tone="teach"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'teach', label: 'Teach', icon: 'grad' },
            { id: 'show', label: 'Show', icon: 'play' },
            { id: 'facilitate', label: 'Facilitate', icon: 'users' },
            { id: 'resources', label: 'Resources', icon: 'book' },
            { id: 'assess', label: 'Assess', icon: 'check' },
            { id: 'ai', label: 'AI', icon: 'sparkle' },
          ]}
        />
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-4 text-[14px] leading-relaxed" role="tabpanel">
        {tab === 'teach' && (
          <>
            <H>Objective</H>
            <p className="font-semibold">{p.teach.objective}</p>
            {p.teach.plan?.length > 0 && (
              <>
                <H>Lesson plan ({p.teach.plan.reduce((n: number, x: any) => n + x.minutes, 0)} min)</H>
                <ol className="mb-2 space-y-1.5">
                  {p.teach.plan.map((x: any, i: number) => (
                    <li key={i} className="flex gap-3 rounded-xl bg-sunk px-3 py-2">
                      <span className="w-12 shrink-0 font-black text-teach">{x.minutes} min</span>
                      <span>
                        <span className="font-bold">{x.stage}.</span> {x.doing}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <H>Explanation</H>
            <p>{p.teach.explanation}</p>
            {p.teach.analogies.length > 0 && (
              <>
                <H>Analogies</H>
                <ul className="list-disc space-y-1 pl-5">{p.teach.analogies.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
              </>
            )}
            {p.teach.vocabulary.length > 0 && (
              <>
                <H>Vocabulary</H>
                <dl className="space-y-2">
                  {p.teach.vocabulary.map((v: any) => (
                    <div key={v.term} className="rounded-xl bg-sunk px-3 py-2">
                      <dt className="font-bold">{v.term}</dt>
                      <dd className="text-muted">{v.definition}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {p.teach.instructorNotes && (
              <>
                <H>Instructor notes</H>
                <Notice tone="teach">{p.teach.instructorNotes}</Notice>
              </>
            )}
          </>
        )}
        {tab === 'show' && (
          <>
            <H>3-second hook</H>
            <VisualHook hook={p.show.hook} compact />
            {p.show.items.length > 0 && (
              <>
                <H>Demonstrations & examples</H>
                <ul className="space-y-2">
                  {p.show.items.map((it: any, i: number) => (
                    <li key={i} className="rounded-xl border border-line p-3">
                      <p className="font-bold">
                        {it.title} <Badge>{it.kind}</Badge>
                      </p>
                      {it.description && <p className="mt-1 text-muted">{it.description}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {p.show.assets.length > 0 && (
              <>
                <H>Media</H>
                {p.show.assets.map((a: any) => (
                  <figure key={a.id} className="mb-2">
                    {a.kind === 'video' ? <video src={`/api/assets/${a.id}/file`} controls muted className="w-full rounded-xl" /> : a.kind === 'audio' ? <audio src={`/api/assets/${a.id}/file`} controls className="w-full" /> : <img src={`/api/assets/${a.id}/file`} alt={a.alt_text} className="w-full rounded-xl" />}
                    <figcaption className="text-xs text-muted">{a.title}</figcaption>
                  </figure>
                ))}
              </>
            )}
          </>
        )}
        {tab === 'facilitate' && (
          <>
            {p.facilitate.timing && (
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sunk px-3 py-1 text-xs font-bold">
                <Icon name="clock" size={13} /> {p.facilitate.timing}
              </p>
            )}
            <H>Questions to ask</H>
            <ul className="space-y-2">
              {p.facilitate.prompts.map((q: any, i: number) => (
                <li key={i} className="rounded-xl bg-sunk p-3">
                  <p className="font-semibold">“{q.prompt}”</p>
                  {q.expected && <p className="mt-1 text-xs text-muted">Expect: {q.expected}</p>}
                </li>
              ))}
            </ul>
            {p.facilitate.discussion.length > 0 && (
              <>
                <H>Discussion</H>
                <ul className="list-disc pl-5">{p.facilitate.discussion.map((d: string, i: number) => <li key={i}>{d}</li>)}</ul>
              </>
            )}
            <H>Differentiation</H>
            <div className="grid gap-2">
              {p.facilitate.differentiation.support && (
                <p className="rounded-xl bg-good-soft p-3">
                  <strong>Support:</strong> {p.facilitate.differentiation.support}
                </p>
              )}
              {p.facilitate.differentiation.stretch && (
                <p className="rounded-xl bg-teach-soft p-3">
                  <strong>Stretch:</strong> {p.facilitate.differentiation.stretch}
                </p>
              )}
            </div>
            <H>Activity guide</H>
            <ul className="space-y-2">
              {p.facilitate.activityGuides.map((a: any) => (
                <li key={a.id} className="rounded-xl border border-line p-3">
                  <p className="font-bold">
                    {a.title} <Badge>{a.phase}</Badge> <Badge tone="teach">{a.type}</Badge>
                  </p>
                  {a.hints.length > 0 && <p className="mt-1 text-xs text-muted">Hints: {a.hints.join(' → ')}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
        {tab === 'resources' && (
          <>
            {p.resources.downloads?.length > 0 && (
              <>
                <H>Printables for this lesson</H>
                <ul className="space-y-1.5">
                  {p.resources.downloads.map((d: any) => (
                    <li key={d.resourceId} className="flex items-center justify-between gap-2 rounded-xl bg-teach-soft px-3 py-2">
                      <span className="min-w-0 truncate font-semibold">{d.title}</span>
                      <a href={`/api/resources/${d.resourceId}/file`} className="shrink-0 text-xs font-bold text-teach underline">
                        Download PDF
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {p.resources.items.length > 0 && (
              <>
                <H>Worksheets & templates</H>
                {p.resources.items.map((r: any, i: number) => (
                  <details key={i} className="mb-2 rounded-xl border border-line p-3">
                    <summary className="cursor-pointer font-bold">
                      {r.title} <Badge>{r.kind}</Badge>
                    </summary>
                    {r.body && <p className="mt-2 whitespace-pre-wrap text-muted">{r.body}</p>}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block font-semibold text-teach underline">
                        Open link
                      </a>
                    )}
                  </details>
                ))}
              </>
            )}
            <H>Course knowledge library</H>
            <ul className="space-y-1.5">
              {p.resources.library.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-sunk px-3 py-2">
                  <span className="min-w-0 truncate font-semibold">{r.title}</span>
                  {r.kind === 'file' ? (
                    <a href={`/api/resources/${r.id}/file`} className="shrink-0 text-xs font-bold text-teach underline">
                      Download
                    </a>
                  ) : (
                    <a href={r.source} target="_blank" rel="noreferrer noopener" className="shrink-0 text-xs font-bold text-teach underline">
                      Link
                    </a>
                  )}
                </li>
              ))}
              {!p.resources.library.length && <li className="text-muted">No resources uploaded.</li>}
            </ul>
            {p.resources.sourceRefs.length > 0 && (
              <>
                <H>Sources this lesson draws on</H>
                <ul className="list-disc pl-5 text-muted">{p.resources.sourceRefs.map((s: any, i: number) => <li key={i}>{s.title} — {s.ref}</li>)}</ul>
              </>
            )}
            {p.resources.extension.length > 0 && (
              <>
                <H>Extension tasks</H>
                <ul className="list-disc pl-5">{p.resources.extension.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
              </>
            )}
          </>
        )}
        {tab === 'assess' && (
          <>
            <div className="mb-3 flex items-center justify-between rounded-xl bg-warn-soft px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <Icon name="lock" size={13} /> Teacher-only. Hidden in projection mode.
              </span>
              {onShowAnswers && (
                <label className="flex items-center gap-1.5 text-xs font-semibold">
                  <input type="checkbox" checked={reveal} onChange={(e) => (setReveal(e.target.checked), onShowAnswers(e.target.checked))} /> Show keys
                </label>
              )}
            </div>
            <H>Answer keys</H>
            <div className="space-y-2">
              {p.assess.answerKeys.map((k: any) => (
                <div key={k.id} className="rounded-xl border border-line p-3">
                  <p className="mb-1 font-bold">
                    {k.title} <Badge>{k.phase}</Badge>
                  </p>
                  {reveal || !onShowAnswers ? <KeyView type={k.type} config={k.config} keyData={k.key} /> : <p className="text-xs text-muted">Tick “Show keys” to reveal.</p>}
                </div>
              ))}
            </div>
            {p.assess.questions.length > 0 && (
              <>
                <H>Oral check questions</H>
                <ul className="list-disc pl-5">{p.assess.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul>
              </>
            )}
            {p.assess.rubric.length > 0 && (
              <>
                <H>Rubric</H>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {p.assess.rubric.map((r: any) => (
                        <tr key={r.criterion} className="border-b border-line align-top">
                          <th className="py-2 pr-2 text-left">{r.criterion}</th>
                          {r.levels.map((l: string, i: number) => (
                            <td key={i} className="py-2 pr-2 text-muted">
                              <span className="font-bold text-ink">{i + 1}</span> {l}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {p.assess.misconceptions.length > 0 && (
              <>
                <H>Common misconceptions</H>
                <ul className="space-y-2">
                  {p.assess.misconceptions.map((m: any, i: number) => (
                    <li key={i} className="rounded-xl bg-bad-soft p-3">
                      <p className="font-semibold">✗ {m.misconception}</p>
                      <p className="mt-0.5 text-muted">→ {m.fix}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {p.assess.mappings.length > 0 && (
              <>
                <H>Curriculum mapping</H>
                {p.assess.mappings.map((m: any, i: number) => (
                  <p key={i} className="text-xs">
                    {m.board} {m.grade} · {m.topic} <Badge tone={m.review_status === 'approved' ? 'good' : 'warn'}>{m.review_status}</Badge>
                  </p>
                ))}
              </>
            )}
          </>
        )}
        {tab === 'ai' && <CoFacilitator lessonId={data.lesson.id} />}
      </div>
    </div>
  );
}
