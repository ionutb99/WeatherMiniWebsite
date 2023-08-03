import {cities} from "./cities.mjs";

const API_KEY = `8589d56d8dfd4be095a72014231505`;
const API_KEY_IMAGE = `KmWTNXrva89xyNk39kSVKnWljrqbR2u4m3ZRoEa4GdBufyUgjmGrajkI`;

let favorites = [];
/**
 * Creates the input Field
 */
const createInputField = () => {
  const rootElement = document.querySelector("#root");

  const labelCreate = document.createElement("label");
  labelCreate.innerText = "Select a City: ";
  labelCreate.setAttribute("for", "inputElem");

  const inputCreate = document.createElement("input");
  inputCreate.setAttribute("id", "inputElem");
  inputCreate.setAttribute("list", "browsers");

  const datalistCreate = document.createElement("datalist");
  datalistCreate.setAttribute("id", "browsers");

  let spinnerElement = document.createElement("div");
  spinnerElement.id = "spinner";
  spinnerElement.classList.add("spinner");

  // datalistCreate.innerHTML = `<option value='Bucharest'></option>`
  rootElement.appendChild(labelCreate);
  rootElement.appendChild(inputCreate);
  rootElement.appendChild(datalistCreate);
  rootElement.appendChild(spinnerElement);

  const datalistGet = document.querySelector("datalist");
  const inputGet = document.querySelector("input");

  inputGet.addEventListener("input", function () {
    const searchText = this.value.toLowerCase().trim();

    if (searchText.length === 0) {
      showFavorites();
    } else {
      // Clear existing options
      datalistGet.innerHTML = "";
      // Filter and add options
      cities.forEach((city) => {
        const cityLower = city.toLowerCase();
        if (cityLower.startsWith(searchText) && searchText.length >= 3) {
          const optionElem = document.createElement("option");
          optionElem.value = city;
          datalistGet.appendChild(optionElem);
        }
      });
    }
  });
};

/**
 *
 * @param {string} cityName Name of the selected city
 * @param {number} daysOfForecast Number of days for forecast
 * @returns Object from the weather API
 */
const fetchData = async (cityName, daysOfForecast) => {
  // get spinner class
  const spinner = document.querySelector("#spinner");
  spinner.classList.add("visible");
  //construct the string we can querry from the api
  const apiString = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=${daysOfForecast}&aqi=no&alert=no`;
  //process the response
  const response = await fetch(apiString);
  const jsonData = await response.json();

  // add timming before show data
  await new Promise((resolve) => setTimeout(resolve, 1500));
  spinner.classList.remove("visible");

  //return the data object
  return jsonData;
};

/**
 *
 * @param {object} weatherData Object returned by the weather API
 * @returns Six values used in creating the weather card html element
 */
const extractData = (weatherData) => {
  //extract data from the weatherData object
  const cityName = weatherData.location.name;
  const condition = weatherData.current.condition.text;
  const pressure = weatherData.current.pressure_mb;
  const humidity = weatherData.current.humidity;
  //Get the current date so we can display the forecasted temperature for the next 5 hours
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  //Loop trough the forecast data and extract the temperature corresponding to the given hours
  let temperaturesByHour = [
    { Now: weatherData.forecast.forecastday[0].hour[currentHour].temp_c },
  ];
  for (let i = currentHour + 1; i <= currentHour + 5; ++i) {
    temperaturesByHour.push({
      [i]: weatherData.forecast.forecastday[0].hour[i].temp_c,
    });
  }

  //Extract the average temperature for today and two days after
  let temperaturesByDay = [
    { Today: weatherData.forecast.forecastday[0].day.avgtemp_c },
    { Tomorrow: weatherData.forecast.forecastday[1].day.avgtemp_c },
    { Overmorrow: weatherData.forecast.forecastday[2].day.avgtemp_c },
  ];

  //return the values we will use to create the weather card
  return [
    cityName,
    condition,
    pressure,
    humidity,
    temperaturesByHour,
    temperaturesByDay,
  ];
};

/**
 *
 * @param {string} cityName Name of the selected city
 * @param {string} condition Description of the current condition
 * @param {number} pressure Value of air pressure
 * @param {number} humidity Value of humidity
 * @param {Array} temperaturesByHour Array with values of average temeprature for the next 6 hours (including the current hour)
 * @param {Array} temperaturesByDay Array with values of average temperature for the next 3days (including today)
 */
const createWeatherCard = (
  cityName,
  condition,
  pressure,
  humidity,
  temperaturesByHour,
  temperaturesByDay
) => {
  //if there is a weathercard present on the page, remove it
  if (document.querySelector(`#Container`)) {
    document.querySelector(`#Container`).remove();
  }

  //create a fragment and a container that will hold "sections"
  let fragment = document.createDocumentFragment();
  let container = document.createElement(`div`);
  container.id = `Container`;
  //create three divs for the different parts of the card (header, body1 wich comes in the middle and body2 wich comes at the bottom)
  let cardHeader = document.createElement(`div`);
  cardHeader.id = `CardHeader`;
  let CardBodyMiddle = document.createElement(`div`);
  CardBodyMiddle.id = `CardBodyMiddle`;
  let CardBodyBottom = document.createElement(`div`);
  CardBodyBottom.id = `CardBodyBottom`;
  //create the elements for the card header;
  let cityNameElement = document.createElement(`p`);
  cityNameElement.innerText = cityName;
  cityNameElement.id = `CityName`;

  let conditionElement = document.createElement(`p`);
  conditionElement.innerText = condition;
  conditionElement.id = `Description`;

  let temperatureElement = document.createElement(`p`);
  temperatureElement.innerText = `${temperaturesByDay[0].Today}°C`;
  temperatureElement.id = `TemperatureDisplay`;

  let pressureElement = document.createElement(`p`);
  pressureElement.innerText = `Pressure: ${pressure}`;
  pressureElement.id = `Pressure`;

  let humidityElement = document.createElement(`p`);
  humidityElement.innerText = `Humidity: ${humidity}%`;
  humidityElement.id = `Humidity`;

  let containersElement = document.createElement("div");
  containersElement.id = "favoritesContainer";

  // Add favrites Button
  let favoriteBtn = document.createElement("button");
  favoriteBtn.innerText = "Add to Favorites";
  favoriteBtn.id = "favoriteBtn";

  // Add event listener to the favorite button
  favoriteBtn.addEventListener("click", () => {
    favorites.push(cityName);
    showFavorites();
  });

  //Append the elements to the cardHeader div
  cardHeader.appendChild(cityNameElement);
  cardHeader.appendChild(conditionElement);
  cardHeader.appendChild(temperatureElement);
  cardHeader.appendChild(pressureElement);
  cardHeader.appendChild(humidityElement);
  cardHeader.appendChild(favoriteBtn);
  cardHeader.appendChild(containersElement);
  //append the card header to the container
  container.appendChild(cardHeader);

  //Create a div that holds each hour and temperature strong element separately and append it to the middle body part of the card (CardBodyMiddle div)
  for (let i = 0; i < temperaturesByHour.length; ++i) {
    let TempByHour = document.createElement(`div`);
    TempByHour.classList.add(`temperatureByHour`);
    let time = document.createElement(`strong`);
    time.innerText = Object.keys(temperaturesByHour[i]);
    let temperature = document.createElement(`strong`);
    temperature.innerText = `${
      temperaturesByHour[i][Object.keys(temperaturesByHour[i])]
    }°C   `;
    TempByHour.appendChild(time);
    TempByHour.appendChild(temperature);
    CardBodyMiddle.appendChild(TempByHour);
  }

  //Append the middle section of the card to the container
  container.appendChild(CardBodyMiddle);

  //Create a div that hold each day and the average temeprature strong element separately and append it to te bottom part of the card (CardBodyBottom div)
  for (let i = 0; i < temperaturesByDay.length; ++i) {
    let tempByDay = document.createElement(`div`);
    tempByDay.classList.add(`temperatureByDay`);
    let day = document.createElement(`strong`);
    day.innerText = Object.keys(temperaturesByDay[i]);
    let temperature = document.createElement(`strong`);
    temperature.innerText = `${
      temperaturesByDay[i][Object.keys(temperaturesByDay[i])]
    }°C`;

    tempByDay.appendChild(day);
    tempByDay.appendChild(temperature);
    CardBodyBottom.appendChild(tempByDay);
  }

  //Append the bottom section of the card to the container
  container.appendChild(CardBodyBottom);

  //Append the container to the fragment created at the start of the function
  fragment.appendChild(container);
  //Append the fragment to the root element
  document.querySelector(`#root`).appendChild(fragment);
};

/**
 * Shows the cities added to the favorites in the drop down menu
 */
const showFavorites = () => {
  //Create a set from the favorites array to avoid duplication
  const uniqueFavorites = new Set(favorites);
  //Select the datalist and reset it to epmty
  const datalistGet = document.querySelector("datalist");
  datalistGet.innerHTML = "";
  //Add all the options from the uniqueFavorites set
  uniqueFavorites.forEach((favorite) => {
    const optionElem = document.createElement("option");
    optionElem.value = favorite;
    datalistGet.appendChild(optionElem);
  });
};

/**
 *
 * @param {string} cityName Name of the currently selected city
 * @returns Object containing images of the city in params
 */
const fetchBackground = async (cityName) => {
  let apiString = `https://api.pexels.com/v1/search?query=${cityName}&per_page=1`;
  let response = await fetch(apiString, {
    headers: {
      Authorization: API_KEY_IMAGE,
    },
  });
  let jsonData = await response.json();
  return jsonData;
};

/**
 *
 * @param {object} imageObject Object returned by the fetchBackground function
 */
const changeBackgroundByCity = async (imageObject) => {
  console.log(imageObject);
  let rootElement = document.querySelector(`#root`);
  rootElement.style.backgroundImage = `url(${imageObject.photos[0].src.original})`;
};

/**
 * Main function that contains all
 */
const main = async () => {
  //function that creates the input field
  createInputField();
  //Additional eventlistener on the input field to get the data from the API and create the weathercard
  document.querySelector("input").addEventListener(`change`, async (event) => {
    let data = extractData(await fetchData(event.target.value, 3));
    createWeatherCard(...data);
    changeBackgroundByCity(await fetchBackground(event.target.value));
  });
};

main();