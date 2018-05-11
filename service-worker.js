// boosaaddsaa
console.group("service-worker.js");
var staticCacheName = "gezelligheid-static-v2";
var contentImgsCache = "gezelligheid-content-imgs-v1";
var allCaches = [staticCacheName, contentImgsCache];

var myHeaders = new Headers();
myHeaders.append("Content-Type", "image/jpg");

var myInit = {
  method: "GET",
  headers: myHeaders,
  mode: "cors",
  cache: "default"
};

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches
      .open(staticCacheName)
      .then(function(cache) {
        const staticCacheContent = [
          "./favicon.ico",
          "./manifest.webmanifest",
          "./",
          "./index.html",
          "./restaurant.html",
          "./js/views/Toasts.js",
          "./js/app.js",
          "./js/dbhelper.js",
          "./js/idb.js",
          "./js/main.js",
          "./js/restaurant_info.js",
          "./data/restaurants.json",
          "./css/styles.css",
          "./img/icon.png",
          "./img/icon-no-image.png"
        ];
        console.log(["Caching static content: ", staticCacheContent]);
        return cache.addAll(staticCacheContent);
      })
      .catch(e => {
        console.error("Service worker caches error: ", e);
      })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return (
              cacheName.startsWith("gezelligheid-") &&
              !allCaches.includes(cacheName)
            );
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener("fetch", function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    // console.log(requestUrl.pathname);
    if (requestUrl.pathname === "/") {
      event.respondWith(caches.match("/"));
      return;
    }
    if (requestUrl.pathname === "/restaurant.html") {
      event.respondWith(caches.match("/restaurant.html"));
      return;
    }
    if (requestUrl.pathname.startsWith("/img/")) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

function servePhoto(request) {
  var storageUrl = request;

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request, myInit)
        .then(function(networkResponse) {
          cache.put(storageUrl, networkResponse.clone());
          return networkResponse;
        })
        .catch(e => {
          console.log("servePhoto Fetch Error: ", e);
        });
    });
  });
}

self.addEventListener("message", function(event) {
  if (event.data.action === "skipWaiting") {
    // Do not queu behind another service worker while it's waiting or installing. Take over straight away.
    // This should be called when the user hits a refresh button on our Toast with update notification.
    self.skipWaiting();
  }
});
console.groupEnd();
