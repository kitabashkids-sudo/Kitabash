// Code Lab virtual machine: a small, safe Scratch-like runtime.
// Pure TypeScript with no DOM, shared by the browser (live stage) and the server (challenge checks),
// so a learner's result is always re-computed on the server from their actual program.
//
// Model: a project has sprites; each sprite has scripts; each script = hat + blocks.
// Threads run like Scratch: loops and waits yield at the end of each frame (30 frames a second).

export type Key = 'space' | 'left arrow' | 'right arrow' | 'up arrow' | 'down arrow' | string;

export type Val =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'var'; name: string }
  | { k: 'rep'; r: 'x' | 'y' | 'dir' | 'size' | 'timer' | 'costume' | 'answer' }
  | { k: 'rand'; a: Val; b: Val }
  | { k: 'op'; op: '+' | '-' | '*' | '/' | '%'; a: Val; b: Val }
  | { k: 'join'; a: Val; b: Val }
  | { k: 'item'; name: string; a: Val } // item (a) of list
  | { k: 'length'; name: string } // length of list
  | { k: 'param'; name: string } // a My Block input
  | { k: 'letter'; a: Val; b: Val } // letter (a) of (b)
  | { k: 'strlen'; a: Val } // length of (text)
  | { k: 'round'; a: Val }; // round (a)

export type Bool =
  | { k: 'touch'; target: string } // 'edge' or a sprite name
  | { k: 'key'; key: Key }
  | { k: 'cmp'; op: '<' | '=' | '>'; a: Val; b: Val }
  | { k: 'not'; a: Bool }
  | { k: 'and' | 'or'; a: Bool; b: Bool }
  | { k: 'contains'; name: string; a: Val }; // list contains a?

export type StmtOp =
  // motion
  | 'move' | 'turnR' | 'turnL' | 'goto' | 'gotoRandom' | 'glide' | 'changeX' | 'setX' | 'changeY' | 'setY' | 'point' | 'bounce'
  // looks
  | 'say' | 'sayFor' | 'nextCostume' | 'changeSize' | 'setSize' | 'changeEffect' | 'setEffect' | 'clearEffects' | 'show' | 'hide'
  // sound
  | 'sound'
  // events
  | 'broadcast'
  // control
  | 'wait' | 'repeat' | 'forever' | 'if' | 'ifElse' | 'waitUntil' | 'until' | 'stopAll'
  // sensing
  | 'resetTimer'
  // variables
  | 'setVar' | 'changeVar'
  // pen
  | 'penDown' | 'penUp' | 'eraseAll' | 'setPenColor' | 'setPenSize'
  // stage + rotation
  | 'nextBackdrop' | 'switchBackdrop' | 'rotation'
  // sensing + music
  | 'ask' | 'playNote'
  // clones, lists, My Blocks
  | 'createClone' | 'deleteClone' | 'listAdd' | 'listDelete' | 'listDeleteAll' | 'listReplace' | 'listInsert' | 'call';

export interface Stmt {
  op: StmtOp;
  a?: Val;
  b?: Val;
  c?: Val;
  name?: string; // variable, message, effect, sound or colour name
  cond?: Bool;
  body?: Stmt[];
  else?: Stmt[];
}

export type Hat = { type: 'flag' } | { type: 'key'; key: Key } | { type: 'click' } | { type: 'receive'; msg: string } | { type: 'clone' } | { type: 'define'; name: string; param?: string };
export interface Script {
  hat: Hat;
  blocks: Stmt[];
}
export interface SpriteDef {
  name: string;
  costumes: string[]; // emoji or short text (e.g. a letter)
  color?: string; // text colour for letter costumes
  x: number;
  y: number;
  dir?: number;
  size?: number;
  visible?: boolean;
  scripts: Script[];
}
export interface Project {
  sprites: SpriteDef[];
  backdrop?: string; // 'plain' | 'grid' | 'space' | 'grass' | 'party' | 'sea'
  vars?: string[];
  lists?: string[];
}

export interface SpriteState {
  name: string;
  x: number;
  y: number;
  dir: number;
  size: number;
  visible: boolean;
  costume: number;
  costumes: string[];
  color?: string;
  say: string;
  effects: { color: number; ghost: number };
  pen: { down: boolean; color: string; size: number };
  rotation: 'all around' | 'left-right' | "don't rotate";
  def: number; // which sprite definition (clones share their original's scripts)
  clone: boolean;
  deleted: boolean;
}
export interface PenLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  size: number;
}
export interface Snapshot {
  t: number;
  sprites: { name: string; x: number; y: number; dir: number; size: number; visible: boolean; costume: number; say: string }[];
  vars: Record<string, number | string>;
}

const W = 240;
const H = 180;
export const STAGE = { width: 480, height: 360 };
export const FPS = 30;
export const PEN_COLORS: Record<string, string> = { red: '#e5484d', orange: '#f76b15', yellow: '#ffc53d', green: '#30a46c', blue: '#0090ff', purple: '#8e4ec6', pink: '#e93d82', black: '#1d2230' };
export const SOUNDS = ['pop', 'boing', 'drum', 'chime', 'cheer'];
export const EFFECTS = ['color', 'ghost'];
export const BACKDROPS = ['plain', 'grid', 'space', 'grass', 'party', 'sea'] as const;
export const ROTATIONS = ['all around', 'left-right', "don't rotate"] as const;

const clampN = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const num = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};
const radius = (s: SpriteState) => (24 * s.size) / 100;

// Small deterministic random generator so server checks are repeatable.
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

type Gen = Generator<void, void, void>;
interface Thread {
  sprite: number;
  script: Script;
  gen: Gen;
  done: boolean;
}

export interface VMEvents {
  sounds: { t: number; name: string }[];
  asked: { t: number; sprite: string; question: string; answer?: string }[];
  said: { t: number; sprite: string; text: string }[];
  broadcasts: { t: number; msg: string }[];
  costumeChanges: Record<string, number>;
}

export class VM {
  project: Project;
  sprites: SpriteState[];
  vars: Record<string, number | string>;
  lists: Record<string, (number | string)[]> = {};
  clonesMade = 0;
  pen: PenLine[] = [];
  threads: Thread[] = [];
  keys = new Set<string>();
  frame = 0;
  backdrop = 0;
  timerStart = 0;
  stopped = false;
  events: VMEvents = { sounds: [], said: [], broadcasts: [], costumeChanges: {}, asked: [] };
  answer = '';
  asking: { sprite: number; question: string } | null = null;
  answerQueue: string[] = []; // for headless tests
  private rand: () => number;
  private glide = new Map<number, { from: [number, number]; to: [number, number]; start: number; frames: number }>();

  constructor(project: Project, seed = 7) {
    this.project = project;
    this.rand = rng(seed);
    this.sprites = project.sprites.map((d, i) => ({
      name: d.name,
      x: d.x,
      y: d.y,
      dir: d.dir ?? 90,
      size: d.size ?? 100,
      visible: d.visible ?? true,
      costume: 0,
      costumes: d.costumes.length ? d.costumes : ['🤖'],
      color: d.color,
      say: '',
      effects: { color: 0, ghost: 0 },
      pen: { down: false, color: PEN_COLORS.blue, size: 3 },
      rotation: 'all around',
      def: i,
      clone: false,
      deleted: false,
    }));
    this.lists = Object.fromEntries((project.lists || []).map((l) => [l, [] as (number | string)[]]));
    this.backdrop = Math.max(0, BACKDROPS.indexOf((project.backdrop || 'plain') as any));
    this.vars = Object.fromEntries((project.vars || []).map((v) => [v, 0]));
  }

  get time() {
    return this.frame / FPS;
  }
  get running() {
    return this.threads.some((t) => !t.done);
  }

  // ── Events ──────────────────────────────────────────────
  greenFlag() {
    this.stopAll();
    this.sprites = this.sprites.filter((s) => !s.clone); // the green flag removes clones, like Scratch
    this.stopped = false;
    this.timerStart = this.frame;
    this.startHats((h) => h.type === 'flag');
  }
  stopAll() {
    this.threads = [];
    this.asking = null;
    this.glide.clear();
    for (const s of this.sprites) s.say = '';
    this.stopped = true;
  }
  /** The learner typed an answer to an “ask and wait” question. */
  answerAsk(text: string) {
    this.answer = String(text).slice(0, 80);
    const last = this.events.asked[this.events.asked.length - 1];
    if (last && last.answer === undefined) last.answer = this.answer;
    this.asking = null;
  }
  keyDown(key: Key) {
    if (!this.keys.has(key)) this.startHats((h) => h.type === 'key' && (h.key === key || h.key === 'any'));
    this.keys.add(key);
  }
  keyUp(key: Key) {
    this.keys.delete(key);
  }
  click(sprite: number) {
    this.startHats((h) => h.type === 'click', sprite);
  }
  broadcast(msg: string) {
    this.events.broadcasts.push({ t: this.time, msg });
    this.startHats((h) => h.type === 'receive' && h.msg === msg, undefined, true);
  }
  private startHats(match: (h: Hat) => boolean, only?: number, restart = false) {
    this.sprites.forEach((st, si) => {
      if (only !== undefined && only !== si) return;
      if (st.deleted) return;
      const d = this.project.sprites[st.def];
      if (!d) return;
      for (const sc of d.scripts) {
        if (!match(sc.hat)) continue;
        const existing = this.threads.find((t) => t.script === sc && t.sprite === si && !t.done);
        if (existing && !restart) continue; // Scratch ignores a key/click hat that is still running
        if (existing) existing.done = true;
        if (this.threads.filter((t) => !t.done).length >= 300) return;
        this.threads.push({ sprite: si, script: sc, gen: this.run(si, sc.blocks, 0), done: false });
      }
    });
  }

  /** Advance one frame (1/30 s). */
  step() {
    this.frame++;
    for (const [si, g] of this.glide) {
      const s = this.sprites[si];
      const p = Math.min(1, (this.frame - g.start) / g.frames);
      this.moveTo(s, g.from[0] + (g.to[0] - g.from[0]) * p, g.from[1] + (g.to[1] - g.from[1]) * p);
      if (p >= 1) this.glide.delete(si);
    }
    for (const t of [...this.threads]) {
      if (t.done) continue;
      if (this.sprites[t.sprite]?.deleted) {
        t.done = true;
        continue;
      }
      const r = t.gen.next();
      if (r.done) t.done = true;
    }
    this.threads = this.threads.filter((t) => !t.done);
  }

  snapshot(): Snapshot {
    return { t: this.time, sprites: this.sprites.map((s) => ({ name: s.name, x: s.x, y: s.y, dir: s.dir, size: s.size, visible: s.visible, costume: s.costume, say: s.say })), vars: { ...this.vars } };
  }

  // ── Evaluation ──────────────────────────────────────────
  val(v: Val | undefined, si: number, P: Record<string, number | string> = {}): number | string {
    if (!v) return 0;
    const s = this.sprites[si];
    switch (v.k) {
      case 'num':
        return num(v.v);
      case 'str':
        return String(v.v).slice(0, 200);
      case 'var':
        return this.vars[v.name] ?? 0;
      case 'rep':
        return v.r === 'x' ? Math.round(s.x) : v.r === 'y' ? Math.round(s.y) : v.r === 'dir' ? s.dir : v.r === 'size' ? Math.round(s.size) : v.r === 'costume' ? s.costume + 1 : v.r === 'answer' ? this.answer : Math.round(((this.frame - this.timerStart) / FPS) * 10) / 10;
      case 'rand': {
        const a = num(this.val(v.a, si, P));
        const b = num(this.val(v.b, si, P));
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        if (Number.isInteger(lo) && Number.isInteger(hi)) return lo + Math.floor(this.rand() * (hi - lo + 1));
        return lo + this.rand() * (hi - lo);
      }
      case 'op': {
        const a = num(this.val(v.a, si, P));
        const b = num(this.val(v.b, si, P));
        return v.op === '+' ? a + b : v.op === '-' ? a - b : v.op === '*' ? a * b : v.op === '%' ? (b === 0 ? 0 : ((a % b) + b) % b) : b === 0 ? 0 : a / b;
      }
      case 'join':
        return `${this.val(v.a, si, P)}${this.val(v.b, si, P)}`.slice(0, 200);
      case 'item': {
        const l = this.lists[v.name] || [];
        const i = Math.round(num(this.val(v.a, si, P)));
        return l[i - 1] ?? '';
      }
      case 'length':
        return (this.lists[v.name] || []).length;
      case 'param':
        return P[v.name] ?? 0;
      case 'letter': {
        const str = String(this.val(v.b, si, P));
        const i = Math.round(num(this.val(v.a, si, P)));
        return [...str][i - 1] ?? '';
      }
      case 'strlen':
        return [...String(this.val(v.a, si, P))].length;
      case 'round':
        return Math.round(num(this.val(v.a, si, P)));
    }
  }
  bool(b: Bool | undefined, si: number, P: Record<string, number | string> = {}): boolean {
    if (!b) return false;
    const s = this.sprites[si];
    switch (b.k) {
      case 'touch': {
        if (!s.visible) return false;
        if (b.target === 'edge') return Math.abs(s.x) + radius(s) >= W || Math.abs(s.y) + radius(s) >= H;
        return this.sprites.some((o, oi) => oi !== si && o.visible && !o.deleted && o.name === b.target && Math.hypot(o.x - s.x, o.y - s.y) < radius(o) + radius(s) - 4);
      }
      case 'key':
        return b.key === 'any' ? this.keys.size > 0 : this.keys.has(b.key);
      case 'cmp': {
        const x = this.val(b.a, si, P);
        const y = this.val(b.b, si, P);
        const nx = Number(x);
        const ny = Number(y);
        const both = String(x).trim() !== '' && String(y).trim() !== '' && Number.isFinite(nx) && Number.isFinite(ny);
        if (b.op === '=') return both ? nx === ny : String(x).toLowerCase() === String(y).toLowerCase();
        return both ? (b.op === '<' ? nx < ny : nx > ny) : b.op === '<' ? String(x) < String(y) : String(x) > String(y);
      }
      case 'not':
        return !this.bool(b.a, si, P);
      case 'contains': {
        const want = String(this.val(b.a, si, P)).toLowerCase();
        return (this.lists[b.name] || []).some((x) => String(x).toLowerCase() === want);
      }
      case 'and':
        return this.bool(b.a, si, P) && this.bool(b.b, si, P);
      case 'or':
        return this.bool(b.a, si, P) || this.bool(b.b, si, P);
    }
  }

  private moveTo(s: SpriteState, x: number, y: number) {
    // Like Scratch, keep the sprite (mostly) on the stage.
    const nx = clampN(x, -W - 20, W + 20);
    const ny = clampN(y, -H - 20, H + 20);
    if (s.pen.down && (nx !== s.x || ny !== s.y) && this.pen.length < 5000) this.pen.push({ x1: s.x, y1: s.y, x2: nx, y2: ny, color: s.pen.color, size: s.pen.size });
    s.x = nx;
    s.y = ny;
  }

  private *run(si: number, blocks: Stmt[], depth: number, P: Record<string, number | string> = {}): Gen {
    if (depth > 16) return;
    const s = this.sprites[si];
    for (const b of blocks) {
      if (this.stopped) return;
      switch (b.op) {
        case 'move': {
          const n = num(this.val(b.a, si, P));
          const r = (s.dir * Math.PI) / 180;
          this.moveTo(s, s.x + n * Math.sin(r), s.y + n * Math.cos(r));
          break;
        }
        case 'turnR':
          s.dir = norm180(s.dir + num(this.val(b.a, si, P)));
          break;
        case 'turnL':
          s.dir = norm180(s.dir - num(this.val(b.a, si, P)));
          break;
        case 'goto':
          this.moveTo(s, num(this.val(b.a, si, P)), num(this.val(b.b, si, P)));
          break;
        case 'gotoRandom':
          this.moveTo(s, Math.round(this.rand() * 440 - 220), Math.round(this.rand() * 320 - 160));
          break;
        case 'glide': {
          const secs = clampN(num(this.val(b.a, si, P)), 0, 60);
          const to: [number, number] = [num(this.val(b.b, si, P)), num(this.val(b.c, si, P))];
          const frames = Math.max(1, Math.round(secs * FPS));
          this.glide.set(si, { from: [s.x, s.y], to, start: this.frame, frames });
          for (let f = 0; f < frames; f++) yield;
          this.moveTo(s, to[0], to[1]);
          break;
        }
        case 'changeX':
          this.moveTo(s, s.x + num(this.val(b.a, si, P)), s.y);
          break;
        case 'setX':
          this.moveTo(s, num(this.val(b.a, si, P)), s.y);
          break;
        case 'changeY':
          this.moveTo(s, s.x, s.y + num(this.val(b.a, si, P)));
          break;
        case 'setY':
          this.moveTo(s, s.x, num(this.val(b.a, si, P)));
          break;
        case 'point':
          s.dir = norm180(num(this.val(b.a, si, P)));
          break;
        case 'bounce': {
          const r = radius(s);
          if (Math.abs(s.x) + r >= W) {
            s.dir = norm180(-s.dir);
            s.x = clampN(s.x, -W + r, W - r);
          }
          if (Math.abs(s.y) + r >= H) {
            s.dir = norm180(180 - s.dir);
            s.y = clampN(s.y, -H + r, H - r);
          }
          break;
        }
        case 'say':
          s.say = String(this.val(b.a, si, P)).slice(0, 80);
          if (s.say) this.events.said.push({ t: this.time, sprite: s.name, text: s.say });
          break;
        case 'sayFor': {
          s.say = String(this.val(b.a, si, P)).slice(0, 80);
          if (s.say) this.events.said.push({ t: this.time, sprite: s.name, text: s.say });
          const end = this.frame + Math.round(clampN(num(this.val(b.b, si, P)), 0, 60) * FPS);
          while (this.frame < end) yield;
          s.say = '';
          break;
        }
        case 'nextCostume':
          s.costume = (s.costume + 1) % s.costumes.length;
          this.events.costumeChanges[s.name] = (this.events.costumeChanges[s.name] || 0) + 1;
          break;
        case 'changeSize':
          s.size = clampN(s.size + num(this.val(b.a, si, P)), 5, 500);
          break;
        case 'setSize':
          s.size = clampN(num(this.val(b.a, si, P)), 5, 500);
          break;
        case 'changeEffect':
        case 'setEffect': {
          const k = b.name === 'ghost' ? 'ghost' : 'color';
          const n = num(this.val(b.a, si, P));
          s.effects[k] = b.op === 'setEffect' ? n : s.effects[k] + n;
          if (k === 'ghost') s.effects.ghost = clampN(s.effects.ghost, 0, 100);
          break;
        }
        case 'clearEffects':
          s.effects = { color: 0, ghost: 0 };
          break;
        case 'show':
          s.visible = true;
          break;
        case 'hide':
          s.visible = false;
          break;
        case 'sound':
          this.events.sounds.push({ t: this.time, name: b.name || 'pop' });
          break;
        case 'broadcast':
          this.broadcast(String(b.name || 'message1'));
          break;
        case 'wait': {
          const end = this.frame + Math.round(clampN(num(this.val(b.a, si, P)), 0, 60) * FPS);
          do yield;
          while (this.frame < end);
          break;
        }
        case 'repeat': {
          const n = clampN(Math.round(num(this.val(b.a, si, P))), 0, 1000);
          for (let i = 0; i < n; i++) {
            yield* this.run(si, b.body || [], depth + 1, P);
            yield;
          }
          break;
        }
        case 'forever':
          for (;;) {
            yield* this.run(si, b.body || [], depth + 1, P);
            yield;
            if (this.stopped) return;
          }
        case 'if':
          if (this.bool(b.cond, si, P)) yield* this.run(si, b.body || [], depth + 1, P);
          break;
        case 'ifElse':
          if (this.bool(b.cond, si, P)) yield* this.run(si, b.body || [], depth + 1, P);
          else yield* this.run(si, b.else || [], depth + 1, P);
          break;
        case 'waitUntil':
          while (!this.bool(b.cond, si, P)) yield;
          break;
        case 'until':
          while (!this.bool(b.cond, si, P)) {
            yield* this.run(si, b.body || [], depth + 1, P);
            yield;
          }
          break;
        case 'stopAll':
          this.stopAll();
          return;
        case 'ask': {
          const q = String(this.val(b.a, si, P)).slice(0, 80);
          while (this.asking) yield; // one question at a time
          this.asking = { sprite: si, question: q };
          s.say = q;
          this.events.asked.push({ t: this.time, sprite: s.name, question: q });
          if (this.answerQueue.length) {
            yield;
            this.answerAsk(this.answerQueue.shift()!);
          }
          while (this.asking && this.asking.sprite === si) yield;
          s.say = '';
          break;
        }
        case 'playNote': {
          const note = clampN(Math.round(num(this.val(b.a, si, P))), 0, 130);
          this.events.sounds.push({ t: this.time, name: `note:${note}` });
          const end = this.frame + Math.max(1, Math.round(clampN(num(this.val(b.b, si, P)), 0, 8) * 0.5 * FPS));
          do yield;
          while (this.frame < end);
          break;
        }
        case 'createClone': {
          if (this.sprites.filter((x) => x.clone && !x.deleted).length >= 100) break;
          const c: SpriteState = { ...s, say: '', effects: { ...s.effects }, pen: { ...s.pen, down: false }, clone: true, deleted: false };
          this.sprites.push(c);
          this.clonesMade++;
          this.startHats((h) => h.type === 'clone', this.sprites.length - 1);
          break;
        }
        case 'deleteClone':
          if (s.clone) {
            s.deleted = true;
            s.visible = false;
            return;
          }
          break;
        case 'listAdd':
          if (b.name && (this.lists[b.name] ||= []).length < 500) this.lists[b.name].push(this.val(b.a, si, P));
          break;
        case 'listReplace': {
          const l = this.lists[b.name || ''];
          const i = Math.round(num(this.val(b.a, si, P)));
          if (l && i >= 1 && i <= l.length) l[i - 1] = this.val(b.b, si, P);
          break;
        }
        case 'listInsert': {
          const l = (this.lists[b.name || ''] ||= []);
          const i = Math.round(num(this.val(b.b, si, P)));
          if (l.length < 500 && i >= 1 && i <= l.length + 1) l.splice(i - 1, 0, this.val(b.a, si, P));
          break;
        }
        case 'listDelete': {
          const l = this.lists[b.name || ''];
          const i = Math.round(num(this.val(b.a, si, P)));
          if (l && i >= 1 && i <= l.length) l.splice(i - 1, 1);
          break;
        }
        case 'listDeleteAll':
          if (b.name) this.lists[b.name] = [];
          break;
        case 'call': {
          const d = this.project.sprites[s.def];
          const def = d?.scripts.find((x) => x.hat.type === 'define' && x.hat.name === b.name);
          if (def && def.hat.type === 'define') yield* this.run(si, def.blocks, depth + 1, def.hat.param ? { [def.hat.param]: this.val(b.a, si, P) } : {});
          break;
        }
        case 'resetTimer':
          this.timerStart = this.frame;
          break;
        case 'setVar':
          if (b.name) this.vars[b.name] = this.val(b.a, si, P);
          break;
        case 'changeVar':
          if (b.name) this.vars[b.name] = num(this.vars[b.name]) + num(this.val(b.a, si, P));
          break;
        case 'penDown':
          s.pen.down = true;
          break;
        case 'penUp':
          s.pen.down = false;
          break;
        case 'eraseAll':
          this.pen = [];
          break;
        case 'setPenColor':
          s.pen.color = PEN_COLORS[b.name || 'blue'] || PEN_COLORS.blue;
          break;
        case 'setPenSize':
          s.pen.size = clampN(num(this.val(b.a, si, P)), 1, 30);
          break;
        case 'nextBackdrop':
          this.backdrop = (this.backdrop + 1) % BACKDROPS.length;
          break;
        case 'switchBackdrop':
          this.backdrop = Math.max(0, BACKDROPS.indexOf((b.name || 'plain') as any));
          break;
        case 'rotation':
          s.rotation = (ROTATIONS as readonly string[]).includes(b.name || '') ? (b.name as SpriteState['rotation']) : 'all around';
          break;
      }
    }
  }
}

const norm180 = (d: number) => {
  let x = ((((d + 180) % 360) + 360) % 360) - 180;
  if (x === -180) x = 180;
  return x;
};

// ── Validation (server safety) ─────────────────────────────
const STMT_OPS = new Set<StmtOp>(['move', 'turnR', 'turnL', 'goto', 'gotoRandom', 'glide', 'changeX', 'setX', 'changeY', 'setY', 'point', 'bounce', 'say', 'sayFor', 'nextCostume', 'changeSize', 'setSize', 'changeEffect', 'setEffect', 'clearEffects', 'show', 'hide', 'sound', 'broadcast', 'wait', 'repeat', 'forever', 'if', 'ifElse', 'waitUntil', 'until', 'stopAll', 'resetTimer', 'setVar', 'changeVar', 'penDown', 'penUp', 'eraseAll', 'setPenColor', 'setPenSize', 'nextBackdrop', 'switchBackdrop', 'rotation', 'ask', 'playNote', 'createClone', 'deleteClone', 'listAdd', 'listDelete', 'listDeleteAll', 'listReplace', 'listInsert', 'call']);
export const C_OPS = new Set<StmtOp>(['repeat', 'forever', 'if', 'ifElse', 'until']);
const name = (x: unknown, fallback: string) => String(x ?? fallback).replace(/[^\p{L}\p{N} _'-]/gu, '').slice(0, 24) || fallback;

function cleanVal(v: any, d: number): Val {
  if (d > 8 || !v || typeof v !== 'object') return { k: 'num', v: 0 };
  switch (v.k) {
    case 'num':
      return { k: 'num', v: clampN(num(v.v), -1e6, 1e6) };
    case 'str':
      return { k: 'str', v: String(v.v ?? '').slice(0, 80) };
    case 'var':
      return { k: 'var', name: name(v.name, 'score') };
    case 'rep':
      return { k: 'rep', r: ['x', 'y', 'dir', 'size', 'timer', 'costume', 'answer'].includes(v.r) ? v.r : 'x' };
    case 'rand':
      return { k: 'rand', a: cleanVal(v.a, d + 1), b: cleanVal(v.b, d + 1) };
    case 'op':
      return { k: 'op', op: ['+', '-', '*', '/', '%'].includes(v.op) ? v.op : '+', a: cleanVal(v.a, d + 1), b: cleanVal(v.b, d + 1) };
    case 'join':
      return { k: 'join', a: cleanVal(v.a, d + 1), b: cleanVal(v.b, d + 1) };
    case 'item':
      return { k: 'item', name: name(v.name, 'list'), a: cleanVal(v.a, d + 1) };
    case 'length':
      return { k: 'length', name: name(v.name, 'list') };
    case 'param':
      return { k: 'param', name: name(v.name, 'n') };
    case 'letter':
      return { k: 'letter', a: cleanVal(v.a, d + 1), b: cleanVal(v.b, d + 1) };
    case 'strlen':
      return { k: 'strlen', a: cleanVal(v.a, d + 1) };
    case 'round':
      return { k: 'round', a: cleanVal(v.a, d + 1) };
    default:
      return { k: 'num', v: 0 };
  }
}
function cleanBool(b: any, d: number): Bool {
  if (d > 8 || !b || typeof b !== 'object') return { k: 'key', key: 'space' };
  switch (b.k) {
    case 'touch':
      return { k: 'touch', target: name(b.target, 'edge') };
    case 'key':
      return { k: 'key', key: name(b.key, 'space') };
    case 'cmp':
      return { k: 'cmp', op: ['<', '=', '>'].includes(b.op) ? b.op : '=', a: cleanVal(b.a, d + 1), b: cleanVal(b.b, d + 1) };
    case 'not':
      return { k: 'not', a: cleanBool(b.a, d + 1) };
    case 'and':
    case 'or':
      return { k: b.k, a: cleanBool(b.a, d + 1), b: cleanBool(b.b, d + 1) };
    case 'contains':
      return { k: 'contains', name: name(b.name, 'list'), a: cleanVal(b.a, d + 1) };
    default:
      return { k: 'key', key: 'space' };
  }
}

/** Sanitises an untrusted project (size limits, known ops only). Throws a readable error. */
export function checkProject(p: any): Project {
  if (!p || typeof p !== 'object' || !Array.isArray(p.sprites)) throw new Error('Project is missing.');
  if (JSON.stringify(p).length > 200_000) throw new Error('This project is too big.');
  if (p.sprites.length < 1 || p.sprites.length > 10) throw new Error('Use 1 to 10 sprites.');
  let count = 0;
  const cleanStmts = (list: any, depth: number): Stmt[] => {
    if (!Array.isArray(list)) return [];
    if (depth > 10) throw new Error('Too many blocks inside blocks.');
    return list.map((b: any) => {
      if (!b || !STMT_OPS.has(b.op)) throw new Error('Unknown block.');
      if (++count > 600) throw new Error('This project has too many blocks.');
      const out: Stmt = { op: b.op };
      if (b.a !== undefined) out.a = cleanVal(b.a, 0);
      if (b.b !== undefined) out.b = cleanVal(b.b, 0);
      if (b.c !== undefined) out.c = cleanVal(b.c, 0);
      if (b.name !== undefined) out.name = name(b.name, 'message1');
      if (b.cond !== undefined) out.cond = cleanBool(b.cond, 0);
      if (C_OPS.has(b.op)) out.body = cleanStmts(b.body, depth + 1);
      if (b.op === 'ifElse') out.else = cleanStmts(b.else, depth + 1);
      return out;
    });
  };
  const hat = (h: any): Hat => {
    if (h?.type === 'key') return { type: 'key', key: name(h.key, 'space') };
    if (h?.type === 'click') return { type: 'click' };
    if (h?.type === 'receive') return { type: 'receive', msg: name(h.msg, 'message1') };
    if (h?.type === 'clone') return { type: 'clone' };
    if (h?.type === 'define') return { type: 'define', name: name(h.name, 'my block'), ...(h.param ? { param: name(h.param, 'n') } : {}) };
    return { type: 'flag' };
  };
  return {
    backdrop: name(p.backdrop, 'plain'),
    vars: (Array.isArray(p.vars) ? p.vars : []).slice(0, 10).map((v: any) => name(v, 'score')),
    lists: (Array.isArray(p.lists) ? p.lists : []).slice(0, 5).map((v: any) => name(v, 'list')),
    sprites: p.sprites.map((s: any) => ({
      name: name(s.name, 'Sprite'),
      costumes: (Array.isArray(s.costumes) ? s.costumes : ['🤖']).slice(0, 8).map((c: any) => String(c).slice(0, 4)),
      color: typeof s.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(s.color) ? s.color : undefined,
      x: clampN(num(s.x), -W, W),
      y: clampN(num(s.y), -H, H),
      dir: norm180(num(s.dir ?? 90)),
      size: clampN(num(s.size ?? 100), 5, 500),
      visible: s.visible !== false,
      scripts: (Array.isArray(s.scripts) ? s.scripts : []).slice(0, 40).map((sc: any) => ({ hat: hat(sc?.hat), blocks: cleanStmts(sc?.blocks, 0) })),
    })),
  };
}

// ── Challenge checks ───────────────────────────────────────
export interface TestPlan {
  seconds: number;
  flag?: boolean; // press the green flag at the start (default true)
  keys?: { at: number; key: Key; hold?: number }[];
  answers?: string[]; // typed in reply to “ask and wait”, in order
  clicks?: { at: number; sprite: string }[];
}

export type Check =
  | { t: 'uses'; ops: StmtOp[]; msg: string } // every op in the list must appear
  | { t: 'usesAny'; ops: StmtOp[]; msg: string }
  | { t: 'hat'; hat: Hat['type']; key?: Key; msg: string }
  | { t: 'final'; sprite?: string; prop: 'x' | 'y' | 'dir' | 'size' | 'visible'; cmp: '<' | '>' | '=' | '~'; value: number | boolean; tol?: number; msg: string }
  | { t: 'said'; sprite?: string; text?: string; msg: string }
  | { t: 'var'; name: string; cmp: '<' | '>' | '=' | '~'; value: number; msg: string }
  | { t: 'pen'; minLines?: number; closed?: boolean; sides?: number; minLength?: number; msg: string }
  | { t: 'moved'; sprite?: string; min: number; msg: string }
  | { t: 'keyMoves'; key: Key; sprite?: string; prop: 'x' | 'y'; sign: 1 | -1; msg: string } // key in plan; compares before/after
  | { t: 'costumes'; sprite?: string; min: number; msg: string }
  | { t: 'clickReacts'; sprite: string; msg: string } // sprite looks different within 1 s after a planned click
  | { t: 'broadcast'; msg: string; message?: string }
  | { t: 'sound'; msg: string }
  | { t: 'returnsOnFlag'; sprite?: string; props?: ('pos' | 'size' | 'dir' | 'effects')[]; msg: string } // a second green flag puts the sprite back
  | { t: 'maxBlocks'; n: number; msg: string }
  | { t: 'sayOrder'; texts: string[]; msg: string } // said these, in this order
  | { t: 'sprites'; min: number; msg: string }
  | { t: 'eachHas'; hat: Hat['type']; msg: string } // every sprite has a script with this hat
  | { t: 'varChanged'; name: string; msg: string }
  | { t: 'usesRandom'; msg: string }
  | { t: 'asked'; min?: number; msg: string }
  | { t: 'nested'; msg: string } // a loop inside a loop
  | { t: 'clonesMade'; min: number; msg: string }
  | { t: 'listLength'; name: string; cmp: '<' | '>' | '=' | '~'; value: number; msg: string }
  | { t: 'listIs'; name: string; values: (number | string)[]; msg: string } // list holds exactly these values, in order
  | { t: 'defines'; msg: string } // a My Block is defined AND used
  | { t: 'recursive'; msg: string } // a My Block calls itself
  | { t: 'backdrop'; name: string; msg: string } // backdrop showing at the end
  | { t: 'withAnswers'; answers: string[]; check: Check; msg: string } // re-run with these typed answers, then apply the check
  | { t: 'usesValue'; kind: 'op' | 'join' | 'rand' | 'answer' | 'var' | 'item' | 'length' | 'param' | 'letter' | 'strlen' | 'round'; msg: string }
  | { t: 'keySound'; key: Key; msg: string } // pressing the key (in the plan) plays a sound or note
  | { t: 'notes'; min: number; msg: string }
  | { t: 'varResets'; name: string; value: number; msg: string } // the green flag sets the variable back
  | { t: 'hatAny'; hats: Hat['type'][]; msg: string }
  | { t: 'usesVar'; name: string; msg: string }; // the variable is read somewhere (e.g. in an if)

export interface CheckResult {
  passed: boolean[];
  messages: string[]; // messages of failed checks, in order
  ratio: number;
}

export function countStmts(list: Stmt[]): number {
  return list.reduce((n, b) => n + 1 + countStmts(b.body || []) + countStmts(b.else || []), 0);
}
function opsUsed(p: Project) {
  const out = new Set<StmtOp>();
  const walk = (l: Stmt[]) => l.forEach((b) => (out.add(b.op), walk(b.body || []), walk(b.else || [])));
  p.sprites.forEach((s) => s.scripts.forEach((sc) => walk(sc.blocks)));
  return out;
}

/** Run the project headlessly with the test plan and record what happened. */
export function simulate(project: Project, plan: TestPlan, seed = 7) {
  const vm = new VM(project, seed);
  const start = vm.snapshot();
  const trace: Snapshot[] = [];
  const total = Math.round(clampN(plan.seconds, 0.5, 30) * FPS);
  const keyEvents = (plan.keys || []).flatMap((k) => [
    { f: Math.round(k.at * FPS), down: true, key: k.key },
    { f: Math.round((k.at + (k.hold ?? 0.3)) * FPS), down: false, key: k.key },
  ]);
  const clicks = (plan.clicks || []).map((c) => ({ f: Math.round(c.at * FPS), si: project.sprites.findIndex((s) => s.name === c.sprite) }));
  vm.answerQueue = [...(plan.answers || [])];
  if (plan.flag !== false) vm.greenFlag();
  trace.push(vm.snapshot());
  for (let f = 1; f <= total; f++) {
    for (const k of keyEvents) if (k.f === f) (k.down ? vm.keyDown(k.key) : vm.keyUp(k.key));
    for (const c of clicks) if (c.f === f && c.si >= 0) vm.click(c.si);
    vm.step();
    trace.push(vm.snapshot());
  }
  return { vm, start, trace };
}

export function runChecks(project: Project, plan: TestPlan, checks: Check[]): CheckResult {
  const { vm, start, trace } = simulate(project, plan);
  const end = trace[trace.length - 1];
  const sp = (snap: Snapshot, name?: string) => (name ? snap.sprites.find((s) => s.name === name) : snap.sprites[0]);
  const used = opsUsed(project);
  const at = (t: number) => trace[Math.min(trace.length - 1, Math.max(0, Math.round(t * FPS)))];
  const cmp = (a: number, op: string, b: number, tol = 8) => (op === '<' ? a < b : op === '>' ? a > b : op === '=' ? a === b : Math.abs(a - b) <= tol);

  const passed = checks.map((c) => {
    switch (c.t) {
      case 'uses':
        return c.ops.every((o) => used.has(o));
      case 'usesAny':
        return c.ops.some((o) => used.has(o));
      case 'hat':
        return project.sprites.some((s) => s.scripts.some((sc) => sc.hat.type === c.hat && (!c.key || (sc.hat.type === 'key' && sc.hat.key === c.key)) && sc.blocks.length > 0));
      case 'final': {
        const s = sp(end, c.sprite);
        if (!s) return false;
        if (c.prop === 'visible') return s.visible === c.value;
        return cmp((s as any)[c.prop], c.cmp, Number(c.value), c.tol);
      }
      case 'said':
        return vm.events.said.some((e) => (!c.sprite || e.sprite === c.sprite) && (!c.text || e.text.toLowerCase().includes(c.text.toLowerCase())));
      case 'var':
        return cmp(Number(end.vars[c.name] ?? NaN), c.cmp, c.value, 0.001);
      case 'pen': {
        const lines = vm.pen;
        if (c.minLines && lines.length < c.minLines) return false;
        const len = lines.reduce((n, l) => n + Math.hypot(l.x2 - l.x1, l.y2 - l.y1), 0);
        if (c.minLength && len < c.minLength) return false;
        if (c.closed) {
          if (!lines.length) return false;
          const a = lines[0];
          const z = lines[lines.length - 1];
          if (Math.hypot(z.x2 - a.x1, z.y2 - a.y1) > 6) return false;
        }
        if (c.sides) {
          // merge consecutive segments going the same way, then count the sides
          let sides = 0;
          let prev: number | null = null;
          for (const l of lines) {
            if (Math.hypot(l.x2 - l.x1, l.y2 - l.y1) < 0.5) continue;
            const ang = Math.round((Math.atan2(l.y2 - l.y1, l.x2 - l.x1) * 180) / Math.PI);
            if (prev === null || Math.abs(((ang - prev + 540) % 360) - 180) > 2) sides++;
            prev = ang;
          }
          if (sides !== c.sides) return false;
        }
        return lines.length > 0;
      }
      case 'moved': {
        const name = c.sprite || project.sprites[0].name;
        let d = 0;
        for (let i = 1; i < trace.length; i++) {
          const a = sp(trace[i - 1], name)!;
          const b = sp(trace[i], name)!;
          d += Math.hypot(b.x - a.x, b.y - a.y);
        }
        return d >= c.min;
      }
      case 'keyMoves': {
        const k = (plan.keys || []).find((x) => x.key === c.key);
        if (!k) return false;
        const before = sp(at(k.at - 0.05), c.sprite)!;
        const after = sp(at(k.at + (k.hold ?? 0.3) + 0.1), c.sprite)!;
        return (after[c.prop] - before[c.prop]) * c.sign > 0.5;
      }
      case 'costumes':
        return (vm.events.costumeChanges[c.sprite || project.sprites[0].name] || 0) >= c.min;
      case 'clickReacts': {
        const k = (plan.clicks || []).find((x) => x.sprite === c.sprite);
        if (!k) return false;
        const before = sp(at(k.at - 0.05), c.sprite)!;
        const frames = trace.slice(Math.round(k.at * FPS), Math.round((k.at + 1.5) * FPS));
        const sig = (s: any) => `${Math.round(s.x)},${Math.round(s.y)},${Math.round(s.dir)},${Math.round(s.size)},${s.visible},${s.costume},${s.say}`;
        const effectsChanged = vm.sprites.find((s) => s.name === c.sprite)?.effects.color !== 0;
        const soundAfter = vm.events.sounds.some((e) => e.t >= k.at && e.t <= k.at + 1.5);
        return effectsChanged || soundAfter || frames.some((f) => sig(sp(f, c.sprite)) !== sig(before));
      }
      case 'broadcast':
        return vm.events.broadcasts.some((b) => !c.message || b.msg === c.message);
      case 'sound':
        return vm.events.sounds.length > 0;
      case 'returnsOnFlag': {
        // Mess the sprite up, press the green flag again: a reset script should put it back.
        const v2 = new VM(project);
        const i = Math.max(0, v2.sprites.findIndex((x) => !c.sprite || x.name === c.sprite));
        const first = v2.snapshot().sprites[i];
        const m = v2.sprites[i];
        m.x += 57;
        m.y -= 33;
        m.dir = norm180(m.dir + 40);
        m.size += 40;
        m.effects.color = 50;
        v2.greenFlag();
        for (let f = 0; f < 8; f++) v2.step();
        const r = v2.sprites[i];
        const props = c.props || ['pos'];
        return props.every((p) => (p === 'pos' ? Math.hypot(r.x - first.x, r.y - first.y) < 3 : p === 'size' ? Math.abs(r.size - first.size) < 1 : p === 'dir' ? Math.abs(r.dir - first.dir) < 1 : r.effects.color === 0));
      }
      case 'sayOrder': {
        let from = 0;
        for (const want of c.texts) {
          const i = vm.events.said.findIndex((e, k) => k >= from && e.text.toLowerCase().includes(want.toLowerCase()));
          if (i < 0) return false;
          from = i + 1;
        }
        return true;
      }
      case 'sprites':
        return project.sprites.length >= c.min;
      case 'eachHas':
        return project.sprites.every((s) => s.scripts.some((sc) => sc.hat.type === c.hat && sc.blocks.length > 0));
      case 'clonesMade':
        return vm.clonesMade >= c.min;
      case 'listLength':
        return cmp((vm.lists[c.name] || []).length, c.cmp, c.value, 0.001);
      case 'listIs': {
        const l = vm.lists[c.name] || [];
        return l.length === c.values.length && l.every((x, i) => String(x).toLowerCase() === String(c.values[i]).toLowerCase());
      }
      case 'recursive': {
        const callsSelf = (list: Stmt[], nm: string): boolean => list.some((b) => (b.op === 'call' && b.name === nm) || callsSelf(b.body || [], nm) || callsSelf(b.else || [], nm));
        return project.sprites.some((sp2) => sp2.scripts.some((sc) => sc.hat.type === 'define' && callsSelf(sc.blocks, sc.hat.name)));
      }
      case 'defines':
        return project.sprites.some((s) => s.scripts.some((sc) => sc.hat.type === 'define' && sc.blocks.length > 0)) && used.has('call');
      case 'backdrop':
        return BACKDROPS[vm.backdrop] === c.name;
      case 'nested': {
        const loops = new Set<StmtOp>(['repeat', 'forever', 'until']);
        const walk = (l: Stmt[], inLoop: boolean): boolean => l.some((b) => (loops.has(b.op) && inLoop) || walk(b.body || [], inLoop || loops.has(b.op)) || walk(b.else || [], inLoop));
        return project.sprites.some((s) => s.scripts.some((sc) => walk(sc.blocks, false)));
      }
      case 'withAnswers': {
        const r = runChecks(project, { ...plan, answers: c.answers }, [c.check]);
        return r.ratio === 1;
      }
      case 'usesValue': {
        let found = false;
        const val = (v?: Val): void => {
          if (!v || found) return;
          if ((c.kind === 'answer' && v.k === 'rep' && v.r === 'answer') || v.k === c.kind) found = true;
          if (v.k === 'rand' || v.k === 'op' || v.k === 'join') (val(v.a), val(v.b));
          else if (v.k === 'item' || v.k === 'strlen' || v.k === 'round') val(v.a);
          else if (v.k === 'letter') (val(v.a), val(v.b));
        };
        const bl = (b?: Bool): void => {
          if (!b) return;
          if (b.k === 'cmp') (val(b.a), val(b.b));
          else if (b.k === 'not') bl(b.a);
          else if (b.k === 'and' || b.k === 'or') (bl(b.a), bl(b.b));
        };
        const walk = (l: Stmt[]) => l.forEach((b) => (val(b.a), val(b.b), val(b.c), bl(b.cond), walk(b.body || []), walk(b.else || [])));
        project.sprites.forEach((s) => s.scripts.forEach((sc) => walk(sc.blocks)));
        return found;
      }
      case 'keySound': {
        const k = (plan.keys || []).find((x) => x.key === c.key);
        return !!k && vm.events.sounds.some((e) => e.t >= k.at - 0.01 && e.t <= k.at + 0.6);
      }
      case 'asked':
        return vm.events.asked.length >= (c.min ?? 1);
      case 'notes':
        return vm.events.sounds.filter((e) => e.name.startsWith('note:')).length >= c.min;
      case 'usesRandom':
      case 'usesVar': {
        let found = c.t === 'usesRandom' && used.has('gotoRandom');
        const val = (v?: Val): void => {
          if (!v || found) return;
          if (c.t === 'usesRandom' ? v.k === 'rand' : v.k === 'var' && v.name === c.name) found = true;
          if (v.k === 'rand' || v.k === 'op' || v.k === 'join') (val(v.a), val(v.b));
          else if (v.k === 'item' || v.k === 'strlen' || v.k === 'round') val(v.a);
          else if (v.k === 'letter') (val(v.a), val(v.b));
        };
        const bl = (b?: Bool): void => {
          if (!b) return;
          if (b.k === 'cmp') (val(b.a), val(b.b));
          else if (b.k === 'not') bl(b.a);
          else if (b.k === 'and' || b.k === 'or') (bl(b.a), bl(b.b));
        };
        const walk = (l: Stmt[]) => l.forEach((b) => (val(b.a), val(b.b), val(b.c), bl(b.cond), walk(b.body || []), walk(b.else || [])));
        project.sprites.forEach((s) => s.scripts.forEach((sc) => walk(sc.blocks)));
        return found;
      }
      case 'varResets': {
        const v2 = new VM(project);
        v2.vars[c.name] = 99;
        v2.greenFlag();
        for (let f = 0; f < 4; f++) v2.step();
        return Number(v2.vars[c.name]) === c.value;
      }
      case 'hatAny':
        return project.sprites.some((s) => s.scripts.some((sc) => c.hats.includes(sc.hat.type) && sc.blocks.length > 0));
      case 'varChanged':
        return trace.some((f) => f.vars[c.name] !== trace[0].vars[c.name]);
      case 'maxBlocks':
        return project.sprites.reduce((n, s) => n + s.scripts.reduce((m, sc) => m + countStmts(sc.blocks), 0), 0) <= c.n;
    }
  });
  return { passed, messages: checks.filter((_, i) => !passed[i]).map((c) => c.msg), ratio: checks.length ? passed.filter(Boolean).length / checks.length : 1 };
}

// ── Scratch-block text for a Code Lab project (renderer syntax), for PDFs and answer keys ──
export function valText(v?: Val): string {
  if (!v) return '()';
  switch (v.k) {
    case 'num':
      return `(${v.v})`;
    case 'str':
      return `[${v.v}]`;
    case 'var':
      return `(${v.name})`;
    case 'rep':
      return `(${{ x: 'x position', y: 'y position', dir: 'direction', size: 'size', timer: 'timer', costume: 'costume number', answer: 'answer' }[v.r]})`;
    case 'rand':
      return `(pick random ${valText(v.a)} to ${valText(v.b)})`;
    case 'op':
      return `(${valText(v.a)} ${v.op} ${valText(v.b)})`;
    case 'join':
      return `(join ${valText(v.a)} ${valText(v.b)})`;
    case 'item':
      return `(item ${valText(v.a)} of [${v.name} v] :: lists)`;
    case 'length':
      return `(length of [${v.name} v] :: lists)`;
    case 'param':
      return `(${v.name} :: myblocks)`;
    case 'letter':
      return `(letter ${valText(v.a)} of ${valText(v.b)} :: operators)`;
    case 'strlen':
      return `(length of ${valText(v.a)} :: operators)`;
    case 'round':
      return `(round ${valText(v.a)} :: operators)`;
  }
}
export function boolText(b?: Bool): string {
  if (!b) return '<>';
  switch (b.k) {
    case 'touch':
      return `<touching (${b.target} v)?>`;
    case 'key':
      return `<key (${b.key} v) pressed?>`;
    case 'cmp':
      return `<${valText(b.a)} ${b.op} ${valText(b.b)}>`;
    case 'not':
      return `<not ${boolText(b.a)}>`;
    case 'and':
    case 'or':
      return `<${boolText(b.a)} ${b.k} ${boolText(b.b)}>`;
    case 'contains':
      return `<[${b.name} v] contains ${valText(b.a)}? :: variables>`;
  }
}
export function stmtLines(list: Stmt[], ind = ''): string[] {
  const out: string[] = [];
  for (const b of list) {
    const a = valText(b.a);
    switch (b.op) {
      case 'move': out.push(`${ind}move ${a} steps`); break;
      case 'turnR': out.push(`${ind}turn cw ${a} degrees`); break;
      case 'turnL': out.push(`${ind}turn ccw ${a} degrees`); break;
      case 'goto': out.push(`${ind}go to x: ${a} y: ${valText(b.b)}`); break;
      case 'gotoRandom': out.push(`${ind}go to (random position v)`); break;
      case 'glide': out.push(`${ind}glide ${a} secs to x: ${valText(b.b)} y: ${valText(b.c)}`); break;
      case 'changeX': out.push(`${ind}change x by ${a}`); break;
      case 'setX': out.push(`${ind}set x to ${a}`); break;
      case 'changeY': out.push(`${ind}change y by ${a}`); break;
      case 'setY': out.push(`${ind}set y to ${a}`); break;
      case 'point': out.push(`${ind}point in direction ${a}`); break;
      case 'bounce': out.push(`${ind}if on edge, bounce`); break;
      case 'rotation': out.push(`${ind}set rotation style [${b.name} v]`); break;
      case 'say': out.push(`${ind}say ${a}`); break;
      case 'sayFor': out.push(`${ind}say ${a} for ${valText(b.b)} seconds`); break;
      case 'nextCostume': out.push(`${ind}next costume`); break;
      case 'nextBackdrop': out.push(`${ind}next backdrop`); break;
      case 'switchBackdrop': out.push(`${ind}switch backdrop to (${b.name} v)`); break;
      case 'changeSize': out.push(`${ind}change size by ${a}`); break;
      case 'setSize': out.push(`${ind}set size to ${a} %`); break;
      case 'changeEffect': out.push(`${ind}change [${b.name} v] effect by ${a}`); break;
      case 'setEffect': out.push(`${ind}set [${b.name} v] effect to ${a}`); break;
      case 'clearEffects': out.push(`${ind}clear graphic effects`); break;
      case 'show': out.push(`${ind}show`); break;
      case 'hide': out.push(`${ind}hide`); break;
      case 'sound': out.push(`${ind}start sound (${b.name} v)`); break;
      case 'broadcast': out.push(`${ind}broadcast (${b.name} v)`); break;
      case 'wait': out.push(`${ind}wait ${a} seconds`); break;
      case 'repeat': out.push(`${ind}repeat ${a}`, ...stmtLines(b.body || [], ind + '  '), `${ind}end`); break;
      case 'forever': out.push(`${ind}forever`, ...stmtLines(b.body || [], ind + '  '), `${ind}end`); break;
      case 'if': out.push(`${ind}if ${boolText(b.cond)} then`, ...stmtLines(b.body || [], ind + '  '), `${ind}end`); break;
      case 'ifElse': out.push(`${ind}if ${boolText(b.cond)} then`, ...stmtLines(b.body || [], ind + '  '), `${ind}else`, ...stmtLines(b.else || [], ind + '  '), `${ind}end`); break;
      case 'waitUntil': out.push(`${ind}wait until ${boolText(b.cond)}`); break;
      case 'until': out.push(`${ind}repeat until ${boolText(b.cond)}`, ...stmtLines(b.body || [], ind + '  '), `${ind}end`); break;
      case 'stopAll': out.push(`${ind}stop [all v]`); break;
      case 'resetTimer': out.push(`${ind}reset timer`); break;
      case 'ask': out.push(`${ind}ask ${a} and wait`); break;
      case 'playNote': out.push(`${ind}play note ${a} for ${valText(b.b)} beats`); break;
      case 'createClone': out.push(`${ind}create clone of (myself v)`); break;
      case 'deleteClone': out.push(`${ind}delete this clone`); break;
      case 'listAdd': out.push(`${ind}add ${a} to [${b.name} v]`); break;
      case 'listDelete': out.push(`${ind}delete ${a} of [${b.name} v]`); break;
      case 'listDeleteAll': out.push(`${ind}delete all of [${b.name} v]`); break;
      case 'listReplace': out.push(`${ind}replace item ${a} of [${b.name} v] with ${valText(b.b)}`); break;
      case 'listInsert': out.push(`${ind}insert ${a} at ${valText(b.b)} of [${b.name} v]`); break;
      case 'call': out.push(`${ind}${b.name}${b.a ? ' ' + a : ''} :: myblocks`); break;
      case 'setVar': out.push(`${ind}set [${b.name} v] to ${a}`); break;
      case 'changeVar': out.push(`${ind}change [${b.name} v] by ${a}`); break;
      case 'penDown': out.push(`${ind}pen down`); break;
      case 'penUp': out.push(`${ind}pen up`); break;
      case 'eraseAll': out.push(`${ind}erase all`); break;
      case 'setPenColor': out.push(`${ind}set pen color to (${b.name} v)`); break;
      case 'setPenSize': out.push(`${ind}set pen size to ${a}`); break;
    }
  }
  return out;
}
export function hatText(h: Hat) {
  if (h.type === 'clone') return 'when I start as a clone';
  if (h.type === 'define') return `define ${h.name}${h.param ? ` (${h.param})` : ''}`;
  return h.type === 'flag' ? 'when green flag clicked' : h.type === 'key' ? `when [${h.key} v] key pressed` : h.type === 'click' ? 'when this sprite clicked' : `when I receive [${h.msg} v]`;
}
/** Each sprite's scripts as renderer text: [{ sprite, blocks }]. */
export function projectToBlocks(p: Project) {
  return p.sprites.filter((s) => s.scripts.length).map((s) => ({ sprite: s.name, blocks: s.scripts.map((sc) => [hatText(sc.hat), ...stmtLines(sc.blocks)].join('\n')).join('\n\n') }));
}
