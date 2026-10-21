/* 轻记 FitLog Service Worker — 离线缓存（network-first：保证更新立即可见） */
var CACHE = 'fitlog-v3';
var ASSETS = ['./轻记FitLog.html', './manifest.json', './icon.svg', './sw.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (resp) {
      // 网络优先：拿到新内容就更新缓存，保证版本更新立即生效
      try {
        var clone = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      } catch (err) {}
      return resp;
    }).catch(function () {
      // 离线回退到缓存
      return caches.match(e.request).then(function (r) {
        return r || caches.match('./轻记FitLog.html');
      });
    })
  );
});
