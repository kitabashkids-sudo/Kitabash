// Scratch Gr 3–5 Advanced · Module 2 — Game physics: smooth movement, gravity and jumping. Project: Jumpy Platformer.
import { lesson } from '../kit.ts';
import { P_ADV, changeVar, changeX, changeY, forever, goto, ifThen, keyIs, lt, n, onFlag, onKey, project, setVar, setY, sound, sprite, touching, vr, ypos, gt, setX, xpos } from '../scratch-3-5/lab.ts';

const FLOOR = -120;
const hero = (scripts: ReturnType<typeof onFlag>[] = [], y = 100) => sprite('Hero', ['🐸', '🐸'], 0, y, scripts);
const walk = forever(ifThen(keyIs('right arrow'), changeX(6)), ifThen(keyIs('left arrow'), changeX(-6)));
const gravity = [setVar('vy', 0), forever(changeVar('vy', -1), changeY(vr('vy')), ifThen(lt(ypos, n(FLOOR)), setY(FLOOR), setVar('vy', 0)))];
const jump = onKey('space', ifThen(lt(ypos, n(FLOOR + 2)), setVar('vy', 14), sound('boing')));

export const A4 = lesson(4, {
  title: 'Gravity: What Goes Up…',
  objective: 'Use a velocity variable to make a sprite fall faster and faster and land on the floor, and give it smooth sideways movement.',
  concept: 'Velocity and gravity',
  hook: ['word', '🍎 ⬇️', 'why do things speed up as they fall?'],
  intro: 'Real games feel real because things fall like they do in the real world. Today you’ll code gravity!',
  cards: [
    { emoji: '🏎️', title: 'Velocity = speed + direction', body: 'Make a variable called vy (velocity in y). It says how many steps the sprite moves up or down each frame. Negative vy means falling.' },
    { emoji: '🌍', title: 'Gravity pulls vy down', body: 'Every frame, gravity changes vy by -1, then the sprite changes y by vy. The fall gets faster and faster — just like a real apple.', blocks: 'forever\nchange [vy v] by (-1)\nchange y by (vy)\nend' },
    { emoji: '🟫', title: 'Land on the floor', body: 'If the sprite goes below the floor, put it back on the floor and set vy to 0 so it stops falling.', blocks: 'if <(y position) < (-120)> then\nset y to (-120)\nset [vy v] to (0)\nend' },
    { emoji: '🕹️', title: 'Walk smoothly', body: 'In another forever loop, check the arrow keys and change x. Now the hero can walk and fall at the same time.' },
  ],
  build: {
    title: 'Drop the frog',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Make vy', text: 'Make a variable called vy. When the flag is clicked, set vy to 0.' },
      { title: 'Gravity loop', text: 'forever: change vy by -1, then change y by vy.', blocks: 'when green flag clicked\nset [vy v] to (0)\nforever\nchange [vy v] by (-1)\nchange y by (vy)\nend' },
      { title: 'The floor', text: 'Inside the loop: if y position < -120 → set y to -120 and set vy to 0.' },
      { title: 'Walk', text: 'A second script: forever, if right arrow pressed change x by 6; if left arrow pressed change x by -6.' },
      { title: 'Experiment', text: 'Try gravity -2 or -0.5. Is it the Moon or Jupiter?', tip: 'Watch the vy variable on the stage while it falls — it gets more and more negative.' },
    ],
  },
  acts: [
    {
      lab: 'Gravity: the Hero starts high up. Use a vy variable: forever change vy by -1 and change y by vy. If y position < -120, set y to -120 and vy to 0, so the Hero lands on the floor.',
      title: 'Code Lab: gravity',
      start: project([hero()], { vars: ['vy'] }),
      palette: P_ADV,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Moves by vy', { t: 'usesVar', name: 'vy', msg: 'Use “change y by (vy)” so the sprite moves by its velocity.' }],
        ['Gravity changes vy', { t: 'varChanged', name: 'vy', msg: 'Each frame: change vy by -1.' }],
        ['Lands on the floor', { t: 'final', sprite: 'Hero', prop: 'y', cmp: '~', value: FLOOR, tol: 3, msg: 'If y position < -120 → set y to -120 and set vy to 0.' }],
      ],
      test: { seconds: 3 },
      solution: project([hero([onFlag(goto(0, 100), ...gravity)])], { vars: ['vy'] }),
      explain: 'You coded gravity — the fall speeds up, then the frog lands.',
      hints: ['Inside forever: change vy by -1 → change y by (vy) → if y < -120 { set y to -120; set vy to 0 }.', 'Drag the vy reporter into the “change y by” slot.'],
    },
    { mcq: 'vy is -3. Gravity changes vy by -1 each frame. What is vy two frames later?', options: ['-5', '-1', '-3'], answer: 0, why: '-3 - 1 - 1 = -5: the sprite falls faster.', title: 'Follow the velocity' },
    {
      lab: 'Walk and fall: keep your gravity, and add smooth walking — forever, if right arrow pressed change x by 6; if left arrow pressed change x by -6.',
      title: 'Code Lab: walk and fall',
      start: project([hero([onFlag(goto(0, 100), ...gravity)])], { vars: ['vy'] }),
      palette: P_ADV,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Holding → walks right', { t: 'keyMoves', key: 'right arrow', sprite: 'Hero', prop: 'x', sign: 1, msg: 'forever { if <key right arrow pressed?> then change x by 6 }.' }],
        ['Holding ← walks left', { t: 'keyMoves', key: 'left arrow', sprite: 'Hero', prop: 'x', sign: -1, msg: 'Add the left arrow: change x by -6.' }],
        ['Still lands', { t: 'final', sprite: 'Hero', prop: 'y', cmp: '~', value: FLOOR, tol: 3, msg: 'Keep the gravity script working.' }],
      ],
      test: { seconds: 3, keys: [{ at: 1, key: 'right arrow', hold: 0.5 }, { at: 2, key: 'left arrow', hold: 0.5 }] },
      solution: project([hero([onFlag(goto(0, 100), ...gravity), onFlag(walk)])], { vars: ['vy'] }),
      explain: 'Two loops at once: one for gravity, one for walking.',
      hints: ['Add a second “when green flag clicked” script for walking.'],
      phase: 'probe',
    },
    { write: 'Explain in your own words why the sprite falls faster and faster. Use the words velocity and gravity.', keywords: ['velocity', 'gravity', 'faster'], exemplar: 'Gravity changes the velocity by -1 every frame, so the velocity gets more and more negative. The sprite moves by its velocity, so each frame it moves down further and falls faster.', minWords: 20, phase: 'probe' },
  ],
  teacher: {
    explain: 'A velocity variable stores how far the sprite moves per frame; gravity is a constant change to that velocity (acceleration). Landing clamps the position and zeroes the velocity. Separate polling loops handle horizontal input concurrently.',
    analogy: 'Rolling down a hill: every second you roll a bit faster than the second before.',
    vocab: [
      ['velocity', 'Speed with a direction (up is +, down is −).'],
      ['gravity', 'A pull that keeps changing the velocity downward.'],
      ['frame', 'One step of the game loop (about 30 per second).'],
      ['floor', 'The lowest place the sprite can stand.'],
    ],
    demo: 'Show “change y by -5” (constant fall) next to the vy version (accelerating fall). Ask which looks real.',
    unplugged: 'Step-and-grow (5 min): a learner takes 1 step, then 2, then 3… while the class counts — that’s acceleration.',
    prompts: [
      ['What does vy store?', 'How far to move up or down each frame.'],
      ['Why set vy to 0 on the floor?', 'So the sprite stops falling through the floor.'],
      ['How do we make the Moon’s gravity?', 'Change vy by a smaller amount, e.g. -0.3.'],
    ],
    support: 'Provide the gravity loop; learners add the floor check.',
    stretch: 'Add a terminal velocity: if vy < -15, set vy to -15.',
    mis: [
      ['Gravity means changing y by a fixed number', 'Gravity changes the velocity; the velocity changes y.'],
      ['The order of blocks in the loop doesn’t matter', 'Change vy, move, then check the floor.'],
    ],
    successCriteria: ['I can use a velocity variable.', 'I can code gravity that speeds up a fall.', 'I can make a sprite land on the floor.'],
    homework: 'Drop a ball and a sheet of paper at home. Which speeds up more? Why might a game use different gravity?',
    exit: 'What two blocks make gravity work every frame?',
  },
});

export const A5 = lesson(5, {
  title: 'Jump!',
  objective: 'Make a sprite jump by setting its velocity upward, only when it is standing on the floor.',
  concept: 'Jumping with velocity',
  hook: ['word', '🐸 ⬆️ ⬇️', 'up, slow, stop, down'],
  cards: [
    { emoji: '🚀', title: 'A jump is a push up', body: 'To jump, set vy to a positive number like 14. Gravity takes over: the sprite rises, slows down, stops at the top, then falls.', blocks: 'when [space v] key pressed\nset [vy v] to (14)' },
    { emoji: '🦶', title: 'Only jump from the floor', body: 'Without a check, players can jump in mid-air forever. Only jump if the sprite is on the floor.', blocks: 'when [space v] key pressed\nif <(y position) < (-118)> then\nset [vy v] to (14)\nend' },
    { emoji: '📈', title: 'The jump curve', body: 'Because gravity changes vy a little each frame, a jump makes a smooth curve — like a ball thrown in the air.' },
    { emoji: '🎚️', title: 'Tune the jump', body: 'A bigger push jumps higher. Stronger gravity makes jumps shorter and snappier. Tuning these numbers is real game design.' },
  ],
  build: {
    title: 'Make the frog jump',
    intro: 'Start from your gravity code.',
    steps: [
      { title: 'Space to jump', text: 'when space key pressed → set vy to 14.' },
      { title: 'Only on the floor', text: 'Wrap it in: if y position < -118 then … so there are no mid-air jumps.' },
      { title: 'Sound', text: 'Add start sound (boing) inside the if.' },
      { title: 'Tune', text: 'Try vy 10, 14 and 20. Which feels best?', tip: 'If the jump does nothing, check the floor number matches your gravity script.' },
      { title: 'Run and jump', text: 'Add your walking loop from Lesson 4 so the frog can jump while moving.' },
    ],
  },
  acts: [
    {
      lab: 'Jump: gravity is already coded. When the space key is pressed, if the Hero is on the floor (y position < -118), set vy to 14. The Hero should jump up and land again.',
      title: 'Code Lab: jump',
      start: project([hero([onFlag(goto(0, FLOOR), ...gravity)], FLOOR)], { vars: ['vy'] }),
      palette: P_ADV,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Space makes it jump', { t: 'keyMoves', key: 'space', sprite: 'Hero', prop: 'y', sign: 1, msg: 'when space key pressed → set vy to 14.' }],
        ['Lands again', { t: 'final', sprite: 'Hero', prop: 'y', cmp: '~', value: FLOOR, tol: 3, msg: 'Keep the gravity script so the Hero comes back down.' }],
        ['Only jumps from the floor', { t: 'uses', ops: ['if'], msg: 'Put the jump inside: if <(y position) < -118> then.' }],
      ],
      test: { seconds: 3, keys: [{ at: 0.5, key: 'space', hold: 0.1 }] },
      solution: project([hero([onFlag(goto(0, FLOOR), ...gravity), jump], FLOOR)], { vars: ['vy'] }),
      explain: 'Boing! Up, slow, stop, down — gravity does the rest.',
      hints: ['You only need to set vy — the gravity loop moves the sprite.', 'Condition: (y position) < (-118).'],
    },
    {
      bmcq: 'The player can jump again and again in mid-air, flying off the top. Which script fixes it?',
      blocks: 'when [space v] key pressed\nset [vy v] to (14)',
      options: [
        { text: 'A', blocks: 'when [space v] key pressed\nif <(y position) < (-118)> then\nset [vy v] to (14)\nend' },
        { text: 'B', blocks: 'when [space v] key pressed\nset [vy v] to (28)' },
        { text: 'C', blocks: 'when [space v] key pressed\nchange y by (14)' },
      ],
      answer: 0,
      why: 'Only allow a jump when the sprite is on the floor.',
      title: 'Debug the flying frog',
    },
    { order: 'Put a jump in order (what happens to vy)', steps: ['Space pressed: vy is set to 14', 'The sprite rises; gravity makes vy smaller each frame', 'vy reaches 0 at the top of the jump', 'vy goes negative and the sprite falls', 'The sprite lands and vy is set to 0'], why: 'A jump is one push, then gravity.', title: 'Anatomy of a jump' },
    {
      lab: 'Walk and jump: add smooth walking (arrow keys, change x by 6) to the jumping Hero, so it can jump while moving.',
      title: 'Code Lab: run and jump',
      start: project([hero([onFlag(goto(0, FLOOR), ...gravity), jump], FLOOR)], { vars: ['vy'] }),
      palette: P_ADV,
      hats: ['flag', 'key', 'click'],
      goals: [
        ['Walks right', { t: 'keyMoves', key: 'right arrow', sprite: 'Hero', prop: 'x', sign: 1, msg: 'forever { if <key right arrow pressed?> then change x by 6 }.' }],
        ['Still jumps', { t: 'keyMoves', key: 'space', sprite: 'Hero', prop: 'y', sign: 1, msg: 'Keep your jump script.' }],
      ],
      test: { seconds: 3, keys: [{ at: 0.5, key: 'right arrow', hold: 1 }, { at: 0.8, key: 'space', hold: 0.1 }] },
      solution: project([hero([onFlag(goto(0, FLOOR), ...gravity), jump, onFlag(walk)], FLOOR)], { vars: ['vy'] }),
      explain: 'Running jumps — you’ve built the core of a platformer!',
      hints: ['Add a new “when green flag clicked” script with the walking loop.'],
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'A jump is an impulse: setting the vertical velocity positive once. The existing gravity loop produces the parabolic arc. Grounded checks prevent infinite mid-air jumps.',
    analogy: 'Throwing a ball straight up: one push, then gravity slows it, stops it and brings it back.',
    vocab: [
      ['impulse', 'A single push that changes velocity.'],
      ['grounded', 'Standing on the floor.'],
      ['arc', 'The curved path of a jump.'],
    ],
    demo: 'Jump without the grounded check; press space repeatedly to fly away. Then add the check.',
    unplugged: 'Ball toss (5 min): toss a soft ball up and describe its speed at the start, top and end.',
    prompts: [
      ['What is vy at the top of a jump?', '0.'],
      ['How do you jump higher?', 'Set vy to a bigger number.'],
      ['Why check the floor before jumping?', 'To stop mid-air jumps.'],
    ],
    support: 'Give the jump script with the if; learners choose the numbers.',
    stretch: 'Double jump: allow one extra jump in the air using a jumps-left variable.',
    mis: [
      ['A jump needs its own loop to move up', 'Set vy once; the gravity loop moves it.'],
      ['Change y by 14 is a jump', 'That teleports; velocity makes a smooth arc.'],
    ],
    successCriteria: ['I can make a sprite jump by setting its velocity.', 'I can stop mid-air jumps.', 'I can tune jump height.'],
    homework: 'Watch a platform game. Does the character jump higher if you hold the button? How might that be coded?',
    exit: 'Which block makes the jump start?',
  },
});

export const A6 = lesson(6, {
  title: 'Project: Jumpy Platformer',
  objective: 'Plan, build and test a mini platformer with gravity, jumping, walking, a collectable and a goal.',
  concept: 'Project: platformer',
  hook: ['word', '🐸 🪙 🏁', 'run, jump, collect, finish'],
  cards: [
    { emoji: '🏃', title: 'Your platformer', body: 'Build a level: the hero walks and jumps with gravity, collects coins for points, avoids a hazard, and reaches a flag to win.' },
    { emoji: '🪙', title: 'Collectables', body: 'A coin checks if it is touching the hero. When it is: change score, play a sound, and hide (or move somewhere new).', blocks: 'forever\nif <touching (Hero v)?> then\nchange [score v] by (1)\nstart sound (pop v)\ngo to x: (pick random (-200) to (200)) y: (-120)\nend\nend' },
    { emoji: '🔥', title: 'Hazards', body: 'If the hero touches a hazard, send it back to the start (or lose a life).' },
    { emoji: '🧱', title: 'Stay on screen', body: 'If x position > 230, set x to 230 — walls at the edges stop the hero walking off.' },
  ],
  build: {
    title: 'Build Jumpy Platformer',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Hero physics', text: 'Gravity, floor, jump and walking from Lessons 4 and 5.' },
      { title: 'Coins', text: 'A coin sprite: if touching Hero → score + 1, sound, move.' },
      { title: 'Hazard', text: 'A hazard sprite: if touching Hero → broadcast ouch; the hero goes back to the start.' },
      { title: 'Goal', text: 'Reach the flag (or 5 coins) to win: say “You win!” and stop all.' },
      { title: 'Playtest', text: 'Can a friend finish it? Tune jump height and speed, then submit.' },
    ],
  },
  acts: [
    { sort: 'Which sprite should have this script?', buckets: ['Hero', 'Coin', 'Hazard'], items: [['Gravity loop', 0], ['Jump on space', 0], ['If touching Hero → change score', 1], ['If touching Hero → send the hero back', 2], ['Walk with arrow keys', 0]], why: 'Each sprite looks after its own rules.' },
    {
      lab: 'Build Jumpy Platformer: the Hero walks and jumps with gravity; a Coin gives points when touched; score starts at 0; add a hazard or goal of your own.',
      title: 'Project: Jumpy Platformer',
      mode: 'project',
      start: project([hero([], FLOOR), sprite('Coin', ['🪙'], 120, FLOOR)], { vars: ['vy', 'score'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Walks', { t: 'keyMoves', key: 'right arrow', sprite: 'Hero', prop: 'x', sign: 1, msg: 'The Hero should walk right with the arrow key.' }],
        ['Jumps', { t: 'keyMoves', key: 'space', sprite: 'Hero', prop: 'y', sign: 1, msg: 'Space should make the Hero jump.' }],
        ['Gravity', { t: 'usesVar', name: 'vy', msg: 'Use a vy velocity variable for gravity.' }],
        ['Coins score', { t: 'usesAny', ops: ['changeVar'], msg: 'Touching a coin should change the score.' }],
        ['Score starts at 0', { t: 'varResets', name: 'score', value: 0, msg: 'Set score to 0 on the green flag.' }],
      ],
      test: { seconds: 4, keys: [{ at: 0.5, key: 'right arrow', hold: 0.5 }, { at: 1.5, key: 'space', hold: 0.1 }] },
      solution: project(
        [
          hero([onFlag(goto(-150, FLOOR), setVar('score', 0), ...gravity), jump, onFlag(walk), onFlag(forever(ifThen(gt(xpos, n(230)), setX(230))))], FLOOR),
          sprite('Coin', ['🪙'], 120, FLOOR, [onFlag(forever(ifThen(touching('Hero'), changeVar('score', 1), sound('pop'), goto(-100, FLOOR))))]),
        ],
        { vars: ['vy', 'score'] },
      ),
      explain: 'Level complete! Your teacher will play it.',
      hints: ['Copy your physics from Lessons 4 and 5 first.', 'The coin needs its own forever loop that checks touching Hero.'],
      requirements: ['Gravity with a vy variable', 'Walking and jumping', 'A collectable that scores', 'A hazard or a goal', 'Score starts at 0', 'Playtested and tuned'],
      reflection: 'What did you tune to make jumping feel good? What would your next level add?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'The platformer integrates velocity-based physics, input polling, per-sprite collision rules and win/lose conditions. Emphasise decomposition: each sprite owns its behaviour.',
    analogy: 'A play: every actor (sprite) knows their own lines (scripts).',
    vocab: [
      ['platformer', 'A game where you run and jump between places.'],
      ['collectable', 'Something the player picks up for points.'],
      ['hazard', 'Something the player must avoid.'],
    ],
    demo: 'Play a finished mini level; then open the scripts sprite by sprite.',
    unplugged: 'Level sketch (5 min): draw a level on paper with a start, three coins, a hazard and a goal.',
    prompts: [
      ['Which sprite owns the gravity script?', 'The Hero.'],
      ['How does the coin know it was collected?', 'It checks touching Hero.'],
      ['How does the game end?', 'Reaching the goal or a score target.'],
    ],
    support: 'Provide the hero physics; learners add a coin and a goal.',
    stretch: 'Multiple levels with backdrops (switch backdrop when the goal is reached).',
    mis: [
      ['The hero script should check every coin', 'Each coin checks the hero itself.'],
      ['Gravity needs to be in every sprite', 'Only sprites that fall need it.'],
    ],
    successCriteria: ['My hero walks and jumps with gravity.', 'Collectables change the score.', 'My level has a goal or hazard and was playtested.'],
    homework: 'Draw your next level and write which new sprite it needs.',
    exit: 'One number you tuned to make the game feel better.',
  },
  project: {
    title: 'Jumpy Platformer',
    brief: 'Build a mini platformer: the hero walks and jumps with gravity, collects coins for points, avoids a hazard and reaches a goal. Playtest and tune it.',
    requirements: ['Gravity with velocity', 'Walking and jumping', 'Collectable that scores', 'Hazard or goal', 'Score starts at 0', 'Playtested and tuned'],
    milestones: ['Hero physics', 'Coins', 'Hazard', 'Goal', 'Tuned and submitted'],
    rubric: [
      { criterion: 'Physics', levels: ['No gravity', 'Falls at a constant speed', 'Velocity gravity, floor and jump', 'Tuned feel, no mid-air jumps, screen edges'] },
      { criterion: 'Controls', levels: ['Hard to control', 'Steps only', 'Smooth walk and jump', 'Polished controls'] },
      { criterion: 'Game rules', levels: ['Missing', 'Coins only', 'Coins and a hazard or goal', 'Coins, hazard and a clear win'] },
      { criterion: 'Design', levels: ['Unplayable', 'Playable', 'Fun and fair', 'Creative level with a challenge curve'] },
      { criterion: 'Testing & reflection', levels: ['Not tested', 'Tested alone', 'Playtested; tuning explained', 'Several improvements explained'] },
    ],
    extensions: ['Double jump', 'Moving hazard', 'Second level'],
  },
});
