import type { Node, Program, Cell, World } from '../../../scratch/puzzle.ts';

export const mv = (n = 1): Node => ({ op: 'move', n });
export const R: Node = { op: 'turnR' };
export const L: Node = { op: 'turnL' };
export const pd: Node = { op: 'penDown' };
export const pu: Node = { op: 'penUp' };
export const pick: Node = { op: 'pick' };
export const rep = (n: number, ...body: Node[]): Node => ({ op: 'repeat', n, body });
export const forever = (...body: Node[]): Node => ({ op: 'forever', body });
export const until = (cond: Node['cond'], ...body: Node[]): Node => ({ op: 'until', cond, body });
export const iff = (cond: Node['cond'], ...body: Node[]): Node => ({ op: 'if', cond, body });
export const ifElse = (cond: Node['cond'], body: Node[], els: Node[]): Node => ({ op: 'ifElse', cond, body, else: els });
export const goto = (x: number, y: number): Node => ({ op: 'goto', x, y });
export const cx = (n: number): Node => ({ op: 'changeX', n });
export const cy = (n: number): Node => ({ op: 'changeY', n });
export const setv = (v: string, n: number): Node => ({ op: 'setVar', v, n });
export const chv = (v: string, n: number): Node => ({ op: 'changeVar', v, n });
export const say = (text: string): Node => ({ op: 'say', text });
export const flag = (...blocks: Node[]): Program => ({ hat: 'flag', blocks });
export const keyHat = (...blocks: Node[]): Program => ({ hat: 'key', blocks });

/** Every cell of a cols×rows grid that is NOT in `open` becomes a wall. */
export function wallsExcept(cols: number, rows: number, open: Cell[]): Cell[] {
  const o = new Set(open.map((c) => c.join(',')));
  const out: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!o.has(`${c},${r}`)) out.push([c, r]);
  return out;
}

export const world = (w: World) => w;

/** Standard 4-level rubric labels used in every project brief. */
export const LEVELS = ['Beginning', 'Developing', 'Secure', 'Excellent'] as const;
