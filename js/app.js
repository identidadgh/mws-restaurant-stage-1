import { cache as app_cache } from "./app_cache.js";
import ToastsView from "./views/Toasts.js";
import DBHelper from "./dbhelper.js";

var app = (function() {
  const flags = {
    envForceProduction: false, // Default is false. Set to true to force "Production" configurations on "Development"
    serviceWorkerEnabled: true,
    debugIndexDBEnabled: false
  };

  let config = {
    envName: "Production",
    isDevelopmentEnvironment: "",
    apiPhotographFormat: "",
    databaseUrl: "data/restaurants.json",
    databaseUrlReviews: "data/reviews.json",
    dataFormat: "restaurants",
    dataFormatReviews: "reviews",
    clientDatabase: {
      name: "gezelligheid",
      objectStoreName: "restaurants",
      objectStoreNameReviews: "reviews",
      objectStoreNameOutbox: "outbox",
      version: 2,
      filters: ["neighborhood", "cuisine_type"],
      filtersReviews: ["restaurant_id"]
    }
  };

  let settings = {
    init: function() {
      config["isDevelopmentEnvironment"] = !flags.envForceProduction
        ? window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
        : false;

      if (config.isDevelopmentEnvironment) {
        config["envName"] = "Development";
        config["apiPhotographFormat"] = ".jpg";
        config["databaseUrl"] = "http://localhost:1337/restaurants";
        config["databaseUrlReviews"] = "http://localhost:1337/reviews/";
        config["dataFormat"] = "";
        config["dataFormatReviews"] = "";
      }
    }
  };

  let resources = {
    styles: [
      "css/styles.css",
      "https://necolas.github.io/normalize.css/latest/normalize.css"
    ],
    images: ["/img/icon-no-image.png", "/img/icon.png"]
  };

  let controller = {
    /**
     * Whenever there's an update ready to show.
     */
    _updateReady: function(worker) {
      let toast = new ToastsView();
      toast.showToast("Update ready! Waiting to activate");
    },
    // using an arrow function here for worker, errors in _updateReady not being defined.
    // worker is serviceworker's reg.installing
    _trackInstalling: function(worker) {
      const self = this;
      // In the worker we are going to listen to its statechange event.
      worker.addEventListener("statechange", function() {
        if (worker.state == "installed") {
          // notify the user
          self._updateReady();
          /**
           * If the user's response was to refresh, we do skipWaiting for install.
           * Otherwise the new service worker would just sit there and be installed
           * only when the user navigates to another page or closes the tab.
           */
          worker.postMessage({ action: "skipWaiting" });
        }
      });
    }
  };

  let utils = {
    parseHTML: function(opt_HTML) {
      let contextRange = document.createRange();
      contextRange.setStart(document.body, 0);
      return contextRange.createContextualFragment(opt_HTML);
    }
  };

  /**
   * Bind events
   */
  window.addEventListener("load", function() {
    _registerServiceWorker();
  });
  document.addEventListener("DOMContentLoaded", event => {
    loadResources();
  });
  window.addEventListener("online", () => {
    _processOutbox();
  });

  let _processOutbox = () => {
    alert("back online! process outbox");

    let outboxEntries = DBHelper.outboxData();
    // console.log(
    //   "+++++++Esaki ta e promise di entries for di e outbox: ",
    //   outboxEntries
    // );
    outboxEntries.then(entries => {
      // console.log("+++++++Esaki ta tur entries for di e outbox: ", entries);
      entries.forEach(entry => {
        console.warn(
          "+++++++Esaki ta entry.id:" +
            entry.id +
            " un di e entries for di e outbox: ",
          entry
        );

        _postData(config.databaseUrlReviews, {
          restaurant_id: entry.restaurant_id,
          name: entry.name,
          rating: entry.rating,
          comments: entry.comments
        })
          .then(data => console.log(data)) // JSON from `response.json()` call
          // .then(() => {
          //   alert("Thank you for your post!");
          //   // @TODO the newly added review needs to be fetched from the db and added to the list of reviews
          //   // @TODO instead of an alert we could make a nice CSS animation for completion.
          // }) // JSON from `response.json()` call
          .then(() => {
            console.warn("Remove the review entry from the outbox objectStore");
            DBHelper.removeDataFromOutbox(entry.id);
          })
          .catch(error => console.error(error));
      });
    });
    // outboxEntries.forEach(entry => {
    //   console.warn("+++++++Esaki ta un entry for di e outbox: ", entry);
    // });
    return;

    // Foreach entry in the local Cache objectStore called outbox,
    // let outboxData = {
    //   restaurant_id: 2,
    //   name: "test name",
    //   rating: 5,
    //   comments: "test comments"
    // };
    //
    // _postData(DBHelper.DATABASE_URL_REVIEWS, {
    // _postData(config.databaseUrlReviews, {
    //   restaurant_id: outboxData.restaurant_id,
    //   name: outboxData.name,
    //   rating: outboxData.rating,
    //   comments: outboxData.comments
    // })
    //   .then(data => console.log(data)) // JSON from `response.json()` call
    //   .then(() => {
    //     alert("Thank you for your post!");
    //     // @TODO the newly added review needs to be fetched from the db and added to the list of reviews
    //     // @TODO instead of an alert we could make a nice CSS animation for completion.
    //   }) // JSON from `response.json()` call
    //   .then(() => {
    //     console.warn("Remove the review entry from the outbox objectStore");
    //   })
    //   .catch(error => console.error(error));
  };

  const _postData = (url = ``, data = {}) => {
    // Default options are marked with *
    return fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, same-origin, *omit
      headers: {
        "Content-Type": "application/json; charset=utf-8"
        // "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    })
      .then(response => response.json()) // parses response to JSON
      .catch(error => console.error(`Fetch Error =\n`, error));
  };

  const loadResources = () => {
    return new Promise(function(resolve) {
      let stylesList = resources.styles;
      let documentFragment = document.createDocumentFragment();
      stylesList.forEach(function(sheet) {
        let fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", sheet);
        documentFragment.appendChild(fileref);
      });
      document.querySelector("head").appendChild(documentFragment);
      resolve();
    });
  };

  let _cacheImages = function() {
    console.groupCollapsed("Getting loaded images upon sw register!");

    const allImageElements = document.querySelectorAll(".restaurant-img");

    if (allImageElements.length > 0) {
      let allImages = [];

      /** Add all images needed by default needed for proper functioning. */
      resources.images.forEach(function(image) {
        allImages.push({ imageRequest: image, imageResponse: image });
      });

      for (const item of allImageElements) {
        let individual = new URL(item.currentSrc);
        console.log(["Image pathname: ", individual.pathname]);
        /**
         * Cache images without the size and dpi suffix so we serve it again if offline.
         * Same as the controller service-worker.js method servePhoto.
         */
        let storageUrl = individual.pathname.replace(
          app_cache.config.imagesRegex,
          ""
        );
        allImages.push({
          imageRequest: storageUrl,
          imageResponse: individual.pathname
        });
      }
      console.groupEnd();
      caches.open(app_cache.config.contentImgsCache).then(function(cache) {
        console.log(["Caching loaded images: ", allImages]);
        allImages.forEach(function(imageUrlsPair) {
          /** Destructure request / response pair */
          let { imageRequest, imageResponse } = imageUrlsPair;
          imageResponse = fetch(imageResponse);
          imageResponse.then(function(imageNetworkResponse) {
            cache.put(imageRequest, imageNetworkResponse);
          });
        });
        return;
      });
    }
  };

  /**
   * Register a serviceworker from each page, because they can all be the entrypoint.
   */
  let _registerServiceWorker = function() {
    if (flags.serviceWorkerEnabled && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("service-worker.js", { scope: "./" })
        .then(reg => {
          console.log(["SW registered!", reg]);
          /**
           * No controller (./service-worker.js) means page was not loaded via serviceworker,
           * meaning they have the latest version. So this is the latest version.
           * We then exit early.
           */
          if (!navigator.serviceWorker.controller) return;

          /**
           * If there is a serviceworker waiting, we call the updateReady function
           * which triggers a notification Toast. Then we return.
           */
          if (reg.waiting) {
            controller._updateReady(reg.waiting);
            return;
          }

          /**
           * If there is an updated service worker installing, we track its progress
           * and if it becomes "installed" we call trackInstalling function.
           */
          if (reg.installing) {
            controller._trackInstalling(reg.installing);
            return;
          }

          /**
           * If there is not an installing service worker we listen for any
           * new installing service workers arriving.
           * To know if there is one we listen for event firing of "updatefound".
           * Then we track its progress.
           */
          reg.addEventListener("updatefound", () => {
            controller._trackInstalling(reg.installing);
          });

          /**
           * Listen for the service worker controller (./service-worker.js) changing.
           * Then reload current page --without using the cache--
           */
          let refreshed;
          self.addEventListener("controllerchange", function() {
            if (refreshed) return;
            window.location.reload();
            refreshed = true;
          });
        })
        .then(_cacheImages)
        .catch(err => console.log("SW registration failed!", err));
    } else {
      console.log("Service workers are not enabled or not supported.");
    }
  };

  function getApiPhotographFormat() {
    return config.apiPhotographFormat;
  }

  function getClientDatabase() {
    return config.clientDatabase;
  }

  function getDatabaseUrl() {
    return config.databaseUrl;
  }

  /**
   * Function getDatabaseUrlReviews(), like the rest, is hidden to outside
   * and is called using the "return" located at the bottom.
   */
  function getDatabaseUrlReviews() {
    return config.databaseUrlReviews;
  }

  settings.init();
  console.log("Configuration: ", config);

  return {
    flags: flags,
    controller: controller,
    getClientDatabase: getClientDatabase,
    getDatabaseUrl: getDatabaseUrl,
    getDatabaseUrlReviews: getDatabaseUrlReviews,
    getApiPhotographFormat: getApiPhotographFormat
  };
})();

export { app };
