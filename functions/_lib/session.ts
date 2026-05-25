/**
 * ひらく — セッション・認証ヘルパー（Cloudflare Pages Functions 用）
 *
 * KV キー設計：
 *   session:<sid>  → { sub, email, name, picture, createdAt, expiresAt }
 *   user:<sub>     → { progress, bookmarks, words, prefs, updatedAt }
 *
 * Cookie：
 *   hsess=<sid>  HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<TTL秒>
 */

export interface SessionRecord {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserPublic {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface Env {
  HIRAKU_KV: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  SESSION_TTL_DAYS?: string;
}

const COOKIE_NAME = 'hsess';

/** デフォルト 30 日。env.SESSION_TTL_DAYS で上書き可能 */
export function getSessionTtlSeconds(env: Env): number {
  const days = Number(env.SESSION_TTL_DAYS) || 30;
  return Math.max(1, Math.min(365, days)) * 86400;
}

/** 暗号論的に安全な 32 バイトを base64url で返す */
export function generateSessionId(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return base64UrlEncode(buf);
}

function base64UrlEncode(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Cookie からセッション ID を取り出す */
export function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') || '';
  for (const part of cookieHeader.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (k !== COOKIE_NAME) continue;
    return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

/** セッション Cookie を発行する Set-Cookie 文字列を組み立て */
export function buildSessionCookie(sid: string, ttlSeconds: number): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(sid)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${ttlSeconds}`,
  ];
  return parts.join('; ');
}

/** Cookie を即時削除する Set-Cookie 文字列 */
export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** KV から現在のセッションを取得 (期限切れなら null + 削除) */
export async function loadSession(
  env: Env,
  sid: string | null
): Promise<SessionRecord | null> {
  if (!sid) return null;
  const raw = await env.HIRAKU_KV.get(`session:${sid}`);
  if (!raw) return null;
  let rec: SessionRecord;
  try {
    rec = JSON.parse(raw);
  } catch {
    await env.HIRAKU_KV.delete(`session:${sid}`).catch(() => {});
    return null;
  }
  if (!rec || typeof rec.expiresAt !== 'number' || rec.expiresAt < Date.now()) {
    await env.HIRAKU_KV.delete(`session:${sid}`).catch(() => {});
    return null;
  }
  return rec;
}

/** セッションを発行して KV に保存。Set-Cookie 文字列も返す */
export async function createSession(
  env: Env,
  identity: { sub: string; email?: string; name?: string; picture?: string }
): Promise<{ sid: string; rec: SessionRecord; cookie: string }> {
  const ttl = getSessionTtlSeconds(env);
  const now = Date.now();
  const rec: SessionRecord = {
    sub: identity.sub,
    email: identity.email,
    name: identity.name,
    picture: identity.picture,
    createdAt: now,
    expiresAt: now + ttl * 1000,
  };
  const sid = generateSessionId();
  await env.HIRAKU_KV.put(`session:${sid}`, JSON.stringify(rec), {
    expirationTtl: ttl,
  });
  return { sid, rec, cookie: buildSessionCookie(sid, ttl) };
}

/** 現在のセッションを破棄。Cookie 削除文字列も返す */
export async function destroySession(env: Env, sid: string | null): Promise<string> {
  if (sid) await env.HIRAKU_KV.delete(`session:${sid}`).catch(() => {});
  return buildClearCookie();
}

/** SessionRecord → 公開してよいユーザ情報に整形 */
export function toUserPublic(rec: SessionRecord): UserPublic {
  return {
    sub: rec.sub,
    name: rec.name,
    email: rec.email,
    picture: rec.picture,
  };
}

/** 共通 JSON レスポンス */
export function jsonResponse(
  data: unknown,
  init: { status?: number; headers?: HeadersInit } = {}
): Response {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers,
  });
}

/** 認証が必要なエンドポイントの共通ガード */
export async function requireSession(
  request: Request,
  env: Env
): Promise<{ rec: SessionRecord; sid: string } | Response> {
  const sid = readSessionCookie(request);
  const rec = await loadSession(env, sid);
  if (!rec || !sid) {
    return jsonResponse({ error: 'unauthenticated' }, { status: 401 });
  }
  return { rec, sid };
}

/**
 * Google ID Token (JWT) を検証する。
 *
 * 軽量実装：Google の tokeninfo エンドポイントに問い合わせる。
 * Google の公開鍵をローカルキャッシュして自前で検証するよりやや遅いが、
 * Cloudflare Edge から Google へのレイテンシは小さく、サインイン時の
 * 一回限りなので問題にならない。
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId: string
): Promise<{ sub: string; email?: string; name?: string; picture?: string } | null> {
  if (!idToken || !expectedClientId) return null;
  const url =
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 0, cacheEverything: false },
  } as RequestInit);
  if (!resp.ok) return null;
  const claims = (await resp.json()) as Record<string, string>;

  // クライアントID 一致確認 (audience)
  if (claims.aud !== expectedClientId) return null;
  // issuer 確認
  if (claims.iss !== 'accounts.google.com' && claims.iss !== 'https://accounts.google.com') {
    return null;
  }
  // 期限切れ確認
  const exp = Number(claims.exp);
  if (!exp || exp * 1000 < Date.now()) return null;
  // email_verified が "false" 文字列で返ってくる場合あり
  if (claims.email_verified === 'false') return null;

  return {
    sub: String(claims.sub),
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
  };
}
