#!/usr/bin/env node
/**
 * 教材の挿絵を PNG から WebP に変換する。
 *
 * - public/illustrations/<collection>/<slug>/scene*.png をすべて WebP に変換
 * - 画質 85（児童書イラスト用途として十分な品質）
 * - effort 6（圧縮最大化）
 * - 元 PNG は削除しない（リポジトリ管理は別判断）
 */
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ILLUSTRATIONS_DIR = join(ROOT, 'public', 'illustrations');

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile() && p.endsWith('.png')) out.push(p);
  }
  return out;
}

const pngs = await walk(ILLUSTRATIONS_DIR);
console.log(`Converting ${pngs.length} PNG file(s) to WebP...`);

let totalBefore = 0;
let totalAfter = 0;

for (const png of pngs) {
  const webp = png.replace(/\.png$/, '.webp');
  const before = (await stat(png)).size;
  const info = await sharp(png)
    .webp({ quality: 85, effort: 6 })
    .toFile(webp);
  totalBefore += before;
  totalAfter += info.size;
  const ratio = ((1 - info.size / before) * 100).toFixed(1);
  const rel = png.replace(ROOT + '/', '');
  console.log(`  ${rel}: ${(before / 1024).toFixed(0)} KB → ${(info.size / 1024).toFixed(0)} KB (-${ratio}%)`);
}

const totalRatio = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(2)} MB → ${(totalAfter / 1024 / 1024).toFixed(2)} MB (-${totalRatio}%)`);
