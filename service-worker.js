// boosaaddsaa
console.group("service-worker.js");
/**
 * Any changes made to the version and naming of the caches need to
 * happen in ./js/cache.js module file also.
 * There is currently no ES6 modules support in Service Workers yet.
 * https://hospodarets.com/es-modules-test/
 */
const app_cache = (function() {
  let config = {
    staticCacheName: "gezelligheid-static-v1",
    contentImgsCache: "gezelligheid-content-imgs-v1",
    imagesRegex: /-\d*_\w*_\d+x\.jpg$/
  };

  config.allCaches = [config.staticCacheName, config.contentImgsCache];

  return {
    config: config
  };
})();

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
      .open(app_cache.config.staticCacheName)
      .then(function(cache) {
        const staticCacheContent = [
          "./favicon.ico",
          "./manifest.webmanifest",
          "./",
          "./index.html",
          "./restaurant.html",
          "./js/views/Toasts.js",
          "./js/app.js",
          "./js/app_cache.js",
          "./js/dbhelper.js",
          "./js/idb.js",
          "./js/main.js",
          "./js/restaurant_info.js",
          "./data/restaurants.json",
          "./css/styles.css"
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
              !app_cache.config.allCaches.includes(cacheName)
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
  let storageUrl = request.url.replace(app_cache.config.imagesRegex, "");

  return caches.open(app_cache.config.contentImgsCache).then(function(cache) {
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
    /**
     * Do not queue behind another service worker while it's waiting or installing.
     * Take over straight away.
     * This should be called when the user hits a refresh button on our Toast with update notification.
     */
    self.skipWaiting();
  }
});
console.groupEnd();
