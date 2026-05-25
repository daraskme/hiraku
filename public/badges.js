/**
 * ひらく — バッジ取得・通知の共通モジュール (クライアントサイド)
 *
 * バッジは「教材ごとに取得」する。データ構造:
 *   hiraku.badges.v1 = {
 *     [collection + '/' + id]: {
 *       collection, id, title,
 *       types: ['reader-done', 'quiz-clear', ...],
 *       earnedAt: <timestamp>,
 *       lastEarnedType: string
 *     }
 *   }
 *
 * window.HirakuBadges を露出。テスト時のため getAll() / reset() も提供。
 */
(function () {
  'use strict';
  const STORAGE_KEY = 'hiraku.badges.v1';

  const BADGE_LABELS = {
    'reader-done': '読了',
    'quiz-clear': 'クイズ全問正解',
    'quiz-tried': 'クイズ挑戦',
    'flashcards-mastered': '単語完全制覇',
    'starred': 'お気に入り',
    'notes-written': 'メモを書いた',
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
    if (window.HirakuAuth && window.HirakuAuth.scheduleSync) window.HirakuAuth.scheduleSync();
  }

  /** バッジ付与。既に同種を持っているなら何もしない (false を返す) */
  function award(collection, id, type, title) {
    if (!collection || !id || !type) return false;
    if (!BADGE_LABELS[type]) return false;
    const data = load();
    const key = collection + '/' + id;
    const entry = data[key] || { collection, id, title: title || id, types: [] };
    if (entry.types && entry.types.indexOf(type) >= 0) return false;
    entry.types = (entry.types || []).concat([type]);
    entry.lastEarnedType = type;
    entry.earnedAt = Date.now();
    if (title) entry.title = title;
    data[key] = entry;
    save(data);
    showToast(type, title || id);
    return true;
  }

  function has(collection, id, type) {
    const data = load();
    const key = collection + '/' + id;
    return !!(data[key] && data[key].types && data[key].types.indexOf(type) >= 0);
  }

  /** トースト通知 (右下) */
  let toastTimer = null;
  function showToast(type, title) {
    const label = BADGE_LABELS[type] || type;
    let toast = document.querySelector('[data-badge-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'badge-toast';
      toast.setAttribute('data-badge-toast', '');
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.innerHTML =
      '<span class="badge-toast__icon" aria-hidden="true">✦</span>' +
      '<div class="badge-toast__body">' +
        '<div class="badge-toast__label">バッジを獲得</div>' +
        '<div class="badge-toast__name">' + escapeHtml(label) + '</div>' +
        '<div class="badge-toast__lesson">' + escapeHtml(title) + '</div>' +
      '</div>';
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 4000);
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.HirakuBadges = {
    award,
    has,
    getAll: load,
    LABELS: BADGE_LABELS,
    reset() { try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} },
  };
})();
