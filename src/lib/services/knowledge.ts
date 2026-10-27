// Course knowledge library: upload, extract, URL verification, replace, remove, search, preview.
import { all, get, run, id, tx, audit } from '../db/index.ts';
import { storage } from '../storage.ts';
import { HttpError } from '../validate.ts';
import { extract, extOf, ACCEPTED_EXT, htmlToText, chunkSections } from '../knowledge/extract.ts';
import { retrieve } from '../knowledge/retrieval.ts';

const MAX_BYTES = 15 * 1024 * 1024;

export async function listResources(courseId: string) {
  return (await all(
    `SELECT r.*, (SELECT COUNT(*) FROM resource_chunks c WHERE c.resource_id=r.id) chunk_count FROM resources r
     WHERE r.course_id=? AND r.replaced_by IS NULL ORDER BY r.created_at DESC`,
    courseId,
  )).map(({ storage_path, ...r }) => r);
}

async function storeChunks(resourceId: string, courseId: string, chunks: { ref: string; text: string }[]) {
  await run('DELETE FROM resource_chunks WHERE resource_id=?', resourceId);
  for (const [i, c] of chunks.entries()) await run('INSERT INTO resource_chunks (id,resource_id,course_id,ord,ref,text) VALUES (?,?,?,?,?,?)', id('ch_'), resourceId, courseId, i, c.ref, c.text);
}

export async function uploadResource(courseId: string, file: { filename: string; mime: string; data: Buffer }, meta: { title?: string; audience?: 'teacher' | 'student' }, userId: string, replaces?: string) {
  if (!await get('SELECT 1 FROM courses WHERE id=?', courseId)) throw new HttpError(404, 'Course not found');
  const ext = extOf(file.filename);
  if (!ACCEPTED_EXT.includes(ext)) throw new HttpError(415, `.${ext || '?'} files are not supported. Accepted: ${ACCEPTED_EXT.join(', ')}`);
  if (file.data.length > MAX_BYTES) throw new HttpError(413, 'Files must be 15 MB or smaller.');
  const old = replaces ? await get('SELECT * FROM resources WHERE id=? AND course_id=?', replaces, courseId) : null;
  if (replaces && !old) throw new HttpError(404, 'Resource to replace not found');
  const rid = id('r_');
  const rel = `knowledge/${courseId}/${rid}.${ext}`;
  await storage().put(rel, file.data, file.mime || 'application/octet-stream');
  const ex = await extract(file.filename, file.data);
  await tx(async () => {
    await run(
      'INSERT INTO resources (id,course_id,title,kind,source,mime,storage_path,size_bytes,version,audience,extraction_status,extraction_note,text_chars,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      rid, courseId, meta.title || old?.title || file.filename.replace(/\.[^.]+$/, ''), 'file', file.filename, file.mime, rel, file.data.length, old ? old.version + 1 : 1,
      meta.audience || old?.audience || 'teacher', ex.status, ex.note, ex.chunks.reduce((s, c) => s + c.text.length, 0), userId,
    );
    await storeChunks(rid, courseId, ex.chunks);
    if (old) {
      await run('UPDATE resources SET replaced_by=? WHERE id=?', rid, old.id);
      await run('DELETE FROM resource_chunks WHERE resource_id=?', old.id);
    }
    await audit(userId, old ? 'knowledge.replace' : 'knowledge.upload', 'resource', rid, file.filename);
  });
  return { id: rid, status: ex.status, note: ex.note, chunks: ex.chunks.length };
}

export async function addUrl(courseId: string, url: string, title: string, userId: string) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new HttpError(400, 'Enter a full URL starting with https://');
  }
  if (!['https:', 'http:'].includes(u.protocol)) throw new HttpError(400, 'Only http(s) links are allowed.');
  const rid = id('r_');
  await run(
    'INSERT INTO resources (id,course_id,title,kind,source,extraction_status,extraction_note,created_by) VALUES (?,?,?,?,?,?,?,?)',
    rid, courseId, title || u.hostname, 'url', u.toString(), 'url_unverified', 'Not checked yet. A link is not assumed to be reachable until verified.', userId,
  );
  return rid;
}

function isPrivateHost(h: string) {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i.test(h);
}

/** Server-side check: fetch with timeout, size cap and SSRF guard; extract HTML/text when reachable. */
export async function verifyUrl(resourceId: string) {
  const r = await get("SELECT * FROM resources WHERE id=? AND kind='url'", resourceId);
  if (!r) throw new HttpError(404, 'Link not found');
  const u = new URL(r.source);
  if (isPrivateHost(u.hostname)) {
    await run("UPDATE resources SET extraction_status='url_unreachable', extraction_note=? WHERE id=?", 'Private/internal addresses are blocked.', r.id);
    return;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'KitabashLinkChecker/0.1' } });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let note = `Reachable (HTTP ${res.status}, ${ct.split(';')[0] || 'unknown type'}).`;
    if (/text\/(html|plain|markdown)/.test(ct)) {
      const body = (await res.text()).slice(0, 2_000_000);
      const chunks = chunkSections(/html/.test(ct) ? htmlToText(body) : body).slice(0, 200);
      await tx(async () => {
        await storeChunks(r.id, r.course_id, chunks);
        await run('UPDATE resources SET text_chars=? WHERE id=?', chunks.reduce((s, c) => s + c.text.length, 0), r.id);
      });
      note += ` Extracted ${chunks.length} passages. Check the site's terms permit this use.`;
    } else note += ' Content type not extracted; kept as a reference link.';
    await run("UPDATE resources SET extraction_status='url_reachable', extraction_note=? WHERE id=?", note, r.id);
  } catch (e) {
    await run("UPDATE resources SET extraction_status='url_unreachable', extraction_note=? WHERE id=?", `Could not reach the link: ${(e as Error).message}`.slice(0, 300), r.id);
  } finally {
    clearTimeout(t);
  }
}

export async function previewResource(resourceId: string) {
  const r = await get('SELECT * FROM resources WHERE id=?', resourceId);
  if (!r) throw new HttpError(404, 'Resource not found');
  const chunks = await all('SELECT ord, ref, text FROM resource_chunks WHERE resource_id=? ORDER BY ord LIMIT 60', resourceId);
  const history: any[] = [];
  let prev = await get('SELECT id,version,source,created_at FROM resources WHERE replaced_by=?', r.id);
  while (prev && history.length < 20) {
    history.push(prev);
    prev = await get('SELECT id,version,source,created_at FROM resources WHERE replaced_by=?', prev.id);
  }
  const { storage_path, ...rest } = r;
  return { resource: rest, chunks, history };
}

export async function updateResourceMeta(resourceId: string, patch: { title?: string; audience?: 'teacher' | 'student' }) {
  await run('UPDATE resources SET title=COALESCE(?,title), audience=COALESCE(?,audience) WHERE id=?', patch.title ?? null, patch.audience ?? null, resourceId);
}

export async function deleteResource(resourceId: string, userId: string) {
  const r = await get('SELECT * FROM resources WHERE id=?', resourceId);
  if (!r) throw new HttpError(404, 'Resource not found');
  // Remove file + all prior versions' files
  const chain = [r];
  let prev = await get('SELECT * FROM resources WHERE replaced_by=?', r.id);
  while (prev) {
    chain.push(prev);
    prev = await get('SELECT * FROM resources WHERE replaced_by=?', prev.id);
  }
  await tx(async () => {
    for (const x of chain) {
      if (x.storage_path) await storage().remove(x.storage_path);
      await run('UPDATE resources SET replaced_by=NULL WHERE replaced_by=?', x.id);
    }
    for (const x of chain) await run('DELETE FROM resources WHERE id=?', x.id);
    await audit(userId, 'knowledge.delete', 'resource', r.id, r.source);
  });
}

export async function resourceFile(resourceId: string) {
  const r = await get('SELECT * FROM resources WHERE id=?', resourceId);
  if (!r?.storage_path) throw new HttpError(404, 'File not found');
  return { key: r.storage_path as string, mime: r.mime || 'application/octet-stream', name: r.source, audience: r.audience, courseId: r.course_id };
}

export async function searchKnowledge(courseId: string, q: string) {
  return await retrieve(courseId, q, 8);
}
