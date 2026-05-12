let db = indexedDB.open("Cached-Versions", 1);
db.onupgradeneeded = e => e.target.result.createObjectStore("Cached-Versions");
let dbResult = new Promise(resolve => db.onsuccess = e => resolve(e.target.result));
let dbFields = {
    currentVersion: "",
    requiredFiles: [],
    requiredByClients: {},
};
let dbFieldsPromise = dbResult.then(result => {
    let objectStore = result.transaction("Cached-Versions", "readonly").objectStore("Cached-Versions");
    return Promise.all(Object.keys(dbFields).map(field => new Promise(resolve => {
        let get = objectStore.get(field);
        get.onsuccess = () => {
            if (get.result) {
                dbFields[field] = get.result;
            }
            resolve();
        };
        get.onerror = resolve;
    })));
});
let dbWrite = () => dbFieldsPromise.then(() => dbResult.then(result => {
    let transaction = result.transaction("Cached-Versions", "readwrite");
    let objectStore = transaction.objectStore("Cached-Versions");
    Object.entries(dbFields).forEach(([field, value]) => objectStore.put(value, field));
    return new Promise(resolve => transaction.oncomplete = resolve);
}));

let cache = caches.open("Cache");
let updating = false;
let update = async () => {
    if (!updating) {
        updating = true;
        try {
            if (self.registration.active) {
                self.registration.update().catch(() => {});
            }
            let safeFetch = async url => {
                let response = await fetch(url);
                if (response.ok) {
                    return response;
                } else {
                    throw new Error(`Fetch failed with code ${response.status}.`);
                }
            };
            let latestVersion = await safeFetch("/latest.txt").then(response => response.text()).then(version => version.trim());
            await dbFieldsPromise;
            if (dbFields.currentVersion != latestVersion) {
                console.log(`Updating from ${dbFields.currentVersion} to ${latestVersion}...`);
                try {
                    let main = await safeFetch(`/${latestVersion}`);
                    let requiredFiles = [...(await main.clone().text()).match(new RegExp(`(?<=["'])/${latestVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^"' ]+(?=["'])`, "gsu"))];
                    let awaitedCache = await cache;
                    await Promise.all(requiredFiles.map(required => safeFetch(required).then(response => awaitedCache.put(required, response))));
                    dbFields.requiredFiles.push(...requiredFiles);
                    await dbWrite();
                    await awaitedCache.put("/", main);
                    dbFields.requiredFiles = requiredFiles;
                    dbFields.currentVersion = latestVersion;
                    await dbWrite();
                    console.log("Update complete.");
                } catch (e) {
                    console.warn("Update failed:", e);
                }
            }
        } catch (e) {
            console.log("Offline.");
        }
        let clients = await self.clients.matchAll();
        Object.keys(dbFields.requiredByClients).forEach(id => {
            if (!clients.some(client => client.id == id)) {
                delete dbFields.requiredByClients[id];
            }
        });
        await dbWrite();
        let requiredFiles = ["/", dbFields.requiredFiles, Object.values(dbFields.requiredByClients)].flat(Infinity);
        let requests = await cache.then(cache => cache.keys());
        await Promise.all(requests.map(request => !requiredFiles.includes(new URL(request.url).pathname) && cache.then(cache => cache.delete(new URL(request.url).pathname))));
        updating = false;
    }
};

self.addEventListener("install", e => e.waitUntil(update()));

self.addEventListener("fetch", e => e.respondWith((e.request.mode == "navigate" ? Promise.race([update(), new Promise(resolve => setTimeout(resolve, 2000))]) : Promise.resolve()).then(() => caches.match(e.request).then(async r => {
    if (e.request.mode == "navigate") {
        dbFields.requiredByClients[e.resultingClientId] = [...dbFields.requiredFiles];
        dbWrite();
    }
    return r ?? await fetch(e.request);
}))));

/*
Create or load cache: let cache = await caches.open("CacheName");
Delete cache: await caches.delete("CacheName");
List existing caches by name: let names = await caches.keys();

Write to cache: await cache.put(request, response);
Read from cache: let response = await cache.get(request);
Delete from cache: await cache.delete(request);
List cached requests: let requests = await cache.keys();

List all clients: await self.clients.matchAll();
Get client by ID: let client = await self.clients.get(id);
Get ID of client: let id = client.id;
Get client ID of event: let id = event.clientId;
*/
