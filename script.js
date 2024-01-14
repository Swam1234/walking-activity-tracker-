'use strict';

const workoutsContainer = document.querySelector('.workouts');

class App {
  //Public Fields
  #map = L.map('map');
  #router = L.Routing.osrmv1();
  #waypoints = [];
  #workouts = [];

  #startMarker;
  #destinationMarker;

  constructor() {
    this.#workouts = this._getLocalStorage() || [];
    this._getCurrentPosition();
    this._handlingMapEvent();
    this._goToWorkout();
  }

  _getCurrentPosition() {
    navigator.geolocation.getCurrentPosition(
      this._renderMap.bind(this),
      err => alert(err)
    )
  }

  _renderMap(position) {
    const { latitude: lat, longitude: lng } = position.coords;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.#map);
    this.#map.setView([lat, lng], 13);

    const workouts = this._getLocalStorage();
    if (!workouts) return;
    workouts.forEach(function (workout) {
      this._findRoutes(workout, false);
    }.bind(this));
  }

  _handlingMapEvent() {
    this.#map.on('click', function (e) {
      const { lat, lng } = e.latlng;
      const container = L.DomUtil.create('div', 'btn_container');
      const startBtn = this.#createBtn('Start From this Location', container);
      const destinationBtn = this.#createBtn('Go To this Location', container);

      startBtn.addEventListener('click', function () {
        this.#map.closePopup();
        if (this.#startMarker) this.#startMarker.remove();
        this.#startMarker = this._createMarker(e.latlng);
        this.#waypoints.splice(0, 1, { latLng: L.latLng(lat, lng) });
      }.bind(this));

      destinationBtn.addEventListener('click', function () {
        this.#map.closePopup();
        this.#destinationMarker = this._createMarker(e.latlng);
        this.#waypoints.push({ latLng: L.latLng(lat, lng) });
        const workout = { waypoints: this.#waypoints, id: new String(Date.now()).slice(-10) };
        this.#workouts.push(workout);
        this._setLocalStorage(this.#workouts);
        this._findRoutes(workout);
        this.#waypoints = [];
      }.bind(this))

      L.popup().setContent(container).setLatLng(e.latlng).openOn(this.#map);
    }.bind(this))
  }

  _findRoutes(workout, remove = true) {
    this.#router.route(workout.waypoints, function (err, routes) {
      if (err) return alert(err.message);
      if (remove) {
        this.#startMarker.remove();
        this.#destinationMarker.remove();
      }

      workout.waypoints.forEach(function (ele) {
        this._createMarker(ele.latLng);
      }.bind(this))

      const route = L.Routing.line(routes[0]).addTo(this.#map);
      this._renderWorkout(workout, route);
    }.bind(this));
  }

  _renderWorkout(workout, route) {
    const { totalDistance: distance, totalTime: time } = route._route.summary;
    const html = `
    <li class="workout workout--running" data-id="${workout.id}">
      <h2 class="workout__title">Running on April 14</h2>
      <div class="workout__details">
        <span class="workout__icon">🏃‍♂️</span>
        <span class="workout__value">${distance}</span>
        <span class="workout__unit">m</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${time}</span>
        <span class="workout__unit">min</span>
      </div>
    </li>
    `;
    workoutsContainer.insertAdjacentHTML('afterbegin', html);
  }

  _goToWorkout() {
    workoutsContainer.addEventListener('click', function (e) {
      const id = e.target.closest('.workout')?.dataset.id;
      if (!id) return;
      const workout = this.#workouts.find(ele => ele.id === id);
      const { lat: lat1, lng: lng1 } = workout.waypoints[0].latLng;
      const { lat: lat2, lng: lng2 } = workout.waypoints[1].latLng;
      const centerOfCoords = [(lat1 + lat2) * 0.5, (lng1 + lng2) * 0.5];
      this.#map.setView(centerOfCoords, 13);
    }.bind(this));
  }

  #createBtn(label, container) {
    const button = L.DomUtil.create('button', 'btn', container);
    button.textContent = label;
    return button;
  }

  _createMarker(coords) {
    return L.marker().setLatLng(coords).addTo(this.#map);
  }

  _getLocalStorage() {
    return JSON.parse(localStorage.getItem('workouts'));
  }

  _setLocalStorage(data) {
    localStorage.setItem('workouts', JSON.stringify(data));
  }

  static clearLocalStorage() {
    localStorage.clear();
  }
}

const app = new App();
