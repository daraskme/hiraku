/**
 * /api/cite?text=...&title=...&author=...
 *
 * 引用カード SVG を返す。OG 画像として SNS でシェアできるよう、絵入りの
 * 1200×630 を SVG で動的生成。SVG なので軽量で、すべての SNS が解釈可能。
 *
 * Cloudflare Pages Functions の Edge で実行され、CDN にキャッシュされる
 * (Cache-Control: 1 day) ので、同じ引用は再生成されない。
 */
import { jsonResponse } from '../_lib/session';

interface Params {
  text: string;
  title: string;
  author?: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  // 日本語前提: 1 文字を均等幅と仮定し、maxCharsPerLine ごとに折り返す
  const lines: string[] = [];
  let buf = '';
  for (const ch of text) {
    if (ch === '\n' || buf.length >= maxCharsPerLine) {
      lines.push(buf);
      buf = '';
      if (lines.length >= maxLines) break;
      if (ch === '\n') continue;
    }
    buf += ch;
  }
  if (buf && lines.length < maxLines) lines.push(buf);
  if (lines.length === maxLines && lines[maxLines - 1].length === maxCharsPerLine) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
  }
  return lines;
}

function buildSvg(p: Params): string {
  const text = p.text.slice(0, 200);
  const title = p.title.slice(0, 80);
  const author = (p.author || '').slice(0, 60);
  const lines = wrapText(text, 24, 6);
  // 行間 64px、開始 y = 中央付近 (vert center: 315) - (lines * 64 / 2)
  const lineHeight = 60;
  const startY = 315 - (lines.length - 1) * lineHeight / 2;
  const tspans = lines
    .map((line, i) => `<tspan x="600" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fdf6e9"/>
      <stop offset="1" stop-color="#f3e5d0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#8b3a3a" stroke-width="3" opacity="0.4"/>
  <text x="80" y="100" font-family="'Noto Serif JP', serif" font-size="28" fill="#8b3a3a" opacity="0.7">❝</text>
  <text x="1100" y="560" font-family="'Noto Serif JP', serif" font-size="28" fill="#8b3a3a" opacity="0.7" text-anchor="end">❞</text>
  <text x="600" y="${startY}" font-family="'Noto Serif JP', serif" font-size="44" fill="#1f1f1f" text-anchor="middle" font-weight="500">${tspans}</text>
  <text x="600" y="540" font-family="'Noto Sans JP', sans-serif" font-size="22" fill="#5a3030" text-anchor="middle" font-weight="500">${escapeXml(title)}</text>
  <text x="600" y="572" font-family="'Noto Sans JP', sans-serif" font-size="18" fill="#777" text-anchor="middle">${escapeXml(author)}</text>
  <text x="600" y="612" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="#999" text-anchor="middle">— ひらく / hiraku-5cb.pages.dev</text>
</svg>`;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const text = url.searchParams.get('text') || '';
  const title = url.searchParams.get('title') || '';
  const author = url.searchParams.get('author') || '';

  if (!text.trim() || !title.trim()) {
    return jsonResponse({ error: 'missing_text_or_title' }, { status: 400 });
  }

  const svg = buildSvg({ text, title, author });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
};
