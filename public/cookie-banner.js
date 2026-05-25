/**
 * ひらく — Cookie 同意バナー
 *
 * 本サイトが利用する Cookie は実質的に必須 Cookie のみ (セッション認証用 hsess) で、
 * 広告・分析トラッキング Cookie は使用していない。それでも改正電通法 (2023) や
 * 海外利用者の GDPR 等への配慮として、初回訪問時にバナーを表示し、
 * ユーザーが認識できるようにする。
 *
 * 同意状態は localStorage に保存し、次回以降は表示しない。
 */
(function () {
  'use strict';
  const KEY = 'hiraku.cookieConsent.v1';

  function load() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (_) {}
  }

  const decision = load();
  // すでに 'acknowledged' なら何もしない
  if (decision === 'acknowledged') return;

  // 印刷時・小さなフッターを邪魔しないため、少し遅延させて挿入
  function ensure() {
    if (document.querySelector('[data-cookie-banner]')) return;
    const banner = document.createElement('div');
    banner.setAttribute('data-cookie-banner', '');
    banner.className = 'cookie-banner no-print';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie 利用について');
    banner.innerHTML =
      '<div class="cookie-banner__body">' +
        '<p class="cookie-banner__text">' +
          '本サイトはログイン中のみセッション識別用の必須 Cookie を利用します。' +
          '広告・分析の Cookie や第三者トラッキングは使用していません。詳細は ' +
          '<a href="/privacy">プライバシーポリシー</a>。' +
        '</p>' +
        '<button type="button" class="cookie-banner__ok" data-cookie-ok>了解しました</button>' +
      '</div>';
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('is-visible'));
    banner.querySelector('[data-cookie-ok]').addEventListener('click', () => {
      save('acknowledged');
      banner.classList.remove('is-visible');
      setTimeout(() => banner.remove(), 300);
    });
  }
  // ホームページなど main content の読み込みを妨げないよう、500ms 遅延
  if (document.readyState === 'complete') setTimeout(ensure, 500);
  else window.addEventListener('load', () => setTimeout(ensure, 500), { once: true });
})();
