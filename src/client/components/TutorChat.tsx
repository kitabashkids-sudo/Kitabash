import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.ts';
import { Button, Icon, Notice } from './ui.tsx';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  citations?: { n: number; resourceTitle: string; ref: string }[];
  meta?: { escalated?: boolean; provider?: string; logId?: string };
  rated?: number;
}

/** Shared chat UI used by the learner tutor, the admin sandbox and the teacher co-facilitator. */
export function ChatThread({
  endpoint,
  payload,
  greeting,
  placeholder = 'Ask a question…',
  suggestions = [],
  allowRating = false,
  focusActivity,
  compact,
}: {
  endpoint: string;
  payload: Record<string, unknown>;
  greeting?: string;
  placeholder?: string;
  suggestions?: string[];
  allowRating?: boolean;
  focusActivity?: string | null;
  compact?: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Note: scrollIntoView returns a Promise in newer browsers — never return it from an effect.
    void end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [msgs, busy]);

  const send = async (content: string) => {
    if (!content.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: content.trim() }];
    setMsgs(next);
    setText('');
    setBusy(true);
    setErr('');
    try {
      const r = await api<any>(endpoint, { body: { ...payload, activityId: focusActivity || undefined, messages: next.map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, { role: 'assistant', content: r.reply, citations: r.citations, meta: r.meta }]);
    } catch (e) {
      setErr((e as Error).message);
      setMsgs(msgs);
      setText(content);
    } finally {
      setBusy(false);
    }
  };
  const rate = async (i: number, rating: number) => {
    const m = msgs[i];
    if (!m.meta?.logId) return;
    setMsgs(msgs.map((x, j) => (j === i ? { ...x, rated: rating } : x)));
    await api('/api/tutor/rate', { body: { logId: m.meta.logId, rating } }).catch(() => {});
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`thin-scroll min-h-0 flex-1 space-y-3 overflow-y-auto ${compact ? 'p-3' : 'p-4'}`}>
        {greeting && <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-sunk px-4 py-2.5 text-[15px]">{greeting}</div>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-[15px] whitespace-pre-wrap ${m.role === 'user' ? 'rounded-tr-md bg-accent text-white' : m.meta?.escalated ? 'rounded-tl-md border-2 border-warn bg-warn-soft' : 'rounded-tl-md bg-sunk'}`}>
              {m.content.replace(/\*\*(.+?)\*\*/g, '$1')}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.citations.map((c) => (
                    <span key={c.n} className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted" title={`${c.resourceTitle} · ${c.ref}`}>
                      <Icon name="book" size={11} />S{c.n}: {c.resourceTitle.slice(0, 32)} · {c.ref}
                    </span>
                  ))}
                </div>
              )}
              {m.role === 'assistant' && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                  {m.meta?.provider === 'mock' && <span>Offline demo tutor</span>}
                  {m.meta?.escalated && <span className="font-bold text-warn">Flagged for your teacher</span>}
                  {allowRating && m.meta?.logId && (
                    <span className="ml-auto flex gap-1">
                      <button aria-label="Helpful" onClick={() => rate(i, 1)} className={m.rated === 1 ? 'text-good' : 'hover:text-ink'}>
                        <Icon name="thumbUp" size={14} />
                      </button>
                      <button aria-label="Not helpful" onClick={() => rate(i, -1)} className={m.rated === -1 ? 'text-bad' : 'hover:text-ink'}>
                        <Icon name="thumbDown" size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-1 px-2" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        )}
        {err && <Notice tone="bad">{err}</Notice>}
        <div ref={end} />
      </div>
      {suggestions.length > 0 && msgs.length === 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold hover:border-accent">
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))} placeholder={placeholder} aria-label="Message" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] focus:border-accent focus:outline-none" />
        <Button variant="primary" icon="arrowR" aria-label="Send" disabled={!text.trim()} busy={busy} />
      </form>
    </div>
  );
}

export function TutorDrawer({ open, onClose, courseId, lessonId, activityId, agentName, consentAi }: { open: boolean; onClose: () => void; courseId: string; lessonId?: string; activityId?: string | null; agentName?: string; consentAi: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 sm:bg-transparent" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="kb-rise flex h-full w-full flex-col border-l border-line bg-card shadow-[var(--shadow-pop)] sm:h-[calc(100%-2rem)] sm:w-[400px] sm:rounded-l-[var(--radius-card)] sm:self-center" aria-label="Learning helper">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
            <Icon name="sparkle" />
          </span>
          <div className="flex-1">
            <p className="font-display font-bold">{agentName || 'Learning helper'}</p>
            <p className="text-xs text-muted">An AI helper. It gives hints, not answers.</p>
          </div>
          <Button variant="ghost" size="sm" icon="x" aria-label="Close helper" onClick={onClose} />
        </header>
        {consentAi ? (
          <ChatThread
            endpoint="/api/tutor"
            payload={{ courseId, lessonId }}
            focusActivity={activityId}
            allowRating
            greeting="Hi! Ask me about this lesson, or say “hint” if you’re stuck. Please don’t share personal details like your address or phone number."
            suggestions={['I don’t get it', 'Give me a hint', 'Can you give an example?']}
          />
        ) : (
          <div className="p-4">
            <Notice tone="warn" icon="shield">
              The AI helper needs permission from your parent or guardian first. Your teacher can help you in the meantime!
            </Notice>
          </div>
        )}
      </aside>
    </div>
  );
}
