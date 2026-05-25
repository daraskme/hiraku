/**
 * /api/classes
 *
 * 教師がクラスを作成し、生徒を招待して進捗を見られるようにする。
 *
 * KV キー設計:
 *   class:<classId>           → { id, name, ownerSub, createdAt, joinCode }
 *   classRoster:<classId>     → { members: [{sub, name, joinedAt}] }
 *   classByOwner:<sub>        → [classId, ...]
 *   classByMember:<sub>       → [classId, ...]
 *   classJoinCode:<joinCode>  → classId  (招待コードの逆引き)
 *
 * エンドポイント:
 *   GET  /api/classes              → 自分が所有 or 参加しているクラス一覧
 *   POST /api/classes              → クラス作成 (body: {name})
 *   POST /api/classes?join=<code>  → 招待コードで参加
 *   GET  /api/classes/<id>         → クラス詳細 (owner or member のみ)
 *   DELETE /api/classes/<id>       → クラス削除 (owner のみ)
 *
 * 個々の生徒の進捗データは user:<sub> に既にあるので、それを集計するだけ。
 */
import {
  jsonResponse,
  requireSession,
  type Env,
} from '../_lib/session';

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

const MAX_CLASS_NAME = 80;
const MAX_CLASSES_PER_USER = 50;
const MAX_MEMBERS_PER_CLASS = 200;

function genId(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function genJoinCode(): string {
  // 短くて読みやすい 6 文字 (ABCDEFHJKLMNPQRSTUVWXY3456789 — 0/O/1/I/l を除く)
  const chars = 'ABCDEFHJKLMNPQRSTUVWXY3456789';
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => chars[b % chars.length]).join('');
}

async function readArr(env: Env, key: string): Promise<string[]> {
  const raw = await env.HIRAKU_KV.get(key);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
async function writeArr(env: Env, key: string, arr: string[]) {
  await env.HIRAKU_KV.put(key, JSON.stringify(arr));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;
  const ownedIds = await readArr(env, `classByOwner:${rec.sub}`);
  const joinedIds = await readArr(env, `classByMember:${rec.sub}`);
  const fetchClass = async (id: string): Promise<ClassRecord | null> => {
    const raw = await env.HIRAKU_KV.get(`class:${id}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };
  const owned = (await Promise.all(ownedIds.map(fetchClass))).filter((c): c is ClassRecord => !!c);
  const joined = (await Promise.all(joinedIds.map(fetchClass))).filter((c): c is ClassRecord => !!c);
  return jsonResponse({
    owned: owned.map((c) => ({ id: c.id, name: c.name, joinCode: c.joinCode, createdAt: c.createdAt })),
    joined: joined.map((c) => ({ id: c.id, name: c.name, createdAt: c.createdAt, ownerSub: c.ownerSub })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;
  const url = new URL(request.url);
  const joinCode = url.searchParams.get('join');

  // 1) 招待コードで参加
  if (joinCode) {
    const safeCode = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!safeCode) return jsonResponse({ error: 'invalid_join_code' }, { status: 400 });
    const classId = await env.HIRAKU_KV.get(`classJoinCode:${safeCode}`);
    if (!classId) return jsonResponse({ error: 'class_not_found' }, { status: 404 });
    // ロースタに追加 (重複チェック)
    const rosterRaw = await env.HIRAKU_KV.get(`classRoster:${classId}`);
    let roster: ClassRoster = { members: [] };
    if (rosterRaw) { try { roster = JSON.parse(rosterRaw); } catch {} }
    if (roster.members.length >= MAX_MEMBERS_PER_CLASS) {
      return jsonResponse({ error: 'class_full' }, { status: 403 });
    }
    if (!roster.members.find((m) => m.sub === rec.sub)) {
      roster.members.push({ sub: rec.sub, name: rec.name, joinedAt: Date.now() });
      await env.HIRAKU_KV.put(`classRoster:${classId}`, JSON.stringify(roster));
    }
    // メンバー逆引き
    const memberClasses = await readArr(env, `classByMember:${rec.sub}`);
    if (!memberClasses.includes(classId)) {
      memberClasses.unshift(classId);
      await writeArr(env, `classByMember:${rec.sub}`, memberClasses.slice(0, MAX_CLASSES_PER_USER));
    }
    return jsonResponse({ ok: true, classId });
  }

  // 2) クラス作成
  let body: { name?: string };
  try { body = await request.json(); } catch { return jsonResponse({ error: 'invalid_body' }, { status: 400 }); }
  const name = (body.name || '').trim().slice(0, MAX_CLASS_NAME);
  if (!name) return jsonResponse({ error: 'missing_name' }, { status: 400 });
  const ownedIds = await readArr(env, `classByOwner:${rec.sub}`);
  if (ownedIds.length >= MAX_CLASSES_PER_USER) {
    return jsonResponse({ error: 'too_many_classes' }, { status: 403 });
  }
  const classId = genId();
  const code = genJoinCode();
  const newClass: ClassRecord = {
    id: classId,
    name,
    ownerSub: rec.sub,
    createdAt: Date.now(),
    joinCode: code,
  };
  await env.HIRAKU_KV.put(`class:${classId}`, JSON.stringify(newClass));
  await env.HIRAKU_KV.put(`classRoster:${classId}`, JSON.stringify({ members: [] }));
  await env.HIRAKU_KV.put(`classJoinCode:${code}`, classId);
  ownedIds.unshift(classId);
  await writeArr(env, `classByOwner:${rec.sub}`, ownedIds);
  return jsonResponse({ ok: true, class: { id: classId, name, joinCode: code, createdAt: newClass.createdAt } });
};
