// Minify CSS/JS and copy site to dist/ preserving structure
// Requires: npm i -D postcss cssnano terser

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let postcss, cssnano, terser;
try {
  postcss = (await import('postcss')).default;
  cssnano = (await import('cssnano')).default;
  terser = await import('terser');
} catch (err) {
  console.error('Missing build dependencies. Please run:');
  console.error('  npm install --save-dev postcss cssnano terser');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const OUTDIR = path.join(ROOT, 'dist');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', '.vscode']);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function cleanOut() {
  await fs.rm(OUTDIR, { recursive: true, force: true });
  await ensureDir(OUTDIR);
}

async function getAllFiles(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await getAllFiles(full, base)));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

async function minifyCss(content) {
  const result = await postcss([cssnano()]).process(content, { from: undefined });
  return result.css;
}

async function minifyJs(content) {
  const result = await terser.minify(content, {
    compress: {
      passes: 2,
      drop_console: false
    },
    mangle: true
  });
  if (result.error) throw result.error;
  return result.code;
}

async function build() {
  console.log('Building ProjetoSap → dist/');
  await cleanOut();
  const files = await getAllFiles(ROOT);
  let totalBefore = 0, totalAfter = 0;

  for (const rel of files) {
    const src = path.join(ROOT, rel);
    const dest = path.join(OUTDIR, rel);
    await ensureDir(path.dirname(dest));
    const ext = path.extname(rel).toLowerCase();
    const buf = await fs.readFile(src);
    const before = buf.length;
    let outBuf = buf;

    try {
      if (ext === '.css') {
        const min = await minifyCss(buf.toString('utf8'));
        outBuf = Buffer.from(min);
      } else if (ext === '.js') {
        const min = await minifyJs(buf.toString('utf8'));
        outBuf = Buffer.from(min);
      }
    } catch (err) {
      console.warn(`Failed to minify ${rel}:`, err.message || err);
    }

    await fs.writeFile(dest, outBuf);
    totalBefore += before;
    totalAfter += outBuf.length;
  }

  const savedKB = ((totalBefore - totalAfter) / 1024).toFixed(1);
  const outKB = (totalAfter / 1024).toFixed(1);
  console.log(`Build complete. Output ~${outKB} KB. Saved ~${savedKB} KB.`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
