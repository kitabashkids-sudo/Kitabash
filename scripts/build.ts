// Build: bundles the React client (esbuild), compiles Tailwind v4 CSS, bundles the server.
// Usage: npm run build  |  tsx scripts/build.ts --watch
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { compile } from 'tailwindcss';

const require = createRequire(import.meta.url);
const root = process.cwd();
const out = path.join(root, 'dist/public');
const watch = process.argv.includes('--watch');
const quiet = process.argv.includes('--quiet');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

async function buildCss() {
  const twDir = path.dirname(require.resolve('tailwindcss/package.json'));
  const input = fs.readFileSync(path.join(root, 'src/styles/app.css'), 'utf8');
  const compiler = await compile(input, {
    base: root,
    loadStylesheet: async (id: string, base: string) => {
      const file = id === 'tailwindcss' ? path.join(twDir, 'index.css') : id.startsWith('tailwindcss/') ? path.join(twDir, id.slice(12)) : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
    },
  });
  // Candidate scan: every class-like token in client sources.
  const candidates = new Set<string>();
  for (const f of walk(path.join(root, 'src/client')).filter((f) => /\.(tsx?|html)$/.test(f))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/[A-Za-z0-9_\-:/.[\]#%()!@&>+*=,'"]+/g)) {
      for (const tok of m[0].split(/["'`]/)) if (tok && tok.length < 120) candidates.add(tok);
    }
  }
  const css = compiler.build([...candidates]);
  fs.writeFileSync(path.join(out, 'app.css'), css);
  return css.length;
}

function writeHtml() {
  fs.writeFileSync(
    path.join(out, 'index.html'),
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>Kitabash — learn by doing</title>
<link rel="icon" href="/favicon.svg" />
<link rel="stylesheet" href="/app.css" />
</head>
<body>
<div id="root"></div>
<noscript>Kitabash needs JavaScript enabled.</noscript>
<script type="module" src="/app.js"></script>
</body>
</html>`,
  );
  fs.writeFileSync(
    path.join(out, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#E8572A"/><path d="M18 16h8v13l12-13h10L35 30l14 18H39L29 35l-3 3v10h-8z" fill="#fff"/></svg>`,
  );
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  writeHtml();
  const clientOpts: esbuild.BuildOptions = {
    entryPoints: [path.join(root, 'src/client/main.tsx')],
    bundle: true,
    format: 'esm',
    outfile: path.join(out, 'app.js'),
    jsx: 'automatic',
    minify: !watch,
    sourcemap: watch ? 'inline' : false,
    target: ['es2022'],
    define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
    logLevel: quiet ? 'error' : 'info',
  };
  const serverOpts: esbuild.BuildOptions = {
    entryPoints: [path.join(root, 'server/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outfile: path.join(root, 'dist/server.js'),
    packages: 'external',
    banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
    logLevel: quiet ? 'error' : 'info',
  };
  if (watch) {
    const ctx = await esbuild.context({ ...clientOpts, plugins: [{ name: 'css', setup: (b) => b.onEnd(() => void buildCss()) }] });
    await ctx.watch();
    console.log('Watching client…');
  } else {
    await esbuild.build(clientOpts);
    const n = await buildCss();
    if (!quiet) console.log(`CSS ${Math.round(n / 1024)} KB`);
    await esbuild.build(serverOpts);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
