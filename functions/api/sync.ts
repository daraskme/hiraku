/**
 * /api/sync
 *
 * GET  → ログイン中ユーザーの保存済み状態を返す (なければ null フィールド)
 * PUT  → クライアントから受け取った状態で上書き保存 (last-write-wins)
 *
 * KV キー: user:<sub>
 * 内容:    { progress, bookmarks, words, prefs, clientUpdatedAt, serverUpdatedAt }
 */
import {
  jsonResponse,
  requireSession,
  type Env,
} from '../_lib/session';

interface SyncPayload {
  progress?: unknown;
  bookmarks?: unknown;
  words?: string[];
  stars?: unknown;
  badges?: unknown;
  goals?: unknown[];
  prefs?: Record<string, unknown>;
  clientUpdatedAt?: number;
}

interface StoredState extends SyncPayload {
  serverUpdatedAt: number;
}

// 1 ユーザあたりの上限。KV の値は 25 MB だが、健全な学習データはせいぜい数 KB。
// 異常データを弾くために 256 KB をハードリミットとする。
const MAX_PAYLOAD_BYTES = 256 * 1024;

function safeArray(input: unknown, max = 200): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v): v is string => typeof v === 'string')
    .slice(0, max)
    .map((s) => s.slice(0, 200));
}

function safeRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;

  const raw = await env.HIRAKU_KV.get(`user:${rec.sub}`);
  if (!raw) {
    return jsonResponse({
      state: null,
      user: { sub: rec.sub, name: rec.name, email: rec.email, picture: rec.picture },
    });
  }
  let stored: StoredState | null = null;
  try {
    stored = JSON.parse(raw);
  } catch {
    stored = null;
  }
  return jsonResponse({
    state: stored,
    user: { sub: rec.sub, name: rec.name, email: rec.email, picture: rec.picture },
  });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;

  // ペイロードサイズチェック
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, { status: 413 });
  }

  let body: SyncPayload;
  try {
    body = (await request.json()) as SyncPayload;
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 });
  }

  // 防御的に整形：型の合わないデータは無視する
  const stored: StoredState = {
    progress: safeRecord(body.progress) || {},
    bookmarks: safeRecord(body.bookmarks) || {},
    words: safeArray(body.words, 200),
    stars: safeRecord(body.stars) || {},
    badges: safeRecord(body.badges) || {},
    goals: Array.isArray(body.goals) ? body.goals.slice(0, 50) : [],
    prefs: safeRecord(body.prefs) || {},
    clientUpdatedAt: typeof body.clientUpdatedAt === 'number' ? body.clientUpdatedAt : Date.now(),
    serverUpdatedAt: Date.now(),
  };

  const serialized = JSON.stringify(stored);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: 'payload_too_large_after_normalize' }, { status: 413 });
  }

  await env.HIRAKU_KV.put(`user:${rec.sub}`, serialized);
  return jsonResponse({ ok: true, serverUpdatedAt: stored.serverUpdatedAt });
};

// 明示的に削除する場合 (退会・データ消去)
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;
  await env.HIRAKU_KV.delete(`user:${rec.sub}`).catch(() => {});
  return jsonResponse({ ok: true });
};
