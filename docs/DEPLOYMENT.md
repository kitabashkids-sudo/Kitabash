# Deployment

**Non-technical path:** follow README → *A. Put it online* (GitHub upload → Supabase → Render Blueprint → setup page in the browser). This page has the details for technical readers.

Kitabash is a single Node.js process. Two ways to run it:

- **With Supabase** (`DATABASE_URL` + optional Supabase Storage): the server is stateless and runs on any Node host (Render, Railway, Fly.io, a VM, Docker). Recommended.
- **Without Supabase**: data lives in a SQLite file and uploads folder under `DATA_DIR`, so the host needs a **persistent disk**.

## Production checklist

- [ ] Node.js ≥ 22.13
- [ ] `NODE_ENV=production` (enables `Secure` cookies; the server refuses to start without a strong `SESSION_SECRET`)
- [ ] `SESSION_SECRET` — 32+ random characters (`openssl rand -base64 48`)
- [ ] `DATABASE_URL` (Supabase session pooler, `sslmode=require`) and `npm run db:check` passing, **or** `DATA_DIR` on a persistent, backed-up volume
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for file storage (or a persistent `DATA_DIR`)
- [ ] HTTPS terminated in front (platform TLS, Caddy, nginx)
- [ ] Remove or change the demo accounts (don't run `db:seed` in production, or reset passwords via Platform → People)
- [ ] `AI_PROVIDER` + key if you want model-generated replies; review `AI_RATE_LIMIT_PER_MIN` and `AI_MAX_OUTPUT_TOKENS`
- [ ] `AI_LOG_RETENTION_DAYS` agreed with your school's data policy
- [ ] Guardian consent process agreed (who links guardians, how consent is recorded)
- [ ] Review the platform safeguarding phrases in `src/lib/agent/config.ts` with your designated safeguarding lead

## Build & run

```bash
npm install
npm run build
NODE_ENV=production SESSION_SECRET=... DATA_DIR=/var/lib/kitabash npm start
```

Health check: `GET /healthz`.

## Docker

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && npm prune --omit=dev
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/server.js"]
```

A `Dockerfile` is included in the repository (not built in this environment, since Docker wasn't available). The build step needs dev dependencies (esbuild, tailwindcss), so `npm prune` runs after `npm run build`. Runtime needs `react`, `react-dom` (bundled), `jszip` and `pdfjs-dist`.

## Hosts that fit

With Supabase: Render, Railway, Fly.io, any VM or container platform (see README section 4). Without Supabase: Fly.io (volume), Render (disk), Railway (volume) or a VM. Serverless function platforms (Vercel, Netlify) aren't supported, because Kitabash is a long-running server.

## Backups

Supabase: dashboard backups (paid plans) or `pg_dump "$DATABASE_URL" > backup.sql`, plus the Storage bucket. SQLite runs in WAL mode. Back up with `sqlite3 kitabash.sqlite ".backup backup.sqlite"` (safe while running) plus the `uploads/` directory.
