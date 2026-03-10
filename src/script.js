

const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

const WMO_TEXT = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail'
};

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

//  Quick City Buttons 

const quickCities = ['Mumbai', 'London', 'New York', 'Tokyo', 'Dubai', 'Sydney'];

const quickCitiesContainer = document.getElementById('quickCities');

quickCities.forEach(city => {
  const btn = document.createElement('button');
  btn.textContent = city;
  btn.className = 'text-xs px-3 py-1 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-blue-400/50 hover:bg-blue-400/10 transition-all duration-200 cursor-pointer';
  btn.onclick = () => {
    document.getElementById('cityInput').value = city;
    fetchWeather();
  };
  quickCitiesContainer.appendChild(btn);
});

//  Generate Stars 

const starsContainer = document.getElementById('stars');

for (let i = 0; i < 80; i++) {
  const star = document.createElement('div');
  star.className = 'star';
  const size = Math.random() * 2 + 1;
  star.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    top: ${Math.random() * 100}%;
    left: ${Math.random() * 100}%;
    --d: ${(Math.random() * 3 + 2).toFixed(1)}s;
    animation-delay: ${(Math.random() * 5).toFixed(1)}s;
  `;
  starsContainer.appendChild(star);
}

function show(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  if (id === 'loadingEl') el.style.display = 'flex';
}

// hide()
function hide(id) {
  const el = document.getElementById(id);
  el.classList.add('hidden');
  el.style.display = '';
}

// Convert wind degrees to compass direction
function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// Format a Date object to 12hr time string
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Main Fetch Function 

async function fetchWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;

  // Reset UI
  hide('weatherCard');
  hide('errorEl');
  show('loadingEl');
  document.getElementById('loadingEl').style.display = 'flex';

  try {
    // Get coordinates from city name (Geocoding API)
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes  = await fetch(geoURL);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found');
    }

    const { name, country, latitude, longitude, timezone } = geoData.results[0];

    // Get weather data using coordinates (Weather API)
    const weatherURL = `https://api.open-meteo.com/v1/forecast?`
      + `latitude=${latitude}&longitude=${longitude}`
      + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max`
      + `&timezone=${encodeURIComponent(timezone)}&forecast_days=7`;

    const weatherRes  = await fetch(weatherURL);
    const weatherData = await weatherRes.json();

    const current = weatherData.current;
    const daily   = weatherData.daily;

    //  Populate UI 

    // City + Country
    document.getElementById('cityName').textContent = `${name}, ${country}`;

    // Temperature
    document.getElementById('tempDisplay').textContent = `${Math.round(current.temperature_2m)}°`;

    // Weather condition text and icon
    document.getElementById('conditionText').textContent = WMO_TEXT[current.weather_code] || 'Unknown';
    document.getElementById('weatherIcon').textContent   = WMO_ICON[current.weather_code] || '🌡️';

    // Feels like
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(current.apparent_temperature)}°C`;

    // High / Low
    document.getElementById('tempHigh').textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
    document.getElementById('tempLow').textContent  = `${Math.round(daily.temperature_2m_min[0])}°`;

    // Humidity
    const humidity = current.relative_humidity_2m;
    document.getElementById('humidityVal').textContent  = `${humidity}%`;
    document.getElementById('humidityDesc').textContent = humidity < 40 ? 'Dry' : humidity < 70 ? 'Comfortable' : 'Humid';

    // Wind
    document.getElementById('windVal').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('windDir').textContent = degToCompass(current.wind_direction_10m);

    // Visibility
    const vis = current.visibility / 1000; // metres → km
    document.getElementById('visibilityVal').textContent  = `${vis.toFixed(1)} km`;
    document.getElementById('visibilityDesc').textContent = vis > 10 ? 'Excellent' : vis > 5 ? 'Good' : vis > 2 ? 'Moderate' : 'Poor';

    // Pressure
    const pressure = Math.round(current.surface_pressure);
    document.getElementById('pressureVal').textContent  = `${pressure} hPa`;
    document.getElementById('pressureDesc').textContent = pressure > 1013 ? 'High pressure' : 'Low pressure';

    // UV Index
    const uv = daily.uv_index_max[0];
    document.getElementById('uvValue').textContent      = uv.toFixed(1);
    document.getElementById('uvIndicator').style.left   = `${Math.min((uv / 12) * 100, 97)}%`;

    // Sunrise & Sunset
    document.getElementById('sunriseVal').textContent = formatTime(new Date(daily.sunrise[0]));
    document.getElementById('sunsetVal').textContent  = formatTime(new Date(daily.sunset[0]));

    // Date & Local Time
    const now = new Date();
    document.getElementById('dateStr').textContent  = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    document.getElementById('localTime').textContent = `Local: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    // 7-Day Forecast
    const forecastRow = document.getElementById('forecastRow');
    forecastRow.innerHTML = '';

    daily.weather_code.forEach((code, i) => {
      const dayLabel = i === 0 ? 'Today' : DAYS[new Date(daily.time[i]).getDay()];
      const item = document.createElement('div');
      item.className = 'forecast-item' + (i === 0 ? ' active' : '');
      item.innerHTML = `
        <p style="font-size:0.7rem;color:rgba(255,255,255,0.5);margin-bottom:6px;font-weight:500;">${dayLabel}</p>
        <p style="font-size:1.6rem;margin-bottom:6px;">${WMO_ICON[code] || '🌡️'}</p>
        <p style="color:white;font-weight:700;font-size:0.9rem;">${Math.round(daily.temperature_2m_max[i])}°</p>
        <p style="color:rgba(255,255,255,0.4);font-size:0.75rem;">${Math.round(daily.temperature_2m_min[i])}°</p>
      `;
      forecastRow.appendChild(item);
    });

    // Show the card
    hide('loadingEl');
    show('weatherCard');

  } catch (error) {
    console.error('Weather fetch error:', error);
    hide('loadingEl');
    show('errorEl');
  }
}

// Enter Key Support

document.getElementById('cityInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    fetchWeather();
  }
});

// Page Load

window.onload = function () {
  document.getElementById('cityInput').value = 'Mumbai';
  fetchWeather();
};