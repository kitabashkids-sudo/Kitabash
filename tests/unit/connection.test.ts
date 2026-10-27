import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConnectionString as p, explainDbError } from '../../src/lib/db/pg.ts';

test('Supabase session pooler string with sslmode', () => {
  const c = p('postgresql://postgres.abcdefgh:s3cret@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require');
  assert.deepEqual([c.user, c.password, c.host, c.port, c.database], ['postgres.abcdefgh', 's3cret', 'aws-0-ap-south-1.pooler.supabase.com', 5432, 'postgres']);
  assert.deepEqual(c.ssl, { rejectUnauthorized: false });
});

test('TLS is automatic for Supabase hosts even without sslmode', () => {
  assert.ok(p('postgresql://postgres:x@db.abcdefgh.supabase.co:5432/postgres').ssl);
  assert.equal(p('postgresql://postgres:x@localhost:5432/postgres').ssl, false);
});

test('unencoded special characters in the password just work', () => {
  for (const pw of ['p@ss#word?1', 'a:b/c', 'with space', '100%sure', 'x@y@z']) {
    assert.equal(p(`postgresql://postgres.ref:${pw}@aws-0-x.pooler.supabase.com:5432/postgres`).password, pw, pw);
  }
  assert.equal(p('postgresql://u:p%40ss%23@h:5432/d').password, 'p@ss#', 'encoded still works');
});

test('template mistakes give helpful messages or are fixed', () => {
  assert.throws(() => p('postgresql://postgres.ref:[YOUR-PASSWORD]@aws-0-x.pooler.supabase.com:5432/postgres'), /Replace it with your Supabase database password/);
  assert.equal(p('postgresql://postgres.ref:[MyPass1]@aws-0-x.pooler.supabase.com:5432/postgres').password, 'MyPass1');
  assert.throws(() => p('https://abcdefgh.supabase.co'), /website address/);
  assert.throws(() => p('abc'), /must start with postgresql/);
  assert.equal(p('  "postgresql://u:p@h/d"  ').host, 'h', 'quotes and spaces trimmed');
});

test('connection errors are explained in plain language', () => {
  assert.match(explainDbError({ code: '28P01', message: 'password authentication failed' }), /password is wrong/);
  assert.match(explainDbError(new Error('getaddrinfo ENOTFOUND x')), /Session pooler/);
  assert.match(explainDbError(new Error('connect ENETUNREACH')), /Session pooler/);
  assert.match(explainDbError(new Error('PostgreSQL connection timed out')), /paused/);
});
