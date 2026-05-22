#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = [
  'splash-bg.jpg',
  'catalog-bg.png',
  'icon-gangtie.png',
  'icon-yingxiong.png',
  'icon-guofang.png',
  'icon-zhengce.png',
  'favicon.ico',
];

const MIN_REAL_BYTES = 200;
let failed = false;

for (const name of REQUIRED) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) {
    console.error(`MISSING: ${name}`);
    failed = true;
    continue;
  }
  const size = fs.statSync(file).size;
  if (size < MIN_REAL_BYTES) {
    console.warn(`PLACEHOLDER (${size} B): ${name} — replace with real asset from public/`);
  } else {
    console.log(`OK: ${name} (${size} B)`);
  }
}

if (failed) process.exit(1);
