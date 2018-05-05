// var app = app || {};
var app = (function () {

  const flags = {
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
        ? window.location.hostname === "localhost"
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
    loadServiceWorker: loadServiceWorker
  };

})();

export { app };