// Minimal, dependency-free PostgreSQL client (wire protocol v3).
// Supports: TLS (sslmode=disable|require|verify-ca|verify-full), SCRAM-SHA-256 / MD5 / cleartext
// auth, unnamed extended-protocol queries with text parameters (compatible with Supabase's
// Supavisor pooler in session AND transaction mode), multi-statement simple queries, and a pool.
//
// Why not `pg`? Kitabash keeps runtime dependencies minimal. The surface used by the app is
// tiny: query(text, params) → rows. Swap this for `pg` later if you need more.
import net from 'node:net';
import tls from 'node:tls';
import fs from 'node:fs';
import crypto from 'node:crypto';

export interface PgConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: false | { rejectUnauthorized: boolean; ca?: string; servername?: string };
}

export interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
}

export class PgError extends Error {
  code?: string;
  detail?: string;
  constructor(fields: Record<string, string>) {
    super(fields.M || 'PostgreSQL error');
    this.code = fields.C;
    this.detail = fields.D;
  }
}

/**
 * Parses a Postgres connection string, forgivingly — built for people pasting from the
 * Supabase dashboard:
 *  • passwords may contain @ : / # ? % and spaces WITHOUT URL-encoding
 *  • "[YOUR-PASSWORD]" placeholders and [brackets] copied from the template are handled
 *  • TLS (sslmode=require) is switched on automatically for Supabase hosts
 */
export function parseConnectionString(input: string): PgConfig {
  const raw = input.trim().replace(/^['"]|['"]$/g, '');
  if (/^https?:\/\//i.test(raw)) throw new Error('DATABASE_URL looks like a website address (https://…). Use the database connection string from Supabase → Connect → Session pooler; it starts with postgresql://');
  const m = raw.match(/^postgres(?:ql)?:\/\/(.*)$/i);
  if (!m) throw new Error('DATABASE_URL must start with postgresql:// (copy it from Supabase → Connect → Session pooler).');
  const rest = m[1];
  const at = rest.lastIndexOf('@');
  const creds = at >= 0 ? rest.slice(0, at) : '';
  const hostPart = at >= 0 ? rest.slice(at + 1) : rest;
  const colon = creds.indexOf(':');
  const dec = (x: string) => {
    try {
      return decodeURIComponent(x);
    } catch {
      return x; // contains a literal % that isn't an escape — use as typed
    }
  };
  const user = dec(colon >= 0 ? creds.slice(0, colon) : creds);
  let password = colon >= 0 ? creds.slice(colon + 1) : '';
  if (/^\[?\s*YOUR[-_ ]?PASSWORD\s*\]?$/i.test(password)) throw new Error('DATABASE_URL still contains [YOUR-PASSWORD]. Replace it with your Supabase database password.');
  if (/^\[.*\]$/.test(password)) password = password.slice(1, -1); // brackets copied from the template
  password = /%[0-9a-f]{2}/i.test(password) ? dec(password) : password;
  const q = hostPart.indexOf('?');
  const hostDb = q >= 0 ? hostPart.slice(0, q) : hostPart;
  const params = new URLSearchParams(q >= 0 ? hostPart.slice(q + 1) : '');
  const slash = hostDb.indexOf('/');
  const hostPort = slash >= 0 ? hostDb.slice(0, slash) : hostDb;
  const database = dec(slash >= 0 ? hostDb.slice(slash + 1) : '') || 'postgres';
  const hp = hostPort.match(/^\[([^\]]+)\](?::(\d+))?$/) || hostPort.match(/^([^:]+)(?::(\d+))?$/);
  if (!hp || !hp[1]) throw new Error('DATABASE_URL has no host name. Copy the full string from Supabase → Connect → Session pooler.');
  const host = hp[1];
  const isSupabase = /supabase\.(co|com)$/i.test(host);
  const sslmode = params.get('sslmode') || (isSupabase ? 'require' : 'disable');
  const caPath = process.env.DATABASE_CA_CERT;
  let ssl: PgConfig['ssl'] = false;
  if (sslmode === 'require' || sslmode === 'prefer') ssl = { rejectUnauthorized: false };
  else if (sslmode === 'verify-ca' || sslmode === 'verify-full') ssl = { rejectUnauthorized: true, ca: caPath ? fs.readFileSync(caPath, 'utf8') : undefined, servername: sslmode === 'verify-full' ? host : undefined };
  return { host, port: Number(hp[2] || 5432), user: user || 'postgres', password, database, ssl };
}

/** Turns low-level connection errors into advice a non-technical person can act on. */
export function explainDbError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  const msg = err.message || String(e);
  if (err.code === '28P01' || /password authentication failed/i.test(msg)) return 'The database password is wrong. In Supabase go to Project Settings → Database → Reset database password, then paste the new password into DATABASE_URL.';
  if (/Tenant or user not found/i.test(msg)) return 'Supabase did not recognise the user name. Copy the whole Session pooler string again from Supabase → Connect (the user looks like postgres.abcdefghij).';
  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) return 'The database address could not be found. Check DATABASE_URL for typos, and use the "Session pooler" string from Supabase → Connect.';
  if (/ENETUNREACH|EHOSTUNREACH/i.test(msg)) return 'This network cannot reach that database address (often IPv6). Use the "Session pooler" string from Supabase → Connect instead of "Direct connection".';
  if (/timed out|ETIMEDOUT/i.test(msg)) return 'The database did not answer. If your Supabase project is paused, open the Supabase dashboard to resume it, then try again.';
  if (/ECONNREFUSED/i.test(msg)) return 'The database refused the connection. Check the port in DATABASE_URL (Session pooler uses 5432).';
  return msg;
}

// ── Type parsing (text format) ──────────────────────────────
const NUMERIC_OIDS = new Set([20, 21, 23, 26, 700, 701, 1700]);
function parseValue(oid: number, s: string): any {
  if (NUMERIC_OIDS.has(oid)) return Number(s);
  if (oid === 16) return s === 't';
  if (oid === 1184 || oid === 1114) {
    const d = new Date(oid === 1114 ? s.replace(' ', 'T') + 'Z' : s.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    return isNaN(d.getTime()) ? s : d.toISOString();
  }
  return s;
}

// ── Message writer ──────────────────────────────────────────
class Writer {
  private parts: Buffer[] = [];
  private size = 0;
  str(s: string) {
    return this.bytes(Buffer.concat([Buffer.from(s, 'utf8'), Buffer.from([0])]));
  }
  i16(n: number) {
    const b = Buffer.alloc(2);
    b.writeInt16BE(n);
    return this.bytes(b);
  }
  i32(n: number) {
    const b = Buffer.alloc(4);
    b.writeInt32BE(n);
    return this.bytes(b);
  }
  bytes(b: Buffer) {
    this.parts.push(b);
    this.size += b.length;
    return this;
  }
  msg(type: string | null): Buffer {
    const body = Buffer.concat(this.parts, this.size);
    const head = Buffer.alloc((type ? 1 : 0) + 4);
    if (type) head.write(type, 0, 'ascii');
    head.writeInt32BE(body.length + 4, type ? 1 : 0);
    return Buffer.concat([head, body]);
  }
}

// ── Connection ──────────────────────────────────────────────
type Msg = { type: string; body: Buffer };

export class PgConnection {
  private sock!: net.Socket;
  private buf: Buffer = Buffer.alloc(0);
  private waiters: ((m: Msg) => void)[] = [];
  private inbox: Msg[] = [];
  private queue: Promise<unknown> = Promise.resolve();
  private fatal: Error | null = null;
  closed = false;

  constructor(private cfg: PgConfig) {}

  async connect(): Promise<void> {
    let sock: net.Socket = await new Promise((res, rej) => {
      const s = net.connect({ host: this.cfg.host, port: this.cfg.port });
      s.setNoDelay(true);
      s.setTimeout(15000, () => s.destroy(new Error('PostgreSQL connection timed out')));
      s.once('connect', () => (s.setTimeout(0), res(s)));
      s.once('error', rej);
    });
    if (this.cfg.ssl) {
      sock.write(new Writer().i32(80877103).msg(null));
      const answer: Buffer = await new Promise((res, rej) => {
        sock.once('data', res);
        sock.once('error', rej);
      });
      if (answer[0] !== 0x53) throw new Error('Server does not support SSL but sslmode requires it');
      const sslCfg = this.cfg.ssl;
      sock = await new Promise((res, rej) => {
        const t = tls.connect({ socket: sock, servername: sslCfg.servername ?? (net.isIP(this.cfg.host) ? undefined : this.cfg.host), rejectUnauthorized: sslCfg.rejectUnauthorized, ca: sslCfg.ca }, () => res(t));
        t.once('error', rej);
      });
    }
    this.sock = sock;
    sock.on('data', (d: Buffer) => this.onData(d));
    sock.on('error', (e) => this.fail(e));
    sock.on('close', () => this.fail(new Error('PostgreSQL connection closed')));
    sock.write(new Writer().i32(196608).str('user').str(this.cfg.user).str('database').str(this.cfg.database).str('application_name').str('kitabash').str('client_encoding').str('UTF8').bytes(Buffer.from([0])).msg(null));
    await this.authenticate();
  }

  private fail(e: Error) {
    if (this.closed && !this.fatal) return;
    this.fatal = e;
    this.closed = true;
    for (const w of this.waiters.splice(0)) w({ type: '!', body: Buffer.from(e.message) });
  }

  private onData(d: Buffer) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    while (this.buf.length >= 5) {
      const len = this.buf.readInt32BE(1);
      if (this.buf.length < len + 1) break;
      const m: Msg = { type: String.fromCharCode(this.buf[0]), body: this.buf.subarray(5, len + 1) };
      this.buf = this.buf.subarray(len + 1);
      if (m.type === 'N' || m.type === 'S' || m.type === 'K' || m.type === 'A') continue; // notices, params, keys, notifications
      const w = this.waiters.shift();
      if (w) w(m);
      else this.inbox.push(m);
    }
  }

  private next(): Promise<Msg> {
    if (this.inbox.length) return Promise.resolve(this.inbox.shift()!);
    if (this.fatal) return Promise.reject(this.fatal);
    return new Promise((res, rej) =>
      this.waiters.push((m) => (m.type === '!' ? rej(this.fatal || new Error(m.body.toString())) : res(m))),
    );
  }

  private static errorFields(body: Buffer) {
    const f: Record<string, string> = {};
    let i = 0;
    while (i < body.length && body[i] !== 0) {
      const code = String.fromCharCode(body[i]);
      const end = body.indexOf(0, i + 1);
      f[code] = body.toString('utf8', i + 1, end);
      i = end + 1;
    }
    return f;
  }

  private async authenticate() {
    let scram: { nonce: string; bare: string; salted?: Buffer; authMsg?: string } | null = null;
    for (;;) {
      const m = await this.next();
      if (m.type === 'E') throw new PgError(PgConnection.errorFields(m.body));
      if (m.type === 'Z') return;
      if (m.type !== 'R') continue;
      const code = m.body.readInt32BE(0);
      if (code === 0) continue; // AuthenticationOk
      if (code === 3) {
        this.sock.write(new Writer().str(this.cfg.password).msg('p'));
      } else if (code === 5) {
        const salt = m.body.subarray(4, 8);
        const inner = crypto.createHash('md5').update(this.cfg.password + this.cfg.user).digest('hex');
        const outer = crypto.createHash('md5').update(Buffer.concat([Buffer.from(inner), salt])).digest('hex');
        this.sock.write(new Writer().str('md5' + outer).msg('p'));
      } else if (code === 10) {
        const mechs = m.body.subarray(4).toString('utf8').split('\0');
        if (!mechs.includes('SCRAM-SHA-256')) throw new Error(`Unsupported SASL mechanisms: ${mechs.join(', ')}`);
        const nonce = crypto.randomBytes(18).toString('base64');
        const bare = `n=,r=${nonce}`; // same as libpq: user comes from the startup message
        const first = Buffer.from(`n,,${bare}`);
        scram = { nonce, bare };
        this.sock.write(new Writer().str('SCRAM-SHA-256').i32(first.length).bytes(first).msg('p'));
      } else if (code === 11 && scram) {
        const serverFirst = m.body.subarray(4).toString('utf8');
        const attrs = Object.fromEntries(serverFirst.split(',').map((kv) => [kv[0], kv.slice(2)]));
        if (!attrs.r?.startsWith(scram.nonce)) throw new Error('SCRAM: server nonce mismatch');
        const salted = crypto.pbkdf2Sync(this.cfg.password.normalize('NFKC'), Buffer.from(attrs.s, 'base64'), Number(attrs.i), 32, 'sha256');
        const clientKey = crypto.createHmac('sha256', salted).update('Client Key').digest();
        const storedKey = crypto.createHash('sha256').update(clientKey).digest();
        const finalNoProof = `c=biws,r=${attrs.r}`;
        const authMsg = `${scram.bare},${serverFirst},${finalNoProof}`;
        const sig = crypto.createHmac('sha256', storedKey).update(authMsg).digest();
        const proof = Buffer.from(clientKey.map((b, i) => b ^ sig[i]));
        scram.salted = salted;
        scram.authMsg = authMsg;
        this.sock.write(new Writer().bytes(Buffer.from(`${finalNoProof},p=${proof.toString('base64')}`)).msg('p'));
      } else if (code === 12 && scram?.salted) {
        const v = m.body.subarray(4).toString('utf8').match(/v=([^,]+)/)?.[1];
        const serverKey = crypto.createHmac('sha256', scram.salted).update('Server Key').digest();
        const expected = crypto.createHmac('sha256', serverKey).update(scram.authMsg!).digest('base64');
        if (v !== expected) throw new Error('SCRAM: server signature mismatch');
      } else {
        throw new Error(`Unsupported PostgreSQL auth method (code ${code})`);
      }
    }
  }

  /** Run one parameterised statement. Calls on a connection are serialised. */
  query(text: string, params: any[] = []): Promise<QueryResult> {
    const p = this.queue.then(() => this.exec(text, params));
    this.queue = p.catch(() => {});
    return p;
  }

  /** Multi-statement SQL (migrations). No parameters. */
  simple(text: string): Promise<void> {
    const p = this.queue.then(async () => {
      if (this.fatal) throw this.fatal;
      this.sock.write(new Writer().str(text).msg('Q'));
      let err: PgError | null = null;
      for (;;) {
        const m = await this.next();
        if (m.type === 'E') err = new PgError(PgConnection.errorFields(m.body));
        if (m.type === 'Z') break;
      }
      if (err) throw err;
    });
    this.queue = p.catch(() => {});
    return p;
  }

  private async exec(text: string, params: any[]): Promise<QueryResult> {
    if (this.fatal) throw this.fatal;
    const bind = new Writer().str('').str('').i16(0).i16(params.length);
    for (const v of params) {
      if (v === null || v === undefined) bind.i32(-1);
      else {
        const b = Buffer.from(typeof v === 'boolean' ? (v ? 'true' : 'false') : typeof v === 'object' ? JSON.stringify(v) : String(v), 'utf8');
        bind.i32(b.length).bytes(b);
      }
    }
    bind.i16(0);
    this.sock.write(
      Buffer.concat([
        new Writer().str('').str(text).i16(0).msg('P'),
        bind.msg('B'),
        new Writer().bytes(Buffer.from('P')).str('').msg('D'),
        new Writer().str('').i32(0).msg('E'),
        new Writer().msg('S'),
      ]),
    );
    let fields: { name: string; oid: number }[] = [];
    const rows: Record<string, any>[] = [];
    let rowCount = 0;
    let err: PgError | null = null;
    for (;;) {
      const m = await this.next();
      switch (m.type) {
        case 'T': {
          const n = m.body.readInt16BE(0);
          let o = 2;
          fields = [];
          for (let i = 0; i < n; i++) {
            const end = m.body.indexOf(0, o);
            const name = m.body.toString('utf8', o, end);
            o = end + 1;
            const oid = m.body.readInt32BE(o + 6);
            o += 18;
            fields.push({ name, oid });
          }
          break;
        }
        case 'D': {
          const n = m.body.readInt16BE(0);
          let o = 2;
          const row: Record<string, any> = {};
          for (let i = 0; i < n; i++) {
            const len = m.body.readInt32BE(o);
            o += 4;
            if (len === -1) row[fields[i].name] = null;
            else {
              row[fields[i].name] = parseValue(fields[i].oid, m.body.toString('utf8', o, o + len));
              o += len;
            }
          }
          rows.push(row);
          break;
        }
        case 'C': {
          const tag = m.body.toString('utf8', 0, m.body.length - 1);
          const num = Number(tag.split(' ').pop());
          rowCount = Number.isFinite(num) ? num : rows.length;
          break;
        }
        case 'E':
          err = new PgError(PgConnection.errorFields(m.body));
          break;
        case 'Z':
          if (err) throw err;
          return { rows, rowCount };
        default:
          break; // '1' ParseComplete, '2' BindComplete, 'n' NoData, 'I' EmptyQuery
      }
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.sock.end(new Writer().msg('X'));
    } catch {}
  }
}

// ── Pool ────────────────────────────────────────────────────
export class PgPool {
  private idle: PgConnection[] = [];
  private total = 0;
  private waiting: ((c: PgConnection) => void)[] = [];
  constructor(private cfg: PgConfig, private max = Number(process.env.DATABASE_POOL_SIZE || 5)) {}

  async acquire(): Promise<PgConnection> {
    while (this.idle.length) {
      const c = this.idle.pop()!;
      if (!c.closed) return c;
      this.total--;
    }
    if (this.total < this.max) {
      this.total++;
      const c = new PgConnection(this.cfg);
      try {
        await c.connect();
      } catch (e) {
        this.total--;
        throw e;
      }
      return c;
    }
    return new Promise((res) => this.waiting.push(res));
  }

  release(c: PgConnection) {
    if (c.closed) {
      this.total--;
      // A waiter may need a fresh connection
      const w = this.waiting.shift();
      if (w) this.acquire().then(w, () => {});
      return;
    }
    const w = this.waiting.shift();
    if (w) w(c);
    else this.idle.push(c);
  }

  async query(text: string, params: any[] = []) {
    const c = await this.acquire();
    try {
      return await c.query(text, params);
    } finally {
      this.release(c);
    }
  }

  async end() {
    for (const c of this.idle.splice(0)) c.close();
  }
}
