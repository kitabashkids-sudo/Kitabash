// Code Lab: a Scratch-style block editor with a live stage, used inside lessons.
// Learners drag (or tap) blocks into scripts, edit values, run with the green flag and
// interact with the keyboard, on-screen buttons and clicks. The same VM runs on the server for checks.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Button, Icon } from '../ui.tsx';
import { COLORS, type Category } from '../../../lib/scratch/blocks.ts';
import { BACKDROPS, EFFECTS, PEN_COLORS, ROTATIONS, SOUNDS, VM, type Bool, type Hat, type Project, type Script, type Stmt, type StmtOp, type Val } from '../../../lib/scratch/vm.ts';
import { CATEGORIES, DEF, DEFS, HATS, KEYS, SPRITE_LIBRARY, type BlockDef, type Part } from './defs.ts';
import { StageView } from './StageView.tsx';

type Path = number[]; // [i, branch, j, …] inside one script; branch 0 = body, 1 = else
interface Cursor {
  script: number;
  list: Path;
  index: number;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const col = (cat: string) => COLORS[(cat as Category) in COLORS ? (cat as Category) : 'grey'];
const listAt = (sc: Script, path: Path): Stmt[] => {
  let list = sc.blocks;
  for (let i = 0; i < path.length; i += 2) {
    const b = list[path[i]];
    list = path[i + 1] === 1 ? (b.else ||= []) : (b.body ||= []);
  }
  return list;
};
const same = (a: Path, b: Path) => a.length === b.length && a.every((x, i) => x === b[i]);

// ── Tiny audio for “start sound” ───────────────────────────
let audio: AudioContext | null = null;
function playSound(name: string) {
  try {
    audio ||= new AudioContext();
    const t = audio.currentTime;
    if (name.startsWith('note:')) {
      const f = 440 * 2 ** ((Number(name.slice(5)) - 69) / 12);
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.5);
      return;
    }
    const notes: Record<string, [number, number][]> = { pop: [[660, 0.08]], boing: [[220, 0.1], [440, 0.15]], drum: [[90, 0.12]], chime: [[880, 0.15], [1320, 0.25]], cheer: [[523, 0.1], [659, 0.1], [784, 0.2]] };
    let at = t;
    for (const [f, d] of notes[name] || notes.pop) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = name === 'drum' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, at);
      g.gain.setValueAtTime(0.18, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + d);
      o.connect(g).connect(audio.destination);
      o.start(at);
      o.stop(at + d + 0.02);
      at += d;
    }
  } catch {
    /* audio not available */
  }
}

export function GreenFlag({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="inline-block align-[-3px]">
      <path d="M4 2v20" stroke="#45993d" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M5 3c4-2 7 2 11 0s5-1 5-1v10s-1-1-5 1-7-2-11 0z" fill="#4cbf56" stroke="#45993d" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

/** Lists and My Block inputs available to the value menus. */
const LabNames = createContext<{ lists: string[]; params: string[]; procs: { name: string; param?: string }[] }>({ lists: [], params: [], procs: [] });

// ── Inputs ─────────────────────────────────────────────────
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
const ovalCls = 'h-7 rounded-full bg-white px-2 text-center text-[13px] font-semibold text-[#575E75] focus:outline-2 focus:outline-white disabled:opacity-100';

function Reporter({ cat, children, onClear, disabled }: { cat: Category; children: ReactNode; onClear?: () => void; disabled?: boolean }) {
  const c = col(cat);
  return (
    <span className="inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-semibold text-white" style={{ background: c.fill, borderColor: c.stroke }}>
      {children}
      {onClear && !disabled && (
        <button type="button" onClick={onClear} aria-label="Remove" className="ml-0.5 grid size-4 place-items-center rounded-full bg-black/20 text-[10px] leading-none">
          ×
        </button>
      )}
    </span>
  );
}

/** Text box inside a block. Numbers may be typed freely (e.g. “-”, “0.”) and are saved once valid. */
function ValueField({ value, onCommit, numeric, disabled, label }: { value: number | string; onCommit: (v: number | string) => void; numeric: boolean; disabled?: boolean; label: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    if (numeric ? Number(draft) !== Number(value) : draft !== value) setDraft(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      aria-label={label}
      type="text"
      inputMode={numeric ? 'decimal' : 'text'}
      disabled={disabled}
      value={draft}
      maxLength={numeric ? 8 : 60}
      onClick={stop}
      onChange={(e) => {
        const x = e.target.value;
        if (numeric && !/^-?\d*\.?\d*$/.test(x)) return;
        setDraft(x);
        if (!numeric) onCommit(x);
        else if (x !== '' && x !== '-' && x !== '.' && x !== '-.' && Number.isFinite(Number(x))) onCommit(Number(x));
      }}
      onBlur={() => numeric && (draft === '' || !Number.isFinite(Number(draft))) && (setDraft('0'), onCommit(0))}
      className={ovalCls}
      style={{ width: `calc(${Math.max(1, draft.length)}ch + 1.25rem)` }}
    />
  );
}

function ValSlot({ val, onChange, vars, kind, disabled, label }: { val?: Val; onChange: (v: Val) => void; vars: string[]; kind: 'num' | 'str'; disabled?: boolean; label: string }) {
  const names = useContext(LabNames);
  const v: Val = val || (kind === 'num' ? { k: 'num', v: 0 } : { k: 'str', v: '' });
  const reset = () => onChange(kind === 'num' ? { k: 'num', v: 0 } : { k: 'str', v: '' });
  const pick = (x: string) => {
    if (!x) return;
    if (x.startsWith('var:')) onChange({ k: 'var', name: x.slice(4) });
    else if (x.startsWith('rep:')) onChange({ k: 'rep', r: x.slice(4) as any });
    else if (x === 'rand') onChange({ k: 'rand', a: { k: 'num', v: 1 }, b: { k: 'num', v: 10 } });
    else if (x === 'op') onChange({ k: 'op', op: '+', a: { k: 'num', v: 0 }, b: { k: 'num', v: 0 } });
    else if (x === 'join') onChange({ k: 'join', a: { k: 'str', v: 'Score: ' }, b: { k: 'num', v: 0 } });
    else if (x.startsWith('item:')) onChange({ k: 'item', name: x.slice(5), a: { k: 'num', v: 1 } });
    else if (x.startsWith('length:')) onChange({ k: 'length', name: x.slice(7) });
    else if (x.startsWith('param:')) onChange({ k: 'param', name: x.slice(6) });
    else if (x === 'letter') onChange({ k: 'letter', a: { k: 'num', v: 1 }, b: { k: 'str', v: 'apple' } });
    else if (x === 'strlen') onChange({ k: 'strlen', a: { k: 'str', v: 'apple' } });
    else if (x === 'round') onChange({ k: 'round', a: { k: 'num', v: 2.5 } });
  };
  const menu = !disabled && (
    <select aria-label={`${label}: use a reporter`} value="" onChange={(e) => pick(e.target.value)} onClick={stop} className="h-6 w-5 cursor-pointer appearance-none rounded-full bg-black/15 text-center text-[10px] text-white" title="Use a reporter (x position, a variable, pick random…)">
      <option value="">▾</option>
      <optgroup label="Motion">
        <option value="rep:x">x position</option>
        <option value="rep:y">y position</option>
        <option value="rep:dir">direction</option>
      </optgroup>
      <optgroup label="Looks">
        <option value="rep:size">size</option>
        <option value="rep:costume">costume number</option>
      </optgroup>
      <optgroup label="Sensing">
        <option value="rep:timer">timer</option>
        <option value="rep:answer">answer</option>
      </optgroup>
      {vars.length > 0 && (
        <optgroup label="Variables">
          {vars.map((x) => (
            <option key={x} value={'var:' + x}>
              {x}
            </option>
          ))}
        </optgroup>
      )}
      {names.lists.length > 0 && (
        <optgroup label="Lists">
          {names.lists.flatMap((l) => [
            <option key={'i' + l} value={'item:' + l}>
              item 1 of {l}
            </option>,
            <option key={'l' + l} value={'length:' + l}>
              length of {l}
            </option>,
          ])}
        </optgroup>
      )}
      {names.params.length > 0 && (
        <optgroup label="My Block inputs">
          {names.params.map((x) => (
            <option key={x} value={'param:' + x}>
              {x}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Operators">
        <option value="rand">pick random 1 to 10</option>
        <option value="op">( ) + ( )</option>
        <option value="join">join ( ) ( )</option>
        <option value="letter">letter 1 of [apple]</option>
        <option value="strlen">length of [apple]</option>
        <option value="round">round ( )</option>
      </optgroup>
    </select>
  );
  switch (v.k) {
    case 'num':
    case 'str':
      return (
        <span className="inline-flex items-center gap-0.5">
          <ValueField label={label} disabled={disabled} numeric={v.k === 'num'} value={v.v} onCommit={(x) => onChange(v.k === 'num' ? { k: 'num', v: Number(x) } : { k: 'str', v: String(x) })} />
          {menu}
        </span>
      );
    case 'var':
      return (
        <Reporter cat="variables" onClear={reset} disabled={disabled}>
          {v.name}
        </Reporter>
      );
    case 'rep':
      return (
        <Reporter cat={v.r === 'timer' || v.r === 'answer' ? 'sensing' : v.r === 'size' || v.r === 'costume' ? 'looks' : 'motion'} onClear={reset} disabled={disabled}>
          {{ x: 'x position', y: 'y position', dir: 'direction', size: 'size', timer: 'timer', costume: 'costume #', answer: 'answer' }[v.r]}
        </Reporter>
      );
    case 'rand':
      return (
        <Reporter cat="operators" onClear={reset} disabled={disabled}>
          pick random <ValSlot val={v.a} kind="num" vars={vars} disabled={disabled} label="From" onChange={(a) => onChange({ ...v, a })} /> to <ValSlot val={v.b} kind="num" vars={vars} disabled={disabled} label="To" onChange={(b) => onChange({ ...v, b })} />
        </Reporter>
      );
    case 'op':
      return (
        <Reporter cat="operators" onClear={reset} disabled={disabled}>
          <ValSlot val={v.a} kind="num" vars={vars} disabled={disabled} label="First number" onChange={(a) => onChange({ ...v, a })} />
          <select aria-label="Operator" disabled={disabled} value={v.op} onClick={stop} onChange={(e) => onChange({ ...v, op: e.target.value as any })} className="rounded bg-transparent font-bold text-white">
            {['+', '-', '*', '/', '%'].map((o) => (
              <option key={o} className="text-ink">
                {o}
              </option>
            ))}
          </select>
          <ValSlot val={v.b} kind="num" vars={vars} disabled={disabled} label="Second number" onChange={(b) => onChange({ ...v, b })} />
        </Reporter>
      );
    case 'letter':
      return (
        <Reporter cat="operators" onClear={reset} disabled={disabled}>
          letter <ValSlot val={v.a} kind="num" vars={vars} disabled={disabled} label="Letter number" onChange={(a) => onChange({ ...v, a })} /> of <ValSlot val={v.b} kind="str" vars={vars} disabled={disabled} label="Text" onChange={(b) => onChange({ ...v, b })} />
        </Reporter>
      );
    case 'strlen':
      return (
        <Reporter cat="operators" onClear={reset} disabled={disabled}>
          length of <ValSlot val={v.a} kind="str" vars={vars} disabled={disabled} label="Text" onChange={(a) => onChange({ ...v, a })} />
        </Reporter>
      );
    case 'round':
      return (
        <Reporter cat="operators" onClear={reset} disabled={disabled}>
          round <ValSlot val={v.a} kind="num" vars={vars} disabled={disabled} label="Number to round" onChange={(a) => onChange({ ...v, a })} />
        </Reporter>
      );
    case 'item':
      return (
        <Reporter cat="variables" onClear={reset} disabled={disabled}>
          item <ValSlot val={v.a} kind="num" vars={vars} disabled={disabled} label="Item number" onChange={(a) => onChange({ ...v, a })} /> of {v.name}
        </Reporter>
      );
    case 'length':
      return (
        <Reporter cat="variables" onClear={reset} disabled={disabled}>
          length of {v.name}
        </Reporter>
      );
    case 'param':
      return (
        <Reporter cat="myblocks" onClear={reset} disabled={disabled}>
          {v.name}
        </Reporter>
      );
    case 'join':
      return (
        <Reporter cat="operators" onClear={reset} disabled={disabled}>
          join <ValSlot val={v.a} kind="str" vars={vars} disabled={disabled} label="First text" onChange={(a) => onChange({ ...v, a })} /> <ValSlot val={v.b} kind="str" vars={vars} disabled={disabled} label="Second text" onChange={(b) => onChange({ ...v, b })} />
        </Reporter>
      );
  }
}

function Hex({ cat, children, onClear, disabled }: { cat: Category; children: ReactNode; onClear?: () => void; disabled?: boolean }) {
  const c = col(cat);
  return (
    <span className="inline-flex min-h-7 items-center gap-1 px-3 py-0.5 text-[13px] font-semibold text-white" style={{ background: c.fill, clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)' }}>
      {children}
      {onClear && !disabled && (
        <button type="button" onClick={onClear} aria-label="Remove condition" className="grid size-4 place-items-center rounded-full bg-black/20 text-[10px]">
          ×
        </button>
      )}
    </span>
  );
}

function CondSlot({ cond, onChange, sprites, vars, disabled, self }: { cond?: Bool; onChange: (b: Bool | undefined) => void; sprites: string[]; vars: string[]; disabled?: boolean; self: string }) {
  const clear = () => onChange(undefined);
  if (!cond)
    return (
      <select
        aria-label="Choose a condition"
        disabled={disabled}
        value=""
        onClick={stop}
        onChange={(e) => {
          const x = e.target.value;
          if (x.startsWith('touch:')) onChange({ k: 'touch', target: x.slice(6) });
          else if (x.startsWith('key:')) onChange({ k: 'key', key: x.slice(4) });
          else if (x === 'cmp') onChange({ k: 'cmp', op: '>', a: vars[0] ? { k: 'var', name: vars[0] } : { k: 'rep', r: 'x' }, b: { k: 'num', v: 10 } });
          else if (x === 'not') onChange({ k: 'not', a: { k: 'key', key: 'space' } });
          else if (x.startsWith('contains:')) onChange({ k: 'contains', name: x.slice(9), a: { k: 'str', v: 'thing' } });
          else if (x === 'and' || x === 'or') onChange({ k: x, a: { k: 'key', key: 'space' }, b: { k: 'touch', target: 'edge' } });
        }}
        className="h-7 rounded-md border-2 border-dashed border-white/70 bg-black/10 px-2 text-[12px] font-semibold text-white"
      >
        <option value="">choose a condition ▾</option>
        <optgroup label="Sensing">
          <option value="touch:edge">touching edge?</option>
          {sprites
            .filter((s) => s !== self)
            .map((s) => (
              <option key={s} value={'touch:' + s}>
                touching {s}?
              </option>
            ))}
          <option value="key:space">key space pressed?</option>
          <option value="key:right arrow">key right arrow pressed?</option>
          <option value="key:left arrow">key left arrow pressed?</option>
        </optgroup>
        <optgroup label="Operators">
          <option value="cmp">( ) &gt; ( )   compare</option>
          <option value="not">not &lt; &gt;</option>
          <option value="and">&lt; &gt; and &lt; &gt;</option>
          <option value="or">&lt; &gt; or &lt; &gt;</option>
        </optgroup>
        <ListOptions />
      </select>
    );
  switch (cond.k) {
    case 'touch':
      return (
        <Hex cat="sensing" onClear={clear} disabled={disabled}>
          touching
          <select aria-label="Touching what" disabled={disabled} value={cond.target} onClick={stop} onChange={(e) => onChange({ ...cond, target: e.target.value })} className="rounded bg-black/15 px-1 text-white">
            {['edge', ...sprites.filter((s) => s !== self)].map((s) => (
              <option key={s} value={s} className="text-ink">
                {s}
              </option>
            ))}
          </select>
          ?
        </Hex>
      );
    case 'key':
      return (
        <Hex cat="sensing" onClear={clear} disabled={disabled}>
          key
          <select aria-label="Which key" disabled={disabled} value={cond.key} onClick={stop} onChange={(e) => onChange({ ...cond, key: e.target.value })} className="rounded bg-black/15 px-1 text-white">
            {KEYS.map((k) => (
              <option key={k} value={k} className="text-ink">
                {k}
              </option>
            ))}
          </select>
          pressed?
        </Hex>
      );
    case 'cmp':
      return (
        <Hex cat="operators" onClear={clear} disabled={disabled}>
          <ValSlot val={cond.a} kind="num" vars={vars} disabled={disabled} label="Left value" onChange={(a) => onChange({ ...cond, a })} />
          <select aria-label="Compare" disabled={disabled} value={cond.op} onClick={stop} onChange={(e) => onChange({ ...cond, op: e.target.value as any })} className="rounded bg-black/15 px-1 font-bold text-white">
            {['<', '=', '>'].map((o) => (
              <option key={o} className="text-ink">
                {o}
              </option>
            ))}
          </select>
          <ValSlot val={cond.b} kind="num" vars={vars} disabled={disabled} label="Right value" onChange={(b) => onChange({ ...cond, b })} />
        </Hex>
      );
    case 'contains':
      return (
        <Hex cat="variables" onClear={clear} disabled={disabled}>
          {cond.name} contains <ValSlot val={cond.a} kind="str" vars={vars} disabled={disabled} label="Item to look for" onChange={(a) => onChange({ ...cond, a })} />?
        </Hex>
      );
    case 'not':
      return (
        <Hex cat="operators" onClear={clear} disabled={disabled}>
          not <CondSlot cond={cond.a} sprites={sprites} vars={vars} disabled={disabled} self={self} onChange={(a) => onChange({ ...cond, a: a || { k: 'key', key: 'space' } })} />
        </Hex>
      );
    case 'and':
    case 'or':
      return (
        <Hex cat="operators" onClear={clear} disabled={disabled}>
          <CondSlot cond={cond.a} sprites={sprites} vars={vars} disabled={disabled} self={self} onChange={(a) => onChange({ ...cond, a: a || { k: 'key', key: 'space' } })} /> {cond.k}{' '}
          <CondSlot cond={cond.b} sprites={sprites} vars={vars} disabled={disabled} self={self} onChange={(b) => onChange({ ...cond, b: b || { k: 'key', key: 'space' } })} />
        </Hex>
      );
  }
}

function ListOptions() {
  const names = useContext(LabNames);
  if (!names.lists.length) return null;
  return (
    <optgroup label="Lists">
      {names.lists.map((l) => (
        <option key={l} value={'contains:' + l}>
          {l} contains …?
        </option>
      ))}
    </optgroup>
  );
}

function NameSel({ kind, value, onChange, vars, msgs, disabled }: { kind: string; value?: string; onChange: (v: string) => void; vars: string[]; msgs: string[]; disabled?: boolean }) {
  const names = useContext(LabNames);
  const opts = kind === 'list' ? names.lists : kind === 'proc' ? names.procs.map((p) => p.name) : kind === 'var' ? vars : kind === 'effect' ? EFFECTS : kind === 'sound' ? SOUNDS : kind === 'color' ? Object.keys(PEN_COLORS) : kind === 'backdrop' ? [...BACKDROPS] : kind === 'rotation' ? [...ROTATIONS] : msgs;
  if (kind === 'msg')
    return (
      <span className="inline-flex items-center">
        <input aria-label="Message name" list="kb-msgs" disabled={disabled} value={value} maxLength={24} onClick={stop} onChange={(e) => onChange(e.target.value)} className="h-7 w-28 rounded-md bg-black/15 px-2 text-[13px] font-semibold text-white placeholder:text-white/70" />
      </span>
    );
  return (
    <select aria-label={kind} disabled={disabled} value={value} onClick={stop} onChange={(e) => onChange(e.target.value)} className="h-7 rounded-md bg-black/15 px-1.5 text-[13px] font-semibold text-white">
      {(opts.length ? opts : [value || '']).map((o) => (
        <option key={o} value={o} className="text-ink">
          {o}
        </option>
      ))}
    </select>
  );
}

// ── Block rendering ────────────────────────────────────────
interface Ctx {
  locked: boolean;
  vars: string[];
  msgs: string[];
  sprites: string[];
  self: string;
  cursor: Cursor | null;
  setCursor: (c: Cursor) => void;
  edit: (script: number, path: Path, patch: Partial<Stmt>) => void;
  remove: (script: number, path: Path) => void;
  drop: (e: DragEvent, script: number, list: Path, index: number) => void;
}

function BlockParts({ def, b, ctx, onPatch }: { def: BlockDef; b: Stmt; ctx: Ctx; onPatch?: (p: Partial<Stmt>) => void }) {
  const dis = ctx.locked || !onPatch;
  return (
    <>
      {def.parts.map((p: Part, i) => {
        if (typeof p === 'string') return <span key={i}>{p}</span>;
        if ('slot' in p) return <ValSlot key={i} val={b[p.slot]} kind={p.kind} vars={ctx.vars} disabled={dis} label={`${def.parts.filter((x) => typeof x === 'string').join(' ')} value`} onChange={(v) => onPatch?.({ [p.slot]: v })} />;
        if ('name' in p) return <NameSel key={i} kind={p.name} value={b.name} vars={ctx.vars} msgs={ctx.msgs} disabled={dis} onChange={(v) => onPatch?.({ name: v })} />;
        return <CondSlot key={i} cond={b.cond} sprites={ctx.sprites} vars={ctx.vars} self={ctx.self} disabled={dis} onChange={(cond) => onPatch?.({ cond })} />;
      })}
    </>
  );
}

function Slot({ ctx, script, list, index }: { ctx: Ctx; script: number; list: Path; index: number }) {
  const [over, setOver] = useState(false);
  if (ctx.locked) return <div className="h-0.5" />;
  const on = !!ctx.cursor && ctx.cursor.script === script && same(ctx.cursor.list, list) && ctx.cursor.index === index;
  return (
    <button
      type="button"
      aria-label={`Insert point ${index + 1}${on ? ' (selected)' : ''}`}
      onClick={() => ctx.setCursor({ script, list, index })}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        ctx.drop(e, script, list, index);
      }}
      className={`block w-full rounded transition-all ${on || over ? 'my-0.5 h-2.5 bg-[#4C97FF]' : 'h-1.5 hover:bg-[#4C97FF]/40'}`}
    />
  );
}

function StackView({ ctx, script, list, blocks }: { ctx: Ctx; script: number; list: Path; blocks: Stmt[] }) {
  return (
    <div>
      <Slot ctx={ctx} script={script} list={list} index={0} />
      {blocks.map((b, i) => {
        const def = DEF[b.op];
        if (!def) return null;
        const path = [...list, i];
        const c = col(def.cat);
        return (
          <div key={i}>
            <div
              draggable={!ctx.locked}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/kb-move', JSON.stringify({ script, path }));
                e.stopPropagation();
              }}
              className="w-fit max-w-full min-w-[9rem] rounded-lg border shadow-[0_2px_0_rgb(0_0_0/0.15)]"
              style={{ background: c.fill, borderColor: c.stroke }}
            >
              <div className="flex min-h-9 flex-wrap items-center gap-1.5 px-2.5 py-1 text-[13.5px] font-semibold text-white">
                {!ctx.locked && (
                  <span className="cursor-grab text-white/60" aria-hidden>
                    ⋮⋮
                  </span>
                )}
                <BlockParts def={def} b={b} ctx={ctx} onPatch={(p) => ctx.edit(script, path, p)} />
                {!ctx.locked && (
                  <button type="button" onClick={() => ctx.remove(script, path)} aria-label={`Delete block ${def.parts.filter((x) => typeof x === 'string').join(' ')}`} className="ml-auto grid size-5 place-items-center rounded-full bg-black/15 hover:bg-black/30">
                    <Icon name="x" size={11} />
                  </button>
                )}
              </div>
              {def.c && (
                <>
                  <div className="ml-3 min-h-7 rounded-l-md bg-[#f9f9fb] py-0.5 pr-1.5 pl-1.5">
                    <StackView ctx={ctx} script={script} list={[...path, 0]} blocks={b.body || []} />
                  </div>
                  {def.e && (
                    <>
                      <div className="px-2.5 py-0.5 text-[13.5px] font-semibold text-white">else</div>
                      <div className="ml-3 min-h-7 rounded-l-md bg-[#f9f9fb] py-0.5 pr-1.5 pl-1.5">
                        <StackView ctx={ctx} script={script} list={[...path, 1]} blocks={b.else || []} />
                      </div>
                    </>
                  )}
                  <div className="h-3.5" />
                </>
              )}
            </div>
            <Slot ctx={ctx} script={script} list={list} index={i + 1} />
          </div>
        );
      })}
    </div>
  );
}

function HatView({ hat, onChange, msgs, locked, onDelete }: { hat: Hat; onChange: (h: Hat) => void; msgs: string[]; locked: boolean; onDelete?: () => void }) {
  const c = hat.type === 'define' ? COLORS.myblocks : hat.type === 'clone' ? COLORS.control : COLORS.events;
  return (
    <div className="flex w-fit min-w-[10rem] flex-wrap items-center gap-1.5 rounded-t-[20px] rounded-b-lg border px-3 pt-3 pb-1.5 text-[13.5px] font-semibold text-white" style={{ background: c.fill, borderColor: c.stroke }}>
      {hat.type === 'flag' && (
        <>
          when <GreenFlag /> <span className="sr-only">green flag</span> clicked
        </>
      )}
      {hat.type === 'click' && <>when this sprite clicked</>}
      {hat.type === 'clone' && <>when I start as a clone</>}
      {hat.type === 'define' && (
        <>
          define <span className="rounded bg-black/15 px-1.5">{hat.name}</span>
          {hat.param && <span className="rounded-full bg-[#FF6680] px-2 ring-1 ring-white/60">{hat.param}</span>}
        </>
      )}
      {hat.type === 'key' && (
        <>
          when
          <select aria-label="Key" disabled={locked} value={hat.key} onChange={(e) => onChange({ type: 'key', key: e.target.value })} className="h-7 rounded-md bg-black/15 px-1 text-white">
            {KEYS.map((k) => (
              <option key={k} value={k} className="text-ink">
                {k}
              </option>
            ))}
          </select>
          key pressed
        </>
      )}
      {hat.type === 'receive' && (
        <>
          when I receive
          <NameSel kind="msg" value={hat.msg} msgs={msgs} vars={[]} disabled={locked} onChange={(m) => onChange({ type: 'receive', msg: m })} />
        </>
      )}
      {onDelete && !locked && (
        <button type="button" onClick={onDelete} aria-label="Delete this whole script" className="ml-auto grid size-5 place-items-center rounded-full bg-black/15 hover:bg-black/30">
          <Icon name="trash" size={11} />
        </button>
      )}
    </div>
  );
}

function AskBox({ question, onAnswer }: { question: string; onAnswer: (a: string) => void }) {
  const [text, setText] = useState('');
  return (
    <form
      className="flex items-center gap-2 rounded-xl border-2 border-[#5CB1D6] bg-[#eef8fc] p-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer(text);
        setText('');
      }}
    >
      <label className="sr-only" htmlFor="kb-ask">
        {question}
      </label>
      <input id="kb-ask" autoFocus value={text} maxLength={60} onChange={(e) => setText(e.target.value)} placeholder={question} className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 text-sm" />
      <button type="submit" className="grid size-9 place-items-center rounded-full bg-[#5CB1D6] font-bold text-white" aria-label="Send answer">
        ✓
      </button>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────
export interface CodeLabProps {
  project: Project;
  onChange?: (p: Project) => void;
  locked?: boolean;
  palette?: StmtOp[]; // allowed blocks (default: all)
  hats?: Hat['type'][]; // allowed hats (default: all)
  allowSprites?: boolean; // learners can add/remove sprites and change the backdrop
  goals?: string[];
  passed?: boolean[];
  storageKey?: string;
}

export function CodeLab({ project, onChange, locked = false, palette, hats, allowSprites, goals, passed }: CodeLabProps) {
  const [sel, setSel] = useState(0);
  const [cat, setCat] = useState<Category>('events');
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [, setTick] = useState(0);
  const [newVar, setNewVar] = useState('');
  const [newList, setNewList] = useState('');
  const [newProc, setNewProc] = useState({ name: '', param: '' });
  const [showLib, setShowLib] = useState(false);
  const vmRef = useRef<VM>(new VM(project));
  const projRef = useRef(project);
  const soundIdx = useRef(0);
  const active = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ si: number; dx: number; dy: number; x0: number; y0: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const sprite = project.sprites[Math.min(sel, project.sprites.length - 1)];
  const vars = project.vars || [];
  const spriteNames = project.sprites.map((s) => s.name);
  const msgs = useMemo(() => {
    const out = new Set<string>(['message1']);
    const walk = (l: Stmt[]) => l.forEach((b) => (b.op === 'broadcast' && b.name && out.add(b.name), walk(b.body || []), walk(b.else || [])));
    project.sprites.forEach((s) => s.scripts.forEach((sc) => (sc.hat.type === 'receive' && out.add(sc.hat.msg), walk(sc.blocks))));
    return [...out];
  }, [project]);

  // Keep the VM in step with the code: new scripts take effect; structural changes rebuild the VM.
  useEffect(() => {
    const vm = vmRef.current;
    const prev = projRef.current;
    projRef.current = project;
    const sameSprites = prev.sprites.length === project.sprites.length && prev.sprites.every((s, i) => s.name === project.sprites[i].name && s.costumes.join() === project.sprites[i].costumes.join());
    if (!sameSprites || JSON.stringify(prev.vars) !== JSON.stringify(project.vars) || prev.backdrop !== project.backdrop) {
      vmRef.current = new VM(project);
    } else {
      vm.stopAll();
      vm.project = project;
    }
    setTick((t) => t + 1);
  }, [project]);

  // Animation loop: step the VM at 30 frames a second while anything runs.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      acc += Math.min(200, now - last);
      last = now;
      const vm = vmRef.current;
      let changed = false;
      while (acc >= 1000 / 30) {
        acc -= 1000 / 30;
        if (vm.threads.length) {
          vm.step();
          changed = true;
        }
      }
      if (vm.events.sounds.length > soundIdx.current) {
        for (const s of vm.events.sounds.slice(soundIdx.current)) playSound(s.name);
        soundIdx.current = vm.events.sounds.length;
      }
      if (changed) setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard: only while this lab is the one being used.
  useEffect(() => {
    const map = (k: string) => ({ ' ': 'space', ArrowRight: 'right arrow', ArrowLeft: 'left arrow', ArrowUp: 'up arrow', ArrowDown: 'down arrow' })[k] || (k.length === 1 ? k.toLowerCase() : '');
    const typing = (e: KeyboardEvent) => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || '');
    const down = (e: KeyboardEvent) => {
      if (!active.current || typing(e)) return;
      const k = map(e.key);
      if (!k) return;
      if (['space', 'right arrow', 'left arrow', 'up arrow', 'down arrow'].includes(k)) e.preventDefault();
      vmRef.current.keyDown(k);
      setTick((t) => t + 1);
    };
    const up = (e: KeyboardEvent) => {
      const k = map(e.key);
      if (k) vmRef.current.keyUp(k);
    };
    const outside = (e: PointerEvent) => {
      active.current = !!wrap.current?.contains(e.target as globalThis.Node);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('pointerdown', outside);
    };
  }, []);

  const update = useCallback(
    (fn: (p: Project) => void) => {
      if (locked || !onChange) return;
      const p = clone(projRef.current);
      fn(p);
      onChange(p);
    },
    [locked, onChange],
  );

  const insertAt = (op: StmtOp | null, hat?: Hat) => {
    update((p) => {
      const sp = p.sprites[sel];
      if (hat) {
        sp.scripts.push({ hat, blocks: [] });
        setCursor({ script: sp.scripts.length - 1, list: [], index: 0 });
        return;
      }
      const def = DEF[op!];
      if (!sp.scripts.length) sp.scripts.push({ hat: { type: 'flag' }, blocks: [] });
      const cur = cursor && cursor.script < sp.scripts.length ? cursor : { script: sp.scripts.length - 1, list: [], index: Number.MAX_SAFE_INTEGER };
      const list = listAt(sp.scripts[cur.script], cur.list);
      const at = Math.min(cur.index, list.length);
      const node = def.make();
      if (node.op === 'call') node.name = procs[0]?.name || 'my block';
      if ((node.op === 'listAdd' || node.op === 'listDelete' || node.op === 'listDeleteAll' || node.op === 'listReplace' || node.op === 'listInsert') && p.lists?.length) node.name = p.lists[0];
      if ((node.op === 'setVar' || node.op === 'changeVar') && p.vars?.length) node.name = p.vars[0];
      list.splice(at, 0, node);
      setCursor(def.c ? { script: cur.script, list: [...cur.list, at, 0], index: 0 } : { script: cur.script, list: cur.list, index: at + 1 });
    });
  };

  const ctx: Ctx = {
    locked,
    vars,
    msgs,
    sprites: spriteNames,
    self: sprite?.name || '',
    cursor,
    setCursor,
    edit: (script, path, patch) =>
      update((p) => {
        const list = listAt(p.sprites[sel].scripts[script], path.slice(0, -1));
        Object.assign(list[path[path.length - 1]], patch);
      }),
    remove: (script, path) => {
      update((p) => {
        listAt(p.sprites[sel].scripts[script], path.slice(0, -1)).splice(path[path.length - 1], 1);
      });
      setCursor(null);
    },
    drop: (e, script, list, index) => {
      e.preventDefault();
      const op = e.dataTransfer.getData('text/kb-op') as StmtOp;
      const mv = e.dataTransfer.getData('text/kb-move');
      if (op && DEF[op]) {
        update((p) => listAt(p.sprites[sel].scripts[script], list).splice(index, 0, DEF[op].make()));
        setCursor({ script, list, index: index + 1 });
      } else if (mv) {
        const from = JSON.parse(mv) as { script: number; path: Path };
        if (from.script === script && list.length >= from.path.length && from.path.every((x, i) => x === list[i])) return; // into itself
        update((p) => {
          const scs = p.sprites[sel].scripts;
          const src = listAt(scs[from.script], from.path.slice(0, -1));
          const fi = from.path[from.path.length - 1];
          const [node] = src.splice(fi, 1);
          let idx = index;
          if (from.script === script && same(from.path.slice(0, -1), list) && fi < index) idx--;
          listAt(scs[script], list).splice(idx, 0, node);
        });
      }
    },
  };

  const vm = vmRef.current;
  const running = vm.threads.length > 0;
  const flag = () => {
    active.current = true;
    soundIdx.current = vm.events.sounds.length;
    vm.greenFlag();
    setTick((t) => t + 1);
  };
  const stopAll = () => {
    vm.stopAll();
    setTick((t) => t + 1);
  };
  const resetStage = () => {
    vmRef.current = new VM(projRef.current);
    soundIdx.current = 0;
    setTick((t) => t + 1);
  };
  const press = (k: string, down: boolean) => {
    active.current = true;
    if (down) vm.keyDown(k);
    else vm.keyUp(k);
    setTick((t) => t + 1);
  };

  // Stage pointer: click sprites (runs “when this sprite clicked”), or drag them when stopped.
  const toStage = (e: { clientX: number; clientY: number; currentTarget: SVGSVGElement }) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 480 - 240, y: 180 - ((e.clientY - r.top) / r.height) * 360 };
  };
  const hit = (x: number, y: number) => {
    for (let i = vm.sprites.length - 1; i >= 0; i--) {
      const s = vm.sprites[i];
      if (s.visible && Math.hypot(s.x - x, s.y - y) < (28 * s.size) / 100) return i;
    }
    return -1;
  };

  const allowedCats = CATEGORIES.filter((c) => (c.id === 'events' || c.id === 'operators' ? true : DEFS.some((d) => d.cat === c.id && (!palette || palette.includes(d.op)))));
  const catBlocks = DEFS.filter((d) => d.cat === cat && (!palette || palette.includes(d.op)));
  const hatList = HATS.filter((h) => !hats || hats.includes(h.type));

  const procs = (sprite?.scripts || []).flatMap((sc) => (sc.hat.type === 'define' ? [{ name: sc.hat.name, param: sc.hat.param }] : []));
  const names = { lists: project.lists || [], procs, params: procs.flatMap((p) => (p.param ? [p.param] : [])) };
  return (
    <LabNames.Provider value={names}>
    <div ref={wrap} className="kb-codelab space-y-3" onPointerDown={() => (active.current = true)}>
      <datalist id="kb-msgs">
        {msgs.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      {goals?.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Goals">
          {goals.map((g, i) => (
            <li key={i} className={`rounded-full px-3 py-1 text-sm font-semibold ${passed?.[i] ? 'bg-good text-white' : 'bg-accent-soft text-accent-ink'}`}>
              {passed?.[i] ? '✓ ' : '🎯 '}
              {g}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Stage */}
        <div className="space-y-2 lg:order-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={flag} aria-label="Green flag: run" className="grid size-10 place-items-center rounded-xl bg-[#e8f8ea] hover:bg-[#d5f2d9]" title="Run (green flag)">
              <GreenFlag size={22} />
            </button>
            <button type="button" onClick={stopAll} aria-label="Stop" className="grid size-10 place-items-center rounded-xl bg-[#fde8e8] hover:bg-[#fbd5d5]" title="Stop">
              <span className="block size-4 rounded-sm bg-[#e5484d]" />
            </button>
            <span className={`text-xs font-semibold ${running ? 'text-good' : 'text-muted'}`} aria-live="polite">
              {running ? 'Running…' : 'Stopped'}
            </span>
            <Button size="sm" variant="ghost" icon="refresh" onClick={resetStage} className="ml-auto" title="Put every sprite back where it started">
              Reset stage
            </Button>
          </div>
          <StageView
            vm={vm}
            dragging={dragging}
            onPointerDown={(e) => {
              active.current = true;
              const p = toStage(e);
              const i = hit(p.x, p.y);
              if (i < 0) return;
              if (running || locked) {
                vm.click(i);
                setTick((t) => t + 1);
                return;
              }
              // A tap runs “when this sprite clicked” straight away (like Scratch); a drag moves the sprite.
              vm.click(i);
              setTick((t) => t + 1);
              drag.current = { si: i, dx: vm.sprites[i].x - p.x, dy: vm.sprites[i].y - p.y, x0: vm.sprites[i].x, y0: vm.sprites[i].y, moved: false };
              setSel(i);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const p = toStage(e);
              const s = vm.sprites[drag.current.si];
              const nx = p.x + drag.current.dx;
              const ny = p.y + drag.current.dy;
              if (!drag.current.moved && Math.hypot(nx - drag.current.x0, ny - drag.current.y0) < 6) return; // still a tap
              if (!drag.current.moved) {
                drag.current.moved = true;
                setDragging(true);
              }
              s.x = Math.round(Math.max(-240, Math.min(240, p.x + drag.current.dx)));
              s.y = Math.round(Math.max(-180, Math.min(180, p.y + drag.current.dy)));
              setTick((t) => t + 1);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setDragging(false);
            }}
            onPointerUp={() => {
              if (!drag.current) return;
              const { si, moved } = drag.current;
              const s = vm.sprites[si];
              drag.current = null;
              setDragging(false);
              // Only a real drag saves a new position. (Saving restarts the stage, which used to cancel
              // the script a tap had just started — so tapping a sprite seemed to do nothing.)
              if (!moved) return;
              update((p) => {
                p.sprites[si].x = s.x;
                p.sprites[si].y = s.y;
              });
            }}
          />
          {vm.asking && <AskBox question={vm.asking.question} onAnswer={(a) => (vm.answerAsk(a), setTick((t) => t + 1))} />}
          <div className="flex flex-wrap items-center justify-center gap-1.5" aria-label="On-screen keys">
            {[
              ['left arrow', '←'],
              ['up arrow', '↑'],
              ['down arrow', '↓'],
              ['right arrow', '→'],
              ['space', 'space'],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-label={`Press ${k}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  press(k, true);
                }}
                onPointerUp={() => press(k, false)}
                onPointerLeave={() => vm.keys.has(k) && press(k, false)}
                className={`h-9 rounded-lg border border-line bg-card font-bold select-none ${k === 'space' ? 'w-24 text-xs' : 'w-10'}`}
              >
                {l}
              </button>
            ))}
          </div>
          {/* Sprites */}
          <div className="rounded-xl border border-line bg-card p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {project.sprites.map((s, i) => (
                <button key={i} type="button" onClick={() => setSel(i)} aria-pressed={i === sel} className={`flex items-center gap-1 rounded-lg border-2 px-2 py-1 text-sm font-semibold ${i === sel ? 'border-[#4C97FF] bg-[#e9f1ff]' : 'border-line'}`}>
                  <span className="text-lg" style={{ color: s.color }}>
                    {s.costumes[0]}
                  </span>
                  {s.name}
                </button>
              ))}
              {allowSprites && !locked && project.sprites.length < 10 && (
                <button type="button" onClick={() => setShowLib(!showLib)} className="rounded-lg border-2 border-dashed border-line px-2 py-1 text-sm font-semibold text-muted hover:border-[#4C97FF]">
                  + Sprite
                </button>
              )}
              {allowSprites && !locked && (
                <select aria-label="Backdrop" value={project.backdrop || 'plain'} onChange={(e) => update((p) => (p.backdrop = e.target.value))} className="ml-auto h-8 rounded-lg border border-line bg-card px-2 text-sm">
                  {BACKDROPS.map((b) => (
                    <option key={b} value={b}>
                      Backdrop: {b}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {sprite && !locked && (
              <p className="mt-1.5 text-xs text-muted">
                {sprite.name}: x {Math.round(vm.sprites[sel]?.x ?? sprite.x)}, y {Math.round(vm.sprites[sel]?.y ?? sprite.y)} · drag sprites on the stage to place them
                {allowSprites && project.sprites.length > 1 && (
                  <button
                    type="button"
                    className="ml-2 font-semibold text-bad underline"
                    onClick={() => {
                      update((p) => p.sprites.splice(sel, 1));
                      setSel(0);
                    }}
                  >
                    delete sprite
                  </button>
                )}
              </p>
            )}
            {showLib && (
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
                {SPRITE_LIBRARY.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    title={s.name}
                    aria-label={`Add sprite ${s.name}`}
                    onClick={() => {
                      update((p) => {
                        let nm = s.name;
                        let k = 2;
                        while (p.sprites.some((x) => x.name === nm)) nm = `${s.name}${k++}`;
                        p.sprites.push({ name: nm, costumes: s.costumes, x: 0, y: 0, scripts: [] });
                      });
                      setSel(project.sprites.length);
                      setShowLib(false);
                    }}
                    className="grid size-10 place-items-center rounded-lg border border-line text-2xl hover:bg-sunk"
                  >
                    {s.costumes[0]}
                  </button>
                ))}
                <span className="flex items-center gap-1">
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((L) => (
                    <button
                      key={L}
                      type="button"
                      aria-label={`Add letter ${L}`}
                      onClick={() => {
                        update((p) => {
                          let nm = L;
                          let k = 2;
                          while (p.sprites.some((x) => x.name === nm)) nm = `${L}${k++}`;
                          p.sprites.push({ name: nm, costumes: [L], color: ['#9966FF', '#4C97FF', '#FF8C1A', '#59C059', '#CF63CF'][p.sprites.length % 5], x: -180 + p.sprites.length * 60, y: 0, scripts: [] });
                        });
                        setSel(project.sprites.length);
                        setShowLib(false);
                      }}
                      className="grid size-7 place-items-center rounded border border-line text-xs font-black hover:bg-sunk"
                    >
                      {L}
                    </button>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Palette + workspace */}
        <div className={`grid min-w-0 gap-2 lg:order-1 ${locked ? '' : 'sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]'}`}>
          {!locked && (
            <div className="rounded-xl border border-line bg-card p-2">
              <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Block categories">
                {allowedCats.map((c) => (
                  <button key={c.id} role="tab" aria-selected={cat === c.id} type="button" onClick={() => setCat(c.id)} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${cat === c.id ? 'bg-ink text-paper' : 'hover:bg-sunk'}`}>
                    <span className="size-2.5 rounded-full" style={{ background: COLORS[c.id].fill }} />
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex max-h-[26rem] flex-col items-start gap-1.5 overflow-y-auto pr-1">
                {cat === 'events' &&
                  hatList.map((h) => (
                    <button key={h.type} type="button" onClick={() => insertAt(null, h.make())} className="rounded-t-2xl rounded-b-md border px-2.5 pt-2 pb-1 text-left text-[12.5px] font-semibold text-white hover:brightness-110" style={{ background: COLORS.events.fill, borderColor: COLORS.events.stroke }} aria-label={`Add a new script: ${h.label}`}>
                      {h.type === 'flag' ? (
                        <>
                          when <GreenFlag size={14} /> clicked
                        </>
                      ) : (
                        h.label
                      )}
                    </button>
                  ))}
                {catBlocks.map((d) => (
                  <button
                    key={d.op}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/kb-op', d.op)}
                    onClick={() => insertAt(d.op)}
                    aria-label={`Add block: ${d.parts.map((p) => (typeof p === 'string' ? p : '…')).join(' ')}`}
                    className={`rounded-md border px-2 py-1 text-left text-[12.5px] font-semibold text-white shadow-[0_2px_0_rgb(0_0_0/0.12)] hover:brightness-110 ${d.c ? 'border-b-[10px]' : ''}`}
                    style={{ background: col(d.cat).fill, borderColor: col(d.cat).stroke }}
                  >
                    {d.parts.map((p, i) => (typeof p === 'string' ? <span key={i}>{p} </span> : <span key={i} className="mx-0.5 inline-block min-w-5 rounded-full bg-white/90 px-1 text-center text-[11px] text-[#575E75]">{'cond' in p ? '◇' : '·'}</span>))}
                  </button>
                ))}
                {cat === 'variables' && (
                  <div className="mt-1 w-full space-y-1 border-t border-line pt-2">
                    <p className="text-[11px] font-bold text-muted">Variables: {vars.join(', ') || 'none yet'}</p>
                    <div className="flex gap-1">
                      <input aria-label="New variable name" value={newVar} maxLength={16} onChange={(e) => setNewVar(e.target.value.replace(/[^\p{L}\p{N} _]/gu, ''))} placeholder="name" className="h-7 w-20 rounded-md border border-line px-1.5 text-xs" />
                      <button
                        type="button"
                        disabled={!newVar.trim() || vars.includes(newVar.trim())}
                        onClick={() => {
                          update((p) => (p.vars = [...(p.vars || []), newVar.trim()].slice(0, 10)));
                          setNewVar('');
                        }}
                        className="rounded-md bg-[#FF8C1A] px-2 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Make a variable
                      </button>
                    </div>
                  </div>
                )}
                {cat === 'variables' && (
                  <div className="w-full space-y-1 border-t border-line pt-2">
                    <p className="text-[11px] font-bold text-muted">Lists: {(project.lists || []).join(', ') || 'none yet'}</p>
                    <div className="flex gap-1">
                      <input aria-label="New list name" value={newList} maxLength={16} onChange={(e) => setNewList(e.target.value.replace(/[^\p{L}\p{N} _]/gu, ''))} placeholder="name" className="h-7 w-20 rounded-md border border-line px-1.5 text-xs" />
                      <button type="button" disabled={!newList.trim() || (project.lists || []).includes(newList.trim())} onClick={() => (update((p) => (p.lists = [...(p.lists || []), newList.trim()].slice(0, 5))), setNewList(''))} className="rounded-md bg-[#FF661A] px-2 text-xs font-bold text-white disabled:opacity-40">
                        Make a list
                      </button>
                    </div>
                  </div>
                )}
                {cat === 'myblocks' && (
                  <div className="w-full space-y-1 border-t border-line pt-2">
                    <p className="text-[11px] text-muted">Make your own block: give it a name, and (optional) an input such as “size”.</p>
                    <input aria-label="Block name" value={newProc.name} maxLength={20} onChange={(e) => setNewProc({ ...newProc, name: e.target.value.replace(/[^\p{L}\p{N} _]/gu, '') })} placeholder="block name" className="h-7 w-full rounded-md border border-line px-1.5 text-xs" />
                    <input aria-label="Input name (optional)" value={newProc.param} maxLength={12} onChange={(e) => setNewProc({ ...newProc, param: e.target.value.replace(/[^\p{L}\p{N}_]/gu, '') })} placeholder="input (optional)" className="h-7 w-full rounded-md border border-line px-1.5 text-xs" />
                    <button
                      type="button"
                      disabled={!newProc.name.trim() || procs.some((p) => p.name === newProc.name.trim())}
                      onClick={() => {
                        update((p) => p.sprites[sel].scripts.push({ hat: { type: 'define', name: newProc.name.trim(), ...(newProc.param ? { param: newProc.param } : {}) }, blocks: [] }));
                        setNewProc({ name: '', param: '' });
                      }}
                      className="rounded-md bg-[#FF6680] px-2 py-1 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Make a block
                    </button>
                  </div>
                )}
                {cat === 'operators' && <p className="text-[11px] text-muted">Green operator blocks go <strong>inside</strong> other blocks. Tap the small ▾ next to any white value to use pick random, + − × ÷ or join. Use “compare” in an if block’s condition menu.</p>}
                {cat === 'sensing' && <p className="mt-1 text-[11px] text-muted">Sensing conditions (touching, key pressed) go inside “if” and “repeat until” blocks — choose them from the block’s menu.</p>}
              </div>
            </div>
          )}
          <div
            className="min-h-[18rem] rounded-xl border border-line bg-[#f9f9fb] p-2.5"
            aria-label={`Code for ${sprite?.name}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const op = e.dataTransfer.getData('text/kb-op') as StmtOp;
              if (op && DEF[op] && e.target === e.currentTarget) {
                update((p) => p.sprites[sel].scripts.push({ hat: { type: 'flag' }, blocks: [DEF[op].make()] }));
              }
            }}
          >
            <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
              Code for <span className="text-ink">{sprite?.name}</span>
              {!locked && <span className="font-normal normal-case"> · tap a blue line to choose where the next block goes</span>}
            </p>
            {!sprite?.scripts.length && <p className="rounded-lg border-2 border-dashed border-line p-3 text-sm text-muted">No scripts yet. Start with a yellow Events hat block, like “when green flag clicked”.</p>}
            <div className="space-y-4">
              {sprite?.scripts.map((sc, si) => (
                <div key={si}>
                  <HatView
                    hat={sc.hat}
                    msgs={msgs}
                    locked={locked}
                    onChange={(h) =>
                      update((p) => {
                        p.sprites[sel].scripts[si].hat = h;
                      })
                    }
                    onDelete={() => {
                      update((p) => p.sprites[sel].scripts.splice(si, 1));
                      setCursor(null);
                    }}
                  />
                  <StackView ctx={ctx} script={si} list={[]} blocks={sc.blocks} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </LabNames.Provider>
  );
}
