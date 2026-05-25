/**
 * GET /api/admin/stats
 *
 * 所有者のみが見られる運用統計サマリー。
 * 認証: ログイン中ユーザーの email が env.ADMIN_EMAIL に一致するか判定。
 * (env 未設定なら誰でもアクセス可 = 開発用。本番では必ず設定)
 *
 * 返すデータ:
 *   - ニュースレター登録者数 (subsCount)
 *   - エラーログのサンプル (最新 20 件)
 *   - クラス数の概算
 *   - 最後のサインアウト時刻 (KV last-write-wins)
 */
import {
  jsonResponse,
  loadSession,
  readSessionCookie,
  type Env as BaseEnv,
} from '../../_lib/session';

interface Env extends BaseEnv {
  ADMIN_EMAIL?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const sid = readSessionCookie(request);
  const rec = await loadSession(env, sid);
  if (!rec) return jsonResponse({ error: 'unauthenticated' }, { status: 401 });
  if (env.ADMIN_EMAIL && rec.email !== env.ADMIN_EMAIL) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 });
  }

  // 各種統計を集める
  const subsCount = Number((await env.HIRAKU_KV.get('subsCount')) || 0);

  // エラーログのサンプル (KV の list はコストかかるので限定)
  const errLogs: any[] = [];
  try {
    const list = await env.HIRAKU_KV.list({ prefix: 'errlog:', limit: 20 });
    for (const k of list.keys.slice(0, 20)) {
      const raw = await env.HIRAKU_KV.get(k.name);
      if (raw) {
        try { errLogs.push({ key: k.name, ...JSON.parse(raw) }); } catch {}
      }
    }
  } catch (_) {}

  // クラス数 (owner 別件数概算)
  let classCount = 0;
  try {
    const list = await env.HIRAKU_KV.list({ prefix: 'class:', limit: 100 });
    classCount = list.keys.length;
  } catch (_) {}

  return jsonResponse({
    requestedBy: rec.email,
    isAdmin: !env.ADMIN_EMAIL || rec.email === env.ADMIN_EMAIL,
    stats: {
      subscribers: subsCount,
      classes: classCount,
      recentErrors: errLogs,
    },
    note: env.ADMIN_EMAIL
      ? '管理者として認証されています'
      : 'ADMIN_EMAIL 未設定。全ユーザがアクセスできる開発モードです',
  });
};
