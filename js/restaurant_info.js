"use strict";
import { app as myApp } from "./app.js";
import DBHelper from "./dbhelper.js";

(function() {
  console.group("restaurant_info.js");
  let restaurant;
  var map;

  const _loadMap = function() {
    let fileref = document.createElement("script");
    fileref.defer = true;
    fileref.async = true;
    fileref.setAttribute(
      "src",
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyAQ6ibwJm_GvwMrmAlZ2gBqgez1392EsY0&libraries=places&callback=initMap"
    );
    document.querySelector("body").insertAdjacentElement("beforeend", fileref);
  };

  document.addEventListener("DOMContentLoaded", function() {
    _loadMap();
  });
  document.querySelector("form button").addEventListener("click", function() {
    _postReview();
  });

  /**
   * Post data entered in the review form to the IndexedDB objectStore called outbox,
   * then process the outbox so it is posted to the online db.
   */
  let _postReview = () => {
    let reviewer_name = document.querySelector("input[name='reviewer_name']")
      .value;
    let reviewer_rating = document.querySelector("select[name='rating']").value;
    let reviewer_comments = document.querySelector("textarea[name='comments']")
      .value;

    console.log(
      "Name: " +
        reviewer_name +
        " Rating: " +
        reviewer_rating +
        " Comments: " +
        reviewer_comments
    );

    const id = parseInt(getParameterByName("id"));

    let data = {
      restaurant_id: id,
      name: reviewer_name,
      rating: reviewer_rating,
      comments: reviewer_comments
    };

    // Post offline to the indexedDB objectStore called outbox.
    DBHelper.postDataToOutbox(data)
      .then(() => {
        // Alert user that posted review was successful.
        alert("Thank you for your post!");

        /**
         * Update reviews html with data in the outbox.
         * @TODO Add review to the top spot instead of last.
         */
        // console.log("self.restaurant.reviews: ", self.restaurant.reviews);
        // self.restaurant.reviews.push(data);
        self.restaurant.reviews = [data];
        // console.log("self.restaurant.reviews AFTER: ", self.restaurant.reviews);

        requestAnimationFrame(function() {
          console.log("Update html with data in the outbox");
          fillReviewsHTML();
        });

        // Clear form
        console.log("Clear form.");
        document.querySelector("form").reset();
      })
      .then(() => {
        // Post previously added review in outbox to online db.
        myApp.processOutbox();
      })
      .catch(error => console.error(error));

    // @TODO then, use the service worker and post to the online db.
    // @TODO see the @TODOs below!
    // _postData(DBHelper.DATABASE_URL_REVIEWS, {
    //   restaurant_id: id,
    //   name: reviewer_name,
    //   rating: reviewer_rating,
    //   comments: reviewer_comments
    // })
    //   .then(data => console.log(data)) // JSON from `response.json()` call
    //   .then(() => {
    //     alert("Thank you for your post!");
    //     // @TODO the newly added review needs to be fetched from the db and added to the list of reviews
    //     // @TODO instead of an alert we could make a nice CSS animation for completion.
    //   }) // JSON from `response.json()` call
    //   .catch(error => console.error(error));
  };

  /**
   * Initialize Google map, called from HTML.
   */
  window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        self.map = new google.maps.Map(document.getElementById("map"), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }
    });
  };

  /**
   * Get current restaurant from page URL.
   */
  const fetchRestaurantFromURL = callback => {
    if (self.restaurant) {
      // restaurant already fetched!
      callback(null, self.restaurant);
      return;
    }
    const id = getParameterByName("id");
    if (!id) {
      // no id found in URL
      error = "No restaurant id in URL";
      callback(error, null);
    } else {
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }
        // @todo should only proceed with fetching the reviews if restaurant exists
        DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
          self.restaurant.reviews = reviews;
          requestAnimationFrame(function() {
            fillReviewsHTML();
          });
        });
        requestAnimationFrame(function() {
          fillRestaurantHTML();
        });
        callback(null, restaurant);
      });
    }
  };

  /**
   * Restaurant image srcset attribute.
   */
  const imageSrcsetForRestaurant = (url, image_size) => {
    console.log("imageSrcsetForRestaurant url: ", url);
    const result = url.split(".jpg").join(image_size + ".jpg");
    console.log("Images string for srcset: ", result);
    return result;
  };

  /**
   * Create restaurant HTML and add it to the webpage
   */
  const fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById("restaurant-name");
    name.innerHTML = restaurant.name;

    const address = document.getElementById("restaurant-address");
    address.innerHTML = restaurant.address;

    const image = document.getElementById("restaurant-img");

    if (typeof restaurant.photograph != "undefined") {
      const figure = document.createElement("figure");

      image.className = "restaurant-img";
      const image_title = "Restaurant " + restaurant.name;
      const image_description =
        restaurant.cuisine_type + " cuisine in " + restaurant.neighborhood;
      image.setAttribute("alt", image_title);
      image.setAttribute("title", image_description);
      const image_url = DBHelper.imageUrlForRestaurant(restaurant);
      image.src = image_url;

      let image_srcset =
        imageSrcsetForRestaurant(image_url, "-512_medium_1x") + " 1x, ";
      image_srcset +=
        imageSrcsetForRestaurant(image_url, "-1024_medium_2x") + " 2x, ";
      image_srcset +=
        imageSrcsetForRestaurant(image_url, "-2048_medium_3x") + " 3x ";

      image.setAttribute("srcset", image_srcset);

      const figcaption_description = document.createTextNode(
        restaurant.name + " for " + image_description
      );
      const figcaption = document.createElement("figcaption");
      figcaption.appendChild(figcaption_description);

      image.parentNode.insertBefore(figure, image);
      figure.append(image);
      figure.append(figcaption);
    } else {
      const parentSection = image.parentNode;

      let div = document.createElement("div");
      div.className = "error-no-results";
      div.innerText =
        "Unfortunately, there were no images returned for this restaurant.";
      parentSection.replaceChild(div, image);
    }
    const cuisine = document.getElementById("restaurant-cuisine");
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
      fillRestaurantHoursHTML();
    }
    // fill reviews
    // fillReviewsHTML();
  };

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  const fillRestaurantHoursHTML = (
    operatingHours = self.restaurant.operating_hours
  ) => {
    const hours = document.getElementById("restaurant-hours");
    for (let key in operatingHours) {
      const row = document.createElement("tr");

      const day = document.createElement("td");
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement("td");
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  };

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById("reviews-container");
    const title = document.createElement("h3");
    title.id = "reviews-name";
    title.innerHTML = "Reviews";
    // When posting a new review, only add review-section title if it does not exist.
    if (document.querySelector("#reviews-name") === null)
      container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement("p");
      noReviews.innerHTML = "No reviews yet!";
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById("reviews-list");
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  };

  /**
   * Create review HTML and add it to the webpage.
   */
  const createReviewHTML = review => {
    const li = document.createElement("li");
    li.className = "box";
    const name = document.createElement("p");
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement("p");
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement("p");
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement("p");
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
  };

  /**
   * Add restaurant name to the breadcrumb navigation menu
   */
  const fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById("breadcrumb");
    const li = document.createElement("li");
    li.innerHTML = restaurant.name;
    li.setAttribute("aria-current", "page");
    breadcrumb.appendChild(li);
  };

  /**
   * Get a parameter by name from page URL.
   */
  const getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };
  console.groupEnd();
})();
