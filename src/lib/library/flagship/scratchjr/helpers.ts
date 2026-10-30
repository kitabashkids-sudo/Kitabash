// Helpers for the ScratchJr (K–2) flagship courses: picture-block robot puzzles.
import type { Cell, Node, Program, World } from '../../../scratch/puzzle.ts';
import { wallsExcept } from '../scratch-3-5/helpers.ts';

export const R = (n = 1): Node => ({ op: 'right', n });
export const Lf = (n = 1): Node => ({ op: 'left', n });
export const U = (n = 1): Node => ({ op: 'up', n });
export const D = (n = 1): Node => ({ op: 'down', n });
export const pick: Node = { op: 'pick' };
export const say = (text: string): Node => ({ op: 'say', text });
export const rep = (n: number, ...body: Node[]): Node => ({ op: 'repeat', n, body });
export const flag = (...blocks: Node[]): Program => ({ hat: 'flag', blocks });
export const ARROWS = ['right', 'left', 'up', 'down'] as const;

/** A ScratchJr-style world: picture blocks, an emoji hero. `open` (if given) are the only walkable cells. */
export function jw(hero: string, cols: number, rows: number, start: [number, number], goal: Cell | null, extra: { open?: Cell[]; walls?: Cell[]; gems?: Cell[] } = {}): World {
  return {
    cols,
    rows,
    start: { x: start[0], y: start[1], dir: 'E' },
    goal,
    jr: true,
    hero,
    walls: extra.open ? wallsExcept(cols, rows, extra.open) : extra.walls,
    gems: extra.gems,
  };
}
export { wallsExcept };
