#!/usr/bin/env node
/**
 * OG画像（1200×630）を全教材ページ用に生成する。
 *
 * - 入力：src/content/*&#x2F;*.md の frontmatter
 * - 出力：dist/og/<collection>/<slug>.png
 *
 * フォントは .fonts/ に置く。なければ jsDelivr から自動取得。
 */
import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const FONT_DIR = join(ROOT, '.fonts');
const FONTS = {
  serif: {
    path: join(FONT_DIR, 'NotoSerifJP-Bold.ttf'),
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-jp@latest/japanese-700-normal.ttf',
  },
  sans: {
    path: join(FONT_DIR, 'NotoSansJP-Regular.ttf'),
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.ttf',
  },
};

const COLLECTION_LABEL = {
  kokugo3: '小3 国語',
  kokugo4: '小4 国語',
  kokugo6: '小6 国語',
  chugaku1: '中1 国語',
  chugaku2: '中2 国語',
  kotoko1: '高1 国語',
  chugakurika1: '中1 理科',
  kotokoeigo1: '高1 英語',
  sansu5: '小5 算数',
  chugakukomin3: '中3 公民',
};

async function ensureFonts() {
  await mkdir(FONT_DIR, { recursive: true });
  for (const [name, info] of Object.entries(FONTS)) {
    try {
      await access(info.path);
    } catch {
      console.log(`Downloading ${name} font...`);
      const res = await fetch(info.url);
      if (!res.ok) throw new Error(`Font download failed for ${name}: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(info.path, buf);
    }
  }
}

async function loadAllLessons() {
  const contentRoot = join(ROOT, 'src', 'content');
  const collections = await readdir(contentRoot);
  const lessons = [];
  for (const collection of collections) {
    const dir = join(contentRoot, collection);
    let files;
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const slug = f.replace(/\.md$/, '');
      const raw = await readFile(join(dir, f), 'utf-8');
      const { data } = matter(raw);
      lessons.push({ collection, slug, data });
    }
  }
  return lessons;
}

/**
 * Satori で OG 画像 (1200×630) を生成する JSX-like ノードを構築する。
 */
function ogTree({ title, author, era, original_year, collectionLabel, classical }) {
  const accent = '#b85c4a';
  const logoBg = '#1d2a3d';
  const cream = '#f3efe5';
  const text = '#2a2018';
  const sub = '#6b5d4f';

  const dateLabel = era || (original_year ? `${original_year}年` : '');

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: cream,
        padding: '60px 80px',
        fontFamily: 'NotoSerifJP',
        color: text,
      },
      children: [
        // ─── Top brand bar ───
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '64px',
                    height: '64px',
                    background: logoBg,
                    color: cream,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    fontWeight: 700,
                    borderRadius: '6px',
                  },
                  children: '啓',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    { type: 'div', props: { style: { fontSize: '32px', fontWeight: 700, letterSpacing: '0.04em' }, children: 'ひらく' } },
                    { type: 'div', props: { style: { fontSize: '13px', letterSpacing: '0.18em', color: sub, fontFamily: 'NotoSansJP', marginTop: '4px' }, children: 'OPEN TEXTBOOKS' } },
                  ],
                },
              },
              // Right-aligned collection label
              {
                type: 'div',
                props: {
                  style: { marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' },
                  children: [
                    classical && {
                      type: 'div',
                      props: {
                        style: {
                          padding: '6px 14px', borderRadius: '999px',
                          background: accent, color: cream,
                          fontSize: '16px', fontFamily: 'NotoSansJP',
                        },
                        children: '古典',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          padding: '6px 16px', borderRadius: '999px',
                          background: 'transparent', color: sub,
                          border: `1px solid ${sub}`,
                          fontSize: '18px', fontFamily: 'NotoSansJP',
                        },
                        children: collectionLabel,
                      },
                    },
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
        // ─── Title (auto-fitted) ───
        {
          type: 'div',
          props: {
            style: {
              fontSize: title.length > 12 ? '76px' : title.length > 20 ? '64px' : '92px',
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: '30px',
              maxWidth: '1040px',
              wordBreak: 'keep-all',
              display: 'flex',
            },
            children: title,
          },
        },
        // ─── Spacer ───
        { type: 'div', props: { style: { flex: 1 }, children: '' } },
        // ─── Footer: author + era ───
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'baseline', gap: '20px', borderTop: `1px solid ${sub}`, paddingTop: '24px' },
            children: [
              {
                type: 'div',
                props: { style: { fontSize: '34px', color: text }, children: author },
              },
              dateLabel && {
                type: 'div',
                props: { style: { fontSize: '22px', color: sub, fontFamily: 'NotoSansJP' }, children: dateLabel },
              },
              {
                type: 'div',
                props: {
                  style: { marginLeft: 'auto', fontSize: '18px', letterSpacing: '0.12em', color: sub, fontFamily: 'NotoSansJP' },
                  children: 'hiraku.pages.dev',
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

async function run() {
  await ensureFonts();

  const [serifFont, sansFont] = await Promise.all([
    readFile(FONTS.serif.path),
    readFile(FONTS.sans.path),
  ]);

  const lessons = await loadAllLessons();
  console.log(`Generating OG images for ${lessons.length} lessons...`);

  const outRoot = join(ROOT, 'dist', 'og');
  await mkdir(outRoot, { recursive: true });

  let count = 0;
  for (const { collection, slug, data } of lessons) {
    const tree = ogTree({
      title: data.title,
      author: data.author,
      era: data.era,
      original_year: data.original_year,
      collectionLabel: COLLECTION_LABEL[collection] || collection,
      classical: !!data.classical,
    });

    const svg = await satori(tree, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'NotoSerifJP', data: serifFont, weight: 700, style: 'normal' },
        { name: 'NotoSansJP', data: sansFont, weight: 400, style: 'normal' },
      ],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: { loadSystemFonts: false },
    });
    const png = resvg.render().asPng();

    const outDir = join(outRoot, collection);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, `${slug}.png`), png);
    count++;
  }

  console.log(`✓ Generated ${count} OG images at dist/og/`);
}

run().catch((err) => {
  console.error('OG generation failed:', err);
  process.exit(1);
});
