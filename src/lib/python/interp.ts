// Kitabash Python Lab: a small, safe interpreter for a teaching subset of Python 3.
// Pure TypeScript, shared by the browser (to run learners' code instantly) and the server
// (to re-run it for grading), so results can't be faked. No eval, no network, no files.
//
// Supported: numbers (int/float), strings (incl. f-strings, .format), booleans, None, lists,
// tuples, dicts, ranges; if/elif/else, while, for, break/continue/pass, def/return (defaults,
// keyword args, recursion), list comprehensions, ternaries, chained comparisons, slicing,
// print/input, common built-ins and str/list/dict methods, `import random/math/turtle`,
// a simple class statement (attributes and methods), try/except and raise.

// ── Values ─────────────────────────────────────────────────
export class PyFloat {
  constructor(public v: number) {}
}
export class PyList {
  constructor(public items: Val[] = []) {}
}
export class PyTuple {
  constructor(public items: Val[] = []) {}
}
export class PyDict {
  map = new Map<string, [Val, Val]>();
}
export class PyRange {
  constructor(public start: number, public stop: number, public step: number) {}
}
export class PyFunc {
  constructor(public name: string, public params: Param[], public body: Stmt[], public closure: Scope, public isLambda = false) {}
}
export class PyBuiltin {
  constructor(public name: string, public fn: (args: Val[], kw: Record<string, Val>, line: number) => Val) {}
}
export class PyModule {
  constructor(public name: string, public attrs: Record<string, Val>) {}
}
export class PyClass {
  constructor(public name: string, public attrs: Map<string, Val>) {}
}
export class PyObject {
  attrs = new Map<string, Val>();
  constructor(public cls: PyClass) {}
}
export class PyBound {
  constructor(public self: Val, public fn: PyFunc | PyBuiltin) {}
}
export type Val = number | PyFloat | string | boolean | null | PyList | PyTuple | PyDict | PyRange | PyFunc | PyBuiltin | PyModule | PyClass | PyObject | PyBound;

export class PyError extends Error {
  constructor(public type: string, msg: string, public line = 0, public hint = '') {
    super(msg);
  }
}
class NeedInput extends Error {
  constructor(public prompt: string) {
    super('input');
  }
}
class BreakSig {}
class ContinueSig {}
class ReturnSig {
  constructor(public value: Val) {}
}

// ── Tokens ─────────────────────────────────────────────────
type Tok = { t: 'name' | 'num' | 'str' | 'fstr' | 'op' | 'nl' | 'indent' | 'dedent' | 'eof'; v: string; line: number };
const KEYWORDS = new Set(['if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue', 'pass', 'and', 'or', 'not', 'import', 'from', 'as', 'global', 'is', 'lambda', 'class', 'try', 'except', 'finally', 'raise', 'None', 'True', 'False']);
const OPS3 = ['**=', '//=', '...'];
const OPS2 = ['**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '->'];
const OPS1 = '+-*/%<>=()[]{}:,.';

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const lines = src.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const indents = [0];
  let depth = 0; // bracket depth: newlines inside brackets are ignored
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    const lineNo = ln + 1;
    let i = 0;
    if (depth === 0) {
      const m = line.match(/^ */)![0].length;
      const rest = line.slice(m);
      if (rest === '' || rest.startsWith('#')) continue;
      if (m > indents[indents.length - 1]) {
        indents.push(m);
        out.push({ t: 'indent', v: '', line: lineNo });
      } else {
        while (m < indents[indents.length - 1]) {
          indents.pop();
          out.push({ t: 'dedent', v: '', line: lineNo });
        }
        if (m !== indents[indents.length - 1]) throw new PyError('IndentationError', 'unindent does not match any outer indentation level', lineNo, 'Line up this line with the block it belongs to (use 4 spaces per level).');
      }
      i = m;
    }
    while (i < line.length) {
      const c = line[i];
      if (c === ' ') {
        i++;
        continue;
      }
      if (c === '#') break;
      if (c === '\\' && i === line.length - 1) {
        i++;
        continue;
      }
      // strings (with optional f prefix)
      const fm = line.slice(i).match(/^([fFrR]?)("""|'''|"|')/);
      if (fm) {
        const prefix = fm[1].toLowerCase();
        const q = fm[2];
        let j = i + fm[0].length;
        let s = '';
        let closed = false;
        let curLine = ln;
        let text = line;
        for (;;) {
          if (j >= text.length) {
            if (q.length === 3 && curLine + 1 < lines.length) {
              s += '\n';
              curLine++;
              text = lines[curLine];
              j = 0;
              continue;
            }
            break;
          }
          if (text.startsWith(q, j)) {
            closed = true;
            j += q.length;
            break;
          }
          if (text[j] === '\\' && prefix !== 'r' && j + 1 < text.length) {
            const e = text[j + 1];
            s += e === 'n' ? '\n' : e === 't' ? '\t' : e === '\\' ? '\\' : e === "'" ? "'" : e === '"' ? '"' : '\\' + e;
            j += 2;
            continue;
          }
          s += text[j++];
        }
        if (!closed) throw new PyError('SyntaxError', 'unterminated string literal', lineNo, `Close the text with a matching ${q}.`);
        out.push({ t: prefix === 'f' ? 'fstr' : 'str', v: s, line: lineNo });
        if (curLine !== ln) {
          ln = curLine;
          // continue tokenizing the rest of the closing line
          line = lines[ln];
          i = j;
          continue;
        }
        i = j;
        continue;
      }
      if ('“”‘’'.includes(c)) throw new PyError('SyntaxError', `invalid character '${c}'`, lineNo, 'Use straight quotes " or \' — curly quotes (from a word processor) don’t work in code.');
      const num = line.slice(i).match(/^(\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?|\.\d+)/);
      if (num) {
        out.push({ t: 'num', v: num[1].replace(/_/g, ''), line: lineNo });
        i += num[1].length;
        continue;
      }
      const nm = line.slice(i).match(/^[A-Za-z_À-￿][A-Za-z0-9_À-￿]*/);
      if (nm) {
        out.push({ t: 'name', v: nm[0], line: lineNo });
        i += nm[0].length;
        continue;
      }
      const op3 = OPS3.find((o) => line.startsWith(o, i));
      const op2 = OPS2.find((o) => line.startsWith(o, i));
      const op = op3 || op2 || (OPS1.includes(c) ? c : null);
      if (!op) throw new PyError('SyntaxError', `invalid character '${c}'`, lineNo, c === '“' || c === '”' || c === '‘' || c === '’' ? 'Use straight quotes " or \' — curly quotes don’t work in code.' : 'Check for a typo on this line.');
      if ('([{'.includes(op)) depth++;
      if (')]}'.includes(op)) depth = Math.max(0, depth - 1);
      out.push({ t: 'op', v: op, line: lineNo });
      i += op.length;
    }
    if (depth === 0 && out.length && out[out.length - 1].t !== 'nl' && out[out.length - 1].t !== 'indent' && out[out.length - 1].t !== 'dedent') out.push({ t: 'nl', v: '', line: lineNo });
  }
  if (depth > 0) throw new PyError('SyntaxError', "'(' was never closed", lines.length, 'A bracket is missing its closing partner.');
  while (indents.length > 1) {
    indents.pop();
    out.push({ t: 'dedent', v: '', line: lines.length });
  }
  out.push({ t: 'eof', v: '', line: lines.length });
  return out;
}

// ── AST ────────────────────────────────────────────────────
export type Param = { name: string; def?: Expr; star?: boolean };
export type Expr =
  | { k: 'num'; v: number; float: boolean; line: number }
  | { k: 'str'; v: string; line: number }
  | { k: 'fstr'; parts: (string | { e: Expr; spec: string })[]; line: number }
  | { k: 'name'; id: string; line: number }
  | { k: 'const'; v: Val; line: number }
  | { k: 'bin'; op: string; a: Expr; b: Expr; line: number }
  | { k: 'un'; op: string; a: Expr; line: number }
  | { k: 'bool'; op: 'and' | 'or'; a: Expr; b: Expr; line: number }
  | { k: 'cmp'; ops: string[]; items: Expr[]; line: number }
  | { k: 'call'; f: Expr; args: Expr[]; kw: [string, Expr][]; line: number }
  | { k: 'attr'; o: Expr; name: string; line: number }
  | { k: 'sub'; o: Expr; i: Expr; line: number }
  | { k: 'slice'; a?: Expr; b?: Expr; c?: Expr; line: number }
  | { k: 'list'; items: Expr[]; line: number }
  | { k: 'tuple'; items: Expr[]; line: number }
  | { k: 'dict'; items: [Expr, Expr][]; line: number }
  | { k: 'comp'; elt: Expr; target: Expr; iter: Expr; cond?: Expr; line: number }
  | { k: 'ifexp'; c: Expr; a: Expr; b: Expr; line: number }
  | { k: 'lambda'; params: Param[]; body: Expr; line: number };
export type Stmt =
  | { k: 'expr'; e: Expr; line: number }
  | { k: 'assign'; targets: Expr[]; v: Expr; line: number }
  | { k: 'aug'; target: Expr; op: string; v: Expr; line: number }
  | { k: 'if'; c: Expr; body: Stmt[]; orelse: Stmt[]; line: number }
  | { k: 'while'; c: Expr; body: Stmt[]; line: number }
  | { k: 'for'; target: Expr; iter: Expr; body: Stmt[]; line: number }
  | { k: 'def'; name: string; params: Param[]; body: Stmt[]; line: number }
  | { k: 'class'; name: string; body: Stmt[]; line: number }
  | { k: 'return'; v?: Expr; line: number }
  | { k: 'break' | 'continue' | 'pass'; line: number }
  | { k: 'import'; names: [string, string][]; line: number }
  | { k: 'from'; mod: string; names: [string, string][]; line: number }
  | { k: 'global'; names: string[]; line: number }
  | { k: 'try'; body: Stmt[]; handlers: { type?: string; as?: string; body: Stmt[] }[]; fin: Stmt[]; line: number }
  | { k: 'raise'; e?: Expr; line: number };

class Parser {
  i = 0;
  constructor(private toks: Tok[]) {}
  peek(o = 0) {
    return this.toks[this.i + o];
  }
  next() {
    return this.toks[this.i++];
  }
  is(v: string, o = 0) {
    const t = this.peek(o);
    return (t.t === 'op' || t.t === 'name') && t.v === v;
  }
  eat(v: string) {
    if (this.is(v)) return this.next();
    const t = this.peek();
    const got = t.t === 'nl' ? 'end of line' : t.t === 'eof' ? 'end of program' : t.t === 'indent' ? 'an indented line' : `'${t.v}'`;
    const hint = v === ':' ? 'Lines that start a block (if, for, while, def, else…) must end with a colon :' : v === ')' ? 'A bracket ( is missing its closing ).' : '';
    throw new PyError('SyntaxError', `expected '${v}' but found ${got}`, t.line, hint);
  }
  program(): Stmt[] {
    const out: Stmt[] = [];
    while (this.peek().t !== 'eof') {
      if (this.peek().t === 'nl') {
        this.next();
        continue;
      }
      if (this.peek().t === 'indent') throw new PyError('IndentationError', 'unexpected indent', this.peek().line, 'This line is pushed in, but it isn’t inside a block. Remove the extra spaces.');
      out.push(...this.statement());
    }
    return out;
  }
  block(): Stmt[] {
    this.eat(':');
    if (this.peek().t !== 'nl') {
      const s = this.simple();
      return s;
    }
    this.next();
    if (this.peek().t !== 'indent') throw new PyError('IndentationError', 'expected an indented block', this.peek().line, 'The lines inside if/for/while/def must be indented (4 spaces).');
    this.next();
    const body: Stmt[] = [];
    while (this.peek().t !== 'dedent' && this.peek().t !== 'eof') {
      if (this.peek().t === 'nl') {
        this.next();
        continue;
      }
      body.push(...this.statement());
    }
    if (this.peek().t === 'dedent') this.next();
    return body;
  }
  statement(): Stmt[] {
    const t = this.peek();
    const line = t.line;
    if (t.t === 'name') {
      switch (t.v) {
        case 'if':
          return [this.ifStmt()];
        case 'while': {
          this.next();
          const c = this.expr();
          return [{ k: 'while', c, body: this.block(), line }];
        }
        case 'for': {
          this.next();
          const target = this.targetList();
          this.eat('in');
          const iter = this.exprList();
          return [{ k: 'for', target, iter, body: this.block(), line }];
        }
        case 'def': {
          this.next();
          const name = this.name();
          this.eat('(');
          const params = this.params(')');
          this.eat(')');
          if (this.is('->')) {
            this.next();
            this.expr();
          }
          return [{ k: 'def', name, params, body: this.block(), line }];
        }
        case 'class': {
          this.next();
          const name = this.name();
          if (this.is('(')) {
            this.next();
            while (!this.is(')')) this.next();
            this.next();
          }
          return [{ k: 'class', name, body: this.block(), line }];
        }
        case 'try': {
          this.next();
          const body = this.block();
          const handlers: { type?: string; as?: string; body: Stmt[] }[] = [];
          let fin: Stmt[] = [];
          while (this.is('except')) {
            this.next();
            let type: string | undefined;
            let as: string | undefined;
            if (!this.is(':')) {
              type = this.name();
              if (this.is('as')) {
                this.next();
                as = this.name();
              }
            }
            handlers.push({ type, as, body: this.block() });
          }
          if (this.is('else')) {
            this.next();
            const els = this.block();
            body.push(...els);
          }
          if (this.is('finally')) {
            this.next();
            fin = this.block();
          }
          if (!handlers.length && !fin.length) throw new PyError('SyntaxError', "expected 'except' or 'finally' block", line);
          return [{ k: 'try', body, handlers, fin, line }];
        }
      }
    }
    return this.simple();
  }
  ifStmt(): Stmt {
    const line = this.next().line; // if / elif
    const c = this.expr();
    const body = this.block();
    let orelse: Stmt[] = [];
    if (this.is('elif')) orelse = [this.ifStmt()];
    else if (this.is('else')) {
      this.next();
      orelse = this.block();
    }
    return { k: 'if', c, body, orelse, line };
  }
  simple(): Stmt[] {
    const out: Stmt[] = [this.small()];
    while (this.is(';')) {
      this.next();
      if (this.peek().t === 'nl') break;
      out.push(this.small());
    }
    if (this.peek().t === 'nl') this.next();
    else if (this.peek().t !== 'eof' && this.peek().t !== 'dedent') throw new PyError('SyntaxError', `invalid syntax near '${this.peek().v}'`, this.peek().line, 'Check this line for a missing operator, comma or bracket.');
    return out;
  }
  small(): Stmt {
    const t = this.peek();
    const line = t.line;
    if (t.t === 'name') {
      switch (t.v) {
        case 'return':
          this.next();
          return { k: 'return', v: this.peek().t === 'nl' || this.peek().t === 'eof' ? undefined : this.exprList(), line };
        case 'break':
        case 'continue':
        case 'pass':
          this.next();
          return { k: t.v, line };
        case 'import': {
          this.next();
          const names: [string, string][] = [];
          do {
            if (names.length) this.next();
            const n = this.dotted();
            let as = n;
            if (this.is('as')) {
              this.next();
              as = this.name();
            }
            names.push([n, as]);
          } while (this.is(','));
          return { k: 'import', names, line };
        }
        case 'from': {
          this.next();
          const mod = this.dotted();
          this.eat('import');
          const names: [string, string][] = [];
          if (this.is('*')) {
            this.next();
            names.push(['*', '*']);
          } else
            do {
              if (names.length) this.next();
              const n = this.name();
              let as = n;
              if (this.is('as')) {
                this.next();
                as = this.name();
              }
              names.push([n, as]);
            } while (this.is(','));
          return { k: 'from', mod, names, line };
        }
        case 'global': {
          this.next();
          const names = [this.name()];
          while (this.is(',')) {
            this.next();
            names.push(this.name());
          }
          return { k: 'global', names, line };
        }
        case 'raise':
          this.next();
          return { k: 'raise', e: this.peek().t === 'nl' ? undefined : this.expr(), line };
      }
    }
    const e = this.exprList();
    if (this.is('=')) {
      const targets = [e];
      let v: Expr = e;
      while (this.is('=')) {
        this.next();
        v = this.exprList();
        targets.push(v);
      }
      targets.pop();
      for (const tg of targets) this.checkTarget(tg);
      return { k: 'assign', targets, v, line };
    }
    const aug = ['+=', '-=', '*=', '/=', '//=', '%=', '**='].find((o) => this.is(o));
    if (aug) {
      this.next();
      this.checkTarget(e);
      return { k: 'aug', target: e, op: aug.slice(0, -1), v: this.expr(), line };
    }
    return { k: 'expr', e, line };
  }
  checkTarget(e: Expr) {
    if (e.k === 'name' || e.k === 'sub' || e.k === 'attr') return;
    if (e.k === 'tuple' || e.k === 'list') return e.items.forEach((x) => this.checkTarget(x));
    throw new PyError('SyntaxError', 'cannot assign to this expression', e.line, 'The left side of = must be a variable name. To compare, use == instead.');
  }
  dotted() {
    let n = this.name();
    while (this.is('.')) {
      this.next();
      n += '.' + this.name();
    }
    return n;
  }
  name(): string {
    const t = this.next();
    if (t.t !== 'name' || (KEYWORDS.has(t.v) && !['None', 'True', 'False'].includes(t.v))) throw new PyError('SyntaxError', `expected a name but found '${t.v || t.t}'`, t.line);
    return t.v;
  }
  params(end: string): Param[] {
    const ps: Param[] = [];
    while (!this.is(end)) {
      let star = false;
      if (this.is('*')) {
        this.next();
        star = true;
      }
      const name = this.name();
      if (this.is(':')  && end === ')') {
        this.next();
        this.expr(); // type hint, ignored
      }
      let def: Expr | undefined;
      if (this.is('=')) {
        this.next();
        def = this.expr();
      }
      ps.push({ name, def, star });
      if (!this.is(end)) this.eat(',');
    }
    return ps;
  }
  targetList(): Expr {
    const line = this.peek().line;
    const items = [this.postfix()];
    while (this.is(',')) {
      this.next();
      items.push(this.postfix());
    }
    return items.length === 1 ? items[0] : { k: 'tuple', items, line };
  }
  exprList(): Expr {
    const line = this.peek().line;
    const first = this.expr();
    if (!this.is(',')) return first;
    const items = [first];
    while (this.is(',')) {
      this.next();
      if (this.peek().t === 'nl' || this.is('=') || this.is(')')) break;
      items.push(this.expr());
    }
    return { k: 'tuple', items, line };
  }
  expr(): Expr {
    const line = this.peek().line;
    if (this.is('lambda')) {
      this.next();
      const params = this.params(':');
      this.eat(':');
      return { k: 'lambda', params, body: this.expr(), line };
    }
    const a = this.or();
    if (this.is('if')) {
      this.next();
      const c = this.or();
      this.eat('else');
      const b = this.expr();
      return { k: 'ifexp', c, a, b, line };
    }
    return a;
  }
  or(): Expr {
    let a = this.and();
    while (this.is('or')) {
      const line = this.next().line;
      a = { k: 'bool', op: 'or', a, b: this.and(), line };
    }
    return a;
  }
  and(): Expr {
    let a = this.not();
    while (this.is('and')) {
      const line = this.next().line;
      a = { k: 'bool', op: 'and', a, b: this.not(), line };
    }
    return a;
  }
  not(): Expr {
    if (this.is('not')) {
      const line = this.next().line;
      return { k: 'un', op: 'not', a: this.not(), line };
    }
    return this.compare();
  }
  compare(): Expr {
    const line = this.peek().line;
    const first = this.arith();
    const ops: string[] = [];
    const items = [first];
    for (;;) {
      let op: string | null = null;
      if (['<', '>', '==', '>=', '<=', '!='].some((o) => this.is(o))) op = this.next().v;
      else if (this.is('in')) op = (this.next(), 'in');
      else if (this.is('not') && this.is('in', 1)) op = (this.next(), this.next(), 'not in');
      else if (this.is('is')) {
        this.next();
        op = this.is('not') ? (this.next(), 'is not') : 'is';
      } else if (this.is('=') && !this.is('=', 1)) break;
      if (!op) break;
      ops.push(op);
      items.push(this.arith());
    }
    return ops.length ? { k: 'cmp', ops, items, line } : first;
  }
  arith(): Expr {
    let a = this.term();
    while (this.is('+') || this.is('-')) {
      const t = this.next();
      a = { k: 'bin', op: t.v, a, b: this.term(), line: t.line };
    }
    return a;
  }
  term(): Expr {
    let a = this.unary();
    while (this.is('*') || this.is('/') || this.is('//') || this.is('%')) {
      const t = this.next();
      a = { k: 'bin', op: t.v, a, b: this.unary(), line: t.line };
    }
    return a;
  }
  unary(): Expr {
    if (this.is('-') || this.is('+')) {
      const t = this.next();
      return { k: 'un', op: t.v, a: this.unary(), line: t.line };
    }
    return this.power();
  }
  power(): Expr {
    const a = this.postfix();
    if (this.is('**')) {
      const t = this.next();
      return { k: 'bin', op: '**', a, b: this.unary(), line: t.line };
    }
    return a;
  }
  postfix(): Expr {
    let e = this.atom();
    for (;;) {
      const t = this.peek();
      if (this.is('(')) {
        this.next();
        const args: Expr[] = [];
        const kw: [string, Expr][] = [];
        while (!this.is(')')) {
          if (this.peek().t === 'name' && this.is('=', 1) && !this.is('==', 1)) {
            const k = this.next().v;
            this.next();
            kw.push([k, this.expr()]);
          } else {
            const a = this.expr();
            if (this.is('for')) args.push(this.comprehension(a, ')', t.line));
            else args.push(a);
          }
          if (!this.is(')')) this.eat(',');
        }
        this.next();
        e = { k: 'call', f: e, args, kw, line: t.line };
      } else if (this.is('[')) {
        this.next();
        let idx: Expr;
        if (this.is(':')) idx = this.sliceExpr();
        else {
          idx = this.exprList();
          if (this.is(':')) idx = this.sliceExpr(idx);
        }
        this.eat(']');
        e = { k: 'sub', o: e, i: idx, line: t.line };
      } else if (this.is('.')) {
        this.next();
        e = { k: 'attr', o: e, name: this.name(), line: t.line };
      } else return e;
    }
  }
  sliceExpr(start?: Expr): Expr {
    const line = this.peek().line;
    const a = start;
    let b: Expr | undefined;
    let c: Expr | undefined;
    this.eat(':');
    if (!this.is(']') && !this.is(':')) b = this.expr();
    if (this.is(':')) {
      this.next();
      if (!this.is(']')) c = this.expr();
    }
    return { k: 'slice', a, b, c, line };
  }
  comprehension(elt: Expr, end: string, line: number): Expr {
    this.eat('for');
    const target = this.targetList();
    this.eat('in');
    const iter = this.or();
    let cond: Expr | undefined;
    if (this.is('if')) {
      this.next();
      cond = this.or();
    }
    void end;
    return { k: 'comp', elt, target, iter, cond, line };
  }
  atom(): Expr {
    const t = this.next();
    const line = t.line;
    switch (t.t) {
      case 'num':
        return { k: 'num', v: Number(t.v), float: /[.eE]/.test(t.v), line };
      case 'str': {
        let v = t.v;
        while (this.peek().t === 'str') v += this.next().v; // implicit concatenation
        return { k: 'str', v, line };
      }
      case 'fstr':
        return this.fstring(t.v, line);
      case 'name':
        if (t.v === 'None') return { k: 'const', v: null, line };
        if (t.v === 'True') return { k: 'const', v: true, line };
        if (t.v === 'False') return { k: 'const', v: false, line };
        if (KEYWORDS.has(t.v)) throw new PyError('SyntaxError', `'${t.v}' can’t be used here`, line, t.v === 'else' || t.v === 'elif' ? 'Check the indentation: else/elif must line up with its if.' : '');
        return { k: 'name', id: t.v, line };
      case 'op':
        if (t.v === '(') {
          if (this.is(')')) {
            this.next();
            return { k: 'tuple', items: [], line };
          }
          const first = this.expr();
          if (this.is('for')) {
            const c = this.comprehension(first, ')', line);
            this.eat(')');
            return { k: 'call', f: { k: 'name', id: 'list', line }, args: [c], kw: [], line };
          }
          if (this.is(',')) {
            const items = [first];
            while (this.is(',')) {
              this.next();
              if (this.is(')')) break;
              items.push(this.expr());
            }
            this.eat(')');
            return { k: 'tuple', items, line };
          }
          this.eat(')');
          return first;
        }
        if (t.v === '[') {
          const items: Expr[] = [];
          if (!this.is(']')) {
            const first = this.expr();
            if (this.is('for')) {
              const c = this.comprehension(first, ']', line);
              this.eat(']');
              return c;
            }
            items.push(first);
            while (this.is(',')) {
              this.next();
              if (this.is(']')) break;
              items.push(this.expr());
            }
          }
          this.eat(']');
          return { k: 'list', items, line };
        }
        if (t.v === '{') {
          const items: [Expr, Expr][] = [];
          while (!this.is('}')) {
            const k = this.expr();
            this.eat(':');
            items.push([k, this.expr()]);
            if (!this.is('}')) this.eat(',');
          }
          this.next();
          return { k: 'dict', items, line };
        }
    }
    const what = t.t === 'nl' ? 'the end of the line' : t.t === 'eof' ? 'the end of the program' : t.t === 'indent' ? 'an indent' : `'${t.v}'`;
    throw new PyError('SyntaxError', `unexpected ${what}`, line, t.t === 'nl' ? 'Something is missing at the end of this line (a value, bracket or quote?).' : 'Check this line for a typo.');
  }
  fstring(s: string, line: number): Expr {
    const parts: (string | { e: Expr; spec: string })[] = [];
    let i = 0;
    let buf = '';
    while (i < s.length) {
      if (s[i] === '{' && s[i + 1] === '{') {
        buf += '{';
        i += 2;
        continue;
      }
      if (s[i] === '}' && s[i + 1] === '}') {
        buf += '}';
        i += 2;
        continue;
      }
      if (s[i] === '{') {
        let depth = 1;
        let j = i + 1;
        while (j < s.length && depth) {
          if (s[j] === '{') depth++;
          if (s[j] === '}') depth--;
          j++;
        }
        if (depth) throw new PyError('SyntaxError', "f-string: expecting '}'", line);
        let inner = s.slice(i + 1, j - 1);
        let spec = '';
        const colon = findSpecColon(inner);
        if (colon >= 0) {
          spec = inner.slice(colon + 1);
          inner = inner.slice(0, colon);
        }
        if (buf) parts.push(buf);
        buf = '';
        const p = new Parser(tokenize(inner.trim() || 'None'));
        const e = p.expr();
        parts.push({ e: relineExpr(e, line), spec });
        i = j;
        continue;
      }
      buf += s[i++];
    }
    if (buf) parts.push(buf);
    return { k: 'fstr', parts, line };
  }
}
function findSpecColon(s: string) {
  let depth = 0;
  let q = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === q) q = '';
      continue;
    }
    if (c === '"' || c === "'") q = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ':' && depth === 0) return i;
  }
  return -1;
}
function relineExpr(e: Expr, line: number): Expr {
  return JSON.parse(JSON.stringify(e), (k, v) => (k === 'line' ? line : v));
}

export function parse(src: string): Stmt[] {
  return new Parser(tokenize(src)).program();
}

// ── Helpers ────────────────────────────────────────────────
const isNum = (x: Val): x is number | PyFloat | boolean => typeof x === 'number' || x instanceof PyFloat || typeof x === 'boolean';
const numOf = (x: Val): number => (typeof x === 'number' ? x : x instanceof PyFloat ? x.v : x === true ? 1 : 0);
const mkNum = (v: number, float: boolean): Val => (float || !Number.isInteger(v) ? new PyFloat(v) : v);
const isFloat = (x: Val) => x instanceof PyFloat;

export function typeName(x: Val): string {
  if (x === null) return 'NoneType';
  if (typeof x === 'boolean') return 'bool';
  if (typeof x === 'number') return 'int';
  if (x instanceof PyFloat) return 'float';
  if (typeof x === 'string') return 'str';
  if (x instanceof PyList) return 'list';
  if (x instanceof PyTuple) return 'tuple';
  if (x instanceof PyDict) return 'dict';
  if (x instanceof PyRange) return 'range';
  if (x instanceof PyFunc || x instanceof PyBuiltin || x instanceof PyBound) return 'function';
  if (x instanceof PyModule) return 'module';
  if (x instanceof PyClass) return 'type';
  if (x instanceof PyObject) return x.cls.name;
  return 'object';
}
function fmtFloat(v: number): string {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? 'nan' : v > 0 ? 'inf' : '-inf';
  const av = Math.abs(v);
  if (av >= 1e16 || (av < 1e-4 && av !== 0)) return v.toExponential().replace(/\.0+e/, 'e').replace(/e([+-])(\d)$/, 'e$10$2');
  if (Number.isInteger(v)) return v.toFixed(1);
  return String(v);
}
export function repr(x: Val, depth = 0): string {
  if (depth > 20) return '...';
  if (typeof x === 'string') return x.includes("'") && !x.includes('"') ? `"${x}"` : `'${x.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  if (x instanceof PyList) return `[${x.items.map((i) => repr(i, depth + 1)).join(', ')}]`;
  if (x instanceof PyTuple) return x.items.length === 1 ? `(${repr(x.items[0], depth + 1)},)` : `(${x.items.map((i) => repr(i, depth + 1)).join(', ')})`;
  if (x instanceof PyDict) return `{${[...x.map.values()].map(([k, v]) => `${repr(k, depth + 1)}: ${repr(v, depth + 1)}`).join(', ')}}`;
  return str(x);
}
export function str(x: Val): string {
  if (x === null) return 'None';
  if (x === true) return 'True';
  if (x === false) return 'False';
  if (typeof x === 'number') return String(x);
  if (x instanceof PyFloat) return fmtFloat(x.v);
  if (typeof x === 'string') return x;
  if (x instanceof PyRange) return `range(${x.start}, ${x.stop}${x.step !== 1 ? ', ' + x.step : ''})`;
  if (x instanceof PyFunc) return `<function ${x.name}>`;
  if (x instanceof PyBuiltin) return `<built-in function ${x.name}>`;
  if (x instanceof PyBound) return `<bound method ${(x.fn as any).name}>`;
  if (x instanceof PyModule) return `<module '${x.name}'>`;
  if (x instanceof PyClass) return `<class '${x.name}'>`;
  if (x instanceof PyObject) return `<${x.cls.name} object>`;
  return repr(x);
}
export function truthy(x: Val): boolean {
  if (x === null || x === false || x === 0 || x === '') return false;
  if (x instanceof PyFloat) return x.v !== 0;
  if (x instanceof PyList || x instanceof PyTuple) return x.items.length > 0;
  if (x instanceof PyDict) return x.map.size > 0;
  if (x instanceof PyRange) return rangeLen(x) > 0;
  return true;
}
const keyOf = (k: Val, line: number): string => {
  if (typeof k === 'string') return 's:' + k;
  if (isNum(k)) return 'n:' + numOf(k);
  if (k === null) return 'none';
  if (k instanceof PyTuple) return 't:' + k.items.map((i) => keyOf(i, line)).join('|');
  throw new PyError('TypeError', `unhashable type: '${typeName(k)}'`, line, 'Dictionary keys must be text, numbers or tuples — not lists.');
};
export function eq(a: Val, b: Val): boolean {
  if (isNum(a) && isNum(b)) return numOf(a) === numOf(b);
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  if (a === null || b === null) return a === b;
  if ((a instanceof PyList && b instanceof PyList) || (a instanceof PyTuple && b instanceof PyTuple)) return a.items.length === b.items.length && a.items.every((x, i) => eq(x, (b as PyList).items[i]));
  if (a instanceof PyDict && b instanceof PyDict) return a.map.size === b.map.size && [...a.map].every(([k, [, v]]) => b.map.has(k) && eq(v, b.map.get(k)![1]));
  if (a instanceof PyRange && b instanceof PyRange) return a.start === b.start && a.stop === b.stop && a.step === b.step;
  return a === b;
}
function rangeLen(r: PyRange) {
  const n = Math.ceil((r.stop - r.start) / r.step);
  return Math.max(0, n);
}
function cmpVals(a: Val, b: Val, line: number): number {
  if (isNum(a) && isNum(b)) return numOf(a) - numOf(b);
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if ((a instanceof PyList && b instanceof PyList) || (a instanceof PyTuple && b instanceof PyTuple)) {
    for (let i = 0; i < Math.min(a.items.length, b.items.length); i++) {
      const c = cmpVals(a.items[i], (b as PyList).items[i], line);
      if (c) return c;
    }
    return a.items.length - (b as PyList).items.length;
  }
  throw new PyError('TypeError', `'<' not supported between '${typeName(a)}' and '${typeName(b)}'`, line, typeName(a) === 'str' || typeName(b) === 'str' ? 'You are comparing text with a number. Convert with int(...) first — input() always gives text.' : '');
}

// ── Seeded RNG ─────────────────────────────────────────────
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

// ── Turtle ─────────────────────────────────────────────────
export interface TurtleLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}
export interface TurtleState {
  lines: TurtleLine[];
  dots: { x: number; y: number; r: number; color: string }[];
  turtles: { x: number; y: number; heading: number; visible: boolean }[];
  bg: string;
  used: boolean;
}

// ── Scope ──────────────────────────────────────────────────
class Scope {
  vars = new Map<string, Val>();
  globals = new Set<string>();
  constructor(public parent: Scope | null) {}
  lookup(name: string): Val | undefined {
    let s: Scope | null = this;
    while (s) {
      if (s.vars.has(name)) return s.vars.get(name);
      s = s.parent;
    }
    return undefined;
  }
}

export interface RunOptions {
  inputs?: string[];
  maxSteps?: number;
  seed?: number;
  maxOutput?: number;
}
export interface RunResult {
  output: string;
  error?: { type: string; message: string; line: number; hint: string };
  needInput?: string; // the program is waiting for input() with this prompt
  steps: number;
  globals: Record<string, Val>;
  turtle: TurtleState;
  inputsUsed: number;
  calls: Record<string, number>;
  interp: Interp;
}

// ── Interpreter ────────────────────────────────────────────
export class Interp {
  out: string[] = [];
  outLen = 0;
  steps = 0;
  depth = 0;
  inputs: string[];
  inputsUsed = 0;
  maxSteps: number;
  maxOutput: number;
  rand: () => number;
  global = new Scope(null);
  builtins: Record<string, Val> = {};
  turtle: TurtleState = { lines: [], dots: [], turtles: [], bg: '#ffffff', used: false };
  calls: Record<string, number> = {};
  modules: Record<string, PyModule> = {};

  constructor(opts: RunOptions = {}) {
    this.inputs = [...(opts.inputs || [])];
    this.maxSteps = opts.maxSteps ?? 200_000;
    this.maxOutput = opts.maxOutput ?? 20_000;
    this.rand = rng(opts.seed ?? 42);
    this.setupBuiltins();
  }

  write(s: string) {
    this.outLen += s.length;
    if (this.outLen > this.maxOutput) throw new PyError('OutputLimit', 'Your program printed too much', 0, 'Is a loop printing forever? Check its condition.');
    this.out.push(s);
  }
  tick(line: number) {
    if (++this.steps > this.maxSteps) throw new PyError('TimeoutError', 'Your program ran for too long', line, 'This usually means an infinite loop. Check that your while condition can become False.');
  }

  setupBuiltins() {
    const B = (name: string, fn: PyBuiltin['fn']) => (this.builtins[name] = new PyBuiltin(name, fn));
    const need = (args: Val[], n: number, name: string, line: number, max = n) => {
      if (args.length < n || args.length > max) throw new PyError('TypeError', `${name}() takes ${n === max ? n : `${n} to ${max}`} argument${max === 1 ? '' : 's'} (${args.length} given)`, line);
    };
    B('print', (args, kw) => {
      const sep = kw.sep !== undefined ? str(kw.sep) : ' ';
      const end = kw.end !== undefined ? str(kw.end) : '\n';
      this.write(args.map(str).join(sep) + end);
      return null;
    });
    B('input', (args) => {
      const prompt = args.length ? str(args[0]) : '';
      if (this.inputsUsed >= this.inputs.length) throw new NeedInput(prompt);
      const a = this.inputs[this.inputsUsed++];
      this.write(prompt + a + '\n');
      return a;
    });
    B('len', (args, _k, line) => {
      need(args, 1, 'len', line);
      const x = args[0];
      if (typeof x === 'string') return [...x].length;
      if (x instanceof PyList || x instanceof PyTuple) return x.items.length;
      if (x instanceof PyDict) return x.map.size;
      if (x instanceof PyRange) return rangeLen(x);
      throw new PyError('TypeError', `object of type '${typeName(x)}' has no len()`, line, typeName(x) === 'int' ? 'Numbers don’t have a length. Did you mean len(str(x))?' : '');
    });
    B('range', (args, _k, line) => {
      need(args, 1, 'range', line, 3);
      for (const a of args) if (!(typeof a === 'number' || typeof a === 'boolean')) throw new PyError('TypeError', `'${typeName(a)}' object cannot be interpreted as an integer`, line, typeName(a) === 'str' ? 'range() needs a whole number. Use int(...) to convert text from input().' : 'range() needs whole numbers.');
      const n = args.map(numOf);
      const r = args.length === 1 ? new PyRange(0, n[0], 1) : new PyRange(n[0], n[1], n[2] ?? 1);
      if (r.step === 0) throw new PyError('ValueError', 'range() arg 3 must not be zero', line);
      return r;
    });
    B('int', (args, _k, line) => {
      if (!args.length) return 0;
      const x = args[0];
      if (typeof x === 'string') {
        const t = x.trim();
        if (!/^[+-]?\d+$/.test(t)) throw new PyError('ValueError', `invalid literal for int() with base 10: ${repr(x)}`, line, t === '' ? 'The text is empty — was nothing typed?' : /^[+-]?\d*\.\d+$/.test(t) ? 'That looks like a decimal. Use float(...) instead.' : 'int() can only turn digits like "42" into a number.');
        return parseInt(t, 10);
      }
      if (isNum(x)) return Math.trunc(numOf(x));
      throw new PyError('TypeError', `int() can't convert '${typeName(x)}'`, line);
    });
    B('float', (args, _k, line) => {
      if (!args.length) return new PyFloat(0);
      const x = args[0];
      if (typeof x === 'string') {
        const t = x.trim().toLowerCase();
        if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(t) && !['inf', '-inf', 'nan'].includes(t)) throw new PyError('ValueError', `could not convert string to float: ${repr(x)}`, line);
        return new PyFloat(t === 'inf' ? Infinity : t === '-inf' ? -Infinity : Number(t));
      }
      if (isNum(x)) return new PyFloat(numOf(x));
      throw new PyError('TypeError', `float() can't convert '${typeName(x)}'`, line);
    });
    B('str', (args) => (args.length ? str(args[0]) : ''));
    B('bool', (args) => (args.length ? truthy(args[0]) : false));
    B('repr', (args) => repr(args[0]));
    B('list', (args, _k, line) => new PyList(args.length ? this.iterate(args[0], line) : []));
    B('tuple', (args, _k, line) => new PyTuple(args.length ? this.iterate(args[0], line) : []));
    B('dict', (args, kw, line) => {
      const d = new PyDict();
      if (args.length) for (const p of this.iterate(args[0], line)) {
        const [k, v] = this.iterate(p, line);
        d.map.set(keyOf(k, line), [k, v]);
      }
      for (const [k, v] of Object.entries(kw)) d.map.set(keyOf(k, line), [k, v]);
      return d;
    });
    B('abs', (args, _k, line) => {
      need(args, 1, 'abs', line);
      return mkNum(Math.abs(numOf(this.needNum(args[0], line, 'abs'))), isFloat(args[0]));
    });
    B('round', (args, _k, line) => {
      const x = numOf(this.needNum(args[0], line, 'round'));
      if (args.length < 2 || args[1] === null) {
        const r = Math.round(x);
        return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; // banker's rounding like Python
      }
      const d = numOf(args[1]);
      const f = Math.pow(10, d);
      return new PyFloat(Math.round(x * f + Number.EPSILON * Math.sign(x)) / f);
    });
    const minmax = (name: string, pick: (c: number) => boolean) =>
      B(name, (args, kw, line) => {
        const items = args.length === 1 ? this.iterate(args[0], line) : args;
        if (!items.length) throw new PyError('ValueError', `${name}() arg is an empty sequence`, line);
        const key = kw.key;
        let best = items[0];
        let bk = key ? this.call(key, [best], {}, line) : best;
        for (const x of items.slice(1)) {
          const k = key ? this.call(key, [x], {}, line) : x;
          if (pick(cmpVals(k, bk, line))) (best = x), (bk = k);
        }
        return best;
      });
    minmax('min', (c) => c < 0);
    minmax('max', (c) => c > 0);
    B('sum', (args, _k, line) => {
      let total: Val = args.length > 1 ? args[1] : 0;
      for (const x of this.iterate(args[0], line)) total = this.binop('+', total, x, line);
      return total;
    });
    B('sorted', (args, kw, line) => {
      const items = this.iterate(args[0], line).slice();
      this.sortItems(items, kw, line);
      return new PyList(items);
    });
    B('reversed', (args, _k, line) => new PyList(this.iterate(args[0], line).slice().reverse()));
    B('enumerate', (args, kw, line) => {
      const start = numOf(args[1] ?? kw.start ?? 0);
      return new PyList(this.iterate(args[0], line).map((x, i) => new PyTuple([i + start, x])));
    });
    B('zip', (args, _k, line) => {
      const lists = args.map((a) => this.iterate(a, line));
      const n = Math.min(...lists.map((l) => l.length));
      return new PyList(Array.from({ length: n }, (_, i) => new PyTuple(lists.map((l) => l[i]))));
    });
    B('type', (args) => new PyClass(typeName(args[0]), new Map()));
    B('isinstance', (args) => {
      const t = args[1];
      const names = t instanceof PyTuple ? t.items.map((x) => (x as PyBuiltin).name || (x as PyClass).name) : [(t as PyBuiltin).name || (t as PyClass).name];
      return names.includes(typeName(args[0])) || (names.includes('float') && typeof args[0] === 'number' && false);
    });
    B('chr', (args) => String.fromCodePoint(numOf(args[0])));
    B('ord', (args, _k, line) => {
      const s = args[0];
      if (typeof s !== 'string' || [...s].length !== 1) throw new PyError('TypeError', 'ord() expected a character', line);
      return s.codePointAt(0)!;
    });
    B('any', (args, _k, line) => this.iterate(args[0], line).some(truthy));
    B('all', (args, _k, line) => this.iterate(args[0], line).every(truthy));
    B('map', (args, _k, line) => new PyList(this.iterate(args[1], line).map((x) => this.call(args[0], [x], {}, line))));
    B('filter', (args, _k, line) => new PyList(this.iterate(args[1], line).filter((x) => truthy(args[0] === null ? x : this.call(args[0], [x], {}, line)))));
    B('divmod', (args, _k, line) => new PyTuple([this.binop('//', args[0], args[1], line), this.binop('%', args[0], args[1], line)]));
    B('pow', (args, _k, line) => this.binop('**', args[0], args[1], line));
    for (const e of ['ValueError', 'TypeError', 'ZeroDivisionError', 'IndexError', 'KeyError', 'NameError', 'Exception', 'RuntimeError']) B(e, (args) => new PyTuple([e, args.length ? str(args[0]) : '']));
    this.modules.random = new PyModule('random', {
      randint: new PyBuiltin('randint', (a, _k, line) => {
        const lo = numOf(this.needNum(a[0], line, 'randint'));
        const hi = numOf(this.needNum(a[1], line, 'randint'));
        return lo + Math.floor(this.rand() * (hi - lo + 1));
      }),
      random: new PyBuiltin('random', () => new PyFloat(this.rand())),
      choice: new PyBuiltin('choice', (a, _k, line) => {
        const items = this.iterate(a[0], line);
        if (!items.length) throw new PyError('IndexError', 'cannot choose from an empty sequence', line);
        return items[Math.floor(this.rand() * items.length)];
      }),
      shuffle: new PyBuiltin('shuffle', (a, _k, line) => {
        const l = a[0];
        if (!(l instanceof PyList)) throw new PyError('TypeError', 'shuffle() needs a list', line);
        for (let i = l.items.length - 1; i > 0; i--) {
          const j = Math.floor(this.rand() * (i + 1));
          [l.items[i], l.items[j]] = [l.items[j], l.items[i]];
        }
        return null;
      }),
      uniform: new PyBuiltin('uniform', (a) => new PyFloat(numOf(a[0]) + this.rand() * (numOf(a[1]) - numOf(a[0])))),
      seed: new PyBuiltin('seed', (a) => ((this.rand = rng(numOf(a[0] ?? 1))), null)),
      sample: new PyBuiltin('sample', (a, _k, line) => {
        const items = this.iterate(a[0], line).slice();
        const k = numOf(a[1]);
        const out: Val[] = [];
        while (out.length < k && items.length) out.push(items.splice(Math.floor(this.rand() * items.length), 1)[0]);
        return new PyList(out);
      }),
    });
    const m1 = (f: (x: number) => number, float = true) => (a: Val[], _k: Record<string, Val>, line: number) => mkNum(f(numOf(this.needNum(a[0], line, 'math'))), float);
    this.modules.math = new PyModule('math', {
      pi: new PyFloat(Math.PI),
      e: new PyFloat(Math.E),
      sqrt: new PyBuiltin('sqrt', (a, k, line) => {
        if (numOf(a[0]) < 0) throw new PyError('ValueError', 'math domain error', line, 'You can’t take the square root of a negative number.');
        return m1(Math.sqrt)(a, k, line);
      }),
      floor: new PyBuiltin('floor', m1(Math.floor, false)),
      ceil: new PyBuiltin('ceil', m1(Math.ceil, false)),
      sin: new PyBuiltin('sin', m1(Math.sin)),
      cos: new PyBuiltin('cos', m1(Math.cos)),
      tan: new PyBuiltin('tan', m1(Math.tan)),
      radians: new PyBuiltin('radians', m1((x) => (x * Math.PI) / 180)),
      degrees: new PyBuiltin('degrees', m1((x) => (x * 180) / Math.PI)),
      fabs: new PyBuiltin('fabs', m1(Math.abs)),
      pow: new PyBuiltin('pow', (a) => new PyFloat(Math.pow(numOf(a[0]), numOf(a[1])))),
      hypot: new PyBuiltin('hypot', (a) => new PyFloat(Math.hypot(numOf(a[0]), numOf(a[1])))),
      gcd: new PyBuiltin('gcd', (a) => {
        let x = Math.abs(numOf(a[0]));
        let y = Math.abs(numOf(a[1]));
        while (y) [x, y] = [y, x % y];
        return x;
      }),
      factorial: new PyBuiltin('factorial', (a) => {
        let r = 1;
        for (let i = 2; i <= numOf(a[0]); i++) r *= i;
        return r;
      }),
    });
    this.modules.turtle = this.makeTurtleModule();
    this.modules.time = new PyModule('time', { sleep: new PyBuiltin('sleep', () => null), time: new PyBuiltin('time', () => new PyFloat(this.steps / 1000)) });
  }

  makeTurtleModule(): PyModule {
    const T = this.turtle;
    const make = () => {
      const st = { x: 0, y: 0, heading: 0, down: true, color: '#1d2230', width: 2, visible: true, fill: '' };
      T.turtles.push(st as any);
      const idx = T.turtles.length - 1;
      const sync = () => (T.turtles[idx] = { x: st.x, y: st.y, heading: st.heading, visible: st.visible });
      const moveTo = (nx: number, ny: number) => {
        T.used = true;
        if (st.down && T.lines.length < 20000) T.lines.push({ x1: st.x, y1: st.y, x2: nx, y2: ny, color: st.color, width: st.width });
        st.x = nx;
        st.y = ny;
        sync();
      };
      const fd = (d: number) => moveTo(st.x + d * Math.cos((st.heading * Math.PI) / 180), st.y + d * Math.sin((st.heading * Math.PI) / 180));
      const color = (a: Val[]) => (a.length ? (st.color = colorOf(a)) : null);
      const fns: Record<string, (a: Val[], kw: Record<string, Val>, line: number) => Val> = {
        forward: (a, _k, line) => (fd(numOf(this.needNum(a[0], line, 'forward'))), null),
        backward: (a, _k, line) => (fd(-numOf(this.needNum(a[0], line, 'backward'))), null),
        right: (a, _k, line) => ((st.heading -= numOf(this.needNum(a[0], line, 'right'))), sync(), null),
        left: (a, _k, line) => ((st.heading += numOf(this.needNum(a[0], line, 'left'))), sync(), null),
        penup: () => ((st.down = false), null),
        pendown: () => ((st.down = true), null),
        goto: (a, _k, line) => {
          const [x, y] = a.length === 1 ? this.iterate(a[0], line).map(numOf) : a.map(numOf);
          moveTo(x, y);
          return null;
        },
        setx: (a) => (moveTo(numOf(a[0]), st.y), null),
        sety: (a) => (moveTo(st.x, numOf(a[0])), null),
        setheading: (a) => ((st.heading = numOf(a[0])), sync(), null),
        home: () => (moveTo(0, 0), (st.heading = 0), sync(), null),
        color: (a) => color(a),
        pencolor: (a) => color(a),
        fillcolor: () => null,
        begin_fill: () => null,
        end_fill: () => null,
        pensize: (a) => ((st.width = numOf(a[0])), null),
        width: (a) => ((st.width = numOf(a[0])), null),
        speed: () => null,
        shape: () => null,
        hideturtle: () => ((st.visible = false), sync(), null),
        showturtle: () => ((st.visible = true), sync(), null),
        circle: (a, _k, line) => {
          const r = numOf(this.needNum(a[0], line, 'circle'));
          const extent = a.length > 1 ? numOf(a[1]) : 360;
          const n = Math.max(12, Math.min(72, Math.round(Math.abs(extent) / 5)));
          const step = (2 * Math.PI * Math.abs(r) * (Math.abs(extent) / 360)) / n;
          const turn = (extent / n) * Math.sign(r || 1);
          for (let i = 0; i < n; i++) {
            st.heading += turn / 2;
            fd(step);
            st.heading += turn / 2;
          }
          sync();
          return null;
        },
        dot: (a) => {
          T.used = true;
          T.dots.push({ x: st.x, y: st.y, r: a.length ? numOf(a[0]) / 2 : 3, color: a.length > 1 ? colorOf(a.slice(1)) : st.color });
          return null;
        },
        xcor: () => new PyFloat(st.x),
        ycor: () => new PyFloat(st.y),
        heading: () => new PyFloat(((st.heading % 360) + 360) % 360),
        position: () => new PyTuple([new PyFloat(st.x), new PyFloat(st.y)]),
        pos: () => new PyTuple([new PyFloat(st.x), new PyFloat(st.y)]),
        distance: (a) => new PyFloat(Math.hypot(numOf(a[0]) - st.x, numOf(a[1]) - st.y)),
        clear: () => ((T.lines.length = 0), null),
        write: () => null,
        stamp: () => null,
      };
      const alias: Record<string, string> = { fd: 'forward', bk: 'backward', back: 'backward', rt: 'right', lt: 'left', pu: 'penup', up: 'penup', pd: 'pendown', down: 'pendown', setpos: 'goto', setposition: 'goto', seth: 'setheading', ht: 'hideturtle', st: 'showturtle' };
      for (const [a, b] of Object.entries(alias)) fns[a] = fns[b];
      return Object.fromEntries(Object.entries(fns).map(([k, f]) => [k, new PyBuiltin(k, f)]));
    };
    const main = make();
    const screen = new PyModule('Screen', {
      bgcolor: new PyBuiltin('bgcolor', (a) => ((T.bg = colorOf(a)), null)),
      title: new PyBuiltin('title', () => null),
      setup: new PyBuiltin('setup', () => null),
      exitonclick: new PyBuiltin('exitonclick', () => null),
      mainloop: new PyBuiltin('mainloop', () => null),
      tracer: new PyBuiltin('tracer', () => null),
      update: new PyBuiltin('update', () => null),
    });
    return new PyModule('turtle', {
      ...main,
      Turtle: new PyBuiltin('Turtle', () => new PyModule('Turtle', make())),
      Screen: new PyBuiltin('Screen', () => screen),
      bgcolor: (screen.attrs as any).bgcolor,
      done: new PyBuiltin('done', () => null),
      mainloop: new PyBuiltin('mainloop', () => null),
      exitonclick: new PyBuiltin('exitonclick', () => null),
    });
  }

  needNum(x: Val, line: number, fn: string): Val {
    if (!isNum(x)) throw new PyError('TypeError', `${fn}() needs a number, not '${typeName(x)}'`, line, typeName(x) === 'str' ? 'This is text. Turn it into a number with int(...) or float(...).' : '');
    return x;
  }

  sortItems(items: Val[], kw: Record<string, Val>, line: number) {
    const key = kw.key && kw.key !== null ? kw.key : null;
    const keys = new Map<Val, Val>();
    const k = (x: Val) => (key ? (keys.has(x) ? keys.get(x)! : (keys.set(x, this.call(key, [x], {}, line)), keys.get(x)!)) : x);
    const decorated = items.map((x, i) => ({ x, k: k(x), i }));
    decorated.sort((a, b) => cmpVals(a.k, b.k, line) || a.i - b.i);
    if (kw.reverse && truthy(kw.reverse)) decorated.reverse();
    items.splice(0, items.length, ...decorated.map((d) => d.x));
  }

  iterate(x: Val, line: number): Val[] {
    if (x instanceof PyList || x instanceof PyTuple) return x.items.slice();
    if (typeof x === 'string') return [...x];
    if (x instanceof PyRange) {
      const n = rangeLen(x);
      if (n > 1_000_000) throw new PyError('MemoryError', 'range is too big', line);
      return Array.from({ length: n }, (_, i) => x.start + i * x.step);
    }
    if (x instanceof PyDict) return [...x.map.values()].map(([k]) => k);
    throw new PyError('TypeError', `'${typeName(x)}' object is not iterable`, line, typeName(x) === 'int' ? 'To loop a number of times, use range(n).' : '');
  }

  // ── statements ──
  exec(body: Stmt[], scope: Scope) {
    for (const s of body) this.stmt(s, scope);
  }
  stmt(s: Stmt, scope: Scope): void {
    this.tick(s.line);
    switch (s.k) {
      case 'expr':
        this.eval(s.e, scope);
        return;
      case 'assign': {
        const v = this.eval(s.v, scope);
        for (const t of s.targets) this.assign(t, v, scope);
        return;
      }
      case 'aug': {
        const cur = this.eval(s.target, scope);
        const v = this.eval(s.v, scope);
        if (cur instanceof PyList && s.op === '+') {
          cur.items.push(...this.iterate(v, s.line));
          return;
        }
        this.assign(s.target, this.binop(s.op, cur, v, s.line), scope);
        return;
      }
      case 'if':
        if (truthy(this.eval(s.c, scope))) this.exec(s.body, scope);
        else this.exec(s.orelse, scope);
        return;
      case 'while':
        while (truthy(this.eval(s.c, scope))) {
          this.tick(s.line);
          try {
            this.exec(s.body, scope);
          } catch (e) {
            if (e instanceof BreakSig) break;
            if (e instanceof ContinueSig) continue;
            throw e;
          }
        }
        return;
      case 'for': {
        const items = this.iterate(this.eval(s.iter, scope), s.line);
        for (const it of items) {
          this.tick(s.line);
          this.assign(s.target, it, scope);
          try {
            this.exec(s.body, scope);
          } catch (e) {
            if (e instanceof BreakSig) break;
            if (e instanceof ContinueSig) continue;
            throw e;
          }
        }
        return;
      }
      case 'def':
        this.setVar(scope, s.name, new PyFunc(s.name, s.params.map((p) => ({ ...p, defVal: p.def ? this.eval(p.def, scope) : undefined }) as any), s.body, scope));
        return;
      case 'class': {
        const cs = new Scope(scope);
        this.exec(s.body, cs);
        this.setVar(scope, s.name, new PyClass(s.name, cs.vars));
        return;
      }
      case 'return':
        throw new ReturnSig(s.v ? this.eval(s.v, scope) : null);
      case 'break':
        throw new BreakSig();
      case 'continue':
        throw new ContinueSig();
      case 'pass':
        return;
      case 'global':
        for (const n of s.names) scope.globals.add(n);
        return;
      case 'import':
        for (const [n, as] of s.names) this.setVar(scope, as.split('.')[0], this.module(n, s.line));
        return;
      case 'from': {
        const m = this.module(s.mod, s.line);
        for (const [n, as] of s.names) {
          if (n === '*') for (const [k, v] of Object.entries(m.attrs)) this.setVar(scope, k, v);
          else {
            if (!(n in m.attrs)) throw new PyError('ImportError', `cannot import name '${n}' from '${s.mod}'`, s.line);
            this.setVar(scope, as, m.attrs[n]);
          }
        }
        return;
      }
      case 'raise': {
        const v = s.e ? this.eval(s.e, scope) : new PyTuple(['RuntimeError', '']);
        if (v instanceof PyTuple && typeof v.items[0] === 'string') throw new PyError(v.items[0] as string, str(v.items[1]), s.line);
        throw new PyError('Exception', str(v), s.line);
      }
      case 'try': {
        try {
          this.exec(s.body, scope);
        } catch (e) {
          if (!(e instanceof PyError) || ['TimeoutError', 'OutputLimit', 'RecursionError'].includes(e.type)) throw e;
          const h = s.handlers.find((h) => !h.type || h.type === e.type || h.type === 'Exception');
          if (!h) throw e;
          if (h.as) this.setVar(scope, h.as, e.message);
          this.exec(h.body, scope);
        } finally {
          if (s.fin.length) this.exec(s.fin, scope);
        }
        return;
      }
    }
  }
  module(name: string, line: number): PyModule {
    const m = this.modules[name];
    if (!m) throw new PyError('ModuleNotFoundError', `No module named '${name}'`, line, 'The Python Lab supports random, math, turtle and time.');
    if (name === 'turtle') this.turtle.used = true;
    return m;
  }
  setVar(scope: Scope, name: string, v: Val) {
    if (scope.globals.has(name)) this.global.vars.set(name, v);
    else scope.vars.set(name, v);
  }
  assign(t: Expr, v: Val, scope: Scope) {
    switch (t.k) {
      case 'name':
        this.setVar(scope, t.id, v);
        return;
      case 'tuple':
      case 'list': {
        const items = this.iterate(v, t.line);
        if (items.length !== t.items.length) throw new PyError('ValueError', `${items.length > t.items.length ? 'too many' : 'not enough'} values to unpack (expected ${t.items.length}, got ${items.length})`, t.line);
        t.items.forEach((x, i) => this.assign(x, items[i], scope));
        return;
      }
      case 'sub': {
        const o = this.eval(t.o, scope);
        const i = this.eval(t.i, scope);
        if (o instanceof PyList) {
          if (t.i.k === 'slice') {
            const [a, b] = this.sliceBounds(t.i, o.items.length, scope);
            o.items.splice(a, Math.max(0, b - a), ...this.iterate(v, t.line));
            return;
          }
          o.items[this.index(i, o.items.length, t.line)] = v;
          return;
        }
        if (o instanceof PyDict) {
          o.map.set(keyOf(i, t.line), [i, v]);
          return;
        }
        throw new PyError('TypeError', `'${typeName(o)}' object does not support item assignment`, t.line, typeName(o) === 'str' ? 'Text can’t be changed letter by letter. Build a new string instead.' : '');
      }
      case 'attr': {
        const o = this.eval(t.o, scope);
        if (o instanceof PyObject) {
          o.attrs.set(t.name, v);
          return;
        }
        throw new PyError('AttributeError', `can't set attribute '${t.name}'`, t.line);
      }
    }
    throw new PyError('SyntaxError', 'cannot assign to this', t.line);
  }
  index(i: Val, n: number, line: number): number {
    if (!(typeof i === 'number' || typeof i === 'boolean')) throw new PyError('TypeError', `indices must be integers, not '${typeName(i)}'`, line, typeName(i) === 'str' ? 'Use a number for the position, e.g. items[0]. Convert input with int(...).' : '');
    let k = numOf(i);
    if (k < 0) k += n;
    if (k < 0 || k >= n) throw new PyError('IndexError', 'index out of range', line, `Positions go from 0 to ${n - 1}${n === 0 ? ' — but it’s empty!' : ''}. Remember Python counts from 0.`);
    return k;
  }
  sliceBounds(sl: Extract<Expr, { k: 'slice' }>, n: number, scope: Scope): [number, number, number] {
    const step = sl.c ? numOf(this.eval(sl.c, scope)) : 1;
    if (step === 0) throw new PyError('ValueError', 'slice step cannot be zero', sl.line);
    const norm = (e: Expr | undefined, def: number) => {
      if (!e) return def;
      const v = this.eval(e, scope);
      if (v === null) return def;
      let k = numOf(v);
      if (k < 0) k += n;
      return step > 0 ? Math.max(0, Math.min(n, k)) : Math.max(-1, Math.min(n - 1, k));
    };
    return [norm(sl.a, step > 0 ? 0 : n - 1), norm(sl.b, step > 0 ? n : -1), step];
  }

  // ── expressions ──
  eval(e: Expr, scope: Scope): Val {
    switch (e.k) {
      case 'num':
        return e.float ? new PyFloat(e.v) : e.v;
      case 'str':
        return e.v;
      case 'const':
        return e.v;
      case 'fstr':
        return e.parts.map((p) => (typeof p === 'string' ? p : formatSpec(this.eval(p.e, scope), p.spec, e.line))).join('');
      case 'name': {
        const v = scope.lookup(e.id);
        if (v !== undefined) return v;
        if (e.id in this.builtins) return this.builtins[e.id];
        const near = [...scope.vars.keys(), ...this.global.vars.keys(), ...Object.keys(this.builtins)].find((k) => k.toLowerCase() === e.id.toLowerCase() || lev(k, e.id) === 1);
        throw new PyError('NameError', `name '${e.id}' is not defined`, e.line, near ? `Did you mean '${near}'?` : /^(print|input)$/i.test(e.id) ? 'Python is case-sensitive: use lowercase.' : 'Check the spelling, and make sure you gave it a value before this line. Text needs quotes: "like this".');
      }
      case 'bin':
        return this.binop(e.op, this.eval(e.a, scope), this.eval(e.b, scope), e.line);
      case 'un': {
        const a = this.eval(e.a, scope);
        if (e.op === 'not') return !truthy(a);
        if (!isNum(a)) throw new PyError('TypeError', `bad operand type for unary ${e.op}: '${typeName(a)}'`, e.line);
        return e.op === '-' ? mkNum(-numOf(a), isFloat(a)) : mkNum(numOf(a), isFloat(a));
      }
      case 'bool': {
        const a = this.eval(e.a, scope);
        if (e.op === 'and') return truthy(a) ? this.eval(e.b, scope) : a;
        return truthy(a) ? a : this.eval(e.b, scope);
      }
      case 'cmp': {
        let left = this.eval(e.items[0], scope);
        for (let i = 0; i < e.ops.length; i++) {
          const right = this.eval(e.items[i + 1], scope);
          if (!this.compare(e.ops[i], left, right, e.line)) return false;
          left = right;
        }
        return true;
      }
      case 'ifexp':
        return truthy(this.eval(e.c, scope)) ? this.eval(e.a, scope) : this.eval(e.b, scope);
      case 'list':
        return new PyList(e.items.map((x) => this.eval(x, scope)));
      case 'tuple':
        return new PyTuple(e.items.map((x) => this.eval(x, scope)));
      case 'dict': {
        const d = new PyDict();
        for (const [k, v] of e.items) {
          const kv = this.eval(k, scope);
          d.map.set(keyOf(kv, e.line), [kv, this.eval(v, scope)]);
        }
        return d;
      }
      case 'comp': {
        const out: Val[] = [];
        const cs = new Scope(scope);
        for (const it of this.iterate(this.eval(e.iter, scope), e.line)) {
          this.tick(e.line);
          this.assign(e.target, it, cs);
          if (!e.cond || truthy(this.eval(e.cond, cs))) out.push(this.eval(e.elt, cs));
        }
        return new PyList(out);
      }
      case 'lambda':
        return new PyFunc('<lambda>', e.params.map((p) => ({ ...p, defVal: p.def ? this.eval(p.def, scope) : undefined }) as any), [{ k: 'return', v: e.body, line: e.line }], scope, true);
      case 'attr':
        return this.getattr(this.eval(e.o, scope), e.name, e.line);
      case 'sub': {
        const o = this.eval(e.o, scope);
        if (e.i.k === 'slice') {
          if (typeof o === 'string' || o instanceof PyList || o instanceof PyTuple) {
            const items = typeof o === 'string' ? [...o] : o.items;
            const [a, b, step] = this.sliceBounds(e.i, items.length, scope);
            const out: Val[] = [];
            for (let i = a; step > 0 ? i < b : i > b; i += step) out.push(items[i]);
            return typeof o === 'string' ? out.join('') : o instanceof PyTuple ? new PyTuple(out) : new PyList(out);
          }
          throw new PyError('TypeError', `'${typeName(o)}' object is not subscriptable`, e.line);
        }
        const i = this.eval(e.i, scope);
        if (o instanceof PyList || o instanceof PyTuple) return o.items[this.index(i, o.items.length, e.line)];
        if (typeof o === 'string') return [...o][this.index(i, [...o].length, e.line)];
        if (o instanceof PyRange) return o.start + this.index(i, rangeLen(o), e.line) * o.step;
        if (o instanceof PyDict) {
          const hit = o.map.get(keyOf(i, e.line));
          if (!hit) throw new PyError('KeyError', repr(i), e.line, `That key isn’t in the dictionary. Use .get(${repr(i)}) to avoid this error, or check with: if ${repr(i)} in ...`);
          return hit[1];
        }
        throw new PyError('TypeError', `'${typeName(o)}' object is not subscriptable`, e.line, typeName(o) === 'int' ? 'You can’t use [ ] on a number.' : '');
      }
      case 'call': {
        if (e.f.k === 'attr') {
          const o = this.eval(e.f.o, scope);
          const args = e.args.map((a) => this.eval(a, scope));
          const kw = Object.fromEntries(e.kw.map(([k, v]) => [k, this.eval(v, scope)]));
          const m = this.method(o, e.f.name, args, kw, e.line);
          if (m !== undefined) return m;
          return this.call(this.getattr(o, e.f.name, e.line), args, kw, e.line);
        }
        const f = this.eval(e.f, scope);
        const args = e.args.map((a) => this.eval(a, scope));
        const kw = Object.fromEntries(e.kw.map(([k, v]) => [k, this.eval(v, scope)]));
        return this.call(f, args, kw, e.line);
      }
      case 'slice':
        throw new PyError('SyntaxError', 'invalid slice', e.line);
    }
  }

  compare(op: string, a: Val, b: Val, line: number): boolean {
    switch (op) {
      case '==':
        return eq(a, b);
      case '!=':
        return !eq(a, b);
      case 'is':
        return a === b || (a === null && b === null);
      case 'is not':
        return !(a === b || (a === null && b === null));
      case 'in':
      case 'not in': {
        let r: boolean;
        if (typeof b === 'string') {
          if (typeof a !== 'string') throw new PyError('TypeError', "'in <string>' requires string as left operand", line);
          r = b.includes(a);
        } else if (b instanceof PyDict) r = b.map.has(keyOf(a, line));
        else r = this.iterate(b, line).some((x) => eq(x, a));
        return op === 'in' ? r : !r;
      }
    }
    const c = cmpVals(a, b, line);
    return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
  }

  binop(op: string, a: Val, b: Val, line: number): Val {
    if (isNum(a) && isNum(b)) {
      const x = numOf(a);
      const y = numOf(b);
      const f = isFloat(a) || isFloat(b);
      switch (op) {
        case '+':
          return mkNum(x + y, f);
        case '-':
          return mkNum(x - y, f);
        case '*':
          return mkNum(x * y, f);
        case '/':
          if (y === 0) throw new PyError('ZeroDivisionError', 'division by zero', line, 'You can’t divide by zero. Check the value before dividing.');
          return new PyFloat(x / y);
        case '//':
          if (y === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero', line);
          return mkNum(Math.floor(x / y), f);
        case '%':
          if (y === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero', line);
          return mkNum(((x % y) + y) % y, f);
        case '**': {
          const r = Math.pow(x, y);
          return mkNum(r, f || y < 0);
        }
      }
    }
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (a instanceof PyList && b instanceof PyList) return new PyList([...a.items, ...b.items]);
      if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple([...a.items, ...b.items]);
      if (typeof a === 'string' || typeof b === 'string')
        throw new PyError('TypeError', typeof a === 'string' ? `can only concatenate str (not "${typeName(b)}") to str` : `unsupported operand type(s) for +: '${typeName(a)}' and 'str'`, line, typeof a === 'string' ? `Text and numbers can’t be added. To do maths with text from input(), convert it first: int(...). To join a number onto text, use str(...) or an f-string: f"... {value}".` : 'If this text came from input(), turn it into a number with int(...).');
    }
    if (op === '*') {
      if (typeof a === 'string' && (typeof b === 'number' || typeof b === 'boolean')) return a.repeat(Math.max(0, numOf(b)));
      if (typeof b === 'string' && (typeof a === 'number' || typeof a === 'boolean')) return b.repeat(Math.max(0, numOf(a)));
      if (a instanceof PyList && typeof b === 'number') return new PyList(Array.from({ length: Math.max(0, b) }, () => a.items).flat());
    }
    if (op === '%' && typeof a === 'string') {
      const vals = b instanceof PyTuple ? b.items : [b];
      let k = 0;
      return a.replace(/%(\.\d+)?[sdif%]/g, (m, prec) => (m === '%%' ? '%' : formatSpec(vals[k++], prec ? prec + 'f' : m.endsWith('d') ? 'd' : '', line)));
    }
    throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`, line, typeName(a) === 'str' || typeName(b) === 'str' ? 'One side is text. If it came from input(), convert it with int(...) or float(...).' : '');
  }

  getattr(o: Val, name: string, line: number): Val {
    if (o instanceof PyModule) {
      if (name in o.attrs) return o.attrs[name];
      throw new PyError('AttributeError', `module '${o.name}' has no attribute '${name}'`, line);
    }
    if (o instanceof PyObject) {
      if (o.attrs.has(name)) return o.attrs.get(name)!;
      const m = o.cls.attrs.get(name);
      if (m instanceof PyFunc) return new PyBound(o, m);
      if (m !== undefined) return m;
    }
    if (o instanceof PyClass && o.attrs.has(name)) return o.attrs.get(name)!;
    // bound built-in methods (e.g. f = items.append)
    if (METHODS[typeName(o)]?.includes(name)) return new PyBound(o, new PyBuiltin(name, (args, kw, l) => this.method(o, name, args, kw, l) as Val));
    throw new PyError('AttributeError', `'${typeName(o)}' object has no attribute '${name}'`, line, attrHint(typeName(o), name));
  }

  /** Built-in methods on str/list/dict. Returns undefined if not a built-in method. */
  method(o: Val, name: string, args: Val[], kw: Record<string, Val>, line: number): Val | undefined {
    if (typeof o === 'string') {
      const s = o;
      switch (name) {
        case 'upper':
          return s.toUpperCase();
        case 'lower':
          return s.toLowerCase();
        case 'title':
          return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
        case 'capitalize':
          return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
        case 'strip':
          return args.length ? trimChars(s, str(args[0]), 3) : s.trim();
        case 'lstrip':
          return args.length ? trimChars(s, str(args[0]), 1) : s.replace(/^\s+/, '');
        case 'rstrip':
          return args.length ? trimChars(s, str(args[0]), 2) : s.replace(/\s+$/, '');
        case 'split': {
          if (!args.length || args[0] === null) return new PyList(s.split(/\s+/).filter(Boolean));
          return new PyList(s.split(str(args[0])));
        }
        case 'join':
          return this.iterate(args[0], line)
            .map((x) => {
              if (typeof x !== 'string') throw new PyError('TypeError', `sequence item: expected str instance, ${typeName(x)} found`, line, 'join() only joins text. Convert numbers with str(...) first.');
              return x;
            })
            .join(s);
        case 'replace':
          return s.split(str(args[0])).join(str(args[1]));
        case 'startswith':
          return s.startsWith(str(args[0]));
        case 'endswith':
          return s.endsWith(str(args[0]));
        case 'find':
          return s.indexOf(str(args[0]));
        case 'index': {
          const i = s.indexOf(str(args[0]));
          if (i < 0) throw new PyError('ValueError', 'substring not found', line);
          return i;
        }
        case 'count':
          return str(args[0]) === '' ? s.length + 1 : s.split(str(args[0])).length - 1;
        case 'isdigit':
        case 'isnumeric':
          return /^\d+$/.test(s);
        case 'isalpha':
          return /^\p{L}+$/u.test(s);
        case 'isalnum':
          return /^[\p{L}\d]+$/u.test(s);
        case 'isupper':
          return /\p{Lu}/u.test(s) && s === s.toUpperCase();
        case 'islower':
          return /\p{Ll}/u.test(s) && s === s.toLowerCase();
        case 'isspace':
          return /^\s+$/.test(s);
        case 'swapcase':
          return [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
        case 'center':
        case 'ljust':
        case 'rjust': {
          const w = numOf(args[0]);
          const fill = args.length > 1 ? str(args[1]) : ' ';
          const pad = Math.max(0, w - s.length);
          if (name === 'ljust') return s + fill.repeat(pad);
          if (name === 'rjust') return fill.repeat(pad) + s;
          return fill.repeat(Math.floor(pad / 2)) + s + fill.repeat(Math.ceil(pad / 2));
        }
        case 'zfill':
          return s.padStart(numOf(args[0]), '0');
        case 'format': {
          let k = 0;
          return s.replace(/\{(\w*)(?::([^}]*))?\}/g, (_m, key, spec) => {
            const v = key === '' ? args[k++] : /^\d+$/.test(key) ? args[Number(key)] : kw[key];
            return formatSpec(v ?? null, spec || '', line);
          });
        }
      }
      return undefined;
    }
    if (o instanceof PyList) {
      const l = o.items;
      switch (name) {
        case 'append':
          if (args.length !== 1) throw new PyError('TypeError', `append() takes exactly one argument (${args.length} given)`, line, 'To add several items, call append() for each, or use extend([...]).');
          if (l.length > 100_000) throw new PyError('MemoryError', 'list is too big', line);
          l.push(args[0]);
          return null;
        case 'extend':
          l.push(...this.iterate(args[0], line));
          return null;
        case 'insert': {
          let i = numOf(args[0]);
          if (i < 0) i = Math.max(0, l.length + i);
          l.splice(Math.min(i, l.length), 0, args[1]);
          return null;
        }
        case 'pop': {
          if (!l.length) throw new PyError('IndexError', 'pop from empty list', line);
          const i = args.length ? this.index(args[0], l.length, line) : l.length - 1;
          return l.splice(i, 1)[0];
        }
        case 'remove': {
          const i = l.findIndex((x) => eq(x, args[0]));
          if (i < 0) throw new PyError('ValueError', 'list.remove(x): x not in list', line, 'Check it’s in the list first: if x in my_list: ...');
          l.splice(i, 1);
          return null;
        }
        case 'index': {
          const i = l.findIndex((x) => eq(x, args[0]));
          if (i < 0) throw new PyError('ValueError', `${repr(args[0])} is not in list`, line);
          return i;
        }
        case 'count':
          return l.filter((x) => eq(x, args[0])).length;
        case 'sort':
          this.sortItems(l, kw, line);
          return null;
        case 'reverse':
          l.reverse();
          return null;
        case 'copy':
          return new PyList(l.slice());
        case 'clear':
          l.length = 0;
          return null;
      }
      return undefined;
    }
    if (o instanceof PyTuple) {
      if (name === 'count') return o.items.filter((x) => eq(x, args[0])).length;
      if (name === 'index') return o.items.findIndex((x) => eq(x, args[0]));
      return undefined;
    }
    if (o instanceof PyDict) {
      const d = o.map;
      switch (name) {
        case 'get': {
          const hit = d.get(keyOf(args[0], line));
          return hit ? hit[1] : args.length > 1 ? args[1] : null;
        }
        case 'keys':
          return new PyList([...d.values()].map(([k]) => k));
        case 'values':
          return new PyList([...d.values()].map(([, v]) => v));
        case 'items':
          return new PyList([...d.values()].map(([k, v]) => new PyTuple([k, v])));
        case 'pop': {
          const key = keyOf(args[0], line);
          const hit = d.get(key);
          if (!hit) {
            if (args.length > 1) return args[1];
            throw new PyError('KeyError', repr(args[0]), line);
          }
          d.delete(key);
          return hit[1];
        }
        case 'update': {
          const src = args[0];
          if (src instanceof PyDict) for (const [k, v] of src.map) d.set(k, v);
          for (const [k, v] of Object.entries(kw)) d.set(keyOf(k, line), [k, v]);
          return null;
        }
        case 'setdefault': {
          const key = keyOf(args[0], line);
          if (!d.has(key)) d.set(key, [args[0], args[1] ?? null]);
          return d.get(key)![1];
        }
        case 'copy': {
          const c = new PyDict();
          for (const [k, v] of d) c.map.set(k, v);
          return c;
        }
        case 'clear':
          d.clear();
          return null;
      }
      return undefined;
    }
    return undefined;
  }

  call(f: Val, args: Val[], kw: Record<string, Val>, line: number): Val {
    if (f instanceof PyBuiltin) return f.fn(args, kw, line);
    if (f instanceof PyBound) return this.call(f.fn, [f.self, ...args], kw, line);
    if (f instanceof PyClass) {
      const obj = new PyObject(f);
      const init = f.attrs.get('__init__');
      if (init instanceof PyFunc) this.call(init, [obj, ...args], kw, line);
      return obj;
    }
    if (f instanceof PyFunc) {
      if (++this.depth > 300) {
        this.depth = 0;
        throw new PyError('RecursionError', 'maximum recursion depth exceeded', line, 'A function keeps calling itself without stopping. Check its base case.');
      }
      this.calls[f.name] = (this.calls[f.name] || 0) + 1;
      const scope = new Scope(f.closure);
      const params = f.params as (Param & { defVal?: Val })[];
      const positional = params.filter((p) => !p.star);
      const star = params.find((p) => p.star);
      if (args.length > positional.length && !star) throw new PyError('TypeError', `${f.name}() takes ${positional.length} positional argument${positional.length === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`, line);
      positional.forEach((p, i) => {
        if (i < args.length) scope.vars.set(p.name, args[i]);
        else if (p.name in kw) scope.vars.set(p.name, kw[p.name]);
        else if (p.defVal !== undefined) scope.vars.set(p.name, p.defVal);
        else throw new PyError('TypeError', `${f.name}() missing required argument: '${p.name}'`, line, `Call it with a value for ${p.name}, like ${f.name}(...).`);
      });
      if (star) scope.vars.set(star.name, new PyTuple(args.slice(positional.length)));
      for (const k of Object.keys(kw)) if (!positional.some((p) => p.name === k)) throw new PyError('TypeError', `${f.name}() got an unexpected keyword argument '${k}'`, line);
      try {
        this.exec(f.body, scope);
        return null;
      } catch (e) {
        if (e instanceof ReturnSig) return e.value;
        if (e instanceof BreakSig || e instanceof ContinueSig) throw new PyError('SyntaxError', "'break' or 'continue' outside loop", line);
        throw e;
      } finally {
        this.depth--;
      }
    }
    throw new PyError('TypeError', `'${typeName(f)}' object is not callable`, line, typeName(f) === 'str' ? 'Did you use a variable with the same name as a function (like print or input)?' : '');
  }
}

const METHODS: Record<string, string[]> = {
  str: ['upper', 'lower', 'title', 'capitalize', 'strip', 'lstrip', 'rstrip', 'split', 'join', 'replace', 'startswith', 'endswith', 'find', 'index', 'count', 'isdigit', 'isnumeric', 'isalpha', 'isalnum', 'isupper', 'islower', 'isspace', 'swapcase', 'center', 'ljust', 'rjust', 'zfill', 'format'],
  list: ['append', 'extend', 'insert', 'pop', 'remove', 'index', 'count', 'sort', 'reverse', 'copy', 'clear'],
  dict: ['get', 'keys', 'values', 'items', 'pop', 'update', 'setdefault', 'copy', 'clear'],
  tuple: ['count', 'index'],
};
function attrHint(type: string, name: string): string {
  if (type === 'list' && name === 'add') return 'Lists use .append(x) to add an item.';
  if (type === 'list' && name === 'length') return 'Use len(my_list) to get the length.';
  if (type === 'str' && name === 'append') return 'Strings can’t be changed. Build a new one with + instead.';
  if (type === 'int' || type === 'float') return 'Numbers don’t have methods like that. Did you mean to use a string or list?';
  const near = (METHODS[type] || []).find((m) => lev(m, name) <= 2);
  return near ? `Did you mean .${near}()?` : '';
}
function trimChars(s: string, chars: string, mode: number) {
  let a = 0;
  let b = s.length;
  if (mode & 1) while (a < b && chars.includes(s[a])) a++;
  if (mode & 2) while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}
function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const COLOR_NAMES: Record<string, string> = { red: '#e5484d', blue: '#3b82f6', green: '#16a34a', yellow: '#eab308', orange: '#f97316', purple: '#9333ea', pink: '#ec4899', black: '#1d2230', white: '#ffffff', gray: '#6b7280', grey: '#6b7280', brown: '#92400e', cyan: '#06b6d4', magenta: '#d946ef', gold: '#ca8a04', navy: '#1e3a8a', violet: '#7c3aed', lime: '#65a30d', teal: '#0d9488' };
function colorOf(a: Val[]): string {
  if (a.length >= 3 && a.every(isNum)) {
    const [r, g, b] = a.map(numOf).map((x) => (x <= 1 ? Math.round(x * 255) : Math.round(x)));
    return `rgb(${r},${g},${b})`;
  }
  const s = String(a[0] ?? 'black').toLowerCase();
  if (/^#[0-9a-f]{3,8}$/.test(s)) return s;
  return COLOR_NAMES[s] || '#1d2230';
}
export function formatSpec(v: Val, spec: string, line: number): string {
  if (!spec) return str(v);
  const m = spec.match(/^(?:(.)?([<>^]))?([+])?(0)?(\d+)?(,)?(?:\.(\d+))?([fdse%])?$/);
  if (!m) return str(v);
  const [, fill = ' ', align, plus, zero, width, comma, prec, type] = m;
  let s: string;
  if (type === 'f' || type === '%' || (prec !== undefined && type !== 's')) {
    if (!isNum(v)) throw new PyError('ValueError', `Unknown format code 'f' for object of type '${typeName(v)}'`, line, 'Only numbers can be formatted with .2f — convert with float(...) first.');
    const n = numOf(v) * (type === '%' ? 100 : 1);
    s = n.toFixed(prec !== undefined ? Number(prec) : 6) + (type === '%' ? '%' : '');
  } else if (type === 'd') {
    if (!isNum(v)) throw new PyError('ValueError', `Unknown format code 'd' for object of type '${typeName(v)}'`, line);
    s = String(Math.trunc(numOf(v)));
  } else s = str(v);
  if (comma) s = s.replace(/^(-?\d+)/, (d) => d.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  if (plus && isNum(v) && numOf(v) >= 0) s = '+' + s;
  if (width) {
    const w = Number(width);
    const pad = Math.max(0, w - s.length);
    if (zero && !align) s = (s.startsWith('-') ? '-' : '') + '0'.repeat(pad) + s.replace(/^-/, '');
    else {
      const al = align || (isNum(v) ? '>' : '<');
      s = al === '<' ? s + fill.repeat(pad) : al === '>' ? fill.repeat(pad) + s : fill.repeat(Math.floor(pad / 2)) + s + fill.repeat(Math.ceil(pad / 2));
    }
  }
  return s;
}

/** Run a program. Never throws: errors are returned in the result. */
export function runPython(src: string, opts: RunOptions = {}): RunResult {
  const it = new Interp(opts);
  let error: RunResult['error'];
  let needInput: string | undefined;
  try {
    if (src.length > 50_000) throw new PyError('SyntaxError', 'program is too long', 0);
    const prog = parse(src);
    it.exec(prog, it.global);
  } catch (e) {
    if (e instanceof NeedInput) needInput = e.prompt;
    else if (e instanceof PyError) error = { type: e.type, message: e.message, line: e.line, hint: e.hint };
    else if (e instanceof ReturnSig) error = { type: 'SyntaxError', message: "'return' outside function", line: 0, hint: 'return can only be used inside a def.' };
    else if (e instanceof BreakSig || e instanceof ContinueSig) error = { type: 'SyntaxError', message: "'break' outside loop", line: 0, hint: '' };
    else if (e instanceof RangeError) error = { type: 'RecursionError', message: 'maximum recursion depth exceeded', line: 0, hint: 'A function keeps calling itself without stopping.' };
    else error = { type: 'InternalError', message: String((e as Error)?.message || e), line: 0, hint: '' };
  }
  if (needInput !== undefined) it.out.push(needInput);
  const globals: Record<string, Val> = {};
  for (const [k, v] of it.global.vars) globals[k] = v;
  return { output: it.out.join(''), error, needInput, steps: it.steps, globals, turtle: it.turtle, inputsUsed: it.inputsUsed, calls: it.calls, interp: it };
}

/** Convert a Python value to plain JSON-ish data (for checks and display). */
export function toPlain(v: Val): unknown {
  if (v instanceof PyFloat) return v.v;
  if (v instanceof PyList || v instanceof PyTuple) return v.items.map(toPlain);
  if (v instanceof PyDict) return Object.fromEntries([...v.map.values()].map(([k, x]) => [str(k), toPlain(x)]));
  if (v instanceof PyRange) return [...Array(Math.max(0, Math.ceil((v.stop - v.start) / v.step)))].map((_, i) => v.start + i * v.step);
  if (typeof v === 'object' && v !== null) return str(v);
  return v;
}
/** Convert plain data (from a check definition) to a Python value. */
export function fromPlain(x: unknown): Val {
  if (x === null || x === undefined) return null;
  if (typeof x === 'number') return Number.isInteger(x) ? x : new PyFloat(x);
  if (typeof x === 'string' || typeof x === 'boolean') return x;
  if (Array.isArray(x)) return new PyList(x.map(fromPlain));
  if (typeof x === 'object') {
    const d = new PyDict();
    for (const [k, v] of Object.entries(x as object)) d.map.set('s:' + k, [k, fromPlain(v)]);
    return d;
  }
  return null;
}
