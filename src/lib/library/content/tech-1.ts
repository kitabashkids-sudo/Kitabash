// Coding, AI & Technology — Scratch Junior (K-2) and Scratch (3-5, 6-8).
import type { CourseSpec } from '../types.ts';

const pip: [string, string] = ['Pip', 'A playful coding buddy for young children who explains blocks with simple words and lots of encouragement.'];
const scratchy: [string, string] = ['Sprite', 'A Scratch coding coach who gives hints, asks “what do you think will happen?” and never writes the whole project for the learner.'];
const tools = ['Tablet or computer with ScratchJr (free app)'];
const stools = ['Computer with a browser (scratch.mit.edu) or the Scratch app'];

export const TECH_1: CourseSpec[] = [
  // ───────── Scratch Junior (K-2) ─────────
  {
    subject: 'Scratch Junior', band: 'K-2', level: 'Beginner', title: 'My First Moving Character',
    description: 'Meet ScratchJr: start a program with the green flag, make the Cat move and add a background.',
    intro: 'Let’s make the Cat move! 🐱', theme: 'meadow', tutor: pip, tools,
    style: 'Unplugged games first, then tablet. Very short steps, lots of praise.',
    outcomes: ['Starts a program with the green flag', 'Uses motion blocks', 'Chooses a background'],
    modules: [
      {
        title: 'Module 1: Blocks and the green flag',
        lessons: [
          {
            t: 'What is coding?', o: 'Explain that code is a set of instructions a computer follows in order.', min: 20,
            hook: ['word', 'Code', 'instructions for a computer'],
            cards: [
              ['📋', 'Instructions', 'Code is a list of instructions.'],
              ['➡️', 'In order', 'The computer does them in order, one after another.'],
              ['🧩', 'Blocks', 'In ScratchJr, instructions are blocks that snap together.'],
            ],
            acts: [
              { order: 'Put the instructions for brushing teeth in order', steps: ['Pick up the toothbrush', 'Put on toothpaste', 'Brush your teeth', 'Rinse your mouth'], why: 'Order matters, just like in code.' },
              { mcq: 'What is code?', options: ['Instructions for a computer', 'A type of food', 'A colour'], answer: 0, why: 'Code tells a computer what to do.' },
              { phase: 'probe', mcq: 'If we mix up the order of instructions, what happens?', options: ['Things may go wrong', 'Nothing changes', 'The computer gets sleepy'], answer: 0, why: 'Computers follow the exact order.' },
              { phase: 'probe', write: 'Give your friend 3 instructions to walk to the door.', keywords: ['step', 'turn', 'walk'], exemplar: 'Stand up. Turn right. Walk 5 steps.', minWords: 6 },
            ],
            teach: {
              explain: 'Algorithms as ordered instructions; unplugged first.', analogy: 'Code is like a recipe the computer follows.',
              vocab: [['code', 'Instructions for a computer.'], ['block', 'A piece of code you snap together.'], ['order', 'Which comes first, next, last.']],
              demo: 'Play “robot teacher”: children give the teacher instructions to walk to a chair.',
              prompts: [['What happens if instructions are wrong?', 'The robot goes the wrong way.'], ['Why order?', 'Computers follow exactly.']],
              support: 'Picture instruction cards.', stretch: 'Write instructions for making a sandwich.',
              mis: [['Computers know what we mean', 'They only do exactly what we tell them.']],
              sheet: 'Cut-and-order instruction cards for a morning routine.',
            },
          },
          {
            t: 'The green flag', o: 'Start a program with the green flag trigger block.', min: 20,
            hook: ['code', '🟩 start on green flag\n➡️ move right', 'Cat moves right!'],
            cards: [
              ['🟩', 'Start block', 'The yellow “start on green flag” block begins a program.'],
              ['➡️', 'Blue move blocks', 'Blue blocks move the character right, left, up or down.'],
              ['🔴', 'End block', 'A red end block finishes the program neatly.'],
            ],
            acts: [
              { code: '🟩 start on green flag\n➡️ move right 3', ask: 'What happens when you tap the green flag?', options: ['The Cat moves right 3 steps', 'The Cat jumps', 'Nothing'], answer: 0, why: 'The start block runs the move block.' },
              { mcq: 'Which block starts a program when you tap the green flag?', options: ['Start on green flag', 'Move right', 'End'], answer: 0, why: 'It’s the trigger.' },
              { phase: 'probe', code: '➡️ move right 3', ask: 'There is no start block. What happens when you tap the green flag?', options: ['Nothing — there’s no start block', 'The Cat moves right', 'The Cat sings'], answer: 0, why: 'Without a trigger block, the script doesn’t run.' },
              { phase: 'probe', write: 'Which blocks would you use to make the Cat move up?', keywords: ['green flag', 'move up'], exemplar: 'Start on green flag, then move up.', minWords: 5 },
            ],
            teach: {
              explain: 'Triggering blocks (yellow) start scripts; motion blocks (blue).', analogy: 'The green flag is like “Ready, steady, go!”',
              vocab: [['trigger', 'Something that starts the code.'], ['script', 'Blocks joined together.']],
              demo: 'Project ScratchJr; build a 2-block script live.',
              prompts: [['What colour are motion blocks?', 'Blue.'], ['What starts the program?', 'Green flag block.']],
              support: 'Block picture cards.', stretch: 'Make the Cat move in a square.',
              mis: [['Blocks run without a start block', 'A trigger block is needed.']],
              sheet: 'Colour the start block yellow and motion blocks blue on the worksheet.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Moving and scenes',
        lessons: [
          {
            t: 'Move, turn and hop', o: 'Use move, turn and hop blocks to make a character dance.', min: 25,
            hook: ['code', '🟩 start on green flag\n⤴️ hop\n🔄 turn right', 'Cat hops and spins!'],
            cards: [
              ['⤴️', 'Hop', 'The hop block makes the character jump up and down.'],
              ['🔄', 'Turn', 'Turn blocks spin the character.'],
              ['🔢', 'Numbers', 'Change the number on a block to move more or less.'],
            ],
            acts: [
              { code: '🟩 start on green flag\n➡️ move right 2\n⤴️ hop', ask: 'What does the Cat do?', options: ['Moves right 2, then hops', 'Hops, then moves right', 'Only hops'], answer: 0, why: 'Blocks run left to right in order.' },
              { mcq: 'How do you make the Cat move further?', options: ['Change the number on the move block to a bigger number', 'Tap faster', 'Shake the tablet'], answer: 0, why: 'Numbers control distance.' },
              { phase: 'probe', mcq: 'You want the Cat to hop 3 times. Which is easiest?', options: ['Use 3 hop blocks (or a repeat block)', 'Use 1 move block', 'Use an end block'], answer: 0, why: 'Repeat the action.' },
              { phase: 'probe', write: 'Plan a 4-block dance for the Cat.', keywords: ['hop', 'turn', 'move'], exemplar: 'Green flag, hop, turn right, move left.', minWords: 6 },
            ],
            teach: {
              explain: 'Sequencing motion blocks; parameters.', analogy: 'Like dance steps in a routine.',
              vocab: [['hop', 'Jump up and down.'], ['turn', 'Spin around.'], ['number', 'How much to do.']],
              demo: 'Children act out a block sequence physically.',
              prompts: [['What happens if we change the number?', 'Moves more/less.'], ['Which order?', 'Left to right.']],
              support: 'Physical dance first.', stretch: 'Make two characters dance together.',
              mis: [['Blocks run all at once', 'They run in order, left to right.']],
              sheet: 'Draw arrows to plan the Cat’s dance.',
            },
          },
          {
            t: 'Backgrounds and new characters', o: 'Add a background and a new character.', min: 25,
            hook: ['word', 'Scene!', 'pick a place and a friend'],
            cards: [
              ['🏞️', 'Background', 'Tap the background button to choose a place, like a park or space.'],
              ['🐶', 'New character', 'Tap + to add another character.'],
              ['🎨', 'Paint editor', 'You can draw or colour your own character.'],
            ],
            acts: [
              { mcq: 'You want your story to happen in space. What do you change?', options: ['The background', 'The green flag', 'The end block'], answer: 0, why: 'Backgrounds set the scene.' },
              { sort: 'Character or background?', buckets: ['Character', 'Background'], items: [['Cat', 0], ['Beach', 1], ['Dog', 0], ['Forest', 1], ['Rocket you drew', 0]], why: 'Characters move; backgrounds are places.' },
              { phase: 'probe', mcq: 'Each character has its own scripts. If the Dog has no blocks, what does it do on the green flag?', options: ['Nothing', 'Copies the Cat', 'Runs away'], answer: 0, why: 'Each character needs its own code.' },
              { phase: 'probe', write: 'Describe a scene you would make: background and two characters.', keywords: ['background', 'character'], exemplar: 'A beach background with a crab and a seagull.', minWords: 8 },
            ],
            teach: {
              explain: 'Characters vs backgrounds; each character has its own scripts.', analogy: 'Background is the stage; characters are actors.',
              vocab: [['background', 'The place where the story happens.'], ['character', 'Someone or something that moves.']],
              demo: 'Add a background and second character live.',
              prompts: [['Who has code?', 'Each character.'], ['Can you draw your own?', 'Yes.']],
              support: 'Choose from 3 backgrounds.', stretch: 'Draw your own character.',
              mis: [['One script controls all characters', 'Each character has its own.']],
              sheet: 'Storyboard: background and characters.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Scratch Junior', band: 'K-2', level: 'Intermediate', title: 'Talking Characters and Stories',
    description: 'Make characters talk, grow and shrink, use sounds and build a short animated story across pages.',
    intro: 'Make your characters talk and tell a story! 💬', theme: 'meadow', tutor: pip, tools,
    style: 'Story-first: plan with drawings, then code.',
    outcomes: ['Uses say, grow and shrink blocks', 'Records sounds', 'Makes a multi-page story'],
    modules: [
      {
        title: 'Module 1: Looks and sounds',
        lessons: [
          {
            t: 'Say hello!', o: 'Use the say block to make a character talk.', min: 20,
            hook: ['code', '🟩 start on green flag\n💬 say "Hello!"', 'Hello!'],
            cards: [
              ['💬', 'Say block', 'The purple say block shows a speech bubble.'],
              ['⌨️', 'Type words', 'Tap the block to type what the character says.'],
              ['⏳', 'Order', 'Put say blocks in order for a conversation.'],
            ],
            acts: [
              { code: '🟩 start on green flag\n💬 say "Hi!"\n➡️ move right', ask: 'What happens first?', options: ['The Cat says “Hi!”', 'The Cat moves right', 'Both at once'], answer: 0, why: 'Blocks run in order.' },
              { mcq: 'What colour are looks blocks like “say”?', options: ['Purple', 'Blue', 'Yellow'], answer: 0, why: 'Looks blocks are purple.' },
              { phase: 'probe', mcq: 'Two characters talking: how do they take turns?', options: ['Use wait blocks or messages so one waits for the other', 'They always talk at once', 'You can’t'], answer: 0, why: 'Timing controls turns.' },
              { phase: 'probe', write: 'Write what your two characters will say to each other.', keywords: ['say', 'hello'], exemplar: 'Cat: “Hello! Want to play?” Dog: “Yes please!”', minWords: 8 },
            ],
            teach: {
              explain: 'Looks blocks; dialogue sequencing; wait blocks for timing.', analogy: 'A speech bubble is like a comic strip.',
              vocab: [['say', 'Show words in a bubble.'], ['wait', 'Pause before the next block.']],
              demo: 'Make a two-character chat with wait blocks.',
              prompts: [['How to make one wait?', 'Wait block.'], ['What colour is say?', 'Purple.']],
              support: 'Type with help.', stretch: 'Three-line conversation.',
              mis: [['Characters talk in turns automatically', 'Use wait or messages.']],
              sheet: 'Comic strip planner for a conversation.',
            },
          },
          {
            t: 'Grow, shrink and sounds', o: 'Use grow, shrink and sound blocks.', min: 20,
            hook: ['code', '🟩 start on green flag\n🔼 grow\n🔊 pop', 'Bigger! Pop!'],
            cards: [
              ['🔼', 'Grow and shrink', 'Purple blocks make characters bigger or smaller.'],
              ['🔊', 'Sound blocks', 'Green blocks play a pop or a sound you record.'],
              ['🎤', 'Record', 'Tap the microphone block to record your own voice (with a grown-up).'],
            ],
            acts: [
              { match: 'Match the block to what it does', pairs: [['Grow', 'Makes the character bigger'], ['Shrink', 'Makes it smaller'], ['Pop', 'Plays a pop sound'], ['Reset size', 'Back to normal size']], why: 'Looks and sound blocks.' },
              { code: '🟩 start on green flag\n🔼 grow\n🔼 grow\n🔽 shrink', ask: 'After this script, is the Cat bigger or smaller than at the start?', options: ['Bigger', 'Smaller', 'The same'], answer: 0, why: 'Grew twice, shrank once.' },
              { phase: 'probe', mcq: 'Which colour are sound blocks?', options: ['Green', 'Purple', 'Red'], answer: 0, why: 'Sound blocks are green.' },
              { phase: 'probe', write: 'What sound would you record for a lion character?', keywords: ['roar', 'sound', 'record'], exemplar: 'I would record a big “ROAR!”', minWords: 5 },
            ],
            teach: {
              explain: 'Looks (size) and sound blocks; recording needs consent.', analogy: 'Grow is like a balloon filling with air.',
              vocab: [['grow', 'Get bigger.'], ['shrink', 'Get smaller.'], ['record', 'Save a sound.']],
              demo: 'Grow a character then reset size.',
              prompts: [['How get normal size?', 'Reset size.'], ['Sound block colour?', 'Green.']],
              support: 'One block at a time.', stretch: 'Make a character grow while popping.',
              mis: [['Grow is permanent', 'Reset size changes it back.']],
              sheet: 'Predict the size after each script.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Stories',
        lessons: [
          {
            t: 'Planning a story', o: 'Plan a story with a beginning, middle and end.', min: 25,
            hook: ['word', 'Beginning · Middle · End', 'every story needs all three'],
            cards: [
              ['1️⃣', 'Beginning', 'Who is in the story and where?'],
              ['2️⃣', 'Middle', 'What problem happens?'],
              ['3️⃣', 'End', 'How is the problem solved?'],
            ],
            acts: [
              { order: 'Put the story in order', steps: ['The Cat is at the park', 'The Cat’s ball rolls into the pond', 'The Duck brings the ball back', 'The Cat says thank you'], why: 'Beginning, middle, end.' },
              { mcq: 'What usually happens in the middle of a story?', options: ['A problem', 'The title', 'The end'], answer: 0, why: 'The middle has a problem.' },
              { phase: 'probe', mcq: 'Why plan before coding?', options: ['So you know what blocks to use', 'Planning is boring', 'No reason'], answer: 0, why: 'Plans guide code.' },
              { phase: 'probe', write: 'Write your 3-part story plan.', keywords: ['beginning', 'middle', 'end'], exemplar: 'Beginning: a dog in a garden. Middle: it gets lost. End: a bird shows it the way home.', minWords: 12 },
            ],
            teach: {
              explain: 'Narrative structure before coding.', analogy: 'A story is a journey with a start, a bump and a finish.',
              vocab: [['beginning', 'Start.'], ['problem', 'Something goes wrong.'], ['ending', 'How it finishes.']],
              demo: 'Draw a 3-box storyboard.',
              prompts: [['Who is in it?', 'Characters.'], ['What goes wrong?', 'Problem.']],
              support: 'Picture prompts.', stretch: 'Add a twist.',
              mis: [['Stories don’t need a problem', 'A problem makes it interesting.']],
              sheet: '3-box storyboard.',
            },
          },
          {
            t: 'Pages for scenes', o: 'Use multiple pages to show scenes in a story.', min: 25,
            hook: ['code', '... ➡️ move right\n📄 go to page 2', 'New scene!'],
            cards: [
              ['📄', 'Pages', 'ScratchJr projects can have several pages — like pages in a book.'],
              ['🔴', 'Go to page', 'The red “go to page” block moves to the next scene.'],
              ['🧑‍🤝‍🧑', 'Characters per page', 'Each page has its own background and characters.'],
            ],
            acts: [
              { mcq: 'How do you move your story to the next scene?', options: ['Use the “go to page” end block', 'Shake the tablet', 'Use a grow block'], answer: 0, why: 'It switches pages.' },
              { order: 'Order a 2-page story program for the Cat on page 1', steps: ['Start on green flag', 'Say “I’m going to the beach!”', 'Move right', 'Go to page 2'], why: 'Talk, move, then change scene.' },
              { phase: 'probe', mcq: 'Page 2 starts. Do the page 2 characters need start blocks?', options: ['Yes — each page’s characters need their own scripts', 'No', 'Only the background'], answer: 0, why: 'Each page has its own code.' },
              { phase: 'probe', write: 'Describe what happens on each page of your story.', keywords: ['page', 'then'], exemplar: 'Page 1: the cat waves at home. Page 2: the cat swims at the beach. Page 3: the cat sleeps.', minWords: 12 },
            ],
            teach: {
              explain: 'Pages as scenes; end blocks for transitions.', analogy: 'Pages are like turning pages in a picture book.',
              vocab: [['page', 'A scene in your project.'], ['go to page', 'Block that changes scene.']],
              demo: 'Build a 2-page story.',
              prompts: [['How many pages?', 'Up to 4.'], ['What starts page 2?', 'Its own scripts.']],
              support: 'Two pages only.', stretch: 'Four pages with dialogue.',
              mis: [['Code on page 1 runs page 2 characters', 'Each page needs its own code.']],
              sheet: 'Page planner (4 boxes).',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Scratch Junior', band: 'K-2', level: 'Advanced', title: 'Loops, Messages and Games',
    description: 'Use repeat loops, speed, messages between characters and tap/bump triggers to build a mini game.',
    intro: 'Build your own mini game! 🎮', theme: 'meadow', tutor: pip, tools,
    style: 'Challenge cards, debugging games, peer play-testing.',
    outcomes: ['Uses repeat and forever', 'Sends and receives messages', 'Uses tap and bump triggers', 'Finds and fixes bugs'],
    modules: [
      {
        title: 'Module 1: Loops and speed',
        lessons: [
          {
            t: 'Repeat loops', o: 'Use repeat to do something many times with fewer blocks.', min: 20,
            hook: ['code', '🟩 start on green flag\n🔁 repeat 4 [ ⤴️ hop ]', 'hop hop hop hop'],
            cards: [
              ['🔁', 'Repeat', 'The orange repeat block runs the blocks inside it again and again.'],
              ['🔢', 'How many times', 'Change the number to repeat more or fewer times.'],
              ['♾️', 'Forever', 'The red repeat-forever block keeps going until you stop.'],
            ],
            acts: [
              { code: '🟩 start on green flag\n🔁 repeat 3 [ ➡️ move right 1 ]', ask: 'How many steps right does the Cat move?', options: ['3', '1', '4'], answer: 0, why: 'Move 1, repeated 3 times.' },
              { mcq: 'Which is shorter to make the Cat hop 5 times?', options: ['A repeat 5 block with one hop inside', 'Five separate hop blocks'], answer: 0, why: 'Loops save blocks.' },
              { phase: 'probe', code: '🟩 start on green flag\n🔁 repeat 2 [ ⤴️ hop  🔄 turn right ]', ask: 'What does the Cat do?', options: ['Hop, turn, hop, turn', 'Hop, hop, turn, turn', 'Turn only'], answer: 0, why: 'Everything inside the loop repeats in order.' },
              { phase: 'probe', write: 'Where could you use a loop in your project?', keywords: ['repeat', 'times'], exemplar: 'To make a fish swim back and forth 5 times.', minWords: 8 },
            ],
            teach: {
              explain: 'Iteration with repeat and forever.', analogy: 'A loop is like a song chorus repeating.',
              vocab: [['loop', 'Blocks that repeat.'], ['repeat', 'Do again.']],
              demo: 'Clap patterns as loops, then code.',
              prompts: [['What goes inside the loop?', 'Blocks to repeat.'], ['When use forever?', 'Background animations.']],
              support: 'Physical loop games.', stretch: 'Loop inside a loop (nested).',
              mis: [['Repeat number is how far you move', 'It’s how many times blocks run.']],
              sheet: 'Loop puzzles: count the result.',
            },
          },
          {
            t: 'Speed and timing', o: 'Change speed and use wait to control timing.', min: 20,
            hook: ['word', 'Slow · Medium · Fast', 'set the speed'],
            cards: [
              ['🐢', 'Set speed', 'The orange speed block makes a character move slow, medium or fast.'],
              ['⏱️', 'Wait', 'The wait block pauses before the next block.'],
              ['🎬', 'Timing matters', 'Good timing makes animations look smooth.'],
            ],
            acts: [
              { mcq: 'You want a snail to move slowly. Which block helps?', options: ['Set speed to slow', 'Grow', 'Pop'], answer: 0, why: 'Speed control.' },
              { code: '🟩 start on green flag\n💬 say "Ready?"\n⏱️ wait\n➡️ move right', ask: 'What happens?', options: ['Says “Ready?”, pauses, then moves', 'Moves first', 'Never moves'], answer: 0, why: 'Wait pauses between blocks.' },
              { phase: 'probe', mcq: 'In a race game, which should be set to fast?', options: ['The cheetah', 'The tortoise', 'The background'], answer: 0, why: 'Speed fits the character.' },
              { phase: 'probe', write: 'Plan a race between two characters with different speeds.', keywords: ['fast', 'slow', 'speed'], exemplar: 'Rabbit set to fast, tortoise set to slow. Both move right 10 on green flag.', minWords: 10 },
            ],
            teach: {
              explain: 'Control blocks: speed, wait.', analogy: 'Speed is like walking, jogging, running.',
              vocab: [['speed', 'How fast.'], ['wait', 'Pause.']],
              demo: 'Race animation with two speeds.',
              prompts: [['Who wins and why?', 'Faster speed.'], ['Why wait?', 'Timing.']],
              support: 'Two characters only.', stretch: 'Make the slow one win with a head start.',
              mis: [['Wait stops the program', 'It just pauses.']],
              sheet: 'Race planner.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Messages and games',
        lessons: [
          {
            t: 'Messages between characters', o: 'Send and receive messages so characters react to each other.', min: 25,
            hook: ['code', 'Cat: ✉️ send orange message\nDog: start on orange message → 💬 "Woof!"', 'Woof!'],
            cards: [
              ['✉️', 'Send', 'A character can send a coloured message.'],
              ['📬', 'Receive', '“Start on message” starts a script when that colour message arrives.'],
              ['🤝', 'Teamwork', 'Messages let characters take turns.'],
            ],
            acts: [
              { order: 'Order the Cat–Dog conversation', steps: ['Cat: start on green flag', 'Cat: say “Hello Dog!”', 'Cat: send orange message', 'Dog: start on orange message', 'Dog: say “Hi Cat!”'], why: 'Send then receive.' },
              { mcq: 'The Cat sends a blue message but the Dog waits for orange. What happens?', options: ['The Dog does nothing', 'The Dog talks', 'The Cat disappears'], answer: 0, why: 'Colours must match.' },
              { phase: 'probe', mcq: 'Why use messages instead of wait blocks for turns?', options: ['The second character starts exactly when the first finishes', 'Messages are prettier', 'No reason'], answer: 0, why: 'Precise coordination.' },
              { phase: 'probe', write: 'Plan a 3-character story using messages.', keywords: ['send', 'message', 'start on'], exemplar: 'Cat sends orange → Dog barks and sends blue → Bird flies away.', minWords: 12 },
            ],
            teach: {
              explain: 'Event-based coordination.', analogy: 'Messages are like passing a baton in a relay.',
              vocab: [['message', 'A signal sent between characters.'], ['receive', 'Get a message.']],
              demo: 'Relay race with coloured cards.',
              prompts: [['What must match?', 'Colour.'], ['Who goes next?', 'The receiver.']],
              support: 'Use one colour.', stretch: 'Chain three messages.',
              mis: [['Any message starts any script', 'Only the matching colour.']],
              sheet: 'Message chain planner.',
            },
          },
          {
            t: 'Make a tap game and fix bugs', o: 'Use tap and bump triggers to make a game and debug it.', min: 30,
            hook: ['code', '👆 start on tap\n💥 pop\n🙈 hide', 'Caught it!'],
            cards: [
              ['👆', 'Start on tap', 'This trigger runs when you tap the character.'],
              ['💥', 'Start on bump', 'This runs when two characters touch.'],
              ['🐞', 'Debugging', 'A bug is a mistake. Test, find, fix, test again.'],
            ],
            acts: [
              { code: '👆 start on tap\n💥 pop\n🙈 hide', ask: 'What happens when you tap the balloon?', options: ['It pops and hides', 'It grows', 'Nothing'], answer: 0, why: 'The tap trigger runs the script.' },
              { mcq: 'Your game: the Cat should say “Ouch” when it bumps the Dog, but nothing happens. What’s the likely bug?', options: ['Missing “start on bump” block', 'Too many backgrounds', 'Tablet is too big'], answer: 0, why: 'No trigger for the bump.' },
              { phase: 'probe', order: 'Order the debugging steps', steps: ['Test the game', 'Notice what is wrong', 'Find the block causing it', 'Fix it', 'Test again'], why: 'Test–find–fix–test.' },
              { phase: 'probe', write: 'Describe your tap game and one bug you fixed.', keywords: ['tap', 'bug', 'fixed'], exemplar: 'Tap the fish to make it swim away. Bug: it didn’t hide. I added a hide block.', minWords: 12 },
            ],
            teach: {
              explain: 'Event triggers (tap, bump) and debugging cycle.', analogy: 'A bug is like a pebble in your shoe — find it and take it out.',
              vocab: [['bug', 'A mistake in code.'], ['debug', 'Find and fix mistakes.'], ['bump', 'When characters touch.']],
              demo: 'Plant a bug in a project and debug together.',
              prompts: [['How do we find bugs?', 'Test.'], ['What after fixing?', 'Test again.']],
              support: 'Bug hunt with one bug.', stretch: 'Add a score using characters.',
              mis: [['Bugs mean you’re bad at coding', 'All coders fix bugs.']],
              sheet: 'Bug hunt checklist.',
            },
          },
        ],
      },
    ],
  },
  // ───────── Scratch (3-5) ─────────
  {
    subject: 'Scratch', band: '3-5', level: 'Beginner', title: 'Sprites, Motion and Events',
    description: 'Explore Scratch: sprites, the stage, motion and looks blocks, and events like the green flag and key presses.',
    intro: 'Bring sprites to life! 🐱', theme: 'meadow', tutor: scratchy, tools: stools,
    style: 'Guided build-alongs, then remix challenges.',
    outcomes: ['Navigates the Scratch editor', 'Uses motion and looks blocks', 'Uses event blocks (green flag, keys, clicks)'],
    modules: [
      {
        title: 'Module 1: The editor',
        lessons: [
          {
            t: 'Meet Scratch', o: 'Identify the stage, sprites, block palette and scripts area.', min: 25,
            hook: ['code', 'when green flag clicked\nsay [Hello!] for (2) seconds', 'Hello!'],
            cards: [
              ['🎭', 'Stage and sprites', 'The stage is where things happen; sprites are the characters.'],
              ['🧱', 'Block palette', 'Blocks are grouped by colour: Motion (blue), Looks (purple), Events (yellow) and more.'],
              ['📜', 'Scripts area', 'Drag blocks into the scripts area and snap them together.'],
            ],
            acts: [
              { match: 'Match the block category to its colour', pairs: [['Motion', 'Blue'], ['Looks', 'Purple'], ['Events', 'Yellow'], ['Control', 'Orange']], why: 'Colours help you find blocks.' },
              { mcq: 'Where do sprites perform?', options: ['On the stage', 'In the block palette', 'In the menu'], answer: 0, why: 'The stage shows the action.' },
              { phase: 'probe', code: 'when green flag clicked\nsay [Hi] for (2) seconds\nsay [Bye] for (1) seconds', ask: 'How long until the sprite stops talking?', options: ['3 seconds', '2 seconds', '1 second'], answer: 0, why: '2 + 1 seconds in order.' },
              { phase: 'probe', write: 'Name three parts of the Scratch editor and what they do.', keywords: ['stage', 'sprite', 'palette', 'scripts'], exemplar: 'Stage: where sprites act. Palette: where blocks are. Scripts area: where I build code.', minWords: 15 },
            ],
            teach: {
              explain: 'Scratch interface tour.', analogy: 'The stage is a theatre; sprites are actors; scripts are their scripts.',
              vocab: [['sprite', 'A character or object.'], ['stage', 'Background area where sprites appear.'], ['script', 'Blocks snapped together.']],
              demo: 'Tour the editor live and make the Cat say hello.',
              prompts: [['Where are Looks blocks?', 'Purple category.'], ['How run code?', 'Green flag.']],
              support: 'Labelled screenshot.', stretch: 'Add a second sprite that answers.',
              mis: [['Blocks run from the palette', 'They must be in the scripts area.']],
              sheet: 'Label the Scratch editor.',
            },
          },
          {
            t: 'Coordinates and motion', o: 'Use x and y coordinates and motion blocks.', min: 30,
            hook: ['code', 'go to x: (0) y: (0)\nglide (1) secs to x: (200) y: (0)', 'Sprite glides right'],
            cards: [
              ['📍', 'x and y', 'x is left–right (−240 to 240); y is down–up (−180 to 180). The centre is (0, 0).'],
              ['➡️', 'Move steps', '“move 10 steps” moves in the direction the sprite faces.'],
              ['🛝', 'Glide', '“glide to x: y:” moves smoothly to a point.'],
            ],
            acts: [
              { mcq: 'Where is (0, 0) on the Scratch stage?', options: ['The centre', 'Top-left corner', 'Bottom-right corner'], answer: 0, why: 'Centre of the stage.' },
              { mcq: 'A sprite at x = 100 moves to x = −100. Which way did it go?', options: ['Left', 'Right', 'Up'], answer: 0, why: 'Smaller x is further left.' },
              { code: 'go to x: (0) y: (0)\nchange y by (50)', ask: 'Where is the sprite now?', options: ['x: 0, y: 50 (higher)', 'x: 50, y: 0', 'x: 0, y: −50'], answer: 0, why: 'Change y by 50 moves up.' },
              { phase: 'probe', mcq: 'To move a sprite to the top-right area, which point?', options: ['x: 200, y: 150', 'x: −200, y: −150', 'x: 0, y: 0'], answer: 0, why: 'Positive x right, positive y up.' },
              { phase: 'probe', write: 'Write blocks to glide a sprite from the centre to the bottom-left corner.', keywords: ['go to', 'glide', 'x', 'y', '-'], exemplar: 'go to x: 0 y: 0, then glide 2 secs to x: −220 y: −160.', minWords: 10 },
            ],
            teach: {
              explain: 'Cartesian coordinates on the Scratch stage.', analogy: 'Coordinates are like a treasure map grid.',
              vocab: [['coordinate', 'A number that gives position.'], ['x', 'Left–right.'], ['y', 'Up–down.']],
              demo: 'Use the xy-grid backdrop to place sprites.',
              prompts: [['Positive y means?', 'Up.'], ['Negative x means?', 'Left.']],
              support: 'Grid backdrop.', stretch: 'Draw a square path with glides.',
              mis: [['y gets bigger going down', 'In Scratch, y increases going up.']],
              sheet: 'Coordinate treasure hunt.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Events and looks',
        lessons: [
          {
            t: 'Keyboard and click events', o: 'Use key presses and sprite clicks to control sprites.', min: 30,
            hook: ['code', 'when [right arrow] key pressed\nchange x by (10)', 'Sprite steps right'],
            cards: [
              ['⌨️', 'Key presses', '“when [key] pressed” runs code when that key is pressed.'],
              ['🖱️', 'Sprite clicked', '“when this sprite clicked” runs when you click the sprite.'],
              ['🎮', 'Controls', 'Arrow keys + change x/y = simple game controls.'],
            ],
            acts: [
              { match: 'Match the event to the action for arrow controls', pairs: [['when right arrow pressed', 'change x by 10'], ['when left arrow pressed', 'change x by −10'], ['when up arrow pressed', 'change y by 10'], ['when down arrow pressed', 'change y by −10']], why: 'Arrow keys map to x and y changes.' },
              { code: 'when this sprite clicked\nsay [Ouch!] for (1) seconds', ask: 'When does the sprite say “Ouch!”?', options: ['When you click it', 'When the green flag is clicked', 'Always'], answer: 0, why: 'Click event.' },
              { phase: 'probe', mcq: 'Pressing left moves the sprite right. What’s the bug?', options: ['Left arrow uses change x by 10 instead of −10', 'Wrong costume', 'Volume too low'], answer: 0, why: 'Sign error.' },
              { phase: 'probe', write: 'Describe the scripts needed for a sprite you can move in all four directions.', keywords: ['arrow', 'change x', 'change y'], exemplar: 'Four scripts: right arrow → change x by 10; left → change x by −10; up → change y by 10; down → change y by −10.', minWords: 15 },
            ],
            teach: {
              explain: 'Event-driven programming with input.', analogy: 'Events are like doorbells — code answers when they ring.',
              vocab: [['event', 'Something that happens and starts code.'], ['input', 'Information from the user, like a key press.']],
              demo: 'Build arrow-key controls.',
              prompts: [['What does −10 do?', 'Opposite direction.'], ['Why separate scripts?', 'Each key is its own event.']],
              support: 'Two directions only.', stretch: 'Add a sound when clicked.',
              mis: [['One script handles all keys', 'Each key event needs its own script (or if-blocks).']],
              sheet: 'Controls planner.',
            },
          },
          {
            t: 'Costumes and animation', o: 'Switch costumes to animate a sprite.', min: 30,
            hook: ['code', 'forever\n  next costume\n  wait (0.2) seconds', 'Walking animation'],
            cards: [
              ['👕', 'Costumes', 'Sprites can have several costumes (pictures).'],
              ['🎞️', 'Animation', 'Switching costumes quickly makes movement, like a flipbook.'],
              ['⏱️', 'Wait', 'A short wait controls animation speed.'],
            ],
            acts: [
              { code: 'when green flag clicked\nforever\n  next costume\n  wait (0.5) seconds', ask: 'What happens?', options: ['The sprite keeps changing costumes every half second', 'It changes once', 'It moves right'], answer: 0, why: 'Forever loop with costume change.' },
              { mcq: 'The animation is too fast. What should you change?', options: ['Increase the wait time', 'Remove the wait', 'Add more sprites'], answer: 0, why: 'Longer wait = slower.' },
              { phase: 'probe', mcq: 'How do you make a sprite walk across the stage while animating?', options: ['Combine move steps and next costume in a loop', 'Only next costume', 'Only change size'], answer: 0, why: 'Movement + costume change.' },
              { phase: 'probe', write: 'Write the blocks for a bird that flaps its wings while flying right.', keywords: ['forever', 'next costume', 'move', 'wait'], exemplar: 'when green flag clicked, forever: move 5 steps, next costume, wait 0.2 seconds.', minWords: 12 },
            ],
            teach: {
              explain: 'Frame-based animation.', analogy: 'A flipbook — pictures changing fast look like motion.',
              vocab: [['costume', 'A picture a sprite can wear.'], ['animation', 'Pictures changing to show movement.'], ['forever', 'Loop that never stops.']],
              demo: 'Animate the Cat walking.',
              prompts: [['Too fast?', 'Increase wait.'], ['How to move and animate?', 'Combine blocks.']],
              support: 'Use a 2-costume sprite.', stretch: 'Draw your own costumes.',
              mis: [['Forever loops crash the computer', 'They run until stopped.']],
              sheet: 'Flipbook animation planner.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Scratch', band: '3-5', level: 'Intermediate', title: 'Loops, Conditions and Interactive Stories',
    description: 'Use loops, if–then conditions, sensing and broadcasts to build interactive stories and simple games.',
    intro: 'Make projects that react to players! 🕹️', theme: 'meadow', tutor: scratchy, tools: stools,
    style: 'Predict–run–modify cycles, pair programming.',
    outcomes: ['Uses repeat and forever loops', 'Uses if–then with sensing', 'Coordinates sprites with broadcasts', 'Builds an interactive story'],
    modules: [
      {
        title: 'Module 1: Loops and conditions',
        lessons: [
          {
            t: 'Repeat and forever', o: 'Choose between repeat and forever loops.', min: 30,
            hook: ['code', 'repeat (4)\n  move (100) steps\n  turn ↻ (90) degrees', 'Draws a square path'],
            cards: [
              ['🔁', 'Repeat', 'Runs the blocks inside a set number of times.'],
              ['♾️', 'Forever', 'Runs until the project stops — good for games and animations.'],
              ['⬜', 'Shapes', 'Repeat 4 × (move, turn 90°) makes a square.'],
            ],
            acts: [
              { code: 'repeat (3)\n  move (100) steps\n  turn ↻ (120) degrees', ask: 'What shape does the path make?', options: ['Triangle', 'Square', 'Circle'], answer: 0, why: '3 sides with 120° turns.' },
              { mcq: 'For a background that always scrolls in a game, use…', options: ['Forever', 'Repeat 2', 'No loop'], answer: 0, why: 'It must keep going.' },
              { phase: 'probe', code: 'repeat (6)\n  move (50) steps\n  turn ↻ (60) degrees', ask: 'What shape?', options: ['Hexagon', 'Pentagon', 'Square'], answer: 0, why: '6 sides, 360 ÷ 6 = 60°.' },
              { phase: 'probe', write: 'What turn angle makes a pentagon? Explain.', keywords: ['72', '360', '5'], exemplar: '72 degrees, because 360 ÷ 5 = 72.', minWords: 8 },
            ],
            teach: {
              explain: 'Definite vs indefinite iteration; geometry link (360 ÷ sides).', analogy: 'Repeat is laps on a track; forever is a merry-go-round.',
              vocab: [['iteration', 'Repeating.'], ['angle', 'Amount of turn.']],
              demo: 'Draw polygons with the pen extension.',
              prompts: [['Formula for turn?', '360 ÷ sides.'], ['When forever?', 'Ongoing behaviour.']],
              support: 'Polygon table.', stretch: 'Draw a star (turn 144°).',
              mis: [['Turn angle = interior angle', 'Use exterior angle (360 ÷ sides).']],
              sheet: 'Polygon loop table.',
            },
          },
          {
            t: 'If–then and sensing', o: 'Use if–then with sensing blocks to make decisions.', min: 30,
            hook: ['code', 'forever\n  if <touching [edge]?> then\n    turn ↻ (180) degrees', 'Bounces back!'],
            cards: [
              ['❓', 'If–then', 'Runs blocks only when a condition is true.'],
              ['👀', 'Sensing', 'Blocks like “touching colour?”, “touching sprite?”, “key pressed?” check conditions.'],
              ['🔁', 'Check often', 'Put if–then inside forever so it keeps checking.'],
            ],
            acts: [
              { code: 'forever\n  if <touching [Apple]?> then\n    say [Yum!] for (1) seconds', ask: 'When does the sprite say “Yum!”?', options: ['Whenever it touches the Apple', 'Only at the start', 'Never'], answer: 0, why: 'Forever keeps checking the condition.' },
              { mcq: 'Without forever, an if–then at the start checks…', options: ['Only once', 'All the time', 'Twice'], answer: 0, why: 'Code runs once unless looped.' },
              { phase: 'probe', mcq: 'To lose a life when touching red lava, which condition?', options: ['touching color [red]?', 'key space pressed?', 'mouse down?'], answer: 0, why: 'Colour sensing.' },
              { phase: 'probe', write: 'Write an if–then rule for a game you’d like to make.', keywords: ['if', 'touching', 'then'], exemplar: 'If touching the coin then change score by 1 and hide the coin.', minWords: 10 },
            ],
            teach: {
              explain: 'Selection with Boolean conditions.', analogy: 'If it rains, then take an umbrella.',
              vocab: [['condition', 'Something true or false.'], ['sensing', 'Blocks that check what’s happening.'], ['Boolean', 'True or false.']],
              demo: 'Bouncing sprite and coin collection.',
              prompts: [['Why inside forever?', 'Keep checking.'], ['What can we sense?', 'Touching, keys, mouse.']],
              support: 'Fill-in condition blocks.', stretch: 'Add if–else for two outcomes.',
              mis: [['If–then keeps checking by itself', 'It needs a loop.']],
              sheet: 'If–then rule cards.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Interactive stories',
        lessons: [
          {
            t: 'Broadcasts', o: 'Coordinate sprites and backdrops with broadcast messages.', min: 30,
            hook: ['code', 'broadcast [scene 2]\n…\nwhen I receive [scene 2]\nswitch backdrop to [forest]', 'Scene changes'],
            cards: [
              ['📣', 'Broadcast', 'Sends a message to all sprites and the stage.'],
              ['📬', 'When I receive', 'Starts code when a message arrives.'],
              ['🎬', 'Scenes', 'Use broadcasts to change backdrops and start the next part of a story.'],
            ],
            acts: [
              { order: 'Order a scene change', steps: ['Narrator says the last line of scene 1', 'Narrator broadcasts “scene 2”', 'Stage receives “scene 2” and switches backdrop', 'Characters receive “scene 2” and appear'], why: 'One broadcast coordinates many sprites.' },
              { mcq: 'Which sprites receive a broadcast?', options: ['All sprites and the stage that have a matching “when I receive”', 'Only the sender', 'Only the stage'], answer: 0, why: 'Broadcasts go to everyone.' },
              { phase: 'probe', mcq: 'What’s the difference between “broadcast” and “broadcast and wait”?', options: ['“and wait” pauses until receivers finish', 'No difference', '“and wait” sends twice'], answer: 0, why: 'Synchronisation.' },
              { phase: 'probe', write: 'Plan the broadcasts for a 3-scene story.', keywords: ['broadcast', 'receive', 'scene'], exemplar: 'Scene 1 ends: broadcast “forest”. Stage switches to forest; fox appears. Fox finishes: broadcast “castle”. Stage switches; king appears.', minWords: 20 },
            ],
            teach: {
              explain: 'Message passing for coordination.', analogy: 'A broadcast is a school bell everyone hears.',
              vocab: [['broadcast', 'Send a message to all.'], ['receive', 'Respond to a message.']],
              demo: 'Two-scene story with backdrop switch.',
              prompts: [['Who hears broadcasts?', 'Everyone.'], ['When use “and wait”?', 'Need sequence.']],
              support: 'Scene template.', stretch: 'Add choices that broadcast different scenes.',
              mis: [['Broadcast only goes to one sprite', 'All sprites can receive it.']],
              sheet: 'Broadcast storyboard.',
            },
          },
          {
            t: 'Choose-your-path story', o: 'Use ask and answer to make an interactive story with choices.', min: 35,
            hook: ['code', 'ask [Left or right?] and wait\nif <(answer) = [left]> then\n  broadcast [cave]', 'Into the cave!'],
            cards: [
              ['❓', 'Ask', '“ask and wait” shows a question box; the reply is stored in “answer”.'],
              ['🔀', 'Branches', 'Use if–else to choose different scenes.'],
              ['🧭', 'Plan the paths', 'Draw a story map before coding.'],
            ],
            acts: [
              { code: 'ask [Pick a number] and wait\nif <(answer) > (5)> then\n  say [Big!]\nelse\n  say [Small!]', ask: 'The player types 3. What does the sprite say?', options: ['Small!', 'Big!', 'Nothing'], answer: 0, why: '3 is not greater than 5.' },
              { mcq: 'Where is the player’s typed reply stored?', options: ['In the “answer” block', 'In a costume', 'In the backdrop'], answer: 0, why: 'answer holds the latest reply.' },
              { phase: 'probe', mcq: 'Player types “Left” with a capital L; your check is “left”. In Scratch, does the comparison match?', options: ['Yes — Scratch’s = comparison ignores capital letters', 'No, never', 'Only on Tuesdays'], answer: 0, why: 'Scratch text comparison is case-insensitive.' },
              { phase: 'probe', write: 'Draw/describe a story map with one choice and two endings.', keywords: ['choice', 'if', 'ending'], exemplar: 'Start: a fork in the road. Ask “left or right?”. Left → cave with treasure (happy ending). Right → river and a ride home (another ending).', minWords: 20 },
            ],
            teach: {
              explain: 'User input, variables (answer), branching.', analogy: 'A choose-your-own-adventure book.',
              vocab: [['input', 'What the user types.'], ['branch', 'A different path in code.'], ['if–else', 'Do one thing or another.']],
              demo: 'Build a 2-choice story.',
              prompts: [['What if user types something unexpected?', 'Add an else.'], ['How plan?', 'Story map.']],
              support: 'Story map template.', stretch: 'Three choices with nested if.',
              mis: [['Answer remembers all replies', 'It holds the latest one.']],
              sheet: 'Story map planner.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Scratch', band: '3-5', level: 'Advanced', title: 'Variables and Game Design',
    description: 'Use variables for score and lives, random numbers, timers and game design to build a complete game.',
    intro: 'Design and build your own game! 🏆', theme: 'meadow', tutor: scratchy, tools: stools,
    style: 'Design-build-playtest loops.',
    outcomes: ['Creates and changes variables', 'Uses random numbers', 'Builds a timer and win/lose conditions', 'Playtests and improves a game'],
    modules: [
      {
        title: 'Module 1: Variables',
        lessons: [
          {
            t: 'Score and lives', o: 'Create variables for score and lives and update them.', min: 30,
            hook: ['code', 'set [score] to (0)\nchange [score] by (1)', 'score: 1'],
            cards: [
              ['📦', 'Variables', 'A variable is a named box that stores a value, like score.'],
              ['🔢', 'Set and change', '“set” gives it a value; “change” adds to it.'],
              ['🎮', 'Reset at start', 'Set score to 0 when the green flag is clicked.'],
            ],
            acts: [
              { code: 'set [score] to (0)\nchange [score] by (5)\nchange [score] by (2)', ask: 'What is score now?', options: ['7', '5', '2'], answer: 0, why: '0 + 5 + 2.' },
              { code: 'set [lives] to (3)\nchange [lives] by (-1)', ask: 'What is lives?', options: ['2', '4', '−1'], answer: 0, why: '3 − 1.' },
              { phase: 'probe', mcq: 'Why set score to 0 when the green flag is clicked?', options: ['So each game starts fresh', 'Scratch requires it', 'To make it faster'], answer: 0, why: 'Reset state.' },
              { phase: 'probe', write: 'Which variables would your game need? What would change them?', keywords: ['score', 'lives', 'change', 'touching'], exemplar: 'Score: +1 when catching a star. Lives: −1 when touching a meteor. Level: +1 every 10 points.', minWords: 15 },
            ],
            teach: {
              explain: 'Variables as state; initialisation.', analogy: 'A variable is a labelled jar of counters.',
              vocab: [['variable', 'Named storage for a value.'], ['initialise', 'Set a starting value.']],
              demo: 'Create score and lives variables.',
              prompts: [['Set vs change?', 'Replace vs add.'], ['Why reset?', 'Fresh start.']],
              support: 'Variable cards.', stretch: 'High-score variable.',
              mis: [['Variables reset by themselves', 'You must set them.']],
              sheet: 'Variable trace table.',
            },
          },
          {
            t: 'Randomness', o: 'Use pick random to make games unpredictable.', min: 30,
            hook: ['code', 'go to x: (pick random (-200) to (200)) y: (180)', 'Star appears somewhere new!'],
            cards: [
              ['🎲', 'Pick random', '“pick random 1 to 10” gives a different number each time.'],
              ['📍', 'Random positions', 'Use it for x or y to place things unpredictably.'],
              ['⚖️', 'Fairness', 'Choose ranges that keep the game fair.'],
            ],
            acts: [
              { mcq: '“pick random 1 to 6” is like…', options: ['Rolling a dice', 'Counting to 6', 'Always 6'], answer: 0, why: 'Random 1–6.' },
              { mcq: 'To drop a star from a random spot at the top, which block?', options: ['go to x: (pick random −200 to 200) y: 180', 'go to x: 0 y: 0', 'move 10 steps'], answer: 0, why: 'Random x at the top.' },
              { phase: 'probe', mcq: 'Stars sometimes appear off-screen. What’s the bug?', options: ['The random range is wider than the stage', 'Too many costumes', 'Score is wrong'], answer: 0, why: 'Stay within −240 to 240.' },
              { phase: 'probe', write: 'Describe how you’d use randomness to make your game more fun.', keywords: ['random', 'position', 'speed'], exemplar: 'Meteors fall from random x positions at random speeds between 2 and 6.', minWords: 12 },
            ],
            teach: {
              explain: 'Randomness for variety; range limits.', analogy: 'Random is like shuffling cards.',
              vocab: [['random', 'Not predictable.'], ['range', 'Lowest to highest values.']],
              demo: 'Random falling objects.',
              prompts: [['What range for x?', '−240 to 240.'], ['Too random?', 'Keep fair.']],
              support: 'Range card.', stretch: 'Random costume and size.',
              mis: [['Random means anything can happen', 'Only within the range you set.']],
              sheet: 'Random range planner.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Complete game',
        lessons: [
          {
            t: 'Timers and win/lose', o: 'Add a countdown timer and win/lose conditions.', min: 35,
            hook: ['code', 'set [time] to (30)\nrepeat until <(time) = (0)>\n  wait (1) seconds\n  change [time] by (-1)', '30… 29… 28…'],
            cards: [
              ['⏳', 'Countdown', 'A variable decreases by 1 each second.'],
              ['🏁', 'Win', 'If score reaches the target, broadcast “win”.'],
              ['💀', 'Lose', 'If lives = 0 or time = 0, broadcast “game over” and stop.'],
            ],
            acts: [
              { code: 'set [time] to (10)\nrepeat until <(time) = (0)>\n  wait (1) seconds\n  change [time] by (-1)\nbroadcast [game over]', ask: 'About how long until “game over” is broadcast?', options: ['10 seconds', '1 second', 'Never'], answer: 0, why: '10 loops of 1 second.' },
              { mcq: 'Which condition should end the game as a loss?', options: ['lives = 0', 'score = 0 at start', 'time = 30'], answer: 0, why: 'No lives left.' },
              { phase: 'probe', mcq: 'Score reaches 20 but nothing happens. Likely bug?', options: ['No script checks score to broadcast “win”', 'Too many sprites', 'Backdrop is blue'], answer: 0, why: 'Missing win check.' },
              { phase: 'probe', write: 'Write the win and lose rules for your game.', keywords: ['win', 'lose', 'if', 'score', 'lives'], exemplar: 'Win: if score = 20, broadcast “win” and show a trophy. Lose: if lives = 0 or time = 0, broadcast “game over” and stop all.', minWords: 15 },
            ],
            teach: {
              explain: 'Game state, termination conditions.', analogy: 'Like a referee blowing the final whistle.',
              vocab: [['repeat until', 'Loop that stops when a condition is true.'], ['game state', 'Current score, lives, time.']],
              demo: 'Add timer + win/lose to a game.',
              prompts: [['Ways to lose?', 'Lives/time.'], ['How show win?', 'Broadcast + backdrop.']],
              support: 'Template project.', stretch: 'Levels that get harder.',
              mis: [['Repeat until checks only at the end', 'It checks each loop.']],
              sheet: 'Game rules design sheet.',
            },
          },
          {
            t: 'Playtest and improve', o: 'Playtest a game, gather feedback and improve it.', min: 35,
            hook: ['word', 'Play · Note · Fix · Repeat', 'playtesting'],
            cards: [
              ['🧪', 'Playtest', 'Watch others play without helping.'],
              ['📝', 'Feedback', 'Ask: Was it fun? Too hard or easy? Any bugs?'],
              ['🔧', 'Improve', 'Pick the top 2 changes and test again.'],
            ],
            acts: [
              { order: 'Order playtesting', steps: ['Ask a friend to play', 'Watch quietly and note problems', 'Ask feedback questions', 'Choose top fixes', 'Test again'], why: 'Iterative design.' },
              { sort: 'Useful or unhelpful feedback?', buckets: ['Useful', 'Unhelpful'], items: [['“The meteors are too fast on level 1.”', 0], ['“It’s bad.”', 1], ['“I didn’t know which key to press.”', 0], ['“Make it about dinosaurs” (no reason)', 1]], why: 'Specific, actionable feedback helps.' },
              { phase: 'probe', mcq: 'Players say the game is too hard. A good fix?', options: ['Slow the enemies or add an extra life', 'Make it faster', 'Remove the score'], answer: 0, why: 'Balance difficulty.' },
              { phase: 'probe', write: 'Write a short changelog: two improvements you made after playtesting.', keywords: ['changed', 'because', 'feedback'], exemplar: 'v2: slowed meteors on level 1 because testers lost too fast; added instructions screen because players didn’t know the controls.', minWords: 15 },
            ],
            teach: {
              explain: 'User testing and iteration in game design.', analogy: 'Chefs taste-test before serving.',
              vocab: [['playtest', 'Testing a game with players.'], ['iteration', 'Improving in cycles.'], ['changelog', 'List of changes.']],
              demo: 'Run a class playtest rotation.',
              prompts: [['Why not help testers?', 'See real problems.'], ['How choose fixes?', 'Most important.']],
              support: 'Feedback form.', stretch: 'Share on Scratch (with permission) and read comments.',
              mis: [['If I like it, it’s finished', 'Others find issues you miss.']],
              sheet: 'Playtest feedback form.',
            },
          },
        ],
      },
    ],
  },
  // ───────── Scratch (6-8) ─────────
  {
    subject: 'Scratch', band: '6-8', level: 'Beginner', title: 'Programming Fundamentals with Scratch',
    description: 'Learn core programming concepts — sequence, events, loops, conditionals, variables — by building fast-paced projects.',
    intro: 'Learn real programming ideas, fast. ⚡', theme: 'meadow', tutor: scratchy, tools: stools,
    style: 'Concept-first explanations, then build challenges; links to text-based languages.',
    outcomes: ['Explains sequence, selection and iteration', 'Uses variables and operators', 'Builds an arcade-style game'],
    modules: [
      {
        title: 'Module 1: Core concepts',
        lessons: [
          {
            t: 'Sequence, selection, iteration', o: 'Identify the three building blocks of algorithms in Scratch code.', min: 30,
            hook: ['code', 'forever\n  if <key [space] pressed?> then\n    change y by (10)', 'Jump!'],
            cards: [
              ['➡️', 'Sequence', 'Instructions run in order.'],
              ['🔀', 'Selection', 'if/if–else chooses what runs.'],
              ['🔁', 'Iteration', 'Loops repeat instructions.'],
            ],
            acts: [
              { match: 'Match the Scratch block to the concept', pairs: [['repeat (10)', 'Iteration'], ['if <> then', 'Selection'], ['move, then say, then turn', 'Sequence'], ['forever', 'Iteration (indefinite)']], why: 'Core constructs.' },
              { code: 'set [x] to (1)\nrepeat (3)\n  set [x] to ((x) * (2))', ask: 'What is x after the loop?', options: ['8', '6', '2'], answer: 0, why: '1 → 2 → 4 → 8.' },
              { phase: 'probe', code: 'if <(5) > (3)> then\n  say [A]\nelse\n  say [B]', ask: 'What does the sprite say?', options: ['A', 'B', 'Both'], answer: 0, why: '5 > 3 is true.' },
              { phase: 'probe', write: 'Describe a daily routine using sequence, selection and iteration.', keywords: ['sequence', 'if', 'repeat'], exemplar: 'Sequence: wake, brush, eat. Selection: if raining, take umbrella. Iteration: repeat 10 times — skip rope.', minWords: 15 },
            ],
            teach: {
              explain: 'Three control structures underpin all programs.', analogy: 'Recipes have steps (sequence), choices (if out of sugar…), and repetition (stir 10 times).',
              vocab: [['sequence', 'Order of instructions.'], ['selection', 'Decisions.'], ['iteration', 'Repetition.']],
              demo: 'Annotate a project highlighting each construct.',
              prompts: [['Which construct makes choices?', 'Selection.'], ['Indefinite loop?', 'Forever.']],
              support: 'Concept cards.', stretch: 'Translate one script to pseudocode.',
              mis: [['Programs are only sequences', 'Most use all three.']],
              sheet: 'Construct-spotting worksheet.',
            },
          },
          {
            t: 'Variables and operators', o: 'Use variables with arithmetic and comparison operators.', min: 30,
            hook: ['code', 'set [total] to ((price) * (qty))', 'total: 150'],
            cards: [
              ['📦', 'Variables', 'Store values that change: score, speed, total.'],
              ['➕', 'Operators', 'Green operator blocks do maths (+, −, ×, ÷), compare (<, =, >) and join text.'],
              ['🔗', 'Join', '“join [Score: ] (score)” combines text and numbers.'],
            ],
            acts: [
              { code: 'set [a] to (7)\nset [b] to (3)\nsay ((a) mod (b))', ask: 'What is said?', options: ['1', '2', '4'], answer: 0, why: '7 mod 3 = remainder 1.' },
              { code: 'set [speed] to (4)\nchange [speed] by ((speed) / (2))', ask: 'What is speed?', options: ['6', '2', '4'], answer: 0, why: '4 + 2.' },
              { phase: 'probe', mcq: 'Which checks whether a number is even?', options: ['(n mod 2) = 0', '(n / 2) = 0', '(n + 2) = 0'], answer: 0, why: 'Even numbers have remainder 0 when divided by 2.' },
              { phase: 'probe', write: 'Write blocks to show “You have N coins” using join.', keywords: ['join', 'say', 'coins'], exemplar: 'say (join [You have ] (join (coins) [ coins]))', minWords: 8 },
            ],
            teach: {
              explain: 'Arithmetic, modulo, comparison, string joining.', analogy: 'Operators are tools in a toolbox.',
              vocab: [['operator', 'Symbol that performs an operation.'], ['mod', 'Remainder after division.'], ['string', 'Text.']],
              demo: 'Shop calculator project.',
              prompts: [['What is 10 mod 4?', '2.'], ['Why join?', 'Combine text and values.']],
              support: 'Operator cheat sheet.', stretch: 'FizzBuzz in Scratch.',
              mis: [['mod means divide', 'It’s the remainder.']],
              sheet: 'Operator practice.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Arcade build',
        lessons: [
          {
            t: 'Player movement and gravity', o: 'Program smooth movement with velocity and simple gravity.', min: 35,
            hook: ['code', 'change [yv] by (-1)\nchange y by (yv)', 'Falls faster and faster'],
            cards: [
              ['🏃', 'Velocity', 'Store speed in a variable (xv, yv) for smooth movement.'],
              ['🌍', 'Gravity', 'Each frame, reduce yv by 1; then change y by yv.'],
              ['🦘', 'Jump', 'When jump pressed and on the ground, set yv to a positive number.'],
            ],
            acts: [
              { code: 'set [yv] to (10)\nrepeat (3)\n  change [yv] by (-1)', ask: 'What is yv after the loop?', options: ['7', '10', '13'], answer: 0, why: '10 − 3.' },
              { mcq: 'Why use a velocity variable instead of fixed steps?', options: ['Movement can speed up and slow down smoothly', 'It’s required', 'It uses less memory'], answer: 0, why: 'Acceleration.' },
              { phase: 'probe', mcq: 'Your player falls through the floor. A likely fix?', options: ['When touching the ground colour, set yv to 0 and move up out of the ground', 'Increase gravity', 'Delete the floor'], answer: 0, why: 'Collision response.' },
              { phase: 'probe', write: 'Explain in your own words how jumping with gravity works in Scratch.', keywords: ['yv', 'gravity', 'jump', 'ground'], exemplar: 'When I press jump on the ground, yv becomes 12. Every frame gravity lowers yv by 1, so I rise slower, stop, then fall faster until I touch the ground and yv resets to 0.', minWords: 25 },
            ],
            teach: {
              explain: 'Physics simulation basics: velocity and acceleration per frame.', analogy: 'Throwing a ball up — it slows, stops, falls.',
              vocab: [['velocity', 'Speed with direction.'], ['acceleration', 'Change in velocity.'], ['frame', 'One loop step.']],
              demo: 'Build a platformer jump.',
              prompts: [['Why reduce yv?', 'Gravity.'], ['When can jump?', 'On ground.']],
              support: 'Starter project.', stretch: 'Add friction to x movement.',
              mis: [['Gravity is built in', 'You simulate it.']],
              sheet: 'Velocity trace table.',
            },
          },
          {
            t: 'Clones and enemies', o: 'Use clones to create many enemies or items efficiently.', min: 35,
            hook: ['code', 'forever\n  create clone of [myself]\n  wait (1) seconds', 'A new enemy every second'],
            cards: [
              ['👯', 'Clones', 'A clone is a copy of a sprite created while the project runs.'],
              ['🎬', 'When I start as a clone', 'Code that each clone runs.'],
              ['🗑️', 'Delete this clone', 'Remove clones when they leave the screen to keep things fast.'],
            ],
            acts: [
              { order: 'Order a falling-enemy clone setup', steps: ['Hide the original sprite', 'Create a clone every second', 'When I start as a clone: go to a random x at the top and show', 'Move down until reaching the bottom', 'Delete this clone'], why: 'Spawn, move, clean up.' },
              { mcq: 'Why delete clones at the bottom?', options: ['Too many clones slow the project (Scratch has a limit)', 'They look ugly', 'It’s a rule of maths'], answer: 0, why: 'Performance and clone limit.' },
              { phase: 'probe', mcq: 'Every clone appears at the same spot. What’s missing?', options: ['A random position in “when I start as a clone”', 'More costumes', 'A broadcast'], answer: 0, why: 'Randomise per clone.' },
              { phase: 'probe', write: 'Describe how clones would help in a game you design.', keywords: ['clone', 'create', 'delete', 'random'], exemplar: 'Asteroids: the asteroid sprite creates a clone every 0.8 seconds at a random x; each clone falls and is deleted at the bottom or when hit by a laser.', minWords: 20 },
            ],
            teach: {
              explain: 'Runtime instantiation; clone lifecycle.', analogy: 'A cookie cutter makes many cookies from one shape.',
              vocab: [['clone', 'Runtime copy of a sprite.'], ['spawn', 'Create in the game.'], ['lifecycle', 'Create → run → delete.']],
              demo: 'Rain of falling objects with clones.',
              prompts: [['Why hide original?', 'Only clones visible.'], ['Clone limit?', 'Scratch caps clones (300).']],
              support: 'Clone template.', stretch: 'Clone-specific variables (“for this sprite only”).',
              mis: [['Clones share all variable values', '“For this sprite only” variables are per clone.']],
              sheet: 'Clone lifecycle diagram.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Scratch', band: '6-8', level: 'Intermediate', title: 'Lists, Custom Blocks and Simulations',
    description: 'Use lists, custom blocks (procedures) with inputs, and build simulations and quiz apps.',
    intro: 'Level up: data and reusable code. 🧩', theme: 'meadow', tutor: scratchy, tools: stools,
    style: 'Problem-based projects, decomposition, code review.',
    outcomes: ['Stores data in lists', 'Writes custom blocks with inputs', 'Builds a quiz app', 'Builds a simple simulation'],
    modules: [
      {
        title: 'Module 1: Data and procedures',
        lessons: [
          {
            t: 'Lists', o: 'Create and use lists to store many values.', min: 35,
            hook: ['code', 'add [apple] to [fruits]\nadd [mango] to [fruits]\nsay (item (2) of [fruits])', 'mango'],
            cards: [
              ['📋', 'Lists', 'A list stores many items in order.'],
              ['🔢', 'Items and length', 'item (1) of list is the first item; length tells how many.'],
              ['🔁', 'Loop through', 'Use a counter variable to visit each item.'],
            ],
            acts: [
              { code: 'delete all of [nums]\nadd (4) to [nums]\nadd (9) to [nums]\nadd (2) to [nums]\nsay (length of [nums])', ask: 'What is said?', options: ['3', '9', '15'], answer: 0, why: 'Three items.' },
              { code: 'say (item (1) of [nums])', ask: 'Using the list above (4, 9, 2), what is said?', options: ['4', '9', '2'], answer: 0, why: 'Scratch lists start at item 1.' },
              { phase: 'probe', code: 'set [i] to (1)\nset [sum] to (0)\nrepeat (length of [nums])\n  change [sum] by (item (i) of [nums])\n  change [i] by (1)', ask: 'For nums = 4, 9, 2 what is sum?', options: ['15', '13', '3'], answer: 0, why: '4 + 9 + 2.' },
              { phase: 'probe', write: 'Describe a project where a list would be useful.', keywords: ['list', 'store', 'items'], exemplar: 'A spelling game storing 20 words in a list and picking a random item each round.', minWords: 12 },
            ],
            teach: {
              explain: 'Lists/arrays, 1-based indexing in Scratch, traversal.', analogy: 'A list is a numbered shopping list.',
              vocab: [['list', 'Ordered collection.'], ['index', 'Position number.'], ['traverse', 'Visit each item.']],
              demo: 'High-score list.',
              prompts: [['First index in Scratch?', '1.'], ['How loop through?', 'Counter + length.']],
              support: 'Trace tables.', stretch: 'Find the maximum in a list.',
              mis: [['Lists start at 0 in Scratch', 'Scratch starts at 1 (many text languages start at 0).']],
              sheet: 'List trace worksheet.',
            },
          },
          {
            t: 'Custom blocks', o: 'Create custom blocks with inputs to avoid repeated code.', min: 35,
            hook: ['code', 'define draw square (size)\n  repeat (4)\n    move (size) steps\n    turn ↻ (90) degrees', 'Squares of any size'],
            cards: [
              ['🧱', 'My Blocks', 'Make your own block to group code you reuse.'],
              ['🔢', 'Inputs', 'Inputs (parameters) let the block work with different values.'],
              ['🧹', 'Cleaner code', 'Custom blocks make scripts shorter and easier to fix.'],
            ],
            acts: [
              { code: 'define draw shape (sides) (len)\n  repeat (sides)\n    move (len) steps\n    turn ↻ (360 / sides) degrees\n\ndraw shape (5) (40)', ask: 'What is drawn?', options: ['A pentagon with sides 40', 'A square', 'A line'], answer: 0, why: '5 sides, length 40.' },
              { mcq: 'Why use a custom block instead of copying code?', options: ['Fix or change it in one place', 'It runs slower', 'It hides code'], answer: 0, why: 'Reuse and maintainability.' },
              { phase: 'probe', mcq: '“Run without screen refresh” on a custom block is useful for…', options: ['Running drawing code instantly in one frame', 'Making it slower', 'Hiding sprites'], answer: 0, why: 'Speeds up computation.' },
              { phase: 'probe', write: 'Design a custom block for your project: name, inputs and what it does.', keywords: ['define', 'input', 'block'], exemplar: '“jump (height)” — sets yv to height so different characters can jump different amounts.', minWords: 12 },
            ],
            teach: {
              explain: 'Procedures, parameters, abstraction.', analogy: 'A custom block is a recipe card you can reuse with different amounts.',
              vocab: [['procedure', 'Named reusable code.'], ['parameter', 'Input to a procedure.'], ['abstraction', 'Hiding details behind a name.']],
              demo: 'Refactor duplicated code into a custom block.',
              prompts: [['What changes between uses?', 'Inputs.'], ['Benefit?', 'One place to fix.']],
              support: 'Template block.', stretch: 'Recursive drawing (tree).',
              mis: [['Custom blocks are only for drawing', 'Any reusable logic.']],
              sheet: 'Refactoring exercise.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Apps and simulations',
        lessons: [
          {
            t: 'Build a quiz app', o: 'Use lists to build a quiz with questions, answers and scoring.', min: 40,
            hook: ['code', 'ask (item (q) of [questions]) and wait\nif <(answer) = (item (q) of [answers])> then\n  change [score] by (1)', 'Correct!'],
            cards: [
              ['❓', 'Parallel lists', 'Question 1 matches answer 1, and so on.'],
              ['🔁', 'Loop', 'Repeat for each question; increase q by 1.'],
              ['🏆', 'Feedback', 'Show the score and percentage at the end.'],
            ],
            acts: [
              { order: 'Order the quiz program', steps: ['Set score to 0 and q to 1', 'Ask item q of questions', 'Compare answer with item q of answers', 'Update score and q', 'Repeat until all questions are asked, then show score'], why: 'Initialise, loop, compare, report.' },
              { mcq: '8 questions, score 6. Percentage?', options: ['75%', '60%', '80%'], answer: 0, why: '6/8 = 0.75.' },
              { phase: 'probe', mcq: 'Questions and answers lists have different lengths. What happens?', options: ['Answers get mismatched — keep lists aligned', 'Nothing', 'Quiz is faster'], answer: 0, why: 'Parallel lists must match.' },
              { phase: 'probe', write: 'List 3 improvements to make the quiz better for users.', keywords: ['feedback', 'random', 'timer', 'hint'], exemplar: 'Shuffle question order, show the correct answer after mistakes, and add a 10-second timer per question.', minWords: 15 },
            ],
            teach: {
              explain: 'Data-driven program design.', analogy: 'Two lists side by side like a question bank and answer key.',
              vocab: [['parallel lists', 'Lists whose items correspond by index.'], ['data-driven', 'Behaviour comes from data.']],
              demo: 'Build a 5-question quiz.',
              prompts: [['How add a question?', 'Add to both lists.'], ['Case?', 'Scratch = ignores case.']],
              support: 'Quiz template.', stretch: 'Load questions from a list import (text file).',
              mis: [['Hard-coding each question is easier', 'Lists scale better.']],
              sheet: 'Quiz design sheet.',
            },
          },
          {
            t: 'Simulations', o: 'Model a real-world system with simple rules (e.g. population or spread).', min: 40,
            hook: ['pattern', ['10', '20', '40', '80'], '160'],
            cards: [
              ['🌍', 'Models', 'A simulation uses simple rules to imitate a real system.'],
              ['📈', 'Rules and variables', 'E.g. each step, each rabbit has a chance to have babies; foxes eat rabbits.'],
              ['⚠️', 'Limits', 'Models simplify reality — results are estimates, not certainties.'],
            ],
            acts: [
              { code: 'set [pop] to (10)\nrepeat (3)\n  set [pop] to ((pop) * (2))', ask: 'Population after 3 steps?', options: ['80', '60', '30'], answer: 0, why: '10 → 20 → 40 → 80.' },
              { mcq: 'A simulation of disease spread assumes everyone meets everyone. What is a limitation?', options: ['Real people only meet some others', 'It is too accurate', 'No limitations'], answer: 0, why: 'Simplifying assumptions.' },
              { phase: 'probe', mcq: 'Adding randomness to a simulation helps…', options: ['Represent uncertainty in real life', 'Make it always the same', 'Remove variables'], answer: 0, why: 'Stochastic models.' },
              { phase: 'probe', write: 'Describe a simulation you could build: system, variables, rules and one limitation.', keywords: ['variable', 'rule', 'limitation'], exemplar: 'Traffic at a crossing: variables cars and light colour; rule: cars stop on red, move on green; limitation: ignores pedestrians and accidents.', minWords: 25 },
            ],
            teach: {
              explain: 'Modelling, assumptions, emergent behaviour.', analogy: 'A simulation is a mini-world you control to ask “what if?”',
              vocab: [['simulation', 'Model that imitates a system.'], ['assumption', 'Simplifying belief.'], ['variable', 'Changing quantity.']],
              demo: 'Predator–prey with clones.',
              prompts: [['What did you simplify?', 'Assumptions.'], ['Can results be trusted?', 'As estimates.']],
              support: 'Starter simulation.', stretch: 'Graph results with the pen.',
              mis: [['Simulations predict the future exactly', 'They estimate under assumptions.']],
              sheet: 'Simulation design sheet.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Scratch', band: '6-8', level: 'Advanced', title: 'Algorithms, Extensions and Bridging to Text Code',
    description: 'Implement search and sort algorithms, use extensions (pen, text-to-speech, video sensing), and translate Scratch to Python-style pseudocode.',
    intro: 'Think like a computer scientist. 🧠', theme: 'meadow', tutor: scratchy, tools: stools,
    style: 'Algorithm tracing, unplugged demos, translation exercises.',
    outcomes: ['Implements linear search and bubble sort', 'Uses Scratch extensions', 'Translates Scratch to pseudocode', 'Plans a capstone project'],
    modules: [
      {
        title: 'Module 1: Algorithms',
        lessons: [
          {
            t: 'Searching', o: 'Implement linear search and compare with binary search.', min: 35,
            hook: ['word', 'Find it!', 'linear vs binary search'],
            cards: [
              ['🔎', 'Linear search', 'Check each item in order until you find the target.'],
              ['✂️', 'Binary search', 'In a sorted list, check the middle and discard half each time.'],
              ['⏱️', 'Efficiency', 'Binary search needs far fewer checks on large sorted lists.'],
            ],
            acts: [
              { mcq: 'Linear search for 9 in [4, 7, 9, 12]: how many checks?', options: ['3', '1', '4'], answer: 0, why: '4, 7, 9.' },
              { mcq: 'Binary search requires the list to be…', options: ['Sorted', 'Short', 'Random'], answer: 0, why: 'Halving relies on order.' },
              { phase: 'probe', mcq: 'Worst case checks to find an item in a sorted list of 1,024 with binary search?', options: ['About 10–11', '1,024', '512'], answer: 0, why: '2¹⁰ = 1,024.' },
              { phase: 'probe', write: 'Explain binary search using a dictionary or guessing game.', keywords: ['middle', 'half', 'sorted'], exemplar: 'Guessing 1–100: guess 50; if told “higher”, guess 75; each guess halves the possibilities, so you find it in at most 7 guesses.', minWords: 20 },
            ],
            teach: {
              explain: 'Search algorithms, complexity intuition.', analogy: 'Finding a name in a phone book by opening the middle.',
              vocab: [['algorithm', 'Step-by-step method.'], ['linear search', 'Check one by one.'], ['binary search', 'Halve a sorted list.']],
              demo: 'Unplugged: number cards face down.',
              prompts: [['Why binary faster?', 'Halves each time.'], ['Downside?', 'Needs sorted data.']],
              support: 'Card game.', stretch: 'Implement binary search in Scratch.',
              mis: [['Binary search works on any list', 'Only sorted lists.']],
              sheet: 'Search tracing worksheet.',
            },
          },
          {
            t: 'Sorting', o: 'Implement bubble sort and trace it.', min: 40,
            hook: ['pattern', ['5 3 8 1', '3 5 1 8', '3 1 5 8'], '1 3 5 8'],
            cards: [
              ['🫧', 'Bubble sort', 'Compare neighbours; swap if out of order; repeat passes until sorted.'],
              ['🔁', 'Passes', 'After each pass, the largest unsorted item “bubbles” to the end.'],
              ['🐢', 'Simple but slow', 'Fine for small lists; better algorithms exist for big ones.'],
            ],
            acts: [
              { mcq: 'One pass of bubble sort on [4, 2, 3] gives…', options: ['[2, 3, 4]', '[4, 3, 2]', '[2, 4, 3]'], answer: 0, why: '4↔2 → [2,4,3]; 4↔3 → [2,3,4].' },
              { order: 'Order the bubble sort steps for one pass', steps: ['Start at the first pair', 'Compare the two items', 'Swap if the left is bigger', 'Move to the next pair', 'Repeat until the end of the list'], why: 'Pairwise comparisons.' },
              { phase: 'probe', mcq: 'How can bubble sort stop early?', options: ['If a pass makes no swaps, the list is sorted', 'After one pass always', 'Never'], answer: 0, why: 'Early exit optimisation.' },
              { phase: 'probe', write: 'Trace bubble sort on [6, 1, 4] pass by pass.', keywords: ['swap', 'pass'], exemplar: 'Pass 1: 6↔1 → [1,6,4]; 6↔4 → [1,4,6]. Pass 2: no swaps → sorted.', minWords: 15 },
            ],
            teach: {
              explain: 'Sorting algorithm mechanics and efficiency.', analogy: 'Heavier bubbles rise to the top of a glass.',
              vocab: [['swap', 'Exchange positions.'], ['pass', 'One sweep through the list.']],
              demo: 'Students line up by height and bubble sort themselves.',
              prompts: [['How many passes worst case?', 'n − 1.'], ['Faster sorts?', 'Merge, quick (mention).']],
              support: 'Card sorting.', stretch: 'Count comparisons for different lists.',
              mis: [['One pass sorts the list', 'Usually several passes needed.']],
              sheet: 'Bubble sort trace table.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Extensions and text code',
        lessons: [
          {
            t: 'Extensions: pen, speech and video', o: 'Use Scratch extensions to add drawing, speech and camera interaction.', min: 35,
            hook: ['code', 'pen down\nrepeat (36)\n  move (10) steps\n  turn ↻ (10) degrees', 'Draws a circle'],
            cards: [
              ['🖊️', 'Pen', 'Draw lines and patterns as sprites move.'],
              ['🗣️', 'Text to Speech', 'Make sprites speak typed text aloud.'],
              ['📷', 'Video Sensing', 'React to movement seen by the webcam (with permission).'],
            ],
            acts: [
              { code: 'pen down\nrepeat (36)\n  move (10) steps\n  turn ↻ (10) degrees', ask: 'What shape is drawn?', options: ['An approximate circle', 'A square', 'A triangle'], answer: 0, why: '36 × 10° = 360° with small steps.' },
              { match: 'Match the extension to a project idea', pairs: [['Pen', 'Spirograph art generator'], ['Text to Speech', 'Talking storybook'], ['Video Sensing', 'Pop bubbles by waving your hand'], ['Music', 'Drum machine']], why: 'Extensions unlock new projects.' },
              { phase: 'probe', mcq: 'Before using video sensing in class, what should you do?', options: ['Get permission and explain the camera isn’t recording', 'Turn it on secretly', 'Share videos online'], answer: 0, why: 'Privacy and consent.' },
              { phase: 'probe', write: 'Plan a project that uses one extension.', keywords: ['extension', 'pen', 'speech', 'video'], exemplar: 'A geometry art tool using the pen: users choose sides and size, and a custom block draws rotating polygons.', minWords: 15 },
            ],
            teach: {
              explain: 'Extensions; privacy considerations for camera use.', analogy: 'Extensions are add-on tools in a toolbox.',
              vocab: [['extension', 'Extra blocks you add.'], ['pen down', 'Start drawing.']],
              demo: 'Spirograph with pen.',
              prompts: [['How draw a circle?', 'Many small steps and turns.'], ['Camera consent?', 'Always ask.']],
              support: 'Starter code.', stretch: 'Combine two extensions.',
              mis: [['Video sensing records you', 'It senses motion; still ask permission.']],
              sheet: 'Extension project planner.',
            },
          },
          {
            t: 'From Scratch to Python', o: 'Translate Scratch scripts into Python-style pseudocode.', min: 40,
            hook: ['code', 'for i in range(4):\n    forward(100)\n    right(90)', 'Same square in Python!'],
            cards: [
              ['🔁', 'repeat → for', '“repeat (4)” becomes “for i in range(4):”.'],
              ['❓', 'if → if', '“if <> then … else …” becomes “if …: … else: …”.'],
              ['📦', 'variables', '“set [score] to 0” becomes “score = 0”.'],
            ],
            acts: [
              { match: 'Match Scratch to Python', pairs: [['set [score] to (0)', 'score = 0'], ['change [score] by (1)', 'score = score + 1'], ['repeat (10)', 'for i in range(10):'], ['say [Hi]', 'print("Hi")']], why: 'Same ideas, different syntax.' },
              { code: 'score = 0\nfor i in range(3):\n    score = score + 2\nprint(score)', ask: 'What is printed?', options: ['6', '3', '2'], answer: 0, why: '0 + 2 + 2 + 2.', lang: 'python' },
              { phase: 'probe', code: 'x = 7\nif x > 5:\n    print("big")\nelse:\n    print("small")', ask: 'What is printed?', options: ['big', 'small', '7'], answer: 0, why: '7 > 5.', lang: 'python' },
              { phase: 'probe', write: 'Translate this Scratch idea to Python: “repeat 5: say Hello”.', keywords: ['for', 'range', 'print'], exemplar: 'for i in range(5):\n    print("Hello")', minWords: 4 },
            ],
            teach: {
              explain: 'Mapping visual constructs to text syntax; indentation.', analogy: 'Same story told in a different language.',
              vocab: [['syntax', 'Rules for writing code.'], ['indentation', 'Spaces that group code in Python.'], ['print', 'Show output.']],
              demo: 'Side-by-side Scratch and Python.',
              prompts: [['What replaces C-shaped blocks?', 'Indentation.'], ['Why text code?', 'More power and flexibility.']],
              support: 'Translation table.', stretch: 'Run code in an online Python editor.',
              mis: [['Python is a different kind of thinking', 'Same concepts, new syntax.']],
              sheet: 'Scratch-to-Python translation sheet.',
            },
          },
        ],
      },
    ],
  },
];
