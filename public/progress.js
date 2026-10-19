/**
 * ひらく — 学習進捗トラッカー（クライアントサイド・localStorage 専用）
 *
 * 仕組み：
 *  - 教材ページを開くたびに、URL から collection/slug を抽出して localStorage に記録
 *  - 滞在時間は visibilitychange と beforeunload で記録
 *  - すべてブラウザ内のみ。サーバへは送信しない
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'hiraku.progress.v1';
  const TODAY = new Date().toISOString().slice(0, 10);

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* quota exceeded; ignore */
    }
  }

  function ensure(data) {
    if (!data.reads) data.reads = {};
    if (!data.activity) data.activity = {};
    return data;
  }

  /** Detect a lesson page from the URL */
  function parseLessonUrl() {
    const m = location.pathname.match(/^\/library\/([^/]+)\/([^/]+)\/?$/);
    if (!m) return null;
    return { collection: m[1], slug: m[2], key: `${m[1]}:${m[2]}` };
  }

  /** Record a visit when a lesson page opens */
  function recordVisit() {
    const lesson = parseLessonUrl();
    if (!lesson) return;

    const data = ensure(load());
    const now = new Date().toISOString();
    const prev = data.reads[lesson.key] || { readCount: 0, firstRead: now };
    data.reads[lesson.key] = {
      ...prev,
      lastRead: now,
      readCount: (prev.readCount || 0) + 1,
      title: document.title.split(' | ')[0],
    };

    if (!data.activity[TODAY]) data.activity[TODAY] = { lessonsRead: 0, secondsActive: 0 };
    if (prev.readCount === 0) {
      data.activity[TODAY].lessonsRead += 1;
    }

    save(data);
    return { data, lesson };
  }

  /** Track active reading time */
  let startedAt = Date.now();
  let timeAccum = 0;
  let isVisible = !document.hidden;

  function flushTime() {
    if (isVisible) timeAccum += Math.max(0, Date.now() - startedAt);
    startedAt = Date.now();
    if (timeAccum < 1000) return; // ignore <1s slivers
    const data = ensure(load());
    if (!data.activity[TODAY]) data.activity[TODAY] = { lessonsRead: 0, secondsActive: 0 };
    data.activity[TODAY].secondsActive += Math.round(timeAccum / 1000);
    save(data);
    timeAccum = 0;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      flushTime();
      isVisible = false;
    } else {
      startedAt = Date.now();
      isVisible = true;
    }
  });

  window.addEventListener('pagehide', flushTime);
  window.addEventListener('beforeunload', flushTime);

  /** Public API for /progress and other pages */
  window.HirakuProgress = {
    load,
    save,
    ensure,
    /** Aggregated summary */
    summary() {
      const data = ensure(load());
      const reads = data.reads || {};
      const activity = data.activity || {};
      const today = TODAY;

      // Total lessons read at least once
      const totalRead = Object.keys(reads).length;

      // Sort recent activity dates
      const sortedDays = Object.keys(activity).sort();

      // Streak (consecutive days ending today)
      let streak = 0;
      let d = new Date(today);
      while (true) {
        const k = d.toISOString().slice(0, 10);
        if (activity[k] && (activity[k].lessonsRead > 0 || activity[k].secondsActive >= 60)) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }

      // This week (last 7 days incl today)
      let weekSeconds = 0;
      for (let i = 0; i < 7; i++) {
        const k = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (activity[k]) weekSeconds += activity[k].secondsActive || 0;
      }

      // Subject breakdown
      const bySubject = {};
      Object.entries(reads).forEach(([key, info]) => {
        const collection = key.split(':')[0];
        if (!bySubject[collection]) bySubject[collection] = 0;
        bySubject[collection]++;
      });

      // Recent (last 5)
      const recent = Object.entries(reads)
        .map(([key, info]) => ({ key, ...info }))
        .sort((a, b) => (a.lastRead < b.lastRead ? 1 : -1))
        .slice(0, 5);

      return {
        totalRead,
        streak,
        weekSeconds,
        weekMinutes: Math.round(weekSeconds / 60),
        bySubject,
        recent,
        activity,
      };
    },
    /** Clear all data (for the user's settings page) */
    reset() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },
  };

  // Record visit on this page
  recordVisit();
})();
