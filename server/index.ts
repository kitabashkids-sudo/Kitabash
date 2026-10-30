// Kitabash server entry: static client + JSON API.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { dispatch, securityHeaders, sendJSON } from './http.ts';
import './routes.ts';
import { initDb, currentDialect } from '../src/lib/db/index.ts';
import { explainDbError } from '../src/lib/db/pg.ts';
import { purgeOldLogs } from '../src/lib/services/admin.ts';
import { activeProvider } from '../src/lib/agent/providers/index.ts';
import { loadEnv } from './env.ts';
import { upgradeLibraryPlatforms } from '../src/lib/library/platform-upgrade.ts';

loadEnv();
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 24 || /change-me/.test(process.env.SESSION_SECRET))) {
  console.error('SESSION_SECRET must be set to a long random value in production.');
  process.exit(1);
}

try {
  await initDb();
} catch (e) {
  console.error('\nCould not open the database:\n  ' + explainDbError(e) + '\n');
  process.exit(1);
}
await purgeOldLogs();
// Give courses installed before platform activities existed their "Do it in <platform>" activities.
void upgradeLibraryPlatforms()
  .then((r) => r.lessons && console.log(`Course library: added platform activities to ${r.lessons} lessons in ${r.courses} courses.`))
  .catch((e) => console.error('Course library platform upgrade failed:', e));
setInterval(() => void purgeOldLogs().catch(() => {}), 24 * 3600_000).unref();

const PUBLIC = [path.resolve('dist/public'), path.resolve(path.dirname(new URL(import.meta.url).pathname), 'public')].find((p) => fs.existsSync(p)) || path.resolve('dist/public');
const MIME: Record<string, string> = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.map': 'application/json' };

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', 'http://local');
  const rel = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) return sendJSON(res, 400, { error: 'Bad path' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html'); // SPA fallback
  if (!fs.existsSync(file)) {
    res.writeHead(503, { 'content-type': 'text/plain' });
    return res.end('Client not built. Run: npm run build');
  }
  const ext = path.extname(file);
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-cache' : /\.[0-9a-f]{8}\./.test(file) ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  try {
    if (req.url?.startsWith('/api/')) {
      if (!(await dispatch(req, res))) sendJSON(res, 404, { error: 'Not found' });
    } else if (req.url === '/healthz') sendJSON(res, 200, { ok: true, db: currentDialect() });
    else serveStatic(req, res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJSON(res, 500, { error: 'Server error' });
  }
});

const port = Number(process.env.PORT || 3000);
const localUrl = `http://localhost:${port}`;
function openBrowser() {
  if (!process.env.OPEN_BROWSER) return;
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', localUrl]] : process.platform === 'darwin' ? ['open', [localUrl]] : ['xdg-open', [localUrl]];
  import('node:child_process').then(({ spawn }) => spawn(cmd[0] as string, cmd[1] as string[], { stdio: 'ignore', detached: true }).on('error', () => {}).unref());
}
server.on('error', (e: NodeJS.ErrnoException) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nPort ${port} is already in use — Kitabash may already be running. Open ${localUrl} in your browser.\n`);
    openBrowser();
  } else console.error(e);
  process.exit(1);
});
server.listen(port, () => {
  openBrowser();
  const p = activeProvider();
  console.log(`Kitabash running on http://localhost:${port}  ·  DB: ${currentDialect() === 'postgres' ? 'PostgreSQL (DATABASE_URL)' : 'SQLite (local file)'}  ·  AI: ${p.label}`);
});
