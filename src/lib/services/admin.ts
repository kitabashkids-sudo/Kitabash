// Admin services: taxonomy, media asset library, curriculum board mappings,
// integrations registry, users/enrolments/guardians, data retention & deletion.
import { all, get, run, id, j, tx, uniqueSlug, audit, currentDialect } from '../db/index.ts';
import { storage } from '../storage.ts';
import { HttpError } from '../validate.ts';
import { createUser, type Role } from '../auth.ts';
import { listProviders } from '../agent/providers/index.ts';

// ── Taxonomy ───────────────────────────────────────────────
export async function taxonomy() {
  const cats = await all('SELECT * FROM categories ORDER BY sort, name');
  const subs = await all('SELECT s.*, (SELECT COUNT(*) FROM courses c WHERE c.subject_id=s.id) course_count FROM subjects s ORDER BY name');
  return cats.map((c) => ({ ...c, subjects: subs.filter((s) => s.category_id === c.id) }));
}
export async function addCategory(name: string, description: string, icon: string, userId: string) {
  const cid = id('cat_');
  const sort = ((await get('SELECT MAX(sort) m FROM categories'))?.m ?? 0) + 1;
  await run('INSERT INTO categories (id,name,slug,description,icon,sort) VALUES (?,?,?,?,?,?)', cid, name, await uniqueSlug('categories', name), description, icon || 'book', sort);
  await audit(userId, 'create', 'category', cid, name);
  return cid;
}
export async function updateCategory(cid: string, patch: { name?: string; description?: string; icon?: string }) {
  await run('UPDATE categories SET name=COALESCE(?,name), description=COALESCE(?,description), icon=COALESCE(?,icon) WHERE id=?', patch.name ?? null, patch.description ?? null, patch.icon ?? null, cid);
}
export async function deleteCategory(cid: string) {
  if (await get('SELECT 1 FROM subjects WHERE category_id=?', cid)) throw new HttpError(409, 'Move or delete this category’s subjects first.');
  await run('DELETE FROM categories WHERE id=?', cid);
}
export async function addSubject(categoryId: string, name: string, description: string, userId: string) {
  if (!await get('SELECT 1 FROM categories WHERE id=?', categoryId)) throw new HttpError(400, 'Choose a valid category.');
  const sid = id('sub_');
  await run('INSERT INTO subjects (id,category_id,name,slug,description) VALUES (?,?,?,?,?)', sid, categoryId, name, await uniqueSlug('subjects', name), description);
  await audit(userId, 'create', 'subject', sid, name);
  return sid;
}
export async function updateSubject(sid: string, patch: { name?: string; description?: string; category_id?: string }) {
  await run('UPDATE subjects SET name=COALESCE(?,name), description=COALESCE(?,description), category_id=COALESCE(?,category_id) WHERE id=?', patch.name ?? null, patch.description ?? null, patch.category_id ?? null, sid);
}
export async function deleteSubject(sid: string) {
  if (await get('SELECT 1 FROM courses WHERE subject_id=?', sid)) throw new HttpError(409, 'This subject has courses. Move them first.');
  await run('DELETE FROM subjects WHERE id=?', sid);
}

// ── Asset library ──────────────────────────────────────────
const ASSET_TYPES: Record<string, { kind: 'video' | 'image' | 'svg' | 'audio'; mime: string }> = {
  mp4: { kind: 'video', mime: 'video/mp4' },
  webm: { kind: 'video', mime: 'video/webm' },
  png: { kind: 'image', mime: 'image/png' },
  jpg: { kind: 'image', mime: 'image/jpeg' },
  jpeg: { kind: 'image', mime: 'image/jpeg' },
  webp: { kind: 'image', mime: 'image/webp' },
  gif: { kind: 'image', mime: 'image/gif' },
  svg: { kind: 'svg', mime: 'image/svg+xml' },
  mp3: { kind: 'audio', mime: 'audio/mpeg' },
  m4a: { kind: 'audio', mime: 'audio/mp4' },
  wav: { kind: 'audio', mime: 'audio/wav' },
};

export async function listAssets(q?: string) {
  const rows = (await all('SELECT id,title,kind,mime,size_bytes,tags,alt_text,captions,version,created_at FROM assets ORDER BY created_at DESC')).map((a: any) => ({ ...a, tags: j<string[]>(a.tags, []) }));
  if (!q) return rows;
  const t = q.toLowerCase();
  return rows.filter((a) => a.title.toLowerCase().includes(t) || a.tags.some((x: string) => x.toLowerCase().includes(t)));
}

/** Strip scripts/handlers from uploaded SVG so it is safe to render inline. */
export function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '');
}

export async function uploadAsset(file: { filename: string; data: Buffer }, meta: { title: string; tags: string[]; alt_text: string; captions: string }, userId: string, replaceId?: string) {
  const ext = (file.filename.split('.').pop() || '').toLowerCase();
  const t = ASSET_TYPES[ext];
  if (!t) throw new HttpError(415, `Unsupported media type .${ext}. Use ${Object.keys(ASSET_TYPES).join(', ')}.`);
  if (file.data.length > 25 * 1024 * 1024) throw new HttpError(413, 'Media files must be 25 MB or smaller.');
  if (!meta.alt_text.trim()) throw new HttpError(400, 'A text alternative is required for accessibility.');
  const data = t.kind === 'svg' ? Buffer.from(sanitizeSvg(file.data.toString('utf8'))) : file.data;
  const old = replaceId ? await get('SELECT * FROM assets WHERE id=?', replaceId) : null;
  if (replaceId && !old) throw new HttpError(404, 'Asset not found');
  const aid = old?.id || id('as_');
  const rel = `assets/${aid}-v${(old?.version || 0) + 1}.${ext}`;
  await storage().put(rel, data, t.mime);
  if (old) {
    await storage().remove(old.storage_path);
    await run('UPDATE assets SET title=?, kind=?, mime=?, storage_path=?, size_bytes=?, tags=?, alt_text=?, captions=?, version=version+1 WHERE id=?', meta.title || old.title, t.kind, t.mime, rel, data.length, meta.tags, meta.alt_text, meta.captions, aid);
  } else {
    await run('INSERT INTO assets (id,title,kind,mime,storage_path,size_bytes,tags,alt_text,captions,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)', aid, meta.title || file.filename, t.kind, t.mime, rel, data.length, meta.tags, meta.alt_text, meta.captions, userId);
  }
  await audit(userId, old ? 'asset.replace' : 'asset.upload', 'asset', aid, file.filename);
  return aid;
}

export async function updateAssetMeta(aid: string, patch: { title?: string; tags?: string[]; alt_text?: string; captions?: string }) {
  await run('UPDATE assets SET title=COALESCE(?,title), tags=COALESCE(?,tags), alt_text=COALESCE(?,alt_text), captions=COALESCE(?,captions) WHERE id=?', patch.title ?? null, patch.tags ?? null, patch.alt_text ?? null, patch.captions ?? null, aid);
}

export async function deleteAsset(aid: string) {
  const a = await get('SELECT * FROM assets WHERE id=?', aid);
  if (!a) throw new HttpError(404, 'Asset not found');
  const used = (await get('SELECT COUNT(*) n FROM lessons WHERE hook LIKE ? OR teacher LIKE ? OR learn LIKE ?', `%${aid}%`, `%${aid}%`, `%${aid}%`))?.n || 0;
  if (used) throw new HttpError(409, `This asset is used by ${used} lesson(s). Remove it from those lessons first.`);
  await storage().remove(a.storage_path);
  await run('DELETE FROM assets WHERE id=?', aid);
}

export async function assetFile(aid: string) {
  const a = await get('SELECT * FROM assets WHERE id=?', aid);
  if (!a) throw new HttpError(404, 'Asset not found');
  return { key: a.storage_path as string, mime: a.mime, alt: a.alt_text, captions: a.captions, kind: a.kind };
}

// ── Curriculum mapping (CBSE / CISCE / IGCSE / Olympiad) ────
export async function listTracks(courseId: string) {
  const tracks = await all('SELECT * FROM curriculum_tracks WHERE course_id=? ORDER BY pathway, board, grade', courseId);
  const maps = await all('SELECT m.*, l.title lesson_title FROM curriculum_mappings m LEFT JOIN lessons l ON l.id=m.lesson_id WHERE m.track_id IN (SELECT id FROM curriculum_tracks WHERE course_id=?) ORDER BY m.created_at', courseId);
  return tracks.map((t) => ({ ...t, mappings: maps.filter((m) => m.track_id === t.id) }));
}

export async function addTrack(courseId: string, t: { pathway: string; board: string; grade: string; subject: string; syllabus_code: string; syllabus_year: string; title: string }) {
  const tid = id('tr_');
  await run('INSERT INTO curriculum_tracks (id,course_id,pathway,board,grade,subject,syllabus_code,syllabus_year,title) VALUES (?,?,?,?,?,?,?,?,?)', tid, courseId, t.pathway, t.board, t.grade, t.subject, t.syllabus_code, t.syllabus_year, t.title);
  return tid;
}

export async function deleteTrack(trackId: string) {
  await run('DELETE FROM curriculum_tracks WHERE id=?', trackId);
}

export async function addMapping(trackId: string, m: { topic: string; objective: string; assessment_format: string; reference_source: string; lesson_id?: string | null }) {
  const t = await get('SELECT * FROM curriculum_tracks WHERE id=?', trackId);
  if (!t) throw new HttpError(404, 'Track not found');
  if (m.lesson_id && !await get('SELECT 1 FROM lessons WHERE id=? AND course_id=?', m.lesson_id, t.course_id)) throw new HttpError(400, 'Lesson is not in this course');
  const mid = id('mp_');
  // New mappings are ALWAYS unverified: alignment claims need human review.
  await run('INSERT INTO curriculum_mappings (id,track_id,lesson_id,topic,objective,assessment_format,reference_source,review_status) VALUES (?,?,?,?,?,?,?,?)', mid, trackId, m.lesson_id || null, m.topic, m.objective, m.assessment_format, m.reference_source, 'unverified');
  return mid;
}

/** CSV import: topic,objective,assessment_format,reference_source (header row required). */
export async function importMappings(trackId: string, csv: string) {
  const lines = csv.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new HttpError(400, 'CSV needs a header row and at least one data row.');
  const parseLine = (l: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (ch === '"' && l[i + 1] === '"' && q) (cur += '"'), i++;
      else if (ch === '"') q = !q;
      else if (ch === ',' && !q) out.push(cur.trim()), (cur = '');
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const col = (n: string) => header.indexOf(n);
  if (col('topic') < 0) throw new HttpError(400, 'CSV header must include a "topic" column.');
  let n = 0;
  await tx(async () => {
    for (const l of lines.slice(1, 1001)) {
      const c = parseLine(l);
      if (!c[col('topic')]) continue;
      await addMapping(trackId, { topic: c[col('topic')], objective: c[col('objective')] || '', assessment_format: c[col('assessment_format')] || '', reference_source: c[col('reference_source')] || '' });
      n++;
    }
  });
  return n;
}

export async function reviewMapping(mappingId: string, status: 'unverified' | 'in_review' | 'approved' | 'rejected', userId: string, lessonId?: string | null) {
  const m = await get('SELECT * FROM curriculum_mappings WHERE id=?', mappingId);
  if (!m) throw new HttpError(404, 'Mapping not found');
  if (status === 'approved' && !m.reference_source.trim()) throw new HttpError(400, 'Add the official reference source (document, year, page/section) before approving an alignment claim.');
  await run("UPDATE curriculum_mappings SET review_status=?, reviewed_by=?, reviewed_at=datetime('now'), lesson_id=COALESCE(?, lesson_id) WHERE id=?", status, userId, lessonId ?? null, mappingId);
  await audit(userId, `mapping.${status}`, 'curriculum_mapping', mappingId);
}

export async function deleteMapping(mappingId: string) {
  await run('DELETE FROM curriculum_mappings WHERE id=?', mappingId);
}

// ── Integrations registry ──────────────────────────────────
type IStatus = 'available' | 'connected' | 'awaiting_credentials' | 'failed' | 'unsupported';
interface IntegrationDef {
  key: string;
  name: string;
  purpose: string;
  status: () => IStatus;
  detail: () => string;
  manual: string;
}
const env = (k: string) => !!process.env[k];

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: 'database',
    name: 'Database',
    purpose: 'Courses, users, progress, agent configurations',
    status: () => 'connected',
    detail: () => (currentDialect() === 'postgres' ? `PostgreSQL via DATABASE_URL${/supabase/.test(process.env.DATABASE_URL || '') ? ' (Supabase)' : ''}. Row Level Security locks out Supabase’s public API roles.` : 'Local SQLite file in DATA_DIR. Set DATABASE_URL to use Supabase Postgres.'),
    manual: '—',
  },
  {
    key: 'supabase_storage',
    name: 'File storage',
    purpose: 'Knowledge files and media assets',
    status: () => 'connected',
    detail: () => (storage().driver === 'supabase' ? `Supabase Storage, private bucket “${process.env.SUPABASE_STORAGE_BUCKET || 'kitabash'}”. Files are served only through Kitabash’s permission checks.` : 'Local disk (DATA_DIR/uploads). Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to use Supabase Storage.'),
    manual: '—',
  },
  {
    key: 'supabase_auth',
    name: 'Supabase Auth',
    purpose: 'Single sign-on / social login',
    status: () => 'unsupported',
    detail: () => 'Not used: Kitabash has its own accounts (scrypt passwords, server sessions, roles, guardian links). Supabase Auth integration is a possible future step.',
    manual: 'Admins create accounts in Platform → People.',
  },
  { key: 'ai', name: 'AI model provider', purpose: 'Learning agents, co-facilitator, curriculum drafts', status: () => (listProviders().some((p) => p.isLLM && p.configured) ? 'connected' : 'awaiting_credentials'), detail: () => { const p = listProviders(); const on = p.filter((x) => x.isLLM && x.configured).map((x) => x.label); return on.length ? `Configured: ${on.join(', ')}. Active: AI_PROVIDER=${process.env.AI_PROVIDER || 'mock'}.` : 'No API key set. The offline demo tutor (rule-based, not an AI model) is used.'; }, manual: 'Offline demo tutor + teacher-authored content.' },
  { key: 'browser_audio', name: 'Browser audio recording', purpose: 'Speaking practice (record & play back on the device)', status: () => 'available', detail: () => 'Uses the browser MediaRecorder API. Recordings stay on the learner’s device. Guardian consent required for under-18s.', manual: 'Learner reads aloud to the teacher.' },
  { key: 'browser_tts', name: 'Browser text-to-speech', purpose: 'Model phrases in speaking activities', status: () => 'available', detail: () => 'Uses the browser speechSynthesis API; voice quality depends on the device.', manual: 'Teacher models the phrase.' },
  { key: 'speech_assessment', name: 'Speech-to-text / pronunciation scoring', purpose: 'Automated spoken English feedback', status: () => (env('SPEECH_TO_TEXT_API_KEY') ? 'available' : 'awaiting_credentials'), detail: () => 'No adapter is implemented in v0.1. Speaking activities use self-assessment checklists.', manual: 'Self-check list + teacher listening.' },
  { key: 'ocr', name: 'OCR / handwriting analysis', purpose: 'Text from images; handwriting feedback', status: () => (env('OCR_API_KEY') ? 'available' : 'awaiting_credentials'), detail: () => 'No adapter implemented in v0.1. Tracing activities are scored geometrically in the browser/server instead.', manual: 'Teacher checks paper work (“practised offline” option).' },
  { key: 'email', name: 'Email notifications', purpose: 'Guardian/teacher notices', status: () => (env('SMTP_URL') ? 'available' : 'awaiting_credentials'), detail: () => 'Not implemented in v0.1.', manual: 'Share progress from the Guardian page.' },
  { key: 'scratch', name: 'Scratch / MakeCode / App Inventor / Micro:bit', purpose: 'Coding resources', status: () => 'unsupported', detail: () => 'No embedding or automation is assumed. Link to official sites as course resources; check each service’s terms before embedding.', manual: 'Add official links in the knowledge library and teacher resources.' },
  { key: 'calendar', name: 'Calendar & scheduling', purpose: 'Class scheduling', status: () => 'unsupported', detail: () => 'Not implemented.', manual: 'Use your school calendar.' },
];

export async function integrationStatus() {
  const overrides = await all('SELECT * FROM integrations');
  return INTEGRATIONS.map((i) => {
    const o = overrides.find((x) => x.key === i.key);
    const status: IStatus = o?.last_error ? 'failed' : i.status();
    return { key: i.key, name: i.name, purpose: i.purpose, status, detail: o?.last_error ? `Last check failed: ${o.last_error}` : i.detail(), manual: i.manual, lastCheck: o?.last_check || null };
  });
}

// ── Users / enrolment / guardians ──────────────────────────
export async function listUsers() {
  return await all('SELECT id,email,name,role,birth_year,disabled,created_at FROM users ORDER BY role, name');
}
export async function adminCreateUser(u: { email: string; name: string; role: Role; password: string; birth_year?: number | null }, adminId: string) {
  const uid = await createUser(u);
  await audit(adminId, 'create', 'user', uid, u.role);
  return uid;
}
export async function linkGuardian(guardianId: string, studentId: string) {
  const g = await get("SELECT 1 FROM users WHERE id=? AND role='guardian'", guardianId);
  const s = await get("SELECT 1 FROM users WHERE id=? AND role='student'", studentId);
  if (!g || !s) throw new HttpError(400, 'Pick a guardian and a student.');
  await run('INSERT OR IGNORE INTO guardian_links (guardian_id,student_id) VALUES (?,?)', guardianId, studentId);
}
export async function adminEnrol(userId: string, courseId: string) {
  await run('INSERT OR IGNORE INTO enrolments (id,user_id,course_id) VALUES (?,?,?)', id('e_'), userId, courseId);
}

/** Right-to-erasure: removes a learner and all their learning records. */
export async function deleteLearnerData(userId: string, adminId: string) {
  const u = await get('SELECT * FROM users WHERE id=?', userId);
  if (!u) throw new HttpError(404, 'User not found');
  if (u.role === 'admin') throw new HttpError(400, 'Admins cannot be deleted here.');
  await tx(async () => {
    await run('DELETE FROM users WHERE id=?', userId); // cascades: sessions, enrolments, progress, attempts, guardian links
    await audit(adminId, 'user.erase', 'user', userId, u.role);
  });
}

export async function exportLearnerData(userId: string) {
  const u = await get('SELECT id,email,name,role,birth_year,created_at FROM users WHERE id=?', userId);
  if (!u) throw new HttpError(404, 'User not found');
  return {
    user: u,
    enrolments: await all('SELECT course_id, created_at FROM enrolments WHERE user_id=?', userId),
    progress: await all('SELECT * FROM lesson_progress WHERE user_id=?', userId),
    attempts: await all('SELECT activity_id, response, score, max_score, feedback, created_at FROM attempts WHERE user_id=?', userId),
    note: 'AI tutor logs are pseudonymous and not linked to this account.',
  };
}

export async function purgeOldLogs(days = Number(process.env.AI_LOG_RETENTION_DAYS || 90)) {
  const r = await run(`DELETE FROM agent_logs WHERE created_at < datetime('now', ?)`, `-${days} days`);
  await run(`DELETE FROM sessions WHERE expires_at < ?`, new Date().toISOString());
  return Number(r.changes);
}

export async function auditLog(limit = 100) {
  return await all('SELECT a.*, u.name user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT ?', limit);
}
