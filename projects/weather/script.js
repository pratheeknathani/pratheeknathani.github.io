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
        alert('Please enter a city name.');
        return;
    }

    const coordinates = await getCoordinates(city);
    if (coordinates) {
        const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
        displayWeather(weatherData);
    }
}

function displayWeather(forecastData) {
    if (forecastData) {
        const periods = forecastData.properties.periods.slice(0, 5); // Get the first 5 periods (5-day forecast)
        const weatherCardsContainer = document.querySelector('.weather-cards-container');
        weatherCardsContainer.innerHTML = ''; // Clear any previous content

        let isRainy = false; // Track if any day includes rain

        periods.forEach(period => {
            const weatherCard = document.createElement('div');
            weatherCard.classList.add('weather-card');

            const weatherCondition = period.shortForecast.toLowerCase();
            console.log(`Detected weather condition: ${weatherCondition}`); // Debugging log

            let weatherIcon = 'fas fa-sun'; // Default to sunny icon

            if (weatherCondition.includes('cloudy')) {
                weatherIcon = 'fas fa-cloud';
            } else if (weatherCondition.includes('rain')) {
                weatherIcon = 'fas fa-cloud-rain';
                isRainy = true; // Set the flag if rain is detected
            }

            weatherCard.innerHTML = `
                <h2>${period.name}</h2>
                <i class="${weatherIcon}"></i>
                <div class="temperature">${period.temperature}°F</div>
                <div class="details">${period.shortForecast}</div>
            `;

            weatherCardsContainer.appendChild(weatherCard);
        });

        // Debugging logs to check if background class is applied
        if (isRainy) {
            console.log("Rain detected, applying rainy background");
            document.body.classList.add('rainy-background');
        } else {
            console.log("No rain detected, applying default background");
            document.body.classList.remove('rainy-background');
        }
    } else {
        console.log('No weather data available');
    }
}
