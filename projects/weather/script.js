// Function to get latitude and longitude for a city using Nominatim API
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

// Function to get weather data from Weather.gov API
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

// Function to display the weather forecast
function displayWeather(forecastData) {
    if (forecastData) {
        let output = '<h3>Weather Forecast:</h3>';
        forecastData.properties.periods.forEach(period => {
            output += `<p>${period.name}: ${period.temperature}°F, ${period.shortForecast}</p>`;
        });
        document.getElementById('weather-result').innerHTML = output;
    }
}

// Main function to get weather by city
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
