/**
 * GET /api/cover?collection=...&id=...&title=...&author=...&subject=...&era=...
 *
 * cover_image が未設定の教材のための SVG カバー画像を動的生成。
 * 1200×630 (OG 標準サイズ)。教科ごとのカラーパレット。
 * Cloudflare Edge で実行され CDN にキャッシュされる (1 day)。
 */

const COLLECTION_LABEL: Record<string, string> = {
  kokugo1: '小1 国語', kokugo2: '小2 国語', kokugo3: '小3 国語',
  kokugo4: '小4 国語', kokugo6: '小6 国語',
  chugaku1: '中1 国語', chugaku2: '中2 国語', chugaku3: '中3 国語',
  kotoko1: '高1 国語', kotoko2: '高2 国語', kotoko3: '高3 評論',
  kateika5: '小5 家庭科',
  chugakurika1: '中1 理科', chugakurika2: '中2 理科',
  chugakurekishi1: '中1 歴史',
  kotokoeigo1: '高1 英語', koteoyaku1: '高1 西洋翻訳',
  sansu5: '小5 算数', chugakukomin3: '中3 公民',
  kotorekishi1: '高1 日本史', kotokokanbun1: '高1 漢文', kotosekaishi1: '高1 世界史',
};

interface Palette { bg: string; fg: string; accent: string }
const PALETTE_BY_SUBJECT: Record<string, Palette> = {
  '国語': { bg: '#fdf6e9', fg: '#5a3030', accent: '#c97a3e' },
  '評論': { bg: '#f0f4f9', fg: '#1f2a3a', accent: '#3e7ec9' },
  '古典 (西洋翻訳)': { bg: '#f4eef5', fg: '#3a1f3a', accent: '#7a5ec9' },
  '家庭科': { bg: '#fdf2f2', fg: '#5a1f1f', accent: '#c94a4a' },
  '理科': { bg: '#eef7f1', fg: '#1f3a2a', accent: '#3eae8f' },
  '社会（歴史）': { bg: '#fdf2e8', fg: '#5a2a1f', accent: '#c97a3e' },
  '社会（公民）': { bg: '#fdf2f2', fg: '#5a1f1f', accent: '#c94a4a' },
  '地理歴史（日本史）': { bg: '#eff5f9', fg: '#1f3050', accent: '#3e7ec9' },
  '地理歴史（世界史）': { bg: '#f5eff9', fg: '#2a1f5a', accent: '#7a5ec9' },
  '英語': { bg: '#f0f7ed', fg: '#1f3a1f', accent: '#7ea83e' },
  '算数': { bg: '#fdf6e0', fg: '#5a4a1f', accent: '#c9923e' },
  '漢文': { bg: '#f6f1e9', fg: '#3a2a1f', accent: '#8b5a3a' },
};
const DEFAULT_PALETTE: Palette = { bg: '#f5f0e8', fg: '#3a3a3a', accent: '#8b3a3a' };

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function wrapTitle(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let buf = '';
  for (const ch of text) {
    if (buf.length >= maxChars) { lines.push(buf); buf = ''; }
    buf += ch;
  }
  if (buf) lines.push(buf);
  return lines.slice(0, 3);
}

export const onRequestGet: PagesFunction = ({ request }) => {
  const u = new URL(request.url);
  const collection = (u.searchParams.get('collection') || '').slice(0, 40);
  const title = (u.searchParams.get('title') || 'ひらく').slice(0, 60);
  const author = (u.searchParams.get('author') || '').slice(0, 60);
  const subject = (u.searchParams.get('subject') || '').slice(0, 40);
  const era = (u.searchParams.get('era') || '').slice(0, 40);

  const label = COLLECTION_LABEL[collection] || collection || 'ひらく';
  const palette = PALETTE_BY_SUBJECT[subject] || DEFAULT_PALETTE;

  const titleLines = wrapTitle(title, 14);
  const lineHeight = 78;
  const startY = 280 - (titleLines.length - 1) * lineHeight / 2;
  const titleTspans = titleLines
    .map((line, i) => `<tspan x="600" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg}"/>
      <stop offset="1" stop-color="${palette.accent}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="12" height="630" fill="${palette.accent}"/>
  <text x="600" y="120" font-family="'Noto Sans JP', sans-serif" font-size="22" font-weight="500" fill="${palette.accent}" text-anchor="middle" letter-spacing="4">${escapeXml(label)}</text>
  <text x="600" y="${startY}" font-family="'Noto Serif JP', serif" font-size="64" font-weight="700" fill="${palette.fg}" text-anchor="middle">${titleTspans}</text>
  <text x="600" y="500" font-family="'Noto Serif JP', serif" font-size="28" fill="${palette.fg}" text-anchor="middle" opacity="0.75">${escapeXml(author)}</text>
  ${era ? `<text x="600" y="540" font-family="'Noto Sans JP', sans-serif" font-size="20" fill="${palette.fg}" text-anchor="middle" opacity="0.55">${escapeXml(era)}</text>` : ''}
  <text x="600" y="600" font-family="'Noto Sans JP', sans-serif" font-size="16" fill="${palette.fg}" text-anchor="middle" opacity="0.5">ひらく — hiraku-5cb.pages.dev</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
};
