// Supabase Storage adapter, exercised against a local mock of the Storage REST API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

test('local storage writes, reads and removes; rejects path traversal', async () => {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-st-'));
  process.env.STORAGE_DRIVER = 'local';
  const { storage, resetStorage } = await import('../../src/lib/storage.ts');
  resetStorage();
  const s = storage();
  await s.put('a/b.txt', Buffer.from('hi'), 'text/plain');
  assert.equal((await s.read('a/b.txt'))?.toString(), 'hi');
  await s.remove('a/b.txt');
  assert.equal(await s.read('a/b.txt'), null);
  await assert.rejects(() => s.put('../escape.txt', Buffer.from('x'), 'text/plain'), /Invalid storage key/);
});

test('supabase storage: creates a private bucket, uploads, downloads, deletes with service-role auth', async () => {
  const objects = new Map<string, { body: Buffer; type: string }>();
  const seen: string[] = [];
  let bucket: any = null;
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks);
    if (req.headers.authorization !== 'Bearer service-key' || req.headers.apikey !== 'service-key') return res.writeHead(401).end('unauthorised');
    seen.push(`${req.method} ${req.url}`);
    if (req.method === 'POST' && req.url === '/storage/v1/bucket') {
      if (bucket) return res.writeHead(400).end('{"error":"Duplicate","message":"The resource already exists"}');
      bucket = JSON.parse(body.toString());
      return res.writeHead(200).end('{}');
    }
    const m = req.url!.match(/^\/storage\/v1\/object\/kitabash\/(.+)$/);
    if (!m) return res.writeHead(404).end();
    const key = decodeURIComponent(m[1]);
    if (req.method === 'POST') {
      if (req.headers['x-upsert'] !== 'true') return res.writeHead(400).end();
      objects.set(key, { body, type: String(req.headers['content-type']) });
      return res.writeHead(200).end('{}');
    }
    if (req.method === 'GET') {
      const o = objects.get(key);
      return o ? res.writeHead(200, { 'content-type': o.type }).end(o.body) : res.writeHead(400).end('{"error":"not_found"}');
    }
    if (req.method === 'DELETE') {
      objects.delete(key);
      return res.writeHead(200).end('{}');
    }
    res.writeHead(405).end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as any).port;
  process.env.STORAGE_DRIVER = '';
  process.env.SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  const { storage, resetStorage } = await import('../../src/lib/storage.ts');
  resetStorage();
  try {
    const s = storage();
    assert.equal(s.driver, 'supabase');
    await s.put('knowledge/c1/r 1.md', Buffer.from('# Hello ✓'), 'text/markdown');
    await s.put('assets/x.svg', Buffer.from('<svg/>'), 'image/svg+xml');
    assert.equal(bucket.public, false, 'bucket must be private');
    assert.equal((await s.read('knowledge/c1/r 1.md'))?.toString(), '# Hello ✓');
    await s.remove('knowledge/c1/r 1.md');
    assert.equal(await s.read('knowledge/c1/r 1.md'), null);
    assert.equal(seen.filter((x) => x.includes('/bucket')).length, 1, 'bucket created once');
  } finally {
    server.close();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetStorage();
  }
});
