import { isValidElement, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

// ── Icons (inline, stroke-based, 24px grid) ────────────────
const PATHS: Record<string, string> = {
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zm2 14h13v2H6',
  chat: 'M4 5h16v11H8l-4 4V5z',
  school: 'M3 9l9-5 9 5-9 5-9-5zm4 3v5c3 2 7 2 10 0v-5',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v10m-3-7.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2-3 2.5-3 1.1-3 2.5 1.3 2.5 3 2.5 3-1.1 3-2.5',
  code: 'M8 7l-5 5 5 5m8-10l5 5-5 5m-3-12l-2 14',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z',
  play: 'M7 4l13 8-13 8V4z',
  check: 'M4 12l5 5L20 6',
  x: 'M6 6l12 12M18 6L6 18',
  arrowR: 'M5 12h14m-6-6l6 6-6 6',
  arrowL: 'M19 12H5m6-6l-6 6 6 6',
  up: 'M12 19V5m-6 6l6-6 6 6',
  down: 'M12 5v14m-6-6l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3m-8 0l1 13h8l1-13',
  edit: 'M4 20h4L20 8l-4-4L4 16v4z',
  upload: 'M12 16V4m-5 5l5-5 5 5M4 20h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  bulb: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 14 0m-7 7v3',
  speaker: 'M4 9v6h4l5 4V5L8 9H4zm12-1a5 5 0 0 1 0 8m2-11a9 9 0 0 1 0 14',
  stop: 'M6 6h12v12H6z',
  panel: 'M3 4h18v16H3zM15 4v16',
  screen: 'M3 4h18v12H3zM8 20h8m-4-4v4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  flask: 'M9 3h6m-5 0v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 19l-6-10V3',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a6 6 0 0 0-4-5.6',
  plug: 'M9 3v5m6-5v5M6 8h12v3a6 6 0 0 1-12 0V8zm6 9v4',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9a1.5 1.5 0 1 0 0-.01',
  layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5m-18 4l9 5 9-5',
  map: 'M9 4l6 2 6-2v14l-6 2-6-2-6 2V6l6-2zm0 0v14m6-12v14',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7l1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2l-1.4-1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h11',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  refresh: 'M20 11a8 8 0 0 0-14.9-4M4 4v4h4m-4 5a8 8 0 0 0 14.9 4M20 20v-4h-4',
  thumbUp: 'M7 11v9H4v-9h3zm0 0l4-8c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.2 20H7',
  thumbDown: 'M17 13V4h3v9h-3zm0 0l-4 8c-1.5 0-2.5-1-2.5-2.5V15h-5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 6.8 4H17',
  lock: 'M6 11h12v10H6zm2 0V7a4 4 0 0 1 8 0v4',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1m-2 6.4a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16l-4-4',
  home: 'M3 11l9-7 9 7v9h-6v-6H9v6H3v-9z',
  grad: 'M2 9l10-5 10 5-10 5L2 9zm4 2v5c4 3 8 3 12 0v-5m4-2v6',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
};

export function Icon({ name, size = 18, className = '', label }: { name: keyof typeof PATHS | string; size?: number; className?: string; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={`inline-block shrink-0 ${className}`} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <path d={PATHS[name] || PATHS.sparkle} />
    </svg>
  );
}

// ── Buttons ────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'teach' | 'good';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-accent text-white hover:brightness-110 shadow-[0_2px_0_rgb(0_0_0/0.12)] active:translate-y-px',
  secondary: 'bg-card text-ink border border-line hover:bg-sunk',
  ghost: 'text-ink hover:bg-sunk',
  danger: 'bg-card text-bad border border-line hover:bg-bad-soft',
  teach: 'bg-teach text-white hover:brightness-110',
  good: 'bg-good text-white hover:brightness-110',
};

export function Button({ variant = 'secondary', size = 'md', icon, children, busy, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; icon?: string; busy?: boolean }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-sm gap-1.5' : size === 'lg' ? 'h-12 px-6 text-base gap-2' : 'h-10 px-4 text-sm gap-2';
  return (
    <button {...rest} disabled={rest.disabled || busy} className={`inline-flex items-center justify-center rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${sz} ${BTN[variant]} ${className}`}>
      {busy ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = '', as: As = 'div', ...rest }: { children: ReactNode; className?: string; as?: any; [k: string]: any }) {
  return (
    <As {...rest} className={`rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </As>
  );
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'bad' | 'warn' | 'accent' | 'teach'; className?: string }) {
  const t = { neutral: 'bg-sunk text-muted', good: 'bg-good-soft text-good', bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', accent: 'bg-accent-soft text-accent-ink', teach: 'bg-teach-soft text-teach' }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${t} ${className}`}>{children}</span>;
}

const STATUS_TONE: Record<string, 'neutral' | 'good' | 'bad' | 'warn' | 'accent' | 'teach'> = {
  draft: 'neutral', testing: 'teach', review: 'warn', approved: 'good', published: 'accent', archived: 'neutral',
  unverified: 'warn', in_review: 'teach', rejected: 'bad',
  extracted: 'good', unsupported: 'neutral', failed: 'bad', pending: 'neutral', url_unverified: 'warn', url_reachable: 'good', url_unreachable: 'bad',
  connected: 'good', available: 'teach', awaiting_credentials: 'warn', 'built-in': 'good', configurable: 'teach', 'extension-required': 'neutral',
};
export function StatusPill({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{status.replace(/_/g, ' ')}</Badge>;
}

// ── Form fields ────────────────────────────────────────────
let fieldSeq = 0;
/** Simple controls get a wrapping <label>; compound children (lists, rows of controls) get a labelled group,
 *  because nesting several controls inside one <label> is invalid and hides them from assistive tech. */
export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  const [gid] = useState(() => `fld-${++fieldSeq}`);
  const simple = isValidElement(children) && (children.type === Input || children.type === Select || children.type === Textarea || ['input', 'select', 'textarea'].includes(children.type as string));
  if (simple)
    return (
      <label className={`block ${className}`}>
        <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
        {children}
        {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      </label>
    );
  return (
    <div role="group" aria-labelledby={gid} className={`block ${className}`}>
      <span id={gid} className="mb-1 block text-sm font-semibold text-ink">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </div>
  );
}
const inputCls = 'w-full rounded-xl border border-line bg-card px-3 py-2 text-[15px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} h-10 ${p.className || ''}`} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${inputCls} min-h-[84px] ${p.className || ''}`} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} h-10 ${p.className || ''}`} />;

/** Editable list of short strings (objectives, prerequisites…). */
export function ListEditor({ value, onChange, placeholder, addLabel = 'Add' }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input value={v} placeholder={placeholder} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${placeholder || 'Item'} ${i + 1}`} />
          <Button type="button" variant="ghost" size="sm" icon="x" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button type="button" size="sm" icon="plus" onClick={() => onChange([...value, ''])}>
        {addLabel}
      </Button>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────
export function Tabs<T extends string>({ tabs, value, onChange, className = '', tone = 'accent', wrap = false }: { tabs: { id: T; label: string; icon?: string; badge?: ReactNode }[]; value: T; onChange: (t: T) => void; className?: string; tone?: 'accent' | 'teach'; wrap?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      role="tablist"
      className={`flex gap-1 ${wrap ? 'flex-wrap' : 'overflow-x-auto thin-scroll'} ${className}`}
      onKeyDown={(e) => {
        const i = tabs.findIndex((t) => t.id === value);
        if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].id);
        if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].id);
      }}
    >
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${on ? (tone === 'teach' ? 'bg-teach text-white' : 'bg-ink text-paper') : 'text-muted hover:bg-sunk hover:text-ink'}`}
          >
            {t.icon && <Icon name={t.icon} size={15} />}
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}

// ── Feedback ───────────────────────────────────────────────
export function Notice({ tone = 'neutral', children, icon, className = '' }: { tone?: 'neutral' | 'good' | 'bad' | 'warn' | 'teach'; children: ReactNode; icon?: string; className?: string }) {
  const t = { neutral: 'bg-sunk text-ink', good: 'bg-good-soft text-ink', bad: 'bg-bad-soft text-ink', warn: 'bg-warn-soft text-ink', teach: 'bg-teach-soft text-ink' }[tone];
  const ic = { neutral: 'text-muted', good: 'text-good', bad: 'text-bad', warn: 'text-warn', teach: 'text-teach' }[tone];
  return (
    <div className={`flex gap-2.5 rounded-2xl px-4 py-3 text-sm ${t} ${className}`} role={tone === 'bad' ? 'alert' : undefined}>
      <Icon name={icon || (tone === 'good' ? 'check' : tone === 'bad' ? 'x' : tone === 'warn' ? 'flag' : 'bulb')} className={`mt-0.5 ${ic}`} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}…
    </div>
  );
}

export function Empty({ title, children, icon = 'sparkle' }: { title: string; children?: ReactNode; icon?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon name={icon} size={22} />
      </div>
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

// Toasts
let pushToast: (t: { text: string; tone?: 'good' | 'bad' }) => void = () => {};
export const toast = (text: string, tone: 'good' | 'bad' = 'good') => pushToast({ text, tone });
export function Toaster() {
  const [items, setItems] = useState<{ id: number; text: string; tone?: 'good' | 'bad' }[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { id, ...t }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4200);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`kb-rise pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-pop)] ${t.tone === 'bad' ? 'bg-bad text-white' : 'bg-ink text-paper'}`}>
          <Icon name={t.tone === 'bad' ? 'x' : 'check'} size={16} />
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-[var(--radius-card)] border border-line bg-card p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-black/40`}>
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <Button variant="ghost" size="sm" icon="x" aria-label="Close" onClick={onClose} />
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-sm font-semibold text-muted">{eyebrow}</div>}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {children && <div className="mt-2 max-w-2xl text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, label, className = '' }: { value: number; max: number; label?: string; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className}>
      <div className="h-2.5 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const categoryIcon = (icon?: string) => ({ chat: 'chat', book: 'book', school: 'school', coin: 'coin', code: 'code' })[icon || ''] || 'sparkle';
