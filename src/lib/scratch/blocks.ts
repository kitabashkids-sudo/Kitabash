// Scratch-style block renderer: turns a small text syntax into an SVG string.
// Pure TypeScript (no DOM), so lessons, PDFs and lesson videos all draw blocks the same way.
//
// Syntax (a subset of the community "scratchblocks" notation):
//   when green flag clicked
//   repeat (10)
//     move (10) steps
//     turn cw (15) degrees
//   end
//   if <touching (Apple v)?> then
//     change [score v] by (1)
//   else
//     say [Missed!] for (1) seconds
//   end
// (n) number/text input · [text] text input · [item v] dropdown · (var) reporter · <cond> boolean
// A blank line starts a new script. Lines starting with // are comments (shown as notes).

export type Category = 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing' | 'operators' | 'variables' | 'pen' | 'myblocks' | 'lists' | 'grey';

export const COLORS: Record<Category, { fill: string; stroke: string; dark: string }> = {
  motion: { fill: '#4C97FF', stroke: '#3373CC', dark: '#4280D7' },
  looks: { fill: '#9966FF', stroke: '#774DCB', dark: '#855CD6' },
  sound: { fill: '#CF63CF', stroke: '#BD42BD', dark: '#C94FC9' },
  events: { fill: '#FFBF00', stroke: '#CC9900', dark: '#E6AC00' },
  control: { fill: '#FFAB19', stroke: '#CF8B17', dark: '#EC9C13' },
  sensing: { fill: '#5CB1D6', stroke: '#2E8EB8', dark: '#47A8D1' },
  operators: { fill: '#59C059', stroke: '#389438', dark: '#46B946' },
  variables: { fill: '#FF8C1A', stroke: '#DB6E00', dark: '#FF8000' },
  pen: { fill: '#0FBD8C', stroke: '#0B8E69', dark: '#0DA57A' },
  myblocks: { fill: '#FF6680', stroke: '#FF3355', dark: '#FF4D6A' },
  lists: { fill: '#FF661A', stroke: '#E64D00', dark: '#F2590D' },
  grey: { fill: '#BFBFBF', stroke: '#909090', dark: '#A8A8A8' },
};

const RULES: [RegExp, Category][] = [
  [/^when i start as a clone/, 'control'],
  [/^(add .* to |delete all of |delete .* of |insert .* at |replace item |show list|hide list)|^(item .* of .* v|length of .* v)$|^\[?[^<\[]* v\]? contains/, 'lists'],
  [/^when\b|^broadcast\b/, 'events'],
  [/^if on edge/, 'motion'],
  [/^(change pen|set pen|play note|play drum|set tempo)/, 'pen'],
  [/^(wait|repeat|forever|if|else|stop|create clone|delete this clone)\b/, 'control'],
  [/^(move|turn|go to|glide|point|change x|set x|change y|set y|if on edge|set rotation|x position|y position|direction)\b/, 'motion'],
  [/^(say|think|switch costume|next costume|switch backdrop|next backdrop|change size|set size|change \[?\w+ ?v?\]? effect|set \[?\w+ ?v?\]? effect|clear graphic|show$|hide$|go to \[?front|go \[?forward|costume|backdrop|size$)/, 'looks'],
  [/^(play sound|start sound|stop all sounds|change volume|set volume|volume)\b/, 'sound'],
  [/^(touching|key|ask|answer|mouse|timer|reset timer|distance to|loudness|wall ahead|path ahead)\b/, 'sensing'],
  [/^pick up gem/, 'myblocks'],
  [/^(pick random|join|letter|length of|round|not\b|.* and .*|.* or .*|.* [+\-*/=<>] .*)/, 'operators'],
  [/^(set .* to|change .* by|show variable|hide variable)\b/, 'variables'],
  [/^(pen|erase all|stamp)\b/, 'pen'],
  [/^define\b/, 'myblocks'],
];

export function categoryOf(text: string, fallback: Category = 'variables'): Category {
  const t = text.trim().toLowerCase();
  // "go to x: y:" is motion, but "go to front layer" is looks.
  if (/^go to \[?(front|back)/.test(t)) return 'looks';
  for (const [re, c] of RULES) if (re.test(t)) return c;
  return fallback;
}

// ── Parsing ────────────────────────────────────────────────
type Part =
  | { k: 'text'; s: string }
  | { k: 'num'; s: string } // white oval
  | { k: 'str'; s: string } // white text field
  | { k: 'menu'; s: string; round: boolean } // dropdown
  | { k: 'rep'; parts: Part[]; cat: Category } // reporter (round)
  | { k: 'bool'; parts: Part[]; cat: Category } // boolean (hexagon)
  | { k: 'icon'; s: 'flag' | 'cw' | 'ccw' };

export interface Block {
  parts: Part[];
  cat: Category;
  shape: 'hat' | 'stack' | 'cap' | 'c' | 'e';
  body?: Block[];
  elseBody?: Block[];
  raw: string;
}

const stripBrackets = (s: string) => s.replace(/[()[\]]/g, '').replace(/<(?! )/g, '').replace(/(?<! )>/g, '').replace(/\s+/g, ' ').trim();

function splitParts(src: string): Part[] {
  const out: Part[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    for (const w of buf.split(/(green flag|\bcw\b|\bccw\b)/)) {
      if (!w) continue;
      if (w === 'green flag') out.push({ k: 'icon', s: 'flag' });
      else if (w === 'cw') out.push({ k: 'icon', s: 'cw' });
      else if (w === 'ccw') out.push({ k: 'icon', s: 'ccw' });
      else if (w.trim()) out.push({ k: 'text', s: w.trim() });
    }
    buf = '';
  };
  const grab = (open: string, close: string): string => {
    // returns inner text, advances i past the closing bracket (nesting-aware)
    let depth = 0;
    const start = i + 1;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '(' || ch === '[' || (ch === '<' && open === '<')) depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === '>' && open === '<') {
        // a ">" with spaces on both sides is the greater-than operator, not a closer
        const isOp = src[i - 1] === ' ' && src[i + 1] === ' ';
        if (!isOp) depth--;
      }
      if (depth === 0) {
        const inner = src.slice(start, i);
        i++;
        return inner;
      }
    }
    i = src.length;
    void close;
    return src.slice(start);
  };
  while (i < src.length) {
    const ch = src[i];
    if (ch === '(' || ch === '[' || (ch === '<' && !(src[i - 1] === ' ' && src[i + 1] === ' '))) {
      flush();
      const inner = grab(ch, ch === '(' ? ')' : ch === '[' ? ']' : '>');
      if (ch === '[') {
        const m = inner.match(/^(.*) v$/);
        out.push(m ? { k: 'menu', s: m[1], round: false } : { k: 'str', s: inner });
      } else if (ch === '(') {
        const m = inner.match(/^(.*) v$/);
        if (m && !/[([<]/.test(m[1])) out.push({ k: 'menu', s: m[1], round: true });
        else if (/^-?[\d.]*$/.test(inner.trim())) out.push({ k: 'num', s: inner });
        else {
          const inner2 = inner.replace(/::\s*\w+\s*$/, '');
          const forced = inner.match(/::\s*(\w+)\s*$/)?.[1] as Category | undefined;
          out.push({ k: 'rep', parts: splitParts(inner2), cat: forced || categoryOf(stripBrackets(inner2)) });
        }
      } else {
        const inner2 = inner.replace(/\?$/, '?');
        out.push({ k: 'bool', parts: splitParts(inner2), cat: categoryOf(stripBrackets(inner2)) });
      }
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

function recolourParams(parts: Part[], params: string[]): void {
  for (const p of parts) {
    if (p.k !== 'rep' && p.k !== 'bool') continue;
    if (p.k === 'rep' && p.parts.length === 1 && p.parts[0].k === 'text' && params.includes(p.parts[0].s.toLowerCase())) p.cat = 'myblocks';
    else recolourParams(p.parts, params);
  }
}

export function parseScripts(src: string): Block[][] {
  const scripts: Block[][] = [];
  let cur: Block[] = [];
  const stack: { list: Block[]; owner?: Block }[] = [{ list: cur }];
  const top = () => stack[stack.length - 1];
  const finishScript = () => {
    if (cur.length) scripts.push(cur);
    cur = [];
    stack.length = 0;
    stack.push({ list: cur });
  };
  const params = [...src.matchAll(/^\s*define\b.*$/gim)].flatMap((m) => [...m[0].matchAll(/\(([^()]+)\)/g)].map((x) => x[1].trim().toLowerCase()));
  // custom (My Block) names defined in this source, so their calls are coloured as My Blocks
  const custom = [...src.matchAll(/^\s*define\s+([^([<\n]+?)\s*(?:[([<]|$)/gim)].map((m) => m[1].trim().toLowerCase()).filter(Boolean);
  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      if (stack.length === 1) finishScript();
      continue;
    }
    if (line.startsWith('//')) continue;
    const low = line.toLowerCase();
    if (low === 'end') {
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (low === 'else') {
      const owner = top().owner;
      if (owner) {
        owner.shape = 'e';
        owner.elseBody = [];
        top().list = owner.elseBody;
      }
      continue;
    }
    const clean = line.replace(/::\s*(\w+)\s*$/, '');
    const forced = line.match(/::\s*(\w+)\s*$/)?.[1] as Category | undefined;
    const low2 = clean.toLowerCase();
    const cat = forced || (custom.some((c) => low2 === c || low2.startsWith(c + ' ') || low2.startsWith(c + '(')) && !low2.startsWith('define') ? 'myblocks' : categoryOf(clean, 'myblocks'));
    let shape: Block['shape'] = 'stack';
    if (/^(when\b|define\b)/i.test(clean)) shape = 'hat';
    else if (/^(forever|repeat|if\b)/i.test(clean) && !/^if on edge/i.test(clean)) shape = 'c';
    else if (/^(stop \[?(all|this script)|delete this clone)/i.test(clean)) shape = 'cap';
    const b: Block = { parts: splitParts(clean), cat, shape, raw: line };
    if (params.length) recolourParams(b.parts, params);
    top().list.push(b);
    if (shape === 'c') {
      b.body = [];
      stack.push({ list: b.body, owner: b });
    }
  }
  finishScript();
  return scripts;
}

// ── Layout + SVG ───────────────────────────────────────────
const FONT = 12;
const charW = (ch: string) => {
  if (/[iIl.,:;'!|]/.test(ch)) return 3.6;
  if (/[mwMW@]/.test(ch)) return 10.2;
  if (/[A-Z]/.test(ch)) return 8;
  if (/[0-9]/.test(ch)) return 6.8;
  if (ch === ' ') return 3.4;
  if (/[^\x00-\x7f]/.test(ch)) return 9;
  return 6.4;
};
export const textWidth = (s: string) => 1.1 * [...s].reduce((w, ch) => w + charW(ch), 0);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Piece {
  w: number;
  h: number;
  draw: (x: number, y: number) => string; // y = vertical centre
}

function textPiece(s: string, color = '#fff', weight = 500): Piece {
  const w = textWidth(s);
  return { w, h: 16, draw: (x, y) => `<text x="${x}" y="${y + 4.2}" fill="${color}" font-weight="${weight}">${esc(s)}</text>` };
}

function iconPiece(s: 'flag' | 'cw' | 'ccw'): Piece {
  if (s === 'flag')
    return {
      w: 22,
      h: 22,
      draw: (x, y) =>
        `<g transform="translate(${x},${y - 10})"><path d="M3 2v18" stroke="#45993d" stroke-width="2" stroke-linecap="round"/><path d="M4 3c4-2 7 2 11 0s5-1 5-1v9s-1-1-5 1-7-2-11 0z" fill="#4cbf56" stroke="#45993d" stroke-width="1.2" stroke-linejoin="round"/></g>`,
    };
  return { w: 16, h: 16, draw: (x, y) => `<text x="${x}" y="${y + 5}" fill="#fff" font-size="15" font-weight="700">${s === 'cw' ? '↻' : '↺'}</text>` };
}

function partPiece(p: Part, cat: Category): Piece {
  const c = COLORS[cat];
  switch (p.k) {
    case 'text':
      return textPiece(p.s);
    case 'icon':
      return iconPiece(p.s);
    case 'num':
    case 'str': {
      const tw = Math.max(textWidth(p.s), 8);
      const w = tw + 20;
      const h = 26;
      const r = p.k === 'num' ? 13 : 13;
      return { w, h, draw: (x, y) => `<rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="${r}" fill="#fff" stroke="${c.stroke}" stroke-width="1"/><text x="${x + 10}" y="${y + 4.2}" fill="#575E75">${esc(p.s)}</text>` };
    }
    case 'menu': {
      const tw = textWidth(p.s);
      const w = tw + 32;
      const h = 26;
      return {
        w,
        h,
        draw: (x, y) =>
          `<rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="${p.round ? 13 : 4}" fill="${c.dark}" stroke="${c.stroke}" stroke-width="1"/><text x="${x + 10}" y="${y + 4.2}" fill="#fff">${esc(p.s)}</text><path d="M${x + w - 17} ${y - 2}l4 4 4-4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
      };
    }
    case 'rep':
    case 'bool': {
      const inner = row(p.parts, p.cat);
      const isB = p.k === 'bool';
      const pad = isB ? 14 : 10;
      const h = Math.max(28, inner.h + 6);
      const w = inner.w + pad * 2;
      const cc = COLORS[p.cat];
      return {
        w,
        h,
        draw: (x, y) => {
          const top = y - h / 2;
          const shape = isB
            ? `<path d="M${x + h / 2} ${top}H${x + w - h / 2}L${x + w} ${y}L${x + w - h / 2} ${top + h}H${x + h / 2}L${x} ${y}Z" fill="${cc.fill}" stroke="${cc.stroke}" stroke-width="1"/>`
            : `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${h / 2}" fill="${cc.fill}" stroke="${cc.stroke}" stroke-width="1"/>`;
          return shape + inner.draw(x + pad, y);
        },
      };
    }
  }
}

function row(parts: Part[], cat: Category): Piece {
  const pieces = parts.map((p) => partPiece(p, cat));
  const gap = 6;
  const w = pieces.reduce((s, p) => s + p.w, 0) + gap * Math.max(0, pieces.length - 1);
  const h = Math.max(16, ...pieces.map((p) => p.h));
  return {
    w,
    h,
    draw: (x, y) => {
      let cx = x;
      return pieces
        .map((p) => {
          const s = p.draw(cx, y);
          cx += p.w + gap;
          return s;
        })
        .join('');
    },
  };
}

// Path helpers (Scratch 3 proportions, scaled ~0.85)
const NOTCH = (dir: 1 | -1) => (dir === 1 ? 'c2,0 3,1 4,2 l4,4 c1,1 2,2 4,2 h10 c2,0 3,-1 4,-2 l4,-4 c1,-1 2,-2 4,-2' : 'c-2,0 -3,1 -4,2 l-4,4 c-1,1 -2,2 -4,2 h-10 c-2,0 -3,-1 -4,-2 l-4,-4 c-1,-1 -2,-2 -4,-2');
const NW = 32; // notch width
const NX = 12; // notch start

const ROW_H = 40;
const PAD_X = 10;
const ARM = 14; // C-block arm width
const BOTTOM_ARM = 22;

interface Laid {
  w: number;
  h: number;
  svg: (x: number, y: number) => string;
}

function layoutStack(blocks: Block[]): Laid {
  const laid = blocks.map(layoutBlock);
  const w = Math.max(0, ...laid.map((l) => l.w));
  const h = laid.reduce((s, l) => s + l.h, 0);
  return {
    w,
    h,
    svg: (x, y) => {
      let cy = y;
      // draw bottom blocks first so each block's top notch overlaps the one above cleanly
      const parts = laid.map((l) => {
        const s = l.svg(x, cy);
        cy += l.h;
        return s;
      });
      return parts.reverse().join('');
    },
  };
}

function layoutBlock(b: Block): Laid {
  const c = COLORS[b.cat];
  const r = row(b.parts, b.cat);
  const hatExtra = b.shape === 'hat' ? 18 : 0;
  const head = Math.max(ROW_H, r.h + 14);
  const minW = b.shape === 'hat' ? 100 : 56;
  const w = Math.max(minW, r.w + PAD_X * 2);
  const stroke = `fill="${c.fill}" stroke="${c.stroke}" stroke-width="1"`;

  if (b.shape === 'c' || b.shape === 'e') {
    const body = layoutStack(b.body || []);
    const bodyH = Math.max(24, body.h);
    const elseR = b.shape === 'e' ? row([{ k: 'text', s: 'else' }], b.cat) : null;
    const elseBody = b.shape === 'e' ? layoutStack(b.elseBody || []) : null;
    const elseBodyH = elseBody ? Math.max(24, elseBody.h) : 0;
    const elseRowH = elseR ? 32 : 0;
    const isForever = /^forever/i.test(b.raw);
    const totalH = head + bodyH + elseRowH + elseBodyH + BOTTOM_ARM;
    const ww = Math.max(w, ARM + Math.max(body.w, elseBody?.w || 0) + 8);
    return {
      w: Math.max(ww, ARM + body.w),
      h: totalH,
      svg: (x, y) => {
        const ix = x + ARM;
        let d = `M${x} ${y + 4}a4 4 0 0 1 4-4H${x + NX}${NOTCH(1)}H${x + w - 4}a4 4 0 0 1 4 4V${y + head - 4}a4 4 0 0 1-4 4H${ix + NX + NW}${NOTCH(-1)}H${ix + 4}a4 4 0 0 0-4 4`;
        let cy = y + head + bodyH;
        d += `V${cy - 4}a4 4 0 0 0 4 4H${ix + NX}${NOTCH(1)}`;
        if (elseR) {
          d += `H${x + w - 4}a4 4 0 0 1 4 4V${cy + elseRowH - 4}a4 4 0 0 1-4 4H${ix + NX + NW}${NOTCH(-1)}H${ix + 4}a4 4 0 0 0-4 4`;
          cy += elseRowH + elseBodyH;
          d += `V${cy - 4}a4 4 0 0 0 4 4H${ix + NX}${NOTCH(1)}`;
        }
        d += `H${x + w - 4}a4 4 0 0 1 4 4V${cy + BOTTOM_ARM - 4}a4 4 0 0 1-4 4`;
        d += isForever ? `H${x + 4}` : `H${x + NX + NW}${NOTCH(-1)}H${x + 4}`;
        d += `a4 4 0 0 1-4-4Z`;
        let out = `<path d="${d}" ${stroke}/>` + r.draw(x + PAD_X, y + head / 2);
        if (isForever) out += `<text x="${x + w - 22}" y="${cy + 16}" fill="#fff" font-size="14" font-weight="700">↻</text>`;
        else if (/^repeat/i.test(b.raw)) out += `<text x="${x + w - 22}" y="${cy + 16}" fill="#fff" font-size="14" font-weight="700">↻</text>`;
        out += body.svg(ix, y + head);
        if (elseR) {
          out += elseR.draw(x + PAD_X, y + head + bodyH + elseRowH / 2);
          out += elseBody!.svg(ix, y + head + bodyH + elseRowH);
        }
        return out;
      },
    };
  }

  const h = head + hatExtra;
  return {
    w,
    h,
    svg: (x, y) => {
      const top = y + hatExtra;
      let d: string;
      if (b.shape === 'hat') d = `M${x} ${top}c22-${hatExtra + 4} 62-${hatExtra + 4} 84 0H${x + w - 4}a4 4 0 0 1 4 4`;
      else d = `M${x} ${top + 4}a4 4 0 0 1 4-4H${x + NX}${NOTCH(1)}H${x + w - 4}a4 4 0 0 1 4 4`;
      d += `V${top + head - 4}a4 4 0 0 1-4 4`;
      d += b.shape === 'cap' ? `H${x + 4}` : `H${x + NX + NW}${NOTCH(-1)}H${x + 4}`;
      d += b.shape === 'hat' ? `a4 4 0 0 1-4-4Z` : `a4 4 0 0 1-4-4Z`;
      return `<path d="${d}" ${stroke}/>` + r.draw(x + PAD_X, top + head / 2);
    },
  };
}

export interface Rendered {
  svg: string;
  width: number;
  height: number;
}

/** Render one or more scripts (blank line between scripts) to a standalone SVG string. */
export function renderBlocks(src: string, opts: { scale?: number; gap?: number; label?: string } = {}): Rendered {
  const scripts = parseScripts(src);
  const scale = opts.scale ?? 1;
  const gap = opts.gap ?? 22;
  const laid = scripts.map(layoutStack);
  const margin = 2;
  const width = Math.ceil(Math.max(40, ...laid.map((l) => l.w)) + margin * 2 + 2);
  const height = Math.ceil(laid.reduce((s, l) => s + l.h, 0) + gap * Math.max(0, laid.length - 1) + margin * 2 + 8);
  let y = margin;
  const body = laid
    .map((l) => {
      const s = l.svg(margin, y);
      y += l.h + gap;
      return s;
    })
    .join('');
  const W = Math.ceil(width * scale);
  const H = Math.ceil(height * scale);
  const label = opts.label ? `<title>${esc(opts.label)}</title>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${width} ${height}" role="img" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" font-size="${FONT}">${label}${body}</svg>`;
  return { svg, width: W, height: H };
}

/** Plain-text reading of a script, for screen readers and transcripts. */
export function blocksToText(src: string): string {
  return src
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() && !l.trim().startsWith('//'))
    .join('\n');
}
