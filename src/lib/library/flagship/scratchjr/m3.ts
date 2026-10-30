// ScratchJr K–2 Beginner · Module 3 — Talking and collecting. Project: Treasure Hunt.
import { lesson } from '../kit.ts';
import { D, R, U, flag, jw, pick, rep, say } from './helpers.ts';

const P4 = ['right', 'left', 'up', 'down'] as const;

export const K7 = lesson(7, {
  title: 'Talk Bubbles 💬',
  minutes: 30,
  objective: 'Make a character say something with a speech-bubble block, at the right moment in a script.',
  concept: 'Output (speech)',
  hook: ['word', '🐱 💬 “Hello!”', 'characters can talk!'],
  cards: [
    { emoji: '💬', title: 'The say block', body: 'The say block makes a speech bubble. Type the words you want your character to say.' },
    { emoji: '⏱️', title: 'Say it at the right time', body: 'Put the say block where you want the talking to happen: at the start, in the middle or at the end.' },
    { emoji: '👋', title: 'Say hello and goodbye', body: 'A character can say “Hi!” at the start and “Bye!” at the end.' },
    { emoji: '🗣️', title: 'Record your voice', body: 'In ScratchJr you can also record your own voice with the green sound block.' },
  ],
  build: {
    title: 'Make the cat talk',
    intro: 'ScratchJr app or the puzzles below.',
    steps: [
      { title: 'Purple blocks', text: 'Tap the purple button. Find the say block.' },
      { title: 'Say hello', text: 'Snap the say block after your green flag. Tap it and type “Hello!”.' },
      { title: 'Walk then talk', text: 'Put a right arrow before the say block. Now the cat walks, then talks.' },
      { title: 'Say goodbye', text: 'Add another say block at the end: “Bye!”.' },
      { title: 'Record', text: 'Try the green sound block and record your own “Hello!”.', tip: 'Short words fit best in the bubble.' },
    ],
  },
  acts: [
    {
      puzzle: 'Hello at the star',
      goalText: 'Walk to the star, THEN say “Hello!”.',
      world: jw('🐱', 4, 1, [0, 0], [3, 0]),
      palette: ['right', 'say'],
      goals: { goal: true, mustUse: ['say'] },
      solution: flag(R(3), say('Hello!')),
      explain: 'The cat walked, then said hello!',
      hints: ['Move first, then add the 💬 block.', 'Tap the 💬 block to type.'],
    },
    { order: 'Put the story in order', steps: ['🏁 Start', '💬 Say “Hi!”', '➡️ Walk to the shop', '💬 Say “Bye!”'], why: 'Say hello first, walk, then say goodbye.', title: 'Talk in order' },
    {
      puzzle: 'Hi and bye',
      goalText: 'Say “Hi!”, walk up to the star, then say “Bye!”.',
      world: jw('🐰', 1, 4, [0, 3], [0, 0]),
      palette: ['up', 'down', 'say'],
      goals: { goal: true, mustUse: ['say'], maxBlocks: 3 },
      solution: flag(say('Hi!'), U(3), say('Bye!')),
      explain: 'Hi, hop hop hop, bye!',
      hints: ['You need three blocks: say, up, say.'],
    },
    { mcq: 'You want the cat to say “I’m home!” when it gets home. Where does the say block go?', options: ['After the moves', 'Before the moves', 'It doesn’t matter'], answer: 0, why: 'The cat should arrive first, then talk.', title: 'When to talk' },
    { speak: 'With a partner, act out a 3-step script: say hello, walk 3 steps, say goodbye. Then swap!', checklist: ['We said hello first', 'We walked 3 steps', 'We said goodbye last'], title: 'Act it out', phase: 'probe' },
  ],
  teacher: {
    explain: 'Output: the say block shows a speech bubble. Position in the sequence controls timing — a key sequencing idea.',
    analogy: 'A comic strip: speech bubbles appear at the right picture.',
    vocab: [
      ['say', 'Shows words in a speech bubble.'],
      ['speech bubble', 'The shape that holds the words.'],
      ['record', 'Save your voice as a sound.'],
    ],
    demo: 'Put the say block before and after the moves; ask which makes more sense.',
    unplugged: 'Comic strip (5 min): children draw 3 boxes: hello, walking, goodbye.',
    prompts: [
      ['When does the bubble appear?', 'When the say block runs.'],
      ['How do you change the words?', 'Tap and type.'],
      ['What else could your character say?', 'Ideas.'],
    ],
    support: 'Adult types the words the child says.',
    stretch: 'Two characters have a conversation (take turns talking).',
    mis: [
      ['The bubble appears at the start no matter where the block is', 'It appears when that block runs.'],
    ],
    successCriteria: ['I can make a character talk.', 'I can choose when it talks.', 'I can type or record words.'],
    homework: 'Tell someone at home what your character said.',
    exit: 'Show me the say block.',
  },
  tasks: [
    { heading: 'Draw the bubble', instructions: 'Draw your character and a speech bubble. Write (or draw) what it says.', lines: 3, answer: 'A character with a speech bubble.' },
  ],
});

export const K8 = lesson(8, {
  title: 'Collect the Gems 💎',
  minutes: 30,
  objective: 'Plan a path to visit every gem and use a pick-up block at each one.',
  concept: 'Planning a path (algorithms)',
  hook: ['word', '🐱 💎 💎 ⭐', 'grab every gem!'],
  cards: [
    { emoji: '💎', title: 'Gems to collect', body: 'Walk onto a gem, then use the pick-up block to collect it.' },
    { emoji: '🗺️', title: 'Plan the path', body: 'Look at the map first. Which gem is closest? Plan a path that visits every gem.' },
    { emoji: '✅', title: 'Check them off', body: 'Count the gems. Did you collect them all?' },
    { emoji: '🔁', title: 'Patterns help', body: 'If the gems are in a row, a repeat can collect them: move, pick up — again and again!' },
  ],
  build: {
    title: 'Gem hunt',
    intro: 'Puzzles below (or make a gem game in ScratchJr).',
    steps: [
      { title: 'Look', text: 'Count the gems on the map.' },
      { title: 'Plan', text: 'Trace the path with your finger.' },
      { title: 'Move', text: 'Add arrows to reach the first gem.' },
      { title: 'Pick up', text: 'Add 💎 pick up. Then go to the next gem.' },
      { title: 'Check', text: 'Press Run. Are all the gems gone?', tip: 'Pick up only works when the character is ON the gem.' },
    ],
  },
  acts: [
    {
      puzzle: 'Two gems',
      goalText: 'Collect both gems.',
      world: jw('🐱', 5, 1, [0, 0], null, { gems: [[2, 0], [4, 0]] }),
      palette: ['right', 'pick'],
      goals: { allGems: true },
      solution: flag(R(2), pick, R(2), pick),
      explain: 'Two gems in the bag!',
      hints: ['Walk to the first gem, then pick it up.', 'Then walk to the next one.'],
    },
    {
      puzzle: 'Gem row',
      goalText: 'Collect all 4 gems. The arrow moves 1 square, so try 🔁!',
      world: jw('🐱', 5, 1, [0, 0], null, { gems: [[1, 0], [2, 0], [3, 0], [4, 0]] }),
      palette: ['right', 'pick', 'repeat'],
      lock: { right: 1 },
      goals: { allGems: true, maxBlocks: 3 },
      solution: flag(rep(4, R(), pick)),
      explain: 'Repeat 4: move, pick up. So neat!',
      hints: ['One step + one pick up = one gem.', 'Put them inside 🔁 4.'],
    },
    { mcq: 'The cat is next to a gem but not on it. What happens if it uses 💎 pick up?', options: ['Nothing — it must be ON the gem', 'It gets the gem anyway', 'It gets two gems'], answer: 0, why: 'Move onto the gem first.', title: 'On or next to?' },
    {
      puzzle: 'Gem garden',
      goalText: 'Collect both gems, then finish on the star.',
      world: jw('🐞', 3, 3, [0, 2], [2, 0], { gems: [[2, 2], [0, 0]] }),
      palette: [...P4, 'pick'],
      goals: { allGems: true, goal: true },
      solution: flag(R(2), pick, { op: 'left', n: 2 }, U(2), pick, R(2)),
      explain: 'Gems collected and home to the star!',
      hints: ['Which gem is closer to start?', 'Plan the whole path before you start.'],
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Algorithmic planning: decompose a goal (collect all) into a route, sequence moves and actions, use loops for regular patterns. Pick-up only works on the gem square (precise positioning).',
    analogy: 'An Easter egg hunt with a plan.',
    vocab: [
      ['collect', 'Pick up and keep.'],
      ['plan', 'Decide the path first.'],
      ['all', 'Every one.'],
    ],
    demo: 'Trace two different routes on the board; count the moves each needs.',
    unplugged: 'Gem hunt (5 min): paper gems on a floor grid; a child follows arrow cards to collect them.',
    prompts: [
      ['Where do you pick up?', 'On the gem.'],
      ['Which gem first?', 'The closest.'],
      ['Can a repeat help?', 'Yes, for gems in a row.'],
    ],
    support: 'Number the gems in the order to visit.',
    stretch: 'Find the path with the fewest blocks.',
    mis: [
      ['Walking past a gem collects it', 'Use the pick-up block on it.'],
    ],
    successCriteria: ['I can plan a path to every gem.', 'I can pick up gems.', 'I can use a repeat for gems in a row.'],
    homework: 'Hide 3 toys at home and give someone arrow directions to find them.',
    exit: 'What block do you use when you are on a gem?',
  },
  tasks: [
    { heading: 'Plan the gem path', instructions: 'Draw a path that visits every gem. Number the gems 1, 2, 3.', grid: { world: jw('🐱', 4, 4, [0, 3], null, { gems: [[2, 3], [3, 1], [0, 0]] }), label: 'Visit every 💎' }, answer: 'Any path that visits all three gems.' },
  ],
});

export const K9 = lesson(9, {
  title: 'Project: Treasure Hunt',
  minutes: 35,
  objective: 'Plan and build a treasure hunt where a character collects treasure, talks, and reaches a goal.',
  concept: 'Project: sequences, loops and talking',
  hook: ['word', '🏴‍☠️ 💎 💬', 'arr, find the treasure!'],
  cards: [
    { emoji: '🏝️', title: 'Your treasure hunt', body: 'Your pirate walks around an island, finds treasure and says something when it’s found.' },
    { emoji: '🗺️', title: 'Draw a treasure map', body: 'Draw the island, the treasure and the path with arrows first.' },
    { emoji: '💬', title: 'Celebrate', body: 'When the pirate finds the treasure, add a say block: “I found it!”.' },
    { emoji: '🧪', title: 'Test and fix', body: 'Press the flag. If the pirate goes the wrong way, change one block and try again.' },
  ],
  build: {
    title: 'Build your Treasure Hunt',
    intro: 'Use the ScratchJr app (or the puzzle below).',
    steps: [
      { title: 'Map', text: 'Draw your treasure map with arrows.' },
      { title: 'Background', text: 'Choose a beach or island background.' },
      { title: 'Moves', text: 'Green flag, then arrow blocks to follow your map.' },
      { title: 'Celebrate', text: 'Add a say block at the treasure.' },
      { title: 'Test and share', text: 'Press the flag, fix anything wrong, then show a friend.' },
    ],
  },
  acts: [
    {
      puzzle: 'Pirate’s gold',
      goalText: 'Collect both treasures, say “I found it!”, and finish on the star.',
      world: jw('🦜', 4, 3, [0, 2], [3, 0], { gems: [[3, 2], [1, 0]], open: [[0, 2], [1, 2], [2, 2], [3, 2], [3, 1], [3, 0], [2, 0], [1, 0]] }),
      palette: [...P4, 'pick', 'say'],
      goals: { allGems: true, goal: true, mustUse: ['say'] },
      solution: flag(R(3), pick, U(2), { op: 'left', n: 2 }, pick, say('I found it!'), R(2)),
      explain: 'Treasure found! Arrr!',
      hints: ['Follow the path all the way round.', 'Pick up at each 💎, and add the 💬 block.'],
    },
    {
      projectAct: true,
      title: 'My Treasure Hunt',
      brief: 'In ScratchJr, make a pirate (or any character) walk to treasure and say something when it is found. Start with the green flag.',
      requirements: ['I drew a treasure map', 'My script starts with a green flag', 'My character walks to the treasure', 'My character says something', 'I tested and fixed my code', 'I showed a friend'],
      reflection: 'Tell your teacher (or a grown-up can type): what did you fix when you tested?',
      tips: ['Follow your map one arrow at a time.', 'If it goes wrong, change ONE block and test again.'],
      minWords: 3,
    },
  ],
  teacher: {
    explain: 'Integrates sequencing with parameters, loops (optional), speech output and the test-and-fix cycle. Map drawing is planning (algorithm design).',
    analogy: 'A real treasure map: follow the steps and say “X marks the spot!”.',
    vocab: [
      ['map', 'A drawing that shows where things are.'],
      ['treasure', 'The prize you are looking for.'],
      ['fix', 'Change something so it works.'],
    ],
    demo: 'Run a hunt with one wrong arrow; ask the class to find and fix it.',
    unplugged: 'Treasure map (5 min): draw a map with arrow directions to a hidden “treasure”.',
    prompts: [
      ['What did your character say?', 'Share.'],
      ['What went wrong when you tested?', 'Debugging talk.'],
      ['How did you fix it?', 'Changed a block.'],
    ],
    support: 'Provide a printed map with the path drawn.',
    stretch: 'Add a second treasure and a sound.',
    mis: [
      ['If it’s wrong, start again', 'Change one block at a time.'],
    ],
    successCriteria: ['I planned my hunt with a map.', 'My character reaches the treasure and talks.', 'I tested and fixed my code.'],
    homework: 'Hide a toy and give someone your treasure map.',
    exit: 'One thing you fixed.',
  },
  project: {
    title: 'Treasure Hunt',
    brief: 'Make a treasure hunt in ScratchJr: plan a map, start with the green flag, walk to the treasure, say something when it’s found, test and fix, and share.',
    requirements: ['Map', 'Green flag', 'Reaches the treasure', 'Says something', 'Tested and fixed', 'Shared'],
    milestones: ['Map drawn', 'Moves', 'Talking', 'Tested', 'Shared'],
    rubric: [
      { criterion: 'Sequence', levels: ['Not yet', 'Partly reaches the treasure', 'Reaches the treasure', 'Neat path using numbers or repeat'] },
      { criterion: 'Talking', levels: ['Not yet', 'Says something', 'Says something at the right time', 'A little story with two speech bubbles'] },
      { criterion: 'Testing', levels: ['Not tested', 'Tested with help', 'Found and fixed a bug', 'Explains what was fixed'] },
    ],
    extensions: ['A second treasure', 'A sound effect', 'A second character'],
  },
});

void D;
