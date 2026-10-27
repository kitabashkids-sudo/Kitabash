# Architecture

## Principles

1. **Content is data, behaviour is code.** Courses, lessons, activities, agent configurations, hooks and teacher panels are rows. Activity *types*, hook *presets* and providers are code, registered once and reused by every course.
2. **One agent runtime, many configurations.** No per-subject agents.
3. **Separation:** course content (`courses/modules/lessons`), activity definitions (`activities/registry.ts`), agent configuration (`agent_versions`), knowledge retrieval (`knowledge/`) and UI (`src/client`) don't import each other's internals.
4. **The server is the authority.** Grading, answer keys, teacher content, AI calls and publishing all happen server-side.

## Content hierarchy

```
Category ─< Subject ─< Course ─< Curriculum Track (board / olympiad / general)
                         │  └─< Module ─< Lesson ─< Activity (phase: perform | probe)
                         │                   └─< Assessment (rubric)
                         ├─< Resource ─< Resource chunk (knowledge library)
                         ├── Agent ─< Agent version (config JSON, status) ─< Test runs
                         │         └─< Agent test case
                         └─< Course version (published snapshots)
Curriculum Track ─< Curriculum Mapping (topic ↔ lesson, review status)
User ─< Enrolment, Lesson progress, Attempt ─< Instructor feedback
Guardian ─< Guardian link (consent_ai, consent_audio) >─ Student
```

Lesson JSON columns:

- `learn` — `{ cards: [{ emoji, title, body, sourceRef }] }` (student-facing)
- `hook` — `{ kind: preset|video|image|svg|none, preset, params, assetId, caption, alt }`
- `teacher` — `{ teach, show, facilitate, resources, assess, extension }` (**protected**)
- `source_refs` — which knowledge passages the lesson draws on

Activity columns: `config` (student-safe) and `answer_key` (**protected**), `hints` (ladder), `points`.

## Request flow (lesson attempt)

```
Browser ──POST /api/activities/:id/attempt {response, hintsUsed}
   │       (session cookie, x-kitabash header for CSRF)
server/http.ts  → CSRF + origin check → resolve session → route
server/routes.ts → requirePerm('learn') → validate body
learning.submitAttempt → assertCanView (published + approved, or staff)
   → registry.gradeActivity(type, points, config, answer_key, response)
   → insert attempt, recompute lesson_progress (best score per activity)
   ← { score, correct, feedback, detail }   (never the key)
```

## Security model

| Concern | Implementation |
|---|---|
| Passwords | scrypt (N=16384), timing-safe compare, uniform timing for unknown users |
| Sessions | 32-byte random token in an HttpOnly, SameSite=Lax (Secure in production) cookie; only its SHA-256 is stored |
| CSRF | SameSite cookie + mandatory `x-kitabash` header + Origin host check on every non-GET API call |
| Authorisation | One permission table (`PERMISSIONS` in `auth.ts`); every route calls `requirePerm` |
| Answer keys / teacher notes | Stripped from all student payloads in the service layer |
| Database exposure (Supabase) | RLS enabled with no policies + privileges revoked from `anon`/`authenticated`; only the server (table owner, over TLS) can read or write |
| Grading | Server-only; students cannot write attempts or progress directly |
| AI | Server-side only; keys from env; per-user rate limits; output-token caps; PII redaction before provider calls and in logs |
| Safeguarding | Deterministic trigger matching (platform list can't be removed by course config); escalations surface in insights |
| Child data | Guardian consent for AI and audio under 18; recordings never leave the device; AI logs are pseudonymous (HMAC of user id) with retention purge |
| Uploads | Extension allow-list, size caps, files served as attachments, uploaded SVG sanitised and served with a locked-down CSP |
| Links | Server-side verification with timeout and private-address (SSRF) blocking |
| Headers | CSP (`script-src 'self'`), `X-Frame-Options: DENY`, `nosniff`, strict referrer, permissions policy |
| Login abuse | 20 attempts / 15 min / IP |
| Audit | Create/publish/approve/erase actions recorded in `audit_log` |

## Workflow rules

- Lessons: `draft → review → approved`. Editing an approved lesson or its activities sends it back to `review`. Approval validates every activity against the registry.
- Courses: transitions in `COURSE_TRANSITIONS`. `approved` and `published` require ≥1 approved lesson **and** an approved agent version. Publishing snapshots the course and publishes the approved agent. Published courses are read-only; move to Draft (hidden from students) or duplicate to make a new edition.
- Agent versions: edits land on the draft version; once it has left `draft`, a save creates a new version. `review`/`approved` require every sandbox test to have been run against that exact version. Rollback re-publishes any version that was ever approved.
- Mappings: always created `unverified`; approval requires a reference source; students only see approved mappings.

## Migrating to Next.js

`src/lib/**` has no framework imports. To move:

1. Create the app with `create-next-app` (TypeScript, Tailwind, App Router) and copy `src/lib`, `src/styles`, `db/`.
2. For each `route(METHOD, path, handler)` in `server/routes.ts`, create `app/api/<path>/route.ts` exporting the method. Replace `c.body()` with `await req.json()`, `c.user` with a `getUser(cookies())` helper wrapping `userFromToken`, and keep the `requirePerm` call as the first line.
3. Move CSRF/security headers into `middleware.ts` and `next.config.js` `headers()`.
4. Pages in `src/client/pages` become client components under `app/`; replace `Link`/`navigate` with `next/link` / `useRouter`.
5. Mark `src/lib/db` as server-only (`import 'server-only'`). With `DATABASE_URL` set it already runs on Supabase Postgres.
