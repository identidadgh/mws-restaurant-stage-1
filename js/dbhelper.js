import { app as myApp } from "./app.js";
import idb from "./idb.js";

/**
 * Common database helper functions.
 */
export default class DBHelper {
  /**
   * Open Client-side Database indexedDB
   * Whenever the structure of the db changes, e.g. new index or objectStore
   * the database version for the upgrade needs to be changed: myApp.getClientDatabase().database.version
   * @return Promise
   */
  static openDatabase() {
    const database = myApp.getClientDatabase();

    if (myApp.flags.debugIndexDBEnabled) {
      indexedDB.deleteDatabase(database.name);
    }

    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open(database.name, database.version, function(upgradeDb) {
      var store = upgradeDb.createObjectStore(database.objectStoreName, {
        keyPath: "id" // Treat the "id" property of restaurant objects in the store as primary key
      });
      // store.put("world", "hello");
      // store.createIndex("by-date", "time");
      database.filters.forEach(index => {
        let name = `by-${index}`;
        let keyPath = index;
        console.log(`idb create index ${name} for keypath: ${index}`);
        store.createIndex(name, keyPath);
      });
      // Create the objectStore for the reviews in the database called gezelligheid
      var storeReviews = upgradeDb.createObjectStore(
        database.objectStoreNameReviews,
        {
          keyPath: "id" // Treat the "id" property of restaurant reviews objects in the store as primary key
        }
      );
      // Index restaurant reviews by restaurant_id
      database.filtersReviews.forEach(index => {
        let name = `by-${index}`;
        let keyPath = index;
        console.log(`idb create index ${name} for keypath: ${index}`);
        storeReviews.createIndex(name, keyPath);
      });
    });
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    let database_url = myApp.getDatabaseUrl();
    return database_url;
  }

  /**
   * Database URL.
   * Change this to reviews.json file location on your server.
   */
  static get DATABASE_URL_REVIEWS() {
    let database_url = myApp.getDatabaseUrlReviews();
    return database_url;
  }

  /**
   * Get all restaurants from indexedDB
   * @return Promise coming from DBHelper.openDatabase
   */
  static fetchRestaurantsCached() {
    return DBHelper.openDatabase().then(db => {
      if (!db) return; //@todo or already showing restaurants

      const database = myApp.getClientDatabase();
      let tx = db.transaction(database.objectStoreName);
      let store = tx.objectStore(database.objectStoreName);
      // let store = tx.objectStore(database.objectStoreName).index("by-cuisine_type");

      return store.getAll();
    });
  }

  /**
   * Fetch all restaurants from the API server
   * @return Promise
   */
  static fetchRestaurantsOnline() {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(function(data) {
        let _dbPromise = DBHelper.openDatabase();

        _dbPromise.then(db => {
          if (!db) return;
          const database = myApp.getClientDatabase();
          let tx = db.transaction(database.objectStoreName, "readwrite");
          let store = tx.objectStore(database.objectStoreName);
          data.forEach(restaurant => {
            store.put(restaurant);
          });
        });
        console.log("Restaurants Fetched: ", data);
        return data;
      })
      .catch(e => {
        console.log("Fetch Restaurants from Network Error", e);
      });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsCached()
      .then(dataCached => {
        // dataCached can either be "undefined" when there is no db
        // OR it can be a Promise coming from DBHelper.openDatabase
        // Therefore we return a Promise.resolve() which is suitable for
        // a returned value or returned Promise. Either case we return a Promise.
        if (dataCached.length > 0) return Promise.resolve(dataCached);

        // Then we proceed to return a Promise coming from the Fetch API.
        return DBHelper.fetchRestaurantsOnline();
      })
      .then(data => {
        return callback(null, data);
      })
      .catch(e => {
        console.log("FetchRestaurantsCached Error: ", e);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Get all restaurant reviews from indexedDB
   * @return Promise coming from DBHelper.openDatabase
   */
  static fetchReviewsCached() {
    return DBHelper.openDatabase().then(db => {
      if (!db) return; //@todo or already showing restaurant reviews

      const database = myApp.getClientDatabase();
      let tx = db.transaction(database.objectStoreNameReviews);
      let store = tx.objectStore(database.objectStoreNameReviews);
      // let store = tx.objectStore(database.objectStoreNameReviews).index("by-cuisine_type");

      return store.getAll();
    });
  }

  /**
   * Fetch all restaurant reviews from the API server
   * @return Promise
   */
  static fetchReviewsOnline() {
    return fetch(DBHelper.DATABASE_URL_REVIEWS)
      .then(response => response.json())
      .then(function(data) {
        let _dbPromise = DBHelper.openDatabase();

        _dbPromise.then(db => {
          if (!db) return;
          const database = myApp.getClientDatabase();
          let tx = db.transaction(database.objectStoreNameReviews, "readwrite");
          let store = tx.objectStore(database.objectStoreNameReviews);
          data.forEach(restaurantReviews => {
            store.put(restaurantReviews);
          });
        });
        console.log("Restaurant Reviews Fetched: ", data);
        return data;
      })
      .catch(e => {
        console.log("Fetch Restaurant Reviews from Network Error", e);
      });
  }

  /**
   * Fetch all restaurant reviews.
   */
  static fetchReviews(callback) {
    DBHelper.fetchReviewsCached()
      .then(dataCached => {
        // dataCached can either be "undefined" when there is no db
        // OR it can be a Promise coming from DBHelper.openDatabase
        // Therefore we return a Promise.resolve() which is suitable for
        // a returned value or returned Promise. Either case we return a Promise.
        if (dataCached.length > 0) return Promise.resolve(dataCached);

        // Then we proceed to return a Promise coming from the Fetch API.
        return DBHelper.fetchReviewsOnline();
      })
      .then(data => {
        return callback(null, data);
      })
      .catch(e => {
        console.log("FetchReviewsCached Error: ", e);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all restaurant reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        // const restaurantReviews = reviews.find(r => r.id == id);
        const restaurantReviews = reviews.filter(r => r.restaurant_id == id);
        if (restaurantReviews) {
          // Got the restaurantReviews
          callback(null, restaurantReviews);
        } else {
          // Restaurant reviews do not exist in the database
          callback("Restaurant reviews do not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    let result =
      "img/" + restaurant.photograph + myApp.getApiPhotographFormat();
    return result;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
