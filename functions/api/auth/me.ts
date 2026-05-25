/**
 * GET /api/auth/me
 *
 * 現在ログインしているユーザーの公開情報を返す。
 * 未ログインなら 200 で { user: null } を返す (404 ではない — クライアントの分岐を単純化)。
 */
import {
  jsonResponse,
  loadSession,
  readSessionCookie,
  toUserPublic,
  type Env,
} from '../../_lib/session';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const sid = readSessionCookie(request);
  const rec = await loadSession(env, sid);
  if (!rec) return jsonResponse({ user: null });
  return jsonResponse({ user: toUserPublic(rec) });
};
