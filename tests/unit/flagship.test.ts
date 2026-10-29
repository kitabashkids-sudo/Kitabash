// Flagship course + Code Lab: content is valid, every coding solution passes its own checks,
// starter code does NOT already pass, the VM behaves like Scratch, and unsafe projects are rejected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLAGSHIPS } from '../../src/lib/library/flagship/all.ts';
import { expandFlagLesson, lessonsOf, lintFlagship, captionsVtt } from '../../src/lib/library/flagship/expand.ts';
import { gradeActivity } from '../../src/lib/activities/registry.ts';
import { checkProject, runChecks, VM, type Project } from '../../src/lib/scratch/vm.ts';

const REFLECTION = 'I am proud of my game because I fixed a bug where the apple got stuck at the bottom. My friend said it was too easy so I made the apple fall faster and added a sound.';

test('flagship courses pass every content check (incl. every puzzle and Code Lab solution)', () => {
  for (const c of FLAGSHIPS) assert.deepEqual(lintFlagship(c), []);
});

test('flagship structure: 4 modules × 3 lessons, projects, videos, worksheets, plans', () => {
  for (const c of FLAGSHIPS) {
    assert.equal(c.modules.length, 4);
    for (const m of c.modules) {
      assert.equal(m.lessons.length, 3);
      assert.ok(m.lessons[2].project, `${m.title} ends with a project`);
    }
    for (const l of lessonsOf(c)) {
      assert.ok(l.video.scenes.length >= 4, `${l.title}: video`);
      assert.ok(captionsVtt(l).startsWith('WEBVTT'), `${l.title}: captions`);
      assert.ok(l.build && l.build.steps.length >= 5, `${l.title}: build-along`);
      assert.ok(l.acts.filter((a) => 'lab' in a || 'puzzle' in a || 'py' in a).length >= 1, `${l.title}: at least one coding activity`);
      assert.ok(l.worksheet.tasks.length >= 3, `${l.title}: worksheet`);
    }
  }
});

test('intended answers score full marks; starter code and empty programs do not', () => {
  const failures: string[] = [];
  for (const c of FLAGSHIPS)
    for (const l of lessonsOf(c)) {
      const L = expandFlagLesson(c, l);
      for (const a of L.activities as any[]) {
        const k = a.answer_key;
        let good: any;
        let bad: any = null;
        if (a.type === 'multiple_choice') good = { selected: k.correct };
        else if (a.type === 'fill_blank') good = { answers: Object.fromEntries(Object.entries(k.blanks).map(([b, xs]: any) => [b, xs[0]])) };
        else if (a.type === 'ordering') good = { order: k.order };
        else if (a.type === 'matching') good = { pairs: k.pairs };
        else if (a.type === 'categorize') good = { placement: k.placement };
        else if (a.type === 'block_code') {
          good = { program: k.solution };
          bad = { program: a.config.start || { hat: 'flag', blocks: [] } };
        } else if (a.type === 'code_lab') {
          good = { project: k.solution, reflection: REFLECTION };
          bad = { project: a.config.project, reflection: REFLECTION };
        } else if (a.type === 'python_lab') {
          good = { code: k.solution, reflection: REFLECTION };
          bad = { code: a.config.starter, reflection: REFLECTION };
        } else continue;
        const g = gradeActivity(a.type, a.points, a.config, k, good);
        if (!g.correct) failures.push(`${l.title} / ${a.title}: intended answer failed — ${g.feedback}`);
        if (bad) {
          const b = gradeActivity(a.type, a.points, a.config, k, bad);
          if (b.correct) failures.push(`${l.title} / ${a.title}: the starting code already passes`);
        }
      }
    }
  assert.deepEqual(failures, []);
});

const n = (v: number) => ({ k: 'num' as const, v });

test('VM: a repeat loop with the pen draws a closed square; keys, clicks and messages work', () => {
  const p: Project = {
    vars: ['score'],
    sprites: [
      {
        name: 'Pip',
        costumes: ['🤖'],
        x: 0,
        y: 0,
        scripts: [
          { hat: { type: 'flag' }, blocks: [{ op: 'penDown' }, { op: 'repeat', a: n(4), body: [{ op: 'move', a: n(100) }, { op: 'turnR', a: n(90) }] }, { op: 'penUp' }] },
          { hat: { type: 'key', key: 'space' }, blocks: [{ op: 'changeVar', name: 'score', a: n(1) }, { op: 'broadcast', name: 'hi' }] },
        ],
      },
      { name: 'Friend', costumes: ['🐱'], x: 100, y: 100, scripts: [{ hat: { type: 'receive', msg: 'hi' }, blocks: [{ op: 'say', a: { k: 'str', v: 'Hello Pip' } }] }] },
    ],
  };
  const r = runChecks(p, { seconds: 2, keys: [{ at: 1, key: 'space' }] }, [
    { t: 'pen', closed: true, sides: 4, msg: 'square' },
    { t: 'var', name: 'score', cmp: '=', value: 1, msg: 'score' },
    { t: 'said', sprite: 'Friend', text: 'hello', msg: 'message' },
  ]);
  assert.deepEqual(r.messages, []);
  // A forever loop yields every frame, so it never freezes the page.
  const vm = new VM({ sprites: [{ name: 'A', costumes: ['A'], x: 0, y: 0, scripts: [{ hat: { type: 'flag' }, blocks: [{ op: 'forever', body: [] }] }] }] });
  vm.greenFlag();
  for (let i = 0; i < 100; i++) vm.step();
  assert.equal(vm.frame, 100);
});

test('VM: untrusted projects are sanitised or rejected', () => {
  assert.throws(() => checkProject({ sprites: [{ name: 'x', costumes: ['a'], x: 0, y: 0, scripts: [{ hat: { type: 'flag' }, blocks: [{ op: 'eval' }] }] }] }), /Unknown block/);
  assert.throws(() => checkProject({ sprites: [] }), /1 to 10 sprites/);
  const big = { sprites: [{ name: 'x', costumes: ['a'], x: 0, y: 0, scripts: [{ hat: { type: 'flag' }, blocks: Array.from({ length: 700 }, () => ({ op: 'move', a: n(1) })) }] }] };
  assert.throws(() => checkProject(big), /too many blocks/);
  const clean = checkProject({ sprites: [{ name: '<script>', costumes: ['🤖'], x: 99999, y: 0, scripts: [{ hat: { type: 'key', key: 'space"><img>' }, blocks: [{ op: 'say', a: { k: 'str', v: 'x'.repeat(500) } }] }] }] });
  assert.equal(clean.sprites[0].name, 'script');
  assert.equal(clean.sprites[0].x, 240);
  assert.equal((clean.sprites[0].scripts[0].blocks[0].a as any).v.length, 80);
  assert.ok(!/[<>"]/.test((clean.sprites[0].scripts[0].hat as any).key));
});

test('VM: clones, lists and My Blocks behave like Scratch', () => {
  const p: Project = {
    lists: ['words'],
    vars: ['n'],
    sprites: [
      {
        name: 'Star',
        costumes: ['⭐'],
        x: 0,
        y: 150,
        scripts: [
          { hat: { type: 'flag' }, blocks: [{ op: 'hide' }, { op: 'repeat', a: n(5), body: [{ op: 'createClone' }, { op: 'wait', a: n(0.1) }] }, { op: 'listAdd', name: 'words', a: { k: 'str', v: 'cat' } }, { op: 'listAdd', name: 'words', a: { k: 'str', v: 'dog' } }, { op: 'call', name: 'jump', a: n(3) }] },
          { hat: { type: 'clone' }, blocks: [{ op: 'show' }, { op: 'repeat', a: n(10), body: [{ op: 'changeY', a: n(-10) }] }, { op: 'deleteClone' }] },
          { hat: { type: 'define', name: 'jump', param: 'times' }, blocks: [{ op: 'setVar', name: 'n', a: { k: 'op', op: '*', a: { k: 'param', name: 'times' }, b: n(2) } }] },
        ],
      },
    ],
  };
  const r = runChecks(p, { seconds: 2 }, [
    { t: 'clonesMade', min: 5, msg: 'clones' },
    { t: 'listLength', name: 'words', cmp: '=', value: 2, msg: 'list' },
    { t: 'var', name: 'n', cmp: '=', value: 6, msg: 'param' },
    { t: 'defines', msg: 'defines' },
  ]);
  assert.deepEqual(r.messages, []);
  const vm = new VM(p);
  vm.greenFlag();
  for (let i = 0; i < 60; i++) vm.step();
  assert.equal(vm.sprites.filter((s) => s.clone && !s.deleted).length, 0, 'clones delete themselves');
  vm.greenFlag();
  assert.equal(vm.sprites.length, 1, 'the green flag removes clones');
});
