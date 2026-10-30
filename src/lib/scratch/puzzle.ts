// Block-coding puzzles: a tiny Scratch-like language that drives a robot on a grid stage.
// Pure TypeScript, shared by the browser (to animate a run) and the server (to grade it),
// so a learner can never pass by sending a fake result.

export type Dir = 'N' | 'E' | 'S' | 'W';
export type Cell = [number, number]; // [col, row], row 0 at the top

export interface World {
  cols: number;
  rows: number;
  start: { x: number; y: number; dir: Dir };
  walls?: Cell[];
  gems?: Cell[];
  goal?: Cell | null;
  paint?: Cell[]; // cells the learner must colour with "pen down"
  coords?: boolean; // label the stage with Scratch coordinates (100 per square, 0,0 in the middle)
  vars?: string[]; // variables shown on the stage, starting at 0
  jr?: boolean; // ScratchJr style: picture blocks for early readers
  hero?: string; // emoji character instead of the robot (e.g. '🐱')
}

/** Block ops the learner can use. `text` is the Scratch-style label (renderer syntax). */
export const OPS = {
  flag: { text: 'when green flag clicked', cat: 'events', hat: true },
  key: { text: 'when [space v] key pressed', cat: 'events', hat: true },
  move: { text: 'move (n) steps', cat: 'motion', arg: { min: 1, max: 9, def: 1 } },
  turnR: { text: 'turn cw (90) degrees', cat: 'motion' },
  turnL: { text: 'turn ccw (90) degrees', cat: 'motion' },
  right: { text: 'move right (n)', cat: 'motion', arg: { min: 1, max: 9, def: 1 } },
  left: { text: 'move left (n)', cat: 'motion', arg: { min: 1, max: 9, def: 1 } },
  up: { text: 'move up (n)', cat: 'motion', arg: { min: 1, max: 9, def: 1 } },
  down: { text: 'move down (n)', cat: 'motion', arg: { min: 1, max: 9, def: 1 } },
  hop: { text: 'hop', cat: 'motion' },
  grow: { text: 'grow', cat: 'looks' },
  shrink: { text: 'shrink', cat: 'looks' },
  hide: { text: 'hide', cat: 'looks' },
  show: { text: 'show', cat: 'looks' },
  goto: { text: 'go to x: (x) y: (y)', cat: 'motion' },
  changeX: { text: 'change x by (n)', cat: 'motion', arg: { min: -400, max: 400, def: 100, step: 100 } },
  changeY: { text: 'change y by (n)', cat: 'motion', arg: { min: -400, max: 400, def: 100, step: 100 } },
  say: { text: 'say [text] for (1) seconds', cat: 'looks' },
  penDown: { text: 'pen down', cat: 'pen' },
  penUp: { text: 'pen up', cat: 'pen' },
  pick: { text: 'pick up gem', cat: 'myblocks' },
  setVar: { text: 'set [var v] to (n)', cat: 'variables', arg: { min: 0, max: 99, def: 0 } },
  changeVar: { text: 'change [var v] by (n)', cat: 'variables', arg: { min: -9, max: 9, def: 1 } },
  repeat: { text: 'repeat (n)', cat: 'control', c: true, arg: { min: 1, max: 20, def: 4 } },
  forever: { text: 'forever', cat: 'control', c: true },
  until: { text: 'repeat until <cond>', cat: 'control', c: true },
  if: { text: 'if <cond> then', cat: 'control', c: true },
  ifElse: { text: 'if <cond> then … else', cat: 'control', c: true, e: true },
  wait: { text: 'wait (1) seconds', cat: 'control' },
} as const;
export type Op = keyof typeof OPS;

export const CONDS = {
  gem: { text: 'touching (Gem v)?', cat: 'sensing' },
  star: { text: 'touching (Star v)?', cat: 'sensing' },
  wall: { text: 'wall ahead?', cat: 'sensing' },
  path: { text: 'path ahead?', cat: 'sensing' },
} as const;
export type Cond = keyof typeof CONDS;

export interface Node {
  op: Op;
  n?: number;
  x?: number;
  y?: number;
  text?: string;
  v?: string; // variable name
  cond?: Cond;
  body?: Node[];
  else?: Node[];
}

export interface Program {
  hat?: 'flag' | 'key' | null; // the event block on top; null = no hat
  blocks: Node[];
}

export interface Frame {
  x: number;
  y: number;
  dir: Dir;
  gems: string[]; // remaining gems "c,r"
  painted: string[];
  vars: Record<string, number>;
  say?: string;
  size?: number; // ScratchJr grow/shrink steps (0 = normal)
  hidden?: boolean;
  active?: number[]; // path to the block being run (for highlighting)
  crash?: string;
}

export interface RunResult {
  frames: Frame[];
  ok: boolean; // reached every goal in the key
  reason: string; // friendly explanation
  stats: { blocks: number; steps: number; reachedGoal: boolean; gemsLeft: number; paintedOk: boolean; vars: Record<string, number>; used: Op[]; crashed: boolean; ranOut: boolean };
}

export interface Goals {
  goal?: boolean; // finish on the star
  allGems?: boolean;
  paint?: boolean; // painted cells exactly match world.paint
  vars?: Record<string, number>;
  size?: number; // final grow/shrink steps
  visible?: boolean; // final visibility
  maxBlocks?: number; // fewest blocks (not counting the hat)
  mustUse?: Op[];
  says?: string[]; // said these (case-insensitive, contains), in this order
  hat?: 'flag' | 'key'; // the program must start with this event
  finalPos?: Cell; // for coordinate puzzles without a star
}

const key = (c: Cell | { x: number; y: number }) => (Array.isArray(c) ? `${c[0]},${c[1]}` : `${c.x},${c.y}`);
const DX: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const RIGHT: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' };
const LEFT: Record<Dir, Dir> = { N: 'W', W: 'S', S: 'E', E: 'N' };

/** Scratch coordinates of a cell (100 per square, centre of stage = 0,0). */
export const toScratch = (w: World, c: number, r: number) => ({ x: (c - (w.cols - 1) / 2) * 100, y: ((w.rows - 1) / 2 - r) * 100 });
export const fromScratch = (w: World, x: number, y: number) => ({ c: Math.round(x / 100 + (w.cols - 1) / 2), r: Math.round((w.rows - 1) / 2 - y / 100) });

export function countBlocks(nodes: Node[]): number {
  return nodes.reduce((s, n) => s + 1 + countBlocks(n.body || []) + countBlocks(n.else || []), 0);
}
function usedOps(nodes: Node[], out = new Set<Op>()) {
  for (const n of nodes) {
    out.add(n.op);
    usedOps(n.body || [], out);
    usedOps(n.else || [], out);
  }
  return out;
}

const MAX_NODES = 60;
const MAX_DEPTH = 5;
const MAX_STEPS = 400;

/** Throws a readable error if the program is malformed or too big (server-side safety). */
/** `lock` fixes a block's number (e.g. move always 1 step) so loops are needed. */
export function checkProgram(p: any, allowed?: Op[], lock: Partial<Record<Op, number>> = {}): Program {
  if (!p || typeof p !== 'object' || !Array.isArray(p.blocks)) throw new Error('Program is missing.');
  const clean = (list: any[], depth: number): Node[] => {
    if (depth > MAX_DEPTH) throw new Error('Too many blocks inside blocks.');
    return list.map((n) => {
      if (!n || !(n.op in OPS) || OPS[n.op as Op].hasOwnProperty('hat')) throw new Error('Unknown block.');
      if (allowed && !allowed.includes(n.op)) throw new Error(`The block “${OPS[n.op as Op].text}” isn’t available in this puzzle.`);
      const op = n.op as Op;
      const out: Node = { op };
      const num = (v: any, lo: number, hi: number, def: number) => {
        const x = Number(v);
        return Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.round(x))) : def;
      };
      const a = (OPS[op] as any).arg;
      if (a) out.n = lock[op] !== undefined ? lock[op] : num(n.n, a.min, a.max, a.def);
      if (op === 'goto') {
        out.x = num(n.x, -400, 400, 0);
        out.y = num(n.y, -400, 400, 0);
      }
      if (op === 'say') out.text = String(n.text ?? 'Hello!').slice(0, 40);
      if (op === 'setVar' || op === 'changeVar') out.v = String(n.v || 'score').replace(/[^\w ]/g, '').slice(0, 20) || 'score';
      if (op === 'until' || op === 'if' || op === 'ifElse') out.cond = (n.cond in CONDS ? n.cond : 'gem') as Cond;
      if ((OPS[op] as any).c) out.body = clean(Array.isArray(n.body) ? n.body : [], depth + 1);
      if ((OPS[op] as any).e) out.else = clean(Array.isArray(n.else) ? n.else : [], depth + 1);
      return out;
    });
  };
  const prog: Program = { hat: p.hat === 'flag' || p.hat === 'key' ? p.hat : null, blocks: clean(p.blocks, 0) };
  if (countBlocks(prog.blocks) > MAX_NODES) throw new Error(`Use at most ${MAX_NODES} blocks.`);
  return prog;
}

export function run(world: World, prog: Program, goals: Goals = {}): RunResult {
  const walls = new Set((world.walls || []).map(key));
  const st: Frame = { x: world.start.x, y: world.start.y, dir: world.start.dir, gems: (world.gems || []).map(key), painted: [], vars: Object.fromEntries((world.vars || []).map((v) => [v, 0])) };
  let pen = false;
  const frames: Frame[] = [];
  const snap = (active?: number[], extra: Partial<Frame> = {}) => frames.push({ ...st, gems: [...st.gems], painted: [...st.painted], vars: { ...st.vars }, active, ...extra });
  snap();
  let steps = 0;
  let crash = '';
  let ranOut = false;
  const said: string[] = [];
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < world.cols && y < world.rows;
  const blocked = (x: number, y: number) => !inside(x, y) || walls.has(`${x},${y}`);
  const ahead = () => [st.x + DX[st.dir][0], st.y + DX[st.dir][1]] as [number, number];
  const atGoal = () => !!world.goal && st.x === world.goal[0] && st.y === world.goal[1];
  const paintHere = () => {
    if (pen && !st.painted.includes(key(st))) st.painted.push(key(st));
  };
  const test = (c?: Cond) => {
    if (c === 'gem') return st.gems.includes(key(st));
    if (c === 'star') return atGoal();
    if (c === 'wall') return blocked(...ahead());
    if (c === 'path') return !blocked(...ahead());
    return false;
  };
  const exec = (list: Node[], path: number[]): boolean => {
    for (let i = 0; i < list.length; i++) {
      if (crash || ranOut) return false;
      const n = list[i];
      const here = [...path, i];
      if (++steps > MAX_STEPS) {
        ranOut = true;
        return false;
      }
      switch (n.op) {
        case 'right':
        case 'left':
        case 'up':
        case 'down':
        case 'move':
          if (n.op !== 'move') st.dir = ({ right: 'E', left: 'W', up: 'N', down: 'S' } as const)[n.op];
          for (let k = 0; k < (n.n || 1); k++) {
            const [nx, ny] = ahead();
            if (blocked(nx, ny)) {
              crash = inside(nx, ny) ? 'Bonk! The robot bumped into a wall.' : 'Whoa! The robot nearly walked off the stage.';
              snap(here, { crash });
              return false;
            }
            st.x = nx;
            st.y = ny;
            paintHere();
            snap(here);
          }
          break;
        case 'turnR':
          st.dir = RIGHT[st.dir];
          snap(here);
          break;
        case 'turnL':
          st.dir = LEFT[st.dir];
          snap(here);
          break;
        case 'goto':
        case 'changeX':
        case 'changeY': {
          const cur = toScratch(world, st.x, st.y);
          const tx = n.op === 'goto' ? n.x! : n.op === 'changeX' ? cur.x + (n.n || 0) : cur.x;
          const ty = n.op === 'goto' ? n.y! : n.op === 'changeY' ? cur.y + (n.n || 0) : cur.y;
          const { c, r } = fromScratch(world, tx, ty);
          if (!inside(c, r)) {
            crash = `x: ${tx}, y: ${ty} is off the stage.`;
            snap(here, { crash });
            return false;
          }
          if (walls.has(`${c},${r}`)) {
            crash = 'That spot is a wall.';
            snap(here, { crash });
            return false;
          }
          st.x = c;
          st.y = r;
          paintHere();
          snap(here);
          break;
        }
        case 'hop':
          if (!blocked(st.x, st.y - 1)) {
            st.y -= 1;
            snap(here);
            st.y += 1;
          }
          snap(here);
          break;
        case 'grow':
          st.size = Math.min(3, (st.size || 0) + 1);
          snap(here);
          break;
        case 'shrink':
          st.size = Math.max(-2, (st.size || 0) - 1);
          snap(here);
          break;
        case 'hide':
        case 'show':
          st.hidden = n.op === 'hide';
          snap(here);
          break;
        case 'say':
          said.push(String(n.text || ''));
          snap(here, { say: n.text });
          break;
        case 'penDown':
          pen = true;
          paintHere();
          snap(here);
          break;
        case 'penUp':
          pen = false;
          snap(here);
          break;
        case 'pick': {
          const i2 = st.gems.indexOf(key(st));
          if (i2 >= 0) st.gems.splice(i2, 1);
          snap(here, i2 >= 0 ? {} : { say: 'No gem here!' });
          break;
        }
        case 'setVar':
          st.vars[n.v || 'score'] = n.n || 0;
          snap(here);
          break;
        case 'changeVar':
          st.vars[n.v || 'score'] = (st.vars[n.v || 'score'] || 0) + (n.n || 0);
          snap(here);
          break;
        case 'wait':
          snap(here);
          break;
        case 'repeat':
          for (let k = 0; k < (n.n || 1); k++) if (!exec(n.body || [], [...here, 0]) && (crash || ranOut)) return false;
          break;
        case 'forever':
          // A forever loop never ends by itself — the puzzle stops it when the goal is reached.
          while (!crash && !ranOut) {
            if (goals.goal && atGoal()) return false;
            const before = steps;
            exec(n.body || [], [...here, 0]);
            if (steps === before) {
              ranOut = true;
              break;
            }
          }
          return false;
        case 'until':
          while (!test(n.cond)) {
            if (crash || ranOut) return false;
            const before = steps;
            exec(n.body || [], [...here, 0]);
            if (steps === before) {
              ranOut = true;
              return false;
            }
          }
          break;
        case 'if':
          if (test(n.cond)) exec(n.body || [], [...here, 0]);
          break;
        case 'ifElse':
          if (test(n.cond)) exec(n.body || [], [...here, 0]);
          else exec(n.else || [], [...here, 1]);
          break;
      }
    }
    return true;
  };

  const hasHat = goals.hat ? prog.hat === goals.hat : true;
  if (hasHat) exec(prog.blocks, []);
  if (ranOut && /forever/.test(JSON.stringify(prog.blocks)) && goals.goal && atGoal()) ranOut = false;

  const blocks = countBlocks(prog.blocks);
  const used = [...usedOps(prog.blocks)];
  const reachedGoal = atGoal();
  const paintTarget = new Set((world.paint || []).map(key));
  const paintedOk = !goals.paint || (st.painted.length === paintTarget.size && st.painted.every((p) => paintTarget.has(p)));
  const varsOk = Object.entries(goals.vars || {}).every(([k, v]) => st.vars[k] === v);
  const looksOk = (goals.size === undefined || (st.size || 0) === goals.size) && (goals.visible === undefined || !st.hidden === goals.visible);
  const posOk = !goals.finalPos || (st.x === goals.finalPos[0] && st.y === goals.finalPos[1]);
  const fewEnough = !goals.maxBlocks || blocks <= goals.maxBlocks;
  const missing = (goals.mustUse || []).filter((o) => !used.includes(o));
  let from = 0;
  const saysOk = (goals.says || []).every((w) => {
    const i = said.findIndex((x, k) => k >= from && x.toLowerCase().includes(w.toLowerCase()));
    if (i < 0) return false;
    from = i + 1;
    return true;
  });
  const stats = { blocks, steps, reachedGoal, gemsLeft: st.gems.length, paintedOk, vars: { ...st.vars }, used, crashed: !!crash, ranOut };

  let reason = '';
  if (!hasHat) reason = goals.hat === 'key' ? 'Nothing happened! Scripts only run when their event happens. Put the “when key pressed” hat block on top.' : 'Nothing happened! A script needs a hat block on top, like “when green flag clicked”, to start.';
  else if (!prog.blocks.length) reason = 'Add some blocks under the hat, then run it.';
  else if (crash) reason = crash;
  else if (ranOut) reason = 'The robot kept going and going! Check your loop — does it ever stop?';
  else if (goals.goal && !reachedGoal) reason = 'So close! The robot didn’t finish on the star. Watch where it stops and fix that part.';
  else if (goals.allGems && st.gems.length) reason = `The robot missed ${st.gems.length} gem${st.gems.length > 1 ? 's' : ''}. Remember: “pick up gem” only works when the robot is standing on one.`;
  else if (!paintedOk) reason = 'The coloured squares don’t match the pattern yet. Check where the pen goes down and up.';
  else if (!varsOk) reason = `Look at the variable: it should be ${Object.entries(goals.vars || {}).map(([k, v]) => `${k} = ${v}`).join(', ')} at the end, but it is ${Object.keys(goals.vars || {}).map((k) => `${k} = ${st.vars[k] ?? 0}`).join(', ')}.`;
  else if (!posOk) reason = 'The robot isn’t on the right spot. Check your x and y numbers.';
  else if (!looksOk) reason = goals.visible !== undefined && !st.hidden !== goals.visible ? (goals.visible ? 'Your character is hiding! Use “show” so we can see it at the end.' : 'Your character should hide at the end. Use the “hide” block.') : `Check the size: your character should ${goals.size! > 0 ? `grow ${goals.size} time${goals.size === 1 ? '' : 's'}` : goals.size! < 0 ? `shrink ${-goals.size!} time${goals.size === -1 ? '' : 's'}` : 'be normal size'} by the end.`;
  else if (!saysOk) reason = `Listen to the talking: it should say ${(goals.says || []).map((w) => `“${w}”`).join(', then ')}. Check the words and the order.`;
  else if (missing.length) reason = `It works! Now try it using the “${OPS[missing[0]].text.replace(/ \(.*$/, '')}” block.`;
  else if (!fewEnough) reason = `It works! Can you do it with ${goals.maxBlocks} blocks or fewer? You used ${blocks}. Look for steps that repeat.`;
  const ok = !reason;
  const who = (t: string) => (world.hero ? t.replace(/The robot/g, 'Your character').replace(/the robot/g, 'your character') : t);
  return { frames, ok, reason: who(ok ? 'You did it! The robot followed your code perfectly.' : reason), stats };
}

/** Grade ratio: full marks for a perfect solution, part marks if it works but misses a stretch goal. */
export function gradeRun(r: RunResult, goals: Goals): number {
  if (r.ok) return 1;
  const worked = !r.stats.crashed && !r.stats.ranOut && (!goals.goal || r.stats.reachedGoal) && (!goals.allGems || r.stats.gemsLeft === 0) && r.stats.paintedOk;
  return worked ? 0.6 : 0;
}

/** Scratch-block text for a program (renderer syntax), used in videos, PDFs and answer keys. */
export function programToBlocks(p: Program, jr = false): string {
  const cond = (c?: Cond) => (c === 'gem' ? '<touching (Gem v)?>' : c === 'star' ? '<touching (Star v)?>' : c === 'wall' ? '<wall ahead?>' : '<path ahead?>');
  const line = (n: Node, ind: string): string[] => {
    switch (n.op) {
      case 'move':
        return [`${ind}move (${n.n ?? 1}) steps`];
      case 'right':
      case 'left':
      case 'up':
      case 'down':
        return [jr ? `${ind}${{ right: '➡️', left: '⬅️', up: '⬆️', down: '⬇️' }[n.op]} (${n.n ?? 1}) :: motion` : `${ind}move ${n.op} (${n.n ?? 1}) :: motion`];
      case 'hop':
      case 'grow':
      case 'shrink':
      case 'hide':
      case 'show':
        return [`${ind}${jr ? { hop: '🦘 ', grow: '🔼 ', shrink: '🔽 ', hide: '🙈 ', show: '👀 ' }[n.op] : ''}${n.op} :: ${n.op === 'hop' ? 'motion' : 'looks'}`];
      case 'turnR':
        return [`${ind}turn cw (90) degrees`];
      case 'turnL':
        return [`${ind}turn ccw (90) degrees`];
      case 'goto':
        return [`${ind}go to x: (${n.x}) y: (${n.y})`];
      case 'changeX':
        return [`${ind}change x by (${n.n})`];
      case 'changeY':
        return [`${ind}change y by (${n.n})`];
      case 'say':
        return [jr ? `${ind}💬 [${n.text}] :: looks` : `${ind}say [${n.text}] for (1) seconds`];
      case 'penDown':
        return [`${ind}pen down`];
      case 'penUp':
        return [`${ind}pen up`];
      case 'pick':
        return [jr ? `${ind}💎 pick up :: myblocks` : `${ind}pick up gem`];
      case 'setVar':
        return [`${ind}set [${n.v} v] to (${n.n})`];
      case 'changeVar':
        return [jr ? `${ind}⭐ ${n.v} + (${n.n}) :: variables` : `${ind}change [${n.v} v] by (${n.n})`];
      case 'wait':
        return [`${ind}wait (1) seconds`];
      case 'repeat':
        return [`${ind}repeat (${n.n})`, ...(n.body || []).flatMap((b) => line(b, ind + '  ')), `${ind}end`];
      case 'forever':
        return [`${ind}forever`, ...(n.body || []).flatMap((b) => line(b, ind + '  ')), `${ind}end`];
      case 'until':
        return [`${ind}repeat until ${cond(n.cond)}`, ...(n.body || []).flatMap((b) => line(b, ind + '  ')), `${ind}end`];
      case 'if':
        return [`${ind}if ${cond(n.cond)} then`, ...(n.body || []).flatMap((b) => line(b, ind + '  ')), `${ind}end`];
      case 'ifElse':
        return [`${ind}if ${cond(n.cond)} then`, ...(n.body || []).flatMap((b) => line(b, ind + '  ')), `${ind}else`, ...(n.else || []).flatMap((b) => line(b, ind + '  ')), `${ind}end`];
      default:
        return [];
    }
  };
  const hat = p.hat === 'flag' ? ['when green flag clicked'] : p.hat === 'key' ? [jr ? 'when 👆 tapped :: events' : 'when [space v] key pressed'] : [];
  return [...hat, ...p.blocks.flatMap((b) => line(b, ''))].join('\n');
}
