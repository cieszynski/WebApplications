
self.addEventListener("fetch", (event) => {
    console.log('fetch', event);
    event.respondWith(
        (async () => {
            const url = new URL(event.request.url);

            switch(url.pathname) {
                case '/data':
                    return new Response('peng')
            }
            console.log('url', url);
            // Try to get the response from a cache.
            const cachedResponse = await caches.match(event.request);
            // Return it if we found one.
            if (cachedResponse) return cachedResponse;
            // If we didn't find a match in the cache, use the network.
            return fetch(event.request);
        })(),
    );
});

self.addEventListener('install', (event) => {
    console.log('install', event)
});

self.addEventListener('activate', (event) => {
    console.log('activate', event)
    // When a service worker is initially registered,
    // pages won't use it until they next load.
    // The claim() method causes those pages to be
    //  controlled immediately:
    return self.clients.claim();
});

self.addEventListener('message', (event) => {
    event.source.postMessage("bla")
})