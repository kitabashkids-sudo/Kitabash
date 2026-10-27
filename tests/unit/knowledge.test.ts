import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extract, chunkSections } from '../../src/lib/knowledge/extract.ts';
import { bm25, bestSentences } from '../../src/lib/knowledge/retrieval.ts';

test('markdown is chunked by heading with section refs', async () => {
  const r = await extract('guide.md', Buffer.from('# Needs\nWater is a need.\n\n# Wants\nToys are wants.'));
  assert.equal(r.status, 'extracted');
  assert.deepEqual(r.chunks.map((c) => c.ref), ['section: Needs', 'section: Wants']);
});

test('csv keeps the header with each row group', async () => {
  const rows = ['topic,objective', ...Array.from({ length: 25 }, (_, i) => `t${i},o${i}`)].join('\n');
  const r = await extract('map.csv', Buffer.from(rows));
  assert.equal(r.chunks.length, 2);
  assert.ok(r.chunks[1].text.startsWith('topic,objective'));
});

test('docx and pptx text is extracted from OOXML', async () => {
  const d = new JSZip();
  d.file('word/document.xml', '<w:document><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Budgets</w:t></w:r></w:p><w:p><w:r><w:t>A budget is a plan &amp; a promise.</w:t></w:r></w:p></w:body></w:document>');
  const docx = await extract('x.docx', await d.generateAsync({ type: 'nodebuffer' }));
  assert.equal(docx.status, 'extracted');
  assert.equal(docx.chunks[0].ref, 'section: Budgets');
  assert.match(docx.chunks[0].text, /plan & a promise/);

  const p = new JSZip();
  p.file('ppt/slides/slide2.xml', '<p:sld><a:p><a:r><a:t>Second</a:t></a:r></a:p></p:sld>');
  p.file('ppt/slides/slide1.xml', '<p:sld><a:p><a:r><a:t>First slide</a:t></a:r></a:p></p:sld>');
  const pptx = await extract('x.pptx', await p.generateAsync({ type: 'nodebuffer' }));
  assert.deepEqual(pptx.chunks.map((c) => c.ref), ['slide 1', 'slide 2']);
});

test('images are stored but honestly marked unsupported (no OCR)', async () => {
  const r = await extract('photo.png', Buffer.from([0x89, 0x50]));
  assert.equal(r.status, 'unsupported');
  assert.match(r.note, /OCR/);
});

test('corrupt files fail gracefully', async () => {
  const r = await extract('broken.docx', Buffer.from('not a zip'));
  assert.equal(r.status, 'failed');
});

test('BM25 ranks the relevant passage first; sentences skip headings', () => {
  const docs = [
    { id: 'a', text: 'Saving means keeping money for later.' },
    { id: 'b', text: 'Photosynthesis happens in leaves.' },
  ];
  const s = bm25('why should I save money', docs);
  assert.ok((s.get('a') || 0) > (s.get('b') || 0));
  const chunks = chunkSections('# Saving\nSaving means keeping some money for later use.');
  const best = bestSentences('saving money', [{ chunkId: '1', resourceId: 'r', resourceTitle: 't', ref: chunks[0].ref, text: chunks[0].text, score: 1 }], 1);
  assert.equal(best[0].sentence, 'Saving means keeping some money for later use.');
});
