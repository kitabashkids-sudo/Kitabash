// Kitabash Python Lab: a Python editor (line numbers, highlighting, auto-indent), a console
// with input() support, turtle drawing and friendly errors. Runs the shared interpreter
// in the browser; the server re-runs the same code for grading.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Icon } from '../ui.tsx';
import { runPython, type RunResult } from '../../../lib/python/interp.ts';

const KW = /\b(def|return|if|elif|else|while|for|in|not|and|or|break|continue|pass|import|from|as|True|False|None|class|try|except|finally|raise|global|lambda|is)\b/;
const BUILTIN = /\b(print|input|len|range|int|float|str|list|dict|tuple|sum|min|max|abs|round|sorted|enumerate|zip|type|bool|reversed)\b/;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Very small Python highlighter (strings, comments, numbers, keywords, built-ins). */
function highlight(code: string): string {
  const re = /(#[^\n]*)|([fFrR]?"""[\s\S]*?(?:"""|$)|[fFrR]?'''[\s\S]*?(?:'''|$)|[fFrR]?"(?:[^"\\\n]|\\.)*"?|[fFrR]?'(?:[^'\\\n]|\\.)*'?)|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)/g;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    const [t, com, str, num, word] = m;
    if (com) out += `<span class="py-com">${esc(t)}</span>`;
    else if (str) out += `<span class="py-str">${esc(t)}</span>`;
    else if (num) out += `<span class="py-num">${esc(t)}</span>`;
    else if (word && KW.test(word) && word.match(KW)![0] === word) out += `<span class="py-kw">${esc(t)}</span>`;
    else if (word && BUILTIN.test(word) && word.match(BUILTIN)![0] === word) out += `<span class="py-fn">${esc(t)}</span>`;
    else out += esc(t);
    last = m.index! + t.length;
  }
  return out + esc(code.slice(last)) + '\n';
}

function TurtleCanvas({ r }: { r: RunResult }) {
  const t = r.turtle;
  const pts = t.lines.flatMap((l) => [l.x1, l.x2]);
  const ys = t.lines.flatMap((l) => [l.y1, l.y2]);
  const pad = 30;
  const minX = Math.min(-200, ...pts, ...t.dots.map((d) => d.x)) - pad;
  const maxX = Math.max(200, ...pts, ...t.dots.map((d) => d.x)) + pad;
  const minY = Math.min(-150, ...ys, ...t.dots.map((d) => d.y)) - pad;
  const maxY = Math.max(150, ...ys, ...t.dots.map((d) => d.y)) + pad;
  const turtle = t.turtles[0];
  return (
    <svg viewBox={`${minX} ${-maxY} ${maxX - minX} ${maxY - minY}`} className="h-auto max-h-[340px] w-full rounded-xl border border-line" style={{ background: t.bg }} role="img" aria-label={`Turtle drawing with ${t.lines.length} lines`}>
      <line x1={minX} y1={0} x2={maxX} y2={0} stroke="#e5e7eb" strokeWidth={1} />
      <line x1={0} y1={-maxY} x2={0} y2={-minY} stroke="#e5e7eb" strokeWidth={1} />
      {t.lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={-l.y1} x2={l.x2} y2={-l.y2} stroke={l.color} strokeWidth={l.width} strokeLinecap="round" />
      ))}
      {t.dots.map((d, i) => (
        <circle key={'d' + i} cx={d.x} cy={-d.y} r={d.r} fill={d.color} />
      ))}
      {turtle?.visible && (
        <g transform={`translate(${turtle.x} ${-turtle.y}) rotate(${-turtle.heading})`}>
          <path d="M12 0 L-8 -7 L-4 0 L-8 7 Z" fill="#16a34a" stroke="#14532d" strokeWidth={1.5} />
        </g>
      )}
    </svg>
  );
}

export function PythonLab({ code, onChange, locked, goals, passed, sampleInputs = [] }: { code: string; onChange: (c: string) => void; locked?: boolean; goals?: string[]; passed?: boolean[]; sampleInputs?: string[] }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [typed, setTyped] = useState('');
  const [runs, setRuns] = useState(0);
  const lines = code.split('\n').length;
  const html = useMemo(() => highlight(code), [code]);
  const errLine = result?.error?.line || 0;

  const run = (ans: string[]) => {
    const r = runPython(code, { inputs: ans, seed: 7 + runs });
    setResult(r);
    setAnswers(ans);
  };
  useEffect(() => setResult(null), [code]);

  const sync = () => {
    if (!ta.current) return;
    if (pre.current) pre.current.scrollTop = ta.current.scrollTop;
    if (pre.current) pre.current.scrollLeft = ta.current.scrollLeft;
    if (gutter.current) gutter.current.scrollTop = ta.current.scrollTop;
  };
  const edit = (next: string, caret: number) => {
    onChange(next);
    requestAnimationFrame(() => {
      if (ta.current) ta.current.selectionStart = ta.current.selectionEnd = caret;
    });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: en, value } = el;
    if (e.key === 'Tab') {
      e.preventDefault();
      const ls = value.lastIndexOf('\n', s - 1) + 1;
      if (e.shiftKey) {
        const strip = value.slice(ls, ls + 4).match(/^ */)![0].length;
        edit(value.slice(0, ls) + value.slice(ls + strip), Math.max(ls, s - strip));
      } else edit(value.slice(0, s) + '    ' + value.slice(en), s + 4);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const ls = value.lastIndexOf('\n', s - 1) + 1;
      const cur = value.slice(ls, s);
      let ind = cur.match(/^ */)![0];
      if (/:\s*(#.*)?$/.test(cur)) ind += '    ';
      if (/^\s*(return|break|continue|pass)\b/.test(cur)) ind = ind.slice(4);
      edit(value.slice(0, s) + '\n' + ind + value.slice(en), s + 1 + ind.length);
    } else if (e.key === 'Backspace' && s === en && s > 0) {
      const ls = value.lastIndexOf('\n', s - 1) + 1;
      const before = value.slice(ls, s);
      if (before.length && /^ +$/.test(before) && before.length % 4 === 0) {
        e.preventDefault();
        edit(value.slice(0, s - 4) + value.slice(s), s - 4);
      }
    } else if (e.key === 'Enter' && e.shiftKey && (e.ctrlKey || e.metaKey)) run([]);
  };

  return (
    <div className="space-y-3">
      <style>{`.py-kw{color:#c026d3;font-weight:600}.py-fn{color:#2563eb}.py-str{color:#15803d}.py-num{color:#c2410c}.py-com{color:#6b7280;font-style:italic}`}</style>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-line bg-sunk px-3 py-1.5">
            <span className="text-xs font-bold tracking-wide text-muted uppercase">main.py</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="good"
                icon="play"
                onClick={() => {
                  setRuns((n) => n + 1);
                  run([]);
                }}
              >
                Run
              </Button>
            </div>
          </div>
          <div className="relative flex h-[360px] overflow-hidden rounded-b-2xl border border-line bg-[#fbfbfd] font-mono text-[14px] leading-[22px]">
            <div ref={gutter} aria-hidden className="w-10 shrink-0 overflow-hidden border-r border-line bg-sunk py-2 text-right text-[12px] text-muted select-none">
              {Array.from({ length: lines }, (_, i) => (
                <div key={i} className={`pr-2 ${i + 1 === errLine ? 'bg-bad text-white' : ''}`} style={{ height: 22 }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <pre ref={pre} aria-hidden className="pointer-events-none absolute inset-0 m-0 overflow-hidden px-3 py-2 whitespace-pre text-ink" dangerouslySetInnerHTML={{ __html: html }} />
              <textarea
                ref={ta}
                aria-label="Python code editor"
                value={code}
                readOnly={locked}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                wrap="off"
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKey}
                onScroll={sync}
                className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent px-3 py-2 whitespace-pre text-transparent caret-ink outline-none selection:bg-accent/25"
                style={{ caretColor: 'var(--color-ink, #1d2230)', tabSize: 4 }}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">Tab indents · Enter keeps your indentation · Python counts from 0</p>
        </div>
        <div className="min-w-0 space-y-2">
          <div className="rounded-2xl border border-line bg-[#14161f] text-[#e8ecf5]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
              <span className="text-xs font-bold tracking-wide text-white/60 uppercase">Console</span>
              {result && (
                <button type="button" className="text-xs text-white/60 underline" onClick={() => setResult(null)}>
                  clear
                </button>
              )}
            </div>
            <pre aria-live="polite" className="m-0 max-h-[260px] min-h-[120px] overflow-auto px-3 py-2 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
              {!result ? <span className="text-white/40">Press Run to see what your program prints.</span> : result.output || (!result.error && result.needInput === undefined ? <span className="text-white/40">(Your program finished without printing anything.)</span> : '')}
            </pre>
            {result?.needInput !== undefined && (
              <form
                className="flex gap-2 border-t border-white/10 p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run([...answers, typed]);
                  setTyped('');
                }}
              >
                <input autoFocus aria-label={`Answer: ${result.needInput}`} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer and press Enter" className="min-w-0 flex-1 rounded-lg bg-white/10 px-2 py-1 font-mono text-sm text-white placeholder:text-white/40" />
                <button type="submit" className="rounded-lg bg-white/15 px-3 text-sm font-semibold">
                  Enter
                </button>
              </form>
            )}
          </div>
          {result?.error && (
            <div role="alert" className="rounded-2xl border border-bad/40 bg-bad-soft p-3 text-sm">
              <p className="font-bold text-bad">
                {result.error.type}
                {result.error.line ? ` on line ${result.error.line}` : ''}
              </p>
              <p className="font-mono text-[13px]">{result.error.message}</p>
              {result.error.hint && <p className="mt-1">💡 {result.error.hint}</p>}
            </div>
          )}
          {result?.turtle.used && <TurtleCanvas r={result} />}
          {sampleInputs.length > 0 && (
            <p className="text-xs text-muted">
              Example input to try: {sampleInputs.map((s) => `“${s}”`).join(', ')}
            </p>
          )}
          {goals && goals.length > 0 && (
            <div className="rounded-2xl border border-line p-3">
              <p className="mb-1 text-xs font-bold tracking-wide text-muted uppercase">Goals</p>
              <ul className="space-y-1 text-sm">
                {goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${passed?.[i] ? 'bg-good text-white' : 'border border-line'}`}>{passed?.[i] && <Icon name="check" size={10} />}</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
