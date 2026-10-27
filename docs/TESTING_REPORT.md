# Testing report — Kitabash v0.1

Run date: 27 October 2026 · Node 22.23 · Chromium (Playwright 1.63) · PostgreSQL 16 (local, SCRAM-SHA-256 auth + TLS, matching Supabase)

## Summary

| Suite | Result |
|---|---|
| TypeScript (server + domain, strict) — `npm run typecheck` | ✅ 0 errors |
| Unit + integration on **SQLite** — `npm test` | ✅ 38 / 38 |
| Integration on **PostgreSQL** over TLS + SCRAM — `TEST_DATABASE_URL=… npm test` | ✅ 38 / 38 (incl. nested-transaction rollback) |
| First-run setup in the browser (no command line), SQLite and PostgreSQL — `npm run test:first-run` | ✅ 8 / 8 checks each: auto-redirect to setup, setup code enforced, admin + sample courses created, setup can't run twice, no public demo logins, re-login works |
| Connection-string parser: unencoded `@ : / # ? %` and spaces in passwords, `[YOUR-PASSWORD]` and bracket mistakes, plain-language error messages | ✅ (and a real connection with `#` and a space in the password) |
| `start-mac.command` launcher (run on Linux) | ✅ builds, starts, serves the setup page |
| End-to-end Definition of Done on **SQLite** — `npm run test:e2e` | ✅ 13 / 13 steps, 0 browser errors |
| End-to-end Definition of Done on **PostgreSQL** — `E2E_DATABASE_URL=… npm run test:e2e` | ✅ 13 / 13 steps, 0 browser errors |
| Built-in Postgres client: TLS, SCRAM, params, Unicode, types, error recovery, 20 parallel queries, bad-password rejection | ✅ |
| Supabase lock-down: simulated `anon`/`authenticated` roles with Supabase-style default grants | ✅ permission denied on every table; 0 rows even after a re-grant; RLS on 28/28 tables |
| Supabase Storage adapter against a mock Storage API (private bucket, upsert, read, delete, auth headers) | ✅ |
| `npm run db:check` on Postgres (pass case + wrong-password case) | ✅ |
| Seeded agent sandbox suites (offline provider) | ✅ Money Smart 8/8 · Spoken English 7/7 · Handwriting 7/7 |
| PDF extraction (generated 2-page PDF) | ✅ 2 passages with `page 1`, `page 2` refs |
| Visual review (desktop 1440 px, mobile 390 px, `docs/screenshots`) | ✅ reviewed |

**Not tested against a real Supabase project:** this environment can't reach supabase.com. Everything Supabase-specific was tested against equivalents (Postgres 16 with SCRAM + TLS; Supabase-style roles and grants; a mock of the Storage REST API). Run `npm run db:check` after connecting your project; it verifies the same properties live.

## Definition of Done — end-to-end walkthrough

Executed by `tests/e2e/definition-of-done.ts` against a freshly seeded server, through the UI only, once on SQLite and once on PostgreSQL:

1. ✅ Admin creates *E2E Science: Plants* via **New course**: no code.
2. ✅ Sets ages 9–11, adds an objective and a teaching style in the course profile.
3. ✅ Uploads a Markdown file → `extracted`, 2 passages with section references.
4. ✅ Names the agent "Leafy" and adds the misconception "plants eat soil" with a correction.
5. ✅ Generates drafts → 1 lesson with cloze, multiple-choice and probe activities, answer keys, hints, hook and teacher panel.
6. ✅ Adds the starter test suite, runs it (8/8 passing), and the free-play sandbox answers "Do plants eat soil?" with the configured correction.
7. ✅ Approves the lesson; submits the agent for review and approves it; submits the course, approves it.
8. ✅ Publishes. Course v1 is snapshotted and agent v1 goes live with it.
9. ✅ Student (mobile viewport) finds the course in the catalogue, joins, opens the next lesson.
10. ✅ Completes Learn → Perform → Probe; reaches the completion screen with a server-computed score.
    - ✅ Tutor answers with a source citation chip; "someone is bullying me" is flagged for the teacher.
11. ✅ Teacher opens the workspace; all six panel tabs work (Teach, Show, Facilitate, Resources, Assess, AI); the co-facilitator returns recap questions; answer keys reveal on demand.
12. ✅ Progress report shows the learner's score; a student calling the teacher API gets **403**, and the student lesson payload contains **no answer keys**.

## Unit and integration coverage

- **Activity engine**: grading for all 9 built-in types plus the `code_output` preset; partial credit; misconception-specific feedback; tracing coverage and accuracy; "practised on paper" goes to teacher review; validation rejects broken configs and extension-only types; every registry example validates.
- **Knowledge**: Markdown sections, CSV row groups with header, DOCX headings and entities, PPTX slide order, images marked unsupported (OCR), corrupt files fail gracefully, BM25 ranking, headings never merged into answer sentences.
- **Security and roles**: scrypt hashes; wrong passwords rejected; permission matrix for all four roles; guardian consent gating; students never receive `answer_key` or teacher content; students can't open draft courses.
- **Agent safety**: escalation, PII reminder and redaction in logs, pseudonymous learner refs, out-of-scope redirect, answer-seeking refusal, misconception correction, grounded citation, platform triggers can't be removed by configuration; the safeguarding matcher catches word forms ("bullying", "bullied", "hits me", "want to die", "harassing") without firing on "I hurt my knee" or "killing me lol".
- **Workflow**: full create → publish → learn at service level, with the guards checked (can't publish from draft, can't approve without an approved agent, agent review requires tests run, published course read-only); agent rollback; mappings start unverified and need a reference to approve; CSV import with quoted commas; right-to-erasure cascade; SVG sanitising.

## Defects found and fixed during testing

| Found by | Defect | Fix |
|---|---|---|
| E2E | **Safeguarding gap**: "someone is bullying me" was not escalated (whole-word match missed "bullying") | Word-form-aware matcher, extra platform phrases, platform triggers always applied at runtime, regression test |
| E2E | Compound form fields (objective lists etc.) were nested inside `<label>`, hiding their buttons from assistive technology | `Field` now renders a labelled `role="group"` for compound controls |
| E2E | Newer Chromium returns a Promise from `scrollIntoView`; returning it from a React effect crashed the chat on unmount | All effects use block bodies |
| Seed tests | Curly apostrophes broke "I don't get it" detection; headings bled into tutor answers; courses without uploads couldn't ground answers | Quote normalisation; line-aware sentence splitting; lesson cards searchable as passages |
| PDF check | pdf.js v6 moved `destroy()`, so every PDF extraction failed | Destroy via the loading task |
| Postgres port | Two queries were valid in SQLite but not Postgres (non-grouped column; unaliased subquery) | Fixed; the whole suite now runs on both databases, including in CI |
| Visual review | Teacher panel tabs overflowed; long hook words overflowed on phones; range sliders ignored the course colour | Wrapping tabs, size by word length, explicit `accentColor` |

## Not tested / known limits

- **Real LLM providers** (Anthropic, OpenAI-compatible): adapters are implemented but no API key was available, so all agent tests used the offline demo tutor. Before go-live: set a key, re-run every course's sandbox suite, and review LLM-generated drafts.
- **Client TypeScript**: React type definitions weren't installable offline, so client code was verified by the esbuild compile and the browser tests rather than `tsc`. Run `npm install && npm run typecheck:client` on a connected machine (it is not part of CI until verified).
- **Real Supabase project / Supavisor pooler / real Storage service**: not reachable from the build environment; covered by equivalents above and by `npm run db:check` on your side.
- **Dockerfile**: written but not built (no Docker in the build environment).
- **Render Blueprint (`render.yaml`) and `start-windows.bat`**: written to Render's and Windows' documented formats but not run here (no Render access, no Windows machine).
- **Microphone recording, fullscreen projection and drag-and-drop with a real mouse** were exercised manually in screenshots only; headless Chromium has no microphone.
- **Accessibility**: built to the checklist in `docs/ACTIVITY_EXTENSIONS.md` (keyboard paths, labels, live regions, reduced motion) but not audited with a screen reader or axe.
- **Load/performance**: not tested. SQLite and in-process rate limiting suit a single school or pilot, not multi-instance scaling.

## How to reproduce

```bash
npm install && npx playwright install chromium
npm run build
npm test
npm run test:e2e         # writes test-results/e2e-report.md + screenshots
# On a DISPOSABLE Postgres (tables are wiped):
TEST_DATABASE_URL=postgresql://… npm test
E2E_DATABASE_URL=postgresql://… npm run test:e2e
```
