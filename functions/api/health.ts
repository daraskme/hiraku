/**
 * GET /api/health
 *
 * 外部 uptime モニタ向けのヘルスチェック。
 * - KV が読めるかをテスト
 * - レスポンスタイムを返す
 *
 * HTTP 200 で healthy、5xx で何か壊れている。
 * 個人情報や KV 内容は返さない (操作確認のための ping のみ)。
 */
import type { Env } from '../_lib/session';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; ms: number; note?: string }> = {};

  // KV check: 任意の存在しないキーを読む (404 ではなく "値なし" を返す動作確認)
  try {
    const t0 = Date.now();
    await env.HIRAKU_KV.get('__health_probe__');
    checks.kv = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.kv = { ok: false, ms: 0, note: String(e).slice(0, 200) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const body = JSON.stringify({
    ok: allOk,
    ts: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    checks,
  });
  return new Response(body, {
    status: allOk ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
