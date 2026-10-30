// Web Lab checks: simple, explainable tests on a learner's HTML/CSS page.
// Pure TypeScript (no DOM), so the server grades exactly what the client previews.

export type WebCheck =
  | { t: 'tag'; tags: string[]; min?: number; msg: string } // at least `min` (default 1) of any of these tags
  | { t: 'text'; min: number; msg: string } // visible text length
  | { t: 'css'; props?: string[]; msg: string } // a <style> block (optionally with these properties)
  | { t: 'contains'; text: string; msg: string }; // visible text contains a phrase

export const MAX_HTML = 50_000;

export function checkHtml(html: unknown): string {
  if (typeof html !== 'string') throw new Error('Your page is empty — type some HTML first.');
  if (html.length > MAX_HTML) throw new Error(`Your page is too long (over ${MAX_HTML.toLocaleString()} characters).`);
  return html;
}

const stripComments = (h: string) => h.replace(/<!--[\s\S]*?-->/g, '');
export function visibleText(html: string) {
  return stripComments(html)
    .replace(/<(style|script)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}
const tagCount = (html: string, tag: string) => (stripComments(html).match(new RegExp(`<${tag}(\\s[^>]*)?\\/?>`, 'gi')) || []).length;
const cssText = (html: string) => [...stripComments(html).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((m) => m[1]).join('\n') + ' ' + [...html.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)].map((m) => m[1]).join(';');

export interface WebCheckResult {
  ok: boolean;
  msg: string;
  detail?: string;
}

export function runWebChecks(html: string, checks: WebCheck[]): { passed: boolean; results: WebCheckResult[] } {
  const results = checks.map((c): WebCheckResult => {
    switch (c.t) {
      case 'tag': {
        const n = c.tags.reduce((s, t) => s + tagCount(html, t), 0);
        const need = c.min ?? 1;
        return { ok: n >= need, msg: c.msg, detail: n >= need ? undefined : `Found ${n} — need ${need}.` };
      }
      case 'text': {
        const n = visibleText(html).length;
        return { ok: n >= c.min, msg: c.msg, detail: n >= c.min ? undefined : `Your page has ${n} characters of text.` };
      }
      case 'css': {
        const css = cssText(html);
        const hasRule = /[{;:]/.test(css) && /:\s*[^;}\s]/.test(css);
        const missing = (c.props || []).filter((p) => !new RegExp(`(^|[\\s;{])${p}\\s*:`, 'i').test(css));
        return { ok: hasRule && !missing.length, msg: c.msg, detail: !hasRule ? 'No CSS rules found yet.' : missing.length ? `Try using: ${missing.join(', ')}` : undefined };
      }
      case 'contains': {
        const ok = visibleText(html).toLowerCase().includes(c.text.toLowerCase());
        return { ok, msg: c.msg };
      }
    }
  });
  return { passed: results.every((r) => r.ok), results };
}
