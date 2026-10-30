// Scratch Gr 6–8 Advanced · Module 2 — Sorting algorithms. Project: Live Leaderboard.
import type { Stmt, Val } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, answer, ask, call, changeVar, define, gt, ifThen, item, join, lengthOf, listAdd, listDeleteAll, listReplace, lt, n, onFlag, op, param, project, repeat, say, sayFor, setVar, sprite, t, vr } from '../scratch-3-5/lab.ts';

const sorter = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Sorter', ['🤖'], 0, -40, scripts, { size: 140 });
const fill = (list: string, xs: (number | string)[]) => [listDeleteAll(list), ...xs.map((x) => listAdd(list, x))];
const next = (i: Val): Val => op('+', i, 1);
/** swap (i): swaps item i and item i + 1 of `list` using temp. */
const swapDef = (list: string) => define('swap', 'i', setVar('temp', item(list, param('i'))), listReplace(list, param('i'), item(list, next(param('i')))), listReplace(list, next(param('i')), vr('temp')));
/** One bubble pass over `list` (ascending if asc, else descending). */
const pass = (list: string, asc = true): Stmt[] => [
  setVar('j', 1),
  { op: 'repeat', a: op('-', lengthOf(list), 1), body: [changeVar('comparisons', 1), ifThen((asc ? gt : lt)(item(list, vr('j')), item(list, next(vr('j')))), call('swap', vr('j'))), changeVar('j', 1)] },
];
const bubble = (list: string, asc = true): Stmt[] => [setVar('comparisons', 0), { op: 'repeat', a: op('-', lengthOf(list), 1), body: pass(list, asc) }];

export const J4 = lesson(4, {
  title: 'Swapping and the Bubble Pass',
  objective: 'Swap two list items safely with a temporary variable, and write one bubble-sort pass that moves the largest value to the end.',
  concept: 'Swapping and comparisons',
  hook: ['word', '🥤🧃 ↔', 'how do you swap two drinks?'],
  intro: 'Sorting is everywhere — search results, leaderboards, your music by artist. It starts with one small move: the swap.',
  cards: [
    { emoji: '🫗', title: 'The swap problem', body: 'To swap two cups of juice you need a third, empty cup. Code is the same: copy one value into temp first, or it gets overwritten.', blocks: 'set [temp v] to (item (1) of [scores v])\nreplace item (1) of [scores v] with (item (2) of [scores v])\nreplace item (2) of [scores v] with (temp)' },
    { emoji: '🫧', title: 'A bubble pass', body: 'Compare each pair of neighbours from left to right. If they’re in the wrong order, swap them. After one pass, the biggest value has “bubbled” to the end.' },
    { emoji: '🧱', title: 'swap (i) as a procedure', body: 'Put the three swap blocks in a My Block with an input i. It swaps item i and item i + 1. Now the pass is easy to read.', blocks: 'define swap (i)\nset [temp v] to (item (i) of [scores v])\nreplace item (i) of [scores v] with (item ((i) + (1)) of [scores v])\nreplace item ((i) + (1)) of [scores v] with (temp)' },
    { emoji: '🔢', title: 'How many comparisons?', body: 'A list of n items has n − 1 neighbouring pairs, so one pass makes n − 1 comparisons.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'scores = [5, 3, 8, 1]\nfor j in range(len(scores) - 1):\n    if scores[j] > scores[j + 1]:\n        scores[j], scores[j + 1] = scores[j + 1], scores[j]\nprint(scores)', lang: 'python', output: '[3, 5, 1, 8]', say: ['Python can swap in one line — but underneath, it still needs somewhere to keep a value while it moves the other.'] }],
  build: {
    title: 'Swap, then one pass',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Data', text: 'Fill scores with 5, 3, 8, 1.' },
      { title: 'Swap two', text: 'temp = item 1; replace item 1 with item 2; replace item 2 with temp.' },
      { title: 'Make it a block', text: 'Move the three blocks into swap (i), using i and i + 1.' },
      { title: 'One pass', text: 'j from 1, repeat (length − 1): if item j > item j + 1, swap (j); change j by 1.' },
      { title: 'Check', text: 'Is the biggest number now last?', tip: 'Watch the list on the stage while it runs.' },
    ],
  },
  acts: [
    {
      lab: 'Safe swap: scores holds 5, 3, 8, 1. Swap item 1 and item 2 using a temp variable, so the list becomes 3, 5, 8, 1.',
      title: 'Code Lab: swap two items',
      start: project([sorter([onFlag(...fill('scores', [5, 3, 8, 1]))])], { lists: ['scores'], vars: ['temp'] }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['List is 3, 5, 8, 1', { t: 'listIs', name: 'scores', values: [3, 5, 8, 1], msg: 'temp = item 1; replace item 1 with item 2; replace item 2 with temp.' }],
        ['Uses replace item', { t: 'uses', ops: ['listReplace'], msg: 'Use “replace item … of scores with …”.' }],
        ['Uses temp', { t: 'usesVar', name: 'temp', msg: 'Save item 1 in temp first, or it gets overwritten.' }],
      ],
      test: { seconds: 2 },
      solution: project([sorter([onFlag(...fill('scores', [5, 3, 8, 1]), setVar('temp', item('scores', 1)), listReplace('scores', 1, item('scores', 2)), listReplace('scores', 2, vr('temp')))])], { lists: ['scores'], vars: ['temp'] }),
      explain: 'A safe swap — the building block of sorting.',
      hints: ['Order matters: save to temp FIRST.', 'replace item is in the Variables category with the list blocks.'],
    },
    {
      bmcq: 'This swap gives 3, 3, 8, 1 instead of 3, 5, 8, 1. Why?',
      blocks: 'replace item (1) of [scores v] with (item (2) of [scores v])\nreplace item (2) of [scores v] with (item (1) of [scores v])',
      options: ['Item 1 was overwritten before it was copied — it needs a temp variable', 'The items should be swapped in reverse order', 'replace item doesn’t work with numbers'],
      answer: 0,
      why: 'After the first block, item 1 is already 3, so the 5 is lost.',
      title: 'Debug the swap',
    },
    {
      lab: 'One bubble pass: swap (i) is defined for you. Set j to 1 and repeat (length of scores − 1): if item j > item j + 1, call swap (j); change j by 1. The list 5, 3, 8, 1 should become 3, 5, 1, 8.',
      title: 'Code Lab: one bubble pass',
      start: project([sorter([swapDef('scores'), onFlag(...fill('scores', [5, 3, 8, 1]))])], { lists: ['scores'], vars: ['temp', 'j', 'comparisons'] }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['After one pass: 3, 5, 1, 8', { t: 'listIs', name: 'scores', values: [3, 5, 1, 8], msg: 'Compare each neighbour pair once, left to right, swapping when the left one is bigger.' }],
        ['Uses swap', { t: 'defines', msg: 'Call swap (j) inside the loop.' }],
        ['3 comparisons', { t: 'var', name: 'comparisons', cmp: '=', value: 3, msg: 'Repeat (length − 1) times and change comparisons by 1 each time.' }],
      ],
      test: { seconds: 2 },
      solution: project([sorter([swapDef('scores'), onFlag(...fill('scores', [5, 3, 8, 1]), setVar('comparisons', 0), ...pass('scores'))])], { lists: ['scores'], vars: ['temp', 'j', 'comparisons'] }),
      explain: 'The 8 bubbled to the end — one pass done!',
      hints: ['Repeat ((length of scores) - 1).', 'Condition: (item (j) of scores) > (item ((j) + 1) of scores).'],
      phase: 'probe',
    },
    { write: 'Explain why a swap needs a temporary variable. Use the juice-cup idea or your own example.', keywords: ['temp', 'overwrite', 'swap'], exemplar: 'If you copy item 2 into item 1 first, the old value of item 1 is overwritten and lost. A temp variable is like an empty cup: you pour item 1 into it, move item 2 across, then pour the temp back into position 2.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Swapping requires a temporary store to avoid overwriting. A bubble pass compares adjacent pairs (n−1 comparisons), swapping out-of-order pairs, moving the maximum to the end. Procedures with a parameter (swap (i)) improve readability.',
    analogy: 'Swapping two drinks needs a third cup.',
    vocab: [
      ['swap', 'Exchange two values.'],
      ['temporary variable', 'A variable that holds a value briefly.'],
      ['pass', 'One trip through the list comparing neighbours.'],
      ['adjacent', 'Next to each other.'],
    ],
    demo: 'Show the broken swap (3, 3, 8, 1), then fix it with temp.',
    unplugged: 'Human bubble pass (5 min): five learners holding numbers; compare neighbours and swap places.',
    prompts: [
      ['Why save to temp first?', 'Otherwise the value is overwritten.'],
      ['Where is the largest value after one pass?', 'At the end.'],
      ['How many comparisons for 10 items?', '9.'],
    ],
    support: 'Provide swap (i); learners write the pass loop.',
    stretch: 'Count the swaps as well as the comparisons.',
    mis: [
      ['Two replace blocks swap values', 'Without temp one value is lost.'],
      ['One pass sorts the list', 'It only moves the largest to the end.'],
    ],
    successCriteria: ['I can swap two items with a temp variable.', 'I can write one bubble pass.', 'I can explain what a pass achieves.'],
    homework: 'Sort 6 playing cards by hand using bubble passes. How many passes did you need?',
    exit: 'After one bubble pass, where is the largest value?',
  },
});

export const J5 = lesson(5, {
  title: 'Bubble Sort and Efficiency',
  objective: 'Complete bubble sort with nested loops, sort in either order, and measure how the number of comparisons grows with the list size.',
  concept: 'Sorting and complexity',
  hook: ['word', '5 3 8 1 → 1 3 5 8', 'pass after pass'],
  cards: [
    { emoji: '🔁', title: 'Repeat the pass', body: 'One pass puts the largest at the end. Repeat the pass (n − 1) times and every value reaches its place: that’s bubble sort.', blocks: 'repeat ((length of [scores v]) - (1))\nset [j v] to (1)\nrepeat ((length of [scores v]) - (1))\nif <(item (j) of [scores v]) > (item ((j) + (1)) of [scores v])> then\nswap (j) :: myblocks\nend\nchange [j v] by (1)\nend\nend' },
    { emoji: '↕️', title: 'Ascending or descending', body: 'Change > to < and the list sorts biggest-first — perfect for a leaderboard.' },
    { emoji: '📈', title: 'It grows fast', body: 'Bubble sort makes about n × n comparisons. Double the list and the work roughly quadruples. For 1,000 items that’s about a million comparisons.' },
    { emoji: '⚡', title: 'Faster sorts exist', body: 'Real apps use cleverer sorts (like merge sort) that take about n × log n steps. Bubble sort is great for learning because it’s easy to see.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'n = len(scores)\nfor p in range(n - 1):\n    for j in range(n - 1):\n        if scores[j] > scores[j + 1]:\n            scores[j], scores[j + 1] = scores[j + 1], scores[j]', lang: 'python', say: ['Nested loops in Python: the outer loop repeats the pass, the inner loop compares neighbours.'] }],
  build: {
    title: 'Full bubble sort',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Start from your pass', text: 'Use swap (i) and the pass loop from Lesson 4.' },
      { title: 'Outer loop', text: 'Wrap the pass in repeat (length − 1).' },
      { title: 'Reset j', text: 'Set j to 1 at the start of every pass (inside the outer loop).' },
      { title: 'Count', text: 'Change comparisons by 1 inside the inner loop.' },
      { title: 'Measure', text: 'Sort 4, 8 and 16 items. How do the comparisons grow?', tip: 'Forgetting to reset j is the most common bug.' },
    ],
  },
  acts: [
    {
      lab: 'Bubble sort: swap (i) is defined. Sort scores (5, 3, 8, 1, 9, 2) into ascending order with nested loops, counting comparisons.',
      title: 'Code Lab: bubble sort',
      start: project([sorter([swapDef('scores'), onFlag(...fill('scores', [5, 3, 8, 1, 9, 2]))])], { lists: ['scores'], vars: ['temp', 'j', 'comparisons'] }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Sorted: 1, 2, 3, 5, 8, 9', { t: 'listIs', name: 'scores', values: [1, 2, 3, 5, 8, 9], msg: 'Repeat the pass (length − 1) times, resetting j to 1 each pass.' }],
        ['Nested loops', { t: 'nested', msg: 'Put the pass loop inside an outer repeat.' }],
        ['25 comparisons', { t: 'var', name: 'comparisons', cmp: '=', value: 25, msg: '5 passes × 5 comparisons = 25. Count inside the inner loop.' }],
      ],
      test: { seconds: 4 },
      solution: project([sorter([swapDef('scores'), onFlag(...fill('scores', [5, 3, 8, 1, 9, 2]), ...bubble('scores'), say(join(t('Comparisons: '), vr('comparisons'))))])], { lists: ['scores'], vars: ['temp', 'j', 'comparisons'] }),
      explain: 'Sorted! And you measured exactly how much work it took.',
      hints: ['set j to 1 goes INSIDE the outer loop, before the inner loop.'],
    },
    {
      lab: 'Leaderboard order: sort points (40, 90, 10, 70) from biggest to smallest (descending): 90, 70, 40, 10.',
      title: 'Code Lab: sort descending',
      start: project([sorter([swapDef('points'), onFlag(...fill('points', [40, 90, 10, 70]))])], { lists: ['points'], vars: ['temp', 'j', 'comparisons'] }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Sorted: 90, 70, 40, 10', { t: 'listIs', name: 'points', values: [90, 70, 40, 10], msg: 'Same bubble sort, but swap when item j < item j + 1.' }],
        ['Nested loops', { t: 'nested', msg: 'Outer loop for passes, inner loop for pairs.' }],
      ],
      test: { seconds: 3 },
      solution: project([sorter([swapDef('points'), onFlag(...fill('points', [40, 90, 10, 70]), ...bubble('points', false))])], { lists: ['points'], vars: ['temp', 'j', 'comparisons'] }),
      explain: 'Flip one comparison and the order flips too.',
      hints: ['Change the > in the condition to <.'],
    },
    { mcq: 'Bubble sort makes about n × n comparisons. If 10 items take ~100 comparisons, about how many for 100 items?', options: ['~10,000', '~1,000', '~200'], answer: 0, why: '10× the items → about 100× the work (quadratic growth).', title: 'Quadratic growth', phase: 'probe' },
    { write: 'Bubble sort is easy but slow for big lists. Explain why, and say where a slow sort might still be fine to use.', keywords: ['comparisons', 'list', 'slow'], exemplar: 'Bubble sort compares every pair again and again, so the number of comparisons grows with the square of the list size. For a million items that would be far too slow. For a short list, like a class leaderboard of 30 players, it is fast enough and easy to understand.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Bubble sort = (n−1) passes of adjacent comparisons; O(n²) comparisons. Reset inner index each pass. Direction of comparison determines order. Contrast with O(n log n) sorts conceptually.',
    analogy: 'Bubbles rising in a fizzy drink: big ones rise first.',
    vocab: [
      ['bubble sort', 'Repeated passes of neighbour swaps.'],
      ['nested loop', 'A loop inside a loop.'],
      ['ascending / descending', 'Smallest-first / biggest-first.'],
      ['quadratic', 'Work grows with the square of the input.'],
    ],
    demo: 'Sort 4, then 8 items; tabulate comparisons (9, 49) and discuss growth.',
    unplugged: 'Human bubble sort (5 min): six learners sort themselves by birthday using passes.',
    prompts: [
      ['Why reset j each pass?', 'Each pass starts at the beginning.'],
      ['How do you sort descending?', 'Swap the comparison.'],
      ['Why is bubble sort slow on big lists?', 'About n² comparisons.'],
    ],
    support: 'Provide the pass procedure; learners add the outer loop.',
    stretch: 'Stop early when a pass makes no swaps (optimised bubble sort).',
    mis: [
      ['One loop sorts everything', 'Needs repeated passes.'],
      ['Doubling items doubles the work', 'It roughly quadruples.'],
    ],
    successCriteria: ['I can implement bubble sort with nested loops.', 'I can sort ascending or descending.', 'I can describe how its work grows.'],
    homework: 'Time yourself sorting 5 cards and then 10 cards by bubble passes. Compare.',
    exit: 'Where must “set j to 1” go, and why?',
  },
});

export const J6 = lesson(6, {
  title: 'Project: Live Leaderboard',
  objective: 'Plan, build and test a leaderboard app that collects scores, sorts them and shows the top three.',
  concept: 'Project: sorting app',
  hook: ['word', '🏆 1st 2nd 3rd', 'who’s on top?'],
  cards: [
    { emoji: '📋', title: 'Your leaderboard', body: 'Ask how many players, collect each score into a list, sort it from highest to lowest, and announce the top three.' },
    { emoji: '🧱', title: 'Reuse your procedures', body: 'swap (i) and a sort procedure from Lesson 5 make the main script short: collect, sort, report.' },
    { emoji: '🛡️', title: 'Edge cases', body: 'What if only two players? Or two players tie? Handle these so the app never shows nonsense.' },
    { emoji: '🧪', title: 'Test data', body: 'Use test sets you can check: already sorted, reverse sorted, with ties, and with just one player.' },
  ],
  build: {
    title: 'Build the Live Leaderboard',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Collect', text: 'Ask how many players; repeat that many times: ask a score, add it to scores.' },
      { title: 'Sort', text: 'Bubble sort scores descending (call your procedure).' },
      { title: 'Top three', text: 'Say 1st, 2nd and 3rd with join.' },
      { title: 'Edge cases', text: 'If fewer than 3 players, only show as many as there are.' },
      { title: 'Test & submit', text: 'Run your four test sets; record results; submit.' },
    ],
  },
  acts: [
    { order: 'Order the leaderboard program', steps: ['Delete all of scores', 'Ask how many players', 'Collect each score into the list', 'Sort the list descending', 'Announce the top three'], why: 'Collect → process → report.', title: 'Plan the app' },
    {
      lab: 'Build the Live Leaderboard: ask how many players, collect their scores into the scores list, sort it from highest to lowest, and say the top three.',
      title: 'Project: Live Leaderboard',
      mode: 'project',
      start: project([sorter([swapDef('scores')])], { lists: ['scores'], vars: ['temp', 'j', 'comparisons', 'players'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Collects and sorts', { t: 'withAnswers', answers: ['5', '40', '90', '10', '70', '55'], check: { t: 'listIs', name: 'scores', values: [90, 70, 55, 40, 10], msg: '' }, msg: 'Ask how many players (5), collect 40, 90, 10, 70, 55 into scores and sort descending.' }],
        ['Announces the winner', { t: 'withAnswers', answers: ['5', '40', '90', '10', '70', '55'], check: { t: 'said', text: '90', msg: '' }, msg: 'Say the top score (and 2nd and 3rd).' }],
        ['Uses procedures', { t: 'defines', msg: 'Use swap (i) or your own sort procedure.' }],
        ['Builds messages', { t: 'usesValue', kind: 'join', msg: 'Use join to announce the places.' }],
      ],
      test: { seconds: 6, answers: ['5', '40', '90', '10', '70', '55'] },
      solution: project(
        [
          sorter([
            swapDef('scores'),
            onFlag(
              listDeleteAll('scores'),
              ask('How many players?'),
              setVar('players', answer),
              { op: 'repeat', a: vr('players'), body: [ask('Score?'), listAdd('scores', answer)] },
              ...bubble('scores', false),
              sayFor(join(t('1st: '), item('scores', 1)), 1),
              ifThen(gt(lengthOf('scores'), n(1)), sayFor(join(t('2nd: '), item('scores', 2)), 1)),
              ifThen(gt(lengthOf('scores'), n(2)), say(join(t('3rd: '), item('scores', 3)))),
            ),
          ]),
        ],
        { lists: ['scores'], vars: ['temp', 'j', 'comparisons', 'players'] },
      ),
      explain: 'Leaderboard submitted! Your teacher will test it with their own scores.',
      hints: ['Collect first, sort second, report third.', 'Sort descending: swap when item j < item j + 1.'],
      requirements: ['Collects any number of scores', 'Sorts descending', 'Announces the top three', 'Handles fewer than 3 players', 'Uses procedures', 'Four test sets recorded'],
      reflection: 'List your four test sets and results. Which edge case needed a fix?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Combines input collection, sorting with procedures, indexed output and edge-case handling, with systematic test sets (sorted, reversed, ties, tiny).',
    analogy: 'A sports results board updated after every match.',
    vocab: [
      ['leaderboard', 'A ranked list of scores.'],
      ['edge case', 'An unusual input at the limits.'],
      ['test set', 'A planned group of test inputs.'],
    ],
    demo: 'Run the leaderboard with 2 players to show a missing-3rd bug, then fix it.',
    unplugged: 'Sports day (5 min): rank five race times on the board by bubble passes.',
    prompts: [
      ['What happens with 2 players?', 'Must not show a 3rd.'],
      ['What about ties?', 'Both kept; order stable.'],
      ['Why reuse procedures?', 'Shorter, tested code.'],
    ],
    support: 'Provide the sort; learners add collection and reporting.',
    stretch: 'Store names in a parallel list and swap them too.',
    mis: [
      ['The list is sorted as you add', 'Sort after collecting.'],
      ['There are always 3 players', 'Handle edge cases.'],
    ],
    successCriteria: ['My app collects and sorts scores.', 'It announces the top three and handles small groups.', 'I tested it with planned test sets.'],
    homework: 'Run your leaderboard for a family game and keep the results.',
    exit: 'One edge case your app handles.',
  },
  project: {
    title: 'Live Leaderboard',
    brief: 'Build a leaderboard: collect any number of scores into a list, sort them highest-first with your sorting procedure, announce the top three, and handle edge cases like fewer than three players. Test it with planned test sets.',
    requirements: ['Collects scores', 'Sorts descending', 'Top three', 'Edge cases', 'Procedures', 'Test sets'],
    milestones: ['Collection', 'Sorting', 'Reporting', 'Edge cases', 'Tested and submitted'],
    rubric: [
      { criterion: 'Sorting', levels: ['Not sorted', 'Partly sorted', 'Correctly sorted descending', 'Efficient (early stop) and correct'] },
      { criterion: 'Input & output', levels: ['Fixed data', 'Collects scores', 'Collects and reports top three', 'Clear, friendly announcements'] },
      { criterion: 'Edge cases', levels: ['Breaks', 'One handled', 'Small groups handled', 'Small groups and ties handled'] },
      { criterion: 'Procedures', levels: ['None', 'swap only', 'swap and sort procedures', 'Clean modular design'] },
      { criterion: 'Testing', levels: ['None', 'One run', 'Four planned test sets', 'Test sets with expected vs actual'] },
    ],
    extensions: ['Player names in a parallel list', 'Early-stop bubble sort', 'Bar chart of scores'],
  },
});
