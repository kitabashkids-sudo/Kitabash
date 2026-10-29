// Python Lab: the interpreter matches real Python on a broad sample, errors are friendly,
// input() works by replay, checks grade fairly, and runaway programs are stopped safely.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPython } from '../../src/lib/python/interp.ts';
import { constructs, runChecks } from '../../src/lib/python/checks.ts';

const out = (src: string, inputs: string[] = []) => {
  const r = runPython(src, { inputs });
  assert.equal(r.error, undefined, JSON.stringify(r.error));
  return r.output;
};

test('core Python behaves like CPython', () => {
  assert.equal(out('print(7 / 2, 7 // 2, 7 % 2, 2 ** 3, 6 / 2, -7 // 2, -7 % 3)'), '3.5 3 1 8 3.0 -4 2\n');
  assert.equal(out('print(0.1 + 0.2, 1e20, 0.00001, round(2.5), round(3.14159, 2))'), '0.30000000000000004 1e+20 1e-05 2 3.14\n');
  assert.equal(out('n = "Asha"\nprint(f"Hi {n}! {3.14159:.2f} {7:>3}|{42:05d}")'), 'Hi Asha! 3.14   7|00042\n');
  assert.equal(out('xs = [3, 1, 2]\nxs.append(5)\nprint(xs, sorted(xs), xs[::-1], xs[1:3], len(xs), sum(xs), 2 in xs)'), '[3, 1, 2, 5] [1, 2, 3, 5] [5, 2, 1, 3] [1, 2] 4 11 True\n');
  assert.equal(out('d = {"a": 1}\nd["b"] = 2\nprint(d, d.get("z", 0), list(d.keys()))\nfor k, v in d.items():\n    print(k, v)'), "{'a': 1, 'b': 2} 0 ['a', 'b']\na 1\nb 2\n");
  assert.equal(out('def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(10))'), '3628800\n');
  assert.equal(out('print([i * i for i in range(6) if i % 2 == 0], "-".join(["a", "b"]), "  Hi ".strip().upper())'), '[0, 4, 16] a-b HI\n');
  assert.equal(out('a, b = 1, 2\na, b = b, a\nprint(a, b, 1 < 2 < 3, None, "{} {}".format("x", 9))'), '2 1 True None x 9\n');
  assert.equal(out('class Dog:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return self.name + " says woof"\nprint(Dog("Rex").speak())'), 'Rex says woof\n');
  assert.equal(out('try:\n    print(1 / 0)\nexcept ZeroDivisionError:\n    print("caught")'), 'caught\n');
  assert.equal(out('i = 0\nwhile True:\n    i += 1\n    if i == 2:\n        continue\n    if i > 3:\n        break\n    print(i)'), '1\n3\n');
});

test('friendly errors point to the line with a hint', () => {
  const e = (src: string, inputs: string[] = []) => runPython(src, { inputs, maxSteps: 20000 }).error!;
  assert.match(e('if x > 1\n    print(x)').hint, /colon/);
  assert.equal(e('for i in range(3):\nprint(i)').type, 'IndentationError');
  assert.match(e('prnt("hi")').hint, /print/);
  assert.match(e('print("a" + 5)').hint, /str\(/);
  const ti = e('age = input()\nprint(age + 1)', ['9']);
  assert.equal(ti.type, 'TypeError');
  assert.equal(ti.line, 2);
  assert.match(ti.hint, /int\(/);
  assert.match(e('xs = [1]\nprint(xs[3])').hint, /counts from 0/);
  assert.equal(e('print(“hi”)').type, 'SyntaxError');
});

test('input() is replayed: the program pauses for answers and resumes', () => {
  const src = 'name = input("Name? ")\nage = int(input("Age? "))\nprint(f"{name} is {age + 1} next year")';
  const r1 = runPython(src);
  assert.equal(r1.needInput, 'Name? ');
  const r2 = runPython(src, { inputs: ['Mia'] });
  assert.equal(r2.needInput, 'Age? ');
  assert.equal(runPython(src, { inputs: ['Mia', '9'] }).output, 'Name? Mia\nAge? 9\nMia is 10 next year\n');
});

test('runaway programs are stopped safely', () => {
  assert.equal(runPython('while True:\n    pass', { maxSteps: 5000 }).error!.type, 'TimeoutError');
  assert.equal(runPython('while True:\n    print("x")').error!.type, 'OutputLimit');
  assert.equal(runPython('def f():\n    return f()\nf()').error!.type, 'RecursionError');
  assert.equal(runPython('import os').error!.type, 'ModuleNotFoundError');
});

test('checks: output, functions, constructs and turtle', () => {
  const code = 'def double(n):\n    return n * 2\nname = input("Name? ")\nfor i in range(3):\n    print(f"Hi {name}")\n';
  const r = runChecks(code, [
    { t: 'output', lines: ['hi sam', 'hi sam', 'hi sam'], inputs: ['Sam'], msg: 'greets three times' },
    { t: 'func', name: 'double', cases: [{ args: [4], expect: 8 }, { args: [0.5], expect: 1 }], msg: 'double works' },
    { t: 'uses', what: ['for', 'def', 'fstring', 'input'], msg: 'uses the right tools' },
  ]);
  assert.ok(r.passed, JSON.stringify(r.results));
  const bad = runChecks('def double(n):\n    print(n * 2)', [{ t: 'func', name: 'double', cases: [{ args: [2], expect: 4 }], msg: 'returns' }]);
  assert.match(bad.results[0].detail!, /forget return/);
  const sq = runChecks('import turtle\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(100)\n    t.right(90)', [{ t: 'turtle', closed: true, sides: 4, msg: 'square' }]);
  assert.ok(sq.passed, JSON.stringify(sq.results));
  assert.ok(constructs('for i in range(3):\n    for j in range(2):\n        pass').has('nested-loop'));
  assert.ok(constructs('def f(n):\n    return f(n - 1) if n else 0').has('recursion'));
});
