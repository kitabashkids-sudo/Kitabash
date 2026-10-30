// Block definitions for the Code Lab editor: label template, category, and the default block.
import type { Category } from '../../../lib/scratch/blocks.ts';
import type { Stmt, StmtOp, Val, Hat } from '../../../lib/scratch/vm.ts';

export type Part = string | { slot: 'a' | 'b' | 'c'; kind: 'num' | 'str' } | { name: 'var' | 'msg' | 'effect' | 'sound' | 'color' | 'backdrop' | 'rotation' | 'list' | 'proc' } | { cond: true };

export interface BlockDef {
  op: StmtOp;
  cat: Category;
  parts: Part[];
  make: () => Stmt;
  c?: boolean;
  e?: boolean;
}

const n = (v: number): Val => ({ k: 'num', v });
const s = (v: string): Val => ({ k: 'str', v });
const A = { slot: 'a', kind: 'num' } as const;
const B = { slot: 'b', kind: 'num' } as const;
const C = { slot: 'c', kind: 'num' } as const;
const AS = { slot: 'a', kind: 'str' } as const;

export const DEFS: BlockDef[] = [
  // Motion
  { op: 'move', cat: 'motion', parts: ['move', A, 'steps'], make: () => ({ op: 'move', a: n(10) }) },
  { op: 'turnR', cat: 'motion', parts: ['turn ↻', A, 'degrees'], make: () => ({ op: 'turnR', a: n(15) }) },
  { op: 'turnL', cat: 'motion', parts: ['turn ↺', A, 'degrees'], make: () => ({ op: 'turnL', a: n(15) }) },
  { op: 'goto', cat: 'motion', parts: ['go to x:', A, 'y:', B], make: () => ({ op: 'goto', a: n(0), b: n(0) }) },
  { op: 'gotoRandom', cat: 'motion', parts: ['go to random position'], make: () => ({ op: 'gotoRandom' }) },
  { op: 'glide', cat: 'motion', parts: ['glide', A, 'secs to x:', B, 'y:', C], make: () => ({ op: 'glide', a: n(1), b: n(0), c: n(0) }) },
  { op: 'changeX', cat: 'motion', parts: ['change x by', A], make: () => ({ op: 'changeX', a: n(10) }) },
  { op: 'setX', cat: 'motion', parts: ['set x to', A], make: () => ({ op: 'setX', a: n(0) }) },
  { op: 'changeY', cat: 'motion', parts: ['change y by', A], make: () => ({ op: 'changeY', a: n(10) }) },
  { op: 'setY', cat: 'motion', parts: ['set y to', A], make: () => ({ op: 'setY', a: n(0) }) },
  { op: 'point', cat: 'motion', parts: ['point in direction', A], make: () => ({ op: 'point', a: n(90) }) },
  { op: 'bounce', cat: 'motion', parts: ['if on edge, bounce'], make: () => ({ op: 'bounce' }) },
  { op: 'rotation', cat: 'motion', parts: ['set rotation style', { name: 'rotation' }], make: () => ({ op: 'rotation', name: 'left-right' }) },
  // Looks
  { op: 'sayFor', cat: 'looks', parts: ['say', AS, 'for', B, 'seconds'], make: () => ({ op: 'sayFor', a: s('Hello!'), b: n(2) }) },
  { op: 'say', cat: 'looks', parts: ['say', AS], make: () => ({ op: 'say', a: s('Hello!') }) },
  { op: 'nextCostume', cat: 'looks', parts: ['next costume'], make: () => ({ op: 'nextCostume' }) },
  { op: 'switchBackdrop', cat: 'looks', parts: ['switch backdrop to', { name: 'backdrop' }], make: () => ({ op: 'switchBackdrop', name: 'party' }) },
  { op: 'nextBackdrop', cat: 'looks', parts: ['next backdrop'], make: () => ({ op: 'nextBackdrop' }) },
  { op: 'changeSize', cat: 'looks', parts: ['change size by', A], make: () => ({ op: 'changeSize', a: n(10) }) },
  { op: 'setSize', cat: 'looks', parts: ['set size to', A, '%'], make: () => ({ op: 'setSize', a: n(100) }) },
  { op: 'changeEffect', cat: 'looks', parts: ['change', { name: 'effect' }, 'effect by', A], make: () => ({ op: 'changeEffect', name: 'color', a: n(25) }) },
  { op: 'setEffect', cat: 'looks', parts: ['set', { name: 'effect' }, 'effect to', A], make: () => ({ op: 'setEffect', name: 'ghost', a: n(50) }) },
  { op: 'clearEffects', cat: 'looks', parts: ['clear graphic effects'], make: () => ({ op: 'clearEffects' }) },
  { op: 'show', cat: 'looks', parts: ['show'], make: () => ({ op: 'show' }) },
  { op: 'hide', cat: 'looks', parts: ['hide'], make: () => ({ op: 'hide' }) },
  // Sound + music
  { op: 'sound', cat: 'sound', parts: ['start sound', { name: 'sound' }], make: () => ({ op: 'sound', name: 'pop' }) },
  { op: 'playNote', cat: 'sound', parts: ['play note', A, 'for', B, 'beats'], make: () => ({ op: 'playNote', a: n(60), b: n(0.5) }) },
  // Events (non-hat)
  { op: 'broadcast', cat: 'events', parts: ['broadcast', { name: 'msg' }], make: () => ({ op: 'broadcast', name: 'message1' }) },
  // Control
  { op: 'wait', cat: 'control', parts: ['wait', A, 'seconds'], make: () => ({ op: 'wait', a: n(1) }) },
  { op: 'repeat', cat: 'control', parts: ['repeat', A], c: true, make: () => ({ op: 'repeat', a: n(10), body: [] }) },
  { op: 'forever', cat: 'control', parts: ['forever'], c: true, make: () => ({ op: 'forever', body: [] }) },
  { op: 'if', cat: 'control', parts: ['if', { cond: true }, 'then'], c: true, make: () => ({ op: 'if', body: [] }) },
  { op: 'ifElse', cat: 'control', parts: ['if', { cond: true }, 'then … else'], c: true, e: true, make: () => ({ op: 'ifElse', body: [], else: [] }) },
  { op: 'waitUntil', cat: 'control', parts: ['wait until', { cond: true }], make: () => ({ op: 'waitUntil' }) },
  { op: 'until', cat: 'control', parts: ['repeat until', { cond: true }], c: true, make: () => ({ op: 'until', body: [] }) },
  { op: 'stopAll', cat: 'control', parts: ['stop all'], make: () => ({ op: 'stopAll' }) },
  { op: 'createClone', cat: 'control', parts: ['create clone of myself'], make: () => ({ op: 'createClone' }) },
  { op: 'deleteClone', cat: 'control', parts: ['delete this clone'], make: () => ({ op: 'deleteClone' }) },
  // Sensing
  { op: 'ask', cat: 'sensing', parts: ['ask', AS, 'and wait'], make: () => ({ op: 'ask', a: s('What is your name?') }) },
  { op: 'resetTimer', cat: 'sensing', parts: ['reset timer'], make: () => ({ op: 'resetTimer' }) },
  // Variables
  { op: 'setVar', cat: 'variables', parts: ['set', { name: 'var' }, 'to', A], make: () => ({ op: 'setVar', name: 'score', a: n(0) }) },
  { op: 'changeVar', cat: 'variables', parts: ['change', { name: 'var' }, 'by', A], make: () => ({ op: 'changeVar', name: 'score', a: n(1) }) },
  { op: 'listAdd', cat: 'variables', parts: ['add', AS, 'to', { name: 'list' }], make: () => ({ op: 'listAdd', name: 'list', a: s('thing') }) },
  { op: 'listDelete', cat: 'variables', parts: ['delete', A, 'of', { name: 'list' }], make: () => ({ op: 'listDelete', name: 'list', a: n(1) }) },
  { op: 'listReplace', cat: 'variables', parts: ['replace item', A, 'of', { name: 'list' }, 'with', { slot: 'b', kind: 'str' }], make: () => ({ op: 'listReplace', name: 'list', a: n(1), b: s('thing') }) },
  { op: 'listInsert', cat: 'variables', parts: ['insert', AS, 'at', { slot: 'b', kind: 'num' }, 'of', { name: 'list' }], make: () => ({ op: 'listInsert', name: 'list', a: s('thing'), b: n(1) }) },
  { op: 'listDeleteAll', cat: 'variables', parts: ['delete all of', { name: 'list' }], make: () => ({ op: 'listDeleteAll', name: 'list' }) },
  // My Blocks
  { op: 'call', cat: 'myblocks', parts: [{ name: 'proc' }, A], make: () => ({ op: 'call', name: 'my block', a: n(10) }) },
  // Pen
  { op: 'eraseAll', cat: 'pen', parts: ['erase all'], make: () => ({ op: 'eraseAll' }) },
  { op: 'penDown', cat: 'pen', parts: ['pen down'], make: () => ({ op: 'penDown' }) },
  { op: 'penUp', cat: 'pen', parts: ['pen up'], make: () => ({ op: 'penUp' }) },
  { op: 'setPenColor', cat: 'pen', parts: ['set pen color to', { name: 'color' }], make: () => ({ op: 'setPenColor', name: 'red' }) },
  { op: 'setPenSize', cat: 'pen', parts: ['set pen size to', A], make: () => ({ op: 'setPenSize', a: n(5) }) },
];
export const DEF: Record<string, BlockDef> = Object.fromEntries(DEFS.map((d) => [d.op, d]));

export const HATS: { type: Hat['type']; label: string; make: () => Hat }[] = [
  { type: 'flag', label: 'when green flag clicked', make: () => ({ type: 'flag' }) },
  { type: 'key', label: 'when key pressed', make: () => ({ type: 'key', key: 'space' }) },
  { type: 'click', label: 'when this sprite clicked', make: () => ({ type: 'click' }) },
  { type: 'receive', label: 'when I receive', make: () => ({ type: 'receive', msg: 'message1' }) },
  { type: 'clone', label: 'when I start as a clone', make: () => ({ type: 'clone' }) },
];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'motion', label: 'Motion' },
  { id: 'looks', label: 'Looks' },
  { id: 'sound', label: 'Sound' },
  { id: 'control', label: 'Control' },
  { id: 'sensing', label: 'Sensing' },
  { id: 'operators', label: 'Operators' },
  { id: 'variables', label: 'Variables' },
  { id: 'pen', label: 'Pen' },
  { id: 'myblocks', label: 'My Blocks' },
];

export const KEYS = ['space', 'right arrow', 'left arrow', 'up arrow', 'down arrow', 'any', ...'abcdefghijklmnopqrstuvwxyz'.split(''), ...'0123456789'.split('')];

/** Kitabash's own sprite library (emoji costumes). Multi-costume sprites animate with “next costume”. */
export const SPRITE_LIBRARY: { name: string; costumes: string[] }[] = [
  { name: 'Pip', costumes: ['🤖'] },
  { name: 'Cat', costumes: ['🐱', '😺'] },
  { name: 'Dog', costumes: ['🐶', '🐕'] },
  { name: 'Bird', costumes: ['🐦', '🕊️'] },
  { name: 'Fish', costumes: ['🐟', '🐠'] },
  { name: 'Butterfly', costumes: ['🦋'] },
  { name: 'Dancer', costumes: ['💃', '🕺'] },
  { name: 'Runner', costumes: ['🚶', '🏃'] },
  { name: 'Dragon', costumes: ['🐉', '🐲'] },
  { name: 'Rocket', costumes: ['🚀'] },
  { name: 'Ghost', costumes: ['👻'] },
  { name: 'Ball', costumes: ['⚽', '🏀'] },
  { name: 'Apple', costumes: ['🍎', '🍏'] },
  { name: 'Bowl', costumes: ['🥣'] },
  { name: 'Star', costumes: ['⭐', '🌟'] },
  { name: 'Heart', costumes: ['❤️', '💖'] },
  { name: 'Car', costumes: ['🚗', '🚙'] },
  { name: 'Lava', costumes: ['🟥'] },
  { name: 'Goal', costumes: ['🏁'] },
  { name: 'Wall', costumes: ['🧱'] },
  { name: 'Coin', costumes: ['🪙'] },
  { name: 'Alien', costumes: ['👾', '👽'] },
];
