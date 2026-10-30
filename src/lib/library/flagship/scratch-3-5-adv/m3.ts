// Scratch Gr 3–5 Advanced · Module 3 — Lists: remembering many things. Project: Guess the Animal.
import type { Val } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, answer, ask, contains, eq, ifElse, item, join, lengthOf, listAdd, listDeleteAll, n, not, onClick, onFlag, project, repeat, say, sayFor, setVar, sprite, t, until, vr, changeVar } from '../scratch-3-5/lab.ts';

const randItem = (list: string): Val => item(list, { k: 'rand', a: n(1), b: lengthOf(list) });
const owl = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Owl', ['🦉'], 0, -40, scripts, { size: 180 });
const FORTUNES = ['You will find a coin', 'A friend will make you laugh', 'You will learn something new', 'Today is lucky'];
const fillFortunes = onFlag(listDeleteAll('fortunes'), ...FORTUNES.map((f) => listAdd('fortunes', f)));

export const A7 = lesson(7, {
  title: 'Lists: A Variable That Holds Many Things',
  objective: 'Create a list, add items to it, read an item by its position, and pick a random item.',
  concept: 'Lists',
  hook: ['pattern', ['🍎', '🍎🍌', '🍎🍌🍇'], 'one list, many items'],
  intro: 'A variable holds one thing. But what if your game needs to remember ten names, or fifty high scores? You need a list!',
  cards: [
    { emoji: '📋', title: 'What is a list?', body: 'A list is like a variable with numbered boxes. Item 1, item 2, item 3… One list can hold many words or numbers.', blocks: 'add [apple] to [fruits v]\nadd [banana] to [fruits v]' },
    { emoji: '🔢', title: 'Items have positions', body: 'Use “item (2) of fruits” to read the second thing. The length of the list tells you how many items it holds.', blocks: 'say (item (2) of [fruits v])' },
    { emoji: '🧹', title: 'Start fresh', body: 'Lists remember items even after the program stops. Use “delete all of” when the flag is clicked so the list doesn’t keep growing.', blocks: 'when green flag clicked\ndelete all of [fruits v]' },
    { emoji: '🎲', title: 'A random item', body: 'Pick a random position from 1 to the length of the list. This is how games choose a random word, question or prize.', blocks: 'say (item (pick random (1) to (length of [fortunes v])) of [fortunes v])' },
  ],
  build: {
    title: 'The Fortune Owl',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Make a list', text: 'Variables → Make a list → call it fortunes.' },
      { title: 'Fill it', text: 'When the flag is clicked: delete all of fortunes, then add four fortunes.' },
      { title: 'Click for a fortune', text: 'When this sprite is clicked: say a random item of fortunes for 2 seconds.' },
      { title: 'Read one item', text: 'Test first: say (item 1 of fortunes). Then try item 3.' },
      { title: 'Grow it', text: 'Add three more fortunes. You don’t need to change the click script — length of the list updates by itself!', tip: 'If the list keeps doubling, check “delete all” runs first.' },
    ],
  },
  acts: [
    {
      lab: 'Fortune Owl: when the flag is clicked, delete all of the fortunes list and add at least 3 fortunes. When the Owl is clicked, say a random item of fortunes.',
      title: 'Code Lab: fortune owl',
      start: project([owl()], { lists: ['fortunes'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['The list has 3+ fortunes', { t: 'listLength', name: 'fortunes', cmp: '>', value: 2, msg: 'Add at least three items to fortunes when the flag is clicked.' }],
        ['Reads an item', { t: 'usesValue', kind: 'item', msg: 'Use (item (…) of fortunes) inside the say block.' }],
        ['Picks at random', { t: 'usesRandom', msg: 'Use pick random 1 to (length of fortunes) as the position.' }],
        ['Says a fortune when clicked', { t: 'clickReacts', sprite: 'Owl', msg: 'when this sprite clicked → say (item … of fortunes) for 2 seconds.' }],
      ],
      test: { seconds: 3, clicks: [{ at: 1, sprite: 'Owl' }] },
      solution: project([owl([fillFortunes, onClick(sayFor(randItem('fortunes'), 2))])], { lists: ['fortunes'] }),
      explain: 'A wise owl with as many fortunes as you like!',
      hints: ['Two scripts: the flag fills the list; the click reads it.', 'Position: pick random (1) to (length of fortunes).'],
    },
    { mcq: 'The list colours holds: red, green, blue, yellow. What is item 3 of colours?', options: ['blue', 'green', 'yellow'], answer: 0, why: 'Counting from 1: red (1), green (2), blue (3).', title: 'Item by position' },
    {
      lab: 'Shopping list: when the flag is clicked, delete all of shopping. Repeat 3 times: ask “What should we buy?” and add the answer to shopping. Then say the length of shopping.',
      title: 'Code Lab: shopping list',
      start: project([sprite('Chef', ['🧑‍🍳'], 0, -40)], { lists: ['shopping'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Asks 3 times', { t: 'asked', min: 3, msg: 'Repeat 3 { ask [What should we buy?] and wait … }.' }],
        ['Adds each answer', { t: 'listLength', name: 'shopping', cmp: '=', value: 3, msg: 'After each ask: add (answer) to shopping.' }],
        ['Starts empty', { t: 'uses', ops: ['listDeleteAll'], msg: 'Begin with “delete all of shopping”.' }],
        ['Says how many', { t: 'usesValue', kind: 'length', msg: 'Finish with say (length of shopping).' }],
      ],
      test: { seconds: 4, answers: ['milk', 'eggs', 'bread'] },
      solution: project([sprite('Chef', ['🧑‍🍳'], 0, -40, [onFlag(listDeleteAll('shopping'), repeat(3, ask('What should we buy?'), listAdd('shopping', answer)), say(join(t('Items: '), lengthOf('shopping'))))])], { lists: ['shopping'] }),
      explain: 'Your program remembers everything the user typed.',
      hints: ['Inside repeat 3: ask, then add (answer) to shopping.', 'The answer reporter is in the value ▾ menu.'],
      phase: 'probe',
    },
    { write: 'Why is a list better than making ten separate variables for ten names? Give an example from a game or app.', keywords: ['list', 'many', 'items'], exemplar: 'A list keeps all the names together, and you can add as many items as you want without making new variables. A high-score table uses a list so it can show every score in order.', minWords: 20, phase: 'probe' },
  ],
  teacher: {
    explain: 'Lists are ordered collections indexed from 1. Key operations: add, delete all, item n, length. Lists persist between runs in Scratch, so reset them on the green flag. Random selection uses pick random 1 to length.',
    analogy: 'A shopping list: numbered lines, as many as you need.',
    vocab: [
      ['list', 'A variable that holds many items in order.'],
      ['item', 'One thing in a list.'],
      ['index', 'The position number of an item (starting at 1).'],
      ['length', 'How many items are in the list.'],
    ],
    demo: 'Run the fortune program twice without delete all; show the list doubling. Add delete all.',
    unplugged: 'Numbered cups (5 min): five cups with numbered labels hold paper slips; learners fetch “item 3”.',
    prompts: [
      ['What number is the first item?', '1.'],
      ['How do we choose a random item?', 'pick random 1 to length of the list.'],
      ['Why delete all at the start?', 'Lists keep items between runs.'],
    ],
    support: 'Provide the filled list; learners write the click script.',
    stretch: 'Add a “don’t repeat” rule: delete the fortune after saying it.',
    mis: [
      ['Lists start at item 0', 'Scratch lists start at 1.'],
      ['Lists empty themselves when you stop', 'They keep items until deleted.'],
    ],
    successCriteria: ['I can create a list and add items.', 'I can read an item by position.', 'I can pick a random item from a list.'],
    homework: 'Write a list of 5 things a game could store in a list (e.g. high scores, words).',
    exit: 'Which block tells you how many items a list has?',
  },
});

export const A8 = lesson(8, {
  title: 'Searching Lists',
  objective: 'Check whether a list contains something and use it to make decisions, like a password checker or an inventory.',
  concept: 'List search',
  hook: ['word', '🔐 ❓', 'is your name on the list?'],
  cards: [
    { emoji: '🔍', title: 'Does the list contain…?', body: 'The block “list contains thing?” is true if the thing is anywhere in the list. It works in if blocks just like other conditions.', blocks: 'if <[guests v] contains (answer)?> then\nsay [Welcome!]\nend' },
    { emoji: '🎒', title: 'Inventory', body: 'Many games keep an inventory: a list of things the player has collected. Add an item when collected; check the list to open a door.', blocks: 'if <[bag v] contains [key]?> then\nsay [The door opens!]\nend' },
    { emoji: '🔐', title: 'Password check', body: 'Store allowed passwords in a list. Ask for the password and check if the list contains the answer.' },
    { emoji: '🚫', title: 'Not in the list', body: 'Use “not” to check the opposite: if not (bag contains key) → say “You need a key!”.' },
  ],
  build: {
    title: 'The Secret Door',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Make the list', text: 'Make a list called passwords. When the flag is clicked: delete all, then add “dragon” and “rainbow”.' },
      { title: 'Ask', text: 'Ask “Password?” and wait.' },
      { title: 'Check', text: 'if <passwords contains (answer)?> then say “Welcome!” else say “Go away!”.' },
      { title: 'Test both ways', text: 'Try a right password and a wrong one.', tip: 'Contains ignores capital letters, so DRAGON works too.' },
      { title: 'Count the tries', text: 'Stretch: make a tries variable and change it by 1 after every wrong answer.' },
    ],
  },
  acts: [
    {
      lab: 'Secret door: fill a passwords list with “dragon” and “rainbow”. Ask “Password?”. If passwords contains the answer, say “Welcome!”, otherwise say “Go away!”.',
      title: 'Code Lab: secret door',
      start: project([sprite('Guard', ['💂'], 0, -40)], { lists: ['passwords'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Right password works', { t: 'withAnswers', answers: ['rainbow'], check: { t: 'said', text: 'welcome', msg: '' }, msg: 'Add “rainbow” to the list, and say “Welcome!” if passwords contains (answer).' }],
        ['Wrong password is refused', { t: 'withAnswers', answers: ['banana'], check: { t: 'said', text: 'go away', msg: '' }, msg: 'Use if/else: otherwise say “Go away!”.' }],
        ['Has both passwords', { t: 'listLength', name: 'passwords', cmp: '=', value: 2, msg: 'Delete all, then add exactly two passwords.' }],
      ],
      test: { seconds: 3, answers: ['dragon'] },
      solution: project([sprite('Guard', ['💂'], 0, -40, [onFlag(listDeleteAll('passwords'), listAdd('passwords', 'dragon'), listAdd('passwords', 'rainbow'), ask('Password?'), ifElse(contains('passwords', answer), [say('Welcome!')], [say('Go away!')]))])], { lists: ['passwords'] }),
      explain: 'A real password checker — like logging in to a website.',
      hints: ['The condition is in the if menu: <list contains …?>; put the answer reporter in it.', 'if/else lets you handle both cases.'],
    },
    { mcq: 'bag holds: map, key, apple. Which is true?', options: ['bag contains key', 'bag contains sword', 'not (bag contains apple)'], answer: 0, why: 'key is in the bag; sword is not; apple is.', title: 'Check the bag' },
    {
      lab: 'Inventory: when the flag is clicked, empty the bag list and add “map”, “key” and “apple”. Then: if bag contains “key”, say “The door opens!”, otherwise say “Find the key!”.',
      title: 'Code Lab: inventory',
      start: project([sprite('Explorer', ['🧭'], 0, -40)], { lists: ['bag'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Bag holds 3 things', { t: 'listLength', name: 'bag', cmp: '=', value: 3, msg: 'Delete all of bag, then add map, key and apple.' }],
        ['Checks the bag', { t: 'usesAny', ops: ['if', 'ifElse'], msg: 'Use if <bag contains [key]?> then …' }],
        ['Opens the door', { t: 'said', text: 'door opens', msg: 'Say “The door opens!” when the bag contains key.' }],
      ],
      test: { seconds: 2 },
      solution: project([sprite('Explorer', ['🧭'], 0, -40, [onFlag(listDeleteAll('bag'), listAdd('bag', 'map'), listAdd('bag', 'key'), listAdd('bag', 'apple'), ifElse(contains('bag', 'key'), [say('The door opens!')], [say('Find the key!')]))])], { lists: ['bag'] }),
      explain: 'Inventories power adventure games.',
      hints: ['Type key into the contains slot.'],
      phase: 'probe',
    },
    { write: 'Describe an adventure game where an inventory list matters. What gets added, and what does the game check for?', keywords: ['list', 'add', 'contains'], exemplar: 'In my castle game, when you touch a sword it is added to the bag list. At the dragon, the game checks if the bag contains sword. If it does you win, and if not the dragon chases you away.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'List membership (contains) is a Boolean usable in if/else. It enables passwords, inventories and keyword checks. Scratch’s contains is case-insensitive and matches whole items.',
    analogy: 'A guest list at a party: the guard checks if your name is on it.',
    vocab: [
      ['contains', 'True if the item is somewhere in the list.'],
      ['inventory', 'A list of things the player has collected.'],
      ['password', 'A secret word that lets you in.'],
    ],
    demo: 'Live test the password program with right, wrong and CAPITAL answers.',
    unplugged: 'Bouncer game (5 min): one learner holds a guest list; others say names and the bouncer answers “in” or “out”.',
    prompts: [
      ['What does contains report?', 'True or false.'],
      ['How would you check something is NOT in the list?', 'not <list contains …>.'],
      ['Where else are lists searched?', 'Logins, spell-checkers, shopping apps.'],
    ],
    support: 'Provide the list and ask; learners build the if/else.',
    stretch: 'Count wrong tries with a variable and lock after 3.',
    mis: [
      ['contains finds part of a word', 'It matches whole items only.'],
      ['You must check each item with its own if', 'contains searches the whole list at once.'],
    ],
    successCriteria: ['I can check whether a list contains something.', 'I can use it in if/else decisions.', 'I can build an inventory or password check.'],
    homework: 'Write a list of 5 words that a “banned words” filter could check for in a kind chat app.',
    exit: 'Write the condition that checks if the bag has a key.',
  },
});

export const A9 = lesson(9, {
  title: 'Project: Guess the Animal',
  objective: 'Plan, build and test a guessing game that picks a secret from a list and lets the player guess until they get it.',
  concept: 'Project: lists game',
  hook: ['word', '🐱 🐶 🦁 🐸 ❓', 'can you guess my animal?'],
  cards: [
    { emoji: '🕵️', title: 'Your game', body: 'The computer secretly picks a random animal from a list. The player keeps guessing until they get it right. Count the guesses!' },
    { emoji: '🤫', title: 'Store the secret', body: 'Set a variable secret to a random item of the animals list, so it stays the same while the player guesses.', blocks: 'set [secret v] to (item (pick random (1) to (length of [animals v])) of [animals v])' },
    { emoji: '🔁', title: 'Guess until right', body: 'Repeat until answer = secret: ask for a guess and change guesses by 1. After the loop, say how many guesses it took.', blocks: 'repeat until <(answer) = (secret)>\nask [Guess my animal!] and wait\nchange [guesses v] by (1)\nend' },
    { emoji: '💡', title: 'Clues', body: 'Make it friendlier: if the guess isn’t in the animals list at all, say “That’s not one of my animals!”.' },
  ],
  build: {
    title: 'Build Guess the Animal',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Fill the list', text: 'Delete all of animals and add at least 4 animals.' },
      { title: 'Pick the secret', text: 'Set secret to a random item of animals; set guesses to 0.' },
      { title: 'Guess loop', text: 'Repeat until answer = secret: ask, change guesses by 1.' },
      { title: 'Win message', text: 'Say “You got it in” joined with guesses.' },
      { title: 'Playtest', text: 'Let a friend play. Add clues or a “not my animal” message, then submit.' },
    ],
  },
  acts: [
    { order: 'Put the game’s steps in order', steps: ['Fill the animals list', 'Pick a random secret animal', 'Set guesses to 0', 'Ask for a guess until it equals the secret', 'Say how many guesses it took'], why: 'Set up, pick, loop, finish.', title: 'Plan the game' },
    {
      lab: 'Build Guess the Animal: a list of at least 4 animals, a random secret picked from the list, a loop that asks until the guess equals the secret, and a winning message.',
      title: 'Project: Guess the Animal',
      mode: 'project',
      start: project([sprite('Host', ['🦊'], 0, -40)], { lists: ['animals'], vars: ['secret', 'guesses'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['4+ animals in the list', { t: 'listLength', name: 'animals', cmp: '>', value: 3, msg: 'Add at least 4 animals to the list.' }],
        ['Random secret from the list', { t: 'usesValue', kind: 'item', msg: 'Set secret to (item (pick random…) of animals).' }],
        ['Asks for guesses', { t: 'asked', msg: 'Ask the player for a guess.' }],
        ['Player can win', { t: 'withAnswers', answers: ['cat', 'dog', 'lion', 'frog', 'owl', 'fish'], check: { t: 'said', text: 'got it', msg: '' }, msg: 'Repeat until answer = secret, then say “You got it…”. (Tested with: cat, dog, lion, frog, owl, fish.)' }],
      ],
      test: { seconds: 4, answers: ['cat', 'dog', 'lion', 'frog'] },
      solution: project(
        [
          sprite('Host', ['🦊'], 0, -40, [
            onFlag(
              listDeleteAll('animals'),
              ...['cat', 'dog', 'lion', 'frog'].map((a) => listAdd('animals', a)),
              setVar('secret', randItem('animals')),
              setVar('guesses', 0),
              until(eq(answer, vr('secret')), ask('Guess my animal!'), changeVar('guesses', 1), ifElse(not(contains('animals', answer)), [sayFor('That’s not one of my animals!', 1)], [])),
              say(join(t('You got it in '), vr('guesses'))),
            ),
          ]),
        ],
        { lists: ['animals'], vars: ['secret', 'guesses'] },
      ),
      explain: 'Game submitted! Your teacher will try to guess.',
      hints: ['Store the random pick in the secret variable BEFORE the loop.', 'The loop condition: <(answer) = (secret)>.'],
      requirements: ['A list of 4+ animals', 'A random secret from the list', 'Guess until right', 'Counts guesses', 'A winning message', 'Playtested'],
      reflection: 'What clue or feature did you add to make the game fairer or more fun?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Combines lists (random selection, membership), variables to hold a fixed secret, and a condition-controlled loop with user input. Note that the secret must be stored before the loop.',
    analogy: 'Twenty Questions: the secret is chosen once, then guesses keep coming.',
    vocab: [
      ['secret', 'A value the game hides from the player.'],
      ['condition-controlled loop', 'A loop that repeats until something is true.'],
      ['counter', 'A variable that counts (like guesses).'],
    ],
    demo: 'Show the bug where secret is picked inside the loop (it changes every guess!). Move it out.',
    unplugged: 'Guess my card (5 min): a learner secretly picks a card from four; the class guesses until right, counting guesses.',
    prompts: [
      ['Why store the secret in a variable?', 'So it stays the same during guessing.'],
      ['When does the loop stop?', 'When answer = secret.'],
      ['How could you give clues?', 'Check contains, or give a hint list.'],
    ],
    support: 'Provide the list and secret; learners build the loop and message.',
    stretch: 'A hints list where item n matches animal n; say the hint after two wrong guesses.',
    mis: [
      ['pick random inside the loop keeps the same secret', 'It picks a new one each time; store it first.'],
      ['repeat until checks only once', 'It checks before every repeat.'],
    ],
    successCriteria: ['My game picks a random secret from a list.', 'It loops until the guess is right and counts guesses.', 'It was playtested.'],
    homework: 'Play your game with someone at home. What was their best number of guesses?',
    exit: 'Where in your code is the secret chosen, and why there?',
  },
  project: {
    title: 'Guess the Animal',
    brief: 'Build a guessing game: a random secret is picked from a list, the player guesses until right, and the game reports the number of guesses. Add a clue or friendly message.',
    requirements: ['List of 4+ items', 'Random secret from the list', 'Guess until right', 'Counts guesses', 'Winning message', 'Playtested'],
    milestones: ['List filled', 'Secret picked', 'Guess loop', 'Win message', 'Clues and submit'],
    rubric: [
      { criterion: 'Lists', levels: ['No list', 'List but not used', 'Random secret from the list', 'List also used for clues or checks'] },
      { criterion: 'Loop & logic', levels: ['No loop', 'Asks once', 'Repeats until right', 'Handles odd answers kindly'] },
      { criterion: 'Variables', levels: ['None', 'Secret only', 'Secret and guesses', 'Extra like best score'] },
      { criterion: 'Player experience', levels: ['Confusing', 'Works', 'Clear and friendly', 'Clues, sounds and polish'] },
      { criterion: 'Testing & reflection', levels: ['Not tested', 'Tested alone', 'Playtested; improvement explained', 'Several improvements explained'] },
    ],
    extensions: ['Clue list', 'Limit to 5 guesses', 'Categories (animals, foods…)'],
  },
});
