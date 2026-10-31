// Block-coding puzzle editor + robot stage, and the project submission form.
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Button, Icon } from '../ui.tsx';
import { COLORS, type Category } from '../../../lib/scratch/blocks.ts';
import { CONDS, OPS, run, toScratch, type Cond, type Frame, type Node, type Op, type Program, type World } from '../../../lib/scratch/puzzle.ts';
import type { ActivityProps } from './types.ts';
import { CodeLab } from '../codelab/CodeLab.tsx';
import { PythonLab } from '../pylab/PythonLab.tsx';
import type { Project as LabProject } from '../../../lib/scratch/vm.ts';

type Path = number[]; // [i, branch, j, branch, k…]; branch 0 = body, 1 = else

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const listAt = (p: Program, listPath: Path): Node[] => {
  let list = p.blocks;
  for (let i = 0; i < listPath.length; i += 2) {
    const n = list[listPath[i]];
    list = listPath[i + 1] === 1 ? (n.else ||= []) : (n.body ||= []);
  }
  return list;
};
const same = (a: Path, b: Path) => a.length === b.length && a.every((x, i) => x === b[i]);
const startsWith = (a: Path, b: Path) => b.length <= a.length && b.every((x, i) => x === a[i]);

function newNode(op: Op, conds: Cond[]): Node {
  const d = OPS[op] as any;
  const n: Node = { op };
  if (d.arg) n.n = d.arg.def;
  if (op === 'goto') Object.assign(n, { x: 0, y: 0 });
  if (op === 'say') n.text = 'Hello!';
  if (op === 'setVar' || op === 'changeVar') n.v = 'score';
  if (op === 'until' || op === 'if' || op === 'ifElse') n.cond = conds[0] || 'gem';
  if (d.c) n.body = [];
  if (d.e) n.else = [];
  return n;
}

const tone = (cat: string) => COLORS[(cat as Category) in COLORS ? (cat as Category) : 'grey'];

// ── Block visuals (HTML, so numbers stay editable) ──────────
function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[13px] font-semibold text-[#575E75]">{children}</span>;
}
function NumIn({ value, onChange, disabled, label, min, max, step }: { value: number; onChange: (v: number) => void; disabled?: boolean; label: string; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-7 w-14 rounded-full border-0 bg-white px-2 text-center text-[13px] font-semibold text-[#575E75] focus:outline-2 focus:outline-white disabled:opacity-100"
    />
  );
}

const JR_ARROW: Partial<Record<Op, string>> = { right: '➡️', left: '⬅️', up: '⬆️', down: '⬇️' };
const JR_NAME: Partial<Record<Op, string>> = { right: 'right', left: 'left', up: 'up', down: 'down' };

function BlockLabel({ n, edit, conds, disabled, lock = {}, jr }: { n: Node; edit?: (patch: Partial<Node>) => void; conds: Cond[]; disabled?: boolean; lock?: Partial<Record<Op, number>>; jr?: boolean }) {
  const d = OPS[n.op] as any;
  const num = (field: 'n' | 'x' | 'y', label: string) =>
    field === 'n' && lock[n.op] !== undefined ? <Chip>{lock[n.op]}</Chip> : edit ? <NumIn label={label} value={(n as any)[field] ?? 0} disabled={disabled} min={field === 'n' ? d.arg?.min : -400} max={field === 'n' ? d.arg?.max : 400} step={field === 'n' ? d.arg?.step : 100} onChange={(v) => edit({ [field]: v })} /> : <Chip>{(n as any)[field]}</Chip>;
  const cond = () => {
    const c = CONDS[n.cond || 'gem'];
    const col = tone(c.cat);
    return (
      <span className="inline-flex h-7 items-center px-3 text-[13px] font-semibold text-white" style={{ background: col.fill, clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)' }}>
        {edit && conds.length > 1 ? (
          <select aria-label="Condition" disabled={disabled} value={n.cond} onClick={(e) => e.stopPropagation()} onChange={(e) => edit({ cond: e.target.value as Cond })} className="cursor-pointer rounded bg-transparent font-semibold text-white">
            {conds.map((k) => (
              <option key={k} value={k} className="text-ink">
                {CONDS[k].text.replace(/[()]/g, '').replace(' v', '')}
              </option>
            ))}
          </select>
        ) : (
          CONDS[n.cond || 'gem'].text.replace(/[()]/g, '').replace(' v', '')
        )}
      </span>
    );
  };
  switch (n.op) {
    case 'right':
    case 'left':
    case 'up':
    case 'down':
      return (
        <>
          <span className="text-xl leading-none" role="img" aria-label={`Move ${JR_NAME[n.op]}`}>
            {JR_ARROW[n.op]}
          </span>{' '}
          {num('n', `Steps ${JR_NAME[n.op]}`)}
        </>
      );
    case 'move':
      return <>move {num('n', 'Steps')} steps</>;
    case 'hop':
    case 'grow':
    case 'shrink':
    case 'hide':
    case 'show': {
      const ic = { hop: '🦘', grow: '🔼', shrink: '🔽', hide: '🙈', show: '👀' }[n.op];
      return (
        <>
          <span className="text-xl leading-none" aria-hidden>
            {ic}
          </span>{' '}
          {n.op}
        </>
      );
    }
    case 'pick':
      if (jr) return <><span className="text-xl leading-none" role="img" aria-label="Pick up">💎</span> pick up</>;
      return <>{d.text}</>;
    case 'turnR':
      return <>turn <span aria-label="clockwise">↻</span> <Chip>90</Chip> degrees</>;
    case 'turnL':
      return <>turn <span aria-label="anticlockwise">↺</span> <Chip>90</Chip> degrees</>;
    case 'goto':
      return <>go to x: {num('x', 'x')} y: {num('y', 'y')}</>;
    case 'changeX':
      return <>change x by {num('n', 'Change x by')}</>;
    case 'changeY':
      return <>change y by {num('n', 'Change y by')}</>;
    case 'say':
      if (jr) return <><span className="text-xl leading-none" role="img" aria-label="Say">💬</span> {edit ? <input aria-label="Say" disabled={disabled} value={n.text} maxLength={40} onClick={(e) => e.stopPropagation()} onChange={(e) => edit({ text: e.target.value })} className="h-7 w-24 rounded-full bg-white px-2 text-[13px] text-[#575E75]" /> : <Chip>{n.text}</Chip>}</>;
      return <>say {edit ? <input aria-label="Say" disabled={disabled} value={n.text} maxLength={40} onClick={(e) => e.stopPropagation()} onChange={(e) => edit({ text: e.target.value })} className="h-7 w-24 rounded-full bg-white px-2 text-[13px] text-[#575E75]" /> : <Chip>{n.text}</Chip>} for <Chip>1</Chip> seconds</>;
    case 'repeat':
      return jr ? (
        <>
          <span className="text-xl leading-none" role="img" aria-label="Repeat">
            🔁
          </span>{' '}
          {num('n', 'Repeat how many times')}
        </>
      ) : (
        <>repeat {num('n', 'Repeat how many times')}</>
      );
    case 'forever':
      return <>forever</>;
    case 'until':
      return <>repeat until {cond()}</>;
    case 'if':
    case 'ifElse':
      return <>if {cond()} then</>;
    case 'setVar':
      return <>set <Chip>{n.v} ▾</Chip> to {num('n', 'Set to')}</>;
    case 'changeVar':
      if (jr) return <><span className="text-xl leading-none" aria-hidden>⭐</span> {n.v} + {num('n', 'Add how many')}</>;
      return <>change <Chip>{n.v} ▾</Chip> by {num('n', 'Change by')}</>;
    default:
      return <>{d.text}</>;
  }
}

function blockStyle(op: Op) {
  const c = tone((OPS[op] as any).cat);
  return { background: c.fill, borderColor: c.stroke };
}

// ── Script editor ───────────────────────────────────────────
interface Ed {
  prog: Program;
  cursor: { list: Path; index: number };
  setCursor: (c: { list: Path; index: number }) => void;
  edit: (path: Path, patch: Partial<Node>) => void;
  remove: (path: Path) => void;
  drop: (e: DragEvent, list: Path, index: number) => void;
  active?: string;
  locked: boolean;
  conds: Cond[];
  lock: Partial<Record<Op, number>>;
  jr?: boolean;
}

function Slot({ ed, list, index }: { ed: Ed; list: Path; index: number }) {
  const on = same(ed.cursor.list, list) && ed.cursor.index === index;
  const [over, setOver] = useState(false);
  if (ed.locked) return <div className="h-1" />;
  return (
    <button
      type="button"
      aria-label={`Put the next block here${on ? ' (selected)' : ''}`}
      onClick={() => ed.setCursor({ list, index })}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        ed.drop(e, list, index);
      }}
      className={`block w-full rounded transition-all ${on || over ? 'my-1 h-3 bg-accent/70' : 'h-2 hover:bg-accent/30'}`}
    />
  );
}

function ScriptList({ ed, list, nodes }: { ed: Ed; list: Path; nodes: Node[] }) {
  return (
    <div>
      <Slot ed={ed} list={list} index={0} />
      {nodes.map((n, i) => {
        const path = [...list, i];
        const d = OPS[n.op] as any;
        const c = tone(d.cat);
        const isActive = ed.active === path.join('.');
        const header = (
          <div className="flex min-h-10 flex-wrap items-center gap-1.5 px-3 py-1.5 text-[14px] font-semibold text-white">
            {!ed.locked && <span className="cursor-grab text-white/70" aria-hidden>⋮⋮</span>}
            <BlockLabel n={n} edit={ed.locked ? undefined : (patch) => ed.edit(path, patch)} conds={ed.conds} disabled={ed.locked} lock={ed.lock} jr={ed.jr} />
            {!ed.locked && (
              <button type="button" onClick={() => ed.remove(path)} aria-label={`Delete block: ${d.text}`} className="ml-auto grid size-6 place-items-center rounded-full bg-black/15 text-white hover:bg-black/30">
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
        );
        return (
          <div key={i}>
            <div
              draggable={!ed.locked}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/kb-move', JSON.stringify(path));
                e.stopPropagation();
              }}
              className={`w-fit min-w-[11rem] max-w-full rounded-lg border shadow-[0_2px_0_rgb(0_0_0/0.15)] transition ${isActive ? 'ring-4 ring-yellow-300' : ''}`}
              style={{ background: c.fill, borderColor: c.stroke }}
            >
              {header}
              {d.c && (
                <>
                  <div className="ml-4 min-h-8 rounded-l-md bg-sunk/90 py-1 pr-2 pl-2">
                    <ScriptList ed={ed} list={[...path, 0]} nodes={n.body || []} />
                  </div>
                  {d.e && (
                    <>
                      <div className="px-3 py-1 text-[14px] font-semibold text-white">else</div>
                      <div className="ml-4 min-h-8 rounded-l-md bg-sunk/90 py-1 pr-2 pl-2">
                        <ScriptList ed={ed} list={[...path, 1]} nodes={n.else || []} />
                      </div>
                    </>
                  )}
                  <div className="h-4 rounded-b-lg" />
                </>
              )}
            </div>
            <Slot ed={ed} list={list} index={i + 1} />
          </div>
        );
      })}
    </div>
  );
}

// ── Stage ───────────────────────────────────────────────────
function Robot({ size }: { size: number }) {
  // Kitabash's own robot (original design).
  return (
    <g>
      <rect x={-size * 0.3} y={-size * 0.32} width={size * 0.6} height={size * 0.5} rx={size * 0.12} fill="#6C5CE7" stroke="#3d2fb3" strokeWidth={2} />
      <circle cx={-size * 0.12} cy={-size * 0.1} r={size * 0.07} fill="#fff" />
      <circle cx={size * 0.12} cy={-size * 0.1} r={size * 0.07} fill="#fff" />
      <circle cx={-size * 0.1} cy={-size * 0.1} r={size * 0.035} fill="#1d2230" />
      <circle cx={size * 0.14} cy={-size * 0.1} r={size * 0.035} fill="#1d2230" />
      <rect x={-size * 0.1} y={size * 0.04} width={size * 0.2} height={size * 0.05} rx={2} fill="#fff" />
      <line x1={0} y1={-size * 0.32} x2={0} y2={-size * 0.42} stroke="#3d2fb3" strokeWidth={2} />
      <circle cx={0} cy={-size * 0.44} r={size * 0.04} fill="#ffbf00" />
      {/* nose arrow shows which way the robot faces (pointing up = north before rotation) */}
      <path d={`M${-size * 0.12} ${size * 0.22}h${size * 0.24}`} stroke="#3d2fb3" strokeWidth={3} strokeLinecap="round" />
      <path d={`M0 ${-size * 0.62}l${size * 0.1} ${size * 0.12}h${-size * 0.2}z`} fill="#ff5d5d" />
    </g>
  );
}

export function Stage({ world, frame, size = 52, onTapHero }: { world: World; frame: Frame; size?: number; onTapHero?: () => void }) {
  const pad = world.coords ? 30 : 4;
  const W = world.cols * size + pad + 4;
  const H = world.rows * size + pad + 4;
  const ox = pad;
  const oy = 4;
  const deg = { N: 0, E: 90, S: 180, W: 270 }[frame.dir];
  const target = new Set((world.paint || []).map((c) => c.join(',')));
  const vars = Object.entries(frame.vars || {});
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[460px] touch-manipulation rounded-2xl border border-line bg-white" role={onTapHero ? 'group' : 'img'} aria-label={`Stage: ${world.hero ? "your character" : "robot"} at column ${frame.x + 1}, row ${frame.y + 1}, facing ${({ N: 'up', E: 'right', S: 'down', W: 'left' })[frame.dir]}`}>
      {Array.from({ length: world.rows }, (_, r) =>
        Array.from({ length: world.cols }, (_, c) => {
          const k = `${c},${r}`;
          const painted = frame.painted.includes(k);
          return <rect key={k} x={ox + c * size} y={oy + r * size} width={size} height={size} fill={painted ? '#0FBD8C' : (c + r) % 2 ? '#f4f6fb' : '#eef1f8'} stroke="#dfe3ee" />;
        }),
      )}
      {[...target].map((k) => {
        const [c, r] = k.split(',').map(Number);
        return <rect key={'t' + k} x={ox + c * size + 4} y={oy + r * size + 4} width={size - 8} height={size - 8} rx={6} fill="none" stroke="#0FBD8C" strokeWidth={2} strokeDasharray="5 4" />;
      })}
      {(world.walls || []).map(([c, r]) => (
        <g key={`w${c},${r}`}>
          <rect x={ox + c * size + 1} y={oy + r * size + 1} width={size - 2} height={size - 2} rx={4} fill="#b5654a" />
          <path d={`M${ox + c * size + 1} ${oy + r * size + size / 3}h${size - 2}M${ox + c * size + 1} ${oy + r * size + (2 * size) / 3}h${size - 2}M${ox + c * size + size / 2} ${oy + r * size + 1}v${size / 3}M${ox + c * size + size / 4} ${oy + r * size + size / 3}v${size / 3}M${ox + c * size + (3 * size) / 4} ${oy + r * size + size / 3}v${size / 3}M${ox + c * size + size / 2} ${oy + r * size + (2 * size) / 3}v${size / 3 - 1}`} stroke="#8e4a35" strokeWidth={1.5} />
        </g>
      ))}
      {world.goal && (
        <path
          transform={`translate(${ox + world.goal[0] * size + size / 2},${oy + world.goal[1] * size + size / 2})`}
          d={`M0 ${-size * 0.36}L${size * 0.1} ${-size * 0.12}L${size * 0.35} ${-size * 0.11}L${size * 0.15} ${size * 0.05}L${size * 0.22} ${size * 0.3}L0 ${size * 0.16}L${-size * 0.22} ${size * 0.3}L${-size * 0.15} ${size * 0.05}L${-size * 0.35} ${-size * 0.11}L${-size * 0.1} ${-size * 0.12}Z`}
          fill="#FFBF00"
          stroke="#cc9900"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {frame.gems.map((k) => {
        const [c, r] = k.split(',').map(Number);
        const cx = ox + c * size + size / 2;
        const cy = oy + r * size + size / 2;
        const s = size * 0.22;
        return <path key={'g' + k} d={`M${cx} ${cy - s}L${cx + s} ${cy - s * 0.2}L${cx} ${cy + s}L${cx - s} ${cy - s * 0.2}Z`} fill="#CF63CF" stroke="#8e3a8e" strokeWidth={2} />;
      })}
      {world.hero ? (
        <g transform={`translate(${ox + frame.x * size + size / 2},${oy + frame.y * size + size / 2}) scale(${frame.dir === 'W' ? -1 : 1},1)`} style={{ transition: 'transform 0.25s' }}>
          <text textAnchor="middle" dominantBaseline="central" fontSize={size * 0.68 * (1 + 0.25 * (frame.size || 0))} opacity={frame.hidden ? 0.15 : 1}>
            {world.hero}
          </text>
        </g>
      ) : (
        <g transform={`translate(${ox + frame.x * size + size / 2},${oy + frame.y * size + size / 2}) rotate(${deg})`} style={{ transition: 'transform 0.25s' }}>
          <Robot size={size} />
        </g>
      )}
      {onTapHero && (
        // Big, invisible tap target over the character ("start on tap" / "when key pressed" scripts).
        <rect
          x={ox + frame.x * size - size * 0.15}
          y={oy + frame.y * size - size * 0.15}
          width={size * 1.3}
          height={size * 1.3}
          rx={size * 0.3}
          fill="transparent"
          className="cursor-pointer outline-none focus-visible:stroke-[#4C97FF] focus-visible:stroke-[3]"
          role="button"
          tabIndex={0}
          aria-label={`Tap ${world.hero ? 'the character' : 'the robot'} to start its script`}
          data-testid="tap-hero"
          onPointerDown={(e) => {
            e.preventDefault();
            onTapHero();
          }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onTapHero())}
        />
      )}
      {frame.say && (
        <g transform={`translate(${Math.min(W - 120, ox + frame.x * size + size * 0.7)},${Math.max(4, oy + frame.y * size - 26)})`}>
          <rect width={Math.max(60, frame.say.length * 7 + 16)} height={26} rx={10} fill="#fff" stroke="#9aa3b8" />
          <text x={8} y={17} fontSize={12} fill="#1d2230">
            {frame.say}
          </text>
        </g>
      )}
      {frame.crash && (
        <text x={ox + frame.x * size + size / 2} y={oy + frame.y * size + 14} textAnchor="middle" fontSize={20}>
          💥
        </text>
      )}
      {world.coords && (
        <g fontSize={10} fill="#6b7280">
          {Array.from({ length: world.cols }, (_, c) => (
            <text key={'x' + c} x={ox + c * size + size / 2} y={H - 1} textAnchor="middle">
              x {toScratch(world, c, 0).x}
            </text>
          ))}
          {Array.from({ length: world.rows }, (_, r) => (
            <text key={'y' + r} x={2} y={oy + r * size + size / 2 + 3}>
              y {toScratch(world, 0, r).y}
            </text>
          ))}
        </g>
      )}
      {vars.map(([k, v], i) => (
        <g key={k} transform={`translate(${ox + 4},${oy + 4 + i * 26})`}>
          <rect width={84} height={22} rx={5} fill="#e9eef2" stroke="#c4ccd6" />
          <text x={6} y={15} fontSize={11} fill="#575E75">
            {k}
          </text>
          <rect x={46} y={3} width={34} height={16} rx={8} fill="#FF8C1A" />
          <text x={63} y={15} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={700}>
            {v}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── The activity ────────────────────────────────────────────
export function BlockCode({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config as { world: World; palette: Op[]; conds?: Cond[]; hats?: ('flag' | 'key')[]; start?: Program; goalText?: string; lock?: Partial<Record<Op, number>> };
  const lock = c.lock || {};
  const conds = c.conds || ['gem'];
  const initial: Program = useMemo(() => clone(c.start || { hat: c.hats ? null : 'flag', blocks: [] }), [c.start, c.hats]);
  const prog: Program = value?.program || initial;
  const [cursor, setCursor] = useState<{ list: Path; index: number }>({ list: [], index: (c.start?.blocks.length ?? 0) });
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [fi, setFi] = useState(0);
  const [msg, setMsg] = useState('');
  const timer = useRef<number | null>(null);
  const startFrame: Frame = useMemo(() => run(c.world, { hat: null, blocks: [] }, {}).frames[0], [c.world]);
  const frame = frames ? frames[Math.min(fi, frames.length - 1)] : startFrame;

  useEffect(() => {
    if (!value) setValue({ program: initial });
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (fn: (p: Program) => void) => {
    const p = clone(prog);
    fn(p);
    setValue({ program: p });
    stop();
  };
  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setFrames(null);
    setFi(0);
    setMsg('');
  };
  const insert = (op: Op) => {
    if (locked) return;
    update((p) => {
      const list = listAt(p, cursor.list);
      const at = Math.min(cursor.index, list.length);
      list.splice(at, 0, newNode(op, conds));
      const d = OPS[op] as any;
      // After adding a C-block, the next block goes inside it.
      setCursor(d.c ? { list: [...cursor.list, at, 0], index: 0 } : { list: cursor.list, index: at + 1 });
    });
  };
  const ed: Ed = {
    prog,
    cursor,
    setCursor,
    locked,
    conds,
    lock,
    jr: !!c.world.jr,
    active: frames ? frame.active?.join('.') : undefined,
    edit: (path, patch) =>
      update((p) => {
        const list = listAt(p, path.slice(0, -1));
        Object.assign(list[path[path.length - 1]], patch);
      }),
    remove: (path) => {
      update((p) => {
        listAt(p, path.slice(0, -1)).splice(path[path.length - 1], 1);
      });
      setCursor({ list: [], index: 0 });
    },
    drop: (e, list, index) => {
      e.preventDefault();
      const op = e.dataTransfer.getData('text/kb-op') as Op;
      const mv = e.dataTransfer.getData('text/kb-move');
      if (op) {
        update((p) => listAt(p, list).splice(index, 0, newNode(op, conds)));
        setCursor({ list, index: index + 1 });
      } else if (mv) {
        const from: Path = JSON.parse(mv);
        if (startsWith(list, from)) return; // can't drop a block inside itself
        update((p) => {
          const src = listAt(p, from.slice(0, -1));
          const fi2 = from[from.length - 1];
          const [node] = src.splice(fi2, 1);
          let idx = index;
          if (same(from.slice(0, -1), list) && fi2 < index) idx--;
          listAt(p, list).splice(idx, 0, node);
        });
      }
    },
  };

  const hatOptions = c.hats || [];
  const play = () => {
    stop();
    const r = run(c.world, applyLock(prog, lock), { goal: !!c.world.goal, hat: c.hats?.[0] });
    setFrames(r.frames);
    setFi(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i++;
      setFi(i);
      if (i >= r.frames.length - 1) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        const last = r.frames[r.frames.length - 1];
        setMsg(r.stats.crashed || r.stats.ranOut || !prog.blocks.length || (c.hats && !prog.hat) ? r.reason : c.world.goal && last.x === c.world.goal[0] && last.y === c.world.goal[1] ? (c.world.hero ? 'You reached the star! ' : 'The robot reached the star! ') + 'Press “Check” to see if every goal is met.' : (c.world.hero ? 'Your character has finished.' : 'The robot has finished.') + ' Is that what you wanted? Press “Check” when you are happy.');
      }
    }, 380);
  };

  // Tapping the character (or pressing space) is the event for "start on tap" / "when key pressed".
  const tapHero = () => {
    if (timer.current) return;
    if (prog.hat === 'key') play();
    else setMsg(prog.hat === 'flag' ? (c.world.jr ? 'This script starts with the green flag. Use 👆 start on tap if you want it to run when you tap.' : 'This script starts with the green flag — press Run.') : 'Add a start block on top first.');
  };
  useEffect(() => {
    if (!hatOptions.includes('key') || c.world.jr) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test((e.target as HTMLElement)?.tagName || '')) return;
      e.preventDefault();
      tapHero();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div className="space-y-4">
      {c.goalText && (
        <p className="rounded-2xl bg-accent-soft px-4 py-3 font-semibold">
          🎯 {c.goalText}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          <Stage world={c.world} frame={frame} onTapHero={hatOptions.includes('key') ? tapHero : undefined} />
          {hatOptions.includes('key') && (
            <p className="text-xs font-semibold text-muted">{c.world.jr ? '👆 Tap the character on the stage to start a “start on tap” script.' : 'Press the space key (or tap the robot) to start a “when space key pressed” script.'}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="good" icon="flag" onClick={play} disabled={!!timer.current}>
              {prog.hat === 'key' ? (c.world.jr ? 'Run (same as a tap)' : 'Run (press space)') : 'Run'}
            </Button>
            <Button size="sm" variant="ghost" icon="refresh" onClick={stop}>
              Reset
            </Button>
            <span className="text-xs text-muted">Blocks used: {countAll(prog.blocks)}</span>
          </div>
          {msg && (
            <p className="rounded-xl bg-sunk px-3 py-2 text-sm font-medium" aria-live="polite">
              {msg}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {!locked && (
            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wide text-muted uppercase">Blocks — tap to add, or drag</p>
              <div className="flex flex-wrap gap-1.5">
                {hatOptions.map((h) => (
                  <button key={h} type="button" onClick={() => update((p) => (p.hat = h))} className="rounded-t-2xl rounded-b-lg border px-3 py-2 text-[13px] font-semibold text-white" style={{ background: COLORS.events.fill, borderColor: COLORS.events.stroke }}>
                    {h === 'flag' ? (c.world.jr ? '🏁 start' : 'when 🏁 clicked') : c.world.jr ? '👆 start on tap' : 'when space key pressed'}
                  </button>
                ))}
                {c.palette.map((op) => (
                  <button
                    key={op}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/kb-op', op)}
                    onClick={() => insert(op)}
                    aria-label={`Add block: ${OPS[op].text.replace(/[()[\]<>]/g, '')}`}
                    className="rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_0_rgb(0_0_0/0.15)] hover:brightness-110"
                    style={blockStyle(op)}
                  >
                    <BlockLabel n={newNode(op, conds)} conds={conds} lock={lock} jr={!!c.world.jr} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-line bg-[#f9f9fb] p-3">
            <p className="mb-1.5 text-xs font-bold tracking-wide text-muted uppercase">Your script</p>
            {prog.hat ? (
              <div className="flex w-fit items-center gap-2 rounded-t-[22px] rounded-b-lg border px-3 pt-3 pb-2 text-[14px] font-semibold text-white" style={{ background: COLORS.events.fill, borderColor: COLORS.events.stroke }}>
                {prog.hat === 'flag' ? (
                  c.world.jr ? (
                    <>
                      <span aria-label="green flag">🏁</span> start
                    </>
                  ) : (
                    <>
                      when <span aria-label="green flag">🏁</span> clicked
                    </>
                  )
                ) : c.world.jr ? (
                  <>
                    <span aria-label="tap">👆</span> start on tap
                  </>
                ) : (
                  <>
                    when <Chip>space ▾</Chip> key pressed
                  </>
                )}
                {!locked && hatOptions.length > 0 && (
                  <button type="button" onClick={() => update((p) => (p.hat = null))} aria-label="Remove hat block" className="ml-2 grid size-6 place-items-center rounded-full bg-black/15">
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
            ) : (
              <p className="mb-1 rounded-lg border-2 border-dashed border-line px-3 py-2 text-xs text-muted">No hat block — this script has no event to start it.</p>
            )}
            <ScriptList ed={ed} list={[]} nodes={prog.blocks} />
          </div>
          {result && !result.correct && result.detail?.blocks !== undefined && <p className="text-xs text-muted">Last check used {result.detail.blocks} blocks.</p>}
        </div>
      </div>
    </div>
  );
}

function applyLock(p: Program, lock: Partial<Record<Op, number>>): Program {
  const fix = (list: Node[]): Node[] => list.map((n) => ({ ...n, ...(lock[n.op] !== undefined ? { n: lock[n.op] } : {}), body: n.body && fix(n.body), else: n.else && fix(n.else) }));
  return { ...p, blocks: fix(p.blocks) };
}

function countAll(nodes: Node[]): number {
  return nodes.reduce((s, n) => s + 1 + countAll(n.body || []) + countAll(n.else || []), 0);
}

// ── Project submission ──────────────────────────────────────
export function Project({ activity, value, setValue, locked }: ActivityProps) {
  const c = activity.config as {
    brief: string;
    requirements: string[];
    reflection: string;
    minWords?: number;
    anyLink?: boolean;
    tips?: string[];
    platform?: { name: string; url?: string };
    link?: { example: string; help: string };
    offlineOnly?: boolean;
    offlineLabel?: string;
  };
  const scratch = !c.platform && !c.offlineOnly;
  const example = c.link?.example || (scratch ? 'https://scratch.mit.edu/projects/123456789' : 'https://…');
  const v = value || { done: {}, url: '', reflection: '', offline: false };
  const set = (patch: any) => setValue({ ...v, ...patch });
  const words = String(v.reflection || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-accent-soft p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs font-bold tracking-wide text-accent uppercase">Your mission{c.platform ? ` · ${c.platform.name}` : ''}</p>
          {c.platform?.url && (
            <a href={c.platform.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-semibold text-white">
              Open {c.platform.name} <Icon name="arrowR" size={14} />
            </a>
          )}
        </div>
        <p className="mt-1 text-lg leading-relaxed font-semibold">{c.brief}</p>
      </div>
      <fieldset>
        <legend className="mb-2 font-bold">Checklist — tick each one when your {c.platform ? 'work' : 'project'} does it</legend>
        <ul className="space-y-2">
          {c.requirements.map((r, i) => (
            <li key={i}>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2.5 ${v.done?.[i] ? 'border-good bg-good-soft' : 'border-line bg-card'}`}>
                <input type="checkbox" className="mt-1 size-5 accent-[var(--good)]" disabled={locked} checked={!!v.done?.[i]} onChange={(e) => set({ done: { ...v.done, [i]: e.target.checked } })} />
                <span>{r}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {c.offlineOnly ? (
        <label className="flex items-start gap-3 rounded-xl border-2 border-line bg-card px-3 py-2.5">
          <input type="checkbox" className="mt-1 size-5" disabled={locked} checked={!!v.offline} onChange={(e) => set({ offline: e.target.checked, url: '' })} />
          <span className="font-semibold">{c.offlineLabel || 'I showed my work to my teacher'}</span>
        </label>
      ) : (
        <div>
          <label className="font-bold" htmlFor={`${activity.id}-url`}>
            Your {c.platform ? `${c.platform.name} ` : 'project '}link
          </label>
          <p className="text-sm text-muted">
            {c.link?.help || (scratch ? <>In Scratch, press <strong>Share</strong>, then copy the address from the top of the browser.</> : 'Copy the share link of your work.')} It looks like {example}
          </p>
          <input id={`${activity.id}-url`} type="url" inputMode="url" disabled={locked || v.offline} value={v.url} onChange={(e) => set({ url: e.target.value.trim() })} placeholder={example.replace(/[\w]+\/?$/, '…')} className="mt-2 h-11 w-full rounded-xl border border-line bg-card px-3" />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={locked} checked={!!v.offline} onChange={(e) => set({ offline: e.target.checked, url: e.target.checked ? '' : v.url })} />
            {c.offlineLabel || 'I can’t share online — I’ll show my project to my teacher (or saved it with File → Save to your computer)'}
          </label>
        </div>
      )}
      <div>
        <label className="font-bold" htmlFor={`${activity.id}-refl`}>
          Reflection
        </label>
        <p className="text-sm text-muted">{c.reflection}</p>
        <textarea id={`${activity.id}-refl`} disabled={locked} value={v.reflection} onChange={(e) => set({ reflection: e.target.value })} className="mt-2 min-h-28 w-full rounded-xl border border-line bg-card p-3" />
        <p className="text-xs text-muted">
          {words} / {c.minWords ?? 15} words
        </p>
      </div>
      {c.tips?.length ? (
        <details className="rounded-xl bg-sunk p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Stuck? Tips</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {c.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

// ── Code Lab activity (challenge or project) ────────────────
export function CodeLabActivity({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config as { mode: 'challenge' | 'project'; project: LabProject; palette?: any[]; hats?: any[]; allowSprites?: boolean; challenge: string; goals?: string[]; reflection?: string; minWords?: number; requirements?: string[] };
  const key = `kb-lab-${activity.id}`;
  const initial = useMemo<LabProject>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return JSON.parse(JSON.stringify(c.project));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const v = value || { project: initial, reflection: '' };
  useEffect(() => {
    if (!value) setValue({ project: initial, reflection: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setProject = (p: LabProject) => {
    setValue({ ...v, project: p });
    try {
      localStorage.setItem(key, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };
  const words = String(v.reflection || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-accent-soft px-4 py-3">
        <p className="text-xs font-bold tracking-wide text-accent uppercase">{c.mode === 'project' ? 'Your project' : 'Challenge'}</p>
        <p className="mt-0.5 text-lg leading-snug font-semibold">{c.challenge}</p>
      </div>
      <CodeLab project={v.project} onChange={setProject} locked={locked} palette={c.palette} hats={c.hats} allowSprites={c.allowSprites} goals={c.goals} passed={result?.detail?.passed} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {!locked && (
          <button
            type="button"
            className="font-semibold text-muted underline"
            onClick={() => {
              const fresh = JSON.parse(JSON.stringify(c.project));
              setProject(fresh);
            }}
          >
            Start this {c.mode === 'project' ? 'project' : 'challenge'} again
          </button>
        )}
        <span className="text-xs text-muted">Your code is saved on this device as you work. Press “Check” when you’re ready.</span>
      </div>
      {c.mode === 'project' && (
        <div>
          {c.requirements?.length ? (
            <div className="mb-3 rounded-xl bg-sunk p-3 text-sm">
              <p className="font-bold">Your project should:</p>
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

export function PythonLabActivity({ activity, value, setValue, locked, result }: ActivityProps) {
  const c = activity.config as { mode: 'challenge' | 'project'; starter: string; task: string; goals?: string[]; sampleInputs?: string[]; reflection?: string; minWords?: number; requirements?: string[] };
  const key = `kb-py-${activity.id}`;
  const initial = useMemo<string>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return saved;
    } catch {
      /* ignore */
    }
    return c.starter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const v = value || { code: initial, reflection: '' };
  useEffect(() => {
    if (!value) setValue({ code: initial, reflection: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setCode = (code: string) => {
    setValue({ ...v, code });
    try {
      localStorage.setItem(key, code);
    } catch {
      /* ignore */
    }
  };
  const words = String(v.reflection || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-accent-soft px-4 py-3">
        <p className="text-xs font-bold tracking-wide text-accent uppercase">{c.mode === 'project' ? 'Your project' : 'Challenge'}</p>
        <p className="mt-0.5 text-lg leading-snug font-semibold">{c.task}</p>
      </div>
      <PythonLab code={v.code} onChange={setCode} locked={locked} goals={c.goals} passed={result?.detail?.passed} sampleInputs={c.sampleInputs} />
      {result && !result.correct && result.feedback && <pre className="rounded-xl bg-sunk p-3 text-sm whitespace-pre-wrap">{result.feedback}</pre>}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {!locked && (
          <button type="button" className="font-semibold text-muted underline" onClick={() => setCode(c.starter)}>
            Reset to the starting code
          </button>
        )}
        <span className="text-xs text-muted">Your code is saved on this device as you work. Press “Check” when you’re ready.</span>
      </div>
      {c.mode === 'project' && (
        <div>
          {c.requirements?.length ? (
            <div className="mb-3 rounded-xl bg-sunk p-3 text-sm">
              <p className="font-bold">Your project should:</p>
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
