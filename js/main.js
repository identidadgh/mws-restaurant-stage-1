console.group("main.js");
var staticCacheName = "gezelligheid-static-v1";
var contentImgsCache = "gezelligheid-content-imgs-v1";
var allCaches = [staticCacheName, contentImgsCache];
/**
 * Register a serviceworker from each page, because they can all be the entrypoint.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("service-worker.js", { scope: "./" })
      .then(reg => console.log(["SW registered!", reg]))
      .then(function() {
        console.groupCollapsed("Getting loaded images upon sw register!");
        // const allImageElements = document.getElementsByTagName('img');
        const allImageElements = document.getElementsByClassName(
          "restaurant-img"
        );
        let allImages = [];
        for (const item of allImageElements) {
          let individual = new URL(item.currentSrc);
          console.log(["Image pathname: ", individual.pathname]);
          allImages.push(individual.pathname);
        }
        console.groupEnd();
        caches.open(contentImgsCache).then(function(cache) {
          console.log(["Caching loaded images: ", allImages]);
          return cache.addAll(allImages);
        });
      })
      .catch(err => console.log("SW registration failed!", err));
  });
} else {
  console.log("Service workers are not supported.");
}

let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute("role", "menuitem");
    option.setAttribute("aria-label", neighborhood);
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute("role", "menuitem");
    option.setAttribute("aria-label", cuisine);
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  ul.setAttribute("role", "alert");
  addMarkersToMap();
};

/**
 * Restaurant image srcset attribute.
 */
imageSrcsetForRestaurant = (url, image_size) => {
  // const imageName = url.replace('.jpg', '');
  const result = url.split(".").join(image_size + ".");
  // console.log('imageSrcsetForRestaurant: ' + result);
  return result;
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement("li");

  li.className = "box";
  li.setAttribute("role", "treeitem");

  const figure = document.createElement("figure");

  const image = document.createElement("img");
  image.className = "restaurant-img";
  // const description = restaurant.name.append()
  const image_title = "Restaurant " + restaurant.name;
  const image_description =
    restaurant.cuisine_type + " cuisine in " + restaurant.neighborhood;
  image.setAttribute("alt", image_title);
  image.setAttribute("title", image_description);

  const image_url = DBHelper.imageUrlForRestaurant(restaurant);

  image.src = image_url; // replace the .jpg filetype at the suffix and replace with

  let image_srcset =
    imageSrcsetForRestaurant(image_url, "-256_small_1x") + " 1x, ";
  image_srcset +=
    imageSrcsetForRestaurant(image_url, "-512_small_2x") + " 2x, ";
  image_srcset +=
    imageSrcsetForRestaurant(image_url, "-1024_small_3x") + " 3x ";

  image.setAttribute("srcset", image_srcset);

  const figcaption_description = document.createTextNode(
    restaurant.name + " for " + image_description
  );
  const figcaption = document.createElement("figcaption");
  figcaption.appendChild(figcaption_description);

  figure.append(image);
  figure.append(figcaption);
  li.append(figure);

  const name = document.createElement("h3");
  name.innerHTML = restaurant.name;
  li.append(name);
  li.setAttribute("aria-label", restaurant.name);

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.innerHTML = "View Details";
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
console.groupEnd();
