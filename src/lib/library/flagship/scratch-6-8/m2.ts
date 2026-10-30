// Scratch Gr 6–8 Beginner · Module 2 — Iteration: loops, geometry and generative art. Project: Generative Art.
import type { Stmt } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_LOOPS, P_IF, P_ALL, bounce, changeEffect, eraseAll, forever, goto, gt, ifThen, move, n, op, onFlag, penColor, penDown, penUp, point, project, rand, repeat, setVar, setX, sprite, touching, turnR, vr, xpos, changeX, rotation, wait } from '../scratch-3-5/lab.ts';
import type { StmtOp } from '../../../scratch/vm.ts';

const P_LOOPV: StmtOp[] = [...P_LOOPS, 'setVar', 'changeVar'];
const turnBy = (a: ReturnType<typeof op>): Stmt => ({ op: 'turnR', a });
const pen = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Pen', ['✏️'], -40, -80, scripts);
const start = [eraseAll, goto(-40, -80), point(90), penDown];

export const G4 = lesson(4, {
  title: 'Loops and Polygons',
  objective: 'Use counted loops to repeat instructions, and use the exterior-angle rule (360 ÷ sides) to draw any regular polygon.',
  concept: 'Counted loops (iteration)',
  hook: ['pattern', ['🔺', '⬛', '⬟', '⬢'], 'what changes from shape to shape?'],
  intro: 'Why write the same block a hundred times? Loops let computers repeat — that’s where their power comes from.',
  cards: [
    { emoji: '🔁', title: 'Iteration', body: 'Iteration means repeating. A counted loop (repeat 4) runs the blocks inside it exactly 4 times.', blocks: 'repeat (4)\nmove (100) steps\nturn right (90) degrees\nend' },
    { emoji: '📐', title: 'The exterior-angle rule', body: 'To draw a regular polygon, the turns must add up to 360 degrees. So each turn is 360 ÷ number of sides.' },
    { emoji: '🧮', title: 'Let the computer calculate', body: 'Store the number of sides in a variable and use an operator for the turn. Change one number to get any polygon.', blocks: 'set [sides v] to (6)\nrepeat (sides)\nmove (50) steps\nturn right ((360) / (sides)) degrees\nend' },
    { emoji: '🧹', title: 'DRY code', body: 'Programmers say DRY: Don’t Repeat Yourself. Loops make code shorter, clearer and easier to change.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'sides = 6\nfor i in range(sides):\n    forward(50)\n    right(360 / sides)', lang: 'python', say: ['Here is the same loop in Python. “for i in range(sides)” repeats the indented lines, just like the repeat block.'] }],
  build: {
    title: 'The polygon machine',
    intro: 'Code Lab or Scratch with the Pen extension.',
    steps: [
      { title: 'Square with a loop', text: 'Replace eight blocks with repeat 4 { move 100; turn 90 }.' },
      { title: 'Triangle', text: 'Change to repeat 3 and turn 120. Why 120?' },
      { title: 'Variable', text: 'Make a variable sides. Set sides to 6.' },
      { title: 'Calculate the turn', text: 'repeat (sides) { move 50; turn (360 / sides) }.' },
      { title: 'Experiment', text: 'Try sides = 10, 20, 36. What shape do you get as sides grows?', tip: 'Make the move smaller when sides is big so it fits on the stage.' },
    ],
  },
  acts: [
    {
      lab: 'Hexagon with a loop: draw a closed regular hexagon (6 sides) using a repeat loop. Each side is 60 steps. Use no more than 10 blocks.',
      title: 'Code Lab: hexagon',
      start: project([pen()], { backdrop: 'grid' }),
      palette: P_LOOPS,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Closed shape with 6 sides', { t: 'pen', closed: true, sides: 6, msg: 'Repeat 6 times: move 60, turn right 60 (360 ÷ 6).' }],
        ['Uses a loop', { t: 'uses', ops: ['repeat'], msg: 'Use repeat instead of copying blocks.' }],
        ['Short code', { t: 'maxBlocks', n: 10, msg: 'Use a loop so your code is 10 blocks or fewer.' }],
      ],
      test: { seconds: 3 },
      solution: project([pen([onFlag(...start, repeat(6, move(60), turnR(60)), penUp)])], { backdrop: 'grid' }),
      explain: 'Six sides, one loop. That’s DRY code.',
      hints: ['360 ÷ 6 = 60.', 'Put move and turn INSIDE the repeat.'],
    },
    { mcq: 'What turn angle draws a regular pentagon (5 sides)?', options: ['72°', '108°', '60°'], answer: 0, why: '360 ÷ 5 = 72. (108° is the inside angle, not the turn.)', title: 'Pentagon turn' },
    {
      lab: 'Polygon machine: set a variable sides to 8. Use repeat (sides) with move 40 and turn right (360 / sides) to draw a closed octagon. Then you could change sides to draw any polygon.',
      title: 'Code Lab: polygon machine',
      start: project([pen()], { backdrop: 'grid', vars: ['sides'] }),
      palette: P_LOOPV,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Draws a closed octagon', { t: 'pen', closed: true, sides: 8, msg: 'Set sides to 8; repeat (sides) { move 40; turn (360 / sides) }.' }],
        ['Calculates the turn', { t: 'usesValue', kind: 'op', msg: 'Use the ( ) / ( ) operator: 360 / sides.' }],
        ['Uses the variable', { t: 'usesVar', name: 'sides', msg: 'Put the sides variable in the repeat and the division.' }],
      ],
      test: { seconds: 4 },
      solution: project([pen([onFlag(...start, setVar('sides', 8), { op: 'repeat', a: vr('sides'), body: [move(40), turnBy(op('/', 360, vr('sides')))] }, penUp)])], { backdrop: 'grid', vars: ['sides'] }),
      explain: 'One program, every polygon — generalisation in action.',
      hints: ['Drag the sides variable into the repeat slot.', 'Operators → ( ) / ( ); type 360 on the left and drop sides on the right.'],
    },
    { code: 'for i in range(3):\n    print("hip")\nprint("hooray")', ask: 'In Python, what does this print?', options: ['hip hip hip hooray', 'hip hooray hip hooray hip hooray', 'hip hooray'], answer: 0, why: 'Only the indented line is inside the loop; “hooray” prints once after it.', title: 'Loops in Python', lang: 'python', phase: 'probe' },
    { write: 'Explain why 360 ÷ sides works for every regular polygon. Use the words loop and turn.', keywords: ['360', 'turn', 'loop'], exemplar: 'To get back to where it started facing the same way, the sprite has to turn a full circle, which is 360 degrees. The loop turns once per side, so each turn must be 360 divided by the number of sides.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Counted loops implement iteration; with a variable and an operator, a single program generalises to any regular polygon (exterior angle 360/n). Highlights DRY code and the Python for-range equivalent.',
    analogy: 'Walking around a building: you must turn a total of one full circle to face your starting direction again.',
    vocab: [
      ['iteration', 'Repeating a set of instructions.'],
      ['counted loop', 'A loop that repeats a fixed number of times.'],
      ['exterior angle', 'How far you turn at each corner.'],
      ['generalise', 'Make one solution work for many cases.'],
    ],
    demo: 'Draw a square long-hand (8 blocks), then refactor into a loop; then into a variable polygon.',
    unplugged: 'Human polygon (5 min): a learner walks a square, triangle and hexagon in the hall; the class counts the total turning.',
    prompts: [
      ['What do all the turns add up to?', '360 degrees.'],
      ['What is the turn for 10 sides?', '36 degrees.'],
      ['Why is the loop version better?', 'Shorter, clearer, easier to change.'],
    ],
    support: 'Provide a protractor sheet with 360/n worked out.',
    stretch: 'Draw a star: repeat 5 { move 100; turn 144 }. Why 144?',
    mis: [
      ['Turn by the inside angle', 'Turn by the exterior angle, 360 ÷ sides.'],
      ['Loops only repeat move blocks', 'Any blocks can go inside.'],
    ],
    successCriteria: ['I can use a counted loop to remove repetition.', 'I can calculate the turn for any polygon.', 'I can use a variable and operator to generalise.'],
    homework: 'Find three regular polygons in the real world and work out each turn angle.',
    exit: 'What is the turn angle for a 12-sided polygon?',
  },
});

export const G5 = lesson(5, {
  title: 'Forever Loops and Conditions',
  objective: 'Use forever loops with if-then conditions to keep checking the world, and build bouncing and wrap-around motion.',
  concept: 'Conditional loops',
  hook: ['word', '🔁 + ❓', 'keep checking, then decide'],
  cards: [
    { emoji: '♾️', title: 'Forever', body: 'A forever loop never stops. Games, animations and apps run in a loop that keeps checking what’s happening.', blocks: 'forever\nmove (8) steps\nif on edge, bounce\nend' },
    { emoji: '❓', title: 'Selection', body: 'If-then means selection: the computer only runs the inside blocks when the condition is true.', blocks: 'if <(x position) > (230)> then\nset x to (-230)\nend' },
    { emoji: '🌀', title: 'Wrap-around', body: 'In many classic games, things that leave one side of the screen come back on the other. That’s a forever loop with a condition.' },
    { emoji: '🎮', title: 'The game loop', body: 'Every game runs a game loop: read input, update positions, check collisions, draw. Forever + if is the heart of it.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'while True:\n    x = x + 8\n    if x > 230:\n        x = -230', lang: 'python', say: ['In Python, “while True” is a forever loop, and “if” works just like the Scratch block.'] }],
  build: {
    title: 'Bouncing and wrapping',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Bounce', text: 'forever { move 8; if on edge, bounce }. Set rotation style to left-right.' },
      { title: 'Wrap instead', text: 'New sprite: forever { change x by 6; if x position > 230 then set x to -230 }.' },
      { title: 'Predict', text: 'What happens if you use > 250 instead? Try it.' },
      { title: 'Combine', text: 'Add a touching check: if touching the other sprite, change colour effect.' },
      { title: 'Explain', text: 'Point to the condition in each loop and say when it is true.', tip: 'Conditions are checked every time the loop goes round.' },
    ],
  },
  acts: [
    {
      lab: 'Wrap-around car: forever, change x by 6. If x position > 230, set x to -230, so the Car reappears on the left.',
      title: 'Code Lab: wrap-around',
      start: project([sprite('Car', ['🚗'], -200, -100)], { backdrop: 'grass' }),
      palette: P_IF,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Moves forever', { t: 'uses', ops: ['forever'], msg: 'forever { change x by 6 … }.' }],
        ['Checks a condition', { t: 'uses', ops: ['if'], msg: 'Inside the loop: if <(x position) > (230)> then …' }],
        ['Wraps to the left', { t: 'final', sprite: 'Car', prop: 'x', cmp: '<', value: 220, msg: 'When x > 230, set x to -230 so it comes back on the left.' }],
        ['Kept moving', { t: 'moved', sprite: 'Car', min: 300, msg: 'The Car should keep driving.' }],
      ],
      test: { seconds: 4 },
      solution: project([sprite('Car', ['🚗'], -200, -100, [onFlag(goto(-200, -100), forever(changeX(6), ifThen(gt(xpos, n(230)), setX(-230))))])], { backdrop: 'grass' }),
      explain: 'Off one side, back on the other — like a classic arcade game.',
      hints: ['The condition: (x position) > (230), from the if menu.', 'Inside the if: set x to -230.'],
    },
    {
      bmcq: 'This ball should bounce around forever, but it stops at the first wall. What’s wrong?',
      blocks: 'when green flag clicked\nmove (8) steps\nif on edge, bounce',
      options: ['The blocks are not inside a forever loop', 'It needs a bigger number', 'It needs a wait block'],
      answer: 0,
      why: 'Without a loop the blocks run once. forever keeps moving and checking.',
      title: 'Debug the ball',
    },
    {
      lab: 'Bumper ball: the Ball moves 8 steps forever and bounces on edges. If it touches the Bumper, it changes its colour effect by 25.',
      title: 'Code Lab: bumper ball',
      start: project([sprite('Ball', ['⚽'], 0, 0, [], { dir: 45 }), sprite('Bumper', ['🟦'], 120, 60, [], { size: 220 })], { backdrop: 'grid' }),
      palette: P_IF,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Bounces around', { t: 'uses', ops: ['forever', 'bounce'], msg: 'forever { move 8; if on edge, bounce }.' }],
        ['Checks touching', { t: 'uses', ops: ['if'], msg: 'Add if <touching Bumper?> then change color effect by 25.' }],
        ['Keeps moving', { t: 'moved', sprite: 'Ball', min: 400, msg: 'The Ball should keep moving.' }],
      ],
      test: { seconds: 5 },
      solution: project([sprite('Ball', ['⚽'], 0, 0, [onFlag(goto(0, 0), point(45), rotation("don't rotate"), forever(move(8), bounce, ifThen(touching('Bumper'), changeEffect('color', 25))))], { dir: 45 }), sprite('Bumper', ['🟦'], 120, 60, [], { size: 220 })], { backdrop: 'grid' }),
      explain: 'Loop + condition = a world that reacts.',
      hints: ['Put the if INSIDE the forever loop so it checks every time.'],
      phase: 'probe',
    },
    { write: 'Describe the game loop of a game you know: what does it check every frame, and what does it do when each condition is true?', keywords: ['loop', 'if', 'check'], exemplar: 'In a racing game the loop checks if I press the arrows and moves the car. It checks if the car touches the wall, and if it does the car slows down. It checks if I cross the finish line, and then the race ends.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Forever loops with conditionals implement continuous checking (polling) — the core of a game loop: input → update → collision → render. Wrap-around and bounce are classic examples.',
    analogy: 'A lifeguard keeps scanning the pool (loop) and acts only when someone needs help (condition).',
    vocab: [
      ['selection', 'Choosing what to do with if-then.'],
      ['condition', 'A true/false question.'],
      ['game loop', 'The loop that runs a game every frame.'],
      ['polling', 'Checking again and again.'],
    ],
    demo: 'Remove the forever loop from the bounce script and run it; then put it back.',
    unplugged: 'Lifeguard (5 min): learners walk; the “lifeguard” keeps checking and calls “stop!” when someone reaches a line.',
    prompts: [
      ['How often is the condition checked?', 'Every time the loop goes round.'],
      ['Why put the if inside forever?', 'So it keeps checking.'],
      ['What else could a game loop check?', 'Keys, collisions, time.'],
    ],
    support: 'Provide the forever loop; learners add the condition.',
    stretch: 'Wrap in both directions (left and right, top and bottom).',
    mis: [
      ['if checks forever by itself', 'It checks once unless inside a loop.'],
      ['forever loops crash the computer', 'They run safely, one frame at a time.'],
    ],
    successCriteria: ['I can use a forever loop to keep a program running.', 'I can use if-then to make decisions.', 'I can explain a game loop.'],
    homework: 'Write the game loop of your favourite game as a list of checks.',
    exit: 'Why must the if block be inside the forever loop?',
  },
});

export const G6 = lesson(6, {
  title: 'Project: Generative Art',
  objective: 'Plan, build and test a generative-art program that uses nested loops, variables and randomness to draw an original design.',
  concept: 'Project: nested loops and randomness',
  hook: ['pattern', ['🌸', '🌀', '✴️'], 'art made by rules'],
  cards: [
    { emoji: '🎨', title: 'Generative art', body: 'Generative artists write rules, and the computer makes the art. Randomness means every run is different.' },
    { emoji: '🪆', title: 'Nested loops', body: 'A loop inside a loop: the inner loop draws a shape, the outer loop repeats it with a turn to make a rosette.', blocks: 'repeat (12)\nrepeat (6)\nmove (40) steps\nturn right (60) degrees\nend\nturn right (30) degrees\nend' },
    { emoji: '🎲', title: 'Controlled randomness', body: 'Use pick random for colour, position or size — but keep some rules fixed so it still looks designed.' },
    { emoji: '🖼️', title: 'Artist statement', body: 'Real generative artists explain their rules. Write which rules you chose and why.' },
  ],
  build: {
    title: 'Build Generative Art',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'One shape', text: 'Draw one polygon with a loop.' },
      { title: 'Rosette', text: 'Wrap it in an outer loop with a turn between shapes.' },
      { title: 'Randomness', text: 'Pick a random colour (or position) for each rosette.' },
      { title: 'Repeat the design', text: 'Draw several rosettes at random places.' },
      { title: 'Artist statement', text: 'Write your rules in the reflection, then submit.' },
    ],
  },
  acts: [
    { order: 'Order the parts of a generative-art program', steps: ['Erase all and set the pen', 'Choose a random position', 'Inner loop draws one shape', 'Outer loop turns and repeats the shape', 'Repeat for more rosettes'], why: 'Set up, then loops from the inside out.', title: 'Plan the rules' },
    {
      lab: 'Build your Generative Art: use nested loops (a loop inside a loop), randomness (position, colour or size) and draw at least 30 lines.',
      title: 'Project: Generative Art',
      mode: 'project',
      start: project([pen()], { backdrop: 'plain' }),
      palette: P_ALL,
      allowSprites: true,
      goals: [
        ['Nested loops', { t: 'nested', msg: 'Put a repeat loop inside another loop.' }],
        ['Randomness', { t: 'usesRandom', msg: 'Use pick random for position, colour or size.' }],
        ['A rich design', { t: 'pen', minLines: 30, msg: 'Draw at least 30 lines.' }],
        ['Starts clean', { t: 'uses', ops: ['eraseAll'], msg: 'Erase all at the start.' }],
      ],
      test: { seconds: 6 },
      solution: project([pen([onFlag(eraseAll, repeat(3, penUp, goto(rand(-150, 150), rand(-100, 100)), penColor('purple'), penDown, repeat(12, repeat(6, move(30), turnR(60)), turnR(30)), wait(0.2)), penUp)])], { backdrop: 'plain' }),
      explain: 'Art submitted! Your teacher will run it — and get a different picture each time.',
      hints: ['Get one rosette working first.', 'Pen up before moving to a random place, then pen down.'],
      requirements: ['Nested loops', 'Randomness', '30+ lines', 'Starts clean', 'An artist statement'],
      reflection: 'Artist statement: what are your rules, what is random, and what is fixed? Why?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Nested loops compose shapes into patterns; controlled randomness creates variety within rules. Artist statements build the habit of explaining algorithms.',
    analogy: 'A kaleidoscope: simple rules and a little chance make endless patterns.',
    vocab: [
      ['nested loop', 'A loop inside another loop.'],
      ['generative art', 'Art made by following rules in code.'],
      ['randomness', 'Values chosen by chance.'],
    ],
    demo: 'Build a rosette live; then add random positions and run it three times.',
    unplugged: 'Rule art (5 min): roll a die to choose shape size and draw a rosette by hand.',
    prompts: [
      ['Which loop draws the shape?', 'The inner loop.'],
      ['What does the outer loop do?', 'Repeats and turns the shape.'],
      ['What did you keep fixed?', 'Artistic choice.'],
    ],
    support: 'Start from the polygon machine code.',
    stretch: 'Change the pen colour inside the outer loop for a rainbow rosette.',
    mis: [
      ['Random means messy', 'Fixed rules keep the design coherent.'],
      ['Nested loops run once each', 'The inner loop runs fully for every outer repeat.'],
    ],
    successCriteria: ['My art uses nested loops.', 'It uses randomness in a controlled way.', 'I can explain my rules in an artist statement.'],
    homework: 'Run your art five times and pick your favourite version. Why that one?',
    exit: 'How many times does the inner block run in repeat 12 { repeat 6 { … } }?',
  },
  project: {
    title: 'Generative Art',
    brief: 'Write rules that make art: use nested loops to build patterns from shapes, controlled randomness so every run is different, and explain your rules in an artist statement.',
    requirements: ['Nested loops', 'Randomness', '30+ lines', 'Starts clean', 'Artist statement'],
    milestones: ['One shape', 'Rosette', 'Randomness', 'Full design', 'Statement and submit'],
    rubric: [
      { criterion: 'Loops', levels: ['No loops', 'Single loop', 'Nested loops', 'Nested loops with variables'] },
      { criterion: 'Randomness', levels: ['None', 'Random but chaotic', 'Controlled randomness', 'Thoughtful mix of random and fixed'] },
      { criterion: 'Visual design', levels: ['Unclear', 'Simple', 'Attractive', 'Striking and original'] },
      { criterion: 'Code quality', levels: ['Hard to follow', 'Works', 'Tidy and DRY', 'Elegant and easy to change'] },
      { criterion: 'Artist statement', levels: ['Missing', 'Brief', 'Explains the rules', 'Explains rules and design choices'] },
    ],
    extensions: ['Changing colours', 'Variable sizes', 'Click to draw a new piece'],
  },
});
