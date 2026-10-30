// Scratch Gr 6–8 Advanced · Module 4 — Recursion, bridging to Python, and the capstone Algorithm App.
import type { Stmt, Val } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, call, changeVar, define, eq, eraseAll, goto, gt, ifElse, join, move, n, onFlag, op, param, penColor, penDown, penUp, point, project, repeat, say, sayFor, setVar, sprite, t, turnL, turnR, vr, item, listAdd, listDeleteAll, lengthOf, ask, answer } from '../scratch-3-5/lab.ts';

const coder = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Coder', ['🧑‍💻'], -150, 100, scripts);
const tree = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Pen', ['✏️'], 0, -150, scripts);
const neg = (a: Val): Val => op('-', 0, a);
const branchDef = define(
  'branch',
  'size',
  ifElse(gt(param('size'), n(10)), [move(param('size')), turnL(25), call('branch', op('*', param('size'), 0.65)), turnR(50), call('branch', op('*', param('size'), 0.65)), turnL(25), move(neg(param('size')))], []),
);
const countdownDef = define('countdown', 'n', ifElse(gt(param('n'), n(0)), [sayFor(param('n'), 0.3), call('countdown', op('-', param('n'), 1))], [say('Liftoff!')]));
const mod = (a: Val, b: number) => op('%', a, b);
const fizzBody: Stmt[] = [
  ifElse(eq(mod(vr('i'), 15), n(0)), [sayFor('FizzBuzz', 0.2)], [ifElse(eq(mod(vr('i'), 3), n(0)), [sayFor('Fizz', 0.2)], [ifElse(eq(mod(vr('i'), 5), n(0)), [sayFor('Buzz', 0.2)], [sayFor(vr('i'), 0.2)])])]),
  changeVar('i', 1),
];

export const J10 = lesson(10, {
  title: 'Recursion: Blocks That Call Themselves',
  objective: 'Write recursive procedures with a base case and a recursive case, and use recursion to draw a fractal tree.',
  concept: 'Recursion',
  hook: ['word', '🌳 → 🌿🌿 → ☘️☘️☘️☘️', 'a tree is made of smaller trees'],
  intro: 'Some problems contain smaller copies of themselves. Recursion solves them with a procedure that calls itself — one of the most beautiful ideas in computer science.',
  cards: [
    { emoji: '🪆', title: 'Self-similar problems', body: 'A tree is a trunk with two smaller trees on top. A countdown from 5 is “say 5, then count down from 4”. The problem contains a smaller version of itself.' },
    { emoji: '🛑', title: 'Base case', body: 'Every recursive procedure needs a base case: a simple situation where it stops calling itself. Without one it would never end.', blocks: 'define countdown (n)\nif <(n) > (0)> then\nsay (n) for (0.3) seconds\ncountdown ((n) - (1))\nelse\nsay [Liftoff!]\nend' },
    { emoji: '🔁', title: 'Recursive case', body: 'The recursive case calls the procedure again with a SMALLER input, so it gets closer to the base case each time.' },
    { emoji: '🌳', title: 'Fractals', body: 'Draw a branch, then two smaller branches at angles, each drawing two smaller branches… until the branches are tiny. That’s a fractal tree.', blocks: 'define branch (size)\nif <(size) > (10)> then\nmove (size) steps\nturn left (25) degrees\nbranch ((size) * (0.65))\nturn right (50) degrees\nbranch ((size) * (0.65))\nturn left (25) degrees\nmove ((0) - (size)) steps\nend' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'def countdown(n):\n    if n > 0:\n        print(n)\n        countdown(n - 1)\n    else:\n        print("Liftoff!")\n\ncountdown(3)', lang: 'python', output: '3\n2\n1\nLiftoff!', say: ['The same recursive function in Python: a base case and a recursive call with a smaller number.'] }],
  build: {
    title: 'Countdown and fractal tree',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'countdown (n)', text: 'If n > 0: say n, then countdown (n − 1). Else say Liftoff!.' },
      { title: 'Call it', text: 'On the flag: countdown (5).' },
      { title: 'branch (size)', text: 'If size > 10: move size, turn left 25, branch (size × 0.65), turn right 50, branch (size × 0.65), turn left 25, move back.' },
      { title: 'Grow a tree', text: 'Point up, pen down, branch (60).' },
      { title: 'Experiment', text: 'Change 25 to 40 or 0.65 to 0.75. How does the tree change?', tip: 'Moving back at the end returns the pen to where the branch started — essential for fractals.' },
    ],
  },
  acts: [
    {
      lab: 'Recursive countdown: define countdown (n). If n > 0, say n for 0.3 seconds and call countdown (n − 1); otherwise say “Liftoff!”. Call countdown (5) on the flag.',
      title: 'Code Lab: recursive countdown',
      start: project([coder()]),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Counts 5, 4, 3, 2, 1, Liftoff!', { t: 'sayOrder', texts: ['5', '4', '3', '2', '1', 'liftoff'], msg: 'Say n, then call countdown ((n) − 1).' }],
        ['Calls itself', { t: 'recursive', msg: 'Inside define countdown, call countdown.' }],
        ['Has a base case', { t: 'uses', ops: ['ifElse'], msg: 'Use if-else: the else is the base case (Liftoff!).' }],
      ],
      test: { seconds: 3 },
      solution: project([coder([countdownDef, onFlag(call('countdown', 5))])]),
      explain: 'A procedure that calls itself — and knows when to stop.',
      hints: ['The recursive call goes inside the if, with the input (n) − 1.', 'The else (base case) says Liftoff!.'],
    },
    {
      lab: 'Fractal tree: define branch (size). If size > 10: move size, turn left 25, branch (size × 0.65), turn right 50, branch (size × 0.65), turn left 25, then move back −size. Point up, pen down and call branch (60).',
      title: 'Code Lab: fractal tree',
      start: project([tree()], { backdrop: 'plain' }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Recursive branch', { t: 'recursive', msg: 'branch must call branch (twice) with a smaller size.' }],
        ['A full tree', { t: 'pen', minLines: 25, msg: 'Each branch draws two smaller branches until size ≤ 10.' }],
        ['Smaller each time', { t: 'usesValue', kind: 'param', msg: 'Pass (size) × 0.65 into each recursive call.' }],
      ],
      test: { seconds: 3 },
      solution: project([tree([branchDef, onFlag(eraseAll, goto(0, -150), point(0), penColor('green'), penDown, call('branch', 60), penUp)])], { backdrop: 'plain' }),
      explain: 'A whole tree from one short procedure. That’s the magic of recursion.',
      hints: ['Don’t forget to move back at the end, or the next branch starts in the wrong place.', 'The if condition is the base case: stop when size ≤ 10.'],
    },
    {
      bmcq: 'This recursive block runs until Scratch stops it and never says Liftoff!. What’s wrong?',
      blocks: 'define countdown (n)\nsay (n) for (0.3) seconds\ncountdown ((n) - (1))',
      options: ['There is no base case to stop it', 'It should call countdown ((n) + (1))', 'Recursion isn’t allowed in Scratch'],
      answer: 0,
      why: 'Without an if to stop at 0, it keeps calling itself forever.',
      title: 'Debug the recursion',
      phase: 'probe',
    },
    { write: 'Explain recursion to a younger student, using an example from real life (like Russian dolls or mirrors). Include the words base case.', keywords: ['base case', 'smaller', 'itself'], exemplar: 'Recursion is when something is made of smaller copies of itself, like Russian dolls. To open them all, you open one doll, then do the same thing with the smaller doll inside. The base case is the tiny doll that doesn’t open — that’s when you stop.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Recursion: a procedure calls itself on a smaller sub-problem until a base case. Fractals demonstrate branching recursion; state must be restored (move back, turn back) so callers continue correctly. Missing base case → infinite recursion (stack overflow).',
    analogy: 'Russian dolls: open one, find a smaller one, until the smallest.',
    vocab: [
      ['recursion', 'A procedure that calls itself.'],
      ['base case', 'The simple case where recursion stops.'],
      ['recursive case', 'The step that calls itself with a smaller input.'],
      ['fractal', 'A shape made of smaller copies of itself.'],
    ],
    demo: 'Trace countdown (3) as a stack of sticky notes on the board.',
    unplugged: 'Russian dolls / paper folding (5 min): fold paper in half repeatedly — a natural base case appears.',
    prompts: [
      ['What is the base case in countdown?', 'n is 0 → Liftoff!.'],
      ['Why must the input get smaller?', 'To reach the base case.'],
      ['Why move back in branch?', 'To restore the position for the caller.'],
    ],
    support: 'Provide countdown; learners adapt it to count up.',
    stretch: 'Draw a Koch snowflake or Sierpiński triangle recursively.',
    mis: [
      ['Recursion is the same as a loop', 'It solves sub-problems by calling itself.'],
      ['The base case is optional', 'Without it, recursion never ends.'],
    ],
    successCriteria: ['I can write a recursive procedure with a base case.', 'I can draw a fractal with recursion.', 'I can explain why the input must shrink.'],
    homework: 'Find three fractals in nature (ferns, broccoli, coastlines) and sketch one.',
    exit: 'What is a base case?',
  },
});

export const J11 = lesson(11, {
  title: 'From Blocks to Python',
  objective: 'Translate between Scratch blocks and Python: variables, loops, conditionals, lists and functions — and implement a classic algorithm from Python code.',
  concept: 'Bridging to text code',
  hook: ['word', '🧱 → 🐍', 'same ideas, new language'],
  intro: 'You already think like a programmer. Text languages like Python use the same ideas — just typed instead of dragged.',
  cards: [
    { emoji: '📖', title: 'Same ideas, new syntax', body: 'set → =, repeat (n) → for i in range(n), if-else → if/else, forever → while True, My Block → def, list → [ ].' },
    { emoji: '↔️', title: 'Indentation is the C-block', body: 'In Python, the lines inside a loop or if are indented. Indentation does the job of the C-shaped block in Scratch.' },
    { emoji: '0️⃣', title: 'Counting from 0', body: 'Python lists and strings start at index 0, not 1. letter (1) of word is word[0] in Python.' },
    { emoji: '🐞', title: 'Syntax errors', body: 'Blocks can’t be typed wrong, but text can: a missing colon or bracket stops the program. Read error messages — they tell you the line.' },
  ],
  scenes: [{ kind: 'code', heading: 'FizzBuzz in Python', code: 'for i in range(1, 16):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)', lang: 'python', say: ['FizzBuzz is a classic programming test. Read it carefully — you’re about to build it in blocks.'] }],
  build: {
    title: 'FizzBuzz from Python',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Read the Python', text: 'Find the loop, the conditions and the outputs.' },
      { title: 'Loop', text: 'set i to 1; repeat 15 … change i by 1 (range(1, 16) means 1 to 15).' },
      { title: 'Conditions', text: 'i mod 15 = 0 → FizzBuzz; else i mod 3 = 0 → Fizz; else i mod 5 = 0 → Buzz; else say i.' },
      { title: 'Order matters', text: 'Why must the 15 check come first?' },
      { title: 'Compare', text: 'Line up your blocks next to the Python, one line at a time.', tip: '% in Python is the mod operator in Scratch.' },
    ],
  },
  acts: [
    { match: 'Match the Scratch block to its Python', pairs: [['set [x v] to (5)', 'x = 5'], ['repeat (10)', 'for i in range(10):'], ['forever', 'while True:'], ['say [Hi]', 'print("Hi")'], ['define greet (name)', 'def greet(name):']], why: 'Same concepts, different syntax.' },
    {
      lab: 'FizzBuzz: translate the Python on screen into blocks. For i from 1 to 15: say “FizzBuzz” if i mod 15 = 0, else “Fizz” if i mod 3 = 0, else “Buzz” if i mod 5 = 0, else say i (each for 0.2 seconds).',
      title: 'Code Lab: FizzBuzz',
      start: project([coder()], { vars: ['i'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Correct sequence', { t: 'sayOrder', texts: ['1', '2', 'fizz', '4', 'buzz', 'fizz', '7', '8', 'fizz', 'buzz', '11', 'fizz', '13', '14', 'fizzbuzz'], msg: 'Check 15 first, then 3, then 5, otherwise say i.' }],
        ['Uses mod', { t: 'usesValue', kind: 'op', msg: 'Use ( ) % ( ) for the remainder.' }],
        ['Uses a loop', { t: 'uses', ops: ['repeat'], msg: 'repeat 15 with i going up by 1.' }],
      ],
      test: { seconds: 5 },
      solution: project([coder([onFlag(setVar('i', 1), repeat(15, ...fizzBody))])], { vars: ['i'] }),
      explain: 'You translated real Python into working blocks — you can read text code!',
      hints: ['Nest if-else blocks: the 15 check on the outside.', 'Condition: <((i) % (3)) = (0)>.'],
    },
    { code: 'total = 0\nfor n in [4, 7, 9]:\n    if n % 2 == 1:\n        total = total + n\nprint(total)', ask: 'What does this Python print?', options: ['16', '20', '4'], answer: 0, why: '7 and 9 are odd: 7 + 9 = 16.', title: 'Trace the Python', lang: 'python' },
    {
      blanks: 'In Python, a My Block is written with the keyword [[1]]. The blocks inside a loop are shown by [[2]]. The first item of a Python list is at index [[3]].',
      answers: [['def'], ['indentation', 'indenting', 'indent'], ['0', 'zero']],
      bank: ['def', 'indentation', '0', '1', 'loop'],
      why: 'These three differences trip up most new Python programmers.',
      title: 'Python essentials',
      phase: 'probe',
    },
    { write: 'What is easier in blocks, and what is easier in Python? Give one example of each.', keywords: ['blocks', 'python', 'easier'], exemplar: 'Blocks are easier for beginners because you can’t make spelling or bracket mistakes. Python is easier for long programs because typing is faster than dragging, and you can copy and search code — for example writing a 100-line game.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Explicit mapping of Scratch constructs to Python syntax: assignment, for-range, while, if/elif/else, def, lists (0-based), indentation as block structure. FizzBuzz exercises ordering of conditions and modulo.',
    analogy: 'Translating a sentence: the meaning stays, the words change.',
    vocab: [
      ['syntax', 'The rules for writing code in a language.'],
      ['indentation', 'Spaces at the start of a line that group code.'],
      ['elif', 'Python’s “else if”.'],
      ['zero-based', 'Counting positions from 0.'],
    ],
    demo: 'Put a Scratch script and its Python side by side; colour-match each line.',
    unplugged: 'Translation cards (5 min): match Scratch block cards to Python line cards.',
    prompts: [
      ['What does indentation do in Python?', 'Shows which lines are inside.'],
      ['What is range(1, 16)?', '1 to 15.'],
      ['Why check 15 first in FizzBuzz?', 'Otherwise 15 says Fizz.'],
    ],
    support: 'Provide the loop; learners write the nested if-else.',
    stretch: 'Write the Python for your Search Showdown on paper.',
    mis: [
      ['Python counts from 1', 'Lists and strings start at 0.'],
      ['Indentation is just style', 'In Python it changes meaning.'],
    ],
    successCriteria: ['I can translate between Scratch and Python.', 'I can implement an algorithm from Python code.', 'I can name key Python syntax rules.'],
    homework: 'Try a free online Python editor and type the FizzBuzz program.',
    exit: 'Write repeat (10) in Python.',
  },
});

export const J12 = lesson(12, {
  title: 'Capstone: Algorithm App',
  minutes: 90,
  objective: 'Design, build, test and present an app built around an algorithm (searching, sorting, ciphers or recursion), with the matching Python written alongside.',
  concept: 'Capstone project',
  hook: ['word', '🧠 ⚙️ 📱', 'algorithms that do something useful'],
  intro: 'Show what you can do: build an app around an algorithm you understand deeply, and explain it in blocks and in Python.',
  cards: [
    { emoji: '💡', title: 'Ideas', body: 'A sorting visualiser that draws bars as it sorts. A cipher app with brute-force cracking. A contact finder with binary search. A recursive art generator.' },
    { emoji: '📐', title: 'Algorithm design', body: 'Write your algorithm in plain steps first (pseudocode), then in blocks, then in Python.' },
    { emoji: '⏱️', title: 'Measure it', body: 'Count the steps your algorithm takes for different inputs, and explain its efficiency.' },
    { emoji: '🎤', title: 'Present', body: 'Demo the app, walk through the algorithm, and show your Python version.' },
  ],
  build: {
    title: 'Build your Algorithm App',
    intro: 'Two sessions.',
    steps: [
      { title: 'Session 1 · Pseudocode', text: 'Choose the algorithm; write it in numbered plain steps.' },
      { title: 'Session 1 · Core', text: 'Implement the algorithm as a My Block and test it with known inputs.' },
      { title: 'Session 2 · App', text: 'Add input, output and validation around the algorithm.' },
      { title: 'Session 2 · Python', text: 'Write the Python version in your reflection.' },
      { title: 'Session 2 · Test & present', text: 'Measure steps, test, submit and present.' },
    ],
  },
  acts: [
    { sort: 'Which algorithm would you use?', buckets: ['Binary search', 'Bubble sort', 'Caesar cipher', 'Recursion'], items: [['Find a name fast in a sorted contact list', 0], ['Rank players by score', 1], ['Hide a message from classmates', 2], ['Draw a snowflake made of smaller snowflakes', 3], ['Put words in alphabetical order', 1]], why: 'Match the algorithm to the problem.' },
    {
      lab: 'Build your Algorithm App: implement your algorithm in a My Block, use nested loops or recursion, take input, and report the result with join.',
      title: 'Capstone: Algorithm App',
      mode: 'project',
      start: project([coder()], { lists: ['data'], vars: ['i', 'j', 'temp', 'steps'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Algorithm in a procedure', { t: 'defines', msg: 'Put your algorithm in a My Block and call it.' }],
        ['Loops within loops', { t: 'nested', msg: 'Use nested loops (if your algorithm is recursive instead, say so in your reflection).' }],
        ['Takes input', { t: 'asked', msg: 'Ask the user for input.' }],
        ['Reports a result', { t: 'usesValue', kind: 'join', msg: 'Report the result with join.' }],
      ],
      test: { seconds: 6, answers: ['5', '3', '9', '1', '7', '4'] },
      solution: project(
        [
          coder([
            define('swap', 'i', setVar('temp', item('data', param('i'))), { op: 'listReplace', name: 'data', a: param('i'), b: item('data', op('+', param('i'), 1)) }, { op: 'listReplace', name: 'data', a: op('+', param('i'), 1), b: vr('temp') }),
            define('sort', undefined, setVar('steps', 0), { op: 'repeat', a: op('-', lengthOf('data'), 1), body: [setVar('j', 1), { op: 'repeat', a: op('-', lengthOf('data'), 1), body: [changeVar('steps', 1), { op: 'if', cond: gt(item('data', vr('j')), item('data', op('+', vr('j'), 1))), body: [call('swap', vr('j'))] }, changeVar('j', 1)] }] }),
            onFlag(listDeleteAll('data'), ask('How many numbers?'), setVar('i', answer), { op: 'repeat', a: vr('i'), body: [ask('Number?'), listAdd('data', answer)] }, call('sort'), sayFor(join(t('Smallest: '), item('data', 1)), 1), say(join(t('Steps: '), vr('steps')))),
          ]),
        ],
        { lists: ['data'], vars: ['i', 'j', 'temp', 'steps'] },
      ),
      explain: 'Capstone submitted — you’re thinking like a computer scientist!',
      hints: ['Reuse a procedure from this course and build an app around it.', 'Write the pseudocode first.'],
      requirements: ['Pseudocode', 'Algorithm in a procedure', 'Nested loops or recursion', 'Input and validation', 'Clear output', 'Step counts for several inputs', 'Python version in the reflection'],
      reflection: 'Paste your pseudocode and your Python version. What did you measure, and what does it show about efficiency?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Assesses algorithmic thinking (search, sort, strings/ciphers, recursion), modular design, efficiency measurement, and translation to Python. Pseudocode → blocks → Python.',
    analogy: 'A chef presenting a signature dish and its recipe.',
    vocab: [
      ['pseudocode', 'An algorithm written in plain, structured steps.'],
      ['efficiency', 'How the work grows with the input.'],
      ['implementation', 'Turning an algorithm into working code.'],
    ],
    demo: 'Show pseudocode, blocks and Python for bubble sort side by side.',
    unplugged: 'Pseudocode pairs (5 min): write pseudocode; a partner “executes” it with cards.',
    prompts: [
      ['What algorithm did you choose and why?', 'Learner-specific.'],
      ['How did you measure efficiency?', 'Step counts.'],
      ['How does your Python differ from the blocks?', 'Syntax, indexing.'],
    ],
    support: 'Extend the leaderboard or cipher project with input, validation and step counts.',
    stretch: 'Compare two algorithms in one app (e.g. bubble vs a smarter sort).',
    mis: [
      ['A capstone needs a brand-new algorithm', 'Applying a known algorithm well is the goal.'],
      ['Python must be perfect', 'Clear, mostly-correct Python shows understanding.'],
    ],
    successCriteria: ['My app is built around an algorithm in a procedure.', 'I measured its efficiency.', 'I wrote the Python version and presented it.'],
    homework: 'Explain your algorithm to someone at home without using the computer.',
    exit: 'One thing your step counts showed.',
    plan: [
      { minutes: 10, stage: 'Session 1 · Pseudocode', doing: 'Choose an algorithm; teacher checks the pseudocode.' },
      { minutes: 30, stage: 'Session 1 · Core', doing: 'Algorithm in a procedure, tested with known inputs.' },
      { minutes: 5, stage: 'Session 1 · Save', doing: 'Save; plan the app around it.' },
      { minutes: 20, stage: 'Session 2 · App and Python', doing: 'Input, output, validation; write the Python.' },
      { minutes: 10, stage: 'Session 2 · Measure & test', doing: 'Step counts for several inputs.' },
      { minutes: 15, stage: 'Session 2 · Submit & present', doing: 'Reflection, submit, 1-minute demos.' },
    ],
  },
  project: {
    title: 'Algorithm App',
    brief: 'Build an app around a classic algorithm (search, sort, cipher or recursion): pseudocode first, the algorithm in a procedure, input and validation, clear output, step counts for several inputs, and a Python version of the algorithm.',
    requirements: ['Pseudocode', 'Procedure', 'Nested loops or recursion', 'Input and validation', 'Clear output', 'Step counts', 'Python version'],
    milestones: ['Pseudocode approved', 'Algorithm working', 'App around it', 'Python and measurements', 'Tested, submitted, presented'],
    rubric: [
      { criterion: 'Algorithm', levels: ['Incorrect', 'Works for some inputs', 'Correct for all tested inputs', 'Correct and efficient, edge cases handled'] },
      { criterion: 'Design', levels: ['One script', 'Partly modular', 'Algorithm in a procedure', 'Clean, well-named procedures'] },
      { criterion: 'Efficiency', levels: ['Not measured', 'One count', 'Counts for several inputs', 'Explains growth (e.g. n²)'] },
      { criterion: 'Python', levels: ['None', 'Fragments', 'Mostly correct translation', 'Accurate, idiomatic Python'] },
      { criterion: 'Presentation', levels: ['None', 'Demo only', 'Demo and explanation', 'Clear walkthrough of algorithm, blocks and Python'] },
    ],
    extensions: ['Visualise the algorithm with the pen', 'Compare two algorithms', 'Let users choose the algorithm'],
  },
});

