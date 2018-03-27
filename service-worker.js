var staticCacheName = 'gezelligheid-static-v1';
var contentImgsCache = 'gezelligheid-content-imgs';
var allCaches = [
    staticCacheName,
    contentImgsCache
];

var myHeaders = new Headers();
myHeaders.append('Content-Type', 'image/jpg');

var myInit = {
    method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    cache: 'default'
};

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([
                '/',
                '/restaurant.html',
                'js/main.js',
                'js/restaurant_info.js',
                'css/styles.css',
                'img/icon.png'
                // 'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
                // 'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
            ]);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('gezelligheid-') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        console.log(requestUrl.pathname);
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/'));
            return;
        }
        if (requestUrl.pathname === '/restaurant.html') {
            event.respondWith(caches.match('/restaurant.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
        // TODO: respond to avatar urls by responding with
        // the return value of serveAvatar(event.request)
        // if (requestUrl.pathname.startsWith('/avatars/')) {
        //     event.respondWith(serveAvatar(event.request));
        //     return;
        // }

    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});


function servePhoto(request) {
    // var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
    var storageUrl = request;

    return caches.open(contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request, myInit).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// self.addEventListener('fetch', function(event){
//     // console.log([event.request]);
//     // console.log('Hellos');
//     // if (event.request.url.endsWith('.jpg')) {
//     //     event.respondWith(
//     //         fetch('/img/1.jpg')
//     //     );
//     // }
//     event.respondWith(
//         // new Response('Hello world')
//         fetch(event.request).then(function(response){
//             if (response.status == 404) {
//                 return new Response("Whoops, not found!");
//             }
//             return response;
//         }).catch(function(){
//             return new Response("Uh oh, that totally failed!");
//         })
//     );
// });