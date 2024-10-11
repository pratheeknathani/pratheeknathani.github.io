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
        document.getElementById('weather-result').innerText = 'Error: Unable to fetch city coordinates.';
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
        document.getElementById('weather-result').innerText = 'Error: Unable to fetch weather data.';
        return null;
    }
}

async function getWeather() {
    const city = document.getElementById('city-input').value;
    if (!city) {
        document.getElementById('weather-result').innerText = 'Please enter a city name.';
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
        const weatherCondition = forecastData.properties.periods[0].shortForecast.toLowerCase();
        const weatherCard = document.querySelector('.weather-card');
        weatherCard.innerHTML = `
            <h2>${forecastData.properties.periods[0].name}</h2>
            <i class="fas fa-sun"></i> 
            <div class="temperature">${forecastData.properties.periods[0].temperature}°F</div>
            <div class="details">${forecastData.properties.periods[0].shortForecast}</div>
        `;

        if (weatherCondition.includes('sunny')) {
            document.body.className = 'sunny';
            document.querySelector('.fas').classList.replace('fa-sun', 'fa-sun');
        } else if (weatherCondition.includes('cloudy')) {
            document.body.className = 'cloudy';
            document.querySelector('.fas').classList.replace('fa-sun', 'fa-cloud');
        } else if (weatherCondition.includes('rain')) {
            document.body.className = 'rainy';
            document.querySelector('.fas').classList.replace('fa-sun', 'fa-cloud-rain');
        }
    } else {
        console.log('No weather data available');
    }
}
