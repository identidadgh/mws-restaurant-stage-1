// var app = app || {};
var app = (function () {

  const flags = {
    envForceProduction: false, // Default is false. Set to true to force "Production" configurations on "Development"
    serviceWorkerEnabled: true
  };

  let config = {
    envName: "Production",
    isDevelopmentEnvironment: "",
    apiPhotographFormat: "",
    databaseUrl: "data/restaurants.json",
    dataFormat: "restaurants"
  };

  let settings = {
    init: function () {
      // let config = this.config;
      // config["isDevelopmentEnvironment"] = false;
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

  function getApiPhotographFormat() {
    return config.apiPhotographFormat;
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
    getDatabaseUrl: getDatabaseUrl,
    getApiPhotographFormat: getApiPhotographFormat,
    loadServiceWorker: loadServiceWorker
  };

})();

export { app };