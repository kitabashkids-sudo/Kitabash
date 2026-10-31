// Lesson extras: explainer video (captions + optional read-aloud), build-along steps, downloads.
import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui.tsx';
import { ScratchBlocks } from './ScratchBlocks.tsx';
import type { BuildAlong, Download, LessonVideo } from '../../lib/lessonTypes.ts';

const readPref = (k: string, d: boolean) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v === '1';
  } catch {
    return d;
  }
};
const writePref = (k: string, v: boolean) => {
  try {
    localStorage.setItem(k, v ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
};

export function VideoPlayer({ video }: { video: LessonVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [narrate, setNarrate] = useState(() => readPref('kb-narrate', false));
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [showText, setShowText] = useState(false);
  const spoken = useRef(-1);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    let off = false;
    fetch(`/api/assets/${video.assetId}/captions.vtt`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => {
        if (off) return;
        const out: { start: number; end: number; text: string }[] = [];
        const sec = (s: string) => s.split(':').reduce((a, x) => a * 60 + Number(x), 0);
        for (const block of t.split(/\n\n+/)) {
          const m = block.match(/([\d:.]+)\s+-->\s+([\d:.]+)[^\n]*\n([\s\S]+)/);
          if (m) out.push({ start: sec(m[1]), end: sec(m[2]), text: m[3].trim() });
        }
        setCues(out);
      })
      .catch(() => {});
    return () => {
      off = true;
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, [video.assetId, canSpeak]);

  const onTime = () => {
    if (!narrate || !canSpeak || !ref.current) return;
    const t = ref.current.currentTime;
    const i = cues.findIndex((c) => t >= c.start && t < c.end);
    if (i >= 0 && i !== spoken.current) {
      spoken.current = i;
      const u = new SpeechSynthesisUtterance(cues[i].text.replace(/\n/g, ' '));
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };
  const stopSpeech = () => {
    spoken.current = -1;
    if (canSpeak) window.speechSynthesis.cancel();
  };

  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-card)]" aria-label="Lesson video">
      <video ref={ref} controls preload="metadata" playsInline className="aspect-video w-full bg-black" onTimeUpdate={onTime} onPause={stopSpeech} onSeeking={stopSpeech} onEnded={stopSpeech}>
        <source src={`/api/assets/${video.assetId}/file`} type="video/mp4" />
        <track kind="captions" src={`/api/assets/${video.assetId}/captions.vtt`} srcLang="en" label="English (also shown in the video)" />
      </video>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <p className="mr-auto font-bold">
          <Icon name="play" size={15} className="mr-1 inline text-accent" />
          {video.title}
          <span className="ml-2 text-xs font-normal text-muted">captions on screen</span>
          {video.durationSec ? <span className="ml-2 text-sm font-normal text-muted">{Math.floor(video.durationSec / 60)}:{String(video.durationSec % 60).padStart(2, '0')}</span> : null}
        </p>
        {canSpeak && (
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={narrate}
              onChange={(e) => {
                setNarrate(e.target.checked);
                writePref('kb-narrate', e.target.checked);
                if (!e.target.checked) stopSpeech();
              }}
            />
            <Icon name="speaker" size={15} /> Read the captions aloud
          </label>
        )}
        {cues.length > 0 && (
          <button type="button" onClick={() => setShowText(!showText)} className="text-sm font-semibold text-accent underline">
            {showText ? 'Hide' : 'Show'} the words
          </button>
        )}
      </div>
      {showText && (
        <div className="border-t border-line px-4 py-3 text-sm leading-relaxed">
          {cues.map((c, i) => (
            <p key={i} className="mb-1">
              {c.text}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

export function BuildAlongSteps({ build, storageKey }: { build: BuildAlong; storageKey: string }) {
  const [done, setDone] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  });
  const toggle = (i: number) => {
    const next = { ...done, [i]: !done[i] };
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const count = Object.values(done).filter(Boolean).length;
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6" aria-label="Build along">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-accent uppercase">Build along</p>
          <h2 className="text-2xl font-black">{build.title}</h2>
          {build.intro && <p className="mt-1 text-muted">{build.intro}</p>}
        </div>
        {build.tool && (
          <a href={build.tool.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 font-semibold text-white">
            Open {build.tool.name} <Icon name="arrowR" size={15} />
          </a>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-muted">
        {count} of {build.steps.length} steps done
      </p>
      <ol className="mt-3 space-y-3">
        {build.steps.map((s, i) => (
          <li key={i} className={`rounded-2xl border-2 p-4 ${done[i] ? 'border-good bg-good-soft' : 'border-line'}`}>
            <div className="flex items-start gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full font-black ${done[i] ? 'bg-good text-white' : 'bg-accent-soft text-accent'}`}>{done[i] ? '✓' : i + 1}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 leading-relaxed">{s.text}</p>
                {s.blocks && <ScratchBlocks code={s.blocks} className="mt-3" />}
                {s.tip && <p className="mt-2 rounded-xl bg-sunk px-3 py-2 text-sm">💡 {s.tip}</p>}
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={!!done[i]} onChange={() => toggle(i)} /> I’ve done this step
                </label>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const KIND_LABEL: Record<string, string> = { worksheet: 'Worksheet', 'project-brief': 'Project brief', guide: 'Guide', 'lesson-plan': 'Lesson plan', rubric: 'Rubric', answers: 'Answer key', slides: 'Slides' };

export function Downloads({ items, title = 'Printables' }: { items: Download[]; title?: string }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-card p-5" aria-label={title}>
      <h2 className="mb-3 font-bold">{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((d) => (
          <li key={d.resourceId}>
            <a href={`/api/resources/${d.resourceId}/file`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent">
              <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon name="download" size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{d.title}</span>
                <span className="text-xs text-muted">{KIND_LABEL[d.kind] || 'File'} · PDF</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "More places to practise": free external sites that suit this course and age group. */
export function PracticeLinks({ links, compact }: { links: { name: string; url: string; what: string }[]; compact?: boolean }) {
  if (!links?.length) return null;
  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-card ${compact ? 'p-3' : 'p-5'}`} aria-label="More places to practise">
      <p className="text-xs font-bold tracking-wide text-accent uppercase">Keep practising</p>
      <h2 className={`${compact ? 'text-base' : 'text-xl'} font-black`}>More places to practise</h2>
      <p className="mt-0.5 text-sm text-muted">Free sites that fit this course. They open in a new tab — ask a grown-up or your teacher before signing up anywhere.</p>
      <ul className={`mt-3 grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer noopener" className="group flex h-full items-start gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon name="link" size={15} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold group-hover:underline">{l.name}</span>
                <span className="block text-sm text-muted">{l.what}</span>
                <span className="block truncate text-xs text-muted">{host(l.url)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
