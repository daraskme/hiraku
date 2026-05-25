/**
 * POST /api/auth/google
 *
 * body: { credential: <Google ID Token (JWT)> }
 *
 * Google Identity Services が発行した credential を検証し、ひらく独自の
 * セッションを発行 (KV + Cookie)。成功時はユーザー公開情報を返す。
 */
import {
  createSession,
  jsonResponse,
  toUserPublic,
  verifyGoogleIdToken,
  type Env,
} from '../../_lib/session';

interface RequestBody {
  credential?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID) {
    return jsonResponse(
      { error: 'server_not_configured', detail: 'GOOGLE_CLIENT_ID not set' },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 });
  }
  if (!body.credential) {
    return jsonResponse({ error: 'missing_credential' }, { status: 400 });
  }

  const identity = await verifyGoogleIdToken(body.credential, env.GOOGLE_CLIENT_ID);
  if (!identity) {
    return jsonResponse({ error: 'invalid_token' }, { status: 401 });
  }

  const { rec, cookie } = await createSession(env, identity);
  return jsonResponse(
    { user: toUserPublic(rec) },
    { headers: { 'Set-Cookie': cookie } }
  );
};

// GET でアクセスされた場合のヒント
export const onRequestGet: PagesFunction<Env> = () =>
  jsonResponse({ error: 'method_not_allowed', hint: 'POST credential JSON here' }, { status: 405 });
