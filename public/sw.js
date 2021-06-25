const version = 0.8;
const staticCacheName = `site-static-v${version}`;
const dynamicCacheName = `site-dynamic-v${version}`;
const assets = [
    '/',
    '/fallback.html',
    '/favicon.ico',
    '/static/js/0.chunk.js',
    '/static/js/1.chunk.js',
    '/static/js/2.chunk.js',
    '/static/js/3.chunk.js',
    '/static/js/2.chunk.js.map',
    '/static/js/3.chunk.js.map',
    '/static/js/9.chunk.js',
    '/static/js/20.chunk.js',
    '/static/js/8.chunk.js',
    '/static/js/bundle.js',
    '/static/js/main.chunk.js',
    '/static/media/face15.736ec0d9.jpg',
    '/static/media/logo-mini.c949e51e.svg',
    '/static/media/logo.8d2895f5.svg',
    '/static/media/materialdesignicons-webfont.d0066537.woff2',
    '/manifest.json',
    '/logo192.png'
];
const controller = new AbortController();
const { signal } = controller;

//cache size limit
const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > size) {
                cache.delete(keys[0])
                    .then(limitCacheSize(name, size));
            }
        })
    })
}

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        console.log('message was posted', event);
        self.skipWaiting();
        controller.abort();
    }
});

self.addEventListener('install', evt => {
    console.log("installed");
    evt.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                console.log('caching shell assets');
                cache.addAll(assets);
            })
    );
});

self.addEventListener('activate', evt => {
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', evt => {
    evt.respondWith(
        caches.match(evt.request)
            .then(cacheRes => {
                return cacheRes || fetch(evt.request, { signal })
                    .then(fetchRes => {
                        return caches.open(dynamicCacheName).then(cache => {
                            cache.put(evt.request.url, fetchRes.clone());
                            limitCacheSize(dynamicCacheName, 40);
                            return fetchRes;
                        })
                    });
            }).catch((e) => {
            console.warn(`Failed fetch: ${e.message}`);
            console.log(e);
            if (e.name === "AbortError") {
                console.log('Fetch cancelled');
            }
            if (evt.request.url.indexOf('.html') > -1) {
                return caches.match('/fallback.html');
            }
        })
    )
})
