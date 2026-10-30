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
