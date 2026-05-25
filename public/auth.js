/**
 * ひらく — クライアントサイド認証 + クラウド同期コントローラ
 *
 * 設計：
 *  - オフラインファースト：未ログインでも localStorage がそのまま動く
 *  - サインイン時：クラウドの状態を取得→ローカルとマージ→必要なら逆方向に push
 *  - 変更時：debounce で /api/sync に PUT
 *  - 認証状態変化は CustomEvent('hiraku:auth') で他コードに通知
 *
 * グローバル：
 *   window.HirakuAuth = {
 *     getUser(): {sub,name,picture,email}|null,
 *     isSignedIn(): boolean,
 *     signOut(): Promise<void>,
 *     handleGoogleCredential(idToken): Promise<void>,
 *     scheduleSync(): void,    // localStorage 変更を検出したコードから呼ぶ
 *     forceSync(): Promise<void>,
 *   }
 */
(function () {
  'use strict';

  // ─── 同期対象 localStorage キーと、サーバ側フィールド名のマッピング ───
  const SYNC_FIELDS = {
    progress: 'hiraku.progress.v1',
    bookmarks: 'hiraku.bookmarks.v1',
    words: 'hiraku.englishWords.v1',
    sceneBg: 'hiraku.sceneBg.v1',
    // 表示設定 (Header.astro が単独キーで保存している)
    prefThemeKey: 'theme',
    prefFontSizeKey: 'fontSize',
    prefRubyKey: 'ruby',
    prefContrastKey: 'contrast',
    prefWritingKey: 'writing',
  };

  const PREF_KEYS = ['theme', 'fontSize', 'ruby', 'contrast', 'writing'];

  const USER_CACHE_KEY = 'hiraku.user.v1';
  const LAST_SYNC_KEY = 'hiraku.lastSync.v1';
  // 「ローカルが最後に変更された時刻」を別キーで永続化する。
  // 以前は readLocalState() が clientUpdatedAt = Date.now() を毎回返していたため、
  // マージ時に常にローカルが勝ち、別端末からのデータが受け取れない / 別端末の
  // データを上書きする原因になっていた。
  const LOCAL_MODIFIED_KEY = 'hiraku.localModified.v1';
  // 直近にサインインしたユーザの sub。別アカウントに切り替わったら local を
  // クリアして、前ユーザのデータが新ユーザの KV に流れ込むのを防ぐ。
  const LAST_USER_SUB_KEY = 'hiraku.lastUserSub.v1';

  function readLocalModified() {
    try {
      const v = Number(localStorage.getItem(LOCAL_MODIFIED_KEY));
      return Number.isFinite(v) ? v : 0;
    } catch (_) { return 0; }
  }
  function writeLocalModified(ts) {
    try { localStorage.setItem(LOCAL_MODIFIED_KEY, String(ts)); } catch (_) {}
  }
  function markLocalModified() {
    writeLocalModified(Date.now());
  }

  function clearLocalSyncState() {
    try {
      localStorage.removeItem(SYNC_FIELDS.progress);
      localStorage.removeItem(SYNC_FIELDS.bookmarks);
      localStorage.removeItem(SYNC_FIELDS.words);
      localStorage.removeItem(SYNC_FIELDS.sceneBg);
      PREF_KEYS.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(LOCAL_MODIFIED_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    } catch (_) {}
  }

  // ─── ユーザー情報のキャッシュ (起動時にちらつき防止) ───
  function readCachedUser() {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  function writeCachedUser(user) {
    try {
      if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_CACHE_KEY);
    } catch (_) {}
  }

  let currentUser = readCachedUser();

  function dispatchAuthChange() {
    try {
      window.dispatchEvent(new CustomEvent('hiraku:auth', { detail: { user: currentUser } }));
    } catch (_) {}
  }

  // ─── ローカル状態の読み出し → サーバへ送る形に整形 ───
  function readLocalState() {
    function tryParse(key) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }
    const progress = tryParse(SYNC_FIELDS.progress) || {};
    const bookmarks = tryParse(SYNC_FIELDS.bookmarks) || {};
    const words = tryParse(SYNC_FIELDS.words) || [];

    const prefs = {};
    PREF_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v != null) prefs[k] = v;
    });
    const sceneBg = localStorage.getItem(SYNC_FIELDS.sceneBg);
    if (sceneBg != null) prefs.sceneBg = sceneBg;

    // ローカルが最後に「ユーザー操作で」変更された時刻。
    // 初回ログイン時など lastModified が未設定 でも、実データがあれば
    // 「now」とみなして bootstrap し、空のリモート (or 別端末の古い状態) に
    // 上書きされてオフラインで貯めた学習データが消えるのを防ぐ。
    let clientUpdatedAt = readLocalModified();
    if (!clientUpdatedAt) {
      const hasData =
        (progress && progress.reads && Object.keys(progress.reads).length > 0) ||
        (bookmarks && bookmarks.lessons && Object.keys(bookmarks.lessons).length > 0) ||
        (Array.isArray(words) && words.length > 0);
      if (hasData) {
        clientUpdatedAt = Date.now();
        writeLocalModified(clientUpdatedAt);
      }
    }

    return {
      progress,
      bookmarks,
      words,
      prefs,
      clientUpdatedAt,
    };
  }

  // ─── サーバから降ってきた状態を localStorage に書き戻す ───
  function applyRemoteState(state) {
    if (!state || typeof state !== 'object') return;
    try {
      if (state.progress) localStorage.setItem(SYNC_FIELDS.progress, JSON.stringify(state.progress));
      if (state.bookmarks) localStorage.setItem(SYNC_FIELDS.bookmarks, JSON.stringify(state.bookmarks));
      if (Array.isArray(state.words)) localStorage.setItem(SYNC_FIELDS.words, JSON.stringify(state.words));
      const prefs = state.prefs || {};
      PREF_KEYS.forEach((k) => {
        if (prefs[k] != null) localStorage.setItem(k, String(prefs[k]));
      });
      if (prefs.sceneBg != null) localStorage.setItem(SYNC_FIELDS.sceneBg, String(prefs.sceneBg));
    } catch (_) {
      // quota 等は静かに無視
    }
  }

  // ─── ローカルとサーバの新しい方を採用するマージ ───
  function mergeStates(local, remote) {
    if (!remote) return local;
    const localTs = Number(local.clientUpdatedAt || 0);
    const remoteTs = Number(remote.clientUpdatedAt || remote.serverUpdatedAt || 0);
    if (remoteTs > localTs) return remote;
    return local;
  }

  // ─── API 呼び出しラッパ ───
  async function apiGet(path) {
    const resp = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return resp.json();
  }
  async function apiPost(path, body) {
    const resp = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      let err = { error: 'HTTP ' + resp.status };
      try { err = await resp.json(); } catch (_) {}
      throw new Error(err.error || 'HTTP ' + resp.status);
    }
    return resp.json();
  }
  async function apiPut(path, body) {
    const resp = await fetch(path, {
      method: 'PUT',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return resp.json();
  }
  async function apiDelete(path) {
    const resp = await fetch(path, {
      method: 'DELETE',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return resp.json();
  }

  // ─── 同期：pull → merge → push (サインイン直後 / 明示的呼び出し) ───
  async function forceSync() {
    if (!currentUser) return;
    try {
      const got = await apiGet('/api/sync');
      const localState = readLocalState();
      const remote = got.state;
      const merged = mergeStates(localState, remote);
      if (merged === remote && remote) {
        // リモートが新しかったので localStorage を上書き
        applyRemoteState(remote);
      } else {
        // ローカル優先で push
        const r = await apiPut('/api/sync', localState);
        try { localStorage.setItem(LAST_SYNC_KEY, String(r.serverUpdatedAt || Date.now())); } catch (_) {}
      }
      try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: true } })); } catch (_) {}
    } catch (e) {
      // 失敗してもローカル動作は維持
      try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: false, error: String(e) } })); } catch (_) {}
    }
  }

  // ─── 同期：localStorage 変更時の debounced push ───
  let scheduleTimer = null;
  let pendingPush = false;  // オフラインで貯まった変更を online 復帰時に push するためのフラグ
  // markModified:
  //   true  (default) — ユーザー操作起点の変更。lastModified を Date.now() に更新する
  //   false           — 別タブの storage event 起点。タイムスタンプは触らない
  //                     (リモート由来の変更が "新しいローカル変更" と誤認されるのを防ぐ)
  function scheduleSync(opts) {
    if (opts !== false && (!opts || opts.markModified !== false)) {
      markLocalModified();
    }
    if (!currentUser) return;
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(doPush, 2500);
  }

  async function doPush() {
    scheduleTimer = null;
    if (!currentUser) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // オフラインなので保留。online 復帰時に再試行する
      pendingPush = true;
      try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: false, offline: true } })); } catch (_) {}
      return;
    }
    try {
      const state = readLocalState();
      const r = await apiPut('/api/sync', state);
      pendingPush = false;
      try { localStorage.setItem(LAST_SYNC_KEY, String(r.serverUpdatedAt || Date.now())); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: true } })); } catch (_) {}
    } catch (e) {
      // ネットワークエラー以外も含むが、いずれにせよ次回 (online 復帰 or 次の変更) で再試行
      pendingPush = true;
      try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: false, error: String(e) } })); } catch (_) {}
    }
  }

  // ─── 認証API ───
  async function handleGoogleCredential(credential) {
    const r = await apiPost('/api/auth/google', { credential });
    const newUser = r.user || null;
    // 別アカウントに切り替わった場合、ローカル同期データをクリアしてから
    // クラウドから取り直す。前ユーザの未同期データが新ユーザの KV に
    // 流れ込むのを防ぐため。
    const prevSub = (() => {
      try { return localStorage.getItem(LAST_USER_SUB_KEY); } catch (_) { return null; }
    })();
    if (newUser && prevSub && prevSub !== newUser.sub) {
      clearLocalSyncState();
    }
    try {
      if (newUser) localStorage.setItem(LAST_USER_SUB_KEY, newUser.sub);
    } catch (_) {}
    currentUser = newUser;
    writeCachedUser(currentUser);
    dispatchAuthChange();
    await forceSync();
  }

  async function signOut() {
    try { await apiPost('/api/auth/logout', {}); } catch (_) {}
    currentUser = null;
    writeCachedUser(null);
    dispatchAuthChange();
  }

  // クラウド上の自分のデータを KV から削除する。ローカルは残す。
  // (削除後すぐに scheduleSync が走るとローカルから再 push されてしまうので、
  //  保留中のタイマーをキャンセルし、lastModified もクリアして、次の操作までは
  //  サーバが空のままになるようにする)
  async function deleteCloudData() {
    if (!currentUser) throw new Error('not_signed_in');
    if (scheduleTimer) { clearTimeout(scheduleTimer); scheduleTimer = null; }
    await apiDelete('/api/sync');
    try {
      localStorage.removeItem(LOCAL_MODIFIED_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: true, deleted: true } })); } catch (_) {}
  }

  async function refreshUser() {
    try {
      const r = await apiGet('/api/auth/me');
      currentUser = r.user || null;
      writeCachedUser(currentUser);
      dispatchAuthChange();
      if (currentUser) {
        // タブ切替で復帰した場合などにサーバの最新と合わせる
        const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
        if (Date.now() - lastSync > 60 * 1000) await forceSync();
      }
    } catch (_) {
      // ネットワーク不通でも localStorage で動く
    }
  }

  // ─── window.HirakuAuth 公開 ───
  window.HirakuAuth = {
    getUser: () => currentUser,
    isSignedIn: () => !!currentUser,
    signOut,
    handleGoogleCredential,
    scheduleSync,
    forceSync,
    refreshUser,
    deleteCloudData,
    // 内部実装を露出 (デバッグ用)
    _readLocalState: readLocalState,
  };

  // 各タブの localStorage 変更を捕捉して自動同期
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    // 同期対象キーが変化したらサーバへ反映。
    // ただし lastModified は他タブ起点なのでここでは触らない (既に他タブが
    // markLocalModified 済み or リモート由来の applyRemoteState 済み)。
    if (
      e.key === SYNC_FIELDS.progress ||
      e.key === SYNC_FIELDS.bookmarks ||
      e.key === SYNC_FIELDS.words ||
      e.key === SYNC_FIELDS.sceneBg ||
      PREF_KEYS.indexOf(e.key) >= 0
    ) {
      scheduleSync({ markModified: false });
    }
  });

  // タブ復帰時にユーザー情報を refresh
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshUser();
  });

  // オンライン復帰時：保留中の push があれば実行
  window.addEventListener('online', () => {
    if (currentUser && pendingPush) doPush();
  });
  window.addEventListener('offline', () => {
    try { window.dispatchEvent(new CustomEvent('hiraku:sync', { detail: { ok: false, offline: true } })); } catch (_) {}
  });

  // 初期化：me を聞いて状態を整える
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    refreshUser();
  } else {
    window.addEventListener('DOMContentLoaded', refreshUser, { once: true });
  }
})();
