// Text extraction for the course knowledge library.
// Supported: txt, md, csv, json, html, pdf (pdf.js), docx, pptx (OOXML via JSZip).
// Images are stored but marked "unsupported" (needs an OCR integration).
import JSZip from 'jszip';

export interface Chunk {
  ref: string;
  text: string;
}
export interface Extraction {
  status: 'extracted' | 'unsupported' | 'failed';
  note: string;
  chunks: Chunk[];
}

export const ACCEPTED_EXT = ['txt', 'md', 'csv', 'json', 'html', 'htm', 'pdf', 'docx', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
const MAX_CHUNK = 900;

export function extOf(name: string) {
  return (name.split('.').pop() || '').toLowerCase();
}

export async function extract(filename: string, buf: Buffer): Promise<Extraction> {
  const ext = extOf(filename);
  try {
    switch (ext) {
      case 'txt':
      case 'md':
        return ok(chunkSections(buf.toString('utf8')));
      case 'csv':
        return ok(chunkCsv(buf.toString('utf8')));
      case 'json':
        return ok(chunkPlain(JSON.stringify(JSON.parse(buf.toString('utf8')), null, 1), 'json'));
      case 'html':
      case 'htm':
        return ok(chunkSections(htmlToText(buf.toString('utf8'))));
      case 'pdf':
        return ok(await pdfChunks(buf));
      case 'docx':
        return ok(await docxChunks(buf));
      case 'pptx':
        return ok(await pptxChunks(buf));
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'gif':
        return { status: 'unsupported', note: 'Image stored. Text extraction from images needs the OCR integration (not configured).', chunks: [] };
      default:
        return { status: 'unsupported', note: `.${ext} files are not supported for extraction.`, chunks: [] };
    }
  } catch (e) {
    return { status: 'failed', note: `Extraction failed: ${(e as Error).message}`.slice(0, 300), chunks: [] };
  }
}

function ok(chunks: Chunk[]): Extraction {
  const nonEmpty = chunks.filter((c) => c.text.trim().length > 0);
  if (!nonEmpty.length) return { status: 'failed', note: 'No readable text found (scanned documents need OCR).', chunks: [] };
  const chars = nonEmpty.reduce((s, c) => s + c.text.length, 0);
  return { status: 'extracted', note: `${nonEmpty.length} passages, ${chars.toLocaleString()} characters.`, chunks: nonEmpty };
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<h([1-6])[^>]*>/gi, '\n\n# ')
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

/** Split markdown/plain text by headings, then by size. Ref = nearest heading. */
export function chunkSections(text: string): Chunk[] {
  const out: Chunk[] = [];
  let heading = 'start';
  let buf: string[] = [];
  const flush = () => {
    const body = buf.join('\n').trim();
    if (body) for (const piece of splitBySize(body)) out.push({ ref: `section: ${heading}`, text: piece });
    buf = [];
  };
  for (const line of text.replace(/\r/g, '').split('\n')) {
    const h = line.match(/^#{1,6}\s+(.*)/);
    if (h) {
      flush();
      heading = h[1].trim().slice(0, 80);
      buf.push(h[1].trim());
    } else buf.push(line);
  }
  flush();
  return out;
}

function chunkPlain(text: string, label: string): Chunk[] {
  return splitBySize(text).map((t, i) => ({ ref: `${label} part ${i + 1}`, text: t }));
}

function splitBySize(text: string): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const p of paras) {
    if ((cur + '\n\n' + p).length > MAX_CHUNK && cur) {
      out.push(cur);
      cur = '';
    }
    if (p.length > MAX_CHUNK) {
      const sentences = p.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [p];
      for (const s of sentences) {
        if ((cur + ' ' + s).length > MAX_CHUNK && cur) {
          out.push(cur);
          cur = '';
        }
        cur = (cur ? cur + ' ' : '') + s.trim();
      }
    } else cur = cur ? cur + '\n\n' + p : p;
  }
  if (cur) out.push(cur);
  return out;
}

function chunkCsv(text: string): Chunk[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const header = lines[0];
  const out: Chunk[] = [];
  for (let i = 1; i < lines.length; i += 20) {
    const rows = lines.slice(i, i + 20);
    out.push({ ref: `rows ${i}–${i + rows.length - 1}`, text: `${header}\n${rows.join('\n')}` });
  }
  if (lines.length === 1) out.push({ ref: 'header', text: header });
  return out;
}

async function pdfChunks(buf: Buffer): Promise<Chunk[]> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true, isEvalSupported: false, disableFontFace: true });
  const doc = await task.promise;
  const out: Chunk[] = [];
  const pages = Math.min(doc.numPages, 300);
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let text = '';
    for (const it of tc.items as any[]) text += it.str + (it.hasEOL ? '\n' : ' ');
    for (const piece of splitBySize(text.replace(/[ \t]+/g, ' ').trim())) out.push({ ref: `page ${p}`, text: piece });
  }
  await (doc.destroy?.() ?? task.destroy?.());
  return out;
}

const xmlText = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function docxChunks(buf: Buffer): Promise<Chunk[]> {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) throw new Error('Not a valid .docx (word/document.xml missing)');
  const lines: string[] = [];
  for (const p of xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []) {
    const t = (p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((x) => xmlText(x.replace(/<[^>]+>/g, ''))).join('');
    if (!t.trim()) {
      lines.push('');
      continue;
    }
    const isHeading = /<w:pStyle w:val="(Heading|Title)/i.test(p);
    lines.push(isHeading ? `# ${t}` : t, '');
  }
  return chunkSections(lines.join('\n'));
}

async function pptxChunks(buf: Buffer): Promise<Chunk[]> {
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/g)!.pop()) - Number(b.match(/\d+/g)!.pop()));
  const out: Chunk[] = [];
  for (const f of slides) {
    const xml = await zip.file(f)!.async('string');
    const paras = (xml.match(/<a:p>[\s\S]*?<\/a:p>/g) || []).map((p) => (p.match(/<a:t>([\s\S]*?)<\/a:t>/g) || []).map((x) => xmlText(x.replace(/<[^>]+>/g, ''))).join(''));
    const text = paras.filter((s) => s.trim()).join('\n');
    if (text) out.push({ ref: `slide ${f.match(/(\d+)\.xml$/)![1]}`, text: text.slice(0, MAX_CHUNK * 2) });
  }
  return out;
}
