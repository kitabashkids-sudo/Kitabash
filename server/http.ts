// Tiny HTTP framework: routing, cookies, JSON bodies, raw uploads, security headers.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from '../src/lib/validate.ts';
import { userFromToken, type User } from '../src/lib/auth.ts';

export interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  user: User | null;
  token?: string;
  body: () => Promise<any>;
  raw: (limit?: number) => Promise<Buffer>;
}
type Handler = (c: Ctx) => Promise<unknown> | unknown;

interface Route {
  method: string;
  re: RegExp;
  keys: string[];
  handler: Handler;
}
const routes: Route[] = [];

export function route(method: string, pattern: string, handler: Handler) {
  const keys: string[] = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
  routes.push({ method, re, keys, handler });
}

export const COOKIE = 'kb_session';
const isProd = () => process.env.NODE_ENV === 'production';

export function parseCookies(h?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of (h || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}

export function setSessionCookie(res: ServerResponse, token: string, expires: Date) {
  res.setHeader('set-cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}${isProd() ? '; Secure' : ''}`);
}
export function clearSessionCookie(res: ServerResponse) {
  res.setHeader('set-cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd() ? '; Secure' : ''}`);
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, 'Request too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function securityHeaders(res: ServerResponse) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'same-origin');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('permissions-policy', 'camera=(), geolocation=(), microphone=(self)');
  res.setHeader(
    'content-security-policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
}

export function sendJSON(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data ?? null);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

export async function dispatch(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://local');
  const method = req.method || 'GET';
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = url.pathname.match(r.re);
    if (!m) continue;
    const token = parseCookies(req.headers.cookie)[COOKIE];
    const ctx: Ctx = {
      req,
      res,
      params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])),
      query: url.searchParams,
      user: await userFromToken(token),
      token,
      raw: (limit = 30 * 1024 * 1024) => readBody(req, limit),
      body: async () => {
        const buf = await readBody(req, 2 * 1024 * 1024);
        if (!buf.length) return {};
        if (!(req.headers['content-type'] || '').includes('application/json')) throw new HttpError(415, 'Expected JSON');
        try {
          return JSON.parse(buf.toString('utf8'));
        } catch {
          throw new HttpError(400, 'Invalid JSON');
        }
      },
    };
    try {
      // CSRF defence for state-changing API calls: SameSite cookie + custom header + Origin check.
      if (method !== 'GET' && method !== 'HEAD' && url.pathname.startsWith('/api/')) {
        if (req.headers['x-kitabash'] !== '1') throw new HttpError(403, 'Missing request header');
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, 'Cross-origin request blocked');
      }
      const out = await r.handler(ctx);
      if (!res.headersSent && !res.writableEnded) sendJSON(res, 200, out === undefined ? { ok: true } : out);
    } catch (e) {
      const err = e as HttpError;
      if (err instanceof HttpError) sendJSON(res, err.status, { error: err.message });
      else {
        console.error(`[${method} ${url.pathname}]`, e);
        sendJSON(res, 500, { error: 'Something went wrong on our side. Please try again.' });
      }
    }
    return true;
  }
  return false;
}
