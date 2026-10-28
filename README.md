# Kitabash — universal AI learning platform (v0.1)

**Engaging learning. Easy understanding. Practical activities. Less teacher preparation.**

Kitabash is a configurable learning engine. Administrators create any course — handwriting, spoken English, maths, financial literacy, coding, a board syllabus, an Olympiad pathway, or a subject that doesn't exist yet — **without changing code**. They then ground a course-specific AI learning agent in their own materials, generate and review Learn → Perform → Probe lessons, test the agent in a sandbox, and publish. Students learn through interactive activities; teachers run lessons with a right-hand resource panel that assembles itself from the course data, and can teach small **live video classes** (up to about 10 students).

It ships with a ready-to-use **K-12 course library**: **348 courses** (1,392 lessons) across 41 subjects in five categories. The courses sit in four grade bands (K–2, 3–5, 6–8, 9–12), and each band has a **Beginner → Intermediate → Advanced** level ladder, which gives learners a clear next step to sign up for.

---

## Getting started: no technical knowledge needed

Pick **one** of these. Neither needs typing commands.

| | **A. Put it online** | **B. Run it on your own computer** |
|---|---|---|
| Best for | Using it with teachers and students | Trying it out yourself |
| You need | Free accounts on GitHub, Supabase and Render | A Windows or Mac computer |
| Time | ~20 minutes, once | ~5 minutes the first time |
| Cost | Free tiers are enough to start | Free |

---

### A. Put it online (everything in your web browser)

**Step 1: put the code on GitHub** (stores your copy of Kitabash)
1. Make a free account at [github.com](https://github.com) and sign in.
2. Click **+** (top right) → **New repository**. Name it `kitabash`, choose **Private**, and click **Create repository**.
3. On the next page click **uploading an existing file**.
4. Open the unzipped `kitabash` folder on your computer, select **everything inside it** (not the `kitabash` folder itself), and drag it into the browser window. Wait for the upload to finish, then click **Commit changes**. Check that `render.yaml` and `package.json` appear in the list at the top level of your repository.
   *Files whose names start with a dot (like `.gitignore`) may be hidden on your computer and skipped. That's fine.*
   *(If GitHub says there are too many files, upload in two batches, or use [GitHub Desktop](https://desktop.github.com): File → Add local repository → Publish.)*

**Step 2: create your database on Supabase** (stores courses, accounts and progress safely)
1. Make a free account at [supabase.com](https://supabase.com) → **New project**.
2. Choose a name, type a **database password**, and **write the password down**. Pick the region closest to you (e.g. *Mumbai*). Click **Create new project** and wait about 2 minutes.
3. Click **Connect** at the top of the page. Under *Connection string*, choose **Session pooler** and click **Copy**.
4. Paste it into a note. Replace `[YOUR-PASSWORD]` with the password you wrote down. Special characters are fine; no encoding needed. This is your **database link**.
5. *Optional, for uploaded files:* go to **Project Settings → API** and copy the **Project URL** and the **service_role** key (click *Reveal*). Keep the key private.

**Step 3: launch it on Render** (runs the website)
1. Make a free account at [render.com](https://render.com) using **Sign in with GitHub**.
2. Click **New +** → **Blueprint** → choose your `kitabash` repository → **Connect**.
3. Render asks for a few values:
   - `DATABASE_URL`: paste your **database link** from Step 2.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: paste the two optional values from Step 2.5 (otherwise uploaded documents are lost whenever the free server restarts).
4. Click **Apply**. The first build takes about 5 minutes.

**Step 4: open your site and finish setup**
1. In Render, click your **kitabash** service and open its address (`https://kitabash-….onrender.com`).
2. The **Welcome! Let’s set up Kitabash** page appears. It asks for a **setup code**: in Render, open **Environment** and copy the value of `SETUP_CODE`. This stops strangers setting up your site before you do.
3. Enter your name, email and a password. Keep **Install the full K-12 course library** ticked (recommended), and optionally **Add 4 sample courses**. Then click **Create my account and start**. The library finishes installing in the background, usually within a minute, and you can check its progress under **Platform → Course library**.

You're in. Add teachers and students under **Platform → People**.

> **Good to know:** Render's free plan sleeps after 15 minutes without visitors, so the first visit after that takes about a minute to wake up. Supabase's free plan pauses a project after a week of no use; open the Supabase dashboard to resume it.

**Updating later:** upload the new files to the same GitHub repository. Render rebuilds automatically, and your data stays in Supabase.

---

### B. Run it on your own computer

1. Install **Node.js**: go to [nodejs.org](https://nodejs.org), download the **LTS** version, and install it like any other program. You only do this once.
2. Unzip the `kitabash` folder somewhere easy, such as Documents.
3. Double-click:
   - **Windows:** `start-windows.bat`
   - **Mac:** `start-mac.command` *(the first time, right-click it → **Open** → **Open**, because macOS asks before running downloaded files)*
4. A black window appears. The first time it downloads what it needs (a few minutes). Then your browser opens at **http://localhost:3000** with the setup page.
5. Create your account. Keep the black window open while you use Kitabash; close it to stop.

Your data is saved in the `data` folder inside `kitabash`. To use your Supabase database instead, copy `.env.example` to a new file named `.env`, paste your database link after `DATABASE_URL=`, and start again.

---

## Troubleshooting (plain language)

| What you see | What to do |
|---|---|
| “The database password is wrong” | In Supabase: **Project Settings → Database → Reset database password**. Put the new password into `DATABASE_URL` on Render (**Environment** → edit) and click **Save**. |
| “DATABASE_URL still contains [YOUR-PASSWORD]” | Replace `[YOUR-PASSWORD]` with your real database password. |
| “The database address could not be found” / “cannot reach” | Copy the link again from Supabase → **Connect** → **Session pooler** (not *Direct connection*). |
| “Supabase did not recognise the user name” | Copy the whole Session pooler link again; the user looks like `postgres.abcdefghij`. |
| “The database did not answer” | Your Supabase project may be paused: open the Supabase dashboard to resume it, then reload. |
| Setup page warns that data would be lost | `DATABASE_URL` isn't set on Render. Add it under **Environment** and save. |
| “The setup code is not correct” | Copy `SETUP_CODE` from Render → your service → **Environment** again (no spaces). |
| Render build failed | Open **Logs** in Render. Usually a value was pasted with extra spaces; fix it and click **Manual Deploy**. |
| Windows says “Windows protected your PC” | Click **More info → Run anyway**. Our start file only installs and runs Kitabash. |
| Mac says the file can’t be opened | Right-click `start-mac.command` → **Open** → **Open**. |
| “Port 3000 is already in use” | Kitabash is already running; open http://localhost:3000. |

---

## For developers

### Run with npm

You need **Node.js 22.13 or newer** ([nodejs.org](https://nodejs.org) → LTS). Check with `node -v`.

```bash
npm install
npm run build
npm run db:seed      # demo catalogue, 4 courses, 5 accounts
npm start            # → open http://localhost:3000
```

With no `.env`, data is stored in a local SQLite file (`./data`). `npm start` without seeding opens the first-run setup page instead.

#### Demo accounts (sample data, local only)

| Role | Email | Password | What to try |
|---|---|---|---|
| Admin | `admin@kitabash.local` | `Admin#2026` | Studio → *Maths: Patterns & Sequences* (draft) → walk steps 1–7 |
| Instructor | `teacher@kitabash.local` | `Teach#2026` | Teach → *Money Smart* → resource panel, projection mode, AI co-facilitator |
| Student | `aarav@kitabash.local` | `Learn#2026` | *Money Smart* → *Needs or wants?* (guardian consent given) |
| Student | `meera@kitabash.local` | `Learn#2026` | Same course with AI helper & recording **locked** (no consent) |
| Guardian | `parent@kitabash.local` | `Parent#2026` | Progress, teacher feedback, consent switches |

`npm run db:seed` creates these, and the sign-in page then shows one-click buttons for them. The browser setup page does **not** create them unless you tick the option. Never use them on a public site.

---

### Git / GitHub from the command line

This folder is already a Git repository with one commit.

**Option A — command line (recommended)**

1. On [github.com/new](https://github.com/new) create an **empty** repository (no README, no .gitignore, no licence), e.g. `kitabash`. Choose *Private* if you don't want it public.
2. In this folder run:

```bash
git remote add origin https://github.com/YOUR-USERNAME/kitabash.git
git branch -M main
git push -u origin main
```

GitHub will ask you to sign in (use a [personal access token](https://github.com/settings/tokens) as the password, or GitHub Desktop / `gh auth login`).

**Option B — GitHub Desktop:** *File → Add local repository* → choose this folder → *Publish repository*.

**Option C — upload in the browser:** create the repository, click *uploading an existing file*, and drag in **everything in this folder except** `node_modules`, `data`, `dist` and `.env`. Hidden folders (`.github`) can be missed by drag-and-drop on some systems; Option A or B avoids that.

What is **never** committed (see `.gitignore`): `.env` (your secrets), `data/` (local database and uploads), `node_modules/`, `dist/`.

---

### Supabase details

Kitabash uses Supabase as a **managed Postgres database** and, optionally, **private file storage**. The Kitabash server is the only thing that talks to the database, and it enforces all permissions itself. Supabase's public API keys can't read any Kitabash table (see [Security on Supabase](#security-on-supabase)).

#### Create a project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Pick a name and a **strong database password** (save it; you'll need it below), and a region near your users (e.g. *Mumbai* for India).
3. Wait for the project to finish provisioning.

#### Connection string

1. In your project click **Connect** (top bar).
2. Under **Connection string → URI**, choose **Session pooler**. It works on every network; the *Direct connection* host is IPv6-only on many plans.
3. It looks like:
   `postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

#### Configure

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
SESSION_SECRET=paste-a-long-random-string-here
```

- Replace `YOUR-PASSWORD`. Special characters don't need URL-encoding (the parser accepts them as typed); encoded passwords also work.
- Keep `?sslmode=require` so the connection is encrypted.
- Generate a session secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

**Optional: Supabase Storage for uploaded files.** Under *Project Settings → API*, copy the **Project URL** and the **service_role** key:

```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # server secret — never share or commit
```

Kitabash creates a **private** bucket called `kitabash` on first upload. Without these, uploads are stored on the server's disk.

#### Check, migrate, seed

```bash
npm run db:check     # connects, creates tables, verifies TLS, RLS and storage
npm run db:seed      # demo content (optional)
npm start
```

`db:check` should print all ✓:

```
  ✓ Connected to PostgreSQL and migrations are applied
  ✓ PostgreSQL 17.x …
  ✓ Connection is encrypted (TLS)
  ✓ Row Level Security enabled on all 28 tables
  ✓ Supabase public API roles (anon/authenticated) have no table access
  ✓ File storage works (Supabase Storage, bucket "kitabash")
```

You'll see the tables in Supabase → **Table Editor**. The server banner and `GET /healthz` report `db: postgres`.

> `npm run db:reset` **deletes all Kitabash tables** in the connected database and reseeds. It only touches Kitabash's own tables, but never run it against a database with real student data.

#### Security on Supabase

- All 28 Kitabash tables have **Row Level Security enabled with no policies**, and privileges are **revoked** from Supabase's `anon` and `authenticated` roles. The public REST/GraphQL API (anon key) therefore sees nothing: not answer keys, not student records.
- The server connects as the database owner over TLS and applies Kitabash's own role checks, server-side grading and guardian-consent rules.
- Never put `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in front-end code, screenshots or commits. If one leaks, rotate it in the Supabase dashboard.
- Supabase **Auth** is not used: Kitabash has its own accounts (scrypt-hashed passwords, server sessions).

---

### Other hosts

With Supabase holding the database and files, the app server is stateless, so any Node host works. Example with **[Render](https://render.com)** (free tier available):

1. *New → Web Service* → connect your GitHub repository.
2. **Build command:** `npm install && npm run build` · **Start command:** `npm start`
3. **Environment variables:** `NODE_ENV=production`, `SESSION_SECRET`, `DATABASE_URL`, and optionally `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (plus AI keys if you have them).
4. Deploy, then open the URL. Tables are created automatically on first start. Run `npm run db:seed` once from your computer if you want demo data.

Railway, Fly.io and any Docker host work the same way (a `Dockerfile` is included). **Without** Supabase you need a host with a persistent disk for `DATA_DIR`. More in `docs/DEPLOYMENT.md`.

---

### Automatic tests on GitHub

`.github/workflows/ci.yml` runs on every push. Results appear in the **Actions** tab.

| Job | What it runs |
|---|---|
| `sqlite` | type-check, 33 unit/integration tests, build, browser walkthrough of all 12 Definition-of-Done steps |
| `postgres` | the same tests and walkthrough on a throwaway **PostgreSQL 16** container (the engine Supabase uses), plus `db:check` |

No secrets are needed: CI never touches your Supabase project.

To run the Postgres tests yourself, point them at a **disposable** database (they wipe it):

```bash
TEST_DATABASE_URL=postgresql://… npm test
E2E_DATABASE_URL=postgresql://… npm run test:e2e
```

---


`render.yaml` is the Render Blueprint used in path A: free web service, `npm install --include=dev && npm run build`, health check `/healthz`, a generated `SESSION_SECRET` and `SETUP_CODE`, and prompts for `DATABASE_URL` and the optional Supabase Storage keys.

## What's in the box

| Area | Where | Status |
|---|---|---|
| Category → Subject → Course → Track → Module → Lesson → Activity → Assessment hierarchy | `db/migrations`, `src/lib/services/courses.ts` | ✅ Working |
| Admin-editable taxonomy (add any category/subject) | Platform → Catalogue structure | ✅ Working |
| Course profile (all §2 fields), duplication, templates, versions, restore | Studio step 1 & 6 | ✅ Working |
| Workflow draft → testing → review → approved → published → archived | Studio step 6 | ✅ Working, admin-only publish |
| Knowledge library: PDF, DOCX, PPTX, TXT, MD, CSV, JSON, HTML extraction with page/section/slide refs; replace (versioned), preview, search, delete | Studio step 2 | ✅ Working |
| Images in knowledge library | Studio step 2 | ⚠️ Stored; text extraction needs an OCR integration (not configured) |
| Resource links verified server-side (SSRF-guarded), extracted when reachable | Studio step 2 | ✅ Working — links are never assumed reachable |
| Agent configuration (identity, vocabulary, complexity, tone, style, framework, hint ladder, questioning, ask-vs-explain, examples, assessment rules, misconceptions, out-of-scope, escalation, grounding, few-shot, extras) — versioned | Studio step 3 | ✅ Working |
| Agent runtime: global policy + course + config + lesson/activity context + retrieval (RAG) + safety gates + provider adapter | `src/lib/agent/runtime.ts` | ✅ Working |
| AI providers | `src/lib/agent/providers` | ✅ Offline demo tutor (rule-based, default) · ⚠️ Anthropic & OpenAI-compatible adapters implemented, **need API keys, not exercised in this build's tests** |
| Curriculum generation (lessons, cards, hooks, activities, keys, hints, rubrics, teacher panels) linked to sources | Studio step 4 | ✅ Offline generator (source-grounded scaffolds) · LLM generation when a provider key is set |
| Sandbox: test cases by category, expectations, run per version, free-play chat by age/lesson | Studio step 5 | ✅ Working; tests required before agent approval |
| Rollback to any previously approved agent version | Studio step 6 | ✅ Working |
| Insights: FAQs, unanswered/redirected, escalations, ratings, activity difficulty | Studio step 7 | ✅ Working, pseudonymous |
| Activity engine: 9 built-in types + 2 configurable presets + 5 documented extension slots | `src/lib/activities/registry.ts` | ✅ Working (see table below) |
| Learn → Perform → Probe lesson player, hints, server grading, retries, badges, recommendations | `/lessons/:id` | ✅ Working, mobile-first |
| 3-second visual hooks: 7 animated presets + video/image/SVG assets, captions, reduced motion, fallback | `VisualHook.tsx` | ✅ Working · ⚠️ no automated video generation |
| Media asset library (upload, replace, tag, alt text required, SVG sanitised) | Library | ✅ Working |
| Teacher workspace with 6-tab right panel (Teach/Show/Facilitate/Resources/Assess/AI), projection mode, student preview, lesson nav, panel collapse, answer-key reveal | `/teach/lessons/:id` | ✅ Working |
| Progress report + written-answer review queue with feedback/score override | `/teach/courses/:id/report` | ✅ Working |
| CBSE / CISCE / IGCSE / Olympiad tracks, manual + CSV mapping, review workflow | Studio → Board mapping | ✅ Working. **No official alignment data is included.** Library board courses are *designed to support* their board, and every mapping starts **unverified** |
| **K-12 course library**: 348 published courses, 4 grade bands × 3 levels, level ladder and “next level” recommendations | Platform → Course library · `src/lib/library` | ✅ Working. Every course passes the content checks and its tutor tests. A subject teacher has not yet reviewed them (see below) |
| **Live classes**: class groups, weekly schedules, WebRTC video, chat, raised hands, mute-all, lesson-card sharing, attendance, parent view | Live classes · `src/lib/live` | ✅ Working (tested browser-to-browser). ⚠️ Run one server instance, and add a TURN relay for strict networks |
| Roles: admin, instructor, student, guardian · guardian consent for AI & audio | `src/lib/auth.ts` | ✅ Working |
| Data export, right-to-erasure, AI log retention purge, audit log | Platform → People / Audit | ✅ Working |
| Database: SQLite (default) or PostgreSQL/Supabase via `DATABASE_URL`, with RLS lock-down | `src/lib/db` | ✅ Working — both backends pass the full test suite |
| File storage: local disk or private Supabase Storage bucket | `src/lib/storage.ts` | ✅ Working (Supabase tested against a mock of its Storage API) |
| Integrations registry with live status | Platform → Integrations | ✅ Status reporting · ⚠️ speech scoring, OCR, email, calendar adapters not implemented |

### Activity types

| Type | Status | Typical subjects |
|---|---|---|
| Multiple choice (+ misconception feedback per option) | Built-in | all |
| Fill in the blanks (+ word bank) | Built-in | language, science, maths |
| Ordering / sequencing | Built-in | storytelling, processes, coding |
| Matching | Built-in | vocabulary, science |
| Drag-and-drop sorting (tap alternative) | Built-in | finance, EVS, grammar |
| Budget simulation / scenario decision | Built-in | financial literacy, entrepreneurship |
| Drawing & tracing (geometric scoring) | Built-in | handwriting, early maths |
| Listening & speaking (browser TTS + on-device recording + self-check) | Built-in | spoken English, public speaking |
| Writing / reflection / explanation (teacher review) | Built-in | all probes, creative writing |
| Code: predict the output | Configurable preset | Scratch, Python, web |
| Timed optional challenge | Configurable preset | Olympiad, maths facts |
| Coding sandbox, visual simulations, interactive diagrams, audio comprehension, project submissions | **Need developer extension** | — |

Unlimited *activities* of any registered type are created by configuration. A genuinely new *type* needs code — see `docs/ACTIVITY_EXTENSIONS.md`.

---

## The K-12 course library

| Category | Subjects | Courses |
|---|---|---|
| Language & Communication | Handwriting & Penmanship, Spoken English, English Grammar & Vocabulary, Reading Comprehension, Creative Writing, Storytelling, Public Speaking, Debate & Communication, Presentation Skills | 87 |
| Academic Learning | Mathematics, Science, English, Environmental Studies, Logical Reasoning, Critical Thinking, Olympiad Preparation, Problem Solving, Homework & Revision Support | 87 |
| School Board Curriculum | CBSE, ICSE / CISCE, Cambridge IGCSE | 24 |
| Life & Financial Skills | Financial Literacy, Saving & Budgeting, Needs vs Wants, Money Management, Financial Decision-Making, Entrepreneurship, Digital Citizenship, Study Skills | 75 |
| Coding, AI & Technology | Scratch Junior, Scratch, Python, MIT App Inventor, Micro:bit, Web Development, Artificial Intelligence, Prompt Engineering, AI-Assisted Website Creation, Robotics, Minecraft Education (MakeCode), No-code Automation & AI Agents | 75 |

- **Grade bands, by age:** K–2 (5–7), Grades 3–5 (8–10), 6–8 (11–13), 9–12 (14–17). A subject appears only in bands that suit its age group. For example, Scratch Junior is K–2 only, and Debate is Grades 6–12. Handwriting covers every grade.
- **Every course** has 2 modules × 2 lessons. Each lesson has a 3-second visual hook, Learn cards, Perform and Probe activities with answer keys and hints, a course-specific AI tutor with tested misconceptions, and a full teacher panel (explanation, analogy, vocabulary, demo, prompts, support, stretch, misconceptions, worksheet).
- **Retention and upselling:** courses in a band form a Beginner → Intermediate → Advanced path. The course page shows the path, and finishing a level recommends the next one. Students see their own band first in **Explore**.
- **Board courses** (CBSE, ICSE/CISCE, Cambridge IGCSE) say *designed to support*, never “aligned”. Their topic mappings install as **unverified**. Before claiming alignment, have a curriculum reviewer check each mapping against the board's current official syllabus and approve it in **Studio → Board mapping**.
- **Before you sell it:** the content was written and machine-checked (consistent answers, numerical answers worked through, tutor tests passing), but a subject teacher has not reviewed it. Plan a teacher review of each course; you can edit anything in the Studio. Published courses are read-only, so move a course to Draft or duplicate it to make a new edition.
- **Install or top up** at any time: **Platform → Course library**, or `npm run library:install`. Re-running only adds missing courses.

## Live classes

Teachers create a **class group** (up to ~10 students), set a weekly schedule, and start a class from **Live classes**. Video and audio go directly between browsers (WebRTC). The server only passes small signalling messages, so no video server or WebSocket is needed, and it runs on Render's free plan.

- **Who sees whom:** by default students see only the teacher. The teacher can switch to **Everyone** for group discussion.
- **Child safety:** students under 18 can use camera and mic only with guardian consent; otherwise they join view-only.
- **Tools:** chat, raise hand, mute-all, lock chat, share a lesson card, remove a participant. Attendance and chat are saved, and parents see the classes their child attended.
- **Hosting notes:** class state is kept in memory, so run **one** server instance (Render free = one). Some school and mobile networks block direct connections; if students can't see video, add a TURN relay (`TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL`, see `.env.example`).

## How the AI agent works (plain English)

Kitabash does **not** fine-tune or retrain any model. Each answer is produced by:

1. **Safety gates** (deterministic code, never delegated to a model): safeguarding phrases → caring message + teacher escalation; personal data → reminder + redaction; configured out-of-scope topics → redirect; "just tell me the answer" → hint instead.
2. **Retrieval**: the question is searched (BM25) against the course's uploaded passages and its lesson cards. The top passages are placed in the prompt and cited as `[S1]`.
3. **Prompt configuration**: platform policy + course profile + the agent version's settings + current lesson/activity.
4. **Provider adapter**: the offline demo tutor (default) or Anthropic / any OpenAI-compatible API, chosen by `AI_PROVIDER`.

Published agents change only when an admin edits, re-tests, approves and publishes a new version. Student conversations never modify an agent. Details: `docs/AGENT.md`.

---

## Project layout

```
server/            HTTP server, routing, API routes (permission on every route)
src/lib/           Framework-free domain logic
  db/              SQLite + PostgreSQL backends, built-in Postgres client, migrations
  storage.ts       Local disk or Supabase Storage
  auth.ts          scrypt passwords, sessions, RBAC table, guardian consent
  activities/      Activity registry: validation + server-side grading
  knowledge/       Text extraction and BM25 retrieval
  agent/           Agent config schema, runtime, providers, curriculum generator
  services/        Courses, learning, agents, knowledge, teaching, admin
src/client/        React 19 SPA (Tailwind v4)
db/migrations/     sqlite/ and postgres/ schemas (Postgres = Supabase, with RLS lock-down)
.github/workflows/  CI: tests on SQLite and on PostgreSQL 16
scripts/           build, migrate, seed (+ demo content)
tests/unit/        node:test suites (33 tests; also run on Postgres)
tests/e2e/         Playwright Definition-of-Done walkthrough (13 steps)
docs/              Architecture, agent, extensions, Supabase, deployment, testing report
```

## Scripts

| Command | What it does |
|---|---|
| `npm run build` | Bundle client (esbuild), compile CSS (Tailwind v4), bundle server |
| `npm start` | Run the built server |
| `npm run dev` | Watch mode |
| `npm run db:check` | Verify database (+TLS, RLS) and file storage |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` / `db:reset` | Seed demo data / wipe Kitabash tables and reseed |
| `npm test` | Unit + integration tests (`TEST_DATABASE_URL` → on Postgres) |
| `npm run test:e2e` | Browser walkthrough of the 12-point Definition of Done (`npx playwright install chromium` first) |
| `npm run test:first-run` | Browser test of the first-run setup page |
| `npm run test:live` | Browser-to-browser live-class test (video, chat, controls, attendance) |
| `npm run library:install` | Install (or top up) the K-12 course library |
| `npm run typecheck` | TypeScript check (server + domain) · `typecheck:client` for the React code |

## Why not Next.js (yet)?

The brief prefers Next.js. This build environment had no access to the npm registry, so v0.1 uses React 19, TypeScript, Tailwind v4, esbuild, Node's built-in HTTP server and SQLite, and a small built-in Postgres client for Supabase (no `pg` dependency). All business logic lives in `src/lib` with no framework imports, so moving to Next.js means re-pointing `server/routes.ts` handlers to Route Handlers and the pages to the App Router — see `docs/ARCHITECTURE.md#migrating-to-nextjs`.

## Documentation

- `docs/ARCHITECTURE.md` — data model, security model, request flow, Next.js migration path
- `docs/AGENT.md` — agent runtime, configuration, providers, testing, monitoring
- `docs/ACTIVITY_EXTENSIONS.md` — adding a new activity type
- `docs/SUPABASE.md` — how the Supabase integration works
- `docs/DEPLOYMENT.md` — production checklist and hosting options
- `docs/TESTING_REPORT.md` — what was tested and how
