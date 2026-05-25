/**
 * POST /api/error
 *
 * クライアント側で発生した JS エラーの簡易ログを受け取って KV に貯める。
 * 巨大な Sentry の代替として、最小限の障害把握用。
 *
 * KV キー: errlog:<yyyy-mm-dd>:<rand8>
 * TTL: 30 日 (KV expirationTtl)
 *
 * セッション不要 (誰でも投稿可) だが、payload サイズ・rate を制限する。
 */
import { jsonResponse, type Env } from '../_lib/session';

const MAX_BODY = 4 * 1024; // 4 KB
const TTL_SECONDS = 30 * 24 * 60 * 60;

interface ErrorReport {
  message?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url?: string;
  ua?: string;
  ts?: number;
}

function safeStr(v: unknown, max = 500): string {
  if (typeof v !== 'string') return '';
  return v.slice(0, max);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cl = Number(request.headers.get('Content-Length') || '0');
  if (cl > MAX_BODY) {
    return jsonResponse({ error: 'too_large' }, { status: 413 });
  }
  let body: ErrorReport;
  try {
    body = (await request.json()) as ErrorReport;
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 });
  }
  const report = {
    message: safeStr(body.message),
    source: safeStr(body.source),
    lineno: typeof body.lineno === 'number' ? body.lineno : null,
    colno: typeof body.colno === 'number' ? body.colno : null,
    stack: safeStr(body.stack, 1500),
    url: safeStr(body.url, 400),
    ua: safeStr(body.ua, 300),
    ts: typeof body.ts === 'number' ? body.ts : Date.now(),
    receivedAt: Date.now(),
    ip: request.headers.get('CF-Connecting-IP') || '',
    country: request.headers.get('CF-IPCountry') || '',
  };
  // メッセージが空ならスパムなので捨てる
  if (!report.message && !report.stack) {
    return jsonResponse({ error: 'empty' }, { status: 400 });
  }
  const date = new Date(report.ts).toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 10);
  await env.HIRAKU_KV.put(
    `errlog:${date}:${rand}`,
    JSON.stringify(report),
    { expirationTtl: TTL_SECONDS }
  );
  return jsonResponse({ ok: true });
};

// GET: 簡易管理ビュー (オプション)。本番では disable しても良い。
export const onRequestGet: PagesFunction<Env> = () =>
  jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
