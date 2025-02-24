self.addEventListener('install', (event) => {
    console.log('install');
});

self.addEventListener('activate', (event) => {
    console.log('activate');
});

self.addEventListener('fetch', (event) => {
    console.log('fetch ' + event.request);
});