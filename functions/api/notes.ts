/**
 * /api/notes
 *
 * 教材ごとに自由記述メモを保存する。
 *
 * GET  /api/notes?collection=...&id=...  → そのメモを返す
 * GET  /api/notes                         → 自分の全メモのインデックスを返す (一覧用)
 * PUT  /api/notes                         → body {collection, id, text} で保存
 * DELETE /api/notes?collection=...&id=... → 削除
 *
 * KV キー:
 *   note:<sub>:<collection>:<id>  → { text, updatedAt }
 *   notes-index:<sub>             → { items: [{collection, id, title, updatedAt, preview}] }
 *
 * インデックスを別途持つのは、KV の "list keys by prefix" は重いので
 * 一覧表示用に O(1) 取得できるサマリを別キーに置くため。
 */
import {
  jsonResponse,
  requireSession,
  type Env,
} from '../_lib/session';

const MAX_TEXT_LENGTH = 8000; // 1 メモあたり最大文字数
const MAX_NOTES_PER_USER = 200;

interface PutBody {
  collection?: string;
  id?: string;
  title?: string;
  text?: string;
}

interface NoteRecord {
  text: string;
  title?: string;
  updatedAt: number;
}

interface IndexItem {
  collection: string;
  id: string;
  title?: string;
  preview: string;
  updatedAt: number;
}
interface NotesIndex {
  items: IndexItem[];
}

function safeSlug(s: string | undefined | null): string | null {
  if (!s) return null;
  if (typeof s !== 'string') return null;
  if (!/^[a-z0-9][a-z0-9_-]{0,80}$/i.test(s)) return null;
  return s;
}

async function readIndex(env: Env, sub: string): Promise<NotesIndex> {
  const raw = await env.HIRAKU_KV.get(`notes-index:${sub}`);
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch {}
  return { items: [] };
}

async function writeIndex(env: Env, sub: string, idx: NotesIndex) {
  await env.HIRAKU_KV.put(`notes-index:${sub}`, JSON.stringify(idx));
}

function updateIndex(idx: NotesIndex, entry: IndexItem): NotesIndex {
  const others = idx.items.filter(
    (i) => !(i.collection === entry.collection && i.id === entry.id)
  );
  const next = [entry, ...others].slice(0, MAX_NOTES_PER_USER);
  return { items: next };
}

function removeFromIndex(idx: NotesIndex, collection: string, id: string): NotesIndex {
  return {
    items: idx.items.filter((i) => !(i.collection === collection && i.id === id)),
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;

  const url = new URL(request.url);
  const collection = safeSlug(url.searchParams.get('collection'));
  const id = safeSlug(url.searchParams.get('id'));

  if (collection && id) {
    const raw = await env.HIRAKU_KV.get(`note:${rec.sub}:${collection}:${id}`);
    if (!raw) return jsonResponse({ note: null });
    let parsed: NoteRecord | null = null;
    try { parsed = JSON.parse(raw); } catch {}
    return jsonResponse({ note: parsed });
  }

  // インデックス一覧
  const idx = await readIndex(env, rec.sub);
  return jsonResponse({ items: idx.items });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 });
  }
  const collection = safeSlug(body.collection);
  const id = safeSlug(body.id);
  if (!collection || !id) {
    return jsonResponse({ error: 'invalid_collection_or_id' }, { status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT_LENGTH) : '';
  const title = typeof body.title === 'string' ? body.title.slice(0, 200) : undefined;
  const now = Date.now();

  if (!text.trim()) {
    // 空テキストは削除扱い
    await env.HIRAKU_KV.delete(`note:${rec.sub}:${collection}:${id}`).catch(() => {});
    const idx = removeFromIndex(await readIndex(env, rec.sub), collection, id);
    await writeIndex(env, rec.sub, idx);
    return jsonResponse({ ok: true, deleted: true });
  }

  const note: NoteRecord = { text, title, updatedAt: now };
  await env.HIRAKU_KV.put(`note:${rec.sub}:${collection}:${id}`, JSON.stringify(note));

  const preview = text.replace(/\s+/g, ' ').slice(0, 80);
  const idx = updateIndex(await readIndex(env, rec.sub), {
    collection, id, title, preview, updatedAt: now,
  });
  await writeIndex(env, rec.sub, idx);

  return jsonResponse({ ok: true, updatedAt: now });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireSession(request, env);
  if (auth instanceof Response) return auth;
  const { rec } = auth;

  const url = new URL(request.url);
  const collection = safeSlug(url.searchParams.get('collection'));
  const id = safeSlug(url.searchParams.get('id'));
  if (!collection || !id) {
    return jsonResponse({ error: 'invalid_collection_or_id' }, { status: 400 });
  }
  await env.HIRAKU_KV.delete(`note:${rec.sub}:${collection}:${id}`).catch(() => {});
  const idx = removeFromIndex(await readIndex(env, rec.sub), collection, id);
  await writeIndex(env, rec.sub, idx);
  return jsonResponse({ ok: true });
};
