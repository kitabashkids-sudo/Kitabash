// Scratch Gr 3–5 Advanced · Module 1 — Clones: one sprite, many copies. Project: Starfall Catcher.
import { lesson } from '../kit.ts';
import { P_ADV, changeVar, changeX, changeY, createClone, deleteClone, forever, goto, hide, ifThen, keyIs, lt, n, onClone, onFlag, project, rand, repeat, setVar, show, sound, sprite, touching, until, wait, ypos } from '../scratch-3-5/lab.ts';

const star = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Star', ['⭐', '🌟'], 0, 170, scripts);
const bowl = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Bowl', ['🥣'], 0, -150, scripts, { size: 200 });
const fall = (speed: number, extra: ReturnType<typeof ifThen>[] = []) => onClone(goto(rand(-200, 200), 170), show, until(lt(ypos, n(-170)), changeY(-speed), ...extra), deleteClone);
const smooth = [onFlag(goto(0, -150), forever(ifThen(keyIs('right arrow'), changeX(8)), ifThen(keyIs('left arrow'), changeX(-8))))];

export const A1 = lesson(1, {
  title: 'Clones: One Sprite, Many Copies',
  objective: 'Use clones to make many copies of a sprite that each run their own script, and delete them when they are done.',
  concept: 'Clones',
  hook: ['pattern', ['⭐', '⭐⭐', '⭐⭐⭐'], 'a shower of stars!'],
  intro: 'Welcome, arcade engineer! Today you’ll learn how games make dozens of enemies, coins and raindrops from just one sprite.',
  cards: [
    { emoji: '🐑', title: 'What is a clone?', body: 'A clone is a copy of a sprite, made while the program runs. One Star sprite can make ten falling stars without you drawing ten sprites.', blocks: 'create clone of (myself v)' },
    { emoji: '🎬', title: 'Clones have their own script', body: 'Every new clone runs the script under “when I start as a clone”. Each clone can go to its own random place and move by itself.', blocks: 'when I start as a clone\ngo to x: (pick random (-200) to (200)) y: (170)\nshow\nrepeat until <(y position) < (-170)>\nchange y by (-5)\nend\ndelete this clone' },
    { emoji: '🙈', title: 'Hide the original', body: 'Usually the original sprite hides and just makes clones — like a factory. Each clone shows itself when it starts.', blocks: 'when green flag clicked\nhide\nrepeat (10)\ncreate clone of (myself v)\nwait (0.3) seconds\nend' },
    { emoji: '🗑️', title: 'Clean up', body: 'Delete clones when they are finished (for example, when they fall off the bottom). Too many clones slow a game down — Scratch allows 300.' },
  ],
  build: {
    title: 'Make it rain stars',
    intro: 'Build it in the Code Lab or Scratch.',
    steps: [
      { title: 'The factory', text: 'The Star hides and makes a clone every 0.3 seconds, ten times.', blocks: 'when green flag clicked\nhide\nrepeat (10)\ncreate clone of (myself v)\nwait (0.3) seconds\nend' },
      { title: 'Each clone starts at the top', text: 'Under “when I start as a clone”, go to a random x at the top and show.', blocks: 'when I start as a clone\ngo to x: (pick random (-200) to (200)) y: (170)\nshow' },
      { title: 'Fall', text: 'Repeat until the clone reaches the bottom, moving down each time.', blocks: 'repeat until <(y position) < (-170)>\nchange y by (-5)\nend' },
      { title: 'Delete it', text: 'At the bottom, the clone deletes itself.', blocks: 'delete this clone' },
      { title: 'Rain forever', text: 'Change repeat (10) to forever. It keeps raining, and clones still tidy themselves up.', tip: 'If stars pile up at the bottom, check that “delete this clone” is AFTER the repeat-until loop.' },
    ],
  },
  acts: [
    {
      lab: 'Star shower: the Star hides and makes 10 clones (one every 0.3 s). Each clone starts at a random x at the top, falls to the bottom, then deletes itself.',
      title: 'Code Lab: star shower',
      start: project([star()], { backdrop: 'space' }),
      palette: P_ADV,
      hats: ['flag', 'clone', 'key', 'click'],
      goals: [
        ['Makes 10 clones', { t: 'clonesMade', min: 10, msg: 'In a repeat (10) loop: create clone of myself, then wait 0.3 seconds.' }],
        ['Clones start in random places', { t: 'usesRandom', msg: 'In “when I start as a clone”: go to x: (pick random -200 to 200) y: 170.' }],
        ['Clones clean up', { t: 'uses', ops: ['deleteClone'], msg: 'When a clone reaches the bottom, “delete this clone”.' }],
      ],
      test: { seconds: 4 },
      solution: project([star([onFlag(hide, repeat(10, createClone, wait(0.3))), fall(5)])], { backdrop: 'space' }),
      explain: 'Ten stars from one sprite — that’s the power of clones!',
      hints: ['Two scripts: one for the original (flag), one for each clone (when I start as a clone).', 'The clone’s script: go to random top → show → repeat until y < -170 { change y by -5 } → delete this clone.'],
    },
    { mcq: 'You click the green flag. The Star sprite runs “repeat (5) create clone of myself”. How many stars are there in total (original + clones)?', options: ['6', '5', '1'], answer: 0, why: '1 original + 5 clones = 6. (Often the original is hidden.)', title: 'Count the copies' },
    { order: 'Put the life of a clone in order', steps: ['The original runs “create clone of myself”', 'The clone starts its “when I start as a clone” script', 'The clone goes to a random place and shows itself', 'The clone falls until it reaches the bottom', 'The clone deletes itself'], why: 'Born, set up, move, tidy up.', title: 'Life of a clone' },
    {
      lab: 'Snowfall forever: the Star (dressed as snow) makes a clone every 0.2 seconds, forever. Each clone falls and deletes itself at the bottom, so there are never too many.',
      title: 'Code Lab: endless snowfall',
      start: project([sprite('Snow', ['❄️'], 0, 170)], { backdrop: 'space' }),
      palette: P_ADV,
      hats: ['flag', 'clone', 'key', 'click'],
      goals: [
        ['Keeps making clones', { t: 'clonesMade', min: 15, msg: 'Use forever { create clone of myself; wait 0.2 seconds }.' }],
        ['Uses forever', { t: 'uses', ops: ['forever'], msg: 'The factory loop should be forever.' }],
        ['Clones delete themselves', { t: 'uses', ops: ['deleteClone'], msg: 'Don’t forget “delete this clone” at the bottom.' }],
      ],
      test: { seconds: 4 },
      solution: project([sprite('Snow', ['❄️'], 0, 170, [onFlag(hide, forever(createClone, wait(0.2))), onClone(goto(rand(-220, 220), 170), show, until(lt(ypos, n(-170)), changeY(-4)), deleteClone)])], { backdrop: 'space' }),
      explain: 'Endless snow that never slows down — clones tidy up after themselves.',
      hints: ['Copy your star shower, but change repeat (10) to forever and the wait to 0.2.'],
      phase: 'probe',
    },
    { write: 'Name three things in games you know that could be made with clones. Why are clones better than making separate sprites?', keywords: ['clone', 'many', 'copies'], exemplar: 'Raindrops, enemies in a space game and coins in a platform game. Clones are better because one sprite can make as many copies as you need while the game runs, and you only write the code once.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Clones are runtime copies of a sprite. The original typically hides and acts as a factory (create clone of myself); each clone runs “when I start as a clone” independently and should delete itself when finished. The green flag removes all clones; Scratch caps clones at 300.',
    analogy: 'A cookie cutter: one shape (the sprite) makes many cookies (clones), each baked on its own.',
    vocab: [
      ['clone', 'A copy of a sprite made while the program runs.'],
      ['original', 'The sprite that makes the clones.'],
      ['factory', 'A script that keeps making clones.'],
      ['delete this clone', 'Removes a clone when it has finished.'],
    ],
    demo: 'Build the factory without deleting clones; show stars piling up. Add delete this clone. Then ask why the original should hide.',
    unplugged: 'Photocopier game (5 min): one learner is the original holding instructions; each “clone” (classmate) gets a copy of the same instruction card and follows it on their own.',
    prompts: [
      ['Which script runs for each clone?', '“when I start as a clone”.'],
      ['Why hide the original?', 'It is the factory, not part of the scene.'],
      ['What happens if clones never delete?', 'They pile up and slow the game.'],
    ],
    support: 'Provide the clone script; learners build the factory loop.',
    stretch: 'Give each clone a random size or speed using pick random inside the clone script.',
    mis: [
      ['Clones are separate sprites in the sprite list', 'Clones exist only while running; they share the original’s code.'],
      ['“when green flag clicked” runs for clones', 'Clones start with “when I start as a clone”.'],
      ['Deleting the original deletes clones', 'Each clone deletes itself; the green flag clears all.'],
    ],
    successCriteria: ['I can make clones from a hidden original.', 'I can give each clone its own behaviour.', 'I can delete clones when they are done.'],
    homework: 'Write down three things in a game you like that could be clones, and how each one would start and end.',
    exit: 'Which hat block starts a clone’s own script?',
  },
});

export const A2 = lesson(2, {
  title: 'Clones with Personality',
  objective: 'Give clones different speeds, sizes and reactions, and detect when a clone touches the player.',
  concept: 'Clones + variables and sensing',
  hook: ['word', '🐢 🐇 🚀', 'every clone can be different'],
  cards: [
    { emoji: '🎲', title: 'Make each clone different', body: 'Use pick random inside the clone’s script so every clone gets its own size, position or costume.', blocks: 'when I start as a clone\nset size to (pick random (50) to (150)) %\ngo to x: (pick random (-200) to (200)) y: (170)\nshow' },
    { emoji: '🧲', title: 'Clones can sense', body: 'Each clone can check if it is touching the player. When it is, it can change the score and delete itself.', blocks: 'if <touching (Bowl v)?> then\nchange [score v] by (1)\ndelete this clone\nend' },
    { emoji: '🕹️', title: 'Smooth controls', body: 'For games, use a forever loop that checks keys. The player moves smoothly while you hold the key.', blocks: 'when green flag clicked\nforever\nif <key (right arrow v) pressed?> then\nchange x by (8)\nend\nif <key (left arrow v) pressed?> then\nchange x by (-8)\nend\nend' },
    { emoji: '⚡', title: 'Speed up over time', body: 'Use a variable for the fall speed and change it as the game goes on. Every new clone falls a little faster.' },
  ],
  build: {
    title: 'Catch the falling stars',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Smooth player', text: 'Give the Bowl smooth arrow-key movement with forever + if key pressed.' },
      { title: 'Star factory', text: 'From Lesson 1: the Star hides and makes a clone every half second.' },
      { title: 'Each star falls', text: 'Clone script: random top position, show, fall with repeat until.' },
      { title: 'Catch it', text: 'Inside the falling loop, add: if touching Bowl → change score by 1, start sound, delete this clone.', blocks: 'if <touching (Bowl v)?> then\nchange [score v] by (1)\nstart sound (pop v)\ndelete this clone\nend' },
      { title: 'Variety', text: 'Give each clone a random size. Small stars are harder to catch!', tip: 'Set score to 0 when the flag is clicked.' },
    ],
  },
  acts: [
    {
      lab: 'Smooth controls: when the flag is clicked, forever — if the right arrow is pressed, change x by 8; if the left arrow is pressed, change x by -8.',
      title: 'Code Lab: smooth movement',
      start: project([bowl()]),
      palette: P_ADV,
      hats: ['flag', 'clone', 'key', 'click'],
      goals: [
        ['Holding → glides right', { t: 'keyMoves', key: 'right arrow', sprite: 'Bowl', prop: 'x', sign: 1, msg: 'forever { if <key right arrow pressed?> then change x by 8 }.' }],
        ['Holding ← glides left', { t: 'keyMoves', key: 'left arrow', sprite: 'Bowl', prop: 'x', sign: -1, msg: 'Add another if for the left arrow with change x by -8.' }],
        ['Checks keys in a forever loop', { t: 'uses', ops: ['forever', 'if'], msg: 'Use a forever loop with if blocks (not “when key pressed”).' }],
      ],
      test: { seconds: 3, keys: [{ at: 0.5, key: 'right arrow', hold: 0.6 }, { at: 1.6, key: 'left arrow', hold: 0.6 }] },
      solution: project([bowl(smooth)]),
      explain: 'Now your player glides — perfect for games.',
      hints: ['when green flag clicked → forever → two if blocks.', 'Condition: choose “key right arrow pressed?” from the if menu.'],
    },
    {
      lab: 'Catch the stars: the Star makes a clone every 0.5 s; each clone falls from a random x. If a clone touches the Bowl, change score by 1 and delete the clone. Score starts at 0.',
      title: 'Code Lab: catch the clones',
      start: project([bowl(smooth), star()], { backdrop: 'space', vars: ['score'] }),
      palette: P_ADV,
      hats: ['flag', 'clone', 'key', 'click'],
      goals: [
        ['Clones fall', { t: 'clonesMade', min: 6, msg: 'The Star needs a factory loop: forever { create clone of myself; wait 0.5 }.' }],
        ['Catching scores', { t: 'var', name: 'score', cmp: '>', value: 0, msg: 'In the clone’s falling loop: if touching Bowl → change score by 1 → delete this clone.' }],
        ['Score starts at 0', { t: 'varResets', name: 'score', value: 0, msg: 'Set score to 0 when the flag is clicked.' }],
      ],
      test: { seconds: 8 },
      solution: project(
        [bowl(smooth), star([onFlag(setVar('score', 0), hide, forever(createClone, wait(0.5))), onClone(goto(rand(-60, 60), 170), show, until(lt(ypos, n(-170)), changeY(-6), ifThen(touching('Bowl'), changeVar('score', 1), sound('pop'), deleteClone)), deleteClone)])],
        { backdrop: 'space', vars: ['score'] },
      ),
      explain: 'Clones that sense the player — the heart of most arcade games.',
      hints: ['The touching check goes INSIDE the falling loop, so the clone checks every step.', 'After changing the score, delete the clone so it isn’t counted twice.'],
    },
    {
      bmcq: 'Stars are counted many times when caught. What is missing?',
      blocks: 'if <touching (Bowl v)?> then\nchange [score v] by (1)\nend',
      options: ['“delete this clone” after changing the score', 'A second “change score by 1”', 'A “wait 1 second” before the if'],
      answer: 0,
      why: 'The clone keeps touching the bowl and keeps scoring until it is deleted.',
      title: 'Debug it',
      phase: 'probe',
    },
    { write: 'How would you make your catching game get harder over time? Describe the variable you would use and where it changes.', keywords: ['variable', 'speed', 'change'], exemplar: 'I would make a variable called speed that starts at 3. Every time a star is caught, speed changes by 0.5, and each clone falls by speed, so later stars fall faster.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Clones can be individualised with random values and can each sense collisions. Collision handling (score + delete) must sit inside the clone’s movement loop. Smooth player movement uses polling (forever + if key pressed) rather than key events.',
    analogy: 'Every raindrop follows the same rules but lands in a different place.',
    vocab: [
      ['collision', 'When two sprites touch.'],
      ['polling', 'Checking something again and again in a loop.'],
      ['randomise', 'Give something a chance-based value.'],
    ],
    demo: 'Compare “when key pressed” movement (jerky) with forever + if key pressed (smooth) side by side.',
    unplugged: 'Catch game (5 min): one learner holds a bin and moves along a line; others drop paper stars from random places; count catches.',
    prompts: [
      ['Where must the touching check go?', 'Inside the clone’s falling loop.'],
      ['Why delete the clone after scoring?', 'Otherwise it scores again on the next frame.'],
      ['How do we make clones different?', 'pick random for size, position or speed.'],
    ],
    support: 'Provide the smooth-movement script; learners add the touching rule.',
    stretch: 'Add “bad” clones (a second costume) that cost a life when caught.',
    mis: [
      ['Key-pressed hats give smooth movement', 'They trigger once per press; polling in forever is smooth.'],
      ['The original sprite does the touching check for all clones', 'Each clone checks for itself in its own script.'],
    ],
    successCriteria: ['I can make smooth player controls.', 'I can give clones random differences.', 'I can detect when a clone touches the player.'],
    homework: 'Sketch a game where clones are enemies. What happens when one touches the player?',
    exit: 'Write the rule (if … then …) that scores a caught star.',
  },
});

export const A3 = lesson(3, {
  title: 'Project: Starfall Catcher',
  objective: 'Plan, build and test a catching game with clones, smooth controls, a score and an ending.',
  concept: 'Project: clones game',
  hook: ['word', '🥣 ⭐⭐⭐⭐ 💣', 'catch the good, dodge the bad'],
  cards: [
    { emoji: '🎮', title: 'Your game', body: 'Build a catching game: things fall as clones, the player moves smoothly, catching scores points, and the game ends after a time limit or when lives run out.' },
    { emoji: '💣', title: 'Good and bad', body: 'Make some clones good (stars) and some bad (bombs). Use pick random to choose each clone’s costume, and a different rule for each.' },
    { emoji: '⏱️', title: 'An ending', body: 'Add a timer or lives. When time is up or lives reach 0, say the score and stop all.', blocks: 'when green flag clicked\nreset timer\nwait until <(timer) > (30)>\nsay (join [Final score: ] (score)) for (2) seconds\nstop [all v]' },
    { emoji: '⚖️', title: 'Balance', body: 'Playtest and tune the numbers: fall speed, how often clones appear, and the player’s speed. Fun games are hard but fair.' },
  ],
  build: {
    title: 'Build Starfall Catcher',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Player', text: 'Smooth arrow-key movement at the bottom of the stage.' },
      { title: 'Clone factory', text: 'Hidden original makes a clone every half second.' },
      { title: 'Clone behaviour', text: 'Random x at the top; fall; if touching the player → score and delete; at the bottom → delete.' },
      { title: 'An ending', text: 'A 30-second timer or 3 lives; final score message; stop all.' },
      { title: 'Playtest and tune', text: 'Ask a friend to play. Adjust speed and frequency, then submit with your reflection.' },
    ],
  },
  acts: [
    { sort: 'Which part of the game handles it?', buckets: ['Player script', 'Original (factory)', 'Clone script'], items: [['Moving with arrow keys', 0], ['Creating a new star every 0.5 s', 1], ['Falling from a random place', 2], ['Scoring when touching the player', 2], ['Hiding at the start', 1]], why: 'Each script has one job.' },
    {
      lab: 'Build Starfall Catcher: smooth player controls, falling clones, a score that starts at 0, catching scores points, and an ending (timer or lives).',
      title: 'Project: Starfall Catcher',
      mode: 'project',
      start: project([bowl(), star()], { backdrop: 'space', vars: ['score'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Smooth controls', { t: 'keyMoves', key: 'right arrow', sprite: 'Bowl', prop: 'x', sign: 1, msg: 'The Bowl should glide right while the right arrow is held.' }],
        ['Falling clones', { t: 'clonesMade', min: 5, msg: 'Make clones fall from the top.' }],
        ['Catching scores', { t: 'usesAny', ops: ['changeVar'], msg: 'Change the score when a clone touches the player.' }],
        ['Score starts at 0', { t: 'varResets', name: 'score', value: 0, msg: 'Set score to 0 on the green flag.' }],
        ['An ending', { t: 'usesAny', ops: ['stopAll', 'broadcast'], msg: 'End the game with a timer or lives: say the score and stop all.' }],
      ],
      test: { seconds: 5, keys: [{ at: 0.5, key: 'right arrow', hold: 0.6 }] },
      solution: project(
        [
          bowl([...smooth, onFlag(setVar('score', 0))]),
          star([onFlag(hide, forever(createClone, wait(0.5))), onClone(goto(rand(-200, 200), 170), show, until(lt(ypos, n(-170)), changeY(-5), ifThen(touching('Bowl'), changeVar('score', 1), deleteClone)), deleteClone)]),
          sprite('Clock', ['⏰'], 200, 150, [{ hat: { type: 'flag' }, blocks: [{ op: 'resetTimer' }, { op: 'waitUntil', cond: { k: 'cmp', op: '>', a: { k: 'rep', r: 'timer' }, b: n(30) } }, { op: 'stopAll' }] }]),
        ],
        { backdrop: 'space', vars: ['score'] },
      ),
      explain: 'Game submitted! Your teacher will play it.',
      hints: ['Reuse your code from Lessons 1 and 2.', 'Build the player first, then the factory, then the clone rules, then the ending.'],
      requirements: ['Smooth player controls', 'Things fall as clones from random places', 'Catching changes the score', 'Score starts at 0', 'A clear ending (time or lives)', 'Playtested and tuned'],
      reflection: 'Which numbers did you change after playtesting (speed, frequency…) and why? What would you add with more time?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'The project combines clone factories, per-clone behaviour and collision, smooth input and game endings. Encourage tuning parameters after playtesting.',
    analogy: 'A game designer is like a chef adjusting the recipe after tasting.',
    vocab: [
      ['game balance', 'Making a game hard but fair.'],
      ['parameter', 'A number that changes how the game feels.'],
      ['lives', 'Chances left before the game ends.'],
    ],
    demo: 'Play a version that is too hard (fast, frequent) and one too easy; ask which numbers to change.',
    unplugged: 'Balance talk (5 min): list three numbers in the game and predict what happens if each doubles.',
    prompts: [
      ['Which number makes the game harder?', 'Fall speed or clone frequency.'],
      ['How does your game end?', 'Timer or lives.'],
      ['What did your tester find unfair?', 'Specific feedback.'],
    ],
    support: 'Start from the Lesson 2 catch code and add only the ending.',
    stretch: 'Good and bad clones (random costume), lives, and speed that increases over time.',
    mis: [
      ['Endings happen automatically', 'You must code the time limit or lives check.'],
      ['More clones = more fun', 'Balance matters more than quantity.'],
    ],
    successCriteria: ['My game uses clones, smooth controls and a score.', 'It has a clear ending.', 'I tuned it after playtesting.'],
    homework: 'Play your game with someone at home and record their best score.',
    exit: 'One number you tuned and why.',
  },
  project: {
    title: 'Starfall Catcher',
    brief: 'Build a catching game: things fall as clones from random places, the player moves smoothly, catching scores points, and the game ends after a time limit or when lives run out. Playtest and tune it.',
    requirements: ['Smooth controls', 'Falling clones', 'Catching scores', 'Score starts at 0', 'Clear ending', 'Playtested and tuned'],
    milestones: ['Player moving', 'Clone factory', 'Catch rule', 'Ending', 'Tuned and submitted'],
    rubric: [
      { criterion: 'Clones', levels: ['No clones', 'Clones appear but never delete', 'Clones fall and delete correctly', 'Varied clones (good/bad, random size/speed)'] },
      { criterion: 'Controls', levels: ['Hard to control', 'Key-press steps only', 'Smooth polling controls', 'Polished controls with limits at the edges'] },
      { criterion: 'Score & ending', levels: ['Missing', 'Score only', 'Score and a clear ending', 'Lives, timer and final message'] },
      { criterion: 'Game balance', levels: ['Unplayable', 'Too easy or too hard', 'Fair and fun', 'Gets harder over time in a fair way'] },
      { criterion: 'Testing & reflection', levels: ['Not tested', 'Tested alone', 'Playtested and tuned; explained', 'Several improvements explained clearly'] },
    ],
    extensions: ['Bad clones that cost a life', 'Speed that increases over time', 'A start menu'],
  },
});
