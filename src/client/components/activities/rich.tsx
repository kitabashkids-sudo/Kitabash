import { useEffect, useRef, useState } from 'react';
import { Icon, Notice } from '../ui.tsx';
import type { ActivityProps } from './types.ts';

// ── Budget simulation ──────────────────────────────────────
export function BudgetSim({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const chosen: string[] = value?.chosen || [];
  const total = c.items.filter((i: any) => chosen.includes(i.id)).reduce((s: number, i: any) => s + i.cost, 0);
  const left = c.budget - total;
  const cur = c.currency || '';
  const pct = Math.max(0, Math.min(100, (left / c.budget) * 100));
  return (
    <div>
      {c.scenario && <p className="mb-3 text-sm font-semibold text-muted">Scenario: {c.scenario}</p>}
      <div className="sticky top-2 z-10 mb-4 rounded-2xl border border-line bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-bold text-muted">Money left</span>
          <span className={`font-display text-3xl font-black tabular-nums ${left < 0 ? 'text-bad' : ''}`} aria-live="polite">
            {left < 0 ? '−' : ''}
            {cur}
            {Math.abs(left)}
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-sunk" aria-hidden>
          <div className={`h-full rounded-full transition-[width] duration-500 ${left < 0 ? 'bg-bad' : 'bg-good'}`} style={{ width: `${left < 0 ? 100 : pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Budget {cur}
          {c.budget} · Spent {cur}
          {total}
          {left < 0 && <strong className="ml-1 text-bad">— over budget!</strong>}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {c.items.map((it: any) => {
          const on = chosen.includes(it.id);
          return (
            <button
              key={it.id}
              aria-pressed={on}
              disabled={locked}
              onClick={() => setValue({ chosen: on ? chosen.filter((x) => x !== it.id) : [...chosen, it.id] })}
              className={`kb-wiggle relative rounded-2xl border-2 p-3 text-left transition ${on ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:border-accent/50'}`}
            >
              {on && (
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-accent text-white">
                  <Icon name="check" size={14} />
                </span>
              )}
              <span className="text-3xl" aria-hidden>
                {it.emoji}
              </span>
              <span className="mt-1 block text-sm leading-tight font-semibold">{it.name}</span>
              <span className="mt-1 block font-display text-lg font-black">
                {cur}
                {it.cost}
              </span>
            </button>
          );
        })}
      </div>
      {result?.detail && (
        <p className="mt-3 text-sm text-muted">
          You spent {cur}
          {result.detail.total} and kept {cur}
          {result.detail.left}.
        </p>
      )}
    </div>
  );
}

// ── Tracing ────────────────────────────────────────────────
export function Tracing({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config;
  const guide: number[][][] = c.guide;
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const strokes: number[][][] = value?.strokes || [];
  const [, force] = useState(0);
  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, Math.round(((e.clientY - r.top) / r.height) * 1000) / 10];
  };
  const start = (e: React.PointerEvent) => {
    if (locked) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    setValue({ strokes: [...strokes, [toLocal(e)]] });
  };
  const moveP = (e: React.PointerEvent) => {
    if (!drawing.current || locked) return;
    const s = [...strokes];
    const last = s[s.length - 1] || [];
    const p = toLocal(e);
    const prev = last[last.length - 1];
    if (prev && Math.hypot(prev[0] - p[0], prev[1] - p[1]) < 1.2) return;
    s[s.length - 1] = [...last, p];
    setValue({ strokes: s });
  };
  const end = () => {
    drawing.current = false;
    force((n) => n + 1);
  };
  const first = guide[0]?.[0];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[340px]">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="aspect-square w-full touch-none rounded-[var(--radius-card)] border-2 border-line bg-card select-none"
          onPointerDown={start}
          onPointerMove={moveP}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          role="img"
          aria-label={`Tracing area for ${!c.glyph ? 'the shape' : c.glyph.length === 1 ? (/[0-9]/.test(c.glyph) ? `the number ${c.glyph}` : `the letter ${c.glyph}`) : `the ${String(c.glyph).replace(/-/g, ' ')} pattern`}. Draw over the dotted guide starting at the green dot.`}
        >
          <line x1="6" y1="40" x2="94" y2="40" stroke="var(--line)" strokeWidth=".8" strokeDasharray="2 2" />
          <line x1="6" y1="80" x2="94" y2="80" stroke="var(--muted)" strokeOpacity=".4" strokeWidth="1" />
          {guide.map((s, i) => (
            <polyline key={i} points={s.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--muted)" strokeOpacity=".5" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="trace-guide" />
          ))}
          {first && <circle cx={first[0]} cy={first[1]} r="4" fill="var(--good)" />}
          {guide.length > 1 &&
            guide.map((s, i) => (
              <text key={`n${i}`} x={s[0][0] + 4} y={s[0][1] - 3} fontSize="6" fontWeight="800" fill="var(--good)">
                {i + 1}
              </text>
            ))}
          {strokes.map((s, i) => (
            <polyline key={`s${i}`} points={s.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button disabled={locked || !strokes.length} onClick={() => setValue({ strokes: [] })} className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold disabled:opacity-40">
          <Icon name="refresh" size={14} /> Clear
        </button>
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" disabled={locked} checked={!!value?.offline} onChange={(e) => setValue({ ...(value || {}), offline: e.target.checked })} />
          I practised on paper instead
        </label>
      </div>
      {result?.detail?.coverage !== undefined && (
        <div className="flex gap-4 text-sm font-semibold">
          <span>Coverage {result.detail.coverage}%</span>
          <span>Accuracy {result.detail.accuracy}%</span>
        </div>
      )}
    </div>
  );
}

// ── Speaking practice ──────────────────────────────────────
export function Speaking({ activity, value, setValue, locked, consentAudio }: ActivityProps) {
  const c = activity.config;
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const chunks = useRef<Blob[]>([]);
  const self: Record<number, boolean> = value?.selfCheck || {};
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  const listen = () => {
    if (!('speechSynthesis' in window)) return setErr('This browser cannot read text aloud. Ask your teacher to model the phrase.');
    const u = new SpeechSynthesisUtterance(c.phrase);
    u.lang = c.lang || 'en-IN';
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  const startRec = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType });
        setUrl(URL.createObjectURL(blob)); // stays on this device; never uploaded
        setValue({ ...(value || {}), recorded: true });
      };
      r.start();
      setRec(r);
      setTimeout(() => r.state === 'recording' && r.stop(), 20000);
    } catch {
      setErr('Microphone not available or permission denied. You can read aloud to your teacher instead.');
    }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card)] bg-accent-soft p-5 text-center">
        <p className="font-display text-2xl font-black sm:text-3xl">“{c.phrase}”</p>
        {c.tips?.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {c.tips.map((t: string) => (
              <li key={t} className="rounded-full bg-card/70 px-3 py-1 text-xs font-semibold">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={listen} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper">
          <Icon name="speaker" /> Listen
        </button>
        {consentAudio ? (
          rec && rec.state === 'recording' ? (
            <button onClick={() => (rec.stop(), setRec(null))} className="inline-flex items-center gap-2 rounded-full bg-bad px-4 py-2.5 text-sm font-bold text-white">
              <Icon name="stop" /> Stop
            </button>
          ) : (
            <button disabled={locked} onClick={startRec} className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              <Icon name="mic" /> {url ? 'Record again' : 'Record'}
            </button>
          )
        ) : null}
      </div>
      {!consentAudio && <Notice tone="warn">Recording needs permission from your parent or guardian. You can still listen, practise aloud and do the self-check.</Notice>}
      {url && <audio controls src={url} className="mx-auto w-full max-w-sm" aria-label="Your recording" />}
      {url && <p className="text-center text-xs text-muted">Your recording stays on this device and is not uploaded.</p>}
      {err && <Notice tone="bad">{err}</Notice>}
      <fieldset className="rounded-2xl border border-line p-4">
        <legend className="px-1 text-sm font-bold">Self-check: tick what you did well</legend>
        <div className="space-y-2">
          {c.checklist.map((item: string, i: number) => (
            <label key={i} className="flex items-center gap-3">
              <input type="checkbox" className="size-5 accent-[var(--accent)]" disabled={locked} checked={!!self[i]} onChange={(e) => setValue({ ...(value || {}), selfCheck: { ...self, [i]: e.target.checked } })} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
