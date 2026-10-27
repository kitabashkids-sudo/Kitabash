import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeActivity, validateActivity, ACTIVITY_TYPES, isRunnable } from '../../src/lib/activities/registry.ts';

test('multiple choice: correct, wrong with targeted misconception feedback', () => {
  const c = { question: 'q', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] };
  const k = { correct: ['a'], explanation: 'yes', feedbackByOption: { b: 'B is a trap' } };
  assert.equal(gradeActivity('multiple_choice', 10, c, k, { selected: ['a'] }).score, 10);
  const wrong = gradeActivity('multiple_choice', 10, c, k, { selected: ['b'] });
  assert.equal(wrong.score, 0);
  assert.equal(wrong.feedback, 'B is a trap');
});

test('code_output preset grades as multiple choice', () => {
  const c = { question: 'out?', code: 'print(1+1)', options: [{ id: 'a', text: '2' }, { id: 'b', text: '11' }] };
  assert.equal(gradeActivity('code_output', 5, c, { correct: ['a'] }, { selected: ['a'] }).correct, true);
});

test('fill blank: case/punctuation-insensitive, partial credit', () => {
  const c = { text: '[[1]] you help me, [[2]]?' };
  const k = { blanks: { '1': ['Could', 'can'], '2': ['please'] } };
  const r = gradeActivity('fill_blank', 10, c, k, { answers: { '1': ' could ', '2': 'PLEASE!' } });
  assert.equal(r.correct, true);
  const half = gradeActivity('fill_blank', 10, c, k, { answers: { '1': 'would', '2': 'please' } });
  assert.equal(half.score, 5);
});

test('ordering, matching, categorize partial credit', () => {
  assert.equal(gradeActivity('ordering', 8, { items: [{ id: 'a' }, { id: 'b' }] }, { order: ['a', 'b'] }, { order: ['b', 'a'] }).score, 0);
  assert.equal(gradeActivity('matching', 10, { left: [{ id: 'l1' }, { id: 'l2' }], right: [] }, { pairs: { l1: 'r1', l2: 'r2' } }, { pairs: { l1: 'r1', l2: 'x' } }).score, 5);
  const cat = gradeActivity('categorize', 4, { buckets: [{ id: 'n' }, { id: 'w' }], items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] }, { placement: { a: 'n', b: 'w', c: 'n', d: 'w' }, explanations: { d: 'D is a want' } }, { placement: { a: 'n', b: 'w', c: 'n', d: 'n' } });
  assert.equal(cat.score, 3);
  assert.match(cat.feedback, /D is a want/);
});

test('budget simulation: needs, budget and savings all checked', () => {
  const c = { budget: 100, currency: '₹', items: [{ id: 'n', name: 'Need', cost: 40 }, { id: 'w', name: 'Want', cost: 50 }] };
  const k = { required: ['n'], minSavings: 20 };
  assert.equal(gradeActivity('budget_sim', 15, c, k, { chosen: ['n'] }).correct, true);
  const over = gradeActivity('budget_sim', 15, c, k, { chosen: ['n', 'w'] });
  assert.equal(over.correct, false);
  assert.match(over.feedback, /savings/);
  assert.match(gradeActivity('budget_sim', 15, c, k, { chosen: ['w'] }).feedback, /missed an essential: Need/);
});

test('tracing: good trace passes, scribble fails, offline flagged for review', () => {
  const guide = [[[20, 50], [80, 50]]];
  const good = gradeActivity('tracing', 10, { guide, tolerance: 8 }, { minCoverage: 0.7, minPrecision: 0.5 }, { strokes: [Array.from({ length: 30 }, (_, i) => [20 + i * 2, 51])] });
  assert.equal(good.correct, true);
  const bad = gradeActivity('tracing', 10, { guide, tolerance: 8 }, { minCoverage: 0.7 }, { strokes: [[[10, 10], [12, 12], [15, 14], [18, 10]]] });
  assert.equal(bad.correct, false);
  assert.equal(gradeActivity('tracing', 10, { guide }, { minCoverage: 0.7 }, { offline: true }).needsReview, true);
});

test('free response is always flagged for teacher review', () => {
  const r = gradeActivity('free_response', 10, { prompt: 'p', minWords: 3 }, { keywords: ['need'] }, { text: 'I need water because it keeps me healthy' });
  assert.equal(r.needsReview, true);
  assert.ok(r.score > 5);
  assert.equal(gradeActivity('free_response', 10, { prompt: 'p', minWords: 10 }, {}, { text: 'too short' }).score, 0);
});

test('validation rejects broken configs and extension-only types', () => {
  assert.throws(() => validateActivity('multiple_choice', { question: 'q', options: [{ id: 'a' }] }, { correct: ['a'] }), /at least 2 options/);
  assert.throws(() => validateActivity('multiple_choice', { question: 'q', options: [{ id: 'a' }, { id: 'b' }] }, { correct: ['z'] }), /unknown option/);
  assert.throws(() => validateActivity('coding_sandbox', {}, {}), /developer-built/);
  assert.equal(isRunnable('coding_sandbox'), false);
  for (const t of Object.values(ACTIVITY_TYPES)) if (t.example) validateActivity(t.type, t.example.config, t.example.answer_key);
});
