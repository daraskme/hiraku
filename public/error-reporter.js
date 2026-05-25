/**
 * ひらく — クライアント側のエラー収集 (簡易版)
 *
 * window.onerror と unhandledrejection を捕捉して、/api/error に送る。
 * 自身でループしないように、送信失敗は静かに無視。
 */
(function () {
  'use strict';
  let lastSentAt = 0;
  let sentCount = 0;
  const MAX_PER_SESSION = 5;
  const MIN_INTERVAL_MS = 2000; // 同じ刹那の連発を抑える

  function report(payload) {
    const now = Date.now();
    if (sentCount >= MAX_PER_SESSION) return;
    if (now - lastSentAt < MIN_INTERVAL_MS) return;
    lastSentAt = now;
    sentCount++;
    try {
      const body = JSON.stringify({
        message: String(payload.message || '').slice(0, 500),
        source: String(payload.source || '').slice(0, 200),
        lineno: payload.lineno,
        colno: payload.colno,
        stack: String(payload.stack || '').slice(0, 1500),
        url: location.href.slice(0, 400),
        ua: navigator.userAgent.slice(0, 300),
        ts: now,
      });
      // sendBeacon を優先 (unload 時にも届く)
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon('/api/error', new Blob([body], { type: 'application/json' }));
        if (ok) return;
      }
      fetch('/api/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  window.addEventListener('error', (e) => {
    if (!e) return;
    // CORS や 3rd-party スクリプトのエラーは詳細が取れないので捨てる
    if (!e.message || e.message === 'Script error.') return;
    report({
      message: e.message,
      source: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error && e.error.stack,
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (!e) return;
    const r = e.reason;
    const msg = r && r.message ? r.message : String(r || 'unhandledrejection');
    report({
      message: 'unhandled rejection: ' + msg,
      stack: r && r.stack,
    });
  });
})();
