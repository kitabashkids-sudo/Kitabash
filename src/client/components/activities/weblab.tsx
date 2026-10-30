// Web Lab: an HTML/CSS editor with a live, sandboxed preview. The server grades the same HTML
// with src/lib/web/checks.ts, so the goal ticks here always match the final result.
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { runWebChecks, type WebCheck } from '../../../lib/web/checks.ts';
import type { ActivityProps } from './types.ts';

function Editor({ value, onChange, locked, label }: { value: string; onChange: (v: string) => void; locked?: boolean; label: string }) {
  const lines = value.split('\n').length;
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const t = e.currentTarget;
    const { selectionStart: a, selectionEnd: b } = t;
    const next = value.slice(0, a) + '  ' + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
  };
  return (
    <div className="flex min-h-[320px] overflow-hidden rounded-xl border border-line bg-[#0f172a] font-mono text-sm text-slate-100">
      <pre aria-hidden className="m-0 select-none border-r border-white/10 px-2 py-3 text-right text-slate-500">
        {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
      </pre>
      <textarea
        aria-label={label}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        disabled={locked}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        className="min-h-[320px] w-full resize-y bg-transparent px-3 py-3 leading-[1.45] outline-none"
        style={{ tabSize: 2 }}
      />
    </div>
  );
}

/** Preview in a sandboxed iframe: no scripts, no same-origin access. */
export function WebPreview({ html, title }: { html: string; title: string }) {
  const doc = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"></head><body>${html}</body></html>`, [html]);
  return <iframe title={title} sandbox="" srcDoc={doc} className="h-[320px] w-full rounded-xl border border-line bg-white" />;
}

export function WebLabActivity({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config as { mode: 'challenge' | 'project'; starter: string; task: string; goals?: string[]; reflection?: string; minWords?: number; requirements?: string[] };
  const key = `kb-web-${activity.id}`;
  const initial = useMemo<string>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return saved;
    } catch {
      /* storage unavailable */
    }
    return c.starter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const v = value || { html: initial, reflection: '' };
  useEffect(() => {
    if (!value) setValue({ html: initial, reflection: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [shown, setShown] = useState(v.html);
  useEffect(() => {
    const t = setTimeout(() => setShown(v.html), 250);
    return () => clearTimeout(t);
  }, [v.html]);
  const setHtml = (html: string) => {
    setValue({ ...v, html });
    try {
      localStorage.setItem(key, html);
    } catch {
      /* ignore */
    }
  };
  // Live goal ticks (staff previews carry the key; learners see the goal list and ticks after Check).
  const live = activity.answer_key?.checks ? runWebChecks(shown, activity.answer_key.checks as WebCheck[]).results.map((r) => r.ok) : null;
  const passed: boolean[] | undefined = live || result?.detail?.passed;
  const words = String(v.reflection || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-accent-soft px-4 py-3">
        <p className="text-xs font-bold tracking-wide text-accent uppercase">{c.mode === 'project' ? 'Your project · Web Lab' : 'Challenge · Web Lab'}</p>
        <p className="mt-0.5 text-lg leading-snug font-semibold">{c.task}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold text-muted uppercase">HTML &amp; CSS</p>
          <Editor value={v.html} onChange={setHtml} locked={locked} label="HTML and CSS editor" />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-muted uppercase">Live preview</p>
          <WebPreview html={shown} title="Preview of your web page" />
          <p className="mt-1 text-xs text-muted">Scripts don’t run in the preview — this lab is for HTML and CSS.</p>
        </div>
      </div>
      {c.goals?.length ? (
        <ul className="grid gap-1.5 sm:grid-cols-2" aria-label="Goals">
          {c.goals.map((g, i) => (
            <li key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${passed?.[i] ? 'bg-good-soft font-semibold' : 'bg-sunk'}`}>
              <span aria-hidden>{passed?.[i] ? '✅' : '⬜'}</span>
              <span>
                {g}
                {passed && <span className="sr-only">{passed[i] ? ' — done' : ' — not yet'}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {!locked && (
          <button type="button" className="font-semibold text-muted underline" onClick={() => setHtml(c.starter)}>
            Reset to the starting page
          </button>
        )}
        <span className="text-xs text-muted">Your page is saved on this device as you work. Press “Check” when you’re ready.</span>
      </div>
      {c.mode === 'project' && (
        <div>
          {c.requirements?.length ? (
            <div className="mb-3 rounded-xl bg-sunk p-3 text-sm">
              <p className="font-bold">Your page should:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {c.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <label className="font-bold" htmlFor={`${activity.id}-refl`}>
            Reflection
          </label>
          <p className="text-sm text-muted">{c.reflection}</p>
          <textarea id={`${activity.id}-refl`} disabled={locked} value={v.reflection} onChange={(e) => setValue({ ...v, reflection: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-card p-3" />
          <p className="text-xs text-muted">
            {words} / {c.minWords ?? 15} words
          </p>
        </div>
      )}
    </div>
  );
}
