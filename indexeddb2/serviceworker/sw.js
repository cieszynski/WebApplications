

self.addEventListener("fetch", (event) => {
    console.debug('fetch2', event);

});

self.addEventListener('install', (event) => {
    console.log('install')
});

self.addEventListener('activate', (event) => {
    console.log('activate');
    // When a service worker is initially registered,
    // pages won't use it until they next load.
    // The claim() method causes those pages to be
    // controlled immediately:
    return self.clients.claim();
});

//mportScripts('sw.ddb.js')