const CACHE_NAME = 'foil-inventory-cache-v2'; // تم تحديث الإصدار لضمان التحديث
const urlsToCache = [
    '/', // ملف HTML الرئيسي
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js',
    'https://unpkg.com/html5-qrcode/html5-qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/davidshimjs-qrcodejs@0.0.2/qrcode.min.js',
    
    // --- ملفات تمت إضافتها ليعمل التطبيق بدون انترنت ---
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-database-compat.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/stack.svg' // أيقونة التطبيق (PWA)
];

// event install: يقوم بتخزين الملفات الأساسية في الـ cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching core assets');
                return cache.addAll(urlsToCache);
            })
    );
});

// event activate: يقوم بتنظيف الـ cache القديم تلقائياً
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// event fetch: يقدم الملفات من الـ cache ويحدثها في الخلفية (استراتيجية Stale-While-Revalidate)
self.addEventListener('fetch', event => {
    // نريد فقط تخزين طلبات GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                // جلب نسخة جديدة من الشبكة لتحديث الـ cache للزيارة القادمة
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        cache.put(event.request, responseToCache);
                    }
                    return networkResponse;
                }).catch(error => {
                    console.log('Fetch from network failed:', error);
                    throw error;
                });

                // إرجاع الاستجابة من الـ cache فوراً إذا كانت موجودة،
                // وإلا، انتظر الاستجابة من الشبكة.
                return response || fetchPromise;
            });
        })
    );
});