// --- Service Worker for Sample Management App (Firebase Version) ---

// Import Firebase functions (this is required in service workers)
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js");

const CACHE_NAME = 'sample-manager-cache-v2';
const DB_NAME = 'SampleManagerDB';
const DB_VERSION = 2; // Make sure this version matches the one in your index.html

// URLs for the app shell to cache for offline use
const APP_SHELL_URLS = [
    './', // This should be the path to your main HTML file
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js',
    'https://cdn.jsdelivr.net/npm/tom-select@2.3.1/dist/js/tom-select.complete.min.js',
    'https://cdn.datatables.net/2.0.8/js/dataTables.js'
];

// Firebase configuration (must be identical to your index.html)
const firebaseConfig = {
    apiKey: "AIzaSyBPDnVOol10iskGrtgqxlp9a28cQFCemB4",
    authDomain: "nnnnc-48782.firebaseapp.com",
    databaseURL: "https://nnnnc-48782-default-rtdb.firebaseio.com",
    projectId: "nnnnc-48782",
    storageBucket: "nnnnc-48782.firebasestorage.app",
    messagingSenderId: "91157067378",
    appId: "1:91157067378:web:e0a600f956bad0b44234eb"
};

// Initialize Firebase within the Service Worker
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- Service Worker Lifecycle Events ---

self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    // Clean up old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Use a "cache first, then network" strategy for app shell resources
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// --- Background Sync Event ---

self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync event triggered:', event.tag);
    if (event.tag === 'sync-samples') {
        event.waitUntil(syncDataToFirebase());
    }
});

// --- Helper Functions for Syncing ---

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = event => reject('IndexedDB error: ' + event.target.error);
        request.onsuccess = event => resolve(event.target.result);
    });
}

function getDBData(db, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onerror = event => reject('Error getting data: ' + event.target.error);
        request.onsuccess = event => resolve(event.target.result);
    });
}

// Helper to convert array to Firebase-friendly object
function _arrayToObject(array, keyField = 'docId') {
    if (!array || !Array.isArray(array)) return {};
    return array.reduce((obj, item) => {
        if (item && item[keyField]) {
            obj[item[keyField]] = item;
        }
        return obj;
    }, {});
}

async function syncDataToFirebase() {
    try {
        console.log('[Service Worker] Starting data sync to Firebase...');
        const db = await openDB();
        const samples = await getDBData(db, 'samples');
        const logs = await getDBData(db, 'logs');

        // Filter out any samples marked for deletion
        const samplesToSave = samples.filter(s => !s.isDeleted);

        // Convert arrays to objects for Firebase multi-path update
        const samplesObject = _arrayToObject(samplesToSave);
        const logsObject = _arrayToObject(logs, 'id');

        console.log(`[Service Worker] Syncing ${Object.keys(samplesObject).length} samples to Firebase...`);

        // Prepare the multi-path update
        const updates = {
            '/samples': samplesObject,
            '/logs': logsObject
        };

        // Perform the update
        await database.ref().update(updates);

        console.log('[Service Worker] Data sync to Firebase completed successfully!');

    } catch (error) {
        console.error('[Service Worker] Data sync failed:', error);
        // Throwing an error will cause the browser to retry the sync later
        throw error;
    }
}