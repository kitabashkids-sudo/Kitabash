// Tracing guides for handwriting lessons, drawn in the 100×100 tracing canvas.
// Writing lines: top/ascender ≈ 12, x-height (dashed) = 40, baseline = 80, descender ≈ 97.
// Each glyph is a list of strokes in the order they should be written; each stroke is a
// list of [x, y] points in the direction the pen moves (the green dot marks the start).
// Angles in arc()/ell() are screen degrees: 0 = right, 90 = down, −90 = up, so a
// DEcreasing angle travels anticlockwise on screen (the "c" direction).

type Pt = [number, number];
type Stroke = Pt[];

function ell(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 28): Stroke {
  const out: Stroke = [];
  for (let i = 0; i <= steps; i++) {
    const t = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push([+(cx + rx * Math.cos(t)).toFixed(1), +(cy + ry * Math.sin(t)).toFixed(1)]);
  }
  return out;
}
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, steps = 24) => ell(cx, cy, r, r, a0, a1, steps);
const L = (...pts: Pt[]): Stroke => pts;
const dot = (x: number, y: number): Stroke => [[x, y - 1.5], [x, y + 1.5]];
const join = (...parts: Stroke[]): Stroke => parts.flat() as Stroke;

const bowlLeft = arc(48, 60, 19, -15, -375); // the "a/d/g/q" round, anticlockwise from the top right
const hump = (cx: number, r: number, end: number) => join(arc(cx, 40 + r + 2, r, -180, 0), L([cx + r, end]));

export const GLYPHS: Record<string, Stroke[]> = {
  // ── Pre-writing patterns ──
  'line-down': [L([50, 14], [50, 86])],
  'line-across': [L([14, 50], [86, 50])],
  'slant': [L([28, 16], [72, 84])],
  'circle': [arc(50, 50, 30, -90, -450)],
  'cross': [L([50, 16], [50, 84]), L([16, 50], [84, 50])],
  'zigzag': [L([10, 70], [24, 34], [38, 70], [52, 34], [66, 70], [80, 34], [92, 70])],
  'wave': [Array.from({ length: 41 }, (_, i): Pt => [10 + i * 2, +(56 - 14 * Math.sin((i / 40) * Math.PI * 4)).toFixed(1)])],
  'cups': [join(...[0, 1, 2].map((k) => arc(26 + k * 24, 56, 12, 180, 0, 14)))], // uuu – the joined "cup" pattern
  'humps': [join(...[0, 1, 2].map((k) => arc(26 + k * 24, 64, 12, -180, 0, 14)))], // nnn – the "hump" pattern
  'loops': [join(L([12, 80]), ...[26, 50, 74].map((cx) => join(arc(cx, 26, 8, 60, -240, 16), L([cx - 1, 80]))))], // lll – tall joined loops
  'spiral': [Array.from({ length: 61 }, (_, i): Pt => { const t = (i / 60) * Math.PI * 5; const r = 4 + i * 0.55; return [+(50 + r * Math.cos(-t)).toFixed(1), +(50 + r * Math.sin(-t)).toFixed(1)]; })],

  // ── Lowercase ──
  a: [bowlLeft, L([67, 42], [67, 80])],
  b: [L([34, 12], [34, 80]), arc(53, 61, 19, -180, 180)],
  c: [arc(50, 60, 20, -40, -320)],
  d: [bowlLeft, L([67, 12], [67, 80])],
  e: [join(L([31, 60], [69, 60]), arc(50, 60, 19, 0, -310))],
  f: [join(arc(60, 22, 10, -20, -180, 12), L([50, 80])), L([38, 42], [64, 42])],
  g: [bowlLeft, join(L([67, 42], [67, 86]), arc(57, 86, 10, 0, 160, 12))],
  h: [L([34, 12], [34, 80]), hump(51, 17, 80)],
  i: [L([50, 42], [50, 80]), dot(50, 29)],
  j: [join(L([56, 42], [56, 86]), arc(46, 86, 10, 0, 160, 12)), dot(56, 29)],
  k: [L([36, 12], [36, 80]), L([64, 42], [37, 64], [66, 80])],
  l: [L([50, 12], [50, 80])],
  m: [L([26, 42], [26, 80]), hump(37, 11, 80), hump(59, 11, 80)],
  n: [L([34, 42], [34, 80]), hump(51, 17, 80)],
  o: [arc(50, 60, 20, -90, -450)],
  p: [L([34, 42], [34, 97]), arc(53, 61, 19, -180, 180)],
  q: [bowlLeft, L([67, 42], [67, 97])],
  r: [L([38, 42], [38, 80]), arc(53, 57, 15, -180, -55, 12)],
  s: [join(arc(50, 50, 10, -30, -270, 14), arc(50, 70, 10, -90, 150, 14))],
  t: [L([50, 18], [50, 80]), L([38, 42], [62, 42])],
  u: [join(L([33, 42]), arc(50, 62, 17, 180, 0, 16)), L([67, 42], [67, 80])],
  v: [L([30, 42], [50, 80], [70, 42])],
  w: [L([22, 42], [34, 80], [50, 52], [66, 80], [78, 42])],
  x: [L([32, 42], [68, 80]), L([68, 42], [32, 80])],
  y: [L([32, 42], [50, 72]), L([68, 42], [42, 97])],
  z: [L([32, 42], [68, 42], [32, 80], [68, 80])],

  // ── Uppercase ──
  A: [L([50, 12], [28, 80]), L([50, 12], [72, 80]), L([37, 54], [63, 54])],
  B: [L([34, 12], [34, 80]), join(L([34, 12]), arc(52, 28, 16, -90, 90, 14), arc(54, 62, 18, -90, 90, 14), L([34, 80]))],
  C: [ell(54, 46, 22, 34, -40, -320)],
  D: [L([34, 12], [34, 80]), join(L([34, 12]), ell(36, 46, 32, 34, -90, 90))],
  E: [L([66, 12], [34, 12], [34, 80], [66, 80]), L([34, 46], [60, 46])],
  F: [L([66, 12], [34, 12], [34, 80]), L([34, 46], [60, 46])],
  G: [ell(52, 46, 22, 34, -45, -345), L([58, 56], [74, 56], [74, 78])],
  H: [L([32, 12], [32, 80]), L([68, 12], [68, 80]), L([32, 46], [68, 46])],
  I: [L([50, 12], [50, 80]), L([38, 12], [62, 12]), L([38, 80], [62, 80])],
  J: [join(L([62, 12], [62, 64]), arc(48, 64, 14, 0, 180, 14))],
  K: [L([34, 12], [34, 80]), L([68, 12], [35, 50]), L([46, 38], [70, 80])],
  L: [L([34, 12], [34, 80], [66, 80])],
  M: [L([24, 80], [26, 12], [50, 56], [74, 12], [76, 80])],
  N: [L([32, 80], [32, 12], [68, 80], [68, 12])],
  O: [ell(50, 46, 22, 34, -90, -450)],
  P: [L([34, 80], [34, 12]), join(L([34, 12]), arc(52, 29, 17, -90, 90, 16), L([34, 46]))],
  Q: [ell(50, 46, 22, 34, -90, -450), L([56, 64], [74, 86])],
  R: [L([34, 80], [34, 12]), join(L([34, 12]), arc(52, 29, 17, -90, 90, 16), L([34, 46])), L([50, 46], [70, 80])],
  S: [join(arc(50, 29, 16, -20, -270, 16), arc(50, 62, 18, -90, 160, 16))],
  T: [L([28, 12], [72, 12]), L([50, 12], [50, 80])],
  U: [join(L([32, 12], [32, 58]), arc(50, 58, 18, 180, 0, 16), L([68, 12]))],
  V: [L([28, 12], [50, 80], [72, 12])],
  W: [L([20, 12], [32, 80], [50, 34], [68, 80], [80, 12])],
  X: [L([30, 12], [70, 80]), L([70, 12], [30, 80])],
  Y: [L([30, 12], [50, 46]), L([70, 12], [50, 46], [50, 80])],
  Z: [L([30, 12], [70, 12], [30, 80], [70, 80])],

  // ── Numerals ──
  '0': [ell(50, 46, 18, 34, -90, -450)],
  '1': [L([40, 24], [52, 12], [52, 80])],
  '2': [join(arc(50, 30, 17, -170, 10, 16), L([33, 80], [68, 80]))],
  '3': [join(arc(48, 29, 16, -160, 90, 16), arc(48, 62, 18, -90, 160, 16))],
  '4': [L([56, 12], [30, 60], [72, 60]), L([60, 36], [60, 80])],
  '5': [join(L([66, 12], [36, 12], [34, 44]), arc(50, 61, 18, -150, 160, 18))],
  '6': [join(L([62, 14], [34, 62]), arc(51, 62, 17, 180, -180, 22))],
  '7': [L([32, 12], [68, 12], [44, 80])],
  '8': [arc(50, 29, 15, -90, -450, 20), arc(50, 62, 18, -90, 270, 22)],
  '9': [join(arc(50, 30, 16, 0, -360, 22), L([64, 80]))],
};

/** How each guide should be described to learners (and to screen readers). */
export function glyphLabel(key: string) {
  if (/^[a-z]$/.test(key)) return `the letter ${key}`;
  if (/^[A-Z]$/.test(key)) return `capital ${key}`;
  if (/^[0-9]$/.test(key)) return `the number ${key}`;
  return `the ${key.replace(/-/g, ' ')} pattern`;
}
