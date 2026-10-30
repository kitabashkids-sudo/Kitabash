// Scratch Gr 6–8 Beginner · Module 1 — Algorithms, sequence and events. Project: Interactive Poster.
import { lesson } from '../kit.ts';
import { P_ALL, P_EVENTS, broadcast, changeEffect, changeX, changeY, clearEffects, goto, move, onClick, onFlag, onKey, onReceive, penDown, penUp, point, project, sayFor, sound, sprite, turnL, turnR, eraseAll, glide, nextCostume, wait } from '../scratch-3-5/lab.ts';
import type { StmtOp } from '../../../scratch/vm.ts';

const P_PEN: StmtOp[] = [...P_EVENTS, 'penDown', 'penUp', 'eraseAll', 'setPenColor'];
const pen = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Pen', ['✏️'], -60, -60, scripts);
const drone = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Drone', ['🛸'], 0, 0, scripts);

export const G1 = lesson(1, {
  title: 'Algorithms: Precise Instructions',
  objective: 'Explain what an algorithm is, write a precise sequence of instructions, and debug a sequence that gives the wrong result.',
  concept: 'Algorithms and sequence',
  hook: ['word', '🥪 = 1️⃣ 2️⃣ 3️⃣', 'a sandwich is an algorithm'],
  intro: 'Every app, game and website runs on algorithms. Today you’ll learn to write instructions a computer can follow exactly.',
  cards: [
    { emoji: '📜', title: 'What is an algorithm?', body: 'An algorithm is a precise, step-by-step set of instructions to solve a problem. Recipes, directions and dance routines are all algorithms.' },
    { emoji: '🤖', title: 'Computers are literal', body: 'A computer does exactly what you say, in exactly the order you say it — never what you meant. Precision matters.' },
    { emoji: '📐', title: 'Sequence', body: 'Sequence means order. Swap two steps and you can get a completely different result.', blocks: 'pen down\nmove (100) steps\nturn right (90) degrees\nmove (50) steps' },
    { emoji: '🐍', title: 'In text code', body: 'The same idea in Python’s turtle module looks like: forward(100), right(90), forward(50). Blocks and text code share the same thinking.' },
  ],
  build: {
    title: 'Draw with an algorithm',
    intro: 'Code Lab or Scratch (add the Pen extension).',
    steps: [
      { title: 'Start clean', text: 'When the flag is clicked: erase all, go to x: -60 y: -60, point in direction 90.', blocks: 'when green flag clicked\nerase all\ngo to x: (-60) y: (-60)\npoint in direction (90)' },
      { title: 'Pen down', text: 'Add pen down so the sprite draws as it moves.' },
      { title: 'Draw an L', text: 'move 100, turn left 90, move 100… wait, which way is up? Predict first, then run.' },
      { title: 'Debug', text: 'If it went the wrong way, change ONE block and run again.' },
      { title: 'Finish', text: 'Add pen up at the end so later moves don’t draw.', tip: 'Read your code out loud like a robot — you’ll catch mistakes.' },
    ],
  },
  acts: [
    {
      lab: 'Draw an “L”: start clean (erase all, go to x: -60 y: 40, point in direction 180 to face down), pen down, move 100 down the stem, turn left 90 to face right, then move 60 for the foot. Draw at least 2 lines.',
      title: 'Code Lab: draw an L',
      start: project([pen()], { backdrop: 'grid' }),
      palette: P_PEN,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Draws 2+ lines', { t: 'pen', minLines: 2, msg: 'Pen down, then move, turn and move again.' }],
        ['Starts clean', { t: 'uses', ops: ['eraseAll', 'goto'], msg: 'Begin with erase all and go to x: -60 y: -60.' }],
        ['Uses turns', { t: 'usesAny', ops: ['turnR', 'turnL'], msg: 'Turn 90 degrees between the two lines.' }],
      ],
      test: { seconds: 2 },
      solution: project([pen([onFlag(eraseAll, goto(-60, 40), point(180), penDown, move(100), turnL(90), move(60), penUp)])], { backdrop: 'grid' }),
      explain: 'Your first drawing algorithm — precise steps, precise result.',
      hints: ['Start at the top of the L, face down (direction 180), move 100, then turn left 90 to face right.', 'Direction 0 is up, 90 is right, 180 is down.'],
    },
    {
      lab: 'Debug the square: this algorithm should draw a closed square, but one step is wrong. Find and fix it.',
      title: 'Code Lab: debug the square',
      start: project([pen([onFlag(eraseAll, goto(-50, -50), point(90), penDown, move(100), turnL(90), move(100), turnL(90), move(100), turnR(90), move(100), penUp)])], { backdrop: 'grid' }),
      palette: P_PEN,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Draws a closed square', { t: 'pen', closed: true, minLines: 4, msg: 'All four turns must go the same way. One of them is different!' }],
      ],
      test: { seconds: 2 },
      solution: project([pen([onFlag(eraseAll, goto(-50, -50), point(90), penDown, move(100), turnL(90), move(100), turnL(90), move(100), turnL(90), move(100), penUp)])], { backdrop: 'grid' }),
      explain: 'Bug found and fixed. That’s debugging: compare what happened with what you expected.',
      hints: ['Run it and watch where the drawing goes wrong.', 'The third turn goes the wrong way.'],
    },
    { order: 'Put the debugging process in order', steps: ['Run the program', 'Compare what happened with what you expected', 'Find the first step that went wrong', 'Change one thing', 'Run it again to test'], why: 'Debug one change at a time.', title: 'How to debug' },
    { mcq: 'Which is the best definition of an algorithm?', options: ['A precise sequence of steps that solves a problem', 'Any computer program', 'A type of computer'], answer: 0, why: 'Algorithms exist with or without computers — recipes are algorithms too.', title: 'Define it', phase: 'probe' },
    { write: 'Write an algorithm (at least 5 numbered steps) for something you do every day. Then explain one place where a robot might misunderstand it.', keywords: ['step', 'order', 'precise'], exemplar: '1. Pick up the toothbrush. 2. Turn on the tap. 3. Wet the brush. 4. Put toothpaste on the brush. 5. Brush for two minutes. A robot might not know how much toothpaste to use, so step 4 is not precise enough.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'An algorithm is an unambiguous, ordered set of steps. Sequence matters; computers execute literally. Debugging = compare expected and actual behaviour, isolate the first divergence, change one thing, retest. Bridging card links Scratch pen to Python turtle.',
    analogy: 'A GPS route: each turn must be right and in the right order, or you end up somewhere else.',
    vocab: [
      ['algorithm', 'A precise set of steps to solve a problem.'],
      ['sequence', 'The order in which steps run.'],
      ['bug', 'A mistake that makes a program behave wrongly.'],
      ['debug', 'Find and fix bugs.'],
    ],
    demo: 'Run the buggy square; narrate expected vs actual at each step; fix the third turn live.',
    unplugged: 'Robot teacher (5 min): learners give the teacher instructions to draw a shape on the board; the teacher follows them literally.',
    prompts: [
      ['Why do computers need precise instructions?', 'They do exactly what they’re told.'],
      ['What happens if you swap two steps?', 'The result can change.'],
      ['What is the first step of debugging?', 'Run it and observe.'],
    ],
    support: 'Pair learners: one reads blocks aloud, one traces on grid paper.',
    stretch: 'Draw your initials using only move and turn blocks.',
    mis: [
      ['The computer knows what you meant', 'It follows instructions literally.'],
      ['Debugging means starting again', 'Change one thing at a time.'],
    ],
    successCriteria: ['I can explain what an algorithm is.', 'I can write a precise sequence.', 'I can debug a sequence by testing one change at a time.'],
    homework: 'Write a 6-step algorithm for making a drink. Ask someone to follow it exactly as written.',
    exit: 'Define algorithm in one sentence.',
  },
});

export const G2 = lesson(2, {
  title: 'Events and Parallel Scripts',
  objective: 'Use event hats (flag, key, click, broadcast) to make programs respond to users, and run several scripts at the same time.',
  concept: 'Event-driven programming',
  hook: ['word', '⌨️ 🖱️ 📣', 'programs that wait for you'],
  cards: [
    { emoji: '⚡', title: 'Event-driven programs', body: 'Most apps wait for events — a tap, a key, a message — and then react. In Scratch, hat blocks start scripts when an event happens.', blocks: 'when [right arrow v] key pressed\nchange x by (10)' },
    { emoji: '🔀', title: 'Parallel scripts', body: 'A sprite can have many scripts. They run at the same time, like several workers each doing one job.' },
    { emoji: '📣', title: 'Broadcasts', body: 'Broadcast sends a message to every sprite. Any script with “when I receive” that message starts. This is how sprites talk to each other.', blocks: 'when this sprite clicked\nbroadcast (party v)\n\nwhen I receive [party v]\nsay [Party time!] for (2) seconds' },
    { emoji: '🌐', title: 'In text code', body: 'Web pages do the same thing: button.onclick = startParty. Same idea, different language.' },
  ],
  build: {
    title: 'Drone controls',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Four keys', text: 'Four “when key pressed” scripts: right/left change x by ±10, up/down change y by ±10.' },
      { title: 'Reset', text: 'When the flag is clicked: go to x: 0 y: 0.' },
      { title: 'Click to signal', text: 'When this sprite clicked: broadcast party.' },
      { title: 'React', text: 'A second sprite: when I receive party → say “Party time!” and change colour effect.' },
      { title: 'Test events', text: 'Press keys and click — which scripts run at the same time?', tip: 'Broadcast names must match exactly.' },
    ],
  },
  acts: [
    {
      lab: 'Drone controls: four arrow-key scripts move the Drone 10 steps (right/left change x, up/down change y). The flag puts it back at 0, 0.',
      title: 'Code Lab: drone controls',
      start: project([drone()], { backdrop: 'space' }),
      palette: P_EVENTS,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['→ moves right', { t: 'keyMoves', key: 'right arrow', sprite: 'Drone', prop: 'x', sign: 1, msg: 'when right arrow key pressed → change x by 10.' }],
        ['← moves left', { t: 'keyMoves', key: 'left arrow', sprite: 'Drone', prop: 'x', sign: -1, msg: 'when left arrow key pressed → change x by -10.' }],
        ['↑ moves up', { t: 'keyMoves', key: 'up arrow', sprite: 'Drone', prop: 'y', sign: 1, msg: 'when up arrow key pressed → change y by 10.' }],
        ['↓ moves down', { t: 'keyMoves', key: 'down arrow', sprite: 'Drone', prop: 'y', sign: -1, msg: 'when down arrow key pressed → change y by -10.' }],
        ['Resets on the flag', { t: 'returnsOnFlag', sprite: 'Drone', props: ['pos'], msg: 'when green flag clicked → go to x: 0 y: 0.' }],
      ],
      test: { seconds: 3, keys: [{ at: 0.4, key: 'right arrow' }, { at: 0.9, key: 'left arrow' }, { at: 1.4, key: 'up arrow' }, { at: 1.9, key: 'down arrow' }] },
      solution: project([drone([onFlag(goto(0, 0)), onKey('right arrow', changeX(10)), onKey('left arrow', changeX(-10)), onKey('up arrow', changeY(10)), onKey('down arrow', changeY(-10))])], { backdrop: 'space' }),
      explain: 'Four events, four scripts — your drone flies.',
      hints: ['Choose the key from the ▾ menu on the “when key pressed” hat.', 'Down is change y by a NEGATIVE number.'],
    },
    {
      lab: 'Party signal: when the Drone is clicked, it broadcasts “party”. The Robot receives “party”, says “Party time!” and changes its colour effect by 50.',
      title: 'Code Lab: broadcast a signal',
      start: project([drone(), sprite('Robot', ['🤖'], 120, -80)], { backdrop: 'party' }),
      palette: P_ALL,
      hats: ['flag', 'key', 'click', 'receive'],
      goals: [
        ['Click sends “party”', { t: 'broadcast', message: 'party', msg: 'Drone: when this sprite clicked → broadcast party.' }],
        ['Robot reacts', { t: 'said', sprite: 'Robot', text: 'party time', msg: 'Robot: when I receive party → say “Party time!” for 2 seconds.' }],
        ['Robot listens', { t: 'hat', hat: 'receive', msg: 'The Robot needs a “when I receive party” hat.' }],
      ],
      test: { seconds: 3, clicks: [{ at: 0.5, sprite: 'Drone' }] },
      solution: project([drone([onClick(broadcast('party'))]), sprite('Robot', ['🤖'], 120, -80, [onFlag(clearEffects), onReceive('party', changeEffect('color', 50), sayFor('Party time!', 2))])], { backdrop: 'party' }),
      explain: 'One click, two sprites reacting — event-driven programming!',
      hints: ['The broadcast goes in the Drone’s click script; the reaction goes in the Robot.'],
    },
    { sort: 'Which event starts each script?', buckets: ['Green flag', 'Key press', 'Sprite click', 'Broadcast'], items: [['Reset the game at the start', 0], ['Jump when space is pressed', 1], ['Open a menu when a button sprite is tapped', 2], ['All enemies freeze when “pause” is sent', 3], ['Move left with the arrow', 1]], why: 'Choose the event that matches the trigger.' },
    { write: 'Name an app you use. Describe two events it waits for and what happens when each one occurs.', keywords: ['event', 'when', 'happens'], exemplar: 'A music app waits for events. When I tap play, the song starts. When a song ends, it gets an event and plays the next one automatically.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Event-driven programming: scripts are triggered by events (flag, key, click, broadcast). Multiple scripts run concurrently. Broadcasts decouple sender and receiver. Links to JavaScript event handlers.',
    analogy: 'A fire station: firefighters wait until the alarm (event) rings, then act.',
    vocab: [
      ['event', 'Something that happens, such as a click or key press.'],
      ['hat block', 'A block that starts a script when its event happens.'],
      ['parallel', 'Running at the same time.'],
      ['broadcast', 'A message sent to every sprite.'],
    ],
    demo: 'Show two scripts on one sprite running at once (spin forever + move with keys).',
    unplugged: 'Event cards (5 min): learners hold cards like “when clap → stand up”; the teacher triggers events.',
    prompts: [
      ['What starts a script in Scratch?', 'A hat block event.'],
      ['Can two scripts run at once?', 'Yes — in parallel.'],
      ['Who receives a broadcast?', 'Every sprite with a matching receive hat.'],
    ],
    support: 'Provide the right-arrow script; learners copy and adapt.',
    stretch: 'Add diagonal moves with combinations, or a “pause” broadcast.',
    mis: [
      ['Scripts run one after another', 'Each hat starts its own script in parallel.'],
      ['Broadcast goes to one sprite', 'It goes to all sprites.'],
    ],
    successCriteria: ['I can use event hats to respond to users.', 'I can run scripts in parallel.', 'I can make sprites communicate with broadcasts.'],
    homework: 'List five events that a smartphone responds to.',
    exit: 'Which block lets one sprite tell another to start?',
  },
});

export const G3 = lesson(3, {
  title: 'Project: Interactive Poster',
  objective: 'Plan, build and test an interactive poster where sprites respond to clicks, keys and broadcasts with motion, sound and effects.',
  concept: 'Project: events',
  hook: ['word', '🖼️ + 🖱️ = ✨', 'a poster that reacts'],
  cards: [
    { emoji: '🖼️', title: 'Your poster', body: 'Make an interactive poster about a topic you care about — a sport, an animal, a place, a cause. Each sprite reacts when clicked.' },
    { emoji: '🧭', title: 'Plan the interactions', body: 'For each sprite, decide its event (click or key) and its reaction (fact, sound, animation). Draw a quick storyboard first.' },
    { emoji: '📣', title: 'Link sprites', body: 'Use a broadcast so one click can start several reactions — like a title that makes everything dance.' },
    { emoji: '🧪', title: 'Test like a user', body: 'Ask a classmate to explore your poster without help. Could they find every interaction?' },
  ],
  build: {
    title: 'Build your Interactive Poster',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Choose a topic', text: 'Pick a topic and a backdrop. Add at least 3 sprites.' },
      { title: 'Reset', text: 'Each sprite goes to its start place on the green flag.' },
      { title: 'Click reactions', text: 'Each sprite says a fact and does a motion or effect when clicked.' },
      { title: 'Broadcast', text: 'One sprite broadcasts a message that makes the others react.' },
      { title: 'Test and improve', text: 'Watch a classmate use it. Fix anything confusing, then submit.' },
    ],
  },
  acts: [
    { match: 'Match the event to the reaction it should trigger', pairs: [['Title clicked', 'Broadcast “start” to everyone'], ['Animal clicked', 'Say a fact about it'], ['Space key', 'Play a sound'], ['Green flag', 'Reset positions']], why: 'Every interaction starts with an event.' },
    {
      lab: 'Build your Interactive Poster: at least 3 sprites, each reacting to a click; a broadcast that links sprites; sound or effects; and everything resets on the flag.',
      title: 'Project: Interactive Poster',
      mode: 'project',
      start: project([sprite('Title', ['🌍'], 0, 120), sprite('Fact1', ['🐼'], -140, -40), sprite('Fact2', ['🐋'], 140, -40)], { backdrop: 'grass' }),
      palette: P_ALL,
      allowSprites: true,
      goals: [
        ['3+ sprites', { t: 'sprites', min: 3, msg: 'Your poster needs at least 3 sprites.' }],
        ['Every sprite reacts to a click', { t: 'eachHas', hat: 'click', msg: 'Give every sprite a “when this sprite clicked” script.' }],
        ['A broadcast links sprites', { t: 'hat', hat: 'receive', msg: 'Use broadcast and “when I receive”.' }],
        ['Sound or effects', { t: 'usesAny', ops: ['sound', 'changeEffect', 'nextCostume', 'glide'], msg: 'Add sound, effects or animation.' }],
        ['Resets on the flag', { t: 'hat', hat: 'flag', msg: 'Use the green flag to reset positions and effects.' }],
      ],
      test: { seconds: 3, clicks: [{ at: 0.5, sprite: 'Title' }] },
      solution: project(
        [
          sprite('Title', ['🌍'], 0, 120, [onFlag(goto(0, 120)), onClick(sound('pop'), broadcast('start'))]),
          sprite('Fact1', ['🐼'], -140, -40, [onFlag(goto(-140, -40), clearEffects), onClick(sayFor('Pandas eat bamboo for 12 hours a day!', 2)), onReceive('start', glide(0.5, -140, 0), glide(0.5, -140, -40))]),
          sprite('Fact2', ['🐋'], 140, -40, [onFlag(goto(140, -40), clearEffects), onClick(sayFor('Blue whales are the largest animals ever!', 2)), onReceive('start', changeEffect('color', 40), wait(0.5), nextCostume)]),
        ],
        { backdrop: 'grass' },
      ),
      explain: 'Poster submitted! Your teacher will explore it.',
      hints: ['Start with one sprite working completely, then copy the pattern.', 'The Title is a good sprite to broadcast from.'],
      requirements: ['A clear topic', '3+ sprites', 'Every sprite reacts to a click', 'A broadcast links sprites', 'Sound or effects', 'Resets on the flag', 'Tested by a classmate'],
      reflection: 'What did your tester find hard to discover, and what did you change?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Applies event-driven design: each sprite maps events to reactions; broadcasts coordinate; the flag resets state. Emphasise user testing and discoverability.',
    analogy: 'A museum exhibit: press a button, something happens.',
    vocab: [
      ['interaction', 'A way the user can make something happen.'],
      ['storyboard', 'A sketch plan of what happens.'],
      ['user testing', 'Watching someone use your program.'],
    ],
    demo: 'Show a finished poster; let a learner explore while the class notes each event and reaction.',
    unplugged: 'Storyboard (5 min): sketch your poster with arrows labelled with events.',
    prompts: [
      ['What event starts each reaction?', 'Click, key, or broadcast.'],
      ['How does your poster reset?', 'Green-flag scripts.'],
      ['What did your tester miss?', 'Discoverability feedback.'],
    ],
    support: 'Two sprites plus a title; reuse the same click pattern.',
    stretch: 'Add a quiz sprite that asks a question about the topic.',
    mis: [
      ['One script per sprite is enough', 'Sprites usually need reset + reaction scripts.'],
      ['Users will find every interaction', 'Add hints like “click me!”.'],
    ],
    successCriteria: ['My poster uses click, flag and broadcast events.', 'Every sprite reacts with motion, sound or effects.', 'I tested it with a user and improved it.'],
    homework: 'Show your poster to someone at home and note what they clicked first.',
    exit: 'One improvement you made after user testing.',
  },
  project: {
    title: 'Interactive Poster',
    brief: 'Build an interactive poster about a topic you care about: at least three sprites that react to clicks with facts, motion, sound or effects, linked by a broadcast, and reset on the green flag.',
    requirements: ['Clear topic', '3+ sprites', 'Click reactions', 'Broadcast link', 'Sound or effects', 'Resets on flag', 'User-tested'],
    milestones: ['Topic and storyboard', 'Sprites placed', 'Click reactions', 'Broadcast', 'Tested and submitted'],
    rubric: [
      { criterion: 'Events', levels: ['None work', 'Some clicks', 'Every sprite reacts; flag resets', 'Rich use of click, key and broadcast'] },
      { criterion: 'Content', levels: ['No topic', 'Few facts', 'Accurate, clear facts', 'Engaging, well-researched facts'] },
      { criterion: 'Media', levels: ['None', 'Some motion', 'Motion plus sound or effects', 'Polished animation and sound'] },
      { criterion: 'Design', levels: ['Confusing', 'Usable', 'Clear layout with hints', 'Delightful and easy to explore'] },
      { criterion: 'Testing & reflection', levels: ['Not tested', 'Self-tested', 'User-tested; change explained', 'Several user-driven changes explained'] },
    ],
    extensions: ['Key shortcuts', 'A quiz sprite', 'Background music'],
  },
});
