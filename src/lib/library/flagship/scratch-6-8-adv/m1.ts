// Scratch Gr 6–8 Advanced · Module 1 — Searching algorithms and efficiency. Project: Search Showdown.
import type { Stmt, Val } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, answer, ask, changeVar, eq, gt, ifElse, ifThen, item, join, lengthOf, listAdd, listDeleteAll, lt, n, onFlag, op, or, project, repeat, say, sayFor, setVar, sprite, t, until, vr } from '../scratch-3-5/lab.ts';

const bot = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Seeker', ['🔎'], 0, -40, scripts, { size: 140 });
const NAMES = ['Ava', 'Ben', 'Mia', 'Leo', 'Zoe', 'Sam', 'Ivy', 'Raj'];
const fill = (list: string, xs: string[]) => [listDeleteAll(list), ...xs.map((x) => listAdd(list, x))];
const fill100: Stmt[] = [listDeleteAll('nums'), setVar('i', 1), repeat(100, listAdd('nums', vr('i')), changeVar('i', 1))];
const roundV = (a: Val): Val => ({ k: 'round', a });

/** Linear search for `target` in `list`, counting steps; sets found (0 = not found). */
const linear = (list: string, target: Val): Stmt[] => [
  setVar('i', 1),
  setVar('found', 0),
  setVar('steps', 0),
  until(or(gt(vr('found'), n(0)), gt(vr('i'), lengthOf(list))), changeVar('steps', 1), ifThen(eq(item(list, vr('i')), target), setVar('found', vr('i'))), changeVar('i', 1)),
];
/** Binary search for `target` in sorted `list`. */
const binary = (list: string, target: Val): Stmt[] => [
  setVar('low', 1),
  setVar('high', lengthOf(list)),
  setVar('found', 0),
  setVar('steps', 0),
  until(
    or(gt(vr('found'), n(0)), gt(vr('low'), vr('high'))),
    changeVar('steps', 1),
    setVar('mid', roundV(op('/', op('+', vr('low'), vr('high')), 2))),
    ifElse(eq(item(list, vr('mid')), target), [setVar('found', vr('mid'))], [ifElse(lt(item(list, vr('mid')), target), [setVar('low', op('+', vr('mid'), 1))], [setVar('high', op('-', vr('mid'), 1))])]),
  ),
];

export const J1 = lesson(1, {
  title: 'Linear Search',
  objective: 'Implement linear search to find an item in a list, report its position or “not found”, and count the steps it takes.',
  concept: 'Searching algorithms',
  hook: ['word', '🔎 1 → 2 → 3 → …', 'check every item until you find it'],
  intro: 'Every time you search your contacts or a shop’s website, a search algorithm runs. Today you’ll write the simplest one — and measure it.',
  cards: [
    { emoji: '🔦', title: 'Linear search', body: 'Start at item 1 and check each item in turn. Stop when you find the target, or when you run out of items.', blocks: 'repeat until <<(found) > (0)> or <(i) > (length of [names v])>>\nif <(item (i) of [names v]) = (answer)> then\nset [found v] to (i)\nend\nchange [i v] by (1)\nend' },
    { emoji: '🛑', title: 'Stop early', body: 'There’s no point checking more items once you’ve found the target. A repeat-until with two conditions stops at the right moment.' },
    { emoji: '🚫', title: 'Not found', body: 'Algorithms must handle the case where the target isn’t there. Use a found variable that stays 0 if nothing matches.' },
    { emoji: '⏱️', title: 'Count the steps', body: 'Efficiency means how much work an algorithm does. Count comparisons: in the worst case linear search checks every item.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'def linear_search(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1', lang: 'python', say: ['In Python, linear search is a function that returns the position, or minus one when the target isn’t found.'] }],
  build: {
    title: 'Find a friend',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Data', text: 'Fill names with eight names.' },
      { title: 'Target', text: 'Ask “Who are you looking for?”.' },
      { title: 'Search loop', text: 'set i to 1, found to 0; repeat until found > 0 or i > length: if item i = answer, set found to i; change i by 1.' },
      { title: 'Report', text: 'If found > 0 say “Found at position” found, else say “Not found”.' },
      { title: 'Count', text: 'Add a steps counter. How many steps for the first name? The last? A missing name?', tip: 'Test three cases: first item, last item, missing item.' },
    ],
  },
  acts: [
    {
      lab: 'Find a friend: names is filled. Ask “Who are you looking for?”. Search the list; if found, say “Found at position ” joined with the position; otherwise say “Not found”.',
      title: 'Code Lab: linear search',
      start: project([bot([onFlag(...fill('names', NAMES))])], { lists: ['names'], vars: ['i', 'found', 'steps'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Finds Mia at 3', { t: 'withAnswers', answers: ['Mia'], check: { t: 'said', text: 'position 3', msg: '' }, msg: 'Compare (item (i) of names) with answer, and set found to i when they match.' }],
        ['Finds the last name', { t: 'withAnswers', answers: ['Raj'], check: { t: 'said', text: 'position 8', msg: '' }, msg: 'Keep searching until i is past the end of the list.' }],
        ['Handles missing names', { t: 'withAnswers', answers: ['Zed'], check: { t: 'said', text: 'not found', msg: '' }, msg: 'If found is still 0 after the loop, say “Not found”.' }],
      ],
      test: { seconds: 3, answers: ['Mia'] },
      solution: project([bot([onFlag(...fill('names', NAMES), ask('Who are you looking for?'), ...linear('names', answer), ifElse(gt(vr('found'), n(0)), [say(join(t('Found at position '), vr('found')))], [say('Not found')]))])], { lists: ['names'], vars: ['i', 'found', 'steps'] }),
      explain: 'You implemented a real search algorithm, including the not-found case.',
      hints: ['Loop condition: <<(found) > 0> or <(i) > (length of names)>>.', 'After the loop, use if-else on found.'],
    },
    { mcq: 'A list has 1,000 items. In the WORST case, how many items does linear search check?', options: ['1,000', '500', '10'], answer: 0, why: 'If the target is last or missing, it checks every item.', title: 'Worst case' },
    {
      lab: 'Count the work: search names for “Zoe” (no ask needed) and count each comparison in steps. Zoe is item 5, so steps should be 5.',
      title: 'Code Lab: count the steps',
      start: project([bot([onFlag(...fill('names', NAMES))])], { lists: ['names'], vars: ['i', 'found', 'steps'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Finds Zoe', { t: 'var', name: 'found', cmp: '=', value: 5, msg: 'Search for the text Zoe.' }],
        ['Counts 5 steps', { t: 'var', name: 'steps', cmp: '=', value: 5, msg: 'Change steps by 1 for each comparison, and stop as soon as you find it.' }],
      ],
      test: { seconds: 2 },
      solution: project([bot([onFlag(...fill('names', NAMES), ...linear('names', t('Zoe')), say(join(t('Steps: '), vr('steps'))))])], { lists: ['names'], vars: ['i', 'found', 'steps'] }),
      explain: 'Measuring steps is how computer scientists compare algorithms.',
      hints: ['If steps is 8, your loop isn’t stopping early.'],
      phase: 'probe',
    },
    { code: 'def find(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1\n\nprint(find(["a", "b", "c"], "c"))', ask: 'What does this print? (Python counts from 0.)', options: ['2', '3', '-1'], answer: 0, why: 'Python lists start at index 0, so "c" is at 2.', title: 'Search in Python', lang: 'python', phase: 'probe' },
    { write: 'Explain why linear search can be slow for very large lists, and describe one situation where it’s still the right choice.', keywords: ['every', 'items', 'large'], exemplar: 'Linear search might have to check every item, so with a million items it could take a million comparisons. It is still the right choice when the list is short or not sorted, because faster searches like binary search need sorted data.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Linear search scans sequentially, terminating on match or end; must handle not-found. Efficiency measured by comparisons: worst case n (O(n)). Python bridge shows return -1 and 0-based indexing.',
    analogy: 'Looking for your friend in a queue by checking each face from the front.',
    vocab: [
      ['linear search', 'Checking items one by one in order.'],
      ['target', 'The value being searched for.'],
      ['comparison', 'Checking if two values are equal.'],
      ['worst case', 'The input that makes an algorithm do the most work.'],
    ],
    demo: 'Search for the first, last and missing names; tabulate steps.',
    unplugged: 'Hidden cards (5 min): 10 face-down number cards; find the 7 by flipping one at a time and counting flips.',
    prompts: [
      ['When does the loop stop?', 'Found, or past the end.'],
      ['What is the worst case?', 'Last item or missing.'],
      ['Why handle “not found”?', 'Algorithms must cope with all inputs.'],
    ],
    support: 'Provide the loop condition; learners write the comparison.',
    stretch: 'Count how many times a name appears (don’t stop early).',
    mis: [
      ['Search always finds something', 'Plan for not found.'],
      ['Checking all items is needed even after finding', 'Stop early.'],
    ],
    successCriteria: ['I can implement linear search.', 'I can handle the not-found case.', 'I can measure an algorithm’s steps.'],
    homework: 'Time yourself finding a word in a dictionary by reading every word from the start (just for 1 minute!). What would be faster?',
    exit: 'What are the two stopping conditions for linear search?',
  },
});

export const J2 = lesson(2, {
  title: 'Binary Search: Divide and Conquer',
  objective: 'Implement binary search on a sorted list using low, high and mid, and compare its efficiency with linear search.',
  concept: 'Binary search',
  hook: ['word', '1–100: 50? 25? 37?', 'halve it every time'],
  cards: [
    { emoji: '📖', title: 'Sorted data', body: 'If a list is sorted, you can be clever: check the middle. If the target is bigger, throw away the lower half; if smaller, the upper half.' },
    { emoji: '✂️', title: 'Low, high, mid', body: 'Keep low and high at the ends of the part still possible. mid = round((low + high) / 2). Each step halves the range.', blocks: 'set [mid v] to (round (((low) + (high)) / (2)))\nif <(item (mid) of [nums v]) < (target)> then\nset [low v] to ((mid) + (1))\nelse\nset [high v] to ((mid) - (1))\nend' },
    { emoji: '🚀', title: 'Incredibly efficient', body: 'Binary search finds any number in 1–100 in at most 7 steps, and in a million items in at most 20. Linear search could take a million.' },
    { emoji: '⚠️', title: 'Only for sorted lists', body: 'Binary search gives wrong answers on unsorted data. That’s one reason sorting matters so much.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'low, high = 0, len(nums) - 1\nwhile low <= high:\n    mid = (low + high) // 2\n    if nums[mid] == target:\n        break\n    elif nums[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1', lang: 'python', say: ['In Python, binary search is a while loop with low, high and mid — exactly the same idea.'] }],
  build: {
    title: 'Binary search 1–100',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Sorted data', text: 'Fill nums with 1 to 100 using a loop.' },
      { title: 'Setup', text: 'low = 1, high = length of nums, found = 0, steps = 0.' },
      { title: 'Loop', text: 'repeat until found > 0 or low > high: change steps by 1; set mid; compare.' },
      { title: 'Three cases', text: 'Equal → found = mid. Smaller → low = mid + 1. Bigger → high = mid − 1.' },
      { title: 'Measure', text: 'Try targets 1, 50, 73 and 100. Is steps ever more than 7?', tip: 'Trace low, high and mid in a table for one search.' },
    ],
  },
  acts: [
    {
      lab: 'Binary search: nums holds 1 to 100 (sorted). Ask “Target?”. Use low, high and mid to find it; count steps. Say “Found ” target “ in ” steps “ steps”.',
      title: 'Code Lab: binary search',
      start: project([bot([onFlag(...fill100)])], { lists: ['nums'], vars: ['i', 'low', 'high', 'mid', 'found', 'steps'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Finds 73', { t: 'withAnswers', answers: ['73'], check: { t: 'var', name: 'found', cmp: '=', value: 73, msg: '' }, msg: 'Set found to mid when item mid = answer.' }],
        ['In at most 7 steps', { t: 'withAnswers', answers: ['73'], check: { t: 'var', name: 'steps', cmp: '<', value: 8, msg: '' }, msg: 'Halve the range each step: low = mid + 1 or high = mid − 1.' }],
        ['Finds the edge case 100', { t: 'withAnswers', answers: ['100'], check: { t: 'var', name: 'found', cmp: '=', value: 100, msg: '' }, msg: 'Check your loop continues while low ≤ high.' }],
        ['Uses mid', { t: 'usesVar', name: 'mid', msg: 'Calculate mid = round((low + high) / 2).' }],
      ],
      test: { seconds: 6, answers: ['73'] },
      solution: project([bot([onFlag(...fill100, ask('Target?'), ...binary('nums', answer), say(join(t('Found '), join(vr('found'), join(t(' in '), join(vr('steps'), t(' steps')))))))])], { lists: ['nums'], vars: ['i', 'low', 'high', 'mid', 'found', 'steps'] }),
      explain: 'Seven steps or fewer for any number in 100 — divide and conquer!',
      hints: ['round is in the Operators ▾ menu.', 'Compare (item (mid) of nums) with answer: equal, less, or greater.'],
    },
    { mcq: 'Each step of binary search halves the range. Roughly how many steps for 1,000,000 sorted items?', options: ['About 20', 'About 1,000', 'About 500,000'], answer: 0, why: '2^20 ≈ 1,000,000, so about 20 halvings.', title: 'Halving power' },
    {
      blanks: 'Searching 1–100 for 30: mid = 50, 30 is smaller so high = [[1]]. Next mid = 25, 30 is bigger so low = [[2]]. Binary search only works on [[3]] lists.',
      answers: [['49'], ['26'], ['sorted', 'ordered']],
      why: 'Trace low, high and mid carefully.',
      title: 'Trace binary search',
    },
    { write: 'Compare linear and binary search. When would you choose each one? Use the words sorted and steps.', keywords: ['sorted', 'steps', 'binary'], exemplar: 'Binary search takes far fewer steps — about 7 for 100 items — but the list must be sorted. Linear search works on any list but may take as many steps as there are items. I would use binary search for a sorted phone book and linear search for a short, unsorted shopping list.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Binary search on sorted arrays maintains [low, high]; mid compared with target; range halves each iteration → O(log n). Correct loop condition (low ≤ high) and ±1 updates avoid infinite loops/misses.',
    analogy: 'Guess my number: always guess the middle of what’s left.',
    vocab: [
      ['binary search', 'Repeatedly halving a sorted list to find a target.'],
      ['divide and conquer', 'Solving a problem by splitting it.'],
      ['mid', 'The middle position of the current range.'],
      ['logarithmic', 'Grows very slowly as input grows (halving).'],
    ],
    demo: 'Play “guess my number 1–100” with the class using halving; count guesses.',
    unplugged: 'Phone-book race (5 min): sorted cards 1–32; one team linear, one binary; count flips.',
    prompts: [
      ['Why must the list be sorted?', 'To know which half to discard.'],
      ['What happens if you forget +1/−1?', 'Infinite loop or misses.'],
      ['Max steps for 1–100?', '7.'],
    ],
    support: 'Provide a trace table and the mid formula.',
    stretch: 'Run both searches for 20 random targets and average the steps.',
    mis: [
      ['Binary search works on any list', 'Only sorted lists.'],
      ['mid = high / 2', 'mid = (low + high) / 2.'],
    ],
    successCriteria: ['I can implement binary search.', 'I can trace low, high and mid.', 'I can compare its efficiency with linear search.'],
    homework: 'Play “guess my number” 1–1000 with someone and count your guesses using halving.',
    exit: 'Write the formula for mid.',
  },
});

export const J3 = lesson(3, {
  title: 'Project: Search Showdown',
  objective: 'Build an experiment that runs linear and binary search on the same data, counts their steps, and reports which is more efficient.',
  concept: 'Project: comparing algorithms',
  hook: ['word', '🐢 vs 🐇', 'which search wins?'],
  cards: [
    { emoji: '🏁', title: 'Your experiment', body: 'Make a sorted list of 100 numbers. For a target, run linear search and binary search, count the steps of each, and report both.' },
    { emoji: '📦', title: 'Procedures', body: 'Put each search in its own My Block with the target as the input. Your main script just calls them.', blocks: 'linear search (target)\nbinary search (target)' },
    { emoji: '📊', title: 'Fair test', body: 'Same list, same target, same counting rule (one step per comparison). Try several targets: small, middle, large, missing.' },
    { emoji: '🧾', title: 'Conclusion', body: 'Write what you found: which was faster, by how much, and when the difference matters most.' },
  ],
  build: {
    title: 'Build the Search Showdown',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Data', text: 'Fill nums with 1 to 100.' },
      { title: 'linear search (target)', text: 'A My Block that counts its steps into linear.' },
      { title: 'binary search (target)', text: 'A My Block that counts its steps into binary.' },
      { title: 'Main', text: 'Ask for a target, call both, and say both step counts.' },
      { title: 'Experiment', text: 'Test 5 targets and record the results in your reflection.' },
    ],
  },
  acts: [
    { sort: 'Which search fits?', buckets: ['Linear search', 'Binary search'], items: [['A shuffled deck of cards', 0], ['A dictionary', 1], ['Today’s 5 unsorted messages', 0], ['A sorted list of 1 million user IDs', 1], ['A list you can’t sort', 0]], why: 'Binary needs sorted data; linear works anywhere.' },
    {
      lab: 'Build the Search Showdown: nums holds 1–100. Ask for a target, run a linear search and a binary search (ideally as My Blocks), store their step counts in linear and binary, and say both.',
      title: 'Project: Search Showdown',
      mode: 'project',
      start: project([bot([onFlag(...fill100)])], { lists: ['nums'], vars: ['i', 'low', 'high', 'mid', 'found', 'steps', 'linear', 'binary'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Linear count for 90', { t: 'withAnswers', answers: ['90'], check: { t: 'var', name: 'linear', cmp: '=', value: 90, msg: '' }, msg: 'Linear search for 90 should take 90 steps; store it in linear.' }],
        ['Binary count for 90', { t: 'withAnswers', answers: ['90'], check: { t: 'var', name: 'binary', cmp: '<', value: 8, msg: '' }, msg: 'Binary search for 90 should take at most 7 steps; store it in binary.' }],
        ['Reports both', { t: 'usesValue', kind: 'join', msg: 'Say both step counts with join.' }],
        ['Uses procedures', { t: 'defines', msg: 'Put each search in a My Block.' }],
      ],
      test: { seconds: 8, answers: ['90'] },
      solution: project(
        [
          bot([
            { hat: { type: 'define', name: 'linear search', param: 'target' }, blocks: [...linear('nums', { k: 'param', name: 'target' }), setVar('linear', vr('steps'))] },
            { hat: { type: 'define', name: 'binary search', param: 'target' }, blocks: [...binary('nums', { k: 'param', name: 'target' }), setVar('binary', vr('steps'))] },
            onFlag(...fill100, ask('Target (1–100)?'), setVar('i', 0), { op: 'call', name: 'linear search', a: answer }, { op: 'call', name: 'binary search', a: answer }, sayFor(join(t('Linear: '), vr('linear')), 1), say(join(t('Binary: '), vr('binary')))),
          ]),
        ],
        { lists: ['nums'], vars: ['i', 'low', 'high', 'mid', 'found', 'steps', 'linear', 'binary'] },
      ),
      explain: 'Experiment submitted! Your teacher will try their own targets.',
      hints: ['Reuse your searches from Lessons 1 and 2.', 'Copy steps into linear or binary at the end of each search.'],
      requirements: ['Sorted list of 100', 'Linear search with step count', 'Binary search with step count', 'Each search in a procedure', 'Both results reported', 'Results table for 5 targets'],
      reflection: 'Paste your results table (target, linear steps, binary steps). What is your conclusion?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Empirical algorithm comparison: same data, same targets, consistent step counting. Learners modularise searches into parameterised procedures and draw evidence-based conclusions.',
    analogy: 'A science fair: fair test, measurements, conclusion.',
    vocab: [
      ['fair test', 'Changing only the thing you’re comparing.'],
      ['efficiency', 'How much work an algorithm needs.'],
      ['benchmark', 'A test to compare performance.'],
    ],
    demo: 'Run both searches for 1, 50 and 100; note when linear wins (target 1!).',
    unplugged: 'Race (5 min): two volunteers search sorted cards with different methods.',
    prompts: [
      ['Is binary always faster?', 'Not for the very first item.'],
      ['How did you keep the test fair?', 'Same list, target, counting.'],
      ['What would happen with 1,000 items?', 'The gap grows.'],
    ],
    support: 'Provide both searches as procedures; learners add the experiment.',
    stretch: 'Run all targets 1–100 automatically and average the steps.',
    mis: [
      ['One test proves it', 'Test several targets.'],
      ['Binary is always better', 'Only for sorted data and larger lists.'],
    ],
    successCriteria: ['I compared two algorithms fairly.', 'I organised them into procedures.', 'I drew a conclusion from evidence.'],
    homework: 'Explain your results to someone at home using the “guess my number” game.',
    exit: 'One case where linear search beats binary search.',
  },
  project: {
    title: 'Search Showdown',
    brief: 'Run linear and binary search on the same sorted list of 100 numbers, count the steps each takes for several targets, and report which is more efficient — with each search in its own procedure.',
    requirements: ['Sorted list of 100', 'Linear search with steps', 'Binary search with steps', 'Procedures', 'Both reported', 'Results table'],
    milestones: ['Data', 'Linear procedure', 'Binary procedure', 'Experiment', 'Conclusion and submit'],
    rubric: [
      { criterion: 'Algorithms', levels: ['Neither works', 'One works', 'Both correct, including not found', 'Both correct and efficient'] },
      { criterion: 'Measurement', levels: ['None', 'Inconsistent counting', 'Fair, consistent step counts', 'Automated tests across many targets'] },
      { criterion: 'Procedures', levels: ['None', 'Partly', 'Each search in a procedure', 'Clean, reusable design'] },
      { criterion: 'Results', levels: ['None', 'One target', 'Table of 5 targets', 'Averages or graph'] },
      { criterion: 'Conclusion', levels: ['None', 'States a winner', 'Evidence-based conclusion', 'Explains when each algorithm is best'] },
    ],
    extensions: ['Automate 100 targets', 'Average steps', 'Bar chart with the pen'],
  },
});

