// File storage for knowledge files and media assets.
//   • local    — files under DATA_DIR/uploads (default)
//   • supabase — a PRIVATE Supabase Storage bucket, via the Storage REST API.
//                Used automatically when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
//                (override with STORAGE_DRIVER=local). Files are always served through the
//                Kitabash server so its permission checks apply; the bucket is never public.
import fs from 'node:fs';
import path from 'node:path';
import { uploadsDir } from './db/index.ts';

export interface Storage {
  driver: 'local' | 'supabase';
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

const safeKey = (key: string) => {
  const k = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (k.split('/').some((p) => p === '..' || p === '')) throw new Error('Invalid storage key');
  return k;
};

const local: Storage = {
  driver: 'local',
  async put(key, data) {
    const p = path.join(uploadsDir(), safeKey(key));
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data);
  },
  async read(key) {
    const p = path.join(uploadsDir(), safeKey(key));
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  },
  async remove(key) {
    fs.rmSync(path.join(uploadsDir(), safeKey(key)), { force: true });
  },
};

function supabaseStorage(url: string, serviceKey: string, bucket: string): Storage {
  const base = `${url.replace(/\/$/, '')}/storage/v1`;
  const headers = { authorization: `Bearer ${serviceKey}`, apikey: serviceKey };
  let bucketReady: Promise<void> | null = null;
  const ensureBucket = () =>
    (bucketReady ??= (async () => {
      const r = await fetch(`${base}/bucket`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ id: bucket, name: bucket, public: false }) });
      if (!r.ok) {
        const t = await r.text();
        if (!/already exists|Duplicate/i.test(t) && r.status !== 409) {
          bucketReady = null;
          throw new Error(`Supabase Storage: could not create bucket "${bucket}" (${r.status}): ${t.slice(0, 200)}`);
        }
      }
    })());
  const objectUrl = (key: string) => `${base}/object/${encodeURIComponent(bucket)}/${safeKey(key).split('/').map(encodeURIComponent).join('/')}`;
  return {
    driver: 'supabase',
    async put(key, data, contentType) {
      await ensureBucket();
      const r = await fetch(objectUrl(key), { method: 'POST', headers: { ...headers, 'content-type': contentType || 'application/octet-stream', 'x-upsert': 'true' }, body: new Uint8Array(data) });
      if (!r.ok) throw new Error(`Supabase Storage upload failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
    },
    async read(key) {
      const r = await fetch(objectUrl(key), { headers });
      if (r.status === 404 || r.status === 400) return null;
      if (!r.ok) throw new Error(`Supabase Storage download failed (${r.status})`);
      return Buffer.from(await r.arrayBuffer());
    },
    async remove(key) {
      const r = await fetch(objectUrl(key), { method: 'DELETE', headers });
      if (!r.ok && r.status !== 404 && r.status !== 400) throw new Error(`Supabase Storage delete failed (${r.status})`);
    },
  };
}

let current: Storage | null = null;
export function storage(): Storage {
  if (current) return current;
  const want = (process.env.STORAGE_DRIVER || '').toLowerCase();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (want === 'supabase' || (want !== 'local' && url && key)) {
    if (!url || !key) throw new Error('STORAGE_DRIVER=supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    current = supabaseStorage(url, key, process.env.SUPABASE_STORAGE_BUCKET || 'kitabash');
  } else current = local;
  return current;
}

/** For tests. */
export function resetStorage() {
  current = null;
}
