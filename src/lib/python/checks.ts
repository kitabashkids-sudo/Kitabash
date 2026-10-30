// Python Lab checks: run the learner's program (on the server, too) and test it.
import { PyError, eq, fromPlain, parse, repr, runPython, str, toPlain, type Expr, type RunResult, type Stmt, type Val } from './interp.ts';

export type Construct = 'for' | 'while' | 'if' | 'elif' | 'else' | 'def' | 'return' | 'list' | 'dict' | 'input' | 'print' | 'fstring' | 'import' | 'comprehension' | 'try' | 'class' | 'append' | 'range' | 'len' | 'comment' | 'recursion' | 'random' | 'turtle' | 'nested-loop';

export type PyCheck =
  | { t: 'output'; equals?: string; contains?: string[]; lines?: string[]; notContains?: string[]; inputs?: string[]; exactCase?: boolean; msg: string }
  | { t: 'func'; name: string; cases: { args: unknown[]; expect: unknown }[]; inputs?: string[]; msg: string }
  | { t: 'var'; name: string; equals: unknown; inputs?: string[]; msg: string }
  | { t: 'uses'; what: Construct[]; msg: string }
  | { t: 'turtle'; minLines?: number; closed?: boolean; sides?: number; colors?: number; msg: string }
  | { t: 'noError'; inputs?: string[]; msg: string }
  | { t: 'maxLines'; n: number; msg: string }
  | { t: 'calls'; name: string; min: number; inputs?: string[]; msg: string };

export const normOut = (s: string) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');

/** Which language features does this program use? (syntax-level) */
export function constructs(code: string): Set<Construct> {
  const found = new Set<Construct>();
  let prog: Stmt[];
  try {
    prog = parse(code);
  } catch {
    return found;
  }
  if (/^\s*#/m.test(code)) found.add('comment');
  const defs: string[] = [];
  const walkE = (e: Expr | undefined, inDef?: string): void => {
    if (!e) return;
    switch (e.k) {
      case 'list':
        found.add('list');
        e.items.forEach((x) => walkE(x, inDef));
        return;
      case 'dict':
        found.add('dict');
        e.items.forEach(([a, b]) => (walkE(a, inDef), walkE(b, inDef)));
        return;
      case 'fstr':
        found.add('fstring');
        e.parts.forEach((p) => typeof p !== 'string' && walkE(p.e, inDef));
        return;
      case 'comp':
        found.add('comprehension');
        found.add('list');
        walkE(e.elt, inDef);
        walkE(e.iter, inDef);
        walkE(e.cond, inDef);
        return;
      case 'call':
        if (e.f.k === 'name') {
          if (['input', 'print', 'range', 'len'].includes(e.f.id)) found.add(e.f.id as Construct);
          if (e.f.id === 'list' || e.f.id === 'dict') found.add(e.f.id);
          if (inDef && e.f.id === inDef) found.add('recursion');
        }
        if (e.f.k === 'attr' && e.f.name === 'append') found.add('append');
        walkE(e.f, inDef);
        e.args.forEach((x) => walkE(x, inDef));
        e.kw.forEach(([, x]) => walkE(x, inDef));
        return;
      case 'bin':
      case 'bool':
        walkE(e.a, inDef);
        walkE(e.b, inDef);
        return;
      case 'un':
        walkE(e.a, inDef);
        return;
      case 'cmp':
        e.items.forEach((x) => walkE(x, inDef));
        return;
      case 'attr':
        walkE(e.o, inDef);
        return;
      case 'sub':
        walkE(e.o, inDef);
        walkE(e.i, inDef);
        return;
      case 'tuple':
        e.items.forEach((x) => walkE(x, inDef));
        return;
      case 'ifexp':
        walkE(e.c, inDef);
        walkE(e.a, inDef);
        walkE(e.b, inDef);
        return;
    }
  };
  const walk = (list: Stmt[], loops: number, inDef?: string): void => {
    for (const s of list) {
      switch (s.k) {
        case 'expr':
          walkE(s.e, inDef);
          break;
        case 'assign':
          walkE(s.v, inDef);
          s.targets.forEach((t) => walkE(t, inDef));
          break;
        case 'aug':
          walkE(s.v, inDef);
          break;
        case 'if':
          found.add('if');
          walkE(s.c, inDef);
          walk(s.body, loops, inDef);
          if (s.orelse.length === 1 && s.orelse[0].k === 'if' && s.orelse[0].line !== s.line) {
            found.add('elif');
            walk(s.orelse, loops, inDef);
          } else if (s.orelse.length) {
            found.add('else');
            walk(s.orelse, loops, inDef);
          }
          break;
        case 'while':
        case 'for':
          found.add(s.k);
          if (loops > 0) found.add('nested-loop');
          walkE(s.k === 'while' ? s.c : s.iter, inDef);
          walk(s.body, loops + 1, inDef);
          break;
        case 'def':
          found.add('def');
          defs.push(s.name);
          walk(s.body, 0, s.name);
          break;
        case 'class':
          found.add('class');
          walk(s.body, 0, inDef);
          break;
        case 'return':
          found.add('return');
          walkE(s.v, inDef);
          break;
        case 'import':
        case 'from': {
          found.add('import');
          const mods = s.k === 'import' ? s.names.map((n) => n[0]) : [s.mod];
          if (mods.includes('random')) found.add('random');
          if (mods.includes('turtle')) found.add('turtle');
          break;
        }
        case 'try':
          found.add('try');
          walk(s.body, loops, inDef);
          s.handlers.forEach((h) => walk(h.body, loops, inDef));
          break;
      }
    }
  };
  walk(prog, 0);
  return found;
}

export interface CheckOutcome {
  ok: boolean;
  msg: string;
  detail?: string;
}
export interface CheckReport {
  results: CheckOutcome[];
  passed: boolean;
  run: Pick<RunResult, 'output' | 'error' | 'needInput'>;
}

const SEED = 7;
const runWith = (code: string, inputs: string[] | undefined, cache: Map<string, RunResult>) => {
  const k = JSON.stringify(inputs || []);
  if (!cache.has(k)) cache.set(k, runPython(code, { inputs: inputs || [], seed: SEED, maxSteps: 400_000 }));
  return cache.get(k)!;
};
const errText = (r: RunResult) => (r.error ? `${r.error.type} on line ${r.error.line}: ${r.error.message}${r.error.hint ? ' — ' + r.error.hint : ''}` : r.needInput !== undefined ? `The program asked for more input than the test gives (“${r.needInput}”).` : '');

/** Run every check against the code. `defaultInputs` are used when a check gives none. */
export function runChecks(code: string, checks: PyCheck[], defaultInputs: string[] = []): CheckReport {
  const cache = new Map<string, RunResult>();
  const base = runWith(code, defaultInputs, cache);
  const used = constructs(code);
  const results = checks.map((c): CheckOutcome => {
    const inputs = 'inputs' in c && c.inputs ? c.inputs : defaultInputs;
    switch (c.t) {
      case 'output': {
        const r = runWith(code, inputs, cache);
        if (r.error || r.needInput !== undefined) return { ok: false, msg: c.msg, detail: errText(r) };
        const out = normOut(r.output);
        const low = (s: string) => (c.exactCase ? s : s.toLowerCase());
        let ok = true;
        if (c.equals !== undefined) ok &&= out === normOut(c.equals);
        if (c.contains) ok &&= c.contains.every((w) => low(out).includes(low(w)));
        if (c.notContains) ok &&= !c.notContains.some((w) => low(out).includes(low(w)));
        if (c.lines) {
          const ls = out.split('\n');
          let from = 0;
          ok &&= c.lines.every((w) => {
            const i = ls.findIndex((l, k) => k >= from && low(l).includes(low(w)));
            if (i < 0) return false;
            from = i + 1;
            return true;
          });
        }
        return { ok, msg: c.msg, detail: ok ? undefined : inputs.length ? `With input ${inputs.map((x) => `“${x}”`).join(', ')} the output was:\n${out || '(nothing)'}` : `The output was:\n${out || '(nothing)'}` };
      }
      case 'func': {
        const r = runWith(code, inputs, cache);
        if (r.error) return { ok: false, msg: c.msg, detail: errText(r) };
        const f = r.globals[c.name];
        if (!f) return { ok: false, msg: c.msg, detail: `There is no function called ${c.name}. Define it with: def ${c.name}(...):` };
        for (const tc of c.cases) {
          try {
            const got = r.interp.call(f, tc.args.map(fromPlain), {}, 0);
            if (!eq(got, fromPlain(tc.expect))) return { ok: false, msg: c.msg, detail: `${c.name}(${tc.args.map((a) => repr(fromPlain(a))).join(', ')}) returned ${repr(got)} — expected ${repr(fromPlain(tc.expect))}.${got === null ? ' (Did you forget return?)' : ''}` };
          } catch (e) {
            const pe = e as PyError;
            return { ok: false, msg: c.msg, detail: `${c.name}(${tc.args.map((a) => repr(fromPlain(a))).join(', ')}) caused ${pe.type || 'an error'}: ${pe.message}` };
          }
        }
        return { ok: true, msg: c.msg };
      }
      case 'var': {
        const r = runWith(code, inputs, cache);
        if (r.error) return { ok: false, msg: c.msg, detail: errText(r) };
        const v = r.globals[c.name];
        const ok = v !== undefined && eq(v, fromPlain(c.equals));
        return { ok, msg: c.msg, detail: ok ? undefined : v === undefined ? `There is no variable called ${c.name}.` : `${c.name} is ${repr(v)} — expected ${repr(fromPlain(c.equals))}.` };
      }
      case 'uses': {
        const missing = c.what.filter((w) => !used.has(w));
        return { ok: !missing.length, msg: c.msg };
      }
      case 'noError': {
        const r = runWith(code, inputs, cache);
        return { ok: !r.error && r.needInput === undefined, msg: c.msg, detail: errText(r) || undefined };
      }
      case 'maxLines': {
        const n = code.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).length;
        return { ok: n <= c.n, msg: c.msg, detail: n > c.n ? `Your program has ${n} lines of code.` : undefined };
      }
      case 'calls': {
        const r = runWith(code, inputs, cache);
        return { ok: (r.calls[c.name] || 0) >= c.min, msg: c.msg };
      }
      case 'turtle': {
        const t = base.turtle;
        if (base.error) return { ok: false, msg: c.msg, detail: errText(base) };
        const lines = t.lines.filter((l) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1) > 0.5);
        let ok = lines.length >= (c.minLines ?? 1);
        if (c.closed && lines.length) ok &&= Math.hypot(lines[lines.length - 1].x2 - lines[0].x1, lines[lines.length - 1].y2 - lines[0].y1) < 3;
        if (c.sides) {
          let sides = 0;
          let prev: number | null = null;
          for (const l of lines) {
            const a = Math.round((Math.atan2(l.y2 - l.y1, l.x2 - l.x1) * 180) / Math.PI);
            if (prev === null || Math.abs((((a - prev + 540) % 360) - 180)) > 2) sides++;
            prev = a;
          }
          ok &&= sides === c.sides;
        }
        if (c.colors) ok &&= new Set(lines.map((l) => l.color)).size >= c.colors;
        return { ok, msg: c.msg, detail: ok ? undefined : `The turtle drew ${lines.length} line${lines.length === 1 ? '' : 's'}.` };
      }
    }
  });
  return { results, passed: results.every((r) => r.ok), run: { output: base.output, error: base.error, needInput: base.needInput } };
}

/** Sanitise code from a client before running it on the server. */
export function checkCode(code: unknown): string {
  if (typeof code !== 'string') throw new Error('Program is missing.');
  if (code.length > 20_000) throw new Error('This program is too long (20,000 characters at most).');
  return code.replace(/\r\n?/g, '\n');
}

export { str, toPlain, type Val };
