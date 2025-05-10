
self.addEventListener('load', (event) => {
    console.debug('load', location);

    navigator.serviceWorker
        .register("sw.ddb.js")
        .catch(console.error);
})

class JSONResponse extends Response {

    constructor(obj, opts = {}) {
        super(JSON.stringify(obj), opts);
    }
}

class JSONStatusResponse extends JSONResponse {
    constructor(obj) {
        super(obj, obj);
    }
}

const databases = async () => (await indexedDB.databases())
    .reduce((obj, db) => {
        obj[db.name] = db.version;
        return obj;
    }, {});

const handle_database_requests = (dbname, http) => new Promise(async (resolve, reject) => {

    switch (http.request.method) {
        case 'GET':
            databases()
                .then(list => {
                    if (list[dbname]) {
                        indexedDB.open(dbname).onsuccess = (event) => {
                            resolve(new JSONResponse({
                                stores: Array.from(event.target.result.objectStoreNames),
                                version: event.target.result.version,
                                name: event.target.result.name
                            }));
                            event.target.result.close();
                        }
                    } else resolve(new JSONStatusResponse({
                        status: 404,
                    }));
                });
            break;

        case 'POST':
            const body = await http.request.json();
            const list = await databases();

            if ((version = list[dbname])) { // dbname exists

                if ((body?.version ?? version) <= version) { // version is up to date
                    resolve(new JSONStatusResponse({
                        status: 200,
                    }));
                    return;
                }
            }

            // new db OR newer version available
            indexedDB.open(dbname, body?.version ?? 1).onupgradeneeded = (event) => {
                const db = event.target.result;

                Object.entries(body?.stores ?? {}).forEach(([storename, definition]) => {
                    if (Array.from(db.objectStoreNames).includes(storename)) {
                        // TODO save data
                        db.deleteObjectStore(storename);
                    }

                    [keypath, ...indexes] = definition.split(/\s*(?:,)\s*/);

                    const store = db.createObjectStore(
                        storename, {
                        keyPath: keypath.replace(/[\+@]/, ''),
                        autoIncrement: /^[\+@]/.test(keypath)
                    });

                    indexes.forEach(indexName => {

                        store.createIndex(
                            indexName.replace(/[\*!]/, ''),
                            indexName
                                .split(/\+/)
                                // at this point every keypath is an array
                                .map(elem => elem.replace(/[\*!]/, ''))
                                .reduce((prev, cur, idx) => {
                                    switch (idx) {
                                        case 0:
                                            // indexName is keyPath:
                                            return cur;
                                        case 1:
                                            // indexName is compound key
                                            return [prev, cur];
                                        default:
                                            return [...prev, cur];
                                    }
                                }),
                            {
                                multiEntry: /^\*/.test(indexName),
                                unique: /^\!/.test(indexName)
                            });
                    })
                });

                resolve(new JSONStatusResponse({
                    status: 201,
                }));
            }

        case 'DELETE':
            break;

        default:
            resolve(new JSONStatusResponse({
                status: 405,
            }))
    }
});

const handle_ddb_requests = async (http) => {

    switch (http.request.method) {
        case 'GET':
            return new JSONResponse(await databases());
        default:
            return new JSONStatusResponse({
                status: 405,
            })
    }
}

self.addEventListener("fetch", async (event) => {
    console.debug('fetch');

    const regex = /^\/(ddb)(?:\/([\w\d]+))?(?:\/([\w\d]+))?(?:\/([\w\d\/]+))?$/;
    const url = new URL(event.request.url);

    if ((match = url.pathname.match(regex)) !== null) {
        switch (true) {
            case !!match[4]: // keypath
                break;
            case !!match[3]: // storename
                break;
            case !!match[2]: // dbname
                event.respondWith(handle_database_requests(match[2], event));
                break;
            case !!match[1]: // ddb
                event.respondWith(handle_ddb_requests(event));
                break;
            default:
                console.error('realy?')
        }
    };
    return;

    const routing = new Promise((resolve, reject) => {

        switch (segs.length) {
            case 1:
            // break;
            default:
                resolve(new JSONStatusResponse({
                    status: 404
                }));
        }
    });

    event.respondWith(routing);

    return;
    const prepare = new Promise((resolve, reject) => {
        try {
            switch (true) {
                case ('GET' === method && segs.length === 1):
                    indexedDB
                        .databases()
                        .then(result =>
                            resolve(new JSONResponse(result)));
                    break;

                case ('GET' === method && segs.length === 2):
                    const request = indexedDB.open(name);
                    request.onerror = () => {
                        console.error(request.error)
                        resolve(new JSONResponse(request.error))
                    }
                    request.onsuccess = () => {
                        console.log(request.result.objectStoreNames)
                        resolve(new JSONResponse(request.result.objectStoreNames));
                    }
                    break;

                case ('POST' === method && segs.length === 3):
                    indexedDB
                        .databases()
                        .then(arr => {
                            console.debug(arr)
                            let x = arr.reduce((prev, cur, idx, arr) => {
                                if (cur.name === name) return cur;
                            })

                            if (x) {
                                const request = indexedDB.open(x.name, ++x.version);
                                request.onupgradeneeded = (event) => {
                                    console.log(event);
                                    const ostore = event.target.result.createObjectStore(store);
                                    event.target.result.close() // WICHTIG
                                    resolve(new JSONResponse(ostore))
                                }
                            } else {
                                console.error(8)
                                resolve(new JSONResponse({ e: 1 }))
                            }
                        });
                // break;

                default:
                    resolve(new Response(JSON.stringify({ a: 1 })));
            }

            /*             const request = indexedDB.open(name, 0);
                        request.onerror = () => {
                            console.debug('error', request.error)
                            resolve(new Response(request.error));
                        };
                        request.onupgradeneeded = (event) => {
                            console.debug('onupgradeneeded')
                        }
                        request.onsuccess = () => {
                            console.debug('onsuccess')
                            resolve(new Response("onsuccess"));
                        } */
        } catch (err) {
            console.error(err)
            resolve(new JSONResponse(err));
        }
    });

    event.respondWith(prepare);

    /*     event.respondWith(
            (async () => {
                const request = await indexedDB.open(dbname);
    
                return new Response("hallo")
            })(), );
        console.debug(dbname, store, ...path) */
});

self.addEventListener('install', (event) => {
    console.log('install sw.ddb.js')
});

self.addEventListener('activate', (event) => {
    console.log('activate sw.ddb.js');
    // When a service worker is initially registered,
    // pages won't use it until they next load.
    // The claim() method causes those pages to be
    // controlled immediately:
    return self.clients.claim();
});