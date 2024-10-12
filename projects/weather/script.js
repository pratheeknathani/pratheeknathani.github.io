async function getCoordinates(city) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?city=${city}&format=json`;
    const headers = { 'User-Agent': 'MyWeatherApp (your_email@example.com)' };

    try {
        const response = await fetch(geocodeUrl, { headers });
        const data = await response.json();
        if (data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            return { lat, lon };
        } else {
            showError('City not found, please try another one.');
            throw new Error(`City '${city}' not found.`);
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
}

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

            weatherCard.innerHTML = `
                <h2>${period.name}</h2>
                <i class="${weatherIcon}"></i>
                <div class="temperature-high">High: ${period.temperature}°F</div>
                <div class="temperature-low">Low: ${period.temperature}°F</div>
                <div class="details">${period.shortForecast}</div>
            `;

            weatherCardsContainer.appendChild(weatherCard);
        });

        if (isRainy) {
            document.body.className = 'rainy-background';
        } else if (isCloudy) {
            document.body.className = 'cloudy-background';
        } else {
            document.body.className = 'sunny-background';
        }
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
}

function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'none';
}

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
async function fetchCitySuggestions() {
    const query = document.getElementById('city-input').value;

    // If no input, hide suggestions
    if (!query) {
        document.getElementById('city-suggestions').innerHTML = '';
        return;
    }

    // Fetch city suggestions from the Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?city=${query}&format=json&limit=5`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayCitySuggestions(data);
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
    }
}

// Display the city suggestions in the dropdown
function displayCitySuggestions(cities) {
    const suggestionsDropdown = document.getElementById('city-suggestions');
    suggestionsDropdown.innerHTML = ''; // Clear previous suggestions

    if (cities.length === 0) {
        suggestionsDropdown.innerHTML = '<li>No city found</li>';
        return;
    }

    cities.forEach(city => {
        const suggestionItem = document.createElement('li');
        suggestionItem.textContent = `${city.display_name}`;
        suggestionItem.onclick = () => {
            document.getElementById('city-input').value = city.display_name;
            suggestionsDropdown.innerHTML = ''; // Clear suggestions after selection
        };
        suggestionsDropdown.appendChild(suggestionItem);
    });
}
