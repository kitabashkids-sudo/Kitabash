// Demo course content (original material written for Kitabash).
import type { TeacherContent, LearnCard, VisualHook } from '../lessonTypes.ts';

export const CATALOGUE: { name: string; icon: string; description: string; subjects: string[] }[] = [
  { name: 'Language & Communication', icon: 'chat', description: 'Read, write, speak and present with confidence.', subjects: ['Handwriting & Penmanship', 'Spoken English', 'English Grammar & Vocabulary', 'Reading Comprehension', 'Creative Writing', 'Storytelling', 'Public Speaking', 'Debate & Communication', 'Presentation Skills'] },
  { name: 'Academic Learning', icon: 'book', description: 'Core school subjects and thinking skills.', subjects: ['Mathematics', 'Science', 'English', 'Environmental Studies', 'Logical Reasoning', 'Critical Thinking', 'Olympiad Preparation', 'Problem Solving', 'Homework & Revision Support'] },
  { name: 'School Board Curriculum', icon: 'school', description: 'Courses designed to support CBSE, ICSE and Cambridge pathways. Alignment is claimed only after an admin verifies the mapping.', subjects: ['CBSE', 'ICSE / CISCE', 'Cambridge IGCSE'] },
  { name: 'Life & Financial Skills', icon: 'coin', description: 'Money, decisions and independent learning.', subjects: ['Financial Literacy', 'Saving & Budgeting', 'Needs vs Wants', 'Money Management', 'Financial Decision-Making', 'Entrepreneurship', 'Digital Citizenship', 'Study Skills'] },
  { name: 'Coding, AI & Technology', icon: 'code', description: 'Build, create and understand technology.', subjects: ['Scratch Junior', 'Scratch', 'Python', 'MIT App Inventor', 'Micro:bit', 'Web Development', 'Artificial Intelligence', 'Prompt Engineering', 'AI-Assisted Website Creation', 'Robotics', 'Minecraft Education (MakeCode)', 'No-code Automation & AI Agents'] },
];

export const MONEY_GUIDE = `# Money Smart — Teacher Guide (Kitabash original)

## Needs
A need is something we must have to live safely and stay healthy. Food, clean water, a home, clothes for the weather, medicine and school supplies for learning are needs. Needs come first when we plan how to use money.

## Wants
A want is something that is nice to have but we can live without. Toys, video games, sweets, a new phone case and cinema tickets are wants. Wants are not bad! It is fine to enjoy wants after the needs are covered.

## Same thing, different situation
Sometimes the same item can be a need or a want. A raincoat is a need in the monsoon, but a second fancy raincoat is a want. Shoes are a need, but expensive designer shoes are a want. Ask: do I need this to stay safe, healthy or learning?

## Budgets
A budget is a plan for how to use money. First list the money you have. Next pay for needs. Then decide how much to save. Finally choose wants with the money that is left. A good budget never spends more than the money you have.

## Saving
Saving means keeping some money for later. People save for emergencies and for bigger goals, like a bicycle. Saving a little every week adds up over time. If you spend all your money today, you have nothing for tomorrow.

## Common misconceptions
Some children think wants are bad. Wants are fine once needs are covered. Some children think that a need must be expensive. Water is cheap but it is a need. Some children think that if you have money you should spend it all. Keeping some money as savings is a smart choice.
`;

export const MATHS_GUIDE = `# Patterns and Sequences — Notes (Kitabash original)

## What is a pattern?
A pattern is something that repeats or changes by a rule. In a number sequence each number is called a term. The rule tells us how to get from one term to the next.

## Growing patterns
In the sequence 2, 4, 6, 8 the rule is add 2. The next term is 10. In the sequence 5, 10, 15, 20 the rule is add 5. Growing patterns get bigger by the same amount each time.

## Shrinking patterns
In the sequence 30, 27, 24, 21 the rule is subtract 3. The next term is 18. Shrinking patterns get smaller each step.

## Multiplying patterns
In the sequence 1, 2, 4, 8, 16 the rule is multiply by 2. These patterns grow faster and faster.

## Explaining the rule
To find a rule, look at the difference between neighbouring terms. If the difference is always the same, the rule is add or subtract that difference. Always check the rule works for every term, not just the first two.
`;

// ── Lesson 1: Needs vs Wants ──────────────────────────────
export const L_NEEDS = {
  title: 'Needs or wants?',
  objective: 'Sort everyday items into needs and wants, and explain why.',
  duration: 25,
  hook: { kind: 'preset', preset: 'word-reveal', params: { word: 'Need or Want?', tagline: 'must have… or nice to have?' }, caption: 'Need or want? Must have… or nice to have?', alt: 'The words "Need or Want?" appear, then a tagline: must have, or nice to have.', objective: 'Sort everyday items into needs and wants', durationMs: 3000 } as VisualHook,
  cards: [
    { emoji: '🏠', title: 'Needs', body: 'A need is something we must have to live safely and stay healthy — like food, clean water, a home and clothes for the weather.' },
    { emoji: '🎮', title: 'Wants', body: 'A want is nice to have, but we can live without it — like toys, sweets or a video game. Wants are not bad! We enjoy them after our needs are covered.' },
    { emoji: '🌧️', title: 'It depends!', body: 'The same thing can change. A raincoat is a need in the monsoon. A second, fancy raincoat is a want. Ask yourself: do I need this to stay safe, healthy or learning?' },
  ] as LearnCard[],
  activities: [
    {
      phase: 'perform', type: 'categorize', title: 'Sort the shopping basket', instructions: 'Drag each card into Needs or Wants. On a phone, tap a card then tap a basket.',
      config: { buckets: [{ id: 'need', label: 'Needs' }, { id: 'want', label: 'Wants' }], items: [
        { id: 'water', text: 'Clean water', emoji: '💧' }, { id: 'game', text: 'Video game', emoji: '🎮' }, { id: 'rice', text: 'Rice and dal', emoji: '🍛' }, { id: 'candy', text: 'Candy floss', emoji: '🍭' },
        { id: 'medicine', text: 'Medicine when ill', emoji: '💊' }, { id: 'sticker', text: 'Sticker pack', emoji: '⭐' }, { id: 'notebook', text: 'School notebook', emoji: '📓' }, { id: 'cinema', text: 'Cinema ticket', emoji: '🎬' }] },
      answer_key: { placement: { water: 'need', game: 'want', rice: 'need', candy: 'want', medicine: 'need', sticker: 'want', notebook: 'need', cinema: 'want' }, explanations: { notebook: 'A notebook helps you learn at school, so it is a need.', medicine: 'Medicine keeps us healthy when we are ill.', cinema: 'Fun, but we can live without it.' }, explanation: 'Brilliant! Needs keep us safe, healthy and learning; wants are extras.' },
      hints: ['Ask: could I stay safe and healthy without this?', 'There are 4 needs and 4 wants.', 'Learning counts too — think about what you need for school.'], points: 16,
    },
    {
      phase: 'perform', type: 'multiple_choice', title: 'Tricky one', instructions: 'Choose the best answer.',
      config: { question: 'Riya has shoes that fit her. She sees glittery new shoes in a shop. For Riya, the new shoes are…', options: [{ id: 'a', text: 'A need — everyone needs shoes' }, { id: 'b', text: 'A want — she already has shoes that fit' }, { id: 'c', text: 'A need — because they are expensive' }] },
      answer_key: { correct: ['b'], explanation: 'Shoes are a need, but Riya already has shoes that fit, so new glittery ones are a want.', feedbackByOption: { a: 'Shoes ARE a need — but does Riya already have shoes that fit?', c: 'Price doesn’t decide! Water is cheap but it’s a need.' } },
      hints: ['Does Riya already have what she needs?'], points: 10,
    },
    {
      phase: 'probe', type: 'multiple_choice', title: 'New situation', instructions: 'Think about what changed.',
      config: { question: 'It is monsoon season and Arjun’s umbrella broke. Is a new umbrella a need or a want for Arjun right now?', options: [{ id: 'a', text: 'Need' }, { id: 'b', text: 'Want' }] },
      answer_key: { correct: ['a'], explanation: 'In the monsoon, with no working umbrella, it keeps him dry and healthy — a need.', feedbackByOption: { b: 'Think about the weather and that his umbrella is broken. Could he stay dry without it?' } },
      hints: ['What is the weather like? Does he have another umbrella?'], points: 10,
    },
    {
      phase: 'probe', type: 'free_response', title: 'Explain your thinking', instructions: 'Write 2–3 sentences. There is no single right answer.',
      config: { prompt: 'Name one thing that could be a need for one person but a want for another. Explain why.', minWords: 12, sentenceStarters: ['For one person…', 'But for someone else…', 'because…'] },
      answer_key: { keywords: ['need', 'want', 'because', 'healthy', 'safe'], exemplar: 'Glasses are a need for someone who cannot see the board, but a want for someone who wants them only for fashion, because the first person needs them to learn.' },
      hints: ['Think of glasses, a phone, or a bicycle.'], points: 10,
    },
  ],
  teacher: {
    teach: {
      explanation: 'Needs are what we must have to be safe, healthy and able to learn. Wants are extras that make life enjoyable. The same item can shift category depending on circumstances (weather, whether you already have one, health).',
      analogies: ['A need is like the foundation of a house; wants are the decorations. Decorations are lovely — but only once the foundation is built.'],
      vocabulary: [{ term: 'need', definition: 'Something we must have to live safely and stay healthy.' }, { term: 'want', definition: 'Something nice to have that we can live without.' }, { term: 'priority', definition: 'What we deal with first.' }],
    },
    show: { items: [{ title: 'Hold up two objects', kind: 'demo', description: 'Hold up a water bottle and a toy. Ask: which could you not live without? Let learners vote with thumbs.' }, { title: '3-second hook', kind: 'hook', description: '“Need or Want?” word reveal — project before the Learn cards.' }] },
    facilitate: {
      prompts: [{ prompt: 'What did you use this morning that you could NOT live without?', expected: 'Water, food, toilet, clothes. Accept and sort on the board.' }, { prompt: 'Is a mobile phone a need or a want?', expected: 'It depends — great debate starter. For a parent who works by phone it may be a need.' }],
      discussion: ['Can a want ever become a need? Give an example.'],
      differentiation: { support: 'Use picture cards for the sort; pair with a buddy; accept oral probe answers.', stretch: 'Invent an item that switches from want to need when the situation changes, and explain the switch.' },
      timing: 'Hook 1 min · Learn 6 min · Perform 10 min · Probe 8 min',
    },
    resources: { items: [{ title: 'Needs & wants picture cards (print)', kind: 'worksheet', body: 'Print 12 item cards (water, rice, medicine, notebook, coat, toy, sweets, cinema, stickers, game, bicycle, phone). Groups sort them on a two-column mat.' }, { title: 'Exit ticket', kind: 'template', body: 'One need I have: ___ . One want I have: ___ . Something that can be both: ___ because ___ .' }] },
    assess: {
      questions: ['Give one need and one want.', 'Why is a cheap thing like water still a need?'],
      rubric: [{ criterion: 'Classification', levels: ['Not yet', '5/8 sorted', '7/8 sorted', 'All sorted + explains edge cases'] }, { criterion: 'Reasoning', levels: ['No reason', 'Restates definition', 'Explains with example', 'Explains how context changes the category'] }],
      misconceptions: [{ misconception: 'Wants are bad / naughty', fix: 'Wants are fine — we plan for them after needs.' }, { misconception: 'Needs are expensive', fix: 'Price doesn’t decide; water is cheap but essential.' }],
    },
    extension: ['Make a “need or want?” quiz with 5 items for your family.'],
  } as TeacherContent,
};

// ── Lesson 2: Make a budget ───────────────────────────────
export const L_BUDGET = {
  title: 'Plan a budget',
  objective: 'Plan a simple budget that covers needs first, stays within the money available and saves some.',
  duration: 30,
  hook: { kind: 'preset', preset: 'budget-change', params: { budget: 500, expense: 120, label: 'Lunch', currency: '₹' }, caption: '₹500 budget — add Lunch ₹120 and watch what is left.', alt: 'A budget bar of 500 rupees shrinks to 380 when a 120-rupee lunch is added.', objective: 'Plan a simple budget', durationMs: 3000 } as VisualHook,
  cards: [
    { emoji: '📝', title: 'A budget is a plan', body: 'A budget is a plan for how to use money. You decide before you spend — not after!' },
    { emoji: '1️⃣', title: 'Needs first', body: 'List the money you have. Pay for needs first. Then decide how much to save.' },
    { emoji: '🐷', title: 'Save a little', body: 'Saving means keeping some money for later — for emergencies or a bigger goal, like a bicycle.' },
    { emoji: '🎈', title: 'Then wants', body: 'Choose wants with what is left. A good budget never spends more than the money you have.' },
  ] as LearnCard[],
  activities: [
    {
      phase: 'perform', type: 'budget_sim', title: 'School trip budget', instructions: 'You have ₹500 for a school trip day. Pick what to buy. Cover your needs, stay in budget, and keep at least ₹100 as savings.',
      config: { scenario: 'School trip to the science museum', budget: 500, currency: '₹', items: [
        { id: 'ticket', name: 'Museum ticket', cost: 150, emoji: '🎟️' }, { id: 'bus', name: 'Bus fare', cost: 60, emoji: '🚌' }, { id: 'lunch', name: 'Lunch', cost: 120, emoji: '🍱' },
        { id: 'water', name: 'Water bottle', cost: 20, emoji: '💧' }, { id: 'robot', name: 'Robot toy from gift shop', cost: 250, emoji: '🤖' }, { id: 'icecream', name: 'Ice cream', cost: 40, emoji: '🍦' }, { id: 'keychain', name: 'Planet keychain', cost: 50, emoji: '🪐' }] },
      answer_key: { required: ['ticket', 'bus', 'lunch', 'water'], minSavings: 100 },
      hints: ['Which items do you need to actually go on the trip and stay healthy?', 'Needs cost ₹350 together. How much is left?', 'With ₹150 left, how much can you spend and still save ₹100?'], points: 15,
    },
    {
      phase: 'perform', type: 'ordering', title: 'Steps of a budget', instructions: 'Put the budget steps in the right order. Use the arrow buttons or drag.',
      config: { prompt: 'How do we make a budget?', items: [{ id: 's3', text: 'Decide how much to save' }, { id: 's1', text: 'List the money you have' }, { id: 's4', text: 'Choose wants with what is left' }, { id: 's2', text: 'Pay for needs' }] },
      answer_key: { order: ['s1', 's2', 's3', 's4'], explanation: 'Money → needs → savings → wants.' },
      hints: ['You can’t plan until you know how much money you have.'], points: 8,
    },
    {
      phase: 'probe', type: 'multiple_choice', title: 'What would happen if…', instructions: 'Predict the result.',
      config: { question: 'Kabir gets ₹200 pocket money every week and spends all of it on snacks every week. His bicycle tyre bursts. What is most likely?', options: [{ id: 'a', text: 'He can fix it straight away with his savings' }, { id: 'b', text: 'He has no money saved to fix it' }, { id: 'c', text: 'Snacks will fix the tyre' }] },
      answer_key: { correct: ['b'], explanation: 'Spending everything leaves nothing for emergencies — that’s why we save a little each week.', feedbackByOption: { a: 'Look again — does Kabir save any money?' } },
      hints: ['How much does Kabir keep each week?'], points: 10,
    },
    {
      phase: 'probe', type: 'free_response', title: 'Your savings goal', instructions: 'Reflect and plan.',
      config: { prompt: 'Think of something you would like to save for. How much would you save each week, and why is that a good plan?', minWords: 15, sentenceStarters: ['I would like to save for…', 'Each week I would save…', 'This is a good plan because…'] },
      answer_key: { keywords: ['save', 'week', 'because', 'budget', 'need'] },
      hints: ['Pick something real, like a book, a bicycle or a gift.'], points: 10,
    },
  ],
  teacher: {
    teach: { explanation: 'A budget is a plan made before spending: money in → needs → savings → wants. The key constraints are: cover needs, never spend more than you have, and keep something for later.', analogies: ['A budget is like packing a school bag: the essentials go in first, then you see how much room is left for extras.'], vocabulary: [{ term: 'budget', definition: 'A plan for how to use money.' }, { term: 'savings', definition: 'Money kept for later.' }, { term: 'overspend', definition: 'Spend more money than you have.' }] },
    show: { items: [{ title: 'Budget bar hook', kind: 'hook', description: 'Shows ₹500 shrinking to ₹380 when lunch is added. Pause and ask: what else must we pay for?' }, { title: 'Live demo', kind: 'demo', description: 'Project the budget simulator and build a deliberately bad basket (robot first). Ask the class to fix it.' }] },
    facilitate: { prompts: [{ prompt: 'Why do we pay for needs first?', expected: 'So we are safe/healthy even if money runs out.' }, { prompt: 'Is it ever OK to buy a want?', expected: 'Yes — after needs and savings.' }], discussion: ['Should the robot toy ever fit in the budget? What would have to change?'], differentiation: { support: 'Give a printed price list with needs highlighted; allow calculator.', stretch: 'Change the budget to ₹400: what is the best plan now?' }, timing: 'Hook 1 · Learn 6 · Perform 15 · Probe 8 min' },
    resources: { items: [{ title: 'My budget planner (print)', kind: 'template', body: 'Money I have: ___ | Needs: ___ | Savings: ___ | Wants: ___ | Left over: ___' }] },
    assess: { questions: ['Which comes first in a budget, needs or wants?', 'What does it mean to overspend?'], rubric: [{ criterion: 'Budget plan', levels: ['Overspends', 'In budget, misses a need', 'In budget, needs covered', 'Needs + savings goal + justified wants'] }], misconceptions: [{ misconception: 'If I have money I should spend it all', fix: 'Saving is part of the plan.' }] },
    extension: ['Plan a budget for a class party of ₹1000 with a group.'],
  } as TeacherContent,
};

// ── Handwriting ───────────────────────────────────────────
function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps = 24): number[][] {
  const out: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push([+(cx + r * Math.cos(t)).toFixed(1), +(cy + r * Math.sin(t)).toFixed(1)]);
  }
  return out;
}
export const GLYPHS = {
  c: [arc(50, 60, 20, -40, -320)],
  a: [arc(48, 60, 19, -15, -375), [[67, 42], [67, 80]]],
};

export const L_HANDWRITING = {
  title: 'Curly letters: c and a',
  objective: 'Form the letters c and a correctly, starting at the right place and moving anticlockwise.',
  duration: 15,
  hook: { kind: 'preset', preset: 'letter-trace', params: { letter: 'a', strokes: GLYPHS.a }, caption: 'Watch the letter a: round anticlockwise, then straight down.', alt: 'An animated pen draws a lowercase a: a circle going anticlockwise from the top right, then a straight line down.', objective: 'Form the letter a', durationMs: 3000 } as VisualHook,
  cards: [
    { emoji: '🌙', title: 'Start at the top right', body: 'Curly letters start near the top right, just like the hands of a clock at 2.' },
    { emoji: '↺', title: 'Go anticlockwise', body: 'Curl round to the left, down and round — the opposite way to a clock.' },
    { emoji: '⬇️', title: 'a needs a tail', body: 'For a, close the circle, then go back up and pull straight down.' },
  ] as LearnCard[],
  activities: [
    { phase: 'perform', type: 'tracing', title: 'Trace c', instructions: 'Start at the green dot and follow the dotted line.', config: { glyph: 'c', guide: GLYPHS.c, tolerance: 10 }, answer_key: { minCoverage: 0.7, minPrecision: 0.55 }, hints: ['Start at the green dot.', 'Curl round like a clock going backwards.'], points: 10 },
    { phase: 'perform', type: 'tracing', title: 'Trace a', instructions: 'Circle first, then the straight line down.', config: { glyph: 'a', guide: GLYPHS.a, tolerance: 10 }, answer_key: { minCoverage: 0.7, minPrecision: 0.55 }, hints: ['Make the round part first.', 'Then pull straight down on the right.'], points: 10 },
    { phase: 'probe', type: 'multiple_choice', title: 'Where do we start?', instructions: 'Pick the best answer.', config: { question: 'Where should you start writing the letter c?', options: [{ id: 'a', text: 'Top right, then curl left' }, { id: 'b', text: 'Bottom left, then go up' }, { id: 'c', text: 'In the middle' }] }, answer_key: { correct: ['a'], explanation: 'Curly letters start top right and go anticlockwise.' }, hints: ['Think of 2 o’clock.'], points: 10 },
  ],
  teacher: {
    teach: { explanation: 'c and a belong to the “curly caterpillar” family: start at 2 o’clock, travel anticlockwise. a closes the circle and adds a downstroke without lifting where possible.', analogies: ['Like drawing a moon that is about to swallow the letter.'], vocabulary: [{ term: 'anticlockwise', definition: 'The opposite direction to a clock’s hands.' }, { term: 'downstroke', definition: 'A straight line pulled downward.' }] },
    show: { items: [{ title: 'Air writing', kind: 'demo', description: 'Model in the air with your back to the class so direction matches theirs.' }] },
    facilitate: { prompts: [{ prompt: 'Where does our pencil start?', expected: 'At the top right / 2 o’clock.' }], discussion: ['Which other letters start like c? (a, d, g, o, q)'], differentiation: { support: 'Hand-over-hand or tracing in sand/rice tray; thicker stylus.', stretch: 'Write the family: c a d g o q.' }, timing: '15 min' },
    resources: { items: [{ title: 'Tracing sheet', kind: 'worksheet', body: 'Print lined paper with dotted c and a ×5 each.' }] },
    assess: { questions: ['Show me where you start the letter c.'], rubric: [{ criterion: 'Formation', levels: ['Wrong start/direction', 'Right direction, wrong start', 'Correct start + direction', 'Correct, consistent size'] }], misconceptions: [{ misconception: 'Starts at the bottom or goes clockwise', fix: 'Model again, saying “start at 2, go round the back”.' }] },
  } as TeacherContent,
};

// ── Spoken English ────────────────────────────────────────
export const L_SPOKEN = {
  title: 'Asking politely',
  objective: 'Use polite request phrases (Could you…, May I…, please, thank you) with clear stress and a friendly tone.',
  duration: 20,
  hook: { kind: 'preset', preset: 'phrase-model', params: { phrase: 'Could you help me, please?', stress: ['help', 'please'] }, caption: '“Could you HELP me, PLEASE?” — stress the important words.', alt: 'The phrase Could you help me please appears word by word; help and please grow bigger to show stress.', objective: 'Use polite requests', durationMs: 3000 } as VisualHook,
  cards: [
    { emoji: '🙏', title: 'Polite starters', body: 'Begin requests with “Could you…?”, “Can I…?” or “May I…?” — they sound friendlier than an order.' },
    { emoji: '🔊', title: 'Stress the key word', body: 'Say the most important word a little louder and longer: “Could you PASS the salt, please?”' },
    { emoji: '😊', title: 'Finish kindly', body: 'Add “please” to ask and “thank you” after. A smile in your voice helps too!' },
  ] as LearnCard[],
  activities: [
    { phase: 'perform', type: 'fill_blank', title: 'Complete the request', instructions: 'Use the word bank.', config: { text: '[[1]] you open the window, [[2]]? … [[3]] you!', wordBank: ['Could', 'please', 'Thank', 'Give'] }, answer_key: { blanks: { '1': ['could', 'can', 'would'], '2': ['please'], '3': ['thank'] }, explanation: '“Could you open the window, please? … Thank you!”' }, hints: ['Which word starts a polite question?'], points: 9 },
    { phase: 'perform', type: 'matching', title: 'Match the situation', instructions: 'Pick the best polite phrase for each situation.', config: { left: [{ id: 'l1', text: 'You want to borrow a pencil' }, { id: 'l2', text: 'You didn’t hear the teacher' }, { id: 'l3', text: 'You need to leave the room' }], right: [{ id: 'r1', text: 'May I go to the washroom, please?' }, { id: 'r2', text: 'Could I borrow your pencil, please?' }, { id: 'r3', text: 'Sorry, could you repeat that, please?' }] }, answer_key: { pairs: { l1: 'r2', l2: 'r3', l3: 'r1' } }, hints: ['Look for the key word: borrow, repeat, go.'], points: 9 },
    { phase: 'perform', type: 'speaking', title: 'Say it aloud', instructions: 'Listen to the model, record yourself, then play it back and tick what you did well.', config: { phrase: 'Could you help me with this question, please?', lang: 'en-IN', tips: ['Stress HELP and PLEASE', 'Let your voice go up at the end of the question'], checklist: ['I said every word clearly', 'I stressed “help” and “please”', 'My voice went up at the end', 'I sounded friendly'] }, answer_key: {}, hints: ['Try saying it slowly first, then at normal speed.'], points: 8 },
    { phase: 'probe', type: 'free_response', title: 'Fix the request', instructions: 'Make it polite.', config: { prompt: '“Give me your book.” — rewrite this as a polite request, and explain what you changed.', minWords: 10, sentenceStarters: ['Could you…', 'I changed…'] }, answer_key: { keywords: ['could', 'please', 'may', 'thank'] }, hints: ['Start with Could or May, end with please.'], points: 10 },
  ],
  teacher: {
    teach: { explanation: 'Modal verbs (could, can, may) soften requests; “please” and rising intonation on yes/no questions signal politeness. Sentence stress highlights meaning words.', analogies: ['A polite phrase is like knocking before entering.'], vocabulary: [{ term: 'request', definition: 'Asking someone to do something.' }, { term: 'stress', definition: 'Saying a word louder and longer.' }] },
    show: { items: [{ title: 'Two ways', kind: 'demo', description: 'Say “Give me water.” then “Could I have some water, please?” — ask which one they would rather hear.' }] },
    facilitate: { prompts: [{ prompt: 'How did the second version make you feel?', expected: 'Respected, happier to help.' }], discussion: ['Role-play: shopkeeper and customer in pairs.'], differentiation: { support: 'Phrase strips to read from.', stretch: 'Make a request to an adult vs a friend — what changes?' }, timing: '20 min' },
    resources: { items: [{ title: 'Role-play cards', kind: 'worksheet', body: 'Library, canteen, bus, classroom, shop — one card each with a goal.' }] },
    assess: { questions: ['Turn “Shut the door” into a polite request.'], rubric: [{ criterion: 'Phrase', levels: ['Command', 'Adds please', 'Modal + please', 'Modal + please + appropriate tone'] }], misconceptions: [{ misconception: '“Please” at the start makes anything polite', fix: 'Tone and the modal (could/may) matter too.' }] },
    extension: ['Record a polite phone call request with a partner.'],
  } as TeacherContent,
};
