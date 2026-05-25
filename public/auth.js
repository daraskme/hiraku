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
    const prefs = {};
    PREF_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v != null) prefs[k] = v;
    });
    const sceneBg = localStorage.getItem(SYNC_FIELDS.sceneBg);
    if (sceneBg != null) prefs.sceneBg = sceneBg;

    return {
      progress: tryParse(SYNC_FIELDS.progress) || {},
      bookmarks: tryParse(SYNC_FIELDS.bookmarks) || {},
      words: tryParse(SYNC_FIELDS.words) || [],
      prefs,
      clientUpdatedAt: Date.now(),
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
  function scheduleSync() {
    if (!currentUser) return;
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(async () => {
      scheduleTimer = null;
      try {
        const state = readLocalState();
        const r = await apiPut('/api/sync', state);
        try { localStorage.setItem(LAST_SYNC_KEY, String(r.serverUpdatedAt || Date.now())); } catch (_) {}
      } catch (_) {
        // 失敗時は次回試行に任せる
      }
    }, 2500);
  }

  // ─── 認証API ───
  async function handleGoogleCredential(credential) {
    const r = await apiPost('/api/auth/google', { credential });
    currentUser = r.user || null;
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
    // 内部実装を露出 (デバッグ用)
    _readLocalState: readLocalState,
  };

  // 各タブの localStorage 変更を捕捉して自動同期
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    // 同期対象キーが変化したらサーバへ反映
    if (
      e.key === SYNC_FIELDS.progress ||
      e.key === SYNC_FIELDS.bookmarks ||
      e.key === SYNC_FIELDS.words ||
      e.key === SYNC_FIELDS.sceneBg ||
      PREF_KEYS.indexOf(e.key) >= 0
    ) {
      scheduleSync();
    }
  });

  // タブ復帰時にユーザー情報を refresh
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshUser();
  });

  // 初期化：me を聞いて状態を整える
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    refreshUser();
  } else {
    window.addEventListener('DOMContentLoaded', refreshUser, { once: true });
  }
})();
