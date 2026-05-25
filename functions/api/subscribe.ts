/**
 * POST /api/subscribe { email, name? }
 *
 * メールアドレスをニュースレター購読者リストに追加する。
 * 配信は別途バッチ処理で行う想定 (Cloudflare Email Workers / 外部メール
 * 配信サービス連携)。本エンドポイントは登録のみ。
 *
 * KV キー: subs:<emailLower> → { email, name, joinedAt, confirmed }
 *          subsCount → 数値 (UI 表示用)
 */
import { jsonResponse, type Env } from '../_lib/session';

interface Body {
  email?: string;
  name?: string;
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_NAME = 80;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Body;
  try { body = (await request.json()) as Body; }
  catch { return jsonResponse({ error: 'invalid_body' }, { status: 400 }); }

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return jsonResponse({ error: 'invalid_email' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, MAX_NAME);

  const key = `subs:${email}`;
  const existing = await env.HIRAKU_KV.get(key);
  if (existing) {
    return jsonResponse({ ok: true, alreadySubscribed: true });
  }
  await env.HIRAKU_KV.put(key, JSON.stringify({
    email, name,
    joinedAt: Date.now(),
    confirmed: false,
  }));
  // 概算カウンタ (atomically incorrect だが UI 用には十分)
  try {
    const cur = Number((await env.HIRAKU_KV.get('subsCount')) || 0) + 1;
    await env.HIRAKU_KV.put('subsCount', String(cur));
  } catch (_) {}
  return jsonResponse({ ok: true });
};
