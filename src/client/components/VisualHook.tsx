// Reusable ~3-second visual hook. Presets are CSS/SVG animations driven by
// lesson data; assets come from the media library. Always: visible caption,
// screen-reader alternative, reduced-motion final frame, muted by default,
// graceful fallback when media is missing.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Icon } from './ui.tsx';

export interface Hook {
  kind?: 'preset' | 'video' | 'svg' | 'image' | 'none';
  preset?: string;
  params?: Record<string, any>;
  assetId?: string;
  caption?: string;
  alt?: string;
  durationMs?: number;
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function useTicker(steps: number, totalMs: number, run: number) {
  const [i, setI] = useState(prefersReduced() ? steps : 0);
  useEffect(() => {
    if (prefersReduced()) return setI(steps);
    setI(0);
    let n = 0;
    const t = setInterval(() => {
      n++;
      setI(n);
      if (n >= steps) clearInterval(t);
    }, Math.max(30, totalMs / steps));
    return () => clearInterval(t);
  }, [steps, totalMs, run]);
  return i;
}

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

function WordReveal({ p }: { p: any }) {
  const word = String(p.word || 'Idea');
  return (
    <div className="text-center">
      <div className={`font-display font-black tracking-tight break-words ${word.length > 12 ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'}`} aria-hidden>
        {[...word].map((ch, i) => (
          <span key={i} className="kb-pop inline-block" style={delay(i * Math.min(120, 1400 / word.length))}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
      {p.tagline && (
        <div className="kb-rise mt-3 text-lg font-semibold text-accent-ink sm:text-xl" style={delay(1600)}>
          {p.tagline}
        </div>
      )}
    </div>
  );
}

function polyLen(pts: number[][]) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return Math.ceil(l) + 2;
}

function LetterTrace({ p }: { p: any }) {
  const strokes: number[][][] = p.strokes || [];
  const total = strokes.reduce((s, st) => s + polyLen(st), 0) || 1;
  let acc = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-44 w-44 sm:h-52 sm:w-52" aria-hidden>
      <line x1="10" y1="40" x2="90" y2="40" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="10" y1="80" x2="90" y2="80" stroke="var(--line)" strokeWidth="1.5" />
      {strokes.map((s, i) => (
        <polyline key={`g${i}`} points={s.map((q) => q.join(',')).join(' ')} fill="none" stroke="var(--muted)" strokeOpacity=".35" strokeWidth="2" className="trace-guide" strokeLinecap="round" />
      ))}
      {strokes.map((s, i) => {
        const len = polyLen(s);
        const d = (acc / total) * 2400;
        acc += len;
        return (
          <polyline key={i} points={s.map((q) => q.join(',')).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="kb-draw" style={{ ['--len' as any]: len, ['--dur' as any]: `${(len / total) * 2.4}s`, animationDelay: `${d}ms` }} />
        );
      })}
      {strokes[0] && <circle cx={strokes[0][0][0]} cy={strokes[0][0][1]} r="3.5" fill="var(--good)" />}
    </svg>
  );
}

function PatternReveal({ p, run }: { p: any; run: number }) {
  const seq: (number | string)[] = p.sequence || [2, 4, 6, 8];
  const step = useTicker(seq.length + 2, 2600, run);
  // Tiles grow to fit longer values like "₹1,050" or "every month".
  const long = [...seq, p.next].some((x) => String(x).length > 4);
  const tile = `grid h-14 min-w-14 place-items-center rounded-2xl px-3 font-display font-black whitespace-nowrap sm:h-16 sm:min-w-16 ${long ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-hidden>
      {seq.map((n, i) => (
        <span key={i} className={`${tile} bg-card shadow-[var(--shadow-card)] transition-all duration-300 ${step > i ? 'opacity-100' : 'scale-75 opacity-0'}`}>
          {n}
        </span>
      ))}
      <span className={`${tile} transition-all duration-500 ${step > seq.length ? 'scale-110 bg-accent text-white' : 'border-2 border-dashed border-accent text-accent'}`}>
        {step > seq.length ? p.next : '?'}
      </span>
    </div>
  );
}

function BudgetChange({ p, run }: { p: any; run: number }) {
  const budget = Number(p.budget) || 100;
  const exp = Number(p.expense) || 0;
  const cur = p.currency || '';
  const step = useTicker(3, 2400, run);
  const left = step >= 2 ? budget - exp : budget;
  return (
    <div className="w-full max-w-md" aria-hidden>
      <div className="mb-2 flex items-baseline justify-between font-display">
        <span className="text-sm font-bold text-muted">Budget</span>
        <span className="text-3xl font-black tabular-nums">
          {cur}
          {left}
        </span>
      </div>
      <div className="h-8 overflow-hidden rounded-full bg-sunk">
        <div className="h-full rounded-full bg-good transition-[width] duration-700 ease-out" style={{ width: `${(left / budget) * 100}%` }} />
      </div>
      <div className={`mt-3 flex justify-end transition-all duration-500 ${step >= 1 ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
        <span className="rounded-full bg-bad-soft px-3 py-1 text-sm font-bold text-bad">
          + {p.label || 'Expense'} −{cur}
          {exp}
        </span>
      </div>
    </div>
  );
}

function CodeOutput({ p, run }: { p: any; run: number }) {
  const code = String(p.code || 'print("Hi")');
  const typed = useTicker(code.length + 4, 2200, run);
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[#1d2230] font-mono text-sm text-white shadow-[var(--shadow-pop)]" aria-hidden>
      <div className="flex gap-1.5 bg-black/30 px-3 py-2">
        <i className="size-2.5 rounded-full bg-[#ff5f57]" />
        <i className="size-2.5 rounded-full bg-[#febc2e]" />
        <i className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <pre className={`px-4 pt-3 text-base ${typed < code.length ? 'kb-caret' : ''}`}>{code.slice(0, typed)}</pre>
      <div className={`border-t border-white/10 px-4 py-3 text-base text-[#7ee2a8] transition-opacity duration-300 ${typed > code.length ? 'opacity-100' : 'opacity-0'}`}>▶ {p.output}</div>
    </div>
  );
}

function PhraseModel({ p }: { p: any }) {
  const words = String(p.phrase || '').split(/\s+/);
  const stress = new Set((p.stress || []).map((s: string) => s.toLowerCase()));
  return (
    <div className="flex max-w-xl flex-wrap justify-center gap-x-2.5 gap-y-1 text-center font-display text-3xl font-bold sm:text-4xl" aria-hidden>
      {words.map((w, i) => {
        const s = stress.has(w.toLowerCase().replace(/[^\p{L}]/gu, ''));
        return (
          <span key={i} className={`kb-rise inline-block ${s ? 'scale-110 text-accent underline decoration-4 underline-offset-8' : ''}`} style={delay(i * 260)}>
            {w}
          </span>
        );
      })}
    </div>
  );
}

function SpeechUpgrade({ p, run }: { p: any; run: number }) {
  const step = useTicker(2, 2400, run);
  return (
    <div className="max-w-xl space-y-3 text-center" aria-hidden>
      <p className={`text-lg transition-all duration-500 ${step >= 1 ? 'text-muted line-through opacity-60' : 'text-ink'}`}>“{p.before}”</p>
      <p className={`font-display text-2xl font-black transition-all duration-700 sm:text-3xl ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>“{p.after}”</p>
    </div>
  );
}

export function VisualHook({ hook, compact = false }: { hook: Hook | null | undefined; compact?: boolean }) {
  const [run, setRun] = useState(0);
  const [failed, setFailed] = useState(false);
  const h = hook || {};
  const kind = h.kind || (h.preset ? 'preset' : h.assetId ? 'video' : 'none');
  const caption = h.caption || '';
  const body = useMemo(() => {
    if (failed) return null;
    const p = h.params || {};
    if (kind === 'preset') {
      switch (h.preset) {
        case 'word-reveal': return <WordReveal p={p} key={run} />;
        case 'letter-trace': return <LetterTrace p={p} key={run} />;
        case 'pattern-reveal': return <PatternReveal p={p} run={run} />;
        case 'budget-change': return <BudgetChange p={p} run={run} />;
        case 'code-output': return <CodeOutput p={p} run={run} />;
        case 'phrase-model': return <PhraseModel p={p} key={run} />;
        case 'speech-upgrade': return <SpeechUpgrade p={p} run={run} />;
        default: return null;
      }
    }
    if (kind === 'video' && h.assetId) return <video key={run} src={`/api/assets/${h.assetId}/file`} muted autoPlay={!prefersReduced()} playsInline controls={prefersReduced()} className="max-h-60 rounded-2xl" onError={() => setFailed(true)} aria-describedby="hook-caption" />;
    if ((kind === 'svg' || kind === 'image') && h.assetId) return <img key={run} src={`/api/assets/${h.assetId}/file`} alt="" className="max-h-60 rounded-2xl" onError={() => setFailed(true)} />;
    return null;
  }, [kind, h.preset, h.assetId, JSON.stringify(h.params), run, failed]);

  if (kind === 'none' || (!body && !caption)) return null;
  return (
    <figure className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-accent-soft ${compact ? 'p-4' : 'p-6 sm:p-8'}`} aria-label="Lesson hook">
      <div className={`grid place-items-center ${compact ? 'min-h-32' : 'min-h-44'}`}>
        {body || (
          <div className="text-center">
            <Icon name="image" size={28} className="mx-auto mb-2 text-accent" />
            <p className="font-display text-xl font-bold">{caption}</p>
            <p className="mt-1 text-xs text-muted">Media unavailable — showing the text version.</p>
          </div>
        )}
      </div>
      <figcaption id="hook-caption" className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-accent-ink">{caption}</span>
        {body && (
          <button onClick={() => setRun((r) => r + 1)} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card/70 px-3 py-1 text-xs font-bold text-ink hover:bg-card" aria-label="Replay hook">
            <Icon name="refresh" size={13} /> Replay
          </button>
        )}
      </figcaption>
      {h.alt && <span className="sr-only">{h.alt}</span>}
    </figure>
  );
}
