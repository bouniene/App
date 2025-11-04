// sw.js

const CACHE_NAME = 'foil-inventory-cache-v1';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWrGCmzYh5RGFUesOxpUgu6ZgZBnhPtjLOvFNKICU20DimKU0_mfui4a33X5oCIto/exec';
const DB_NAME = 'FoilInventoryDB';
const DB_VERSION = 1;

// 1. Caching Strategy (as before)
const urlsToCache = [
    '/',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js',
    'https://unpkg.com/html5-qrcode/html5-qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/davidshimjs-qrcodejs@0.0.2/qrcode.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// 2. Background Sync Logic
self.addEventListener('sync', event => {
    if (event.tag === 'sync-foil-data') {
        console.log('SW: Sync event received for "sync-foil-data"');
        event.waitUntil(syncData());
    }
});

// Function to get data from IndexedDB
function getFullDataFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = event => reject("Error opening DB");
        request.onsuccess = event => {
            const db = event.target.result;
            const tx = db.transaction(['rolls', 'logs'], 'readonly');
            const rollsStore = tx.objectStore('rolls');
            const logsStore = tx.objectStore('logs');

            const rollsReq = rollsStore.getAll();
            const logsReq = logsStore.getAll();

            let rolls, logs;

            rollsReq.onsuccess = () => {
                rolls = rollsReq.result;
                if (logs !== undefined) resolve({ rolls, logs });
            };
            logsReq.onsuccess = () => {
                logs = logsReq.result;
                if (rolls !== undefined) resolve({ rolls, logs });
            };
            tx.oncomplete = () => db.close();
        };
    });
}

// Function that performs the sync
async function syncData() {
    try {
        console.log('SW: Fetching data from IndexedDB for sync...');
        const fullData = await getFullDataFromDB();

        if (!fullData.rolls && !fullData.logs) {
             console.log('SW: No data to sync.');
             return;
        }

        console.log('SW: Attempting to send data to server...');
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=saveData`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(fullData)
        });

        if (!response.ok) {
            throw new Error(`Server response not OK: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('SW: Sync successful!', result);

    } catch (err) {
        console.error('SW: Sync failed!', err);
        // We don't re-throw the error, so the browser knows the sync is "complete" for now,
        // but it will try again automatically later.
    }
}