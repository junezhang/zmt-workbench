/* 离线缓存：静态资源缓存优先，每日数据网络优先且失败回退缓存 */
const V = 'zmt-wb-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/store.js',
  './assets/js/writer.js',
  './assets/js/views.js',
  './assets/js/app.js',
  './data/daily.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 每日数据：先联网拿最新，拿不到就用上一次缓存，保证不空白
  if (url.pathname.indexOf('/data/daily.js') >= 0) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put('./data/daily.js', copy));
        return res;
      }).catch(() => caches.match('./data/daily.js'))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) {
        fetch(req).then(res => { if (res && res.ok) caches.open(V).then(c => c.put(req, res)); }).catch(() => { });
        return hit;
      }
      return fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
