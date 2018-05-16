/**
 * Service Workers do not yet support ES6 modules import.
 * So anything changed here needs to be modified in the ./service-worker.js
 * file also.
 * https://hospodarets.com/es-modules-test/
 */
var cache = (function() {
  let config = {
    staticCacheName: "gezelligheid-static-v1",
    contentImgsCache: "gezelligheid-content-imgs-v1"
  };

  config.allCaches = [config.staticCacheName, config.contentImgsCache];

  return {
    config: config
  };
})();

export { cache };
