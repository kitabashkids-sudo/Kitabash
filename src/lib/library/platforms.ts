// Real-world platforms for every course in the library — the same idea as the Scratch flagship
// courses (build along in the real tool, then hand in a project), applied to every subject.
//
// Each subject (and, where it matters, each grade band) is mapped to one platform. For every lesson
// the expander then adds:
//   • a "Build along" panel on the Learn screen with an "Open <platform>" button and steps that use
//     the lesson's own ideas, and
//   • a Perform activity where the learner does the lesson in that platform:
//       – Python            → the built-in Python Lab (real code, checked on the server)
//       – Web pages         → the built-in Web Lab (HTML/CSS editor with live preview, checked on the server)
//       – everything else   → a project hand-in: checklist + shared link (or "I showed my teacher") + reflection,
//                             reviewed by the teacher.
// No platform is embedded or automated; learners open the official site in a new tab.
import type { Band, CourseSpec, LessonSpec } from './types.ts';
import type { BuildAlong } from '../lessonTypes.ts';
import type { PyCheck } from '../python/checks.ts';
import type { WebCheck } from '../web/checks.ts';

export interface Platform {
  key: string;
  name: string;
  url?: string; // omitted for offline / built-in platforms
  builtin?: 'python' | 'web';
  about: string; // one line: what it is
  account: string; // sign-in / safety note
  unit: string; // what the learner makes there ("graph", "app", "story book")
  open: string; // how to start
  tryIt: string; // how to try one idea from the lesson there
  save: string; // how to save / share
  link?: { example: string; help: string }; // what a shared link looks like
  offline?: string; // label for "no link" hand-in
}

const SCHOOL = 'If it asks you to sign in, use your school account or ask your teacher. Never type your home address, phone number or passwords into a website.';

const P: Record<string, Platform> = {
  pythonLab: {
    key: 'python-lab', name: 'Python Lab', builtin: 'python',
    about: 'Kitabash’s built-in Python editor: real Python with a console, input() and turtle drawing — nothing to install.',
    account: 'Works right here in the lesson. Your code is saved on this device as you type.',
    unit: 'program', open: 'Scroll to the Python Lab activity below. Read the task and the starting code.',
    tryIt: 'write two or three lines of Python that use this idea, press Run and read the console',
    save: 'Press Check. The server re-runs your program, then your teacher reviews it.',
  },
  webLab: {
    key: 'web-lab', name: 'Web Lab', builtin: 'web',
    about: 'Kitabash’s built-in web page editor: type HTML and CSS on the left, see your page update live on the right.',
    account: 'Works right here in the lesson — no account. Your page is saved on this device as you type.',
    unit: 'web page', open: 'Scroll to the Web Lab activity below. Read the task and look at the starting page.',
    tryIt: 'add the HTML or CSS for this idea and watch the preview change',
    save: 'Press Check. The server checks your page, then your teacher reviews it.',
  },
  scratch: {
    key: 'scratch', name: 'Scratch', url: 'https://scratch.mit.edu/projects/editor/',
    about: 'MIT’s free block-coding editor for games, animations and stories.',
    account: 'You can code without an account. To share, use the class account your teacher set up — never your real name as a username.',
    unit: 'Scratch project', open: 'Open the Scratch editor (Create) and name your project after today’s lesson.',
    tryIt: 'snap together the blocks for this idea and press the green flag to test it',
    save: 'Press Share, then copy the project address. No account? File → Save to your computer and show your teacher.',
    link: { example: 'https://scratch.mit.edu/projects/123456789', help: 'In Scratch press Share, then copy the address from the top of the browser.' },
  },
  scratchJr: {
    key: 'scratchjr', name: 'ScratchJr', url: 'https://www.scratchjr.org',
    about: 'The free ScratchJr app (tablet, Chromebook or computer) for young coders.',
    account: 'No account needed. Ask a grown-up to open the ScratchJr app.',
    unit: 'ScratchJr project', open: 'Open the ScratchJr app and tap + to start a new project.',
    tryIt: 'snap the picture blocks together and tap the green flag',
    save: 'Show your project to your teacher on the tablet.',
    offline: 'I showed my ScratchJr project to my teacher',
  },
  appInventor: {
    key: 'app-inventor', name: 'MIT App Inventor', url: 'https://ai2.appinventor.mit.edu',
    about: 'Free block-based tool from MIT for building real Android and iPhone apps.',
    account: 'Sign in with your school Google account. Test on a phone with the MIT AI2 Companion app, or on the computer with the emulator.',
    unit: 'app', open: 'Open App Inventor, choose Projects → Start new project, and give it a clear name.',
    tryIt: 'add the components in the Designer, then snap the matching blocks together in the Blocks editor',
    save: 'App Inventor saves automatically. Share via Projects → Publish to Gallery and copy the gallery link, or export the .aia file and show your teacher.',
    link: { example: 'https://gallery.appinventor.mit.edu/#/projects/1234567890', help: 'In App Inventor choose Projects → Publish to Gallery, then copy the address of your gallery page.' },
  },
  microbit: {
    key: 'microbit', name: 'MakeCode for micro:bit', url: 'https://makecode.microbit.org',
    about: 'Microsoft MakeCode: block and JavaScript coding for the BBC micro:bit, with an on-screen simulator.',
    account: 'No account needed. No micro:bit board? The simulator on the left of the editor works just like one.',
    unit: 'micro:bit program', open: 'Open MakeCode, press New Project and name it after today’s lesson.',
    tryIt: 'drag in the blocks for this idea and test it in the simulator (press A, B or shake it)',
    save: 'Press Share → Publish project and copy the link. If you have a board, Download the .hex file to it.',
    link: { example: 'https://makecode.microbit.org/_AbC123xYz', help: 'In MakeCode press Share (top bar) → Publish project, then copy the link it shows.' },
  },
  minecraft: {
    key: 'minecraft-makecode', name: 'MakeCode for Minecraft Education', url: 'https://minecraft.makecode.com',
    about: 'Code the Agent and build in Minecraft Education using MakeCode blocks or Python.',
    account: 'Needs Minecraft Education with your school account. In the game, press C to open Code Builder.',
    unit: 'Minecraft build', open: 'Start a world in Minecraft Education, press C and choose MakeCode → New Project.',
    tryIt: 'build the blocks for this idea, run the command in chat and watch the Agent work',
    save: 'In Code Builder press Share → Publish and copy the link, or take a screenshot of your build for your teacher.',
    link: { example: 'https://makecode.com/_AbC123xYz', help: 'In Code Builder press Share, publish the project, then copy the link.' },
  },
  vexVR: {
    key: 'vexcode-vr', name: 'VEXcode VR', url: 'https://vr.vex.com',
    about: 'A free virtual robot you program with blocks (or Python) in the browser — no robot kit needed.',
    account: 'No account needed to code and run. Pick the playground your teacher names.',
    unit: 'robot program', open: 'Open VEXcode VR, choose a Playground (try Grid Map first) and start a new blocks project.',
    tryIt: 'add the blocks for this idea, press Start and watch the robot; change one value and try again',
    save: 'Use File → Save to your device, and take a screenshot of the robot’s run for your teacher.',
    offline: 'I saved my VEXcode VR project and showed my teacher (or attached a screenshot)',
  },
  tinkercad: {
    key: 'tinkercad-circuits', name: 'Tinkercad Circuits', url: 'https://www.tinkercad.com/circuits',
    about: 'Build and simulate Arduino circuits and code (blocks or text) in the browser.',
    account: 'Join through your teacher’s class link (no personal email needed for under-13s).',
    unit: 'circuit', open: 'Open Tinkercad → Circuits → Create new Circuit, and drag in an Arduino Uno.',
    tryIt: 'wire the parts for this idea, open Code, add the blocks, then press Start Simulation',
    save: 'Tinkercad saves automatically. Use Share → Invite people / copy the public link, or show your teacher.',
    link: { example: 'https://www.tinkercad.com/things/AbC123xYz', help: 'Open your design’s page on Tinkercad and copy the address from the browser bar.' },
  },
  teachable: {
    key: 'teachable-machine', name: 'Teachable Machine', url: 'https://teachablemachine.withgoogle.com/train',
    about: 'Google’s free tool to train your own image, sound or pose model in the browser.',
    account: 'No account needed to train. Your webcam pictures stay in the browser unless you choose to upload. Use objects, not faces, for class projects.',
    unit: 'AI model', open: 'Open Teachable Machine and choose Image Project → Standard image model.',
    tryIt: 'collect examples for each class, train the model, then test it with something new',
    save: 'Export → Upload my model to get a shareable link, or take screenshots of your classes and results for your teacher.',
    link: { example: 'https://teachablemachine.withgoogle.com/models/AbC123/', help: 'Press Export Model → Upload (shareable link), then copy the link it gives you.' },
  },
  aiClass: {
    key: 'class-ai-assistant', name: 'your class’s AI assistant',
    about: 'The AI chat tool your school has approved (for example Gemini, Copilot, ChatGPT or Claude).',
    account: 'Under 13? Your teacher types the prompts on the board while you write them. Older learners use the school-approved tool only. Never share personal details with an AI.',
    unit: 'prompt and result', open: 'Open the AI tool your teacher has approved (or watch your teacher’s screen).',
    tryIt: 'write a prompt that uses this idea, run it, then improve it once and compare the answers',
    save: 'Copy your best prompt and the AI’s answer into your notes, and write what you changed between versions.',
    offline: 'I kept my prompt and answers in my notes and showed my teacher',
  },
  aiWork: {
    key: 'work-ai-assistant', name: 'your organisation’s AI assistant',
    about: 'The AI assistant your organisation approves (for example Microsoft Copilot, Gemini, ChatGPT or Claude).',
    account: 'Use only approved tools. Do not paste personal, client or confidential data unless your policy allows it (DPDP).',
    unit: 'workflow', open: 'Open your organisation’s approved AI assistant in a new tab.',
    tryIt: 'apply this idea to a real (anonymised) task from your job and check the output line by line',
    save: 'Save your prompt, the output and your corrections. Share a chat link if your tool allows it, or paste the key parts into your reflection.',
    link: { example: 'https://…/share/abc123', help: 'Many assistants have a Share button that creates a read-only link. Only share chats with no confidential data.' },
  },
  diagrams: {
    key: 'diagrams-net', name: 'diagrams.net', url: 'https://app.diagrams.net',
    about: 'Free flowchart and diagram tool — design automations and agent workflows before building them.',
    account: 'No account needed: choose “Device” to save the file on your computer.',
    unit: 'workflow diagram', open: 'Open diagrams.net, choose Device, then Create New Diagram → Flowchart.',
    tryIt: 'draw this idea as boxes (steps), diamonds (decisions) and arrows (what happens next)',
    save: 'File → Export as → PNG, and show your teacher (or share it through your school drive).',
    offline: 'I exported my diagram and showed my teacher',
  },
  desmos: {
    key: 'desmos', name: 'Desmos Graphing Calculator', url: 'https://www.desmos.com/calculator',
    about: 'Free online graphing calculator: type an equation and the graph appears instantly.',
    account: 'No account needed to graph. Sign in with your school account only if you want to save.',
    unit: 'graph', open: 'Open Desmos and click into the first line of the expression list.',
    tryIt: 'type an example of this idea, add a slider, and watch the graph change',
    save: 'Press Share (the arrow icon) to copy a link, or take a screenshot for your teacher.',
    link: { example: 'https://www.desmos.com/calculator/abc123xyz', help: 'Press the Share button next to the graph title and copy the link.' },
  },
  geogebra: {
    key: 'geogebra', name: 'GeoGebra', url: 'https://www.geogebra.org/classic',
    about: 'Free maths tool for geometry, graphs, algebra and statistics.',
    account: 'No account needed to explore. Sign in with your school account to save and share.',
    unit: 'construction', open: 'Open GeoGebra Classic and choose the Graphing or Geometry view.',
    tryIt: 'construct or calculate an example of this idea and drag points to test it',
    save: 'Menu → Share to copy a link, or Export Image and show your teacher.',
    link: { example: 'https://www.geogebra.org/m/abcd1234', help: 'Menu → Share, then copy the link.' },
  },
  polypad: {
    key: 'polypad', name: 'Polypad', url: 'https://polypad.amplify.com',
    about: 'Free virtual maths manipulatives: number tiles, fraction bars, shapes, dice and more.',
    account: 'No account needed.',
    unit: 'model', open: 'Open Polypad and pick tiles from the left menu (numbers, fractions, shapes…).',
    tryIt: 'build a model of this idea with the tiles and move them around to check it',
    save: 'Use Share to copy a link, or take a screenshot and show your teacher.',
    link: { example: 'https://polypad.amplify.com/p#abc123', help: 'Press the Share button (top right) and copy the link.' },
  },
  phet: {
    key: 'phet', name: 'PhET Simulations', url: 'https://phet.colorado.edu/en/simulations/browse',
    about: 'Free interactive science and maths simulations from the University of Colorado Boulder.',
    account: 'No account needed. Simulations run in the browser on computers and tablets.',
    unit: 'experiment', open: 'Open PhET, search for a simulation about today’s topic, and press play.',
    tryIt: 'change one thing at a time in the simulation and write down what happens',
    save: 'Take a screenshot of your best result and write your observations in your notebook.',
    offline: 'I recorded my results in my notebook and showed my teacher',
  },
  googleEarth: {
    key: 'google-earth', name: 'Google Earth', url: 'https://earth.google.com/web',
    about: 'Explore real places, landforms, rivers and forests from above, anywhere on Earth.',
    account: 'No account needed to explore.',
    unit: 'exploration', open: 'Open Google Earth and use the search box to fly to a place.',
    tryIt: 'find a real place that shows this idea and look at it closely (zoom, tilt, Street View)',
    save: 'Write or draw what you found in your notebook, or take a screenshot with your teacher.',
    offline: 'I recorded what I found and showed my teacher',
  },
  storyweaver: {
    key: 'storyweaver', name: 'StoryWeaver', url: 'https://storyweaver.org.in',
    about: 'Pratham Books’ free library of picture books in English and many Indian languages, sorted by reading level.',
    account: 'No account needed to read.',
    unit: 'reading', open: 'Open StoryWeaver, choose Read, and pick a book at your reading level.',
    tryIt: 'find a page in the book that shows this idea and read it aloud',
    save: 'Write the book’s title and your answer in your notebook and show your teacher.',
    offline: 'I wrote my answer in my notebook and showed my teacher',
  },
  gutenberg: {
    key: 'gutenberg', name: 'Project Gutenberg', url: 'https://www.gutenberg.org',
    about: 'Over 70,000 free classic books (stories, poems, essays) to read online.',
    account: 'No account needed.',
    unit: 'reading response', open: 'Open Project Gutenberg and search for the text your teacher names (or a short story).',
    tryIt: 'find a passage that shows this idea and copy a short quotation',
    save: 'Write your response in your notebook or school document and share it with your teacher.',
    link: { example: 'https://docs.google.com/document/d/…', help: 'If you typed your response in a school document, share it with your teacher and paste the link.' },
  },
  bookCreator: {
    key: 'book-creator', name: 'Book Creator', url: 'https://app.bookcreator.com',
    about: 'Make your own e-book with pages, pictures, text and voice recordings.',
    account: 'Join your teacher’s library with the invite code they give you.',
    unit: 'book', open: 'Open Book Creator, join your teacher’s library and press New Book.',
    tryIt: 'make a page that shows this idea, with a picture and a sentence or two',
    save: 'Your book is saved in the class library automatically. Copy the book link if your teacher allows sharing.',
    link: { example: 'https://read.bookcreator.com/…', help: 'Open your book, press Share → Online link (if your teacher has turned it on).' },
  },
  googleDocs: {
    key: 'google-docs', name: 'Google Docs', url: 'https://docs.new',
    about: 'Write, edit and comment on documents in the browser.',
    account: SCHOOL,
    unit: 'document', open: 'Open a new Google Doc and give it a title with today’s lesson name.',
    tryIt: 'write a short paragraph that uses this idea, then reread it and improve one sentence',
    save: 'Press Share → change to “Anyone in your school with the link can comment”, then copy the link.',
    link: { example: 'https://docs.google.com/document/d/…', help: 'Press Share → Copy link.' },
  },
  googleSlides: {
    key: 'google-slides', name: 'Google Slides', url: 'https://slides.new',
    about: 'Make presentation slides and speaker notes in the browser.',
    account: SCHOOL,
    unit: 'slide deck', open: 'Open a new Google Slides presentation and choose a simple theme.',
    tryIt: 'make one slide for this idea — a short title, an image and your speaker notes underneath',
    save: 'Rehearse out loud with your notes, then press Share → Copy link.',
    link: { example: 'https://docs.google.com/presentation/d/…', help: 'Press Share → Copy link.' },
  },
  googleSheets: {
    key: 'google-sheets', name: 'Google Sheets', url: 'https://sheets.new',
    about: 'Spreadsheets for budgets, trackers and money calculations.',
    account: SCHOOL,
    unit: 'spreadsheet', open: 'Open a new Google Sheet and name it after today’s lesson.',
    tryIt: 'make a small table for this idea and use a formula like =SUM(B2:B6) to do the maths',
    save: 'Press Share → Copy link (view only is fine).',
    link: { example: 'https://docs.google.com/spreadsheets/d/…', help: 'Press Share → Copy link.' },
  },
  googleCalendar: {
    key: 'google-calendar', name: 'Google Calendar', url: 'https://calendar.google.com',
    about: 'Plan study sessions, deadlines and breaks on a real calendar.',
    account: SCHOOL,
    unit: 'study plan', open: 'Open Google Calendar on your school account and switch to Week view.',
    tryIt: 'block out time that puts this idea into practice (with a short break after each session)',
    save: 'Take a screenshot of your week, or share the calendar with your teacher.',
    offline: 'I showed my teacher my study plan (screenshot or paper copy)',
  },
  canva: {
    key: 'canva', name: 'Canva for Education', url: 'https://www.canva.com/education/',
    about: 'Design posters, pitch slides, logos and social posts. Free for K-12 schools.',
    account: 'Join your teacher’s Canva class with the link they give you.',
    unit: 'design', open: 'Open Canva, choose a template size (Poster, Presentation or Logo) and start with a blank design.',
    tryIt: 'design one part of your project that shows this idea, with a clear heading and one picture',
    save: 'Press Share → Copy link (view only), or Download as PNG/PDF and show your teacher.',
    link: { example: 'https://www.canva.com/design/…/view', help: 'Press Share → Copy link (set it to “can view”).' },
  },
  kialo: {
    key: 'kialo-edu', name: 'Kialo Edu', url: 'https://www.kialo-edu.com',
    about: 'A free classroom debate platform: claims, pros and cons in an argument map.',
    account: 'Join your teacher’s discussion with the invite link (no email needed for students).',
    unit: 'argument map', open: 'Open the Kialo Edu discussion your teacher has shared.',
    tryIt: 'add one pro or con that uses this idea, with a reason and evidence',
    save: 'Your claims are saved in the discussion. Copy the discussion link for your teacher.',
    link: { example: 'https://www.kialo-edu.com/p/…', help: 'Copy the address of the discussion from the browser bar.' },
  },
  khan: {
    key: 'khan-academy', name: 'Khan Academy', url: 'https://www.khanacademy.org',
    about: 'Free videos and practice exercises with instant feedback, from KG to Grade 12.',
    account: 'Join your teacher’s class with the class code (students under 13 need a parent or teacher to set up the account).',
    unit: 'practice set', open: 'Open Khan Academy and search for today’s topic.',
    tryIt: 'watch one short video on this idea, then do a practice set until you get 3 in a row right',
    save: 'Write your score and the hardest question in your notebook, and show your teacher.',
    offline: 'I recorded my practice score and showed my teacher',
  },
  diksha: {
    key: 'diksha', name: 'DIKSHA', url: 'https://diksha.gov.in',
    about: 'The Government of India’s free platform with NCERT textbooks, videos and practice for CBSE classes.',
    account: 'No account needed to read and watch. Choose your board, class and subject.',
    unit: 'chapter practice', open: 'Open DIKSHA, pick CBSE → your class → subject, and find today’s chapter.',
    tryIt: 'open the textbook or a video for this idea and answer one in-text question',
    save: 'Write your answers in your notebook and show your teacher.',
    offline: 'I wrote my answers in my notebook and showed my teacher',
  },
  interland: {
    key: 'interland', name: 'Interland (Be Internet Awesome)', url: 'https://beinternetawesome.withgoogle.com/en_us/interland',
    about: 'Google’s free online-safety game: four worlds about kindness, privacy, scams and strong passwords.',
    account: 'No account and no personal information needed.',
    unit: 'game level', open: 'Open Interland and choose the world that matches today’s lesson.',
    tryIt: 'play the level and notice where this idea helps you make a good choice',
    save: 'Tell your teacher (or write down) one choice you made in the game and why.',
    offline: 'I played the level and told my teacher what I learned',
  },
  blockly: {
    key: 'blockly-games', name: 'Blockly Games', url: 'https://blockly.games',
    about: 'Free logic and coding puzzles (Puzzle, Maze, Bird, Turtle) from Google.',
    account: 'No account needed.',
    unit: 'puzzle', open: 'Open Blockly Games and start with the game your teacher names (Maze is a great start).',
    tryIt: 'solve a level by planning your steps first, then test and fix them',
    save: 'Write down the highest level you reached and the rule you used, and show your teacher.',
    offline: 'I wrote down my level and strategy and showed my teacher',
  },
  readAlong: {
    key: 'read-along', name: 'Read Along by Google', url: 'https://readalong.google.com',
    about: 'A free reading buddy that listens as you read aloud and helps with tricky words. Your voice is processed on the device.',
    account: 'Ask a grown-up to open it for you.',
    unit: 'read-aloud', open: 'Open Read Along and pick a story at your level.',
    tryIt: 'read a page aloud and practise the words or sounds from today’s lesson',
    save: 'Tell your teacher which story you read and how many stars you got.',
    offline: 'I read aloud and told my teacher about it',
  },
  recorder: {
    key: 'device-recorder', name: 'your device’s voice or video recorder',
    about: 'Record yourself speaking, then play it back and check it against the lesson.',
    account: 'Recordings stay on your device. Only share them with your teacher, with your parent or guardian’s OK.',
    unit: 'recording', open: 'Open the voice-recorder or camera app on a phone, tablet or computer.',
    tryIt: 'record a 30-second practice that uses this idea, then listen back and try once more',
    save: 'Play your best take for your teacher (in class or at home).',
    offline: 'I played my best recording to my teacher',
  },
  notebook: {
    key: 'notebook', name: 'your activity notebook',
    about: 'Hands-on practice on paper with real objects — no screen needed.',
    account: 'Use a notebook, coloured pencils and things around you (coins, toys, food packets).',
    unit: 'notebook page', open: 'Open your notebook to a fresh page and write today’s date and lesson title.',
    tryIt: 'draw, write or act out an example of this idea with real things around you',
    save: 'Show your notebook page to your teacher (or take a photo with a grown-up’s help).',
    offline: 'I showed my notebook page to my teacher',
  },
  paper: {
    key: 'handwriting-book', name: 'your handwriting book',
    about: 'Practise on lined paper with a sharp pencil — the screen shows the strokes, the paper builds the habit.',
    account: 'Sit up straight, feet flat, paper tilted slightly, and hold the pencil in a relaxed tripod grip.',
    unit: 'handwriting page', open: 'Open your handwriting book to a fresh page and write the date at the top.',
    tryIt: 'write a row that practises this idea slowly, then circle your best one',
    save: 'Show your page to your teacher (or take a photo with a grown-up’s help).',
    offline: 'I showed my handwriting page to my teacher',
  },
};

/** Subject → platform (a single platform, or one per grade band). */
const MAP: Record<string, Platform | Partial<Record<Band, Platform>>> = {
  // Coding, AI & Technology (the Scratch flagship courses also have their own built-in Code Lab)
  'Scratch Junior': P.scratchJr,
  Scratch: P.scratch,
  Python: P.pythonLab,
  'MIT App Inventor': P.appInventor,
  'Micro:bit': P.microbit,
  'Web Development': P.webLab,
  'Artificial Intelligence': P.teachable,
  'Prompt Engineering': P.aiClass,
  'AI-Assisted Website Creation': P.webLab,
  Robotics: { '3-5': P.vexVR, '6-8': P.vexVR, '9-12': P.tinkercad },
  'Minecraft Education (MakeCode)': P.minecraft,
  'No-code Automation & AI Agents': P.diagrams,
  // Language & Communication
  'Handwriting & Penmanship': P.paper,
  'Spoken English': { 'K-2': P.readAlong, '3-5': P.readAlong, '6-8': P.recorder, '9-12': P.recorder },
  'English Grammar & Vocabulary': { 'K-2': P.storyweaver, '3-5': P.storyweaver, '6-8': P.googleDocs, '9-12': P.googleDocs },
  'Reading Comprehension': { 'K-2': P.storyweaver, '3-5': P.storyweaver, '6-8': P.storyweaver, '9-12': P.gutenberg },
  'Creative Writing': { '3-5': P.bookCreator, '6-8': P.googleDocs, '9-12': P.googleDocs },
  Storytelling: { 'K-2': P.storyweaver, '3-5': P.bookCreator, '6-8': P.bookCreator },
  'Public Speaking': { '3-5': P.recorder, '6-8': P.googleSlides, '9-12': P.googleSlides },
  'Debate & Communication': P.kialo,
  'Presentation Skills': P.googleSlides,
  // Academic Learning
  Mathematics: { 'K-2': P.polypad, '3-5': P.polypad, '6-8': P.geogebra, '9-12': P.desmos },
  Science: P.phet,
  English: { 'K-2': P.storyweaver, '3-5': P.storyweaver, '6-8': P.googleDocs, '9-12': P.googleDocs },
  'Environmental Studies': P.googleEarth,
  'Logical Reasoning': { '3-5': P.blockly, '6-8': P.blockly, '9-12': P.polypad },
  'Critical Thinking': P.kialo,
  'Olympiad Preparation': { '3-5': P.polypad, '6-8': P.geogebra, '9-12': P.geogebra },
  'Problem Solving': { '3-5': P.polypad, '6-8': P.polypad, '9-12': P.desmos },
  'Homework & Revision Support': P.khan,
  // School Board Curriculum
  CBSE: P.diksha,
  'ICSE / CISCE': P.khan,
  'Cambridge IGCSE': P.khan,
  // Life & Financial Skills
  'Financial Literacy': { 'K-2': P.notebook, '3-5': P.notebook, '6-8': P.googleSheets, '9-12': P.googleSheets },
  'Saving & Budgeting': { 'K-2': P.notebook, '3-5': P.notebook, '6-8': P.googleSheets, '9-12': P.googleSheets },
  'Needs vs Wants': { 'K-2': P.notebook, '3-5': P.notebook, '6-8': P.googleSheets },
  'Money Management': P.googleSheets,
  'Financial Decision-Making': P.googleSheets,
  Entrepreneurship: P.canva,
  'Digital Citizenship': { 'K-2': P.interland, '3-5': P.interland, '6-8': P.interland, '9-12': P.canva },
  'Study Skills': { '3-5': P.notebook, '6-8': P.googleCalendar, '9-12': P.googleCalendar },
};

export const PLATFORMS = P;

/** The platform a course uses, or null if it has none (e.g. Scratch flagships, which have their own). */
export function platformFor(subject: string, band: Band): Platform | null {
  if (band === 'Adult' || subject.startsWith('AI for ')) return P.aiWork;
  const m = MAP[subject];
  if (!m) return null;
  if ('key' in m) return m as Platform;
  const byBand = m as Partial<Record<Band, Platform>>;
  return byBand[band] || Object.values(byBand)[0] || null;
}

/** Every subject that has a platform (used by tests to prove full coverage). */
export const MAPPED_SUBJECTS = Object.keys(MAP);

/** Marker stored on generated activities so upgrades can find (and never duplicate) them. */
export const PLATFORM_TAG = 'platform-v1';

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const noDot = (s: string) => s.replace(/[.!?]+$/, '');
const minWordsFor = (band: Band) => ({ 'K-2': 6, '3-5': 12, '6-8': 15, '9-12': 20, Adult: 25 })[band];
const young = (band: Band) => band === 'K-2';

/** Build-along steps for the Learn screen, using the lesson's own ideas. */
export function platformBuild(p: Platform, spec: Pick<CourseSpec, 'band'>, l: LessonSpec): BuildAlong {
  const ideas = l.cards.slice(0, 3);
  return {
    title: `Do it in ${p.name}`,
    intro: `${p.about} ${p.account}`,
    ...(p.url ? { tool: { name: p.name, url: p.url } } : {}),
    steps: [
      { title: `Open ${p.name}`, text: p.open, tip: p.builtin ? undefined : young(spec.band) ? 'Ask a grown-up to help you open it.' : p.account },
      ...ideas.map(([emoji, title, body]) => ({ title: `${emoji} Try it: ${title}`, text: `${body} Now ${p.tryIt}.` })),
      { title: '🎯 Show today’s goal', text: `Use ${p.name} to ${lowerFirst(noDot(l.o))}.` },
      { title: '💾 Save and share', text: p.save },
    ],
  };
}

/** Teacher-panel link for the platform. */
export function platformResource(p: Platform) {
  return { title: `Platform: ${p.name}`, kind: 'link' as const, ...(p.url ? { url: p.url } : {}), body: `${p.about} ${p.account} Students hand in: ${p.save}` };
}

// ── Built-in lab helpers ─────────────────────────────────────

const PY_FEATURES: [RegExp, PyCheck & { t: 'uses' }][] = [
  [/function|\bdef\b/i, { t: 'uses', what: ['def'], msg: 'Define your own function with def' }],
  [/\blists?\b/i, { t: 'uses', what: ['list'], msg: 'Use a list' }],
  [/dictionar/i, { t: 'uses', what: ['dict'], msg: 'Use a dictionary' }],
  [/\binput\b/i, { t: 'uses', what: ['input'], msg: 'Ask the user something with input()' }],
  [/\bif\b|decision|condition|elif|else/i, { t: 'uses', what: ['if'], msg: 'Make a decision with if' }],
];
/** A program that uses every feature above, so the generated checks are known to be solvable. */
const PY_SOLUTION = [
  '# My project',
  'def double(n):',
  '    return n * 2',
  '',
  'scores = [3, 5, 8]',
  'info = {"name": "Asha", "level": 2}',
  'name = input("What is your name? ")',
  'if len(name) > 0:',
  '    print("Hello", name)',
  'else:',
  '    print("Hello, coder")',
  'print("Double of", scores[0], "is", double(scores[0]))',
  'print(info["name"], "is on level", info["level"])',
].join('\n');

function pythonActivity(p: Platform, spec: Pick<CourseSpec, 'band' | 'subject'>, l: LessonSpec) {
  const text = `${l.t} ${l.o}`;
  const extra = PY_FEATURES.filter(([re]) => re.test(text)).map(([, c]) => c);
  const checks: PyCheck[] = [{ t: 'noError', msg: 'Your program runs without errors' }, { t: 'uses', what: ['print'], msg: 'It prints something with print()' }, ...extra];
  const starter = `# ${l.t}\n# Goal: ${noDot(l.o)}\n# Write your program below, then press Run.\n\n`;
  return {
    phase: 'perform' as const,
    type: 'python_lab',
    title: `Python Lab: ${l.t}`,
    instructions: 'Write and run real Python here, then press Check. Your teacher reviews the finished program.',
    config: {
      mode: 'project',
      task: `Write a short Python program that shows today’s idea: ${lowerFirst(noDot(l.o))}.`,
      starter,
      goals: checks.map((c) => c.msg),
      sampleInputs: ['5'],
      requirements: [`Shows: ${noDot(l.o)}`, ...l.cards.slice(0, 2).map(([, t]) => `Uses the idea “${t}”`), 'Has at least one # comment explaining your code'],
      reflection: 'What does your program do? Which line was hardest to get right, and how did you fix it?',
      minWords: minWordsFor(spec.band),
      platform: { name: p.name, key: p.key },
      tag: PLATFORM_TAG,
    },
    answer_key: { checks, solution: PY_SOLUTION, inputs: ['5', '5', '5', '5', '5', '5', '5', '5'], explanation: 'Your program runs — your teacher will review it.' },
    hints: ['Start small: get one print() line working, then add the next idea.', 'Read the error message: it names the line and gives a hint.'],
    points: 15,
  };
}

const WEB_FEATURES: [RegExp, WebCheck][] = [
  [/\bcss\b|style|colou?r|font|background/i, { t: 'css', msg: 'Style your page with CSS (a <style> block)' }],
  [/\blinks?\b|hyperlink|navigation|\bnav\b/i, { t: 'tag', tags: ['a'], msg: 'Add a link with <a href="…">' }],
  [/image|picture|\bimg\b/i, { t: 'tag', tags: ['img'], msg: 'Add an image with <img src="…" alt="…">' }],
  [/\blists?\b/i, { t: 'tag', tags: ['ul', 'ol'], msg: 'Add a list with <ul> or <ol>' }],
  [/table/i, { t: 'tag', tags: ['table'], msg: 'Add a table with <table>' }],
  [/form|input|button/i, { t: 'tag', tags: ['form', 'input', 'button'], msg: 'Add a form control (<input> or <button>)' }],
  [/layout|flex|grid|responsive|section|semantic/i, { t: 'tag', tags: ['header', 'main', 'section', 'nav', 'footer', 'div'], msg: 'Organise your page into sections (<header>, <main>, <section> or <div>)' }],
];
const WEB_STARTER = (title: string) =>
  `<!-- ${title} -->\n<style>\n  body { font-family: sans-serif; padding: 16px; }\n</style>\n\n<h1>My page</h1>\n<p>Write about today’s idea here.</p>\n`;
const WEB_SOLUTION = `<style>
  body { font-family: sans-serif; color: #223; background: #fffaf0; }
  h1 { color: #b4400a; }
</style>
<header><h1>All about my hobby</h1><nav><a href="#more">More</a></nav></header>
<main>
  <section id="more">
    <p>I love painting with watercolours because the colours mix on the paper in surprising ways.</p>
    <img src="paint.png" alt="A watercolour painting of a sunset">
    <ul><li>Brushes</li><li>Paper</li><li>Water</li></ul>
    <table><tr><th>Colour</th><th>Mood</th></tr><tr><td>Blue</td><td>Calm</td></tr></table>
    <form><input type="text" placeholder="Your favourite colour"><button>Send</button></form>
  </section>
</main>`;

function webActivity(p: Platform, spec: Pick<CourseSpec, 'band' | 'subject'>, l: LessonSpec) {
  const text = `${l.t} ${l.o}`;
  const extra = WEB_FEATURES.filter(([re]) => re.test(text)).map(([, c]) => c);
  const checks: WebCheck[] = [{ t: 'tag', tags: ['h1', 'h2', 'h3'], msg: 'Give your page a heading (<h1>)' }, { t: 'text', min: 60, msg: 'Write at least 60 characters of your own words on the page' }, ...extra];
  const ai = spec.subject === 'AI-Assisted Website Creation';
  return {
    phase: 'perform' as const,
    type: 'web_lab',
    title: `Web Lab: ${l.t}`,
    instructions: 'Edit the HTML and CSS on the left; the preview updates as you type. Press Check when you are ready.',
    config: {
      mode: 'project',
      task: `Build a small web page that shows today’s idea: ${lowerFirst(noDot(l.o))}.`,
      starter: WEB_STARTER(l.t),
      goals: checks.map((c) => c.msg),
      requirements: [
        `Shows: ${noDot(l.o)}`,
        ...l.cards.slice(0, 2).map(([, t]) => `Uses the idea “${t}”`),
        ai ? 'You checked and edited any AI-suggested text or code yourself (and said so on the page)' : 'Every image has alt text; text is easy to read',
      ],
      reflection: ai ? 'Which parts did AI help with, what did you change, and how did you check it was correct?' : 'What did you build? Which tag or style rule was hardest, and how did you fix it?',
      minWords: minWordsFor(spec.band),
      platform: { name: p.name, key: p.key },
      tag: PLATFORM_TAG,
    },
    answer_key: { checks, solution: WEB_SOLUTION, explanation: 'Your page meets the checks — your teacher will review it.' },
    hints: ['Change one thing, look at the preview, then change the next.', 'Every opening tag like <p> needs a closing tag like </p>.'],
    points: 15,
  };
}

/** The Perform activity that has the learner do this lesson in the course's platform. */
export function platformActivity(p: Platform, spec: Pick<CourseSpec, 'band' | 'subject'>, l: LessonSpec) {
  if (p.builtin === 'python') return pythonActivity(p, spec, l);
  if (p.builtin === 'web') return webActivity(p, spec, l);
  const kid = young(spec.band);
  const adult = spec.band === 'Adult';
  const ideas = l.cards.slice(0, 2).map(([, t]) => t);
  return {
    phase: 'perform' as const,
    type: 'project',
    title: `Do it in ${p.name}`,
    instructions: p.url ? `Open ${p.name} (button in “Do it in ${p.name}” above), follow the steps, then fill in this hand-in.` : `Follow the “Do it in ${p.name}” steps above, then fill in this hand-in.`,
    config: {
      brief: adult
        ? `Use ${p.name} on a real (anonymised) task from your work: ${lowerFirst(noDot(l.o))}.`
        : `Use ${p.name} to ${lowerFirst(noDot(l.o))}.`,
      requirements: [
        kid ? `I opened ${p.name}` : `I opened ${p.name} and started a new ${p.unit}`,
        ...ideas.map((t) => (kid ? `I tried “${t}”` : `My ${p.unit} shows “${t}”`)),
        adult ? 'I checked the output for errors and removed any confidential data' : kid ? 'I showed my work' : `I saved my ${p.unit}`,
      ],
      reflection: kid
        ? `What did you do in ${p.name}? What was fun or tricky?`
        : adult
          ? `What did you try, what did ${p.name} get right or wrong, and how will you use this at work?`
          : `What did you make or find out in ${p.name}? What was tricky, and how did you fix it?`,
      minWords: minWordsFor(spec.band),
      tips: [p.tryIt[0].toUpperCase() + p.tryIt.slice(1) + '.', p.save, p.account],
      anyLink: true,
      platform: { name: p.name, key: p.key, ...(p.url ? { url: p.url } : {}) },
      ...(p.link ? { link: p.link } : { offlineOnly: true }),
      offlineLabel: p.offline || `I can’t share a link — I’ll show my ${p.unit} to my ${adult ? 'trainer' : 'teacher'}`,
      tag: PLATFORM_TAG,
    },
    answer_key: {},
    hints: [`Follow the steps in “Do it in ${p.name}” one at a time.`, p.save],
    points: 15,
  };
}

// ── More places to practise ──────────────────────────────────
// Free, well-known external sites for extra practice, per subject. Shown on every lesson's Learn
// screen ("More places to practise"), in the teacher's Resources tab, in live classes, on the
// printable worksheet, and added to each course's resources (so they are searchable).
// `teen`: needs the learner to be 13+ (shown only for Grades 9–12 and adults).
// `young`: aimed at K–5 (hidden for Grades 6–12 and adults).
export interface PracticeLink {
  name: string;
  url: string;
  what: string;
  teen?: boolean;
  young?: boolean;
}
const L = (name: string, url: string, what: string, opt: { teen?: boolean; young?: boolean } = {}): PracticeLink => ({ name, url, what, ...opt });

const X = {
  scratch: L('Scratch', 'https://scratch.mit.edu/projects/editor/', 'MIT’s block-coding editor: games, animations and stories.'),
  scratchIdeas: L('Scratch Tutorials', 'https://scratch.mit.edu/ideas', 'Step-by-step project ideas and video tutorials.'),
  scratchJr: L('ScratchJr', 'https://www.scratchjr.org', 'Free picture-block coding app for ages 5–7.', { young: true }),
  codeOrg: L('Code.org', 'https://code.org/learn', 'Free coding courses and Hour of Code puzzles for every age.'),
  blockly: L('Blockly Games', 'https://blockly.games', 'Logic and coding puzzles (Maze, Bird, Turtle).'),
  lightbot: L('Lightbot', 'https://lightbot.com', 'Puzzle game that teaches sequences, procedures and loops.'),
  pyTutor: L('Python Tutor', 'https://pythontutor.com', 'Step through Python code and watch every variable change.'),
  programiz: L('Programiz Python compiler', 'https://www.programiz.com/python-programming/online-compiler/', 'Run Python in the browser — no account needed.'),
  turtle: L('Coddy Turtle Playground', 'https://coddy.tech/playground/turtle', 'Draw with Python turtle in the browser.'),
  colab: L('Google Colab', 'https://colab.research.google.com', 'Python notebooks in the cloud — great for data and AI.', { teen: true }),
  exercism: L('Exercism (Python)', 'https://exercism.org/tracks/python', 'Free Python exercises with mentoring.', { teen: true }),
  appInventor: L('MIT App Inventor', 'https://ai2.appinventor.mit.edu', 'Build Android/iPhone apps with blocks.'),
  aiTutorials: L('App Inventor tutorials', 'https://appinventor.mit.edu/explore/ai2/tutorials', 'Beginner-to-advanced app tutorials from MIT.'),
  thunkable: L('Thunkable', 'https://thunkable.com', 'Drag-and-drop app builder.', { teen: true }),
  makecode: L('MakeCode for micro:bit', 'https://makecode.microbit.org', 'Blocks or JavaScript with an on-screen micro:bit simulator.'),
  mbPython: L('micro:bit Python Editor', 'https://python.microbit.org', 'Program the micro:bit in MicroPython (has a simulator).'),
  mbProjects: L('micro:bit projects', 'https://microbit.org/projects/make-it-code-it/', 'Ready-made projects with step-by-step guides.'),
  minecraft: L('MakeCode for Minecraft', 'https://minecraft.makecode.com', 'Code the Agent in Minecraft Education.'),
  mcEdu: L('Minecraft Education', 'https://education.minecraft.net', 'Lessons, worlds and coding challenges.'),
  mcCodeOrg: L('Code.org Minecraft', 'https://code.org/minecraft', 'Free Minecraft Hour of Code tutorials (no licence needed).'),
  mdn: L('MDN Learn web development', 'https://developer.mozilla.org/en-US/docs/Learn_web_development', 'Mozilla’s free, trusted HTML/CSS/JS course.'),
  w3: L('W3Schools Tryit editor', 'https://www.w3schools.com/html/tryit.asp?filename=tryhtml_default', 'Edit HTML and see the result instantly.'),
  fcc: L('freeCodeCamp', 'https://www.freecodecamp.org/learn', 'Free interactive web-development curriculum.', { teen: true }),
  codepen: L('CodePen', 'https://codepen.io/pen/', 'Online HTML/CSS/JS editor with shareable links.', { teen: true }),
  googleSites: L('Google Sites', 'https://sites.google.com', 'Make a simple website with your school account.'),
  teachable: L('Teachable Machine', 'https://teachablemachine.withgoogle.com/train', 'Train your own image, sound or pose model.'),
  ml4k: L('Machine Learning for Kids', 'https://machinelearningforkids.co.uk', 'Train models and use them in Scratch projects.'),
  quickdraw: L('Quick, Draw!', 'https://quickdraw.withgoogle.com', 'Doodle and watch a neural network guess it.'),
  oceans: L('AI for Oceans (Code.org)', 'https://code.org/oceans', 'Train an AI to clean the ocean; learn about bias.'),
  dayOfAi: L('Day of AI (MIT RAISE)', 'https://dayofai.org', 'Free K–12 AI literacy lessons and activities.'),
  learnPrompting: L('Learn Prompting', 'https://learnprompting.org', 'Free open guide to prompt engineering.', { teen: true }),
  claudeGuide: L('Prompt engineering guide (Anthropic)', 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview', 'Clear, worked prompting techniques.', { teen: true }),
  elementsAi: L('Elements of AI', 'https://www.elementsofai.com', 'Free online course on what AI is and isn’t.', { teen: true }),
  msLearn: L('Microsoft Learn (AI)', 'https://learn.microsoft.com/en-us/training/', 'Free AI and Copilot training paths.', { teen: true }),
  indiaAi: L('IndiaAI', 'https://indiaai.gov.in', 'India’s national AI portal: news, use cases and courses.', { teen: true }),
  diagrams: L('diagrams.net', 'https://app.diagrams.net', 'Draw flowcharts and workflows — no account needed.'),
  forms: L('Google Forms', 'https://forms.new', 'Collect answers and trigger simple workflows.'),
  sheets: L('Google Sheets', 'https://sheets.new', 'Spreadsheets for budgets, trackers and formulas.'),
  appsScript: L('Google Apps Script', 'https://script.google.com', 'Automate Sheets, Forms and Gmail with code.', { teen: true }),
  vex: L('VEXcode VR', 'https://vr.vex.com', 'Program a virtual robot with blocks or Python.'),
  tinkercad: L('Tinkercad Circuits', 'https://www.tinkercad.com/circuits', 'Build and simulate Arduino circuits.'),
  wokwi: L('Wokwi', 'https://wokwi.com', 'Free online Arduino, ESP32 and Raspberry Pi Pico simulator.', { teen: true }),
  roberta: L('Open Roberta Lab', 'https://lab.open-roberta.org', 'Program real and simulated robots with blocks.'),
  polypad: L('Polypad', 'https://polypad.amplify.com', 'Virtual maths manipulatives: tiles, fractions, shapes.'),
  geogebra: L('GeoGebra', 'https://www.geogebra.org/classic', 'Geometry, graphs and algebra tools.'),
  desmos: L('Desmos Graphing', 'https://www.desmos.com/calculator', 'Graph any equation with sliders.'),
  desmosSci: L('Desmos Scientific', 'https://www.desmos.com/scientific', 'Free online scientific calculator.'),
  khanMath: L('Khan Academy Maths', 'https://www.khanacademy.org/math', 'Videos and practice with instant feedback.'),
  nrich: L('NRICH', 'https://nrich.maths.org', 'Rich maths problems and games from Cambridge University.'),
  mathPlayground: L('Math Playground', 'https://www.mathplayground.com', 'Maths games and logic puzzles.', { young: true }),
  alcumus: L('AoPS Alcumus', 'https://artofproblemsolving.com/alcumus', 'Adaptive competition-maths problems.', { teen: true }),
  bebras: L('Bebras Challenge', 'https://www.bebras.org', 'Computational-thinking puzzles used in schools worldwide.'),
  lichess: L('Lichess puzzles', 'https://lichess.org/training', 'Free chess puzzles that build logical thinking.'),
  phet: L('PhET Simulations', 'https://phet.colorado.edu/en/simulations/browse', 'Interactive science and maths simulations.'),
  olabs: L('OLabs (virtual labs)', 'https://www.olabs.edu.in', 'Virtual science labs for Classes 9–12, from Amrita & CDAC.'),
  khanSci: L('Khan Academy Science', 'https://www.khanacademy.org/science', 'Science videos and practice.'),
  ck12: L('CK-12', 'https://www.ck12.org', 'Free textbooks, simulations and practice.'),
  nasa: L('NASA Space Place', 'https://spaceplace.nasa.gov', 'Space and Earth science games and activities.'),
  wonder: L('Wonderopolis', 'https://www.wonderopolis.org', 'A new “wonder” question to explore every day.'),
  natgeoKids: L('National Geographic Kids', 'https://kids.nationalgeographic.com', 'Animals, places and science for kids.', { young: true }),
  earth: L('Google Earth', 'https://earth.google.com/web', 'Explore real places, landforms and rivers.'),
  storyweaver: L('StoryWeaver', 'https://storyweaver.org.in', 'Free picture books in English and Indian languages.'),
  readAlong: L('Read Along by Google', 'https://readalong.google.com', 'A reading buddy that listens and helps.', { young: true }),
  storyline: L('Storyline Online', 'https://storylineonline.net', 'Picture books read aloud by actors.', { young: true }),
  bcKids: L('LearnEnglish Kids (British Council)', 'https://learnenglishkids.britishcouncil.org', 'Songs, stories, grammar and speaking games.', { young: true }),
  bcTeens: L('LearnEnglish Teens (British Council)', 'https://learnenglishteens.britishcouncil.org', 'Grammar, vocabulary, reading and listening practice.'),
  bbcEnglish: L('BBC Learning English', 'https://www.bbc.co.uk/learningenglish', 'Pronunciation, grammar and real-life English.'),
  commonlit: L('CommonLit', 'https://www.commonlit.org', 'Free reading passages with questions (Grades 3–12).'),
  vocab: L('Vocabulary.com', 'https://www.vocabulary.com', 'Adaptive vocabulary practice.', { teen: true }),
  gutenberg: L('Project Gutenberg', 'https://www.gutenberg.org', 'Over 70,000 free classic books.'),
  bookCreator: L('Book Creator', 'https://app.bookcreator.com', 'Make your own e-book with pictures and voice.'),
  storyJumper: L('StoryJumper', 'https://www.storyjumper.com', 'Write and illustrate your own story book.'),
  docs: L('Google Docs', 'https://docs.new', 'Write and share documents with your school account.'),
  slides: L('Google Slides', 'https://slides.new', 'Make slides with speaker notes.'),
  canva: L('Canva for Education', 'https://www.canva.com/education/', 'Posters, slides and designs — free for K–12 schools.'),
  tedEd: L('TED-Ed', 'https://ed.ted.com', 'Short animated lessons and talks to learn from.'),
  kialo: L('Kialo Edu', 'https://www.kialo-edu.com', 'Map arguments for and against a claim.'),
  khan: L('Khan Academy', 'https://www.khanacademy.org', 'Free videos and practice in every subject.'),
  bitesize: L('BBC Bitesize', 'https://www.bbc.co.uk/bitesize', 'Revision guides, videos and quizzes.'),
  anki: L('Anki', 'https://apps.ankiweb.net', 'Spaced-repetition flashcards for revision.', { teen: true }),
  pomofocus: L('Pomofocus', 'https://pomofocus.io', 'A simple Pomodoro study timer.'),
  keep: L('Google Keep', 'https://keep.google.com', 'Checklists and quick notes.'),
  calendar: L('Google Calendar', 'https://calendar.google.com', 'Plan study sessions and deadlines.'),
  diksha: L('DIKSHA', 'https://diksha.gov.in', 'Free NCERT/CBSE e-content, videos and practice.'),
  ncert: L('NCERT textbooks', 'https://ncert.nic.in/textbook.php', 'Free official NCERT textbooks (PDF).'),
  epathshala: L('ePathshala', 'https://epathshala.nic.in', 'NCERT e-books, audio and video.'),
  cisce: L('CISCE', 'https://cisce.org', 'Official ICSE/ISC syllabus and specimen papers.'),
  cambridge: L('Cambridge International', 'https://www.cambridgeinternational.org', 'Official IGCSE syllabuses and specimen papers.'),
  pmt: L('Physics & Maths Tutor', 'https://www.physicsandmathstutor.com', 'Free past papers and revision notes.', { teen: true }),
  moneySkills: L('Practical Money Skills', 'https://www.practicalmoneyskills.com', 'Free money games and lessons for every age.'),
  ncfe: L('NCFE (National Centre for Financial Education)', 'https://ncfe.org.in', 'India’s financial-education body: guides and the NFLAT quiz.'),
  sebi: L('SEBI Investor Education', 'https://investor.sebi.gov.in', 'Saving, investing and avoiding frauds (India).', { teen: true }),
  khanMoney: L('Khan Academy Financial Literacy', 'https://www.khanacademy.org/college-careers-more/financial-literacy', 'Budgeting, saving, credit and more.', { teen: true }),
  interland: L('Interland (Be Internet Awesome)', 'https://beinternetawesome.withgoogle.com/en_us/interland', 'Online-safety game: kindness, privacy, scams.'),
  commonSense: L('Common Sense Education', 'https://www.commonsense.org/education/digital-citizenship', 'Digital-citizenship lessons and videos.'),
  isea: L('ISEA cyber awareness', 'https://www.isea.gov.in', 'Government of India cyber-safety awareness material.'),
  k5: L('K5 Learning', 'https://www.k5learning.com', 'Free printable handwriting and cursive worksheets.'),
};

const PRACTICE: Record<string, PracticeLink[]> = {
  'Scratch Junior': [X.scratchJr, X.codeOrg, X.lightbot],
  Scratch: [X.scratch, X.scratchIdeas, X.codeOrg, X.ml4k, X.blockly],
  Python: [X.pyTutor, X.programiz, X.turtle, X.colab, X.exercism],
  'MIT App Inventor': [X.appInventor, X.aiTutorials, X.codeOrg, X.thunkable],
  'Micro:bit': [X.makecode, X.mbPython, X.mbProjects],
  'Web Development': [X.mdn, X.w3, X.codeOrg, X.fcc, X.codepen],
  'Artificial Intelligence': [X.teachable, X.ml4k, X.quickdraw, X.oceans, X.dayOfAi],
  'Prompt Engineering': [X.dayOfAi, X.oceans, X.quickdraw, X.learnPrompting, X.claudeGuide, X.elementsAi],
  'AI-Assisted Website Creation': [X.mdn, X.w3, X.googleSites, X.codepen, X.learnPrompting],
  Robotics: [X.vex, X.roberta, X.tinkercad, X.wokwi, X.makecode],
  'Minecraft Education (MakeCode)': [X.minecraft, X.mcEdu, X.mcCodeOrg],
  'No-code Automation & AI Agents': [X.diagrams, X.forms, X.sheets, X.appsScript],
  'Handwriting & Penmanship': [X.k5, X.storyweaver, X.bookCreator],
  'Spoken English': [X.readAlong, X.bcKids, X.storyline, X.bcTeens, X.bbcEnglish, X.tedEd, X.storyweaver],
  'English Grammar & Vocabulary': [X.bcKids, X.bcTeens, X.storyweaver, X.vocab, X.bbcEnglish],
  'Reading Comprehension': [X.storyweaver, X.readAlong, X.storyline, X.commonlit, X.gutenberg],
  'Creative Writing': [X.bookCreator, X.storyJumper, X.docs, X.storyweaver],
  Storytelling: [X.storyweaver, X.storyline, X.bookCreator, X.storyJumper],
  'Public Speaking': [X.tedEd, X.slides, X.bbcEnglish, X.bcTeens],
  'Debate & Communication': [X.kialo, X.tedEd, X.bbcEnglish],
  'Presentation Skills': [X.slides, X.canva, X.tedEd],
  Mathematics: [X.polypad, X.mathPlayground, X.khanMath, X.geogebra, X.desmos, X.nrich],
  Science: [X.phet, X.nasa, X.wonder, X.khanSci, X.ck12, X.olabs],
  English: [X.storyweaver, X.bcKids, X.commonlit, X.bcTeens, X.gutenberg],
  'Environmental Studies': [X.earth, X.natgeoKids, X.nasa, X.wonder],
  'Logical Reasoning': [X.blockly, X.bebras, X.lichess, X.nrich],
  'Critical Thinking': [X.kialo, X.tedEd, X.bebras, X.wonder],
  'Olympiad Preparation': [X.nrich, X.bebras, X.khanMath, X.alcumus, X.olabs],
  'Problem Solving': [X.nrich, X.polypad, X.bebras, X.lichess, X.desmos],
  'Homework & Revision Support': [X.khan, X.bitesize, X.pomofocus, X.anki],
  CBSE: [X.diksha, X.ncert, X.epathshala, X.olabs, X.khan],
  'ICSE / CISCE': [X.cisce, X.khan, X.olabs, X.bitesize],
  'Cambridge IGCSE': [X.cambridge, X.pmt, X.bitesize, X.khan, X.phet],
  'Financial Literacy': [X.moneySkills, X.ncfe, X.khanMoney, X.sheets],
  'Saving & Budgeting': [X.moneySkills, X.sheets, X.ncfe, X.khanMoney],
  'Needs vs Wants': [X.moneySkills, X.ncfe, X.mathPlayground, X.sheets],
  'Money Management': [X.sheets, X.ncfe, X.sebi, X.khanMoney, X.moneySkills],
  'Financial Decision-Making': [X.sebi, X.ncfe, X.khanMoney, X.sheets, X.moneySkills],
  Entrepreneurship: [X.canva, X.forms, X.sheets, X.slides],
  'Digital Citizenship': [X.interland, X.commonSense, X.isea],
  'Study Skills': [X.pomofocus, X.keep, X.calendar, X.khan, X.anki],
};
const PRO_PRACTICE = [X.learnPrompting, X.claudeGuide, X.elementsAi, X.msLearn, X.indiaAi];

/** Practice links for a course: its main platform first, then extra sites that suit the age group. */
export function practiceLinks(subject: string, band: Band, max = 5): PracticeLink[] {
  const p = platformFor(subject, band);
  const list = band === 'Adult' || subject.startsWith('AI for ') ? PRO_PRACTICE : PRACTICE[subject] || [X.khan];
  const kidsBand = band === 'K-2' || band === '3-5';
  const teenOk = band === '9-12' || band === 'Adult';
  const fits = (l: PracticeLink) => (!l.teen || teenOk) && (!l.young || kidsBand);
  const out: PracticeLink[] = [];
  if (p?.url) out.push({ name: p.name[0].toUpperCase() + p.name.slice(1), url: p.url, what: p.about });
  for (const l of list) if (fits(l) && !out.some((o) => new URL(o.url).hostname === new URL(l.url).hostname && o.url.split('?')[0] === l.url.split('?')[0])) out.push(l);
  return out.slice(0, max);
}

/** Teacher-panel resource items for the practice links. */
export function practiceResources(links: PracticeLink[]) {
  return links.map((l) => ({ title: `Practise: ${l.name}`, kind: 'link' as const, url: l.url, body: l.what }));
}
