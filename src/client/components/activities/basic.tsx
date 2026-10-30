import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui.tsx';
import { ScratchBlocks } from '../ScratchBlocks.tsx';
import type { ActivityProps } from './types.ts';

const seededShuffle = <T,>(arr: T[], seed: string): T[] => {
  const a = [...arr];
  let h = [...seed].reduce((x, c) => (x * 33 + c.charCodeAt(0)) >>> 0, 5381);
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const mark = (ok: boolean | undefined) => (ok === undefined ? '' : ok ? 'border-good bg-good-soft' : 'border-bad bg-bad-soft');

// ── Multiple choice (+ code_output preset) ─────────────────
export function MultipleChoice({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const sel: string[] = value?.selected || [];
  const multi = !!c.multi;
  return (
    <fieldset>
      <legend className="mb-3 text-lg font-semibold">{c.question}</legend>
      {c.blocks && <ScratchBlocks code={c.blocks} className="mb-4 rounded-2xl bg-[#f9f9fb] p-3" />}
      {c.code && <pre className="mb-4 overflow-x-auto rounded-2xl bg-[#1d2230] p-4 font-mono text-sm text-white">{c.code}</pre>}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {c.options.map((o: any, i: number) => {
          const on = sel.includes(o.id);
          const showMark = result && on;
          return (
            <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 transition ${on ? 'border-accent' : 'border-line hover:border-accent/50'} ${showMark ? mark(result.correct) : ''} ${locked ? 'cursor-default' : ''}`}>
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={activity.id}
                className="sr-only"
                checked={on}
                disabled={locked}
                onChange={() => setValue({ selected: multi ? (on ? sel.filter((s) => s !== o.id) : [...sel, o.id]) : [o.id] })}
              />
              <span className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-black ${on ? 'bg-accent text-white' : 'bg-sunk text-muted'}`}>{String.fromCharCode(65 + i)}</span>
              <span className="font-medium">
                {o.text}
                {o.blocks && <ScratchBlocks code={o.blocks} scale={0.85} className="mt-1" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Fill in the blanks ─────────────────────────────────────
export function FillBlank({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const answers: Record<string, string> = value?.answers || {};
  const parts = String(c.text).split(/(\[\[\w+\]\])/g);
  const blanks = parts.filter((p) => /^\[\[\w+\]\]$/.test(p)).map((p) => p.slice(2, -2));
  const [focus, setFocus] = useState<string | null>(null);
  const per = result?.detail?.perBlank as Record<string, boolean> | undefined;
  const fillNext = (word: string) => {
    const target = focus && !answers[focus] ? focus : blanks.find((b) => !answers[b]) || focus;
    if (target) setValue({ answers: { ...answers, [target]: word } });
  };
  return (
    <div>
      <p className="text-lg leading-[2.6rem]">
        {parts.map((p, i) => {
          const m = p.match(/^\[\[(\w+)\]\]$/);
          if (!m) return <span key={i}>{p}</span>;
          const b = m[1];
          return (
            <input
              key={i}
              aria-label={`Blank ${blanks.indexOf(b) + 1} of ${blanks.length}`}
              value={answers[b] || ''}
              disabled={locked}
              onFocus={() => setFocus(b)}
              onChange={(e) => setValue({ answers: { ...answers, [b]: e.target.value } })}
              className={`mx-1 inline-block h-10 w-36 rounded-xl border-2 border-dashed bg-card px-2 text-center font-semibold focus:border-solid focus:border-accent focus:outline-none ${per ? mark(per[b]) : 'border-accent/60'}`}
            />
          );
        })}
      </p>
      {c.wordBank?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Word bank</p>
          <div className="flex flex-wrap gap-2">
            {c.wordBank.map((w: string) => (
              <button key={w} disabled={locked} onClick={() => fillNext(w)} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold hover:border-accent hover:bg-accent-soft disabled:opacity-50">
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ordering ───────────────────────────────────────────────
export function Ordering({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const initial = useMemo(() => seededShuffle(c.items.map((i: any) => i.id), activity.id), [activity.id]);
  const order: string[] = value?.order || initial;
  const [drag, setDrag] = useState<number | null>(null);
  const [live, setLive] = useState('');
  const byId = Object.fromEntries(c.items.map((i: any) => [i.id, i]));
  const pos = result?.detail?.positions as boolean[] | undefined;
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || locked) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setValue({ order: next });
    setLive(`${byId[x].text} moved to position ${to + 1}`);
  };
  useEffect(() => {
    if (!value) setValue({ order: initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      {c.prompt && <p className="mb-3 text-lg font-semibold">{c.prompt}</p>}
      <ol className="space-y-2">
        {order.map((idv, i) => (
          <li
            key={idv}
            draggable={!locked}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drag !== null && (move(drag, i), setDrag(null))}
            className={`flex items-center gap-3 rounded-2xl border-2 bg-card px-3 py-2.5 ${pos ? mark(pos[i]) : 'border-line'} ${!locked ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-display font-black text-accent-ink">{i + 1}</span>
            <span className="flex-1 font-medium">{byId[idv].blocks ? <ScratchBlocks code={byId[idv].blocks} scale={0.9} label={byId[idv].text} /> : byId[idv].text}</span>
            <span className="flex gap-1">
              <button aria-label={`Move ${byId[idv].text} up`} disabled={locked || i === 0} onClick={() => move(i, i - 1)} className="grid size-8 place-items-center rounded-full hover:bg-sunk disabled:opacity-30">
                <Icon name="up" size={16} />
              </button>
              <button aria-label={`Move ${byId[idv].text} down`} disabled={locked || i === order.length - 1} onClick={() => move(i, i + 1)} className="grid size-8 place-items-center rounded-full hover:bg-sunk disabled:opacity-30">
                <Icon name="down" size={16} />
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{live}</p>
    </div>
  );
}

// ── Matching ───────────────────────────────────────────────
export function Matching({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const pairs: Record<string, string> = value?.pairs || {};
  const right = useMemo(() => seededShuffle(c.right, activity.id + 'r'), [activity.id]);
  const per = result?.detail?.perPair as Record<string, boolean> | undefined;
  return (
    <div className="space-y-2.5">
      {c.left.map((l: any) => (
        <div key={l.id} className={`grid gap-2 rounded-2xl border-2 bg-card p-3 sm:grid-cols-[1fr_1.4fr] sm:items-center ${per ? mark(per[l.id]) : 'border-line'}`}>
          <span className="font-semibold">{l.text}</span>
          <select
            aria-label={`Match for ${l.text}`}
            disabled={locked}
            value={pairs[l.id] || ''}
            onChange={(e) => setValue({ pairs: { ...pairs, [l.id]: e.target.value } })}
            className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-[15px] focus:border-accent focus:outline-none"
          >
            <option value="">Choose…</option>
            {right.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.text}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// ── Categorize (drag & drop + tap alternative) ─────────────
export function Categorize({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const placement: Record<string, string> = value?.placement || {};
  const [picked, setPicked] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const items = useMemo(() => seededShuffle(c.items, activity.id), [activity.id]);
  const per = result?.detail?.perItem as Record<string, boolean> | undefined;
  const place = (item: string, bucket: string | null) => {
    if (locked) return;
    const next = { ...placement };
    if (bucket) next[item] = bucket;
    else delete next[item];
    setValue({ placement: next });
    setPicked(null);
  };
  const Chip = ({ it }: { it: any }) => (
    <div
      draggable={!locked}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
      className={`flex items-center gap-2 rounded-2xl border-2 bg-card px-3 py-2 text-sm font-semibold shadow-sm ${picked === it.id ? 'border-accent ring-4 ring-accent/20' : per && placement[it.id] ? mark(per[it.id]) : 'border-line'} ${!locked ? 'cursor-grab' : ''}`}
    >
      <button className="flex flex-1 items-center gap-2 text-left" disabled={locked} aria-pressed={picked === it.id} onClick={() => setPicked(picked === it.id ? null : it.id)}>
        {it.emoji && <span className="text-xl" aria-hidden>{it.emoji}</span>}
        <span>{it.text}</span>
      </button>
      {placement[it.id] && !locked && (
        <button aria-label={`Remove ${it.text}`} onClick={() => place(it.id, null)} className="text-muted hover:text-ink">
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
  const unplaced = items.filter((i: any) => !placement[i.id]);
  return (
    <div>
      <div className="mb-4 min-h-14 rounded-2xl bg-sunk p-3" aria-label="Cards to sort">
        {unplaced.length ? (
          <div className="flex flex-wrap gap-2">
            {unplaced.map((it: any) => <Chip key={it.id} it={it} />)}
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-muted">All cards placed — check your answer!</p>
        )}
        {picked && <p className="mt-2 text-xs font-semibold text-accent-ink">Now tap a basket below to place it.</p>}
      </div>
      <div className={`grid gap-3 ${c.buckets.length === 2 ? 'grid-cols-2' : 'sm:grid-cols-3'}`}>
        {c.buckets.map((b: any) => (
          <div
            key={b.id}
            onDragOver={(e) => (e.preventDefault(), setOver(b.id))}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              place(e.dataTransfer.getData('text/plain'), b.id);
            }}
            className={`min-h-40 rounded-[var(--radius-card)] border-2 border-dashed p-3 transition ${over === b.id ? 'border-accent bg-accent-soft' : 'border-line bg-card'}`}
          >
            <button disabled={!picked || locked} onClick={() => picked && place(picked, b.id)} className={`mb-3 w-full rounded-xl py-2 font-display text-lg font-black ${picked ? 'bg-accent text-white' : 'bg-sunk text-ink'}`} aria-label={picked ? `Place selected card in ${b.label}` : b.label}>
              {b.label}
            </button>
            <div className="space-y-2">
              {items.filter((i: any) => placement[i.id] === b.id).map((it: any) => <Chip key={it.id} it={it} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Free response ──────────────────────────────────────────
export function FreeResponse({ activity, value, setValue, locked }: ActivityProps) {
  const c = activity.config;
  const text: string = value?.text || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const min = c.minWords || 5;
  return (
    <div>
      <label htmlFor={`fr-${activity.id}`} className="mb-3 block text-lg font-semibold">
        {c.prompt}
      </label>
      {c.sentenceStarters?.length > 0 && !locked && (
        <div className="mb-2 flex flex-wrap gap-2">
          {c.sentenceStarters.map((s: string) => (
            <button key={s} onClick={() => setValue({ text: (text ? text.trimEnd() + ' ' : '') + s + ' ' })} className="rounded-full bg-sunk px-3 py-1 text-sm font-medium hover:bg-accent-soft">
              {s}
            </button>
          ))}
        </div>
      )}
      <textarea
        id={`fr-${activity.id}`}
        value={text}
        disabled={locked}
        onChange={(e) => setValue({ text: e.target.value.slice(0, 3000) })}
        rows={5}
        className="w-full rounded-2xl border-2 border-line bg-card p-4 text-[16px] leading-relaxed focus:border-accent focus:outline-none"
        placeholder="Write your thinking here…"
      />
      <p className={`mt-1 text-right text-xs font-semibold ${words >= min ? 'text-good' : 'text-muted'}`} aria-live="polite">
        {words} / {min}+ words
      </p>
    </div>
  );
}
