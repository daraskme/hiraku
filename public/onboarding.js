/**
 * ひらく — 初回訪問者向けのオンボーディングバナー
 *
 * 初訪問時のみ画面下部に表示される、3 ステップの簡易ツアー。
 * 1. ライブラリで教材を見つけよう
 * 2. 学習パスで順序立てて読もう
 * 3. ログインで複数端末同期 (任意)
 *
 * 「閉じる」「もう表示しない」両方に対応。localStorage に保存。
 */
(function () {
  'use strict';
  const KEY = 'hiraku.onboarding.v1';

  function loadState() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }
  function saveState(v) {
    try { localStorage.setItem(KEY, v); } catch (_) {}
  }

  const state = loadState();
  if (state === 'dismissed' || state === 'completed') return;
  // ホームページ ('/') 以外では表示しない (邪魔にならないように)
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;

  const steps = [
    {
      title: 'ようこそ「ひらく」へ',
      text: '著作権切れの日本語教科書素材を、現代の学習指導要領に沿って 75 教材以上収載しています。',
      cta: { href: '/library', label: 'ライブラリを見る' },
    },
    {
      title: '学習パスで順序立てて',
      text: '「古典文学 四大柱」「古事記神話の旅」など、テーマ別の推奨ルートをご用意。',
      cta: { href: '/paths', label: '学習パスを見る' },
    },
    {
      title: 'ログインで複数端末同期 (任意)',
      text: 'Google でログインすると、進捗・ブックマーク・メモが端末を超えて同期されます。',
      cta: { href: '/about', label: 'もっと詳しく' },
    },
  ];
  let current = 0;

  let banner;
  function ensure() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'onboarding-banner no-print';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'はじめての方へ');
    document.body.appendChild(banner);
    render();
    requestAnimationFrame(() => banner.classList.add('is-visible'));
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render() {
    if (!banner) return;
    const s = steps[current];
    const dots = steps.map((_, i) => `<span class="onboarding-banner__dot ${i === current ? 'is-active' : ''}"></span>`).join('');
    const nextLabel = current === steps.length - 1 ? '閉じる' : '次へ →';
    banner.innerHTML = `
      <div class="onboarding-banner__body">
        <div class="onboarding-banner__step">${current + 1} / ${steps.length}</div>
        <h3 class="onboarding-banner__title">${escapeHtml(s.title)}</h3>
        <p class="onboarding-banner__text">${escapeHtml(s.text)}</p>
        <div class="onboarding-banner__actions">
          <a class="onboarding-banner__cta" href="${escapeHtml(s.cta.href)}">${escapeHtml(s.cta.label)}</a>
          <button type="button" class="onboarding-banner__next" data-onboard-next>${nextLabel}</button>
        </div>
        <div class="onboarding-banner__dots" aria-hidden="true">${dots}</div>
      </div>
      <button type="button" class="onboarding-banner__close" data-onboard-close aria-label="閉じる">×</button>
    `;
    banner.querySelector('[data-onboard-next]').addEventListener('click', next);
    banner.querySelector('[data-onboard-close]').addEventListener('click', dismiss);
  }
  function next() {
    if (current < steps.length - 1) {
      current++;
      render();
    } else {
      saveState('completed');
      hide();
    }
  }
  function dismiss() {
    saveState('dismissed');
    hide();
  }
  function hide() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    setTimeout(() => banner && banner.remove(), 300);
  }

  // ホームページ読み込み後 2 秒待ってから表示
  if (document.readyState === 'complete') {
    setTimeout(ensure, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(ensure, 2000), { once: true });
  }
})();
