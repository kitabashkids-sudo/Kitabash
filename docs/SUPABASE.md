# Supabase integration

Setup steps are in the README (section 3). This page explains how the integration works.

## What Kitabash uses from Supabase

| Supabase feature | Used? | How |
|---|---|---|
| Postgres database | **Yes** | `DATABASE_URL` → all data. Tables are created by Kitabash's migration runner on startup / `npm run db:check`. |
| Storage | **Optional** | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` → knowledge files and media in a private bucket (`SUPABASE_STORAGE_BUCKET`, default `kitabash`). |
| Auth | No | Kitabash has its own accounts, roles and guardian links. |
| REST / GraphQL APIs, Realtime | No | Deliberately locked out (below). |
| Edge Functions | No | — |

## Connection

`src/lib/db/pg.ts` is a small built-in PostgreSQL client (no npm dependency): TLS, SCRAM-SHA-256, parameterised queries and a connection pool, tested against PostgreSQL 16 with the same auth and TLS settings Supabase uses. Connection options:

- **Session pooler** (`…pooler.supabase.com:5432`, user `postgres.<ref>`): recommended, IPv4.
- **Direct connection** (`db.<ref>.supabase.co:5432`): IPv6 on many plans.
- **Transaction pooler** (port 6543): not tested. Queries use only unnamed statements, so they should be compatible, but the migration runner's advisory lock needs a real session. Use the session pooler.

`sslmode`: `require` encrypts without verifying the certificate (same as libpq). It's the default for `*.supabase.co/.com` hosts. For full verification, download the CA from *Project Settings → Database → SSL* and set `DATABASE_CA_CERT=/path/prod-ca.crt` with `sslmode=verify-full`.

Pool size: `DATABASE_POOL_SIZE` (default 5). Keep it small on the free tier.

## Schema and migrations

- `db/migrations/postgres/001_init.sql`: the same tables and columns as the SQLite schema, so the app's portable SQL runs on both. The data layer translates `?` placeholders, `datetime('now')` and `INSERT OR IGNORE`.
- Applied automatically, in a transaction, guarded by a Postgres advisory lock, and recorded in `schema_migrations`.
- To add a migration: create `002_*.sql` in **both** `db/migrations/sqlite` and `db/migrations/postgres`.

## Security model

The Kitabash server is the **only** client of these tables.

1. **RLS on, no policies**, on all 28 tables (including `schema_migrations`).
2. **Privileges revoked** from `anon` and `authenticated` in the same migration, which overrides Supabase's default grants on new tables.
3. The server connects as the table owner (`postgres`), which bypasses RLS, and enforces Kitabash's permission table, server-side grading, answer-key stripping and guardian consent.
4. The Storage bucket is created **private**; files are streamed through Kitabash routes that check roles and resource audience.

Verified by `npm run db:check`, and in testing by simulating Supabase's roles and default grants: `anon` and `authenticated` get *permission denied*, and even after a deliberate re-grant they see 0 rows.

**Keep secret:** `DATABASE_URL` (contains the DB password) and `SUPABASE_SERVICE_ROLE_KEY`. Both bypass all of the above. Rotate them in the dashboard if exposed.

## Backups and data rights

- Supabase takes daily backups on paid plans; on free, export with `pg_dump "$DATABASE_URL"`.
- Learner export and erasure: Platform → People. Erasure cascades through all learning records.
- AI logs are pseudonymous and purged after `AI_LOG_RETENTION_DAYS`.

## Possible next steps

- Supabase Auth (social login): verify Supabase JWTs server-side and map to `users`.
- pgvector embeddings for semantic retrieval alongside BM25.
