import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { onRequest } from '../functions/api/_middleware.ts';

const script = await fs.readFile(new URL('../public/local-data.js', import.meta.url), 'utf8');
function browser(store = new Map(), writable = true) {
  const window = { dispatchEvent() {} };
  const localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem(key, value) { if (!writable) throw new Error('Storage unavailable'); store.set(key, value); },
    removeItem: key => store.delete(key),
  };
  vm.runInNewContext(script, { window, localStorage, CustomEvent: class {} });
  return window.HirakuLocal;
}

test('notes persist across page loads and stay separate for each lesson', () => {
  const store = new Map();
  const first = browser(store);
  first.saveNote({ collection: 'kokugo1', id: 'lesson', title: '教材1', text: '端末内のメモ' });
  first.saveNote({ collection: 'kokugo2', id: 'lesson', title: '教材2', text: '別の教材' });
  const second = browser(store);
  assert.equal(second.getNote('kokugo1', 'lesson').text, '端末内のメモ');
  assert.equal(second.getNote('kokugo2', 'lesson').text, '別の教材');
  assert.equal(second.listNotes().length, 2);
  second.saveNote({ collection: 'kokugo1', id: 'lesson', text: '' });
  assert.equal(second.getNote('kokugo1', 'lesson'), null);
  assert.equal(second.listNotes().length, 1);
});

test('export keeps learning data and excludes previously cached account details', () => {
  const store = new Map([
    ['hiraku.progress.v1', '{"reads":{}}'], ['theme', 'dark'],
    ['hiraku.user.v1', '{"email":"private@example.com"}'], ['hiraku.lastUserSub.v1', 'old-user'],
  ]);
  const data = browser(store).exportData().data;
  assert.equal(data['hiraku.progress.v1'], '{"reads":{}}');
  assert.equal(data.theme, 'dark');
  assert.equal(data['hiraku.user.v1'], undefined);
  assert.equal(data['hiraku.lastUserSub.v1'], undefined);
});

test('a failed storage write is reported and overlong notes are rejected', () => {
  assert.throws(() => browser(new Map(), false).saveNote({ collection: 'a', id: 'b', text: 'メモ' }));
  assert.throws(() => browser().saveNote({ collection: 'a', id: 'b', text: 'x'.repeat(8001) }));
});

test('a backup transfers notes to the new domain without restoring account details', () => {
  const oldDomain = browser();
  oldDomain.saveNote({ collection: 'kokugo1', id: 'lesson', text: 'ドメイン移行前の記録' });
  const payload = JSON.parse(JSON.stringify(oldDomain.exportData()));
  payload.data['hiraku.user.v1'] = '{"email":"old@example.com"}';
  const newStore = new Map();
  const newDomain = browser(newStore);
  newDomain.importData(payload);
  assert.equal(newDomain.getNote('kokugo1', 'lesson').text, 'ドメイン移行前の記録');
  assert.equal(newStore.has('hiraku.user.v1'), false);
  assert.throws(() => newDomain.importData({ version: 1, data: { 'theme': {} } }));
});

test('retired account APIs never access previous account data', async () => {
  for (const path of ['/api/auth/google', '/api/auth/me', '/api/sync', '/api/notes', '/api/classes/old', '/api/admin/stats']) {
    const response = await onRequest({ request: new Request('https://hiraku.darask.me' + path, { method: 'POST' }), next() { throw new Error('Account handler must not run'); } });
    assert.equal(response.status, 410);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  }
  const response = await onRequest({ request: new Request('https://hiraku.darask.me/api/cover'), next: () => new Response('cover') });
  assert.equal(await response.text(), 'cover');
});
