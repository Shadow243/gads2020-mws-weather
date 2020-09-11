import Weather from "./weather";
import { round, degToCard, addCity } from './utils';
import { loadFromLocalState, saveToLocalState } from './localState';

export default class App {
  constructor() {
    this.weather = new Weather();
    this.defaultCity = "New York";
    this.searching = false;
    this.localCities = [];
  }
  run() {
    this.init();
  }

  init() {
    this.searchInput = document.querySelector(".find-location input");
    this.searchButton = document.querySelector(".find-location button");

    this.weatherContainer = document.querySelector(".weather-container");
    this.citiesContainer = document.querySelector(".cities");

    this.citiesContainer.classList.add('hidden');

    this.bindEvents();
    this.loadInitialCities();
    this.query(this.defaultCity);
  }

  bindEvents() {
    this.searchInput.addEventListener("keypress", this.process.bind(this));
    this.searchButton.addEventListener("click", this.process.bind(this));
  }

  loadInitialCities() {
    const cities = loadFromLocalState();
    if (cities.length > 0) {
      this.localCities = cities;
      this.displayWeather(cities[0]);
    }
  }

  getParsedDateTime(dateString) {
    const dateObj = new Date(dateString),
      weekDays = ["Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"],
      months = ["January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"],
      curMonth = months[dateObj.getMonth()],
      curYear = dateObj.getFullYear(),
      dayOfWeek = weekDays[dateObj.getDay()],
    domEnder = (function () {
      var a = dateObj;
      if (/1/.test(parseInt((a + "").charAt(0)))) return "th";
      a = parseInt((a + "").charAt(1));
      return 1 == a ? "st" : 2 == a ? "nd" : 3 == a ? "rd" : "th";
    })(),
      dayOfMonth =
        (dateObj.getDate() < 10)
          ? "0" + dateObj.getDate() + domEnder
          : dateObj.getDate() + domEnder,
      curHour =
        dateObj.getHours() > 12
          ? dateObj.getHours() - 12
          : dateObj.getHours() < 10
            ? "0" + dateObj.getHours()
            : dateObj.getHours(),
      curMinute =
        dateObj.getMinutes() < 10
          ? "0" + dateObj.getMinutes()
          : dateObj.getMinutes(),
      curSeconds =
        dateObj.getSeconds() < 10
          ? "0" + dateObj.getSeconds()
          : dateObj.getSeconds(),
      curMeridiem = dateObj.getHours() > 12 ? "PM" : "AM";
      return {
        dayOfWeek,
        dayOfMonth,
        curMonth,
        curYear,
        curHour,
        curMinute,
        curSeconds,
        curMeridiem
      }
  }

  async query(city) {
    this.searching = true
    try {
      const response = await this.weather.search(city);
      if (response && response.city) {

        const cityPayload = {
          city: response.city,
          list: response.list,
        };

        this.localCities = addCity(this.localCities, payload);

        this.displayWeather(response);
        saveToLocalState(cityPayload);
      }
    } catch (error) {

    } finally {
      this.searching = false
    }
  }

  process(event) {
    // Prevent only if user clicked on the submit button
    if (event instanceof MouseEvent) {
      event.preventDefault();
    }

    if (
      event instanceof MouseEvent ||
      (event instanceof MouseEvent && evt.keyCode === 13)
    ) {
      const { value } = this.searchInput;
      if (value !== "") {
        this.query(value);
      }
    }
  }

  displayWeather(weather) {

    const { city } = weather;
    const data = weather.list;
    const current = data.shift();

    this.weatherContainer.innerHTML = '';

    this.displayCurrent(city, current);
    this.displayRemaining(data);
    this.displayLocalCities();

  }

  displayCurrent(city, weatherData) {

    const { curHour, curMinute, curMeridiem, dayOfWeek, curMonth, dayOfMonth } = this.getParsedDateTime(weatherData.dt_txt);

    const { main, weather } = weatherData;
    const weatherItem = weather[0];
    const wind = weatherData.wind;

    const windSpeed = `Wind Speed : ${(wind.speed * 3.6).toFixed(2)} km/h`;
    const windDirection = `Wind Direction : ${degToCard(wind.deg)}`;

    const dateString = `${curMonth} ${dayOfMonth} ${curHour}:${curMinute} ${curMeridiem}`;

    const currentElement = document.createElement("div");

    currentElement.classList.add('weather');
    currentElement.classList.add('today');

    currentElement.innerHTML = `
      <div class="weather-header">
          <div class="day">${dayOfWeek}</div>
          <div class="date">${dateString}</div>
      </div>
      <!-- .weather-header -->
      <div class="weather-content">
          <div class="location">
          ${ city.name}, ${city.country }
          <span><small>${weatherItem.main}</small></span>
          </div>
          <div class="degree">
              <div class="num">${round(main.temp)}<sup>o</sup>C</div>
              <div class="weather-icon">
                  <img src="https://openweathermap.org/img/wn/${weatherItem.icon}@2x.png" alt="${weatherItem.main}" width="90">
              </div>
          </div>
          <span class="weather-wind">${windSpeed}</span>
          <span class="weather-compass">${windDirection}</span>
      </div>`;
    this.weatherContainer.appendChild(currentElement)
  }

  displayRemaining (data) {
    if (data && data.length > 0) {
      data.forEach((weatherData) => {
        const { curHour, curMinute, curMeridiem, curMonth, dayOfMonth } = this.getParsedDateTime(weatherData.dt_txt);

        const { main, weather } = weatherData;
        const weatherItem = weather[0];

        const dateString = `${curMonth.substr(0, 3)} ${dayOfMonth} ${curHour}:${curMinute} ${curMeridiem}`;

        const divElement = document.createElement("div");

        divElement.classList.add('weather');
        divElement.innerHTML = `
          <div class="weather-header">
              <div class="day">
                <small>${dateString}</small>
              </div>
          </div>
          <!-- .weather-header -->
          <div class="weather-content">
              <span class="description">${weatherItem.main}</span>
              <div class="weather-icon">
                  <img src="https://openweathermap.org/img/wn/${weatherItem.icon}@2x.png" alt="${weatherItem.main}" width="48">
              </div>
              <div class="degree">${round(main.temp)}<sup>o</sup>C</div>
              <small>${round(main.temp_min)}<sup>o</sup></small>
          </div>`;

        this.weatherContainer.appendChild(divElement)
      });
    }
  }

  displayLocalCities() {
    const cities = this.localCities;
    console.log('cities', cities)
    if (cities.length > 0) {
      this.citiesContainer.innerHTML = '';
      this.citiesContainer.classList.remove('hidden');
      cities.forEach((cityItem) => {
        const { city, list } = cityItem;

        const divElement = document.createElement("div");

        divElement.classList.add('column');
        divElement.innerHTML = `
          <div class="card">
              <h2>${ city.name}, ${city.country }</h2>
              <h3>Wind 10km/h <span class="dot">•</span> Precip 0%</span></h3>
              <h1>23°</h1>
              <div class="weather-icon">
                  <img src="assets/images/icons/icon-1.svg" alt="" width="48">
              </div>
              <table>
                  <tr>
                      <td>TUE</td>
                      <td>WED</td>
                      <td>THU</td>
                  </tr>
                  <tr>
                      <td>30°</td>
                      <td>34°</td>
                      <td>36°</td>
                  </tr>
                  <tr>
                      <td>17°</td>
                      <td>22°</td>
                      <td>19°</td>
                  </tr>
              </table>
          </div>`;

        this.citiesContainer.appendChild(divElement)
      });
    }

  }

}
