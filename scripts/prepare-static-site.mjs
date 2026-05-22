#!/usr/bin/env node
/**
 * Prepare Next.js static export for GitHub Pages.
 * - Custom domain (CNAME): paths stay at /
 * - Project page (no CNAME): paths use /repo-name/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_REPO = 'guofang-h5';
const STRIP_PREFIXES = [`/${DEFAULT_REPO}`];

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

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.css', '.json']);

function normalizeBasePath(input) {
  if (!input || input === '/') return '';
  let base = input.trim();
  if (!base.startsWith('/')) base = `/${base}`;
  return base.replace(/\/+$/, '');
}

function readCname() {
  const cnamePath = path.join(ROOT, 'CNAME');
  if (!fs.existsSync(cnamePath)) return null;
  const host = fs.readFileSync(cnamePath, 'utf8').trim();
  return host || null;
}

function detectBasePath() {
  if (process.env.BASE_PATH !== undefined) {
    return normalizeBasePath(process.env.BASE_PATH);
  }

  const cname = readCname();
  if (cname) {
    console.log(`CNAME: ${cname} → deploy at site root /`);
    return '';
  }

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (repo) {
    if (repo.endsWith('.github.io')) return '';
    return normalizeBasePath(`/${repo}`);
  }

  return normalizeBasePath(`/${DEFAULT_REPO}`);
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

function transformTextFiles(transform) {
  let count = 0;
  walk(ROOT, (file) => {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) return;
    if (file.includes(`${path.sep}scripts${path.sep}`)) return;

    const original = fs.readFileSync(file, 'utf8');
    const updated = transform(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      count += 1;
    }
  });
  return count;
}

function stripKnownPrefixes(content) {
  let out = content;
  for (const prefix of STRIP_PREFIXES) {
    const doubled = prefix + prefix;
    while (out.includes(doubled)) {
      out = out.split(doubled).join(prefix);
    }
    out = out.split(prefix).join('');
  }
  return out;
}

function stripAllPrefixes() {
  const count = transformTextFiles(stripKnownPrefixes);
  console.log(`Stripped project prefixes in ${count} files.`);
}

function removeBuildArtifacts() {
  const patterns = [/^__next\./, /^index\.txt$/, /^[a-f0-9]{32}\.txt$/];

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
      `Created placeholder assets (replace with real files from public/):\n  - ${created.join('\n  - ')}`,
    );
  }
}

function applyPrefix(content, basePath) {
  if (!basePath) return content;

  const prefix = basePath;
  const slug = prefix.slice(1);
  const doubled = prefix + prefix;

  const replaceContent = (text) => {
    let out = text;
    while (out.includes(doubled)) {
      out = out.split(doubled).join(prefix);
    }

    const skip = `(?!${slug}/|/)`;

    const rules = [
      [new RegExp(`href="/${skip}`, 'g'), `href="${prefix}/`],
      [new RegExp(`href:"/${skip}`, 'g'), `href:"${prefix}/`],
      [new RegExp(`href:'/${skip}`, 'g'), `href:'${prefix}/`],
      [new RegExp(`src="/${skip}`, 'g'), `src="${prefix}/`],
      [new RegExp(`src='/${skip}`, 'g'), `src='${prefix}/`],
      [new RegExp(`src:"/${skip}`, 'g'), `src:"${prefix}/`],
      [new RegExp(`icon:"/${skip}`, 'g'), `icon:"${prefix}/`],
      [new RegExp(`href:\`/${skip}`, 'g'), `href:\`${prefix}/`],
      [new RegExp(`window\\.location\\.href="/${skip}`, 'g'), `window.location.href="${prefix}/`],
      [new RegExp(`:"/${skip}_next/`, 'g'), `:"${prefix}/_next/`],
      [new RegExp(`,\"/${skip}_next/`, 'g'), `,"${prefix}/_next/`],
      [new RegExp(`\\[\\"/${skip}_next/`, 'g'), `["${prefix}/_next/`],
      [new RegExp(`url=/${skip}`, 'g'), `url=${prefix}/`],
      [new RegExp(`location\\.replace\\("/${skip}`, 'g'), `location.replace("${prefix}/`],
      [new RegExp(`\\\\"/${skip}_next/`, 'g'), `\\"${prefix}/_next/`],
      [new RegExp(`\\\\"/${skip}favicon`, 'g'), `\\"${prefix}/favicon`],
      [new RegExp(`"/${skip}_next/`, 'g'), `"${prefix}/_next/`],
      [new RegExp(`let t="/${skip}_next/`, 'g'), `let t="${prefix}/_next/`],
    ];

    for (const [re, rep] of rules) {
      out = out.replace(re, rep);
    }

    return out;
  };

  return replaceContent(content);
}

function rewritePaths(basePath) {
  if (!basePath) {
    console.log('BASE_PATH is empty — assets use / (custom domain or user site).');
    return;
  }

  const count = transformTextFiles((content) => applyPrefix(content, basePath));
  console.log(`Applied prefix "${basePath}" in ${count} files.`);
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
  stripAllPrefixes();
  const basePath = detectBasePath();
  rewritePaths(basePath);
  writeFriendly404(basePath);

  const cname = readCname();
  if (cname) {
    console.log(`Live site: https://${cname}/`);
  } else {
    console.log(`Live site: https://<user>.github.io${basePath || ''}/`);
  }
}

main();
