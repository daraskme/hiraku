/**
 * /api/classes/<id>
 *
 * クラス詳細の取得・削除。
 * GET: owner or member のみ。owner ならロースタ + 各生徒の進捗サマリを返す。
 * DELETE: owner のみ。クラス本体・ロースタ・招待コード・各 owner/member の
 *         逆引きインデックスもクリーンアップ。
 */
import {
  jsonResponse,
  requireSession,
  type Env,
} from '../../_lib/session';

interface ClassRecord {
  id: string;
  name: string;
  ownerSub: string;
  createdAt: number;
  joinCode: string;
}
interface ClassMember {
  sub: string;
  name?: string;
  joinedAt: number;
}
interface ClassRoster {
  members: ClassMember[];
}

interface MemberSummary {
  sub: string;
  name?: string;
  joinedAt: number;
  totalReads: number;
  badgesCount: number;
  starsCount: number;
  lastActive?: number;
}

async function loadClass(env: Env, id: string): Promise<ClassRecord | null> {
  const raw = await env.HIRAKU_KV.get(`class:${id}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
async function loadRoster(env: Env, id: string): Promise<ClassRoster> {
  const raw = await env.HIRAKU_KV.get(`classRoster:${id}`);
  if (!raw) return { members: [] };
  try {
    const p = JSON.parse(raw);
    return p && Array.isArray(p.members) ? p : { members: [] };
  } catch { return { members: [] }; }
}
async function loadUserSummary(env: Env, sub: string) {
  const raw = await env.HIRAKU_KV.get(`user:${sub}`);
  if (!raw) return { totalReads: 0, badgesCount: 0, starsCount: 0 };
  try {
    const s = JSON.parse(raw);
    const reads = s.progress && s.progress.reads ? Object.keys(s.progress.reads).length : 0;
    const badges = s.badges ? Object.keys(s.badges).length : 0;
    const stars = s.stars ? Object.keys(s.stars).length : 0;
    return {
      totalReads: reads,
      badgesCount: badges,
      starsCount: stars,
      lastActive: s.clientUpdatedAt || s.serverUpdatedAt,
    };
  } catch {
    return { totalReads: 0, badgesCount: 0, starsCount: 0 };
  }
}

export const onRequestGet: PagesFunction<Env, { id: string }> = async ({ request, env, params }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;
  const id = String(params.id || '').replace(/[^a-f0-9]/gi, '');
  if (!id) return jsonResponse({ error: 'invalid_id' }, { status: 400 });

  const cls = await loadClass(env, id);
  if (!cls) return jsonResponse({ error: 'not_found' }, { status: 404 });

  const roster = await loadRoster(env, id);
  const isOwner = cls.ownerSub === rec.sub;
  const isMember = roster.members.some((m) => m.sub === rec.sub);
  if (!isOwner && !isMember) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 });
  }

  // owner なら全メンバーの集計サマリ、member なら自分のだけ
  let members: MemberSummary[] = [];
  if (isOwner) {
    members = await Promise.all(
      roster.members.map(async (m) => ({
        sub: m.sub,
        name: m.name,
        joinedAt: m.joinedAt,
        ...(await loadUserSummary(env, m.sub)),
      }))
    );
  } else {
    const self = roster.members.find((m) => m.sub === rec.sub);
    if (self) {
      members = [{
        sub: self.sub,
        name: self.name,
        joinedAt: self.joinedAt,
        ...(await loadUserSummary(env, self.sub)),
      }];
    }
  }

  return jsonResponse({
    class: {
      id: cls.id,
      name: cls.name,
      createdAt: cls.createdAt,
      isOwner,
      joinCode: isOwner ? cls.joinCode : undefined,
      memberCount: roster.members.length,
    },
    members,
  });
};

export const onRequestDelete: PagesFunction<Env, { id: string }> = async ({ request, env, params }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;
  const id = String(params.id || '').replace(/[^a-f0-9]/gi, '');
  if (!id) return jsonResponse({ error: 'invalid_id' }, { status: 400 });
  const cls = await loadClass(env, id);
  if (!cls) return jsonResponse({ error: 'not_found' }, { status: 404 });
  if (cls.ownerSub !== rec.sub) return jsonResponse({ error: 'forbidden' }, { status: 403 });

  const roster = await loadRoster(env, id);
  // メンバー逆引きから削除
  for (const m of roster.members) {
    const arr = await (async () => {
      const raw = await env.HIRAKU_KV.get(`classByMember:${m.sub}`);
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    })();
    const next = arr.filter((x: string) => x !== id);
    await env.HIRAKU_KV.put(`classByMember:${m.sub}`, JSON.stringify(next));
  }
  // owner 逆引きから削除
  const ownerArr = await (async () => {
    const raw = await env.HIRAKU_KV.get(`classByOwner:${rec.sub}`);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  })();
  await env.HIRAKU_KV.put(
    `classByOwner:${rec.sub}`,
    JSON.stringify(ownerArr.filter((x: string) => x !== id))
  );
  // 招待コード逆引き削除
  await env.HIRAKU_KV.delete(`classJoinCode:${cls.joinCode}`).catch(() => {});
  // 本体・ロースタ削除
  await env.HIRAKU_KV.delete(`class:${id}`).catch(() => {});
  await env.HIRAKU_KV.delete(`classRoster:${id}`).catch(() => {});

  return jsonResponse({ ok: true });
};
