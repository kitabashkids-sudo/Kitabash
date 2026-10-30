// Scratch Gr 6–8 Intermediate · Module 4 — Data-driven apps: quiz engines, validation, menus. Capstone: Data App.
import type { Val } from '../../../scratch/vm.ts';
import { lesson } from '../kit.ts';
import { P_ADV, and, answer, ask, call, changeVar, define, eq, gt, ifElse, ifThen, item, join, lengthOf, listAdd, listDeleteAll, lt, n, onFlag, or, project, say, sayFor, setVar, sprite, t, until, vr } from '../scratch-3-5/lab.ts';

const host = (scripts: ReturnType<typeof onFlag>[] = []) => sprite('Host', ['🎤'], 0, -40, scripts, { size: 140 });
const fill = (list: string, xs: string[]) => [listDeleteAll(list), ...xs.map((x) => listAdd(list, x))];
const QS = ['Capital of France?', '7 × 8?', 'Largest planet?'];
const AS = ['Paris', '56', 'Jupiter'];
const quizLoop = [
  setVar('score', 0),
  setVar('i', 1),
  { op: 'repeat' as const, a: lengthOf('questions') as Val, body: [ask(item('questions', vr('i'))), ifElse(eq(answer, item('answers', vr('i'))), [changeVar('score', 1), sayFor('Correct!', 0.5)], [sayFor(join(t('It was '), item('answers', vr('i'))), 0.5)]), changeVar('i', 1)] },
  say(join(t('Score: '), join(vr('score'), join(t(' / '), lengthOf('questions'))))),
];

export const H10 = lesson(10, {
  title: 'A Quiz Engine with Parallel Lists',
  objective: 'Store questions and answers in parallel lists and write one loop that runs a quiz of any length.',
  concept: 'Data-driven programs',
  hook: ['word', '❓[ ] ✅[ ]', 'separate the data from the code'],
  cards: [
    { emoji: '🗂️', title: 'Parallel lists', body: 'Two lists line up by index: item 2 of questions goes with item 2 of answers. Together they act like a table.', blocks: 'add [Capital of France?] to [questions v]\nadd [Paris] to [answers v]' },
    { emoji: '⚙️', title: 'One engine, any quiz', body: 'A single loop asks item i of questions and checks against item i of answers. To make a new quiz, change the data — not the code.', blocks: 'ask (item (i) of [questions v]) and wait\nif <(answer) = (item (i) of [answers v])> then\nchange [score v] by (1)\nend' },
    { emoji: '🏗️', title: 'Data-driven design', body: 'Professional apps keep content (data) separate from logic (code). Games load levels from files; quiz apps load questions from databases.' },
    { emoji: '📏', title: 'Score out of the total', body: 'Report score / length of questions so the message is right however many questions there are.' },
  ],
  scenes: [{ kind: 'code', heading: 'In Python', code: 'questions = ["Capital of France?", "7 x 8?"]\nanswers = ["Paris", "56"]\nscore = 0\nfor i in range(len(questions)):\n    if input(questions[i]) == answers[i]:\n        score += 1', lang: 'python', say: ['In Python the same engine uses two lists and an index. Change the lists and you have a new quiz.'] }],
  build: {
    title: 'Build the quiz engine',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Data', text: 'Fill questions and answers with three matching items each.' },
      { title: 'Setup', text: 'Set score to 0 and i to 1.' },
      { title: 'Engine loop', text: 'repeat (length of questions): ask item i of questions; if answer = item i of answers, change score by 1; change i by 1.' },
      { title: 'Result', text: 'Say “Score: ” score “ / ” length of questions.' },
      { title: 'New quiz', text: 'Add two more question/answer pairs. Did you need to change the engine?', tip: 'Keep the lists the same length, or the answers will be out of step.' },
    ],
  },
  acts: [
    {
      lab: 'Quiz engine: the questions and answers lists are filled. Set score to 0 and i to 1; repeat (length of questions): ask item i of questions; if answer = item i of answers, change score by 1; change i by 1. Finally say the score.',
      title: 'Code Lab: quiz engine',
      start: project([host([onFlag(...fill('questions', QS), ...fill('answers', AS))])], { lists: ['questions', 'answers'], vars: ['i', 'score'] }),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['All correct → 3', { t: 'withAnswers', answers: ['paris', '56', 'jupiter'], check: { t: 'var', name: 'score', cmp: '=', value: 3, msg: '' }, msg: 'Compare answer with item i of answers and change score by 1 when they match.' }],
        ['Wrong answers don’t score', { t: 'withAnswers', answers: ['rome', '54', 'mars'], check: { t: 'var', name: 'score', cmp: '=', value: 0, msg: '' }, msg: 'Only add to score when the answer matches.' }],
        ['Asks from the list', { t: 'usesValue', kind: 'item', msg: 'Ask (item (i) of questions), not typed questions.' }],
        ['Works for any length', { t: 'usesValue', kind: 'length', msg: 'Repeat (length of questions) times.' }],
      ],
      test: { seconds: 4, answers: ['paris', '56', 'jupiter'] },
      solution: project([host([onFlag(...fill('questions', QS), ...fill('answers', AS), ...quizLoop)])], { lists: ['questions', 'answers'], vars: ['i', 'score'] }),
      explain: 'One engine runs any quiz — just change the data.',
      hints: ['The ask block takes a reporter: drop (item (i) of questions) into it.', 'Don’t forget change i by 1 at the end of the loop.'],
    },
    { mcq: 'You add a 4th question but forget to add its answer. What happens on question 4?', options: ['No answer can match, so it’s always marked wrong', 'The quiz crashes', 'Scratch adds the answer automatically'], answer: 0, why: 'item 4 of answers is empty. Keep parallel lists the same length.', title: 'Out of step' },
    {
      blanks: 'In a data-driven quiz, the questions are [[1]] and the loop is the [[2]]. To make a new quiz you change the [[3]], not the code.',
      answers: [['data', 'lists', 'list'], ['engine', 'code', 'logic'], ['data', 'lists', 'list']],
      bank: ['data', 'engine', 'sprite'],
      why: 'Separating data from logic is a core software-design idea.',
      title: 'Data vs code',
      phase: 'probe',
    },
    { write: 'Give two other apps that are “data-driven” — the same code with different data. Explain what the data is and what the engine does.', keywords: ['data', 'code', 'same'], exemplar: 'A music app uses the same player code for every song; the data is the song files and the engine plays them. A flashcard app uses the same code for every deck; the data is the cards and the engine shows and scores them.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Parallel lists model a table (records by index). A single traversal engine processes any dataset — separation of data and logic. Watch for mismatched list lengths.',
    analogy: 'A board game: the rules (engine) stay the same; the question cards (data) change.',
    vocab: [
      ['parallel lists', 'Lists whose items match up by position.'],
      ['data-driven', 'Behaviour controlled by data, not new code.'],
      ['engine', 'The general code that processes the data.'],
      ['record', 'One row of related data.'],
    ],
    demo: 'Swap the quiz data to a new topic live without touching the engine.',
    unplugged: 'Card pairs (5 min): question cards and answer cards in two numbered piles; a quizmaster uses index numbers.',
    prompts: [
      ['How do the two lists connect?', 'By index.'],
      ['How do you make a new quiz?', 'Change the lists.'],
      ['What if the lists are different lengths?', 'Answers get out of step.'],
    ],
    support: 'Provide the filled lists and the loop skeleton.',
    stretch: 'Shuffle the order using a random index and remove asked questions.',
    mis: [
      ['Each question needs its own code', 'One loop handles them all.'],
      ['Lists are linked automatically', 'Only by matching index.'],
    ],
    successCriteria: ['I can store a table in parallel lists.', 'I can write one engine loop for any dataset.', 'I can explain data-driven design.'],
    homework: 'Write 5 question/answer pairs for a topic you’re studying.',
    exit: 'What links item 3 of questions with item 3 of answers?',
  },
});

export const H11 = lesson(11, {
  title: 'Robust Apps: Validation and Menus',
  objective: 'Make apps robust: re-ask until input is valid, handle every menu choice, and organise features into procedures.',
  concept: 'Validation and program structure',
  hook: ['word', '🛡️ “banana”?', 'expect the unexpected'],
  cards: [
    { emoji: '🔁', title: 'Validation loops', body: 'Keep asking until the input makes sense: repeat until the answer is in range. The program never continues with bad data.', blocks: 'ask [Age?] and wait\nrepeat until <<(answer) > (0)> and <(answer) < (120)>>\nask [Please enter an age from 1 to 119] and wait\nend' },
    { emoji: '🧭', title: 'Menus', body: 'A menu asks the user to choose 1, 2 or 3. An if-else chain handles each choice — and the final else catches anything else.' },
    { emoji: '📦', title: 'One procedure per feature', body: 'Put each menu option in its own My Block. The menu just calls the right one. Easy to read, easy to extend.', blocks: 'if <(answer) = (1)> then\nshow stats\nelse\nif <(answer) = (2)> then\nadd item\nelse\nsay [Unknown choice]\nend\nend' },
    { emoji: '🧪', title: 'Test the weird cases', body: 'Test empty answers, words instead of numbers, negative numbers and huge numbers. A robust app handles them politely.' },
  ],
  build: {
    title: 'Robust age checker and menu',
    intro: 'Code Lab or Scratch.',
    steps: [
      { title: 'Ask once', text: 'Ask “Age?”.' },
      { title: 'Validate', text: 'repeat until answer > 0 and answer < 120: ask again with a helpful message.' },
      { title: 'Confirm', text: 'Say “Thanks!” with the valid age.' },
      { title: 'Menu', text: 'Ask “1 = hello, 2 = joke”; if-else chain with an Unknown choice else.' },
      { title: 'Procedures', text: 'Move each option into its own My Block.', tip: 'Write your weird-input tests BEFORE coding the validation.' },
    ],
  },
  acts: [
    {
      lab: 'Validation loop: ask “Age?”. Repeat until the answer is > 0 and < 120: ask “Please enter an age from 1 to 119”. Then say join “Thanks! Age: ” answer.',
      title: 'Code Lab: validate input',
      start: project([host()]),
      palette: P_ADV,
      hats: ['flag', 'click', 'key'],
      goals: [
        ['Rejects bad input', { t: 'withAnswers', answers: ['-5', '500', '12'], check: { t: 'asked', min: 3, msg: '' }, msg: 'With -5 then 500, it should ask again each time (repeat until the answer is in range).' }],
        ['Accepts good input', { t: 'withAnswers', answers: ['-5', '500', '12'], check: { t: 'said', text: 'thanks', msg: '' }, msg: 'After a valid answer, say “Thanks! …”.' }],
        ['Valid first time', { t: 'withAnswers', answers: ['30'], check: { t: 'said', text: '30', msg: '' }, msg: 'A valid first answer should go straight to Thanks.' }],
      ],
      test: { seconds: 3, answers: ['-5', '500', '12'] },
      solution: project([host([onFlag(ask('Age?'), until(and(gt(answer, n(0)), lt(answer, n(120))), ask('Please enter an age from 1 to 119')), say(join(t('Thanks! Age: '), answer)))])]),
      explain: 'Bad data can’t get past your loop.',
      hints: ['Condition: <<(answer) > 0> and <(answer) < 120>>.', 'The repeat-until only runs while the answer is invalid.'],
    },
    {
      lab: 'Menu with procedures: define greet (no input needed — or use one) that says “Hello!”, and joke that says a joke. Ask “1 = hello, 2 = joke”. If answer = 1 call greet; else if answer = 2 call joke; else say “Unknown choice”.',
      title: 'Code Lab: menu',
      start: project([host()]),
      palette: P_ADV,
      hats: ['flag', 'define', 'click', 'key'],
      goals: [
        ['Option 1 works', { t: 'withAnswers', answers: ['1'], check: { t: 'said', text: 'hello', msg: '' }, msg: 'If answer = 1, call greet (which says Hello!).' }],
        ['Option 2 works', { t: 'withAnswers', answers: ['2'], check: { t: 'said', text: 'joke', msg: '' }, msg: 'If answer = 2, call joke (say something with the word joke in it, e.g. “Here’s a joke…”).' }],
        ['Unknown choices handled', { t: 'withAnswers', answers: ['banana'], check: { t: 'said', text: 'unknown', msg: '' }, msg: 'The final else says “Unknown choice”.' }],
        ['Uses procedures', { t: 'defines', msg: 'Put each option in a My Block and call it.' }],
      ],
      test: { seconds: 3, answers: ['1'] },
      solution: project([host([define('greet', undefined, say('Hello!')), define('joke', undefined, say('Here’s a joke: why did the robot go on holiday? To recharge!')), onFlag(ask('1 = hello, 2 = joke'), ifElse(eq(answer, n(1)), [call('greet')], [ifElse(eq(answer, n(2)), [call('joke')], [say('Unknown choice')])]))])]),
      explain: 'Every input has a path — including nonsense.',
      hints: ['Nest an if-else inside the first else.', 'Make a Block with no input is fine for greet and joke.'],
    },
    { sort: 'Valid or invalid for “Enter a test score from 0 to 100”?', buckets: ['Valid', 'Invalid'], items: [['75', 0], ['-3', 1], ['100', 0], ['seventy', 1], ['0', 0], ['250', 1]], why: 'Check type and range, and remember the boundaries.', phase: 'probe' },
    { write: 'List four “weird” inputs a user might type into your app and what your app should do for each one.', keywords: ['input', 'invalid', 'ask'], exemplar: '1. Nothing at all: ask again with a hint. 2. A word instead of a number: say “Please type a number” and ask again. 3. A negative number: explain the range. 4. A huge number: say it is too large and ask again.', minWords: 30, phase: 'probe' },
  ],
  teacher: {
    explain: 'Robustness: validation loops (repeat until valid) guard against bad input; menus use exhaustive if-else chains with a catch-all else; features are modularised into procedures. Test with invalid, boundary and empty inputs.',
    analogy: 'A bouncer who keeps checking IDs until a valid one is shown.',
    vocab: [
      ['validation', 'Checking input before using it.'],
      ['robust', 'Keeps working even with unexpected input.'],
      ['catch-all', 'An else that handles everything not expected.'],
      ['modular', 'Built from separate, focused parts.'],
    ],
    demo: 'Break an unvalidated app with “banana”; then add the validation loop.',
    unplugged: 'Bouncer (5 min): learners present “inputs” on cards; the bouncer accepts or rejects by a rule.',
    prompts: [
      ['When does the validation loop stop?', 'When the input is valid.'],
      ['Why have a final else in a menu?', 'To handle unexpected choices.'],
      ['Why put options in procedures?', 'Readable and extendable.'],
    ],
    support: 'Provide the validation condition.',
    stretch: 'Wrap the menu in a loop so the user can choose again until they pick “quit”.',
    mis: [
      ['Users always follow instructions', 'Validate everything.'],
      ['if without else is fine for menus', 'Handle unknown choices too.'],
    ],
    successCriteria: ['I can validate input with a loop.', 'I can build a menu that handles every choice.', 'I can organise features into procedures.'],
    homework: 'Try typing nonsense into an app or website form. How does it respond?',
    exit: 'Write the condition for a valid percentage (0 to 100).',
  },
});

export const H12 = lesson(12, {
  title: 'Capstone: Data App',
  minutes: 90,
  objective: 'Design, build, test and present a data-driven app that uses lists, procedures, validation and a menu or simulation.',
  concept: 'Capstone project',
  hook: ['word', '📱 📊 🧠', 'build a real app'],
  intro: 'Time to build an app that a real person could use, with everything from this course: lists, procedures, validation and data.',
  cards: [
    { emoji: '💡', title: 'Choose your app', body: 'Ideas: a revision quiz app with several topics, a habit tracker with statistics, a sports score keeper, a dice-game simulator with results.' },
    { emoji: '🧱', title: 'Required ingredients', body: 'Lists for the data, at least one procedure, input validation, and a clear output (statistics, score or result).' },
    { emoji: '👥', title: 'User testing', body: 'Give your app to two people with no instructions. Watch where they get confused, and fix it.' },
    { emoji: '🎤', title: 'Present', body: 'Demo the app, show one procedure and explain the data structure.' },
  ],
  build: {
    title: 'Build your Data App',
    intro: 'Two sessions.',
    steps: [
      { title: 'Session 1 · Plan', text: 'Describe the user, the data (lists) and the procedures you need.' },
      { title: 'Session 1 · Data and engine', text: 'Fill the lists and get the main loop working.' },
      { title: 'Session 2 · Robustness', text: 'Validation and a menu or clear flow.' },
      { title: 'Session 2 · Output', text: 'Statistics, score or result, clearly reported.' },
      { title: 'Session 2 · Test & present', text: 'User testing, fixes, submit and present.' },
    ],
  },
  acts: [
    { match: 'Match the app feature to the concept it uses', pairs: [['Questions and answers stored together', 'Parallel lists'], ['Keep asking until a number is entered', 'Validation loop'], ['A “show stats” block', 'Procedure'], ['Average of all scores', 'Traversal with an accumulator'], ['Choose 1, 2 or 3', 'Menu with if-else']], why: 'Each feature is built from an idea you learned.' },
    {
      lab: 'Build your Data App: use at least one list, at least one procedure (My Block), a question to the user, and report a result with join.',
      title: 'Capstone: Data App',
      mode: 'project',
      start: project([host()], { lists: ['questions', 'answers'], vars: ['i', 'score'] }),
      palette: P_ADV,
      allowSprites: true,
      goals: [
        ['Uses a list', { t: 'usesValue', kind: 'item', msg: 'Store your data in a list and read it with item.' }],
        ['Uses a procedure', { t: 'defines', msg: 'Define and call at least one My Block.' }],
        ['Takes input', { t: 'asked', msg: 'Ask the user something.' }],
        ['Reports a result', { t: 'usesValue', kind: 'join', msg: 'Report the result with join.' }],
      ],
      test: { seconds: 4, answers: ['1', 'paris', '56', 'jupiter'] },
      solution: project(
        [
          host([
            define('run quiz', undefined, ...quizLoop),
            onFlag(
              ...fill('questions', QS),
              ...fill('answers', AS),
              ask('1 = start quiz, 2 = how many questions?'),
              until(or(eq(answer, n(1)), eq(answer, n(2))), ask('Please type 1 or 2')),
              ifElse(eq(answer, n(1)), [call('run quiz')], [say(join(t('Questions: '), lengthOf('questions')))]),
            ),
          ]),
        ],
        { lists: ['questions', 'answers'], vars: ['i', 'score'] },
      ),
      explain: 'Capstone submitted — you built a real data app!',
      hints: ['Start from your quiz engine or survey analyser.', 'Add validation once the main flow works.'],
      requirements: ['A plan describing user, data and procedures', 'Lists for data', 'At least one procedure', 'Input validation', 'A menu or clear flow', 'A clear result', 'Tested by two users'],
      reflection: 'Explain your data structure and one procedure. What did user testing reveal, and what did you change?',
      phase: 'probe',
    },
  ],
  teacher: {
    explain: 'Assesses lists/traversal, procedures, validation, menus and data-driven design, plus planning and user testing.',
    analogy: 'A small software product: plan, build, test with users, ship.',
    vocab: [
      ['user testing', 'Watching real users try the app.'],
      ['data structure', 'How the data is organised (e.g. parallel lists).'],
      ['minimum viable product', 'The simplest version that’s useful.'],
    ],
    demo: 'Show the quiz app with a menu and validation; then extend it with a new topic list.',
    unplugged: 'App pitch (5 min): explain your user and data in 30 seconds.',
    prompts: [
      ['Who is your user?', 'Learner-specific.'],
      ['What is in your lists?', 'The data structure.'],
      ['What did testers struggle with?', 'Feedback.'],
    ],
    support: 'Extend the quiz engine with a menu and validation.',
    stretch: 'Multiple topics chosen from a menu; best-score tracking.',
    mis: [
      ['A capstone must be huge', 'Small, polished and robust is better.'],
      ['Testing is optional at the end', 'Test throughout.'],
    ],
    successCriteria: ['My app uses lists, procedures and validation.', 'It produces a clear result.', 'I tested with users and improved it.'],
    homework: 'Have someone at home use your app and note one confusing moment.',
    exit: 'One change you made after user testing.',
    plan: [
      { minutes: 10, stage: 'Session 1 · Plan', doing: 'User, data and procedures; teacher check.' },
      { minutes: 30, stage: 'Session 1 · Data and engine', doing: 'Lists and main loop working.' },
      { minutes: 5, stage: 'Session 1 · Save', doing: 'Save; note next step.' },
      { minutes: 20, stage: 'Session 2 · Robustness and output', doing: 'Validation, menu, results.' },
      { minutes: 10, stage: 'Session 2 · User testing', doing: 'Two users each; fix one issue.' },
      { minutes: 15, stage: 'Session 2 · Submit & present', doing: 'Reflection, submit, 1-minute demos.' },
    ],
  },
  project: {
    title: 'Data App',
    brief: 'Design and build a data-driven app for a real user: store the data in lists, organise features into procedures, validate input, provide a menu or clear flow, and report a clear result. Test it with two users and present it.',
    requirements: ['Plan', 'Lists for data', 'Procedures', 'Validation', 'Menu or flow', 'Clear result', 'User-tested'],
    milestones: ['Plan approved', 'Data and engine', 'Validation and menu', 'Output', 'Tested, submitted, presented'],
    rubric: [
      { criterion: 'Data', levels: ['No lists', 'One list, hard-coded use', 'Lists traversed by an engine', 'Well-designed data structure'] },
      { criterion: 'Procedures', levels: ['None', 'One, unclear', 'Focused procedures', 'Clean modular design'] },
      { criterion: 'Robustness', levels: ['Breaks easily', 'Some checks', 'Validation and catch-all', 'Handles all tested weird inputs'] },
      { criterion: 'Usefulness', levels: ['Unclear purpose', 'Works', 'Useful and clear', 'Polished for its user'] },
      { criterion: 'Testing & presentation', levels: ['None', 'Self-tested', 'Two users; change explained', 'Clear demo of data, code and improvements'] },
    ],
    extensions: ['Multiple topics', 'Best-score tracking', 'Shuffle questions'],
  },
});

