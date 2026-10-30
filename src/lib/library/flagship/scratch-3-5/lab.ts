// Helpers for writing Code Lab projects compactly in course content.
import type { Bool, Check, Hat, Project, Script, SpriteDef, Stmt, StmtOp, TestPlan, Val } from '../../../scratch/vm.ts';

export const n = (v: number): Val => ({ k: 'num', v });
export const t = (v: string): Val => ({ k: 'str', v });
export const vr = (name: string): Val => ({ k: 'var', name });
export const xpos: Val = { k: 'rep', r: 'x' };
export const ypos: Val = { k: 'rep', r: 'y' };
export const timer: Val = { k: 'rep', r: 'timer' };
export const answer: Val = { k: 'rep', r: 'answer' };
export const item = (list: string, i: number | Val): Val => ({ k: 'item', name: list, a: typeof i === 'number' ? n(i) : i });
export const lengthOf = (list: string): Val => ({ k: 'length', name: list });
export const param = (name: string): Val => ({ k: 'param', name });
export const contains = (list: string, x: string | Val): Bool => ({ k: 'contains', name: list, a: typeof x === 'string' ? t(x) : x });
export const and = (a: Bool, b: Bool): Bool => ({ k: 'and', a, b });
export const not = (a: Bool): Bool => ({ k: 'not', a });
export const or = (a: Bool, b: Bool): Bool => ({ k: 'or', a, b });
export const op = (o: '+' | '-' | '*' | '/' | '%', a: Val | number, b: Val | number): Val => ({ k: 'op', op: o, a: typeof a === 'number' ? n(a) : a, b: typeof b === 'number' ? n(b) : b });
export const rand = (a: number, b: number): Val => ({ k: 'rand', a: n(a), b: n(b) });
export const join = (a: Val, b: Val): Val => ({ k: 'join', a, b });

export const touching = (target: string): Bool => ({ k: 'touch', target });
export const keyIs = (key: string): Bool => ({ k: 'key', key });
export const gt = (a: Val, b: Val): Bool => ({ k: 'cmp', op: '>', a, b });
export const lt = (a: Val, b: Val): Bool => ({ k: 'cmp', op: '<', a, b });
export const eq = (a: Val, b: Val): Bool => ({ k: 'cmp', op: '=', a, b });

const v = (x: number | Val): Val => (typeof x === 'number' ? n(x) : x);
export const move = (s: number | Val): Stmt => ({ op: 'move', a: v(s) });
export const turnR = (d: number): Stmt => ({ op: 'turnR', a: n(d) });
export const turnL = (d: number): Stmt => ({ op: 'turnL', a: n(d) });
export const goto = (x: number | Val, y: number | Val): Stmt => ({ op: 'goto', a: v(x), b: v(y) });
export const glide = (s: number, x: number, y: number): Stmt => ({ op: 'glide', a: n(s), b: n(x), c: n(y) });
export const changeX = (d: number | Val): Stmt => ({ op: 'changeX', a: v(d) });
export const changeY = (d: number | Val): Stmt => ({ op: 'changeY', a: v(d) });
export const setX = (x: number | Val): Stmt => ({ op: 'setX', a: v(x) });
export const setY = (y: number | Val): Stmt => ({ op: 'setY', a: v(y) });
export const point = (d: number): Stmt => ({ op: 'point', a: n(d) });
export const bounce: Stmt = { op: 'bounce' };
export const rotation = (style: string): Stmt => ({ op: 'rotation', name: style });
export const say = (s: string | Val): Stmt => ({ op: 'say', a: typeof s === 'string' ? t(s) : s });
export const sayFor = (s: string | Val, secs: number): Stmt => ({ op: 'sayFor', a: typeof s === 'string' ? t(s) : s, b: n(secs) });
export const nextCostume: Stmt = { op: 'nextCostume' };
export const nextBackdrop: Stmt = { op: 'nextBackdrop' };
export const switchBackdrop = (b: string): Stmt => ({ op: 'switchBackdrop', name: b });
export const changeSize = (d: number): Stmt => ({ op: 'changeSize', a: n(d) });
export const setSize = (d: number): Stmt => ({ op: 'setSize', a: n(d) });
export const changeEffect = (e: string, d: number): Stmt => ({ op: 'changeEffect', name: e, a: n(d) });
export const setEffect = (e: string, d: number): Stmt => ({ op: 'setEffect', name: e, a: n(d) });
export const clearEffects: Stmt = { op: 'clearEffects' };
export const show: Stmt = { op: 'show' };
export const hide: Stmt = { op: 'hide' };
export const sound = (name: string): Stmt => ({ op: 'sound', name });
export const broadcast = (msg: string): Stmt => ({ op: 'broadcast', name: msg });
export const wait = (s: number): Stmt => ({ op: 'wait', a: n(s) });
export const repeat = (k: number, ...body: Stmt[]): Stmt => ({ op: 'repeat', a: n(k), body });
export const forever = (...body: Stmt[]): Stmt => ({ op: 'forever', body });
export const ifThen = (cond: Bool, ...body: Stmt[]): Stmt => ({ op: 'if', cond, body });
export const ifElse = (cond: Bool, body: Stmt[], els: Stmt[]): Stmt => ({ op: 'ifElse', cond, body, else: els });
export const waitUntil = (cond: Bool): Stmt => ({ op: 'waitUntil', cond });
export const until = (cond: Bool, ...body: Stmt[]): Stmt => ({ op: 'until', cond, body });
export const stopAll: Stmt = { op: 'stopAll' };
export const resetTimer: Stmt = { op: 'resetTimer' };
export const ask = (q: string | Val): Stmt => ({ op: 'ask', a: typeof q === 'string' ? t(q) : q });
export const createClone: Stmt = { op: 'createClone' };
export const deleteClone: Stmt = { op: 'deleteClone' };
export const listAdd = (list: string, x: string | number | Val): Stmt => ({ op: 'listAdd', name: list, a: typeof x === 'string' ? t(x) : typeof x === 'number' ? n(x) : x });
export const listDelete = (list: string, i: number): Stmt => ({ op: 'listDelete', name: list, a: n(i) });
export const listReplace = (list: string, i: number | Val, x: string | number | Val): Stmt => ({ op: 'listReplace', name: list, a: v(i), b: typeof x === 'string' ? t(x) : v(x) });
export const listInsert = (list: string, x: string | number | Val, i: number | Val): Stmt => ({ op: 'listInsert', name: list, a: typeof x === 'string' ? t(x) : v(x), b: v(i) });
export const listDeleteAll = (list: string): Stmt => ({ op: 'listDeleteAll', name: list });
export const call = (name: string, x?: number | Val): Stmt => ({ op: 'call', name, ...(x !== undefined ? { a: typeof x === 'number' ? n(x) : x } : {}) });
export const playNote = (note: number | Val, beats = 0.5): Stmt => ({ op: 'playNote', a: v(note), b: n(beats) });
export const setVar = (name: string, x: number | Val): Stmt => ({ op: 'setVar', name, a: v(x) });
export const changeVar = (name: string, x: number | Val): Stmt => ({ op: 'changeVar', name, a: v(x) });
export const penDown: Stmt = { op: 'penDown' };
export const penUp: Stmt = { op: 'penUp' };
export const eraseAll: Stmt = { op: 'eraseAll' };
export const penColor = (c: string): Stmt => ({ op: 'setPenColor', name: c });

export const onFlag = (...blocks: Stmt[]): Script => ({ hat: { type: 'flag' }, blocks });
export const onKey = (key: string, ...blocks: Stmt[]): Script => ({ hat: { type: 'key', key }, blocks });
export const onClick = (...blocks: Stmt[]): Script => ({ hat: { type: 'click' }, blocks });
export const onReceive = (msg: string, ...blocks: Stmt[]): Script => ({ hat: { type: 'receive', msg }, blocks });
export const onClone = (...blocks: Stmt[]): Script => ({ hat: { type: 'clone' }, blocks });
export const define = (name: string, paramName: string | undefined, ...blocks: Stmt[]): Script => ({ hat: { type: 'define', name, ...(paramName ? { param: paramName } : {}) }, blocks });

export const sprite = (name: string, costumes: string[], x: number, y: number, scripts: Script[] = [], extra: Partial<SpriteDef> = {}): SpriteDef => ({ name, costumes, x, y, scripts, ...extra });
export const project = (sprites: SpriteDef[], extra: Partial<Project> = {}): Project => ({ sprites, ...extra });

/** A Code Lab activity in course content. Goals are shown to learners in the same order as the checks. */
export interface LabAct {
  lab: string; // what to build
  title: string;
  mode?: 'challenge' | 'project';
  start: Project;
  palette?: StmtOp[];
  hats?: Hat['type'][];
  allowSprites?: boolean;
  goals: [string, Check][];
  test: TestPlan;
  solution: Project;
  explain: string;
  hints: string[];
  reflection?: string;
  requirements?: string[];
  minWords?: number;
  phase?: 'perform' | 'probe';
  points?: number;
}

// Palettes that grow through the course.
export const P_SEQ: StmtOp[] = ['move', 'turnR', 'turnL', 'goto', 'point', 'sayFor', 'say', 'wait', 'changeSize', 'setSize'];
export const P_EVENTS: StmtOp[] = [...P_SEQ, 'changeX', 'changeY', 'setX', 'setY', 'glide', 'changeEffect', 'clearEffects', 'sound', 'show', 'hide'];
export const P_LOOPS: StmtOp[] = [...P_EVENTS, 'repeat', 'forever', 'nextCostume', 'bounce', 'rotation', 'nextBackdrop', 'switchBackdrop', 'penDown', 'penUp', 'eraseAll', 'setPenColor', 'setPenSize', 'setEffect'];
export const P_IF: StmtOp[] = [...P_LOOPS, 'if', 'ifElse', 'waitUntil', 'until', 'gotoRandom'];
export const P_ALL: StmtOp[] = [...P_IF, 'setVar', 'changeVar', 'broadcast', 'stopAll', 'resetTimer', 'ask', 'playNote'];
export const P_ADV: StmtOp[] = [...P_ALL, 'createClone', 'deleteClone', 'listAdd', 'listDelete', 'listDeleteAll', 'listReplace', 'listInsert', 'call'];
