// Update the header with the city name
function updateCityHeader(city) {
    const cityHeader = document.getElementById('city-header');
    cityHeader.textContent = `${city} Weather`; // Update header with the selected city name
}

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

// Display city, state, and country in dropdown (pass only city to API)
function displayCitySuggestions(cities) {
    const suggestionsDropdown = document.getElementById('city-suggestions');
    suggestionsDropdown.innerHTML = ''; // Clear previous suggestions

    if (cities.length === 0) {
        suggestionsDropdown.innerHTML = '<li>No city found</li>';
        return;
    }

    cities.forEach(city => {
        const cityName = city.display_name.split(",")[0]; // Extract only city name for API
        const fullLocation = city.display_name; // Display full location in the dropdown
        const suggestionItem = document.createElement('li');
        suggestionItem.textContent = fullLocation;
        suggestionItem.onclick = () => {
            document.getElementById('city-input').value = cityName; // Pass only city name to input
            suggestionsDropdown.innerHTML = ''; // Clear suggestions after selection
        };
        suggestionsDropdown.appendChild(suggestionItem);
    });
}

// Get weather data for the entered city and update the header
async function getWeather() {
    const city = document.getElementById('city-input').value;
    if (!city) {
        showError('Please enter a city name.');
        return;
    }

    showLoading(); // Show spinner when API call starts
    const coordinates = await getCoordinates(city);
    if (coordinates) {
        const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
        hideLoading(); // Hide spinner when API call finishes
        displayWeather(weatherData);
        updateCityHeader(city); // Update the city name in the header
    } else {
        hideLoading(); // Hide spinner in case of error
    }
}

// Get current location and update header with the city name
async function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading(); // Show spinner when fetching geolocation
        navigator.geolocation.getCurrentPosition(async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const weatherData = await getWeatherData(lat, lon);
            hideLoading(); // Hide spinner after getting location and weather

            // Fetch city name from coordinates (reverse geocoding) to update header
            const cityName = await getCityNameFromCoordinates(lat, lon);
            displayWeather(weatherData);
            updateCityHeader(cityName); // Update the city name in the header
        }, () => {
            hideLoading();
            showError('Unable to retrieve your location.');
        });
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Function to get city name from coordinates using Nominatim reverse geocoding
async function getCityNameFromCoordinates(lat, lon) {
    const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();
        return data.address.city || 'Your Location'; // Default if city is not found
    } catch (error) {
        console.error('Error fetching city name from coordinates:', error);
        return 'Your Location';
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

        let isRainyToday = false;
        let isCloudyToday = false;
        let isSunnyToday = false;

        // Set the background and icons based on today's weather
        const todayWeatherCondition = periods[0].shortForecast.toLowerCase(); // Get today's weather
        let todayIconClass = ''; // Default no class

        // Check for rain, chance of rain, and thunderstorms for today's condition only
        if (todayWeatherCondition.includes('cloudy')) {
            todayIconClass = 'cloudy-background'; // Cloudy background
            isCloudyToday = true;
        } else if (todayWeatherCondition.includes('rain') || todayWeatherCondition.includes('chance of rain') || todayWeatherCondition.includes('thunderstorm')) {
            todayIconClass = 'rainy-background'; // Rainy background
            isRainyToday = true;
            addRainAnimation(); // Add rain animation only if today has rain
        } else {
            todayIconClass = 'sunny-background'; // Sunny background
            isSunnyToday = true;
            removeRainAnimation(); // Remove rain animation if it's sunny or cloudy
        }

        // Apply today's background to the body
        document.body.className = todayIconClass;

        // Now populate weather for all periods (including today)
        periods.forEach(period => {
            const weatherCard = document.createElement('div');
            weatherCard.classList.add('weather-card');

            const weatherCondition = period.shortForecast.toLowerCase();
            let weatherIcon = 'fas fa-sun'; // Default to sunny icon
            let iconClass = ''; // Default no class

            // Check for rain, chance of rain, and thunderstorms
            if (weatherCondition.includes('cloudy')) {
                weatherIcon = 'fas fa-cloud';
                iconClass = 'cloudy-icon'; // Apply grey color for cloudy
            } else if (weatherCondition.includes('rain') || weatherCondition.includes('chance of rain') || weatherCondition.includes('thunderstorm')) {
                weatherIcon = 'fas fa-cloud-rain';
                iconClass = 'rainy-icon'; // Apply grey color for rain
            }

            const averageTemp = period.temperature;
            weatherCard.innerHTML = `
                <h2>${period.name}</h2>
                <i class="${weatherIcon} ${iconClass}"></i>
                <div class="temperature-average">Average: ${averageTemp}°F</div>
                <div class="details">${period.shortForecast}</div>
            `;

            weatherCardsContainer.appendChild(weatherCard);
        });

        // Ensure rain animation is removed if today's weather doesn't include rain
        if (!isRainyToday) {
            removeRainAnimation(); // Remove the rain animation
        }
    }
}

// Add rain animation to the page
function addRainAnimation() {
    if (!document.querySelector('.rain')) { // Check if rain animation already exists
        const rainDiv = document.createElement('div');
        rainDiv.classList.add('rain');
        document.body.appendChild(rainDiv);
    }
}

// Remove the rain animation if it exists
function removeRainAnimation() {
    const rainDiv = document.querySelector('.rain');
    if (rainDiv) {
        rainDiv.remove();
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
