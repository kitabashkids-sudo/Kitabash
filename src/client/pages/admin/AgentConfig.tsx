import { useEffect, useState } from 'react';
import { api, useApi } from '../../lib/api.ts';
import { Badge, Button, Card, Field, Icon, Input, ListEditor, Notice, Select, Spinner, StatusPill, Textarea, toast } from '../../components/ui.tsx';
import { StepHeader } from './Studio.tsx';

function PairEditor({ value, onChange, a, b, aLabel, bLabel }: { value: any[]; onChange: (v: any[]) => void; a: string; b: string; aLabel: string; bLabel: string }) {
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="grid gap-2 rounded-2xl bg-sunk p-2 sm:grid-cols-[1fr_1.5fr_auto]">
          <Input value={row[a]} placeholder={aLabel} aria-label={`${aLabel} ${i + 1}`} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [a]: e.target.value } : x)))} />
          <Input value={row[b]} placeholder={bLabel} aria-label={`${bLabel} ${i + 1}`} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [b]: e.target.value } : x)))} />
          <Button type="button" size="sm" variant="ghost" icon="x" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button type="button" size="sm" icon="plus" onClick={() => onChange([...value, { [a]: '', [b]: '' }])}>
        Add
      </Button>
    </div>
  );
}

export function AgentStep({ courseId, next }: { courseId: string; next: () => void }) {
  const { data, loading, reload } = useApi<any>(`/api/admin/courses/${courseId}/agent`);
  const [c, setC] = useState<any>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (data?.draft) setC(structuredClone(data.draft.config));
  }, [data]);
  if (loading || !data || !c) return <Spinner />;
  const set = (path: string, v: any) => {
    const next = structuredClone(c);
    const keys = path.split('.');
    let o = next;
    for (const k of keys.slice(0, -1)) o = o[k];
    o[keys[keys.length - 1]] = v;
    setC(next);
  };
  const save = async (andNext = false) => {
    setBusy(true);
    setErr('');
    try {
      const r = await api<{ versionId: string }>(`/api/admin/courses/${courseId}/agent`, { method: 'PUT', body: { config: c, note } });
      toast(r.versionId === data.draft.id ? 'Agent configuration saved' : 'Saved as a new draft version');
      setNote('');
      await reload();
      if (andNext) next();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const d = data.draft;
  return (
    <div className="space-y-5">
      <StepHeader n={3} title="Configure the learning agent">
        One reusable runtime, configured per course. Edits go to a draft version; the published agent only changes after you test, approve and publish.
      </StepHeader>
      <Notice tone="teach" icon="sparkle">
        <p>
          <strong>How it works:</strong> {data.approach}
        </p>
        <p className="mt-1">
          Provider: <strong>{data.provider.label}</strong>
          {!data.provider.isLLM && ' — set an AI provider key in the server environment for model-generated replies. All settings below still apply.'}
        </p>
      </Notice>
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        Editing draft <strong className="text-ink">v{d.version}</strong> <StatusPill status={d.status} />
        {d.status !== 'draft' && <span>— saving creates a new draft version.</span>}
        {data.published && (
          <span>
            · Live: v{data.published.version} <Badge tone="accent">published</Badge>
          </span>
        )}
      </p>

      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <h3 className="font-bold md:col-span-2">Identity & audience</h3>
        <Field label="Agent name">
          <Input value={c.identity.name} onChange={(e) => set('identity.name', e.target.value)} />
        </Field>
        <Field label="Purpose">
          <Input value={c.identity.purpose} onChange={(e) => set('identity.purpose', e.target.value)} />
        </Field>
        <Field label="Age-appropriate vocabulary">
          <Select value={c.audience.vocabulary} onChange={(e) => set('audience.vocabulary', e.target.value)}>
            <option value="simple">Simple (early readers)</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </Select>
        </Field>
        <Field label={`Explanation complexity: ${c.audience.complexity}/5 · max ${c.audience.maxSentences} sentences`}>
          <div className="flex gap-3">
            <input type="range" min={1} max={5} value={c.audience.complexity} onChange={(e) => set('audience.complexity', Number(e.target.value))} className="flex-1" style={{ accentColor: 'var(--accent)' }} aria-label="Complexity" />
            <input type="range" min={2} max={10} value={c.audience.maxSentences} onChange={(e) => set('audience.maxSentences', Number(e.target.value))} className="flex-1" style={{ accentColor: 'var(--accent)' }} aria-label="Max sentences" />
          </div>
        </Field>
        <Field label="Tone & interaction style" className="md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
            <Input value={c.tone} onChange={(e) => set('tone', e.target.value)} />
            <Select value={c.interactionStyle} onChange={(e) => set('interactionStyle', e.target.value)} aria-label="Interaction style">
              <option value="socratic">Socratic (asks first)</option>
              <option value="guided">Guided</option>
              <option value="direct">Direct (explains first)</option>
            </Select>
          </div>
        </Field>
        <Field label="Learning framework" className="md:col-span-2">
          <Input value={c.framework} onChange={(e) => set('framework', e.target.value)} />
        </Field>
      </Card>

      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <h3 className="font-bold md:col-span-2">Pedagogy</h3>
        <Field label="Hint ladder (gentlest first)" className="md:col-span-2" hint="Each hint request climbs one rung. Activity-specific hints written by authors are used first.">
          <ListEditor value={c.hintLadder} onChange={(v) => set('hintLadder', v)} placeholder="Level: description" addLabel="Add level" />
        </Field>
        <Field label="Questioning strategy">
          <Textarea value={c.questioningStrategy} onChange={(e) => set('questioningStrategy', e.target.value)} />
        </Field>
        <Field label="When to ask vs. explain">
          <Textarea value={c.askVsExplain} onChange={(e) => set('askVsExplain', e.target.value)} />
        </Field>
        <Field label="When to provide examples">
          <Textarea value={c.examplesPolicy} onChange={(e) => set('examplesPolicy', e.target.value)} />
        </Field>
        <Field label="Assessment rules">
          <Textarea value={c.assessmentRules} onChange={(e) => set('assessmentRules', e.target.value)} />
        </Field>
        <Field label="Misconceptions to watch for" className="md:col-span-2" hint="If a learner’s message contains the trigger phrase, the agent leads with your correction.">
          <PairEditor value={c.misconceptions} onChange={(v) => set('misconceptions', v)} a="trigger" b="correction" aLabel="Learner thinks…" bLabel="Correct it by saying…" />
        </Field>
      </Card>

      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <h3 className="font-bold md:col-span-2">Scope, safety & grounding</h3>
        <Field label="Topics outside scope" hint="Matched as whole words/phrases; the agent redirects.">
          <ListEditor value={c.outOfScope.topics} onChange={(v) => set('outOfScope.topics', v)} placeholder="Topic" addLabel="Add topic" />
        </Field>
        <Field label="Actions the agent must not do">
          <ListEditor value={c.outOfScope.actions} onChange={(v) => set('outOfScope.actions', v)} placeholder="Action" addLabel="Add action" />
        </Field>
        <Field label="Redirect message" className="md:col-span-2">
          <Input value={c.outOfScope.redirect} onChange={(e) => set('outOfScope.redirect', e.target.value)} />
        </Field>
        <Field label="Escalate to a teacher when the learner mentions…" hint="Platform safeguarding phrases are always included and can’t be removed.">
          <ListEditor value={c.escalation.triggers} onChange={(v) => set('escalation.triggers', v)} placeholder="Phrase" addLabel="Add phrase" />
        </Field>
        <Field label="Escalation message">
          <Textarea value={c.escalation.message} onChange={(e) => set('escalation.message', e.target.value)} />
        </Field>
        <Field label="Source grounding">
          <Select value={c.grounding.mode} onChange={(e) => set('grounding.mode', e.target.value)}>
            <option value="strict">Strict — only answer from course sources</option>
            <option value="prefer">Prefer sources, allow simple well-known facts</option>
            <option value="off">Off — general knowledge</option>
          </Select>
        </Field>
        <Field label="Citations">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={c.grounding.citeSources} onChange={(e) => set('grounding.citeSources', e.target.checked)} /> Show which source each answer used
          </label>
        </Field>
      </Card>

      <Card className="space-y-5 p-6">
        <h3 className="font-bold">Examples & extra instructions</h3>
        <Field label="Example exchanges (few-shot)" hint="Show the agent what a great reply looks like.">
          <PairEditor value={c.examples} onChange={(v) => set('examples', v)} a="student" b="ideal" aLabel="Learner says…" bLabel="Ideal reply…" />
        </Field>
        <Field label="Additional course instructions">
          <Textarea value={c.extraInstructions} onChange={(e) => set('extraInstructions', e.target.value)} placeholder="Anything else the agent should know about this course." />
        </Field>
        <Field label="Version note">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed? (shown in version history)" />
        </Field>
      </Card>
      {err && <Notice tone="bad">{err}</Notice>}
      <div className="flex justify-end gap-2">
        <Button busy={busy} onClick={() => save(false)}>
          Save draft
        </Button>
        <Button variant="primary" busy={busy} onClick={() => save(true)}>
          Save & generate curriculum <Icon name="arrowR" />
        </Button>
      </div>
    </div>
  );
}
