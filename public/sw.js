/**
 * ひらく Service Worker
 *
 * 戦略:
 * - HTML（ナビゲーション）: network-first → 失敗時にキャッシュ → それも無ければオフラインページ
 * - 静的アセット（CSS / JS / フォント / 画像）: cache-first（バージョン付きキャッシュ）
 * - Pagefind 索引: stale-while-revalidate
 *
 * バージョン番号を上げるとキャッシュが切り替わる。
 */
const VERSION = 'v1.2026-05-25';
const APP_CACHE = `hiraku-app-${VERSION}`;
const PAGE_CACHE = `hiraku-pages-${VERSION}`;
const ASSET_CACHE = `hiraku-assets-${VERSION}`;

// インストール時に事前キャッシュする最低限のシェル
const APP_SHELL = ['/', '/library', '/offline', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 旧バージョンのキャッシュを掃除
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('hiraku-') && ![APP_CACHE, PAGE_CACHE, ASSET_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

const isAssetPath = (url) =>
  /\.(?:css|js|mjs|ttf|woff2?|otf|png|jpe?g|gif|webp|svg|ico|wasm)$/i.test(url.pathname);

const isPagefindPath = (url) => url.pathname.startsWith('/pagefind/');

const isNavigationRequest = (req) =>
  req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('Accept')?.includes('text/html'));

async function networkFirstHTML(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(PAGE_CACHE).then((cache) => cache.put(req, copy));
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const offline = await caches.match('/offline');
    if (offline) return offline;
    return new Response('オフラインです', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirstAsset(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok && req.method === 'GET') {
      const copy = res.clone();
      caches.open(ASSET_CACHE).then((cache) => cache.put(req, copy));
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(req);
  const fetching = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetching;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 同一オリジンのみ対象。CDN フォントなどは素通り。
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(req)) {
    event.respondWith(networkFirstHTML(req));
    return;
  }
  if (isPagefindPath(url)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (isAssetPath(url)) {
    event.respondWith(cacheFirstAsset(req));
    return;
  }
});

// クライアントから明示的な再評価要求があれば応える
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
