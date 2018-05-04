console.group("service-worker.js");
var staticCacheName = "gezelligheid-static-v1";
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

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function (cache) {
      const staticCacheContent = [
        "./",
        "./index.html",
        "./restaurant.html",
        // "./js/app.js",
        // "./js/dbhelper.js",
        // "./js/main.js",
        // "./js/restaurant_info.js",
        "./data/restaurants.json",
        "./css/styles.css",
        "./img/icon.png"
      ];
      console.log(["Caching static content: ", staticCacheContent]);
      return cache.addAll(staticCacheContent);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            return (
              cacheName.startsWith("gezelligheid-") &&
              !allCaches.includes(cacheName)
            );
          })
          .map(function (cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
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
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

function servePhoto(request) {
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

self.addEventListener("message", function (event) {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
console.groupEnd();
