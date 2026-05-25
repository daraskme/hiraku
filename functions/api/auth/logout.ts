/**
 * POST /api/auth/logout
 *
 * 現在のセッションを KV から削除し、クライアント Cookie をクリアする。
 */
import {
  destroySession,
  jsonResponse,
  readSessionCookie,
  type Env,
} from '../../_lib/session';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sid = readSessionCookie(request);
  const clearCookie = await destroySession(env, sid);
  return jsonResponse({ ok: true }, { headers: { 'Set-Cookie': clearCookie } });
};
