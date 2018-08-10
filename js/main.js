"use strict";
import { app as myApp } from "./app.js";
import DBHelper from "./dbhelper.js";

(function() {
  console.group("main.js");
  let restaurants, neighborhoods, cuisines;
  var map;
  var markers = [];

  /**
   * Cache DOM
   */
  const filterOptionsNeighbourhoods = document.querySelector(
    'select[id="neighborhoods-select"]'
  );
  const filterOptionsCuisines = document.querySelector(
    'select[id="cuisines-select"]'
  );

  /**
   * Bind Events
   */
  const filterBindEvents = function() {
    filterOptionsNeighbourhoods.onchange = updateRestaurants;
    filterOptionsCuisines.onchange = updateRestaurants;
  };

  /**
   * Fetch neighborhoods and cuisines as soon as the page is loaded.
   */
  document.addEventListener("DOMContentLoaded", event => {
    filterBindEvents();
    updateRestaurants();
    fetchNeighborhoods();
    fetchCuisines();
  });

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  const fetchNeighborhoods = () => {
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
  const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
  const fetchCuisines = () => {
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
  const fillCuisinesHTML = (cuisines = self.cuisines) => {
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
   * Update page and map for current restaurants.
   */
  const updateRestaurants = () => {
    const cSelect = document.getElementById("cuisines-select");
    const nSelect = document.getElementById("neighborhoods-select");

    const cIndex = cSelect.selectedIndex >= 0 ? cSelect.selectedIndex : 0;
    const nIndex = nSelect.selectedIndex >= 0 ? nSelect.selectedIndex : 0;

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
          fillFavoritesHTML();
        }
      }
    );
  };

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  const resetRestaurants = restaurants => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById("restaurants-list");
    ul.innerHTML = "";

    // Remove all map markers
    if (self.markers) {
      self.markers.forEach(m => m.setMap(null));
    }
    self.markers = [];
    self.restaurants = restaurants;
  };

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  const fillFavoritesHTML = () => {
    // setup toggles for marking favorite restaurants
    let elementFavoriteToggle = document.querySelectorAll(".favorite-toggle");
    let elementFavorite = document.querySelectorAll(".favorite");
    // let favoriteToggle = document.getElementsByClassName(
    //   "favorite-toggle"
    // );

    Array.from(elementFavoriteToggle).forEach(function(element) {
      element.addEventListener("click", _postFavorite, false);
    });
    Array.from(elementFavorite).forEach(function(element) {
      element.addEventListener("click", _postFavorite, false);
    });

    // function _postFavorite(event) {
    //   // console.log(ele.target.value);
    //   console.log(event);
    //   console.log("this: ", this.getAttribute("id"));
    //   this.classList.remove("favourite-toggle");
    //   this.className = "favorite";
    // }
  };

  const modifyFavoritesHTML = element => {
    let classFavoriteCurrent = element.getAttribute("class");
    console.log("ybsClassCurrent: ", classFavoriteCurrent);

    let classFavoriteChange =
      classFavoriteCurrent.indexOf("favorite-toggle") >= 0
        ? "favorite"
        : "favorite-toggle";
    console.log("ybsClassChange: ", classFavoriteChange);

    // Modify the toggled icon, remove current and add the changed class.
    element.classList.remove(classFavoriteCurrent);
    element.classList.add(classFavoriteChange);

    let classFavoriteNew = element.getAttribute("class");
    console.log("ybsClassNew: ", classFavoriteNew);

    return;
  };

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById("restaurants-list");
    // Check if there are at least 1 restaurant in the results.
    if (Object.keys(restaurants).length > 0) {
      restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
      });
      // Display a message to the user that there were no results found for the selected filters.
    } else {
      console.log("No restaurants found");
      ul.insertAdjacentElement(
        "afterbegin",
        createNoResultsHTML("restaurants")
      );
    }

    ul.setAttribute("role", "tree");
    addMarkersToMap();
  };

  /**
   * Restaurant image srcset attribute.
   */
  const imageSrcsetForRestaurant = (url, image_size) => {
    const result = url.split(".").join(image_size + ".");
    return result;
  };

  /**
   * Create no-results HTML
   */
  const createNoResultsHTML = part => {
    const div = document.createElement("div");

    div.className = "box error-no-results";
    div.setAttribute("role", "treeitem");

    const heading = document.createElement("h3");
    heading.innerHTML = "No Results :(";
    div.append(heading);

    const description = document.createElement("p");
    description.innerHTML = `Unfortunately, there were no ${part} returned for the filters you used.`;
    div.append(description);

    const call_to_action = document.createElement("p");
    call_to_action.innerHTML = `Please try a different filter for Neighbourhood or Cuisine.`;
    div.append(call_to_action);

    return div;
  };

  /**
   * Create restaurant HTML.
   */
  const createRestaurantHTML = restaurant => {
    const li = document.createElement("li");

    li.className = "box restaurant";
    li.setAttribute("role", "treeitem");

    if (typeof restaurant.photograph != "undefined") {
      const figure = document.createElement("figure");

      const image = document.createElement("img");
      image.className = "restaurant-img";
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
    } else {
      let div = document.createElement("div");
      div.className = "error-no-results";
      div.innerText =
        "Unfortunately, there were no images returned for this restaurant.";
      li.append(div);
    }

    console.log("restaurant.is_favorite: ", restaurant.is_favorite);
    let divFavorite = document.createElement("div");
    divFavorite.className = "favorite-toggle";
    if (typeof restaurant.is_favorite != "undefined") {
      if (restaurant.is_favorite == true || restaurant.is_favorite == "true") {
        divFavorite.className = "favorite";
      }
    }
    divFavorite.innerText = "★";
    divFavorite.setAttribute("id", "rid_" + restaurant.id);

    li.append(divFavorite);

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

  function _postFavorite(event) {
    // alert("Marked as Favorite!");
    // function _postFavorite(event) {
    // console.log(ele.target.value);
    let id = this.getAttribute("id");
    console.log(event);
    console.log("this: ", id);
    let restaurant_id = parseInt(id.replace("rid_", ""));

    let classFavoriteCurrent = this.getAttribute("class");
    console.log("ybsClassCurrent: ", classFavoriteCurrent);
    let is_favorite_value =
      classFavoriteCurrent.indexOf("favorite-toggle") >= 0 ? false : true;
    let is_favorite_value_new = is_favorite_value ? false : true;
    // let is_favorite_value_new = false;

    modifyFavoritesHTML(this);
    // let classFavoriteCurrent = this.getAttribute("class");
    // console.log("ybsClassCurrent: ", classFavoriteCurrent);

    // let classFavoriteChange =
    //   classFavoriteCurrent.indexOf("favorite-toggle") >= 0
    //     ? "favorite"
    //     : "favorite-toggle";
    // console.log("ybsClassChange: ", classFavoriteChange);

    // // Modify the toggled icon, remove current and add the changed class.
    // this.classList.remove(classFavoriteCurrent);
    // this.classList.add(classFavoriteChange);

    // let classFavoriteNew = this.getAttribute("class");
    // console.log("ybsClassNew: ", classFavoriteNew);

    let data = {
      id: restaurant_id,
      is_favorite: is_favorite_value_new
    };

    let url_query_string = `/${data.id}/?is_favorite=${is_favorite_value_new}`;

    // data["url"] = DBHelper.DATABASE_URL_IS_FAVORITE.replace(
    //   `<restaurant_id>`,
    //   data.id
    // );

    data["url"] = DBHelper.DATABASE_URL_IS_FAVORITE + url_query_string;

    console.log("data: ", data);
    console.log("DATABASE_URL_IS_FAVORITE: ", data.url);

    // @TODO PUT data in offline outbox and process it when online

    // @TODO Update the indexedDB objectStore called restaurants to refresh the
    // cache value for "is_favorite" and reflect what the online db has.

    // @TODO We could also just delete the entry in the indexedDB and it will refresh.

    // POST to the URL
    // return myApp.putData(data.url);
    return DBHelper.updateRestaurantsCached(data.id, data);
    // return;
  }

  /**
   * Add markers for current restaurants to the map.
   */
  const addMarkersToMap = (restaurants = self.restaurants) => {
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
})();
