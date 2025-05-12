
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

const handle_store_requests = (dbname, storename, http) => new Promise(async (resolve, reject) => {

    switch (http.request.method) {
        case 'GET': {
            const list = await databases();

            if (list[dbname]) {
                indexedDB.open(dbname).onsuccess = (event) => {
                    const db = event.target.result;

                    const transaction = db.transaction(storename);
                    const store = transaction.objectStore(storename);

                    resolve(new JSONResponse({
                        indexes: Array.from(store.indexNames).reduce((obj, key) => {
                            obj[key] = {
                                keyPath: store.index(key).keyPath,
                                multiEntry: store.index(key).multiEntry,
                                unique: store.index(key).unique
                            }
                            return obj
                        }, {}),
                        autoIncrement: store.autoIncrement,
                        keyPath: store.keyPath,
                        name: store.name
                    }));
                    db.close();
                }
            } else resolve(new JSONStatusResponse({
                status: 404,
            }));
            break;
        }
        default:
            resolve(new JSONStatusResponse({
                status: 405,
                dbname: dbname,
                storename: storename
            }));
    }
});

const handle_database_requests = (dbname, http) => new Promise(async (resolve, reject) => {

    switch (http.request.method) {
        case 'GET': {
            const list = await databases();

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
            break;
        }
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
                event.respondWith(handle_store_requests(match[2], match[3], event));
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
    }
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