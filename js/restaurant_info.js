console.group('restaurant_info.js');
var staticCacheName = 'gezelligheid-static-v1';
var contentImgsCache = 'gezelligheid-content-imgs-v1';
var allCaches = [
  staticCacheName,
  contentImgsCache
];
/**
 * Register a serviceworker from each page, because they can all be the entrypoint.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js', { scope: './' })
      .then(reg => console.log(['SW registered!', reg]))
      .then(function () {
        console.groupCollapsed('Getting loaded images upon sw register!');
        // const allImageElements = document.getElementsByTagName('img');
        const allImageElements = document.getElementsByClassName('restaurant-img');
        let allImages = [];
        for (const item of allImageElements) {
          let individual = new URL(item.currentSrc);
          console.log(['Image pathname: ', individual.pathname]);
          allImages.push(individual.pathname);
        }
        console.groupEnd();
        caches.open(contentImgsCache).then(function (cache) {
          console.log(['Caching loaded images: ', allImages]);
          return cache.addAll(allImages);
        })

      })
      .catch(err => console.log('SW registration failed!', err));
  });
} else {
  console.log('Service workers are not supported.');
}

let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Restaurant image srcset attribute.
 */
imageSrcsetForRestaurant = (url, image_size) => {
  // const imageName = url.replace('.jpg', '');
  const result = url.split('.').join(image_size + '.');
  console.log('Images string for srcset: ', result);
  // return (`/img/${restaurant.photograph}`);
  return result;
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const figure = document.createElement('figure');

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  const image_title = 'Restaurant ' + restaurant.name;
  const image_description = restaurant.cuisine_type + ' cuisine in ' + restaurant.neighborhood;
  image.setAttribute('alt', image_title);
  image.setAttribute('title', image_description);
  const image_url = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = image_url;

  let image_srcset = imageSrcsetForRestaurant(image_url, '-512_medium_1x') + ' 1x, ';
  image_srcset += imageSrcsetForRestaurant(image_url, '-1024_medium_2x') + ' 2x, ';
  image_srcset += imageSrcsetForRestaurant(image_url, '-2048_medium_3x') + ' 3x ';
  
  image.setAttribute('srcset', image_srcset);

  const figcaption_description = document.createTextNode(restaurant.name + ' for ' + image_description);
  const figcaption = document.createElement('figcaption');
  figcaption.appendChild(figcaption_description);

  image.parentNode.insertBefore(figure, image);
  figure.append(image);
  figure.append(figcaption);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
console.groupEnd();