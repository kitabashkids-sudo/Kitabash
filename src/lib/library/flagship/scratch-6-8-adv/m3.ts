// Scratch Gr 6–8 Advanced · Module 3 — Strings and cryptography. Project: Secret Messenger.
import type { Bool, Stmt, Val } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, answer, ask, call, changeVar, contains, define, eq, ifElse, ifThen, join, listAdd, listDeleteAll, n, onFlag, op, param, project, repeat, say, sayFor, setVar, sprite, t, vr } from '../scratch-3-5/lab.ts';

const agent = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Agent', ['🕵️'], 0, -40, scripts, { size: 140 });
const letter = (a: Val, b: Val): Val => ({ k: 'letter', a, b });
const strlen = (a: Val): Val => ({ k: 'strlen', a });
const eachLetter = (word: Val, ...body: Stmt[]): Stmt[] => [setVar('i', 1), { op: 'repeat', a: strlen(word), body: [setVar('ch', letter(vr('i'), word)), ...body, changeVar('i', 1)] }];
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
/** Caesar-shift `msg` by `shift` into out (letters only; other characters kept). */
const caesar = (msg: Val, shift: Val): Stmt[] => [
  setVar('out', t('')),
  ...eachLetter(
    msg,
    setVar('p', 0),
    setVar('k', 1),
    repeat(26, ifThen(eq(letter(vr('k'), t(ALPHA)), vr('ch')), setVar('p', vr('k'))), changeVar('k', 1)),
    ifElse(eq(vr('p'), n(0)) as Bool, [setVar('out', join(vr('out'), vr('ch')))], [setVar('out', join(vr('out'), letter(op('+', op('%', op('+', op('-', vr('p'), 1), shift), 26), 1), t(ALPHA))))]),
  ),
];
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

export const J7 = lesson(7, {
  title: 'Strings: Working with Text',
  objective: 'Treat text as a sequence of characters: loop through letters, count matches, reverse a word and test for palindromes.',
  concept: 'String processing',
  hook: ['word', 'r a c e c a r', 'same forwards and backwards?'],
  intro: 'Spell-checkers, search boxes and password rules all process text one character at a time. Let’s learn how.',
  cards: [
    { emoji: '🔤', title: 'A string is a sequence', body: 'Text is a string of characters, each with a position. letter (1) of [apple] is a; length of [apple] is 5.', blocks: 'say (letter (1) of [apple])\nsay (length of [apple])' },
    { emoji: '🔁', title: 'Loop through the letters', body: 'Same pattern as lists: i from 1 to the length, read letter i each time.', blocks: 'set [i v] to (1)\nrepeat (length of (word))\nset [ch v] to (letter (i) of (word))\nchange [i v] by (1)\nend' },
    { emoji: '🔄', title: 'Build a new string', body: 'Start with an empty string and join letters onto it. Joining each letter to the FRONT reverses the word.', blocks: 'set [rev v] to (join (ch) (rev))' },
    { emoji: '🪞', title: 'Palindromes', body: 'A palindrome reads the same backwards: level, racecar, noon. Reverse the word and compare it with the original.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'word = "racecar"\nrev = ""\nfor ch in word:\n    rev = ch + rev\nprint(rev == word)', lang: 'python', output: 'True', say: ['In Python, a for loop can walk through the characters of a string, just like our Scratch loop.'] }],
  build: {
    title: 'Vowel counter and reverser',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Ask', text: 'Ask “Type a word” and set word to answer.' },
      { title: 'Loop', text: 'i from 1, repeat (length of word): ch = letter i of word.' },
      { title: 'Count vowels', text: 'If vowels contains ch, change count by 1.' },
      { title: 'Reverse', text: 'Set rev to join (ch) (rev) inside the loop.' },
      { title: 'Palindrome?', text: 'After the loop: if rev = word, say “Palindrome!”.', tip: 'Start rev as an empty string, not 0.' },
    ],
  },
  acts: [
    {
      lab: 'Vowel counter: a list vowels holds a, e, i, o, u. Ask “Type a word”, loop through its letters, and count how many are vowels. Say the count.',
      title: 'Code Lab: count the vowels',
      start: project([agent([onFlag(listDeleteAll('vowels'), ...VOWELS.map((x) => listAdd('vowels', x)))])], { lists: ['vowels'], vars: ['i', 'ch', 'count', 'word'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['banana → 3', { t: 'withAnswers', answers: ['banana'], check: { t: 'var', name: 'count', cmp: '=', value: 3, msg: '' }, msg: 'For each letter: if vowels contains (letter (i) of word), change count by 1.' }],
        ['rhythm → 0', { t: 'withAnswers', answers: ['rhythm'], check: { t: 'var', name: 'count', cmp: '=', value: 0, msg: '' }, msg: 'Set count to 0 before the loop.' }],
        ['Uses letter of', { t: 'usesValue', kind: 'letter', msg: 'Use (letter (i) of word) from the Operators menu.' }],
      ],
      test: { seconds: 3, answers: ['banana'] },
      solution: project([agent([onFlag(listDeleteAll('vowels'), ...VOWELS.map((x) => listAdd('vowels', x)), ask('Type a word'), setVar('word', answer), setVar('count', 0), ...eachLetter(vr('word'), ifThen(contains('vowels', vr('ch')), changeVar('count', 1))), say(join(t('Vowels: '), vr('count'))))])], { lists: ['vowels'], vars: ['i', 'ch', 'count', 'word'] }),
      explain: 'You processed text one character at a time — like a spell-checker.',
      hints: ['Loop: repeat (length of (word)).', 'Condition: <vowels contains (ch)?>.'],
    },
    {
      lab: 'Palindrome checker: ask for a word, build rev by joining each letter to the front, say rev for 1 second, then say “Palindrome!” if rev = word, otherwise say “Not a palindrome”.',
      title: 'Code Lab: palindrome checker',
      start: project([agent()], { vars: ['i', 'ch', 'rev', 'word'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['racecar is a palindrome', { t: 'withAnswers', answers: ['racecar'], check: { t: 'said', text: 'palindrome!', msg: '' }, msg: 'Reverse the word, then compare rev with word.' }],
        ['apple is not', { t: 'withAnswers', answers: ['apple'], check: { t: 'said', text: 'not a palindrome', msg: '' }, msg: 'Use if-else to say “Not a palindrome”.' }],
        ['Builds the reverse', { t: 'withAnswers', answers: ['apple'], check: { t: 'said', text: 'elppa', msg: '' }, msg: 'Say the reversed word too (e.g. say rev for 1 second before the result).' }],
      ],
      test: { seconds: 3, answers: ['racecar'] },
      solution: project([agent([onFlag(ask('Type a word'), setVar('word', answer), setVar('rev', t('')), ...eachLetter(vr('word'), setVar('rev', join(vr('ch'), vr('rev')))), sayFor(vr('rev'), 1), ifElse(eq(vr('rev'), vr('word')), [say('Palindrome!')], [say('Not a palindrome')]))])], { vars: ['i', 'ch', 'rev', 'word'] }),
      explain: 'Reverse and compare — a neat string algorithm.',
      hints: ['set rev to (join (ch) (rev)) — letter first, then the old rev.', 'Start rev as empty: set rev to [ ] with nothing typed.'],
    },
    { mcq: 'word = “code”. After the loop that sets rev to join (ch) (rev) for each letter, what is rev?', options: ['edoc', 'code', 'cdoe'], answer: 0, why: 'Each new letter goes in front: c → oc → doc → edoc.', title: 'Trace the reverse' },
    { code: 'word = "level"\nprint(word[::-1] == word)\nprint(len(word))', ask: 'What does this Python print?', options: ['True then 5', 'False then 5', 'True then 4'], answer: 0, why: 'word[::-1] reverses the string; "level" is a palindrome with 5 letters.', title: 'Strings in Python', lang: 'python', phase: 'probe' },
    { write: 'Describe a real app that processes text letter by letter. What does it check or change?', keywords: ['letter', 'text', 'check'], exemplar: 'A password checker goes through the password letter by letter. It checks whether there is at least one number and one capital letter, and counts the length, then tells you if the password is strong enough.', minWords: 25, phase: 'probe' },
  ],
  teacher: {
    explain: 'Strings are indexable sequences (1-based in Scratch, 0-based in Python). Traversal with letter (i) of, accumulation with join (prepending reverses), membership tests via a list, and comparison for palindromes.',
    analogy: 'Beads on a string: each bead (character) has a position.',
    vocab: [
      ['string', 'A sequence of characters (text).'],
      ['character', 'One letter, digit, space or symbol.'],
      ['concatenate', 'Join strings together.'],
      ['palindrome', 'Reads the same forwards and backwards.'],
    ],
    demo: 'Trace reversing “code” on the board: c, oc, doc, edoc.',
    unplugged: 'Letter tiles (5 min): learners reverse a word by moving tiles one at a time to the front of a new row.',
    prompts: [
      ['What does letter 3 of [apple] give?', 'p.'],
      ['Why does joining to the front reverse?', 'Each new letter becomes first.'],
      ['How do you test a palindrome?', 'Compare with its reverse.'],
    ],
    support: 'Provide the loop; learners write the body.',
    stretch: 'Ignore spaces so “never odd or even” counts as a palindrome.',
    mis: [
      ['join (rev) (ch) reverses', 'That rebuilds the word in the same order.'],
      ['Strings start at 0', 'In Scratch they start at 1; Python at 0.'],
    ],
    successCriteria: ['I can loop through the letters of a string.', 'I can count and build strings.', 'I can test for palindromes.'],
    homework: 'Find five palindromes (words or numbers) and test them with your program.',
    exit: 'Which block gives the third letter of a word?',
  },
});

export const J8 = lesson(8, {
  title: 'Cryptography: The Caesar Cipher',
  objective: 'Encrypt and decrypt messages with a Caesar cipher using letter positions and modular arithmetic.',
  concept: 'Ciphers and modular arithmetic',
  hook: ['word', 'hello → khoor', 'shift every letter'],
  cards: [
    { emoji: '🏛️', title: 'Julius Caesar’s code', body: 'Shift every letter a fixed number of places along the alphabet: with a shift of 3, a → d, b → e, h → k. The shift is the key.' },
    { emoji: '🔢', title: 'Letters as numbers', body: 'Find each letter’s position in the alphabet (a = 1 … z = 26) by searching the alphabet string — it’s linear search again!' },
    { emoji: '🕐', title: 'Wrap around with mod', body: 'After z comes a. The mod operator wraps numbers around, like a clock: ((position − 1 + shift) mod 26) + 1.', blocks: 'set [new v] to ((((p) - (1)) + (shift)) mod (26)) + (1))' },
    { emoji: '🔐', title: 'Decrypting', body: 'To decrypt, shift the other way (−3). Caesar ciphers are easy to break — modern encryption uses maths that’s far harder to crack.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'alpha = "abcdefghijklmnopqrstuvwxyz"\nout = ""\nfor ch in "hello":\n    p = alpha.index(ch)\n    out += alpha[(p + 3) % 26]\nprint(out)', lang: 'python', output: 'khoor', say: ['Python’s index finds the position; percent is mod. Same algorithm, fewer blocks.'] }],
  build: {
    title: 'Encrypt a word',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Alphabet', text: 'Keep the alphabet in a string: abcdefghijklmnopqrstuvwxyz.' },
      { title: 'Each letter', text: 'Loop through the message: ch = letter i of message.' },
      { title: 'Find the position', text: 'Loop k from 1 to 26: if letter k of alphabet = ch, set p to k.' },
      { title: 'Shift and wrap', text: 'out = join out (letter (((p − 1 + shift) mod 26) + 1) of alphabet).' },
      { title: 'Keep spaces', text: 'If p is 0 (not a letter), just join ch.', tip: 'Test with “xyz” — it should wrap to “abc”.' },
    ],
  },
  acts: [
    {
      lab: 'Caesar encrypt: ask for a message, shift each letter by 3 using the alphabet and mod 26, and say the result in out. (Spaces and other characters stay the same.)',
      title: 'Code Lab: encrypt',
      start: project([agent()], { vars: ['i', 'ch', 'k', 'p', 'out', 'msg'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['hello → khoor', { t: 'withAnswers', answers: ['hello'], check: { t: 'said', text: 'khoor', msg: '' }, msg: 'Find each letter’s position p, then use letter ((((p − 1) + 3) mod 26) + 1) of the alphabet.' }],
        ['xyz wraps to abc', { t: 'withAnswers', answers: ['xyz'], check: { t: 'said', text: 'abc', msg: '' }, msg: 'Use mod 26 so z wraps around to c.' }],
        ['Uses mod', { t: 'usesValue', kind: 'op', msg: 'Use the ( ) % ( ) (mod) operator.' }],
      ],
      test: { seconds: 6, answers: ['hello'] },
      solution: project([agent([onFlag(ask('Message?'), setVar('msg', answer), ...caesar(vr('msg'), n(3)), say(vr('out')))])], { vars: ['i', 'ch', 'k', 'p', 'out', 'msg'] }),
      explain: 'Your message is encrypted — Caesar would be proud.',
      hints: ['Inner loop: repeat 26 { if <(letter (k) of [abc…]) = (ch)> then set p to k; change k by 1 }.', '% in the operator menu is mod.'],
    },
    { mcq: 'With a shift of 3, what does “y” become?', options: ['b', 'z', 'a'], answer: 0, why: 'y → z → a → b (wrapping around after z).', title: 'Wrap around' },
    {
      lab: 'Caesar decrypt: ask for a secret message and shift each letter by −3 to recover the original. “khoor” should become “hello”.',
      title: 'Code Lab: decrypt',
      start: project([agent()], { vars: ['i', 'ch', 'k', 'p', 'out', 'msg'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['khoor → hello', { t: 'withAnswers', answers: ['khoor'], check: { t: 'said', text: 'hello', msg: '' }, msg: 'Use a shift of −3.' }],
        ['abc wraps to xyz', { t: 'withAnswers', answers: ['abc'], check: { t: 'said', text: 'xyz', msg: '' }, msg: 'mod 26 also wraps negative shifts.' }],
      ],
      test: { seconds: 6, answers: ['khoor'] },
      solution: project([agent([onFlag(ask('Secret message?'), setVar('msg', answer), ...caesar(vr('msg'), n(-3)), say(vr('out')))])], { vars: ['i', 'ch', 'k', 'p', 'out', 'msg'] }),
      explain: 'Decrypting is just encrypting backwards.',
      hints: ['Copy your encrypt code and change 3 to -3.'],
      phase: 'probe',
    },
    { write: 'Explain how someone could break a Caesar cipher without knowing the key. Why is modern encryption much safer?', keywords: ['shift', 'try', 'key'], exemplar: 'There are only 25 possible shifts, so an attacker can just try them all until the message makes sense. They could also look for the most common letter, which is probably e. Modern encryption uses keys with so many possibilities that trying them all would take millions of years.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Caesar cipher: position lookup (linear search over the alphabet), modular addition for wrap-around, decryption by inverse shift. Discuss brute force and frequency analysis; contrast with modern key spaces.',
    analogy: 'A clock: after 12 comes 1 — that’s mod.',
    vocab: [
      ['cipher', 'A method for encrypting messages.'],
      ['key', 'The secret value used to encrypt and decrypt.'],
      ['mod', 'The remainder after division; wraps numbers around.'],
      ['brute force', 'Trying every possible key.'],
    ],
    demo: 'Encrypt “xyz” on a cipher wheel and in code to show wrap-around.',
    unplugged: 'Cipher wheels (5 min): paper wheels; pairs exchange shifted messages.',
    prompts: [
      ['What is the key in a Caesar cipher?', 'The shift.'],
      ['Why do we need mod?', 'To wrap from z back to a.'],
      ['How many keys are there?', '25 useful shifts.'],
    ],
    support: 'Provide the position-finding loop.',
    stretch: 'Brute-force: print all 25 shifts of a secret message.',
    mis: [
      ['Mod only works for positive numbers', 'Scratch-style mod wraps negatives too.'],
      ['A secret method is enough', 'Security relies on the key, not hiding the method.'],
    ],
    successCriteria: ['I can encrypt and decrypt with a Caesar cipher.', 'I can use mod to wrap around.', 'I can explain why it’s easy to break.'],
    homework: 'Send a family member a Caesar-encrypted message and tell them the key.',
    exit: 'With shift 5, what is “a” encrypted to?',
  },
});

export const J9 = lesson(9, {
  title: 'Project: Secret Messenger',
  objective: 'Plan, build and test an app that encrypts and decrypts messages with a chosen key, organised into procedures.',
  concept: 'Project: cryptography app',
  hook: ['word', '🔐 ⇄ 💬', 'only your friend can read it'],
  cards: [
    { emoji: '📨', title: 'Your messenger', body: 'A menu: 1 to encrypt, 2 to decrypt. Ask for the message and the key, then show the result.' },
    { emoji: '🧱', title: 'One procedure, two uses', body: 'Write shift (amount) once. Encrypt calls it with the key; decrypt calls it with minus the key.', blocks: 'define shift (amount)\n// loop through msg, shift each letter by amount\n\nshift (key)\nshift ((0) - (key))' },
    { emoji: '🛡️', title: 'Validate', body: 'The menu choice must be 1 or 2; the key should be a number from 1 to 25.' },
    { emoji: '🔁', title: 'Round-trip test', body: 'Encrypt a message, then decrypt the result with the same key. You must get the original back.' },
  ],
  build: {
    title: 'Build the Secret Messenger',
    intro: 'Use the Code Lab project below.',
    steps: [
      { title: 'Menu', text: 'Ask “1 = encrypt, 2 = decrypt” and validate.' },
      { title: 'Inputs', text: 'Ask for the message and the key.' },
      { title: 'shift (amount)', text: 'Move your Caesar code into a My Block with an amount input.' },
      { title: 'Call it', text: 'Encrypt: shift (key). Decrypt: shift (0 − key). Say out.' },
      { title: 'Round-trip test', text: 'Encrypt then decrypt three messages; record the results; submit.' },
    ],
  },
  acts: [
    { order: 'Order the round-trip test', steps: ['Choose a message and a key', 'Encrypt the message', 'Copy the encrypted text', 'Decrypt it with the same key', 'Check you got the original message'], why: 'If encrypt and decrypt are correct, they undo each other.', title: 'Round trip' },
    {
      lab: 'Build the Secret Messenger: ask “1 = encrypt, 2 = decrypt”, then the message, then the key. Use a shift procedure and say the result.',
      title: 'Project: Secret Messenger',
      mode: 'project',
      start: project([agent()], { vars: ['i', 'ch', 'k', 'p', 'out', 'msg', 'key', 'mode'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Encrypts', { t: 'withAnswers', answers: ['1', 'cat', '2'], check: { t: 'said', text: 'ecv', msg: '' }, msg: 'Mode 1, message cat, key 2 → ecv.' }],
        ['Decrypts', { t: 'withAnswers', answers: ['2', 'ecv', '2'], check: { t: 'said', text: 'cat', msg: '' }, msg: 'Mode 2, message ecv, key 2 → cat.' }],
        ['Uses a procedure', { t: 'defines', msg: 'Put the cipher in a My Block (e.g. shift (amount)).' }],
        ['Uses the key input', { t: 'usesValue', kind: 'param', msg: 'Use the procedure’s input as the shift.' }],
      ],
      test: { seconds: 6, answers: ['1', 'cat', '2'] },
      solution: project(
        [
          agent([
            define('shift', 'amount', ...caesar(vr('msg'), param('amount'))),
            onFlag(
              ask('1 = encrypt, 2 = decrypt'),
              setVar('mode', answer),
              ask('Message?'),
              setVar('msg', answer),
              ask('Key (1–25)?'),
              setVar('key', answer),
              ifElse(eq(vr('mode'), n(1)), [call('shift', vr('key'))], [call('shift', op('-', 0, vr('key')))]),
              say(vr('out')),
            ),
          ]),
        ],
        { vars: ['i', 'ch', 'k', 'p', 'out', 'msg', 'key', 'mode'] },
      ),
      explain: 'Messenger submitted! Your teacher will send you a secret message.',
      hints: ['Move your Lesson 8 code into define shift (amount) and replace 3 with amount.', 'Decrypt = shift by (0 − key).'],
      requirements: ['Menu for encrypt/decrypt', 'Message and key inputs', 'A shift procedure', 'Wrap-around with mod', 'Validation', 'Round-trip tests recorded'],
      reflection: 'Record three round-trip tests. What would you add to make your cipher harder to break?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Modular design: a single parameterised shift procedure serves encryption and decryption (inverse key). Round-trip testing verifies inverse functions. Validation of menu and key.',
    analogy: 'A lock and key: the same key locks and unlocks, turned the other way.',
    vocab: [
      ['encrypt / decrypt', 'Scramble / unscramble a message.'],
      ['inverse', 'An operation that undoes another.'],
      ['round-trip test', 'Encrypt then decrypt to check you get the original.'],
    ],
    demo: 'Show that encrypting with key 3 then −3 returns the original.',
    unplugged: 'Spy pairs (5 min): pass encrypted notes with cipher wheels and agreed keys.',
    prompts: [
      ['How does one procedure do both jobs?', 'Opposite shift amounts.'],
      ['What does a round-trip test prove?', 'Encrypt and decrypt are inverses.'],
      ['How could you strengthen the cipher?', 'Different shift per letter (Vigenère).'],
    ],
    support: 'Provide the shift procedure; learners build the menu.',
    stretch: 'A Vigenère cipher with a keyword (different shift per letter).',
    mis: [
      ['Decryption needs separate code', 'Use the inverse shift.'],
      ['Ciphers make messages totally safe', 'Caesar is easy to break.'],
    ],
    successCriteria: ['My app encrypts and decrypts with a key.', 'It uses one shift procedure.', 'Round-trip tests pass.'],
    homework: 'Exchange encrypted messages with a friend using your apps.',
    exit: 'What is the decrypt shift for key 7?',
  },
  project: {
    title: 'Secret Messenger',
    brief: 'Build a messenger that encrypts and decrypts with a Caesar cipher: a menu, message and key inputs, one shift procedure used for both directions, validation, and round-trip tests.',
    requirements: ['Menu', 'Message and key inputs', 'Shift procedure', 'Wrap-around', 'Validation', 'Round-trip tests'],
    milestones: ['Menu and inputs', 'Shift procedure', 'Decrypt', 'Validation', 'Tested and submitted'],
    rubric: [
      { criterion: 'Cipher', levels: ['Incorrect', 'Encrypts only', 'Encrypts and decrypts with wrap-around', 'Handles spaces, capitals and punctuation'] },
      { criterion: 'Procedures', levels: ['None', 'Separate copies', 'One shift procedure for both', 'Clean, reusable design'] },
      { criterion: 'Robustness', levels: ['Breaks', 'Some checks', 'Validated menu and key', 'Friendly handling of all inputs'] },
      { criterion: 'Testing', levels: ['None', 'Ran once', 'Three round-trip tests', 'Systematic tests including edge letters'] },
      { criterion: 'Security reflection', levels: ['None', 'Vague', 'Explains weaknesses', 'Proposes and justifies an improvement'] },
    ],
    extensions: ['Vigenère cipher', 'Brute-force cracker', 'Keep capitals'],
  },
});

