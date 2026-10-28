// Password hashing (scrypt), session tokens, and role-based access control.
import crypto from 'node:crypto';
import { get, run, id, all } from './db/index.ts';
import { HttpError } from './validate.ts';

export type Role = 'admin' | 'instructor' | 'student' | 'guardian';
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  birth_year: number | null;
}

const SESSION_DAYS = 7;

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, saltB64, hashB64] = stored.split('$');
  if (alg !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(pw, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(expected, actual);
}

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await run('INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)', sha(token), userId, expires.toISOString());
  return { token, expires };
}

export async function destroySession(token: string) {
  await run('DELETE FROM sessions WHERE id = ?', sha(token));
}

export async function userFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const row = await get<User & { expires_at: string; disabled: number }>(
    `SELECT u.id,u.email,u.name,u.role,u.birth_year,u.disabled,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=?`,
    sha(token),
  );
  if (!row || row.disabled || new Date(row.expires_at) < new Date()) return null;
  const { expires_at, disabled, ...user } = row;
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const row = await get<User & { password_hash: string; disabled: number }>('SELECT * FROM users WHERE email = ?', email);
  // Run a hash even for unknown users to keep timing similar.
  const ok = row ? verifyPassword(password, row.password_hash) : (verifyPassword(password, hashPassword('x')), false);
  if (!row || !ok || row.disabled) throw new HttpError(401, 'Email or password is incorrect.');
  return { id: row.id, email: row.email, name: row.name, role: row.role, birth_year: row.birth_year };
}

export async function createUser(u: { email: string; name: string; role: Role; password: string; birth_year?: number | null }): Promise<string> {
  if (await get('SELECT 1 FROM users WHERE email = ?', u.email)) throw new HttpError(409, 'That email is already registered.');
  const uid = id('u_');
  await run('INSERT INTO users (id,email,name,role,birth_year,password_hash) VALUES (?,?,?,?,?,?)', uid, u.email, u.name, u.role, u.birth_year ?? null, hashPassword(u.password));
  return uid;
}

// ── RBAC ────────────────────────────────────────────────────
// A single permission table keeps authorisation reviewable in one place.
export const PERMISSIONS = {
  'catalog.read': ['admin', 'instructor', 'student', 'guardian'],
  'course.edit': ['admin'],
  'course.publish': ['admin'],
  'course.approve': ['admin'],
  'taxonomy.edit': ['admin'],
  'agent.configure': ['admin'],
  'agent.test': ['admin'],
  'agent.publish': ['admin'],
  'knowledge.manage': ['admin'],
  'assets.manage': ['admin'],
  'assets.read': ['admin', 'instructor'],
  'mapping.edit': ['admin'],
  'mapping.approve': ['admin'],
  'integrations.manage': ['admin'],
  'users.manage': ['admin'],
  'insights.read': ['admin'],
  'teacher.content': ['admin', 'instructor'], // answer keys, rubrics, teacher notes
  'teacher.cofacilitate': ['admin', 'instructor'],
  'student.review': ['admin', 'instructor'],
  'learn': ['student', 'admin', 'instructor'],
  'guardian.view': ['guardian'],
  'classes.manage': ['admin'],
  'classes.view': ['admin', 'instructor', 'student', 'guardian'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(user: User | null, perm: Permission): boolean {
  return !!user && (PERMISSIONS[perm] as readonly Role[]).includes(user.role);
}

export function requireUser(user: User | null): User {
  if (!user) throw new HttpError(401, 'Please sign in.');
  return user;
}

export function requirePerm(user: User | null, perm: Permission): User {
  const u = requireUser(user);
  if (!can(u, perm)) throw new HttpError(403, 'You do not have permission to do that.');
  return u;
}

// ── Guardian consent (child safeguarding) ───────────────────
export function ageOf(user: Pick<User, 'birth_year'>): number | null {
  return user.birth_year ? new Date().getFullYear() - user.birth_year : null;
}

export interface Consent {
  ai: boolean;
  audio: boolean;
  requiresGuardian: boolean;
}

/** Under-18 learners (or unknown age) need guardian consent for AI chat and audio. */
export async function consentFor(user: User): Promise<Consent> {
  if (user.role !== 'student') return { ai: true, audio: true, requiresGuardian: false };
  const age = ageOf(user);
  if (age !== null && age >= 18) return { ai: true, audio: true, requiresGuardian: false };
  const links = await all<{ consent_ai: number; consent_audio: number }>('SELECT consent_ai, consent_audio FROM guardian_links WHERE student_id = ?', user.id);
  return {
    ai: links.some((l) => l.consent_ai === 1),
    audio: links.some((l) => l.consent_audio === 1),
    requiresGuardian: true,
  };
}
