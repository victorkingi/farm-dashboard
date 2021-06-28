const version = 0.2;
const staticCacheName = `site-static-v${version}`;
const dynamicCacheName = `site-dynamic-v${version}`;
const assets = [
    '/',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png',
    '/manifest.json',
    '/static/js/0.chunk.js',
    '/static/js/0.chunk.js.map',
    '/static/js/1.chunk.js',
    '/static/js/2.chunk.js',
    '/static/js/3.chunk.js',
    '/static/js/3.chunk.js.map',
    '/static/js/bundle.js',
    '/static/js/20.chunk.js',
    '/static/js/22.chunk.js',
    '/static/js/9.chunk.js',
    '/static/js/main.chunk.js',
    '/static/media/logo192.c8c51ffe.png',
    '/static/media/logo256.bb446e78.png',
    '/static/media/materialdesignicons-webfont.d0066537.woff2',
    '/s/rubik/v12/iJWKBXyIfDnIV7nBrXw.woff2',
    '/css?family=Rubik:300,400,500,700&display=swap'
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
        controller.abort();
        self.skipWaiting();
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
                return cacheRes || fetch(evt.request)
                    .then(fetchRes => {
                        return caches.open(dynamicCacheName).then(cache => {
                            cache.put(evt.request.url, fetchRes.clone());
                            limitCacheSize(dynamicCacheName, 30);
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
