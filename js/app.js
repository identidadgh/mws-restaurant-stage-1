import ToastsView from "./views/Toasts.js";

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
    dataFormat: "restaurants",
    clientDatabase: {
      name: "gezelligheid",
      objectStoreName: "restaurants",
      version: 2,
      filters: ["neighborhood", "cuisine_type"]
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
        config["dataFormat"] = "";
      }
    }
  };

  let resources = {
    styles: [
      "css/styles.css",
      "//necolas.github.io/normalize.css/latest/normalize.css"
    ]
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
  document.addEventListener("DOMContentLoaded", event => {
    loadResources();
  });

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

  function getApiPhotographFormat() {
    return config.apiPhotographFormat;
  }

  function getClientDatabase() {
    return config.clientDatabase;
  }

  function getDatabaseUrl() {
    return config.databaseUrl;
  }

  function loadServiceWorker() {
    return flags.serviceWorkerEnabled;
  }

  settings.init();
  console.log("Configuration: ", config);

  return {
    flags: flags,
    controller: controller,
    getClientDatabase: getClientDatabase,
    getDatabaseUrl: getDatabaseUrl,
    getApiPhotographFormat: getApiPhotographFormat,
    loadServiceWorker: loadServiceWorker
  };
})();

export { app };
