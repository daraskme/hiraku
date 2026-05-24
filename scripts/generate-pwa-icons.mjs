#!/usr/bin/env node
/**
 * PWA アイコンを Satori + Resvg で生成する（ロゴと同じ「啓」のマーク）。
 *
 * - icon-192.png       — どの目的でも使える 192×192
 * - icon-512.png       — どの目的でも使える 512×512
 * - icon-maskable-512.png — 端まで安全領域があるマスク用 512×512
 */
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FONT_DIR = join(ROOT, '.fonts');
const SERIF_PATH = join(FONT_DIR, 'NotoSerifJP-Bold.ttf');
const FONT_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-jp@latest/japanese-700-normal.ttf';

async function ensureFont() {
  await mkdir(FONT_DIR, { recursive: true });
  try {
    await access(SERIF_PATH);
  } catch {
    console.log('Downloading Noto Serif JP Bold...');
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`Font download failed: HTTP ${res.status}`);
    await writeFile(SERIF_PATH, Buffer.from(await res.arrayBuffer()));
  }
}

function iconTree({ size, padding, bg, fg }) {
  return {
    type: 'div',
    props: {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'NotoSerifJP',
        color: fg,
        padding: `${padding}px`,
        boxSizing: 'border-box',
      },
      children: {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.round((size - padding * 2) * 0.85)}px`,
            fontWeight: 700,
            lineHeight: 1,
            background: '#1d2a3d',
            color: '#f3efe5',
            borderRadius: padding > 0 ? `${Math.round(size * 0.18)}px` : `${Math.round(size * 0.22)}px`,
          },
          children: '啓',
        },
      },
    },
  };
}

async function renderToPng(tree, size) {
  const serif = await readFile(SERIF_PATH);
  const svg = await satori(tree, {
    width: size,
    height: size,
    fonts: [{ name: 'NotoSerifJP', data: serif, weight: 700, style: 'normal' }],
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

async function run() {
  await ensureFont();

  // 192×192（普通の用途）
  const tree192 = iconTree({ size: 192, padding: 0, bg: '#f3efe5', fg: '#f3efe5' });
  const png192 = await renderToPng(tree192, 192);
  await writeFile(join(ROOT, 'public', 'icon-192.png'), png192);

  // 512×512（普通の用途）
  const tree512 = iconTree({ size: 512, padding: 0, bg: '#f3efe5', fg: '#f3efe5' });
  const png512 = await renderToPng(tree512, 512);
  await writeFile(join(ROOT, 'public', 'icon-512.png'), png512);

  // 512×512 maskable（端まで埋めるため、ロゴをやや小さく）
  const treeMask = iconTree({ size: 512, padding: 80, bg: '#1d2a3d', fg: '#f3efe5' });
  const pngMask = await renderToPng(treeMask, 512);
  await writeFile(join(ROOT, 'public', 'icon-maskable-512.png'), pngMask);

  console.log('✓ Generated PWA icons: icon-192.png, icon-512.png, icon-maskable-512.png');
}

run().catch((err) => {
  console.error('PWA icon generation failed:', err);
  process.exit(1);
});
