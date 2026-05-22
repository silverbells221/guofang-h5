#!/usr/bin/env node
/**
 * Prepare Next.js static export for GitHub Pages.
 * - Ensures .nojekyll exists
 * - Removes build-only artifacts
 * - Optionally rewrites absolute paths for project Pages (BASE_PATH=/repo-name)
 * - Creates tiny placeholder images when public assets are missing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_ASSETS = [
  'splash-bg.jpg',
  'catalog-bg.png',
  'icon-gangtie.png',
  'icon-yingxiong.png',
  'icon-guofang.png',
  'icon-zhengce.png',
  'favicon.ico',
];

const PLACEHOLDER_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'base64',
);

const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function normalizeBasePath(input) {
  if (!input || input === '/') return '';
  let base = input.trim();
  if (!base.startsWith('/')) base = `/${base}`;
  return base.replace(/\/+$/, '');
}

function detectBasePath() {
  const explicit = process.env.BASE_PATH;
  if (explicit !== undefined) return normalizeBasePath(explicit);

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (!repo) return '';

  if (repo.endsWith('.github.io')) return '';
  return normalizeBasePath(`/${repo}`);
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'scripts') continue;
      walk(full, onFile);
    } else {
      onFile(full);
    }
  }
}

function removeBuildArtifacts() {
  const patterns = [
    /^__next\./,
    /^index\.txt$/,
    /^[a-f0-9]{32}\.txt$/,
  ];

  walk(ROOT, (file) => {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const base = path.basename(file);

    if (rel.startsWith('scripts/')) return;

    if (patterns.some((p) => p.test(base)) && file.endsWith('.txt')) {
      fs.unlinkSync(file);
      console.log(`removed artifact: ${rel}`);
    }
  });

  for (const name of ['vercel.svg', 'next.svg', 'file.svg', 'globe.svg', 'window.svg']) {
    const file = path.join(ROOT, name);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`removed unused: ${name}`);
    }
  }
}

function ensureAssets() {
  const created = [];
  for (const name of REQUIRED_ASSETS) {
    const file = path.join(ROOT, name);
    if (fs.existsSync(file)) continue;

    const buf = name.endsWith('.jpg') ? PLACEHOLDER_JPEG : PLACEHOLDER_PNG;
    fs.writeFileSync(file, buf);
    created.push(name);
  }
  if (created.length) {
    console.warn(
      `Created placeholder assets (replace with real files from your Next.js public/ folder):\n  - ${created.join('\n  - ')}`,
    );
  }
}

function rewritePaths(basePath) {
  if (!basePath) {
    console.log('BASE_PATH is empty — site root deployment (user/org Pages or custom domain).');
    return;
  }

  const prefix = basePath;
  const exts = new Set(['.html', '.js', '.css', '.txt']);

  const replaceContent = (content) => {
    let out = content;
    out = out.replace(/href="\//g, `href="${prefix}/`);
    out = out.replace(/src="\//g, `src="${prefix}/`);
    out = out.replace(/href='\/'/g, `href='${prefix}/'`);
    out = out.replace(/src='\/'/g, `src='${prefix}/'`);
    out = out.replace(/:"\/_next\//g, `:"${prefix}/_next/`);
    out = out.replace(/:"\/home\//g, `:"${prefix}/home/`);
    out = out.replace(/:"\/gangtie-changcheng\//g, `:"${prefix}/gangtie-changcheng/`);
    out = out.replace(/:"\/yingxiong-lizan\//g, `:"${prefix}/yingxiong-lizan/`);
    out = out.replace(/:"\/guofang-guangjiao\//g, `:"${prefix}/guofang-guangjiao/`);
    out = out.replace(/:"\/zhengce-zhichuang\//g, `:"${prefix}/zhengce-zhichuang/`);
    out = out.replace(/window\.location\.href="\/home\/"/g, `window.location.href="${prefix}/home/"`);
    out = out.replace(/src:"\/splash-bg\.jpg"/g, `src:"${prefix}/splash-bg.jpg"`);
    out = out.replace(/src:"\/catalog-bg\.png"/g, `src:"${prefix}/catalog-bg.png"`);
    out = out.replace(/icon:"\/icon-/g, `icon:"${prefix}/icon-`);
    return out;
  };

  let count = 0;
  walk(ROOT, (file) => {
    if (!exts.has(path.extname(file))) return;
    if (file.includes(`${path.sep}scripts${path.sep}`)) return;

    const original = fs.readFileSync(file, 'utf8');
    const updated = replaceContent(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      count += 1;
    }
  });

  console.log(`Rewrote absolute paths with prefix "${prefix}" in ${count} files.`);
}

function writeFriendly404(basePath) {
  const home = basePath ? `${basePath}/` : '/';
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>页面未找到 · 戎耀君山</title>
  <meta http-equiv="refresh" content="0; url=${home}" />
  <script>location.replace(${JSON.stringify(home)});</script>
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #fdf2f2; color: #8b0000; }
    a { color: #c41a1a; }
  </style>
</head>
<body>
  <p>正在返回首页…若未跳转，请 <a href="${home}">点击这里</a>。</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, '404.html'), html, 'utf8');
  console.log('Wrote friendly 404.html redirect.');
}

function main() {
  fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');
  ensureAssets();
  removeBuildArtifacts();
  const basePath = detectBasePath();
  rewritePaths(basePath);
  writeFriendly404(basePath);
  console.log('Static site preparation complete.');
}

main();
