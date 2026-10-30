// Scratch Gr 6–8 Intermediate · Module 2 — Procedures, decomposition and abstraction. Project: Procedural City.
import type { Stmt } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, call, changeX, changeY, define, eraseAll, goto, move, onFlag, op, param, penColor, penDown, penUp, point, project, rand, repeat, sprite, turnL, turnR } from '../scratch-3-5/lab.ts';

const turnBy = (a: ReturnType<typeof op>): Stmt => ({ op: 'turnR', a });
const pen = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Pen', ['✏️'], -200, -100, scripts);
const polygonDef = define('polygon', 'sides', { op: 'repeat', a: param('sides'), body: [move(40), turnBy(op('/', 360, param('sides')))] });
const squareDef = define('square', 'size', repeat(4, move(param('size')), turnL(90)));
const roofDef = define('roof', 'size', repeat(3, move(param('size')), turnL(120)));

export const H4 = lesson(4, {
  title: 'Procedures with Inputs',
  objective: 'Define custom blocks (procedures) that take an input, and call them with different arguments to reuse code.',
  concept: 'Procedures and parameters',
  hook: ['word', '🧱 polygon (5)', 'one block, many shapes'],
  intro: 'Professional programmers spend most of their time organising code. Procedures are their most important tool.',
  cards: [
    { emoji: '📦', title: 'Procedures', body: 'A procedure is a named, reusable piece of code. In Scratch it’s a My Block: you define it once and call it whenever you need it.', blocks: 'define polygon (sides)\nrepeat (sides)\nmove (40) steps\nturn right ((360) / (sides)) degrees\nend' },
    { emoji: '🎛️', title: 'Parameters and arguments', body: 'The input name in the define hat is a parameter. The value you give when you call it is an argument: polygon (5) passes 5 as sides.', blocks: 'polygon (3)\npolygon (6)' },
    { emoji: '🔒', title: 'Local to the procedure', body: 'A parameter only exists inside its define script. That keeps procedures independent and safe to reuse.' },
    { emoji: '🧪', title: 'Test procedures alone', body: 'Call a new procedure with a few arguments (3, 4, 10) before using it inside bigger programs.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'def polygon(sides):\n    for i in range(sides):\n        forward(40)\n        right(360 / sides)\n\npolygon(3)\npolygon(6)', lang: 'python', say: ['In Python, def defines a procedure, called a function. sides is the parameter; 3 and 6 are arguments.'] }],
  build: {
    title: 'The polygon procedure',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Make a Block', text: 'My Blocks → Make a Block → polygon, with a number input sides.' },
      { title: 'Define it', text: 'repeat (sides) { move 40; turn (360 / sides) }.' },
      { title: 'Test it', text: 'On the flag: erase all, pen down, polygon (3). Then try 5 and 8.' },
      { title: 'Combine', text: 'Call polygon (6) three times with a turn of 120 between: a flower.' },
      { title: 'Explain', text: 'Point to the parameter and an argument and name each.', tip: 'Drag the sides input out of the define hat — don’t type its name.' },
    ],
  },
  acts: [
    {
      lab: 'Polygon procedure: define polygon (sides) that draws a regular polygon with 40-step sides. On the flag, pen down and call polygon (3), polygon (4) and polygon (5).',
      title: 'Code Lab: polygon procedure',
      start: project([pen()], { backdrop: 'grid' }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Defines and calls a procedure', { t: 'defines', msg: 'Make a Block polygon with an input sides; put code under its define hat and call it.' }],
        ['Uses the parameter', { t: 'usesValue', kind: 'param', msg: 'Use the sides input in the repeat and the turn.' }],
        ['Draws 3 + 4 + 5 sides', { t: 'pen', minLines: 12, msg: 'Call polygon (3), polygon (4) and polygon (5).' }],
      ],
      test: { seconds: 4 },
      solution: project([pen([polygonDef, onFlag(eraseAll, goto(-60, -80), point(90), penDown, call('polygon', 3), call('polygon', 4), call('polygon', 5), penUp)])], { backdrop: 'grid' }),
      explain: 'One definition, three shapes — that’s abstraction.',
      hints: ['Turn: ( 360 ) / ( sides ) with sides dragged from the hat.', 'The calls are in My Blocks; type the number into each.'],
    },
    { match: 'Match the word to the example in polygon (sides) … polygon (5)', pairs: [['procedure', 'polygon'], ['parameter', 'sides'], ['argument', '5'], ['definition', 'the define polygon script']], why: 'Define with parameters; call with arguments.' },
    {
      lab: 'Flower: using your polygon procedure, repeat 6 times: call polygon (6) and turn right 60. That makes a hexagon flower.',
      title: 'Code Lab: polygon flower',
      start: project([pen([polygonDef])], { backdrop: 'grid' }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Calls the procedure', { t: 'defines', msg: 'Call polygon inside a loop.' }],
        ['Repeats it', { t: 'uses', ops: ['repeat', 'call'], msg: 'repeat 6 { polygon (6); turn right 60 }.' }],
        ['36 lines drawn', { t: 'pen', minLines: 36, msg: 'Six hexagons = 36 lines.' }],
      ],
      test: { seconds: 6 },
      solution: project([pen([polygonDef, onFlag(eraseAll, goto(0, 0), point(90), penDown, repeat(6, call('polygon', 6), turnR(60)), penUp)])], { backdrop: 'grid' }),
      explain: 'Procedures inside loops build complex designs from simple parts.',
      hints: ['The procedure is already defined — just call it.'],
      phase: 'probe',
    },
    { code: 'def greet(name):\n    print("Hi " + name)\n\ngreet("Sam")\ngreet("Lee")', ask: 'What does this Python print?', options: ['Hi Sam then Hi Lee', 'Hi name twice', 'Nothing — greet is never called'], answer: 0, why: 'Each call passes a different argument into the name parameter.', title: 'Functions in Python', lang: 'python', phase: 'probe' },
    { write: 'Explain the difference between a parameter and an argument using your own procedure as an example.', keywords: ['parameter', 'argument', 'call'], exemplar: 'In my block polygon (sides), sides is the parameter: it is the name the procedure uses inside. When I call polygon (5), the 5 is the argument: it is the actual value I pass in, so sides becomes 5 for that call.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Procedures (My Blocks / Python functions) encapsulate reusable behaviour. Parameters are placeholders in the definition; arguments are values at the call. Parameters are local to the definition.',
    analogy: 'A coffee machine button “make coffee (size)”: the machine’s steps are fixed, you choose the size.',
    vocab: [
      ['procedure / function', 'A named, reusable block of code.'],
      ['parameter', 'The input name in the definition.'],
      ['argument', 'The value passed when calling.'],
      ['call', 'Using (running) a procedure.'],
    ],
    demo: 'Write the 3 polygons long-hand, then refactor into polygon (sides).',
    unplugged: 'Function machine (5 min): a learner is “double (n)”; the class passes arguments and gets outputs.',
    prompts: [
      ['Where is the parameter?', 'In the define hat.'],
      ['What is the argument in polygon (5)?', '5.'],
      ['Why test the procedure alone?', 'Find bugs before combining.'],
    ],
    support: 'Provide the define hat with sides; learners fill in the body.',
    stretch: 'Make star (size) and use it in a loop with growing sizes.',
    mis: [
      ['Defining runs the code', 'Only calling runs it.'],
      ['Parameters are global variables', 'They exist only inside the define script.'],
    ],
    successCriteria: ['I can define a procedure with a parameter.', 'I can call it with different arguments.', 'I can explain parameter vs argument.'],
    homework: 'Write three procedures you could use in daily life, each with one parameter (e.g. walk (minutes)).',
    exit: 'In polygon (8), what is the argument?',
  },
});

export const H5 = lesson(5, {
  title: 'Decomposition and Abstraction',
  objective: 'Break a problem into smaller procedures, build a solution from them, and refactor repeated code into a procedure.',
  concept: 'Decomposition and refactoring',
  hook: ['word', '🏠 = ⬜ + 🔺', 'big problems, small pieces'],
  cards: [
    { emoji: '🧩', title: 'Decomposition', body: 'Decomposition means breaking a big problem into smaller ones. A house is a square plus a roof; a street is houses in a row.' },
    { emoji: '🏗️', title: 'Build up from procedures', body: 'Write and test the small procedures first (square, roof), then a bigger one (house) that calls them.', blocks: 'define house (size)\nsquare (size)\nroof (size)' },
    { emoji: '🙈', title: 'Abstraction', body: 'Once house works, you can use it without thinking about its details. Abstraction hides complexity behind a simple name.' },
    { emoji: '♻️', title: 'Refactoring', body: 'Refactoring is improving the structure of code without changing what it does — like replacing copy-pasted blocks with a procedure.' },
  ],
  build: {
    title: 'A street of houses',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'square (size)', text: 'repeat 4 { move size; turn left 90 }.' },
      { title: 'roof (size)', text: 'Move up to the top of the square, then repeat 3 { move size; turn left 120 }.' },
      { title: 'house (size)', text: 'Calls square, then roof.' },
      { title: 'Street', text: 'repeat 4 { house 50; move to the right }.' },
      { title: 'Refactor', text: 'Look for any repeated blocks left and turn them into a procedure.', tip: 'Test each procedure on its own before using it in the next.' },
    ],
  },
  acts: [
    {
      lab: 'A street: square (size) and roof (size) are defined. Draw a street of 3 houses: repeat 3 { square (50); roof (50) — or your own house block — then move 70 to the right without drawing }.',
      title: 'Code Lab: street of houses',
      start: project([pen([squareDef, roofDef])], { backdrop: 'grid' }),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Uses the procedures', { t: 'defines', msg: 'Call square and roof (or a house block that calls them).' }],
        ['Three houses', { t: 'pen', minLines: 21, msg: 'Each house is 4 + 3 lines; draw three.' }],
        ['Uses a loop', { t: 'uses', ops: ['repeat'], msg: 'Repeat for each house instead of copying.' }],
      ],
      test: { seconds: 6 },
      solution: project(
        [pen([squareDef, roofDef, define('house', 'size', call('square', param('size')), changeY(param('size')), call('roof', param('size')), changeY(op('-', 0, param('size')))), onFlag(eraseAll, goto(-200, -60), point(90), repeat(3, penDown, call('house', 50), penUp, changeX(70)))])],
        { backdrop: 'grid' },
      ),
      explain: 'Small procedures → bigger procedures → a whole street.',
      hints: ['After the square, move up by size before drawing the roof.', 'Pen up before moving to the next house.'],
    },
    {
      lab: 'Refactor: this Frog hops three times with the same 4 blocks copied three times. Make a hop block and call it 3 times, so the program uses 12 blocks or fewer and still ends at the same place (x = 60).',
      title: 'Code Lab: refactor with a procedure',
      start: project([sprite('Frog', ['🐸'], -120, -80, [onFlag(goto(-120, -80), changeY(30), changeX(30), changeY(-30), changeX(30), changeY(30), changeX(30), changeY(-30), changeX(30), changeY(30), changeX(30), changeY(-30), changeX(30))])]),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Same result', { t: 'final', sprite: 'Frog', prop: 'x', cmp: '~', value: 60, tol: 1, msg: 'The Frog should still finish at x = 60.' }],
        ['Uses a procedure', { t: 'defines', msg: 'Define hop and call it.' }],
        ['Shorter code', { t: 'maxBlocks', n: 12, msg: 'Replace the copies with calls to hop (12 blocks or fewer).' }],
      ],
      test: { seconds: 2 },
      solution: project([sprite('Frog', ['🐸'], -120, -80, [define('hop', undefined, changeY(30), changeX(30), changeY(-30), changeX(30)), onFlag(goto(-120, -80), call('hop'), call('hop'), call('hop'))])]),
      explain: 'Same behaviour, cleaner code — that’s refactoring.',
      hints: ['Define hop with the 4 blocks of one hop.', 'Delete the copies and call hop three times.'],
    },
    { sort: 'Decompose “make a racing game” — which part is which?', buckets: ['Player', 'Track', 'Rules'], items: [['steer with arrow keys', 0], ['draw the road edges', 1], ['lap counter', 2], ['speed up with the up arrow', 0], ['crash when touching the grass', 2], ['place the finish line', 1]], why: 'Decomposition splits a big project into manageable parts.', phase: 'probe' },
    { write: 'Decompose a project you want to build into at least 4 procedures. Name each one and say what it does.', keywords: ['procedure', 'decompose', 'does'], exemplar: 'A space game: setupLevel puts the asteroids in place; movePlayer reads the keys; fire creates a laser clone; checkHits tests collisions and updates the score. Each one is small and I can test it on its own.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Decomposition splits problems into sub-problems; procedures implement them bottom-up; abstraction lets you use a procedure by name; refactoring improves structure without changing behaviour (verified by tests).',
    analogy: 'Building with LEGO: bricks → walls → rooms → a house.',
    vocab: [
      ['decomposition', 'Breaking a problem into smaller parts.'],
      ['abstraction', 'Hiding details behind a simple name.'],
      ['refactor', 'Improve code structure without changing behaviour.'],
      ['bottom-up', 'Build small parts first, then combine.'],
    ],
    demo: 'Refactor the frog live: count blocks before and after; re-run to prove behaviour is unchanged.',
    unplugged: 'Decompose breakfast (5 min): break “make breakfast” into procedures with parameters.',
    prompts: [
      ['What is the smallest piece of the house?', 'A square or a roof.'],
      ['How do you know a refactor worked?', 'Same behaviour, cleaner code.'],
      ['Why build bottom-up?', 'Test small pieces first.'],
    ],
    support: 'Provide house as a call sequence; learners add the loop.',
    stretch: 'Add a door (size) procedure and windows.',
    mis: [
      ['Refactoring adds features', 'It keeps behaviour the same.'],
      ['Bigger procedures are better', 'Small, focused procedures are easier to test.'],
    ],
    successCriteria: ['I can decompose a problem into procedures.', 'I can build bigger procedures from smaller ones.', 'I can refactor repeated code.'],
    homework: 'Find copy-pasted code in one of your old projects and plan a refactor.',
    exit: 'What does refactoring change, and what must it NOT change?',
  },
});

export const H6 = lesson(6, {
  title: 'Project: Procedural City',
  objective: 'Plan, build and test a program that draws a city skyline from procedures with parameters and randomness.',
  concept: 'Project: procedures',
  hook: ['word', '🏙️', 'a new city every run'],
  cards: [
    { emoji: '🌆', title: 'Procedural generation', body: 'Games like Minecraft generate worlds from procedures and random numbers. You’ll generate a city skyline.' },
    { emoji: '🏢', title: 'A building procedure', body: 'building (height) draws a rectangle of a fixed width and the given height. Call it with random heights.', blocks: 'building (pick random (40) to (150))' },
    { emoji: '🪟', title: 'Details', body: 'Add procedures for windows, roofs, trees or stars — each one small and tested.' },
    { emoji: '📐', title: 'Design document', body: 'List your procedures, their parameters and what each draws before you code.' },
  ],
  build: {
    title: 'Build the Procedural City',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Plan', text: 'List your procedures and parameters.' },
      { title: 'building (height)', text: 'Draw a 40-wide rectangle of the given height, ending at the bottom right.' },
      { title: 'Skyline', text: 'Repeat 8 times: building (random height).' },
      { title: 'Details', text: 'Add at least one more procedure (windows, roof, tree).' },
      { title: 'Test & submit', text: 'Run it several times — every city should be different.' },
    ],
  },
  acts: [
    { order: 'Order the building procedure', steps: ['Pen down at the bottom left', 'Move up by height', 'Move right 40', 'Move down by height', 'Pen up, ready for the next building'], why: 'A rectangle that ends where the next one starts.', title: 'Plan building (height)' },
    {
      lab: 'Build your Procedural City: at least one procedure with a parameter, called in a loop with random arguments, drawing at least 24 lines.',
      title: 'Project: Procedural City',
      mode: 'project',
      start: project([pen()], { backdrop: 'space' }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Procedures', { t: 'defines', msg: 'Define and call at least one procedure.' }],
        ['Parameters', { t: 'usesValue', kind: 'param', msg: 'Give your procedure a parameter (e.g. height) and use it.' }],
        ['Randomness', { t: 'usesRandom', msg: 'Pass random arguments so every city differs.' }],
        ['A full skyline', { t: 'pen', minLines: 24, msg: 'Draw at least 8 buildings (24+ lines).' }],
      ],
      test: { seconds: 6 },
      solution: project(
        [
          pen([
            define('building', 'height', penDown, point(0), move(param('height')), point(90), move(40), point(180), move(param('height')), point(90), penUp, move(10)),
            onFlag(eraseAll, goto(-230, -120), penColor('yellow'), repeat(8, call('building', rand(40, 150)))),
          ]),
        ],
        { backdrop: 'space' },
      ),
      explain: 'City submitted! Your teacher will generate a few cities.',
      hints: ['Test building (100) on its own first.', 'Make sure each building ends ready for the next one.'],
      requirements: ['A design document', 'Procedures with parameters', 'Random arguments', '8+ buildings', 'At least one detail procedure', 'Tested several times'],
      reflection: 'List your procedures and parameters. Which procedure was hardest to get right, and how did you test it?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Procedural generation combines parameterised procedures with randomness. Assess decomposition (design document), correct parameter use, and testing of procedures in isolation.',
    analogy: 'A city planner with stamps of different sizes.',
    vocab: [
      ['procedural generation', 'Creating content with code and randomness.'],
      ['design document', 'A plan of procedures and parameters.'],
      ['unit test', 'Testing one small piece on its own.'],
    ],
    demo: 'Write building (height) and call it with 50, 100, 150; then in a loop with random.',
    unplugged: 'Skyline (5 min): roll a die for each building height and draw on squared paper.',
    prompts: [
      ['What is your building’s parameter?', 'Height.'],
      ['Where does randomness come in?', 'The argument.'],
      ['How did you test a procedure?', 'Called it alone with known values.'],
    ],
    support: 'Provide building (height); learners add the loop and one detail.',
    stretch: 'windows (height) inside building; night/day colour schemes.',
    mis: [
      ['Each building needs its own code', 'One procedure, many calls.'],
      ['Random means unplanned', 'The rules are designed; only values vary.'],
    ],
    successCriteria: ['My city is built from procedures with parameters.', 'It uses random arguments.', 'I tested my procedures on their own.'],
    homework: 'Generate five cities and screenshot (or sketch) your favourite.',
    exit: 'Name one procedure in your city and its parameter.',
  },
  project: {
    title: 'Procedural City',
    brief: 'Generate a city skyline from procedures: a building procedure with a height parameter called in a loop with random arguments, plus at least one detail procedure. Plan it in a design document and test each procedure alone.',
    requirements: ['Design document', 'Procedures with parameters', 'Random arguments', '8+ buildings', 'Detail procedure', 'Tested'],
    milestones: ['Design document', 'building (height)', 'Skyline loop', 'Details', 'Tested and submitted'],
    rubric: [
      { criterion: 'Decomposition', levels: ['None', 'One big script', 'Several focused procedures', 'Well-layered procedures calling procedures'] },
      { criterion: 'Parameters', levels: ['None', 'Defined but unused', 'Used correctly', 'Several parameters used thoughtfully'] },
      { criterion: 'Generation', levels: ['Fixed picture', 'Some randomness', 'Different city each run', 'Varied, designed results'] },
      { criterion: 'Visual quality', levels: ['Unclear', 'Basic', 'Attractive', 'Detailed and striking'] },
      { criterion: 'Testing & reflection', levels: ['None', 'Ran once', 'Procedures tested alone', 'Explains testing and fixes'] },
    ],
    extensions: ['Windows inside buildings', 'Day/night colours', 'Trees and stars'],
  },
});

