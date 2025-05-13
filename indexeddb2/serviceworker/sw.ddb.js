
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
        case 'POST': {

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

const handle_database_requests = (request, dbname) => new Promise(async (resolve, reject) => {

    switch (request.method + dbname.endsWith('/')) {
        // GET /ddb/db
        case 'GETfalse': {
            const list = await databases();

            if ((version = list[dbname])) {

                indexedDB.open(dbname).onsuccess = (event) => {
                    resolve(new JSONResponse({
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

        // GET /ddb/db/
        case 'GETtrue': {
            const list = await databases();

            dbname = dbname.slice(0, -1);

            if ((version = list[dbname])) {
                indexedDB.open(dbname).onsuccess = (event) => {
                    resolve(new JSONResponse(
                        Array.from(event.target.result.objectStoreNames)
                    ));
                    event.target.result.close();
                }
            } else resolve(new JSONStatusResponse({
                status: 404,
            }));
            break;
        }

        // POST /ddb/db
        case 'POSTfalse': {
            const body = await request.json();
            const req = indexedDB.open(dbname, body?.version ?? 1);
            const response = {
                status: 200,
            }

            req.onerror = (event) => {
                resolve(new JSONStatusResponse({
                    status: 409,
                    error: {
                        message: event.target.error.message,
                        name: event.target.error.name
                    }
                }));
            }

            req.onupgradeneeded = (event) => {
                const db = event.target.result;

                Array.from(body?.stores ?? []).forEach(storeOptions => {
                    if (Array.from(db.objectStoreNames).includes(storeOptions.name)) {
                        // TODO save data
                        db.deleteObjectStore(storeOptions.name);
                    }

                    const store = db.createObjectStore(
                        storeOptions.name, {
                        keyPath: storeOptions?.keyPath,
                        autoIncrement: storeOptions?.autoIncrement
                    });

                    Array.from(storeOptions?.indexes ?? []).forEach(indexOptions => {

                        store.createIndex(
                            indexOptions.name,
                            indexOptions.keyPath, {
                            unique: indexOptions?.unique,
                            multiEntry: indexOptions?.multiEntry
                        })
                    });
                });

                response.status = 201;
                response.location = `/ddb/${dbname}`;
            }

            req.onsuccess = (event) => {
                event.target.result.close();
                resolve(new JSONStatusResponse(response));
            }
            break;
        }

        // DELETE /ddb/db
        case 'DELETEfalse':
            break;

        default:
            resolve(new JSONStatusResponse({
                status: 405,
            }))
    }
});

const handle_ddb_requests = async (request, ddb) => {

    switch (request.method + ddb.endsWith('/')) {

        // GET /ddb/
        case 'GETtrue':
            return new JSONResponse(await indexedDB.databases());

        default:
            return new JSONStatusResponse({
                status: 405,
            });
    }
}

self.addEventListener("fetch", async (event) => {
    console.debug('fetch');

    //const regex = /^\/(ddb)(?:\/([\w\d]+))?(?:\/([\w\d]+))?(?:\/([\w\d\/]+))?$/;
    const regex = /\/(ddb\/?)([\w\d]+\/?)?([\w\d]+\/?)?([\w\d\/]+)?/;
    const url = new URL(event.request.url);

    if ((match = url.pathname.match(regex)) !== null) {
        console.log(match)
        switch (true) {
            case !!match[4]: // keypath
                break;
            case !!match[3]: // storename
                event.respondWith(handle_store_requests(match[2], match[3], event));
                break;
            case !!match[2]: // dbname
                event.respondWith(handle_database_requests(event.request, match[2]));
                break;
            case !!match[1]: // ddb
                event.respondWith(handle_ddb_requests(event.request, match[1]));
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