// Nominatim API for city autocomplete (restricting to US)
async function fetchCitySuggestions() {
    const query = document.getElementById('city-input').value;

    // If no input, hide suggestions
    if (!query) {
        document.getElementById('city-suggestions').innerHTML = '';
        return;
    }

    // Fetch city suggestions restricted to the United States
    const url = `https://nominatim.openstreetmap.org/search?city=${query}&countrycodes=US&format=json&limit=5`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayCitySuggestions(data);
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
    }
}

// Display city suggestions in dropdown (only city name is passed)
function displayCitySuggestions(cities) {
    const suggestionsDropdown = document.getElementById('city-suggestions');
    suggestionsDropdown.innerHTML = ''; // Clear previous suggestions

    if (cities.length === 0) {
        suggestionsDropdown.innerHTML = '<li>No city found</li>';
        return;
    }

    cities.forEach(city => {
        const cityName = city.display_name.split(",")[0]; // Extract only the city name
        const suggestionItem = document.createElement('li');
        suggestionItem.textContent = cityName;
        suggestionItem.onclick = () => {
            document.getElementById('city-input').value = cityName;
            suggestionsDropdown.innerHTML = ''; // Clear suggestions after selection
        };
        suggestionsDropdown.appendChild(suggestionItem);
    });
}

// Get weather data for the entered city
async function getWeather() {
    const city = document.getElementById('city-input').value;
    if (!city) {
        showError('Please enter a city name.');
        return;
    }

    showLoading();
    const coordinates = await getCoordinates(city);
    if (coordinates) {
        const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
        hideLoading();
        displayWeather(weatherData);
    } else {
        hideLoading();
    }
}

// Get coordinates from Nominatim for a given city (restricting to US)
async function getCoordinates(city) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?city=${city}&countrycodes=US&format=json&limit=1`;
    try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        if (data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            return { lat, lon };
        } else {
            showError('City not found, please try another one.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
}

// Get weather data from weather.gov API
async function getWeatherData(lat, lon) {
    const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
    try {
        const response = await fetch(pointUrl);
        const data = await response.json();
        const forecastUrl = data.properties.forecast;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        return forecastData;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Display weather data for the next 5 days
function displayWeather(forecastData) {
    if (forecastData) {
        const periods = forecastData.properties.periods.slice(0, 5); // Get the first 5 periods
        const weatherCardsContainer = document.querySelector('.weather-cards-container');
        weatherCardsContainer.innerHTML = ''; // Clear any previous content

        let isRainy = false;
        let isCloudy = false;
        let isSunny = false;

        periods.forEach(period => {
            const weatherCard = document.createElement('div');
            weatherCard.classList.add('weather-card');

            const weatherCondition = period.shortForecast.toLowerCase();
            let weatherIcon = 'fas fa-sun'; // Default to sunny icon

            if (weatherCondition.includes('cloudy')) {
                weatherIcon = 'fas fa-cloud';
                isCloudy = true;
            } else if (weatherCondition.includes('rain')) {
                weatherIcon = 'fas fa-cloud-rain';
                isRainy = true;
            } else {
                isSunny = true;
            }

            // Calculate average temperature if possible (e.g., using high and low temperatures if available)
            const averageTemp = period.temperature;

            weatherCard.innerHTML = `
                <h2>${period.name}</h2>
                <i class="${weatherIcon}"></i>
                <div class="temperature-average">Average: ${averageTemp}°F</div>
                <div class="details">${period.shortForecast}</div>
            `;

            weatherCardsContainer.appendChild(weatherCard);
        });

        // Change background based on weather condition
        if (isRainy) {
            document.body.className = 'rainy-background';
        } else if (isCloudy) {
            document.body.className = 'cloudy-background';
        } else {
            document.body.className = 'sunny-background';
        }
    }
}

// Show an error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
}

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'none';
}

// Get current location and fetch weather for it
async function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const weatherData = await getWeatherData(lat, lon);
            hideLoading();
            displayWeather(weatherData);
        }, () => {
            hideLoading();
            showError('Unable to retrieve your location.');
        });
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}
