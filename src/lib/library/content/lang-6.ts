// Language & Communication — Public Speaking (3-5, 6-8, 9-12).
import type { CourseSpec } from '../types.ts';

const ps: [string, string] = ['Vox', 'A supportive public-speaking coach who builds confidence step by step and gives clear, kind feedback on content and delivery.'];
const psTools = ['A timer', 'Optional: device to record practice (recordings stay private)'];
const psNotes = 'Speaking tasks are self-checked against a checklist and can be observed by the teacher. Recordings are optional and stay on the device.';

export const LANG_6: CourseSpec[] = [
  // ───────── 3-5 ─────────
  {
    subject: 'Public Speaking', band: '3-5', level: 'Beginner', title: 'Brave Voices',
    description: 'Build confidence to speak in front of others: calm nerves, stand tall, speak clearly and give a short talk.',
    intro: 'Let your voice be heard! 📣', theme: 'sunrise', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Games, short talks and lots of encouragement.',
    outcomes: ['Uses calming strategies for nerves', 'Stands and speaks clearly', 'Makes eye contact', 'Gives a 1-minute talk'],
    modules: [
      {
        title: 'Module 1: Confidence',
        lessons: [
          {
            t: 'Butterflies are normal', o: 'Use breathing and positive self-talk to calm nerves.', min: 25,
            hook: ['word', 'Breathe in 4 · Hold 4 · Out 4', 'calm breathing'],
            cards: [
              ['🦋', 'Butterflies', 'Feeling nervous before speaking is normal — even for adults.'],
              ['🌬️', 'Box breathing', 'Breathe in for 4, hold for 4, breathe out for 4.'],
              ['💪', 'Positive self-talk', '“I’m ready. I can do this. They want me to do well.”'],
            ],
            acts: [
              { order: 'Order a calm-down routine before speaking', steps: ['Notice the butterflies', 'Breathe in for 4', 'Hold for 4', 'Breathe out for 4', 'Say “I can do this”'], why: 'Routine.' },
              { sort: 'Helpful or unhelpful thought?', buckets: ['Helpful', 'Unhelpful'], items: [['Everyone feels nervous sometimes', 0], ['Everyone will laugh at me', 1], ['I practised and I’m ready', 0], ['I’ll definitely forget everything', 1]], why: 'Self-talk.' },
              { phase: 'probe', mcq: 'Your hands shake before your turn. What helps most?', options: ['Slow breathing and a positive thought', 'Running out of the room', 'Talking super fast to finish'], answer: 0, why: 'Calming.' },
              { phase: 'probe', speak: 'Say three sentences about your favourite animal after doing box breathing.', checklist: ['Did box breathing first', 'Spoke three sentences', 'Felt a bit calmer'], tips: 'It’s okay to feel nervous — speak anyway.' },
            ],
            teach: {
              explain: 'Performance anxiety and coping strategies.', analogy: 'Butterflies mean your body is getting ready, like before a race.',
              vocab: [['nervous', 'Worried feeling.'], ['confidence', 'Believing you can.']],
              demo: 'Lead box breathing.',
              prompts: [['What helps you calm down?', 'Breathing.'], ['Kind thought?', 'I can do this.']],
              support: 'Speak with a buddy.', stretch: 'Lead the class in box breathing.',
              mis: [['Confident people never feel nervous', 'They feel it and speak anyway.']],
              sheet: 'My calm-down card.',
            },
          },
          {
            t: 'Stand tall, speak clear', o: 'Use good posture, volume and clear speech.', min: 25,
            hook: ['word', 'Feet steady · Head up · Voice to the back wall', 'speaker stance'],
            cards: [
              ['🧍', 'Posture', 'Feet apart, shoulders back, hands relaxed.'],
              ['🔊', 'Volume', 'Speak so the person at the back can hear.'],
              ['🐢', 'Pace', 'Slow down — nerves make us rush.'],
            ],
            acts: [
              { sort: 'Good speaker habit or not?', buckets: ['Good habit', 'Not helpful'], items: [['Standing still with feet apart', 0], ['Looking at the floor', 1], ['Speaking to the back wall', 0], ['Mumbling quickly', 1], ['Pausing between ideas', 0]], why: 'Delivery.' },
              { mcq: 'Where should your voice reach?', options: ['The back of the room', 'Only the front row', 'Your own ears'], answer: 0, why: 'Projection.' },
              { phase: 'probe', mcq: 'You notice you’re talking very fast. What do you do?', options: ['Take a breath and slow down', 'Go even faster', 'Stop forever'], answer: 0, why: 'Pace.' },
              { phase: 'probe', speak: 'Stand tall and say: “Good morning, everyone. My name is ___ and today I’ll tell you about ___.”', checklist: ['Stood tall', 'Loud enough for the back', 'Slow and clear'], tips: 'Imagine your voice is a ball you throw to the back wall.' },
            ],
            teach: {
              explain: 'Posture, projection and pace.', analogy: 'Stand like a tree: rooted feet, tall trunk.',
              vocab: [['posture', 'How you stand.'], ['projection', 'Making your voice carry.']],
              demo: 'Good vs poor stance.',
              prompts: [['Can the back hear?', 'Check.'], ['Pace?', 'Slow down.']],
              support: 'Stand-up buddy.', stretch: 'Speak outdoors.',
              mis: [['Shouting = projecting', 'Use breath, not strain.']],
              sheet: 'Speaker stance poster.',
            },
          },
        ],
      },
      {
        title: 'Module 2: My first talk',
        lessons: [
          {
            t: 'Eye contact and smiling', o: 'Connect with the audience through eye contact and expression.', min: 25,
            hook: ['word', 'Left · Middle · Right', 'eye contact zones'],
            cards: [
              ['👀', 'Look around', 'Look at people on the left, in the middle and on the right.'],
              ['😊', 'Smile', 'A smile makes you and the audience relax.'],
              ['🎯', 'Friendly faces', 'Start by looking at a friendly face.'],
            ],
            acts: [
              { mcq: 'Good eye contact means…', options: ['Looking at different people around the room', 'Staring at one person', 'Looking at the ceiling'], answer: 0, why: 'Inclusive.' },
              { mcq: 'If looking at eyes is hard, you can…', options: ['Look at foreheads or between people', 'Close your eyes', 'Turn around'], answer: 0, why: 'Strategy.' },
              { phase: 'probe', speak: 'Tell a partner about your weekend for 30 seconds with eye contact and a smile.', checklist: ['Looked at the listener', 'Smiled', 'Spoke clearly'], tips: 'Look up at the end of each sentence.' },
              { phase: 'probe', mcq: 'Why smile when you start?', options: ['It relaxes you and the audience', 'It’s a rule', 'To hide words'], answer: 0, why: 'Connection.' },
            ],
            teach: {
              explain: 'Audience connection.', analogy: 'Eye contact is a handshake with your eyes.',
              vocab: [['eye contact', 'Looking at people.'], ['audience', 'Listeners.']],
              demo: 'Eye contact zones game.',
              prompts: [['Who did you look at?', 'Zones.'], ['Friendly face?', 'Start there.']],
              support: 'Zone markers on walls.', stretch: 'Look at each table once.',
              mis: [['Looking at notes the whole time is fine', 'Look up often.']],
              sheet: 'Eye contact zones card.',
            },
          },
          {
            t: 'My 1-minute talk', o: 'Plan and give a 1-minute talk with a beginning, middle and end.', min: 30,
            hook: ['word', 'Hello · 3 ideas · Thank you', '1-minute talk'],
            cards: [
              ['👋', 'Beginning', 'Greet and say your topic.'],
              ['3️⃣', 'Middle', 'Three things about your topic.'],
              ['🙏', 'End', 'Finish with a strong sentence and “Thank you”.'],
            ],
            acts: [
              { order: 'Order your talk', steps: ['Good morning, everyone.', 'Today I’ll talk about my pet dog, Bruno.', 'First, he loves mangoes.', 'Second, he can open doors.', 'Third, he guards our home.', 'Bruno is my best friend. Thank you!'], why: 'Structure.' },
              { mcq: 'Best ending?', options: ['That’s why Bruno is my best friend. Thank you!', 'Um, that’s it.', 'Bye.'], answer: 0, why: 'Strong close.' },
              { phase: 'probe', speak: 'Give your 1-minute talk on a topic you love.', checklist: ['Greeting and topic', 'Three ideas', 'Strong ending', 'Stood tall', 'Eye contact'], tips: 'Write three key words on a small card.' },
              { phase: 'probe', write: 'Write your talk plan: topic and three ideas.', keywords: ['first', 'second', 'third'], exemplar: 'Topic: cricket. First: how I learned to bowl. Second: my favourite player. Third: our street matches on Sundays.', minWords: 15 },
            ],
            teach: {
              explain: 'Basic speech structure.', analogy: 'A talk is a sandwich: hello, filling, thank you.',
              vocab: [['topic', 'What the talk is about.'], ['key words', 'Short notes.']],
              demo: 'Teacher models a 1-minute talk.',
              prompts: [['How start?', 'Greet + topic.'], ['How end?', 'Strong + thanks.']],
              support: 'Talk frame.', stretch: 'Add a question to the audience.',
              mis: [['Read your talk word for word', 'Use key words.']],
              sheet: '1-minute talk planner.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Public Speaking', band: '3-5', level: 'Intermediate', title: 'Speeches with Structure',
    description: 'Write and deliver structured speeches: hooks, signposting, examples and memorable endings.',
    intro: 'Build speeches people remember! 🏗️', theme: 'sunrise', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Planning frames, practice and peer feedback.',
    outcomes: ['Opens with a hook', 'Uses signposting', 'Supports points with examples', 'Ends memorably'],
    prereq: ['Brave Voices'],
    modules: [
      {
        title: 'Module 1: Openings and middles',
        lessons: [
          {
            t: 'Hooks that grab attention', o: 'Open a speech with a question, fact, story or quote.', min: 25,
            hook: ['upgrade', 'Hello, my speech is about trees.', 'Did you know one tree can give enough oxygen for two people every day?'],
            cards: [
              ['❓', 'Question', '“Have you ever…?”'],
              ['📊', 'Surprising fact', '“An elephant can smell water from kilometres away.”'],
              ['📖', 'Mini story', '“Last summer, I found a baby bird…”'],
            ],
            acts: [
              { sort: 'Which hook type?', buckets: ['Question', 'Fact', 'Story'], items: [['Have you ever been really lost?', 0], ['Honeybees visit millions of flowers to make one jar of honey.', 1], ['Yesterday, my grandmother taught me a secret recipe.', 2], ['What would you do with a superpower?', 0]], why: 'Hook types.' },
              { mcq: 'Which is the weakest opening?', options: ['Um, so, my speech is about water.', 'Imagine a day with no water at all.', 'Every drop counts — and here’s why.'], answer: 0, why: 'No hook.' },
              { phase: 'probe', mcq: 'For a speech on recycling, best hook?', options: ['The plastic bottle you threw away today could still exist in 400 years.', 'Recycling is a thing.', 'Hello.'], answer: 0, why: 'Surprising fact.' },
              { phase: 'probe', speak: 'Say three different hooks for a speech about your school.', checklist: ['A question hook', 'A fact or story hook', 'Confident voice'], tips: 'Pause after your hook.' },
            ],
            teach: {
              explain: 'Speech openings.', analogy: 'A hook is like a fishing hook — it catches attention.',
              vocab: [['hook', 'Attention grabber.'], ['surprising fact', 'Fact people don’t expect.']],
              demo: 'Model three hooks.',
              prompts: [['Which hook works?', 'Why.'], ['Pause?', 'After hook.']],
              support: 'Hook starters.', stretch: 'Quote hook.',
              mis: [['Start with your name and topic only', 'Start with a hook.']],
              sheet: 'Hook planner.',
            },
          },
          {
            t: 'Signposting and examples', o: 'Guide listeners with signposts and support points with examples.', min: 25,
            hook: ['word', 'Firstly · Secondly · Finally · For example', 'signposts'],
            cards: [
              ['🪧', 'Signposts', 'Words that tell the audience where you are in the speech.'],
              ['📌', 'Point + example', 'Each point needs an example or reason.'],
              ['🔁', 'Preview', '“Today I’ll share three reasons…”'],
            ],
            acts: [
              { blanks: '[[1]], trees give us oxygen. [[2]], they give shade on hot days. [[3]], they are home to birds.', answers: [['Firstly', 'First'], ['Secondly', 'Second'], ['Finally', 'Lastly']], bank: ['Firstly', 'Secondly', 'Finally'], why: 'Signposts.' },
              { mcq: 'Which point has a good example?', options: ['Exercise is fun — for example, our class relay race had everyone cheering.', 'Exercise is fun.', 'Exercise.'], answer: 0, why: 'Point + example.' },
              { phase: 'probe', mcq: 'Why preview your points at the start?', options: ['Listeners know what to expect', 'To make it longer', 'No reason'], answer: 0, why: 'Clarity.' },
              { phase: 'probe', write: 'Write the middle of a speech with three signposted points and an example for each.', keywords: ['firstly', 'secondly', 'finally', 'for example'], exemplar: 'Firstly, reading improves vocabulary — for example, I learned “enormous” from a dinosaur book. Secondly…', minWords: 40 },
            ],
            teach: {
              explain: 'Signposting and support.', analogy: 'Signposts are road signs for listeners.',
              vocab: [['signpost', 'Guiding phrase.'], ['example', 'Proof or illustration.']],
              demo: 'Signposted model speech.',
              prompts: [['Where are we?', 'Signpost.'], ['Example?', 'For example…']],
              support: 'Signpost cards.', stretch: 'Transitions between points.',
              mis: [['Points don’t need examples', 'Examples make them convincing.']],
              sheet: 'Speech middle planner.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Endings and delivery',
        lessons: [
          {
            t: 'Memorable endings', o: 'End speeches with a summary and a strong final line.', min: 25,
            hook: ['upgrade', 'So yeah, that’s it.', 'So plant a tree, protect a tree — and the tree will protect you.'],
            cards: [
              ['🔁', 'Summarise', 'Remind the audience of your main points.'],
              ['🎯', 'Final line', 'A call to action, a question, or link back to the hook.'],
              ['🙏', 'Thank', 'Say thank you and pause.'],
            ],
            acts: [
              { order: 'Order a strong ending', steps: ['So, to sum up…', 'Trees give oxygen, shade and homes.', 'Let’s plant one tree for every student this year.', 'Thank you.'], why: 'Ending structure.' },
              { mcq: 'Which final line is most memorable?', options: ['Remember: small hands can plant big forests.', 'That’s all I have to say.', 'Okay bye.'], answer: 0, why: 'Memorable.' },
              { phase: 'probe', mcq: 'Linking your ending back to your hook is called…', options: ['Bookending / full circle', 'Rushing', 'Skipping'], answer: 0, why: 'Technique.' },
              { phase: 'probe', write: 'Write an ending for a speech about kindness.', keywords: ['so', 'remember', 'kind', 'thank you'], exemplar: 'So remember: a kind word costs nothing but can change someone’s whole day. Let’s start today. Thank you.', minWords: 15 },
            ],
            teach: {
              explain: 'Conclusions and calls to action.', analogy: 'The ending is the last taste — make it sweet.',
              vocab: [['conclusion', 'Ending.'], ['call to action', 'Asking the audience to do something.']],
              demo: 'Compare endings.',
              prompts: [['Summary?', 'Main points.'], ['Final line?', 'Memorable.']],
              support: 'Ending frames.', stretch: 'Full-circle ending.',
              mis: [['Endings just stop', 'Endings land the message.']],
              sheet: 'Ending planner.',
            },
          },
          {
            t: 'Deliver a structured speech', o: 'Deliver a 2-minute structured speech using cue cards.', min: 30,
            hook: ['word', 'Hook → 3 points → Ending', 'speech map'],
            cards: [
              ['🗂️', 'Cue cards', 'Key words only, big writing, numbered cards.'],
              ['🔁', 'Practise', 'Practise three times, once in front of someone.'],
              ['⏱️', 'Timing', 'About 250 words for 2 minutes.'],
            ],
            acts: [
              { mcq: 'What goes on cue cards?', options: ['Key words and short phrases', 'The whole speech', 'Nothing'], answer: 0, why: 'Prompts.' },
              { order: 'Order speech practice', steps: ['Write your plan', 'Make cue cards', 'Practise alone', 'Practise with a timer', 'Practise for a friend and get feedback'], why: 'Rehearsal.' },
              { phase: 'probe', speak: 'Deliver your 2-minute speech on “Something I’d change about my town”.', checklist: ['Hook', 'Three signposted points with examples', 'Memorable ending', 'Eye contact and clear voice', 'About 2 minutes'], tips: 'Glance at cards, then look up.' },
              { phase: 'probe', write: 'Write two stars and a wish about your speech.', keywords: ['star', 'wish', 'next'], exemplar: 'Star: my hook made people laugh. Star: clear signposts. Wish: slow down in the middle.', minWords: 15 },
            ],
            teach: {
              explain: 'Rehearsal and delivery with notes.', analogy: 'Cue cards are stepping stones across a river.',
              vocab: [['cue card', 'Small prompt card.'], ['rehearse', 'Practise.']],
              demo: 'Model cue cards.',
              prompts: [['Card content?', 'Key words.'], ['Time?', '2 minutes.']],
              support: 'Card template.', stretch: 'Speak without cards.',
              mis: [['Cards should have full sentences', 'Key words only.']],
              sheet: 'Cue card template and feedback slip.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Public Speaking', band: '3-5', level: 'Advanced', title: 'Speak Up and Shine',
    description: 'Give persuasive speeches, speak impromptu, use visual aids and compete in a class speaking contest.',
    intro: 'Persuade, inspire and shine! 🌟', theme: 'sunrise', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Persuasive tasks, impromptu games and a class contest.',
    outcomes: ['Writes a persuasive speech', 'Speaks impromptu with a structure', 'Uses a visual aid', 'Competes in a speaking contest'],
    prereq: ['Speeches with Structure'],
    modules: [
      {
        title: 'Module 1: Persuade and improvise',
        lessons: [
          {
            t: 'Persuasive speeches', o: 'Persuade an audience using reasons, examples and emotion.', min: 25,
            hook: ['upgrade', 'We should have longer break.', 'Imagine tired brains finally getting a real rest — a 10-minute longer break could help us all learn better!'],
            cards: [
              ['📢', 'Position', 'Say clearly what you want.'],
              ['🧠', 'Reasons', 'Give three strong reasons with examples.'],
              ['❤️', 'Emotion', 'Help the audience feel why it matters.'],
            ],
            acts: [
              { sort: 'Reason, example or emotion?', buckets: ['Reason', 'Example', 'Emotion'], items: [['Breaks help us focus', 0], ['After PE, our class scored higher in the maths quiz', 1], ['Imagine sitting still for five hours straight…', 2], ['Exercise keeps us healthy', 0]], why: 'Persuasion parts.' },
              { mcq: 'Which is a persuasive phrase?', options: ['Wouldn’t it be amazing if…', 'Um, maybe', 'I don’t know'], answer: 0, why: 'Rhetorical question.' },
              { phase: 'probe', mcq: 'Strongest evidence?', options: ['A survey of our class showed 85% want a library hour', 'My friend said so', 'Everyone knows'], answer: 0, why: 'Data.' },
              { phase: 'probe', speak: 'Give a 1-minute persuasive speech: “Every school should have a pet.”', checklist: ['Clear position', 'Three reasons', 'An example', 'Emotional appeal', 'Call to action'], tips: 'End with what you want the principal to do.' },
            ],
            teach: {
              explain: 'Persuasive speaking basics.', analogy: 'Persuasion is a three-legged stool: reasons, examples, feelings.',
              vocab: [['persuade', 'Convince.'], ['position', 'What you believe.']],
              demo: 'Model persuasive speech.',
              prompts: [['Reasons?', 'Three.'], ['Evidence?', 'Strong.']],
              support: 'Persuasion frame.', stretch: 'Answer an objection.',
              mis: [['Shouting persuades', 'Reasons persuade.']],
              sheet: 'Persuasive speech planner.',
            },
          },
          {
            t: 'Impromptu speaking', o: 'Speak for 1 minute on a surprise topic using a simple frame.', min: 25,
            hook: ['word', 'Point · Reason · Example · Point', 'PREP'],
            cards: [
              ['⚡', 'Impromptu', 'Speaking without preparation.'],
              ['🧱', 'PREP frame', 'Point, Reason, Example, Point again.'],
              ['😮‍💨', 'Pause first', 'Take 3 seconds to think — it’s allowed!'],
            ],
            acts: [
              { order: 'Order a PREP answer to “Should homework be banned?”', steps: ['Point: I think homework should be shorter, not banned.', 'Reason: Some practice helps us remember.', 'Example: Ten minutes of tables helped me in the test.', 'Point: So, short homework is the best idea.'], why: 'PREP.' },
              { mcq: 'First thing to do with a surprise topic?', options: ['Take a breath and choose your point', 'Start talking immediately', 'Say “I don’t know”'], answer: 0, why: 'Composure.' },
              { phase: 'probe', speak: 'Impromptu topic: “The best season of the year.” Use PREP.', checklist: ['Clear point', 'A reason', 'An example', 'Repeated the point'], tips: 'Count to three before you start.' },
              { phase: 'probe', mcq: 'What does the last P in PREP stand for?', options: ['Point (again)', 'Pause', 'Picture'], answer: 0, why: 'Frame.' },
            ],
            teach: {
              explain: 'Impromptu structure.', analogy: 'PREP is a ready-made skeleton for any topic.',
              vocab: [['impromptu', 'Without preparation.'], ['PREP', 'Point, Reason, Example, Point.']],
              demo: 'Hot-seat game.',
              prompts: [['Point?', 'Opinion.'], ['Example?', 'Real.']],
              support: 'PREP card.', stretch: 'Two reasons.',
              mis: [['Impromptu means rambling', 'Use a frame.']],
              sheet: 'Impromptu topic cards.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Visual aids and contest',
        lessons: [
          {
            t: 'Using visual aids', o: 'Use a poster, object or slide to support a talk.', min: 25,
            hook: ['word', 'Show it · Don’t read it', 'visual aids'],
            cards: [
              ['🖼️', 'Big and simple', 'Large pictures, few words.'],
              ['👉', 'Point and talk', 'Show the aid, then face the audience.'],
              ['🙈', 'Hide until needed', 'Reveal it at the right moment.'],
            ],
            acts: [
              { sort: 'Good visual aid or not?', buckets: ['Good', 'Not good'], items: [['A big clear photo', 0], ['A poster with tiny writing', 1], ['A real object to hold up', 0], ['A slide full of paragraphs', 1]], why: 'Visual aid design.' },
              { mcq: 'While showing your poster, you should…', options: ['Face the audience and point', 'Turn your back and read it', 'Hide behind it'], answer: 0, why: 'Delivery.' },
              { phase: 'probe', mcq: 'When should you reveal an object?', options: ['When you talk about it', 'Before you start, the whole time', 'Never'], answer: 0, why: 'Timing.' },
              { phase: 'probe', speak: 'Give a 1-minute talk using one object or picture.', checklist: ['Showed it at the right time', 'Faced the audience', 'Explained it clearly'], tips: 'Hold it still so everyone can see.' },
            ],
            teach: {
              explain: 'Effective visual aids.', analogy: 'Visual aids are helpers, not the star.',
              vocab: [['visual aid', 'Picture or object supporting a talk.'], ['reveal', 'Show at the right moment.']],
              demo: 'Good vs bad poster.',
              prompts: [['Readable from back?', 'Check.'], ['Facing?', 'Audience.']],
              support: 'Poster template.', stretch: 'Simple slides.',
              mis: [['More words on posters help', 'Fewer words help.']],
              sheet: 'Visual aid checklist.',
            },
          },
          {
            t: 'Class speaking contest', o: 'Compete in a speaking contest using a rubric.', min: 30,
            hook: ['word', 'Content · Structure · Delivery · Confidence', 'contest rubric'],
            cards: [
              ['📋', 'Rubric', 'Judges score content, structure, delivery and confidence.'],
              ['⏱️', 'Time', 'Stay within the time limit.'],
              ['👏', 'Sportsmanship', 'Support every speaker.'],
            ],
            acts: [
              { match: 'Match the rubric area to what judges look for', pairs: [['Content', 'Interesting ideas and examples'], ['Structure', 'Hook, points and ending'], ['Delivery', 'Voice, pace and eye contact'], ['Confidence', 'Calm presence and recovery from mistakes']], why: 'Rubric.' },
              { mcq: 'A speaker forgets a line. The best thing to do?', options: ['Pause, glance at the card, and continue', 'Stop and leave', 'Cry'], answer: 0, why: 'Recovery.' },
              { phase: 'probe', speak: 'Deliver your 2-minute contest speech on “A person who inspires me”.', checklist: ['Hook', 'Clear points with examples', 'Memorable ending', 'Strong delivery', 'Within time'], tips: 'Practise in front of family first.' },
              { phase: 'probe', write: 'Score yourself on the rubric (1–4 each) and explain one score.', keywords: ['content', 'structure', 'delivery', 'confidence'], exemplar: 'Content 4, Structure 3, Delivery 3, Confidence 4. My delivery was a 3 because I spoke too fast at the start.', minWords: 20 },
            ],
            teach: {
              explain: 'Assessment criteria and performance.', analogy: 'A contest is a celebration of practice.',
              vocab: [['rubric', 'Scoring guide.'], ['sportsmanship', 'Being a good participant.']],
              demo: 'Model judging with rubric.',
              prompts: [['Criteria?', 'Four.'], ['Recovery?', 'Pause and continue.']],
              support: 'Rubric card.', stretch: 'Be a judge.',
              mis: [['Only the winner learns', 'Everyone grows.']],
              sheet: 'Contest rubric and certificate.',
            },
          },
        ],
      },
    ],
  },
  // ───────── 6-8 ─────────
  {
    subject: 'Public Speaking', band: '6-8', level: 'Beginner', title: 'Foundations of Public Speaking',
    description: 'Master speech structure, audience analysis, vocal delivery and body language for confident speaking.',
    intro: 'Speak with confidence and clarity. 🎙️', theme: 'ocean', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Short speeches, video self-review, peer coaching.',
    outcomes: ['Analyses audience and purpose', 'Structures speeches clearly', 'Uses vocal variety', 'Uses purposeful body language'],
    modules: [
      {
        title: 'Module 1: Plan',
        lessons: [
          {
            t: 'Audience and purpose', o: 'Analyse audience and purpose before planning a speech.', min: 30,
            hook: ['word', 'Who? Why? What do they need?', 'audience analysis'],
            cards: [
              ['👥', 'Audience', 'Age, knowledge, interests and attitudes.'],
              ['🎯', 'Purpose', 'Inform, persuade, entertain or inspire.'],
              ['🔧', 'Adapt', 'Change examples, vocabulary and length to fit.'],
            ],
            acts: [
              { mcq: 'Explaining the water cycle to Class 2 students, you should…', options: ['Use simple words and a fun demonstration', 'Use technical terms only', 'Speak for 30 minutes'], answer: 0, why: 'Adapt to audience.' },
              { sort: 'Purpose?', buckets: ['Inform', 'Persuade', 'Entertain/inspire'], items: [['How to stay safe online', 0], ['Vote for me as class captain', 1], ['My funniest holiday disaster', 2], ['Why we should ban single-use plastic', 1], ['History of our school', 0]], why: 'Purposes.' },
              { phase: 'probe', mcq: 'Your audience already knows the basics. You should…', options: ['Skip basics and go deeper', 'Repeat basics slowly', 'Ignore them'], answer: 0, why: 'Audience knowledge.' },
              { phase: 'probe', write: 'Analyse the audience and purpose for a speech at your school’s annual day.', keywords: ['audience', 'parents', 'purpose', 'adapt'], exemplar: 'Audience: parents, teachers and students of all ages. Purpose: inspire and celebrate. Adapt: short, positive stories everyone understands; avoid inside jokes.', minWords: 20 },
            ],
            teach: {
              explain: 'Audience-centred speaking.', analogy: 'Cooking for guests — know their tastes.',
              vocab: [['audience analysis', 'Understanding listeners.'], ['purpose', 'Goal of the speech.']],
              demo: 'Same topic, three audiences.',
              prompts: [['Who?', 'Profile.'], ['Why?', 'Purpose.']],
              support: 'Audience grid.', stretch: 'Hostile audience planning.',
              mis: [['One speech fits all', 'Adapt to audience.']],
              sheet: 'Audience analysis grid.',
            },
          },
          {
            t: 'Speech structure', o: 'Organise speeches with an introduction, body and conclusion.', min: 30,
            hook: ['word', 'Tell them what you’ll tell them · Tell them · Tell them what you told them', 'classic structure'],
            cards: [
              ['🚪', 'Introduction', 'Hook, topic, preview of main points.'],
              ['🏛️', 'Body', '2–3 main points, each with support and transitions.'],
              ['🏁', 'Conclusion', 'Summary, final message, strong last line.'],
            ],
            acts: [
              { order: 'Order the speech parts', steps: ['Hook', 'Thesis and preview', 'Main point 1 with support', 'Transition', 'Main point 2 with support', 'Summary', 'Memorable close'], why: 'Structure.' },
              { mcq: 'A transition sentence…', options: ['Links one point to the next', 'Ends the speech', 'Is the hook'], answer: 0, why: 'Flow.' },
              { phase: 'probe', mcq: 'How many main points suit a 3-minute speech?', options: ['2–3', '10', '0'], answer: 0, why: 'Manageable.' },
              { phase: 'probe', write: 'Outline a 3-minute speech on “Why every student should learn a musical instrument”.', keywords: ['hook', 'point', 'transition', 'conclusion'], exemplar: 'Hook: “Music is the only language everyone understands.” Preview: discipline, brain power, joy. Point 1… Transition… Conclusion: “Pick up an instrument — your future self will thank you.”', minWords: 40 },
            ],
            teach: {
              explain: 'Classical speech organisation.', analogy: 'A speech is a journey with a map, the trip and a recap.',
              vocab: [['thesis', 'Main message.'], ['transition', 'Bridge between points.']],
              demo: 'Outline a speech together.',
              prompts: [['Preview?', 'Points.'], ['Transitions?', 'Bridges.']],
              support: 'Outline template.', stretch: 'Problem–solution structure.',
              mis: [['More points = better speech', 'Fewer, deeper points.']],
              sheet: 'Speech outline template.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Deliver',
        lessons: [
          {
            t: 'Vocal variety', o: 'Use pace, pitch, volume and pause for impact.', min: 30,
            hook: ['phrase', 'This… changes… everything.', ['changes', 'everything']],
            cards: [
              ['🎚️', 'Pitch', 'Rise and fall to avoid monotone.'],
              ['🐇', 'Pace', 'Slow for key points, quicker for stories.'],
              ['⏸️', 'Pause', 'Silence before and after important lines adds weight.'],
            ],
            acts: [
              { match: 'Match the moment to vocal choice', pairs: [['Key statistic', 'Slow down and pause after'], ['Exciting story', 'Faster, livelier'], ['Serious message', 'Lower pitch, steady pace'], ['Question to audience', 'Rising tone, then pause']], why: 'Vocal variety.' },
              { mcq: 'A monotone voice makes audiences…', options: ['Lose interest', 'Pay more attention', 'Laugh'], answer: 0, why: 'Engagement.' },
              { phase: 'probe', speak: 'Read: “Every year, India loses forests the size of a city. (pause) Every. Single. Year. (pause) But we can change that.”', checklist: ['Paused at marks', 'Slowed for emphasis', 'Changed tone for the final line'], tips: 'Record it and listen back.' },
              { phase: 'probe', mcq: 'Where does a pause have most impact?', options: ['Right after a powerful line', 'In the middle of a word', 'At random'], answer: 0, why: 'Emphasis.' },
            ],
            teach: {
              explain: 'Vocal delivery.', analogy: 'Your voice is an instrument — play all the notes.',
              vocab: [['monotone', 'Flat voice.'], ['emphasis', 'Stress for importance.']],
              demo: 'Monotone vs varied reading.',
              prompts: [['Where pause?', 'After key lines.'], ['Pitch?', 'Vary.']],
              support: 'Marked script.', stretch: 'Mark your own speech.',
              mis: [['Fast speakers seem confident', 'Measured pace seems confident.']],
              sheet: 'Vocal variety marking practice.',
            },
          },
          {
            t: 'Body language and presence', o: 'Use posture, gestures and movement purposefully.', min: 30,
            hook: ['word', 'Plant · Gesture · Move with purpose', 'presence'],
            cards: [
              ['🌳', 'Plant', 'Stand balanced; avoid swaying.'],
              ['🙌', 'Gestures', 'Open, natural gestures that match words.'],
              ['🚶', 'Movement', 'Move only to mark transitions, then plant again.'],
            ],
            acts: [
              { sort: 'Confident or nervous habit?', buckets: ['Confident', 'Nervous habit'], items: [['Open palms when explaining', 0], ['Hands in pockets the whole time', 1], ['Steps forward for the key point', 0], ['Pacing back and forth constantly', 1], ['Balanced stance', 0]], why: 'Body language.' },
              { mcq: 'When should you move on stage?', options: ['At transitions between points', 'Constantly', 'Never at all'], answer: 0, why: 'Purposeful movement.' },
              { phase: 'probe', mcq: 'Crossed arms often signal…', options: ['Defensiveness or nervousness', 'Openness', 'Excitement'], answer: 0, why: 'Non-verbal.' },
              { phase: 'probe', speak: 'Deliver a 2-minute speech using planted stance, two gestures and one purposeful move.', checklist: ['Planted stance', 'Natural gestures', 'Moved at a transition', 'Eye contact'], tips: 'Video yourself and watch without sound.' },
            ],
            teach: {
              explain: 'Non-verbal communication.', analogy: 'Your body speaks before your mouth does.',
              vocab: [['presence', 'Confident stage manner.'], ['gesture', 'Meaningful hand movement.']],
              demo: 'Silent video analysis.',
              prompts: [['Distracting habits?', 'Identify.'], ['Gesture match?', 'Words.']],
              support: 'Habit checklist.', stretch: 'Use the stage space with three positions.',
              mis: [['Stand completely still', 'Natural movement helps.']],
              sheet: 'Body language self-review.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Public Speaking', band: '6-8', level: 'Intermediate', title: 'Speeches for Every Occasion',
    description: 'Write and deliver informative, persuasive, ceremonial and impromptu speeches for school events.',
    intro: 'Be ready to speak at any event. 🎤', theme: 'ocean', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Occasion-based assignments with peer evaluation.',
    outcomes: ['Delivers informative speeches', 'Delivers persuasive speeches with evidence', 'Gives ceremonial speeches (welcome, vote of thanks)', 'Handles impromptu speaking and Q&A'],
    prereq: ['Foundations of Public Speaking'],
    modules: [
      {
        title: 'Module 1: Inform and persuade',
        lessons: [
          {
            t: 'Informative speeches', o: 'Explain a topic clearly using examples, analogies and visuals.', min: 30,
            hook: ['upgrade', 'Volcanoes erupt because of magma and pressure.', 'Think of a shaken soda bottle: pressure builds and builds — then whoosh. That’s a volcano.'],
            cards: [
              ['🧩', 'Chunk', 'Break complex topics into 3 simple parts.'],
              ['🔗', 'Analogies', 'Compare new ideas to familiar things.'],
              ['📊', 'Visuals', 'One clear diagram beats a paragraph.'],
            ],
            acts: [
              { mcq: 'Best analogy for how the heart works?', options: ['A pump pushing water through pipes', 'A pillow', 'A cloud'], answer: 0, why: 'Familiar mechanism.' },
              { order: 'Order an informative speech on digestion', steps: ['Hook: Your sandwich takes a 9-metre journey!', 'Mouth: chewing and saliva', 'Stomach: churning and acids', 'Intestines: absorbing nutrients', 'Conclusion: why fibre and water help'], why: 'Logical sequence.' },
              { phase: 'probe', mcq: 'Informative speeches should avoid…', options: ['Unexplained jargon', 'Examples', 'Clear structure'], answer: 0, why: 'Clarity.' },
              { phase: 'probe', speak: 'Give a 2-minute informative speech explaining something you know well, with one analogy.', checklist: ['Three chunks', 'One analogy', 'Clear explanation', 'Checked understanding'], tips: 'Ask “Does that make sense?” once.' },
            ],
            teach: {
              explain: 'Explanatory speaking.', analogy: 'You’re a tour guide through an idea.',
              vocab: [['analogy', 'Comparison to something familiar.'], ['jargon', 'Specialist words.']],
              demo: 'Model an explainer.',
              prompts: [['Chunks?', 'Three.'], ['Analogy?', 'Familiar.']],
              support: 'Explainer frame.', stretch: 'Explain to younger students.',
              mis: [['Technical words sound smart', 'Clear words teach better.']],
              sheet: 'Informative speech planner.',
            },
          },
          {
            t: 'Persuasive speeches with evidence', o: 'Persuade with evidence and address counter-arguments.', min: 30,
            hook: ['word', 'Claim · Evidence · Counter · Rebuttal', 'persuasion toolkit'],
            cards: [
              ['📢', 'Claim', 'What you want the audience to believe or do.'],
              ['📊', 'Evidence', 'Statistics, expert views, real examples — from reliable sources.'],
              ['🛡️', 'Counter and rebuttal', '“Some say… However…”'],
            ],
            acts: [
              { order: 'Order a persuasive point with rebuttal', steps: ['Claim: School should start at 9 a.m.', 'Evidence: Studies link later starts to better attention in teens.', 'Counter: Some say it disrupts parents’ schedules.', 'Rebuttal: Staggered drop-off and early clubs can solve that.'], why: 'Structure.' },
              { mcq: 'Why address counter-arguments?', options: ['It shows fairness and makes your case stronger', 'To confuse the audience', 'It weakens your speech'], answer: 0, why: 'Credibility.' },
              { phase: 'probe', mcq: 'Which source is most credible?', options: ['A government education report', 'An anonymous social media post', 'A rumour'], answer: 0, why: 'Reliability.' },
              { phase: 'probe', speak: 'Give a 2-minute persuasive speech with one counter-argument and rebuttal.', checklist: ['Clear claim', 'Credible evidence', 'Counter-argument', 'Rebuttal', 'Call to action'], tips: 'Name your source briefly.' },
            ],
            teach: {
              explain: 'Evidence-based persuasion.', analogy: 'Building a case like a lawyer.',
              vocab: [['rebuttal', 'Answer to an objection.'], ['credible', 'Trustworthy.']],
              demo: 'Model rebuttal.',
              prompts: [['Evidence source?', 'Reliable.'], ['Counter?', 'Anticipate.']],
              support: 'Rebuttal frame.', stretch: 'Two counters.',
              mis: [['Ignore the other side', 'Address it.']],
              sheet: 'Persuasive speech planner with rebuttal.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Occasions and impromptu',
        lessons: [
          {
            t: 'Ceremonial speeches', o: 'Deliver welcome speeches, votes of thanks and introductions.', min: 30,
            hook: ['phrase', 'A very warm welcome to our chief guest, our teachers and dear parents…', ['welcome']],
            cards: [
              ['🙏', 'Welcome speech', 'Greet guests in order of honour, set the tone, preview the event.'],
              ['💐', 'Vote of thanks', 'Thank guests, organisers and helpers specifically and briefly.'],
              ['🎤', 'Introducing a speaker', 'Name, relevant achievements, why they’re here — then hand over.'],
            ],
            acts: [
              { order: 'Order a vote of thanks', steps: ['Thank the chief guest', 'Thank the principal and teachers', 'Thank the organisers and helpers', 'Thank the audience', 'Close warmly'], why: 'Protocol.' },
              { mcq: 'A good speaker introduction is…', options: ['Brief, relevant and ends with their name and a welcome', 'A long life story', 'About yourself'], answer: 0, why: 'Purpose.' },
              { phase: 'probe', mcq: 'Best length for a vote of thanks?', options: ['1–2 minutes', '15 minutes', '5 seconds'], answer: 0, why: 'Brevity.' },
              { phase: 'probe', speak: 'Deliver a 1-minute welcome speech for your school’s sports day.', checklist: ['Greeted guests in order', 'Set an enthusiastic tone', 'Previewed the event', 'Warm close'], tips: 'Check names and titles beforehand.' },
            ],
            teach: {
              explain: 'Ceremonial speaking conventions in Indian schools.', analogy: 'Ceremonial speeches are the opening and closing curtains.',
              vocab: [['vote of thanks', 'Speech thanking contributors.'], ['chief guest', 'Main invited guest.']],
              demo: 'Model all three.',
              prompts: [['Order of greeting?', 'Seniority.'], ['Length?', 'Short.']],
              support: 'Templates.', stretch: 'Compere an event.',
              mis: [['Thank everyone by name for ages', 'Be specific but brief.']],
              sheet: 'Ceremonial speech templates.',
            },
          },
          {
            t: 'Impromptu speaking and Q&A', o: 'Speak impromptu and answer audience questions confidently.', min: 30,
            hook: ['word', 'Pause · Frame · Speak · Close', 'impromptu method'],
            cards: [
              ['🧱', 'Frames', 'PREP, Past–Present–Future, Problem–Solution.'],
              ['❓', 'Q&A', 'Listen fully, repeat or rephrase, answer briefly, check.'],
              ['🤷', 'Don’t know?', '“Great question — I’m not sure, but I’ll find out.”'],
            ],
            acts: [
              { sort: 'Which frame fits each topic best?', buckets: ['PREP', 'Past–Present–Future', 'Problem–Solution'], items: [['Should mobile phones be allowed in class?', 0], ['How has your town changed?', 1], ['Traffic near our school', 2], ['Your favourite book', 0], ['How cricket has changed over the years', 1]], why: 'Frame choice.' },
              { mcq: 'Someone asks a question you can’t answer. Best response?', options: ['Be honest and offer to find out', 'Make something up', 'Ignore it'], answer: 0, why: 'Honesty.' },
              { phase: 'probe', speak: 'Impromptu: “The most useful invention ever.” Speak for 90 seconds.', checklist: ['Took a breath first', 'Used a frame', 'Clear conclusion'], tips: 'Choose your frame in the first 3 seconds.' },
              { phase: 'probe', mcq: 'Why repeat or rephrase a question before answering?', options: ['Everyone hears it and you get thinking time', 'To waste time', 'To avoid answering'], answer: 0, why: 'Q&A technique.' },
            ],
            teach: {
              explain: 'Impromptu frameworks and Q&A handling.', analogy: 'Frames are emergency kits for speakers.',
              vocab: [['impromptu', 'Unprepared speech.'], ['Q&A', 'Question and answer session.']],
              demo: 'Hot-seat rounds.',
              prompts: [['Frame?', 'Choose fast.'], ['Unknown answer?', 'Be honest.']],
              support: 'Frame cards.', stretch: 'Table Topics club.',
              mis: [['You must know every answer', 'Honesty builds trust.']],
              sheet: 'Impromptu frames and topic cards.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Public Speaking', band: '6-8', level: 'Advanced', title: 'Inspiring Speakers',
    description: 'Craft inspirational speeches with storytelling and rhetoric, perform in elocution and MUN-style settings, and give feedback like a coach.',
    intro: 'Move audiences with your words. ✨', theme: 'ocean', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Rhetoric workshops, competitions and coaching.',
    outcomes: ['Uses rhetorical devices', 'Weaves stories into speeches', 'Performs in elocution/MUN-style formats', 'Gives coaching feedback'],
    prereq: ['Speeches for Every Occasion'],
    modules: [
      {
        title: 'Module 1: Rhetoric and story',
        lessons: [
          {
            t: 'Rhetorical devices', o: 'Use rhetorical devices to make speeches memorable.', min: 30,
            hook: ['phrase', 'We will learn, we will lead, we will light the way.', ['learn', 'lead', 'light']],
            cards: [
              ['3️⃣', 'Tricolon', 'Groups of three: “learn, lead, light”.'],
              ['🔁', 'Anaphora', 'Repeating the start of sentences: “We will… We will…”'],
              ['↔️', 'Antithesis', 'Contrast: “Not a burden, but a blessing.”'],
            ],
            acts: [
              { match: 'Match the device to the example', pairs: [['Tricolon', 'Faster, higher, stronger'], ['Anaphora', 'I have a plan. I have a team. I have hope.'], ['Antithesis', 'Small steps, big changes'], ['Rhetorical question', 'Who among us has never failed?']], why: 'Rhetoric.' },
              { mcq: 'Why do speakers use groups of three?', options: ['They sound complete and are easy to remember', 'Two is unlucky', 'Grammar requires it'], answer: 0, why: 'Memorability.' },
              { phase: 'probe', mcq: 'Overusing devices can make a speech sound…', options: ['Artificial', 'Natural', 'Shorter'], answer: 0, why: 'Balance.' },
              { phase: 'probe', write: 'Write a 4-sentence speech ending using anaphora and a tricolon.', keywords: ['we will', 'together'], exemplar: 'We will plant. We will protect. We will persist. Together, we will turn our grey school green.', minWords: 20 },
            ],
            teach: {
              explain: 'Classical rhetorical devices.', analogy: 'Devices are the spices of speech.',
              vocab: [['tricolon', 'Group of three.'], ['anaphora', 'Repeated beginnings.']],
              demo: 'Analyse a famous short speech.',
              prompts: [['Device?', 'Name.'], ['Effect?', 'Memorable.']],
              support: 'Device bank.', stretch: 'Chiasmus.',
              mis: [['More devices = better speech', 'Use purposefully.']],
              sheet: 'Rhetorical device practice.',
            },
          },
          {
            t: 'Stories in speeches', o: 'Use a personal story to illustrate a message.', min: 30,
            hook: ['word', 'Story → Point → Lesson', 'illustrative story'],
            cards: [
              ['📖', 'Short story', '30–60 seconds, one moment, vivid detail.'],
              ['🎯', 'Clear link', 'Connect the story directly to your message.'],
              ['💡', 'Lesson', 'Tell the audience what it means for them.'],
            ],
            acts: [
              { order: 'Order a story-based point', steps: ['Tell the story of failing a cycling race', 'Describe getting back up and training', 'State the point: setbacks teach resilience', 'Apply it: your next setback could be your best teacher'], why: 'Story to lesson.' },
              { mcq: 'A story in a speech should be…', options: ['Short, vivid and clearly linked to the message', 'Long and unrelated', 'Fictional without saying so'], answer: 0, why: 'Purpose.' },
              { phase: 'probe', mcq: 'After the story, you should…', options: ['Explain what it means for the audience', 'Move on silently', 'Tell another unrelated story'], answer: 0, why: 'Link.' },
              { phase: 'probe', speak: 'Give a 2-minute speech on “Never give up” built around one personal story.', checklist: ['Vivid short story', 'Clear link to message', 'Lesson for audience', 'Strong close'], tips: 'Use present tense in the story for immediacy.' },
            ],
            teach: {
              explain: 'Narrative in persuasive/inspirational speaking.', analogy: 'Stories are Trojan horses for messages.',
              vocab: [['illustrate', 'Show by example.'], ['resilience', 'Bouncing back.']],
              demo: 'Model story-based speech.',
              prompts: [['Link?', 'Explicit.'], ['Length?', 'Short.']],
              support: 'Story planner.', stretch: 'Two contrasting stories.',
              mis: [['Stories are just entertainment', 'They carry the message.']],
              sheet: 'Story-in-speech planner.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Competitions and coaching',
        lessons: [
          {
            t: 'Elocution and MUN-style speaking', o: 'Prepare for elocution and Model UN-style speeches.', min: 30,
            hook: ['word', 'Elocution: expression · MUN: position + diplomacy', 'formats'],
            cards: [
              ['🎭', 'Elocution', 'Deliver a poem or prose piece with clarity, expression and memory.'],
              ['🌐', 'MUN opening speech', 'State your country’s position, concerns and proposals in 60–90 seconds.'],
              ['🤝', 'Diplomacy', 'Formal language: “The delegate of India believes…”'],
            ],
            acts: [
              { sort: 'Elocution or MUN?', buckets: ['Elocution', 'MUN'], items: [['Reciting a poem with expression', 0], ['“The delegate of Brazil proposes…”', 1], ['Clear pronunciation of every word', 0], ['Representing a country’s policy', 1]], why: 'Formats.' },
              { mcq: 'MUN delegates refer to themselves as…', options: ['“The delegate of [country]”', '“Me”', 'Their first name'], answer: 0, why: 'Convention.' },
              { phase: 'probe', mcq: 'Elocution judges usually focus on…', options: ['Pronunciation, expression and memory', 'Arguments and rebuttals', 'Slides'], answer: 0, why: 'Criteria.' },
              { phase: 'probe', speak: 'Give a 60-second MUN-style opening on clean water access, as a delegate of any country.', checklist: ['Formal address', 'Country position', 'One proposal', 'Diplomatic tone'], tips: 'Research one real fact about your country first.' },
            ],
            teach: {
              explain: 'Competitive formats and conventions.', analogy: 'Different sports, different rules.',
              vocab: [['elocution', 'Expressive recitation.'], ['delegate', 'Country representative in MUN.']],
              demo: 'Watch/model both formats.',
              prompts: [['Format rules?', 'Know them.'], ['Tone?', 'Formal/diplomatic.']],
              support: 'Format guides.', stretch: 'Mock MUN committee.',
              mis: [['MUN is about winning arguments', 'It’s about diplomacy and consensus.']],
              sheet: 'Elocution and MUN prep sheets.',
            },
          },
          {
            t: 'Coaching and feedback', o: 'Give specific, actionable feedback to other speakers.', min: 30,
            hook: ['word', 'Praise · Polish · Praise', 'feedback sandwich (used wisely)'],
            cards: [
              ['🎯', 'Specific', '“Your pause after the statistic was powerful” beats “Good job”.'],
              ['🔧', 'Actionable', 'Suggest one clear change: “Try stepping forward for your main point.”'],
              ['🤝', 'Kind and honest', 'Focus on the speech, not the person.'],
            ],
            acts: [
              { sort: 'Useful feedback or not?', buckets: ['Useful', 'Not useful'], items: [['Your opening question hooked me instantly.', 0], ['It was fine.', 1], ['Slow down during the statistics so they land.', 0], ['You’re just not a good speaker.', 1], ['Try one gesture to show size.', 0]], why: 'Quality feedback.' },
              { mcq: 'How many improvement points should you give?', options: ['One or two clear ones', 'Ten', 'None ever'], answer: 0, why: 'Focus.' },
              { phase: 'probe', mcq: 'Feedback should focus on…', options: ['The speech and its delivery', 'The speaker’s personality', 'Their clothes'], answer: 0, why: 'Respect.' },
              { phase: 'probe', write: 'Watch a speech (classmate or online). Write two specific praises and one actionable suggestion.', keywords: ['specific', 'try', 'when'], exemplar: 'Praise: your story about your grandmother made the message personal. Praise: strong final line. Suggestion: try pausing after your main statistic.', minWords: 25 },
            ],
            teach: {
              explain: 'Constructive feedback.', analogy: 'A coach points to one thing to fix in the next round.',
              vocab: [['actionable', 'Can be acted on.'], ['constructive', 'Helpful.']],
              demo: 'Model coaching a speaker.',
              prompts: [['Specific?', 'Yes.'], ['One change?', 'Clear.']],
              support: 'Feedback frames.', stretch: 'Coach a younger student.',
              mis: [['Kind feedback means only praise', 'Kind + honest.']],
              sheet: 'Speech feedback form.',
            },
          },
        ],
      },
    ],
  },
  // ───────── 9-12 ─────────
  {
    subject: 'Public Speaking', band: '9-12', level: 'Beginner', title: 'Speaking with Authority',
    description: 'Develop credibility, manage anxiety, structure talks with a clear thesis and deliver with authority.',
    intro: 'Speak so people listen. 🏛️', theme: 'grape', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Practical speaking labs with recorded self-review.',
    outcomes: ['Manages speaking anxiety', 'Builds credibility (ethos)', 'Structures talks around a clear thesis', 'Delivers with authority'],
    modules: [
      {
        title: 'Module 1: Mindset and message',
        lessons: [
          {
            t: 'Managing speaking anxiety', o: 'Use evidence-based strategies to manage nerves.', min: 35,
            hook: ['word', 'Reframe · Prepare · Breathe · Begin', 'anxiety toolkit'],
            cards: [
              ['🔄', 'Reframe', 'Telling yourself “I’m excited” can help channel the same physical energy.'],
              ['📋', 'Prepare', 'Rehearsal reduces uncertainty — the biggest source of nerves.'],
              ['🌬️', 'Physiology', 'Slow exhalations calm the nervous system.'],
            ],
            acts: [
              { order: 'Order a pre-speech routine', steps: ['Rehearse fully the day before', 'Arrive early and check the space', 'Do slow breathing (long exhales)', 'Reframe: “I’m excited to share this”', 'Begin with a rehearsed first line'], why: 'Routine.' },
              { mcq: 'Which reduces anxiety most reliably?', options: ['Thorough rehearsal', 'Avoiding practice', 'Drinking lots of caffeine'], answer: 0, why: 'Preparation.' },
              { phase: 'probe', mcq: 'Why memorise your first line?', options: ['A confident start calms the rest', 'Openings don’t matter', 'To skip the hook'], answer: 0, why: 'Momentum.' },
              { phase: 'probe', write: 'Design your personal pre-speech routine (5 steps) and explain why each helps.', keywords: ['rehearse', 'breathe', 'reframe', 'first line'], exemplar: '1. Rehearse twice the day before — reduces uncertainty. 2. Arrive early — familiarity. 3. Box breathing — slows heart rate. 4. Reframe as excitement. 5. Rehearsed opening line — strong start.', minWords: 30 },
            ],
            teach: {
              explain: 'Speech anxiety and coping (respecting individual differences; seek support if anxiety is severe).', analogy: 'Nerves are energy — direct it.',
              vocab: [['reframe', 'See differently.'], ['physiology', 'Body processes.']],
              demo: 'Lead breathing and reframing.',
              prompts: [['Biggest cause?', 'Uncertainty.'], ['Fix?', 'Preparation.']],
              support: 'Graduated exposure: small groups first.', stretch: 'Speak to unfamiliar audiences.',
              mis: [['Anxiety means you’re not cut out for speaking', 'It’s normal and manageable.']],
              sheet: 'Personal pre-speech routine.',
            },
          },
          {
            t: 'Thesis and structure', o: 'Build a talk around a single clear thesis.', min: 35,
            hook: ['word', 'If they remember one sentence, what should it be?', 'the thesis test'],
            cards: [
              ['🎯', 'Thesis', 'One sentence capturing your main message.'],
              ['🏗️', 'Support', '2–3 points that each prove the thesis.'],
              ['✂️', 'Cut', 'Anything that doesn’t support the thesis goes.'],
            ],
            acts: [
              { mcq: 'Strongest thesis?', options: ['Learning a second language early improves problem-solving, empathy and career options.', 'Languages are interesting.', 'I will talk about languages.'], answer: 0, why: 'Specific, arguable.' },
              { sort: 'Supports the thesis “Cycling should be promoted in Indian cities” or not?', buckets: ['Supports', 'Off-topic'], items: [['Cycling reduces air pollution', 0], ['The history of the bicycle in France', 1], ['Cycle lanes improve safety', 0], ['My favourite cycle colour', 1], ['Cycling improves fitness and saves money', 0]], why: 'Relevance.' },
              { phase: 'probe', mcq: 'Why cut interesting but irrelevant facts?', options: ['They dilute the message', 'Facts are bad', 'To save paper'], answer: 0, why: 'Focus.' },
              { phase: 'probe', write: 'Write a thesis and three supporting points for a 5-minute talk on a topic you care about.', keywords: ['thesis', 'because', 'point'], exemplar: 'Thesis: Schools should teach financial literacy because it builds independence. Points: budgeting habits, avoiding debt traps, understanding investments.', minWords: 25 },
            ],
            teach: {
              explain: 'Message-centred structure.', analogy: 'A thesis is the trunk; points are branches.',
              vocab: [['thesis', 'Central claim.'], ['relevance', 'Connection to the thesis.']],
              demo: 'Thesis workshop.',
              prompts: [['One sentence?', 'Test.'], ['Relevant?', 'Cut if not.']],
              support: 'Thesis frame.', stretch: 'Counter-thesis.',
              mis: [['More information = more convincing', 'Focus convinces.']],
              sheet: 'Thesis and structure planner.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Authority in delivery',
        lessons: [
          {
            t: 'Credibility (ethos)', o: 'Establish credibility through preparation, sources and manner.', min: 35,
            hook: ['word', 'Competence · Character · Goodwill', 'pillars of credibility'],
            cards: [
              ['🎓', 'Competence', 'Show you know the topic: research, sources, clarity.'],
              ['🤝', 'Character', 'Honesty, fairness, admitting limits.'],
              ['❤️', 'Goodwill', 'Show you care about the audience’s interests.'],
            ],
            acts: [
              { sort: 'Builds or damages credibility?', buckets: ['Builds', 'Damages'], items: [['Citing a reliable source briefly', 0], ['Exaggerating statistics', 1], ['Admitting what you don’t know', 0], ['Reading every word from notes', 1], ['Showing how the topic helps the audience', 0]], why: 'Ethos.' },
              { mcq: 'How should you cite sources in a speech?', options: ['Briefly and naturally: “According to a 2024 WHO report…”', 'Read full references aloud', 'Never'], answer: 0, why: 'Oral citation.' },
              { phase: 'probe', mcq: 'An audience member corrects your fact. Best response?', options: ['Thank them and acknowledge it gracefully', 'Argue', 'Ignore'], answer: 0, why: 'Character.' },
              { phase: 'probe', speak: 'Open a 2-minute talk by establishing credibility in your first 30 seconds.', checklist: ['Showed relevant experience or research', 'Cited one source', 'Showed goodwill to audience'], tips: 'Credibility can come from experience, research or genuine care.' },
            ],
            teach: {
              explain: 'Aristotelian ethos.', analogy: 'Credibility is the bridge your message walks across.',
              vocab: [['ethos', 'Speaker credibility.'], ['goodwill', 'Care for the audience.']],
              demo: 'Compare credible vs non-credible openings.',
              prompts: [['How build?', 'Three pillars.'], ['Mistakes?', 'Admit.']],
              support: 'Citation phrases.', stretch: 'Credibility for unfamiliar topics.',
              mis: [['Credibility requires being an expert', 'Preparation and honesty build it.']],
              sheet: 'Credibility checklist.',
            },
          },
          {
            t: 'Commanding delivery', o: 'Deliver with authority: voice, stillness, pausing and eye contact.', min: 35,
            hook: ['phrase', 'Here is what we must do. (pause)', ['must']],
            cards: [
              ['🔉', 'Downward inflection', 'Statements ending down sound certain; uptalk sounds unsure.'],
              ['🧘', 'Stillness', 'Fewer, deliberate movements signal confidence.'],
              ['👁️', 'Hold eye contact', 'Finish a thought with one person before moving on.'],
            ],
            acts: [
              { mcq: 'Ending statements with a rising tone (uptalk) can make you sound…', options: ['Unsure', 'Authoritative', 'Louder'], answer: 0, why: 'Inflection.' },
              { mcq: 'Filler words (“um”, “like”) are best replaced with…', options: ['A brief pause', 'More fillers', 'Faster speech'], answer: 0, why: 'Pausing.' },
              { phase: 'probe', speak: 'Deliver: “We have the data. We have the means. What we need now is the will.” with downward inflection and pauses.', checklist: ['Downward inflection on statements', 'Pauses between sentences', 'Still posture', 'Held eye contact per sentence'], tips: 'Record and listen for uptalk.' },
              { phase: 'probe', mcq: 'Best way to reduce fillers?', options: ['Record yourself, notice them and practise pausing', 'Speak faster', 'Never practise'], answer: 0, why: 'Awareness.' },
            ],
            teach: {
              explain: 'Paralinguistic authority.', analogy: 'Authority is calm, not loud.',
              vocab: [['inflection', 'Pitch change.'], ['filler', 'Empty sound like um.']],
              demo: 'Uptalk vs downward inflection.',
              prompts: [['Inflection?', 'Down for statements.'], ['Fillers?', 'Pause.']],
              support: 'Filler tally sheet.', stretch: 'Speak with a mic and podium.',
              mis: [['Authority means loudness', 'It means control.']],
              sheet: 'Delivery self-review rubric.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Public Speaking', band: '9-12', level: 'Intermediate', title: 'Persuasion and Rhetoric',
    description: 'Master persuasive speaking: ethos, pathos, logos, Monroe’s motivated sequence, handling objections and analysing great speeches.',
    intro: 'Change minds with ethical persuasion. ⚖️', theme: 'grape', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Speech analysis and persuasive speaking labs.',
    outcomes: ['Balances ethos, pathos and logos', 'Uses Monroe’s motivated sequence', 'Handles objections and hostile questions', 'Analyses famous speeches'],
    prereq: ['Speaking with Authority'],
    modules: [
      {
        title: 'Module 1: Persuasive design',
        lessons: [
          {
            t: 'Ethos, pathos, logos in balance', o: 'Combine credibility, emotion and logic ethically.', min: 35,
            hook: ['word', 'Trust · Feel · Think', 'balanced persuasion'],
            cards: [
              ['🎖️', 'Ethos', 'Why should they trust you?'],
              ['❤️', 'Pathos', 'Why should they care? (Honest emotion, not manipulation.)'],
              ['🧮', 'Logos', 'Why is it logical? Data, reasoning, examples.'],
            ],
            acts: [
              { sort: 'Ethos, pathos or logos?', buckets: ['Ethos', 'Pathos', 'Logos'], items: [['I volunteered at the shelter for two years.', 0], ['Imagine waiting all night in the rain for help.', 1], ['Adoption rates rose 40% after the campaign.', 2], ['As a student who uses public transport daily…', 0], ['If X costs less and saves more, X is the better choice.', 2]], why: 'Appeals.' },
              { mcq: 'Manipulative pathos looks like…', options: ['Exaggerated fear with no evidence', 'An honest personal story', 'A relevant image'], answer: 0, why: 'Ethics.' },
              { phase: 'probe', mcq: 'A speech heavy on statistics but no stories may…', options: ['Inform but fail to move people', 'Always persuade', 'Be too emotional'], answer: 0, why: 'Balance.' },
              { phase: 'probe', write: 'Write three short paragraphs for one speech topic — one ethos, one pathos, one logos.', keywords: ['ethos', 'pathos', 'logos'], exemplar: 'Topic: school mental-health room. Ethos: As a peer mentor, I’ve listened to many classmates… Pathos: Picture a student crying in a corridor with nowhere to go… Logos: Schools with such rooms report fewer absences…', minWords: 50 },
            ],
            teach: {
              explain: 'Rhetorical appeals and ethics.', analogy: 'A three-legged stool falls if one leg is missing.',
              vocab: [['pathos', 'Emotional appeal.'], ['logos', 'Logical appeal.']],
              demo: 'Analyse an appeal-heavy ad.',
              prompts: [['Which appeal?', 'Identify.'], ['Ethical?', 'Honest?']],
              support: 'Appeal bank.', stretch: 'Kairos (timing).',
              mis: [['Emotion is always manipulation', 'Honest emotion is legitimate.']],
              sheet: 'Appeals planning grid.',
            },
          },
          {
            t: 'Monroe’s motivated sequence', o: 'Structure action-oriented persuasive speeches.', min: 35,
            hook: ['word', 'Attention · Need · Satisfaction · Visualisation · Action', 'motivated sequence'],
            cards: [
              ['👀', 'Attention', 'Hook the audience.'],
              ['⚠️', 'Need and satisfaction', 'Show the problem; present your solution.'],
              ['🔭', 'Visualisation and action', 'Paint the future with/without the solution; ask for specific action.'],
            ],
            acts: [
              { order: 'Order Monroe’s motivated sequence', steps: ['Attention', 'Need', 'Satisfaction', 'Visualisation', 'Action'], why: 'Sequence.' },
              { mcq: 'In the visualisation step you…', options: ['Describe the future if the solution is (or isn’t) adopted', 'State statistics only', 'Thank the audience'], answer: 0, why: 'Step purpose.' },
              { phase: 'probe', mcq: 'A strong action step is…', options: ['Sign this petition today at the library desk', 'Think about it someday', 'Do something'], answer: 0, why: 'Specific.' },
              { phase: 'probe', speak: 'Give a 3-minute speech using Monroe’s sequence on a local issue.', checklist: ['Attention hook', 'Clear need with evidence', 'Practical solution', 'Vivid visualisation', 'Specific action'], tips: 'Make the action easy and immediate.' },
            ],
            teach: {
              explain: 'Motivated sequence for actuation.', analogy: 'Guiding the audience from problem to action like a staircase.',
              vocab: [['actuate', 'Move to action.'], ['visualisation', 'Imagined future.']],
              demo: 'Map a charity appeal.',
              prompts: [['Need evidence?', 'Yes.'], ['Action?', 'Specific.']],
              support: 'Sequence template.', stretch: 'Negative visualisation.',
              mis: [['Persuasion ends with agreement', 'It ends with action.']],
              sheet: 'Motivated sequence planner.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Objections and analysis',
        lessons: [
          {
            t: 'Handling objections and tough questions', o: 'Respond calmly to objections and hostile questions.', min: 35,
            hook: ['word', 'Listen · Acknowledge · Answer · Bridge', 'LAAB'],
            cards: [
              ['👂', 'Listen fully', 'Don’t interrupt; identify the real concern.'],
              ['🤝', 'Acknowledge', '“That’s a fair concern.”'],
              ['🌉', 'Answer and bridge', 'Answer honestly, then bridge back to your key message.'],
            ],
            acts: [
              { order: 'Order LAAB', steps: ['Listen fully', 'Acknowledge the concern', 'Answer honestly and briefly', 'Bridge to your key message'], why: 'Technique.' },
              { mcq: 'A questioner is hostile. Best first move?', options: ['Stay calm and acknowledge their concern', 'Match their tone', 'Refuse to answer'], answer: 0, why: 'Composure.' },
              { phase: 'probe', mcq: 'A “loaded question” assumes something false. You should…', options: ['Politely challenge the assumption before answering', 'Accept it', 'Laugh'], answer: 0, why: 'Reframing.' },
              { phase: 'probe', speak: 'Respond to: “Isn’t your recycling plan just a waste of money?” using LAAB.', checklist: ['Acknowledged', 'Honest answer with evidence', 'Bridged to key message', 'Calm tone'], tips: 'Keep answers under 45 seconds.' },
            ],
            teach: {
              explain: 'Q&A and objection handling.', analogy: 'Aikido: redirect energy rather than block it.',
              vocab: [['bridge', 'Transition to key message.'], ['loaded question', 'Question with a hidden assumption.']],
              demo: 'Mock press conference.',
              prompts: [['Acknowledge?', 'Always.'], ['Bridge?', 'Key message.']],
              support: 'Response frames.', stretch: 'Rapid-fire Q&A.',
              mis: [['Defend every point aggressively', 'Calm honesty persuades.']],
              sheet: 'Q&A practice cards.',
            },
          },
          {
            t: 'Analysing great speeches', o: 'Analyse structure, rhetoric and delivery of influential speeches.', min: 35,
            hook: ['word', 'Context · Purpose · Techniques · Impact', 'speech analysis frame'],
            cards: [
              ['🕰️', 'Context', 'When, where, to whom, and why it mattered then.'],
              ['🛠️', 'Techniques', 'Structure, devices, appeals, delivery.'],
              ['🌊', 'Impact', 'What changed because of it?'],
            ],
            acts: [
              { order: 'Order a speech analysis', steps: ['Research the context', 'Identify the purpose and audience', 'Analyse structure', 'Identify rhetorical techniques', 'Evaluate impact'], why: 'Analytical frame.' },
              { mcq: 'Why is context essential in speech analysis?', options: ['Techniques gain meaning from the situation and audience', 'It’s not essential', 'For dates only'], answer: 0, why: 'Context.' },
              { phase: 'probe', mcq: 'Evaluating impact means asking…', options: ['What effect did the speech have on its audience or events?', 'How long was it?', 'What font was used?'], answer: 0, why: 'Impact.' },
              { phase: 'probe', write: 'Analyse a speech you’ve studied or watched (Indian or international) using the frame.', keywords: ['context', 'purpose', 'technique', 'impact'], exemplar: 'Context: delivered at independence to a nation… Purpose: inspire unity and responsibility. Techniques: metaphor of awakening, tricolon… Impact: became a defining text of the era.', minWords: 50 },
            ],
            teach: {
              explain: 'Rhetorical criticism.', analogy: 'Watching match replays to learn technique.',
              vocab: [['rhetorical criticism', 'Analysing persuasive texts.'], ['impact', 'Effect.']],
              demo: 'Analyse a short historical speech extract.',
              prompts: [['Context?', 'Research.'], ['Technique → effect?', 'Link.']],
              support: 'Analysis frame.', stretch: 'Compare two speeches.',
              mis: [['Great speeches succeed by words alone', 'Delivery and context matter.']],
              sheet: 'Speech analysis frame.',
            },
          },
        ],
      },
    ],
  },
  {
    subject: 'Public Speaking', band: '9-12', level: 'Advanced', title: 'Leadership Communication and TED-Style Talks',
    description: 'Design and deliver a TED-style talk, speak as a leader, moderate events and use media and microphones professionally.',
    intro: 'Share an idea worth spreading. 🌍', theme: 'grape', tutor: ps, tools: psTools, notes: psNotes,
    style: 'Capstone talk with coaching, rehearsal and showcase.',
    outcomes: ['Develops a single big idea into a talk', 'Speaks as a leader in meetings and events', 'Moderates panels and events', 'Uses microphones, cameras and slides professionally'],
    prereq: ['Persuasion and Rhetoric'],
    modules: [
      {
        title: 'Module 1: The big idea talk',
        lessons: [
          {
            t: 'Finding your idea worth spreading', o: 'Develop one clear, original idea for a talk.', min: 40,
            hook: ['word', 'One idea · Fresh angle · Why now?', 'idea test'],
            cards: [
              ['💡', 'One idea', 'A talk should transfer one idea, clearly.'],
              ['🔍', 'Fresh angle', 'What do you see that others might miss?'],
              ['⏰', 'Relevance', 'Why should this audience care now?'],
            ],
            acts: [
              { mcq: 'Which is a strong talk idea?', options: ['Boredom is a creative superpower we’re losing to screens.', 'Some thoughts about life.', 'Everything about technology.'], answer: 0, why: 'Single, fresh, arguable.' },
              { sort: 'Idea or topic?', buckets: ['Idea (a claim)', 'Topic (a subject)'], items: [['Climate change', 1], ['Teenagers can lead climate action in their own neighbourhoods', 0], ['Music', 1], ['Learning music rewires how we handle failure', 0]], why: 'Topic vs idea.' },
              { phase: 'probe', mcq: 'The “throughline” of a talk is…', options: ['The connecting theme every part supports', 'The title', 'A slide'], answer: 0, why: 'Concept.' },
              { phase: 'probe', write: 'State your idea in 15 words or fewer, then explain why it matters now.', keywords: ['idea', 'because', 'now', 'matters'], exemplar: 'Idea: Asking for help is a leadership skill, not a weakness. It matters now because students increasingly burn out alone.', minWords: 25 },
            ],
            teach: {
              explain: 'Idea development for talks.', analogy: 'A talk is a gift of one idea, wrapped well.',
              vocab: [['throughline', 'Connecting thread.'], ['idea', 'A claim worth sharing.']],
              demo: 'Idea refinement workshop.',
              prompts: [['15 words?', 'Test.'], ['Why now?', 'Relevance.']],
              support: 'Idea brainstorm sheet.', stretch: 'Peer idea critique.',
              mis: [['Big topics make big talks', 'Focused ideas do.']],
              sheet: 'Idea development sheet.',
            },
          },
          {
            t: 'Building and rehearsing the talk', o: 'Build a 6–8 minute talk with story, explanation and a powerful close.', min: 45,
            hook: ['word', 'Connect · Explain · Persuade · Reveal', 'talk structure'],
            cards: [
              ['🤝', 'Connect', 'Open with a story or question that earns attention.'],
              ['🧩', 'Explain', 'Build the idea step by step with examples and metaphors.'],
              ['🔁', 'Rehearse', 'Many full rehearsals; memorise the opening and closing.'],
            ],
            acts: [
              { order: 'Order the talk development process', steps: ['Write the throughline', 'Outline the arc', 'Draft and cut to time', 'Rehearse with feedback', 'Refine slides (if any)', 'Final timed rehearsal'], why: 'Process.' },
              { mcq: 'An 8-minute talk at ~140 wpm is about…', options: ['1,100 words', '400 words', '3,000 words'], answer: 0, why: '8 × 140.' },
              { phase: 'probe', mcq: 'Memorise word-for-word or know the structure?', options: ['Know structure deeply; memorise opening and closing lines', 'Memorise everything', 'Improvise everything'], answer: 0, why: 'Natural delivery.' },
              { phase: 'probe', speak: 'Deliver the first 2 minutes of your talk.', checklist: ['Engaging opening', 'Idea stated clearly', 'Natural delivery', 'Eye contact and pacing'], tips: 'Rehearse for someone unfamiliar with the topic.' },
            ],
            teach: {
              explain: 'TED-style talk construction.', analogy: 'Building a staircase the audience climbs with you.',
              vocab: [['arc', 'Shape of the talk.'], ['rehearsal', 'Practice run.']],
              demo: 'Analyse a talk structure.',
              prompts: [['Time?', 'Words ÷ wpm.'], ['Memorise?', 'Open/close.']],
              support: 'Talk template.', stretch: 'Talk without slides.',
              mis: [['Slides carry the talk', 'You carry the talk.']],
              sheet: 'Talk builder template.',
            },
          },
        ],
      },
      {
        title: 'Module 2: Leading and hosting',
        lessons: [
          {
            t: 'Leadership communication', o: 'Communicate as a leader in meetings, announcements and difficult conversations.', min: 40,
            hook: ['word', 'Clear · Calm · Credible · Caring', 'leader’s voice'],
            cards: [
              ['📣', 'Announcements', 'Lead with the key message, then details and next steps.'],
              ['🗳️', 'Meetings', 'Set purpose, invite views, summarise decisions and owners.'],
              ['🤝', 'Difficult news', 'Be direct, empathetic and clear about what happens next.'],
            ],
            acts: [
              { order: 'Order delivering difficult news to a team', steps: ['State the news clearly', 'Acknowledge feelings', 'Explain the reasons briefly', 'Outline next steps', 'Invite questions'], why: 'Structure.' },
              { mcq: 'Best opening for an announcement?', options: ['The sports day is moved to Friday because of rain; here’s what changes.', 'So, um, there are some updates…', 'Long background story first'], answer: 0, why: 'Bottom line up front.' },
              { phase: 'probe', mcq: 'A meeting ends without clear owners for tasks. Result?', options: ['Tasks often don’t get done', 'Everything gets done', 'No effect'], answer: 0, why: 'Accountability.' },
              { phase: 'probe', speak: 'As student council president, announce that the annual trip is cancelled and what will happen instead.', checklist: ['Clear key message first', 'Empathy', 'Reason', 'Next steps', 'Invite questions'], tips: 'Avoid blaming; focus on what’s next.' },
            ],
            teach: {
              explain: 'Leadership communication principles.', analogy: 'A leader’s voice is a lighthouse in fog.',
              vocab: [['BLUF', 'Bottom line up front.'], ['owner', 'Person responsible.']],
              demo: 'Model an announcement.',
              prompts: [['Key message first?', 'Yes.'], ['Owners?', 'Assign.']],
              support: 'Templates.', stretch: 'Run a real council meeting.',
              mis: [['Leaders should never show emotion', 'Appropriate empathy builds trust.']],
              sheet: 'Leadership communication templates.',
            },
          },
          {
            t: 'Hosting, moderating and media', o: 'Host events, moderate panels and speak on microphone and camera.', min: 40,
            hook: ['word', 'Host · Moderate · Mic · Camera', 'professional stagecraft'],
            cards: [
              ['🎙️', 'Microphone', 'Hold 5–10 cm away, speak across it, test first.'],
              ['🎥', 'Camera', 'Look into the lens; frame from chest up; good front light.'],
              ['🧑‍⚖️', 'Moderating', 'Introduce panellists, ask open questions, manage time fairly, summarise.'],
            ],
            acts: [
              { sort: 'Good or poor stagecraft?', buckets: ['Good', 'Poor'], items: [['Testing the mic before the event', 0], ['Blowing into the mic to test it', 1], ['Looking into the camera lens', 0], ['Letting one panellist talk for 15 minutes', 1], ['Summarising key points at the end', 0]], why: 'Professional norms.' },
              { mcq: 'As moderator, a panellist goes off-topic. You…', options: ['Thank them and steer back with a focused question', 'Let them continue', 'Turn off their mic angrily'], answer: 0, why: 'Facilitation.' },
              { phase: 'probe', mcq: 'For a video talk, where should you look?', options: ['Into the camera lens', 'At yourself on screen', 'At the floor'], answer: 0, why: 'Connection.' },
              { phase: 'probe', speak: 'Host: open an event, introduce a speaker, and close with a thank-you (2 minutes).', checklist: ['Warm welcome', 'Relevant speaker intro', 'Smooth transitions', 'Thank-you and close'], tips: 'Script transitions; keep them short.' },
            ],
            teach: {
              explain: 'Hosting, moderation and mediated speaking.', analogy: 'A host is the thread holding the event together.',
              vocab: [['moderator', 'Person guiding a panel.'], ['compere', 'Event host.']],
              demo: 'Mock panel with rotating moderators.',
              prompts: [['Mic distance?', '5–10 cm.'], ['Camera?', 'Lens.']],
              support: 'Host script template.', stretch: 'Host a real school event.',
              mis: [['Hosts should be the star', 'Hosts make others shine.']],
              sheet: 'Host and moderator script templates.',
            },
          },
        ],
      },
    ],
  },
];
