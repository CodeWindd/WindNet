document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    // Fetch default location weather at runtime
    window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
});

function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const panels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active-panel"));
            
            btn.classList.add("active");
            const targetId = btn.getAttribute("data-tab");
            document.getElementById(targetId).classList.add("active-panel");
        });
    });
}

/**
 * Weather Engine Coordinator
 * Dynamically queries NWS API if located in US context, otherwise triggers seamless global API fallbacks.
 */
window.fetchWeatherData = async function(lat, lon) {
    const loader = document.getElementById("weather-loader");
    loader.classList.remove("hidden");

    // Clear previous view metrics
    document.getElementById("current-city-name").textContent = window.currentLocation.name;
    document.getElementById("current-coordinates-subtext").textContent = `Lat: ${lat.toFixed(4)} | Lon: ${lon.toFixed(4)}`;

    try {
        // Step 1: Query NWS grid metadata points
        const nwsPointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
        const pointsRes = await fetch(nwsPointsUrl, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });
        
        if (!pointsRes.ok) {
            // Non-US Coordinate caught, fall back directly to global APIs
            throw new Error("Target coordinates reside outside US borders.");
        }
        
        const pointsData = await pointsRes.json();
        const forecastUrl = pointsData.properties.forecast;
        const forecastHourlyUrl = pointsData.properties.forecastHourly;
        
        // Fetch matching datasets from NWS endpoints
        const [forecastRes, forecastHourlyRes] = await Promise.all([
            fetch(forecastUrl),
            fetch(forecastHourlyUrl)
        ]);
        
        if (!forecastRes.ok || !forecastHourlyRes.ok) {
            throw new Error("NWS forecast stations reporting error, executing Open-Meteo fallback.");
        }

        const forecastData = await forecastRes.json();
        const hourlyData = await forecastHourlyRes.json();

        // Load NWS specific alerts
        fetchNWSAlerts(lat, lon);
        
        // Render panels from NWS standard formatting
        renderUSWeather(forecastData.properties.periods, hourlyData.properties.periods);
        updateRadarFrame(lat, lon);

    } catch (e) {
        console.warn(`${e.message} Directing to global geodatabase fallback.`);
        fetchGlobalFallback(lat, lon);
    } finally {
        loader.classList.add("hidden");
    }
};

/**
 * Secondary Global Weather Engine using Open-Meteo
 */
async function fetchGlobalFallback(lat, lon) {
    try {
        const queryUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        const res = await fetch(queryUrl);
        if (!res.ok) throw new Error("Fallback station down or invalid parameters.");
        
        const data = await res.json();
        renderGlobalWeather(data);
        updateRadarFrame(lat, lon);

        // Notify international context of alerts unavailability
        const alertsContainer = document.getElementById("nws-alerts-container");
        alertsContainer.innerHTML = "";
        alertsContainer.classList.add("hidden");

    } catch (err) {
        console.error("Critical rendering failure across all weather services", err);
        alert("Unable to reach meteorological servers. Check network interface.");
    }
}

/**
 * Fetch and display official US National Weather Service Alerts
 */
async function fetchNWSAlerts(lat, lon) {
    const container = document.getElementById("nws-alerts-container");
    container.innerHTML = "";
    container.classList.add("hidden");

    try {
        const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
            headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' }
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.features && data.features.length > 0) {
            container.classList.remove("hidden");
            data.features.forEach(feat => {
                const props = feat.properties;
                const el = document.createElement("div");
                el.className = "alert-pill";
                el.innerHTML = `
                    <h4>⚠️ ${props.event}</h4>
                    <p>${props.headline || "Active Warning Issued by NWS"}</p>
                `;
                container.appendChild(el);
            });
        }
    } catch (e) {
        console.log("Alert system query skipped:", e);
    }
}

/**
 * Render NWS (US-based) Data
 */
function renderUSWeather(dailyPeriods, hourlyPeriods) {
    const current = hourlyPeriods[0];
    
    // Core parameters mapping
    const temp = `${current.temperature}°${current.temperatureUnit}`;
    const desc = current.shortForecast;
    const isDay = current.isDaytime;
    const precipChance = current.probabilityOfPrecipitation?.value || 0;

    // Apply main rendering elements
    document.getElementById("current-temp").textContent = temp;
    document.getElementById("current-condition-desc").textContent = desc;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(desc, isDay, precipChance);

    // Apply Metric instrument values
    document.getElementById("metric-apparent").textContent = temp; 
    document.getElementById("metric-wind").textContent = `${current.windSpeed} (${current.windDirection})`;
    document.getElementById("metric-humidity").textContent = `${current.relativeHumidity?.value || "--"}%`;
    document.getElementById("metric-pressure").textContent = "-- inHg"; // NWS grid API limitation fallback
    document.getElementById("metric-precip").textContent = `${precipChance}%`;

    // Process astro visualizer cards
    document.getElementById("astro-sunrise").textContent = "Sunrise Card active";
    document.getElementById("astro-sunset").textContent = "Sunset Card active";
    document.getElementById("astro-sky").textContent = isDay ? "Daytime Skyline" : "Starry Skyline";

    // Build the dynamic textual summary
    generateInsight(desc, current.temperature, current.windSpeed, precipChance);

    // 2. 48-Hourly dynamic cards integration
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";
    hourlyPeriods.slice(0, 48).forEach(period => {
        const itemPrecip = period.probabilityOfPrecipitation?.value || 0;
        const timeStr = new Date(period.startTime).toLocaleTimeString([], { hour: 'numeric' });
        
        const card = document.createElement("div");
        card.className = "hourly-pill";
        card.innerHTML = `
            <span class="time">${timeStr}</span>
            <img class="hourly-icon" src="${window.getWeatherIcon(period.shortForecast, period.isDaytime, itemPrecip)}" alt="weather">
            <span class="temp">${period.temperature}°${period.temperatureUnit}</span>
            <span class="precip">${itemPrecip >= 20 ? '💧 ' + itemPrecip + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(card);
    });

    // 3. 7-Day & Night forecast integration
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";
    dailyPeriods.forEach(period => {
        const itemPrecip = period.probabilityOfPrecipitation?.value || 0;
        const row = document.createElement("div");
        row.className = "daily-row";
        row.innerHTML = `
            <span class="day-name">${period.name}</span>
            <span class="desc-part">
                <img src="${window.getWeatherIcon(period.shortForecast, period.isDaytime, itemPrecip)}" alt="icon">
                <span>${period.shortForecast}</span>
            </span>
            <span class="temp-range">${period.temperature}°${period.temperatureUnit}</span>
            <span class="precip">${itemPrecip >= 20 ? '💧 ' + itemPrecip + '%' : ''}</span>
        `;
        dailyContainer.appendChild(row);
    });
}

/**
 * Render Open-Meteo (Global Context) Data
 */
function renderGlobalWeather(data) {
    const cur = data.current;
    const wCodeDesc = getWmoInterpretation(cur.weather_code);
    const isDay = cur.is_day === 1;

    // Apply primary components
    document.getElementById("current-temp").textContent = `${Math.round(cur.temperature_2m)}°F`;
    document.getElementById("current-condition-desc").textContent = wCodeDesc;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(wCodeDesc, isDay, 0);

    // Instrument parameters mapping
    document.getElementById("metric-apparent").textContent = `${Math.round(cur.apparent_temperature)}°F`;
    document.getElementById("metric-wind").textContent = `${cur.wind_speed_10m} mph`;
    document.getElementById("metric-humidity").textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById("metric-pressure").textContent = `${(cur.surface_pressure * 0.02953).toFixed(2)} inHg`;
    document.getElementById("metric-precip").textContent = `${data.hourly.precipitation_probability[0]}%`;

    // Process astro elements
    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById("astro-sunrise").textContent = formatTime(data.daily.sunrise[0]);
    document.getElementById("astro-sunset").textContent = formatTime(data.daily.sunset[0]);
    document.getElementById("astro-sky").textContent = isDay ? "Daytime Skyline" : "Starry Skyline";

    // Textual summary processor
    generateInsight(wCodeDesc, cur.temperature_2m, cur.wind_speed_10m, data.hourly.precipitation_probability[0]);

    // Construct 48 Hourly view from global fallback
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";
    for (let i = 0; i < 48; i++) {
        const hTimeStr = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: 'numeric' });
        const hCode = data.hourly.weather_code[i];
        const hDesc = getWmoInterpretation(hCode);
        const hPrecip = data.hourly.precipitation_probability[i];
        const hTemp = Math.round(data.hourly.temperature_2m[i]);

        const card = document.createElement("div");
        card.className = "hourly-pill";
        card.innerHTML = `
            <span class="time">${hTimeStr}</span>
            <img class="hourly-icon" src="${window.getWeatherIcon(hDesc, true, hPrecip)}" alt="weather">
            <span class="temp">${hTemp}°F</span>
            <span class="precip">${hPrecip >= 20 ? '💧 ' + hPrecip + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(card);
    }

    // Construct daily views from global fallback
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";
    for (let i = 0; i < data.daily.time.length; i++) {
        const dDate = new Date(data.daily.time[i] + 'T00:00:00');
        const dName = dDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dCode = data.daily.weather_code[i];
        const dDesc = getWmoInterpretation(dCode);
        const maxT = Math.round(data.daily.temperature_2m_max[i]);
        const minT = Math.round(data.daily.temperature_2m_min[i]);

        const row = document.createElement("div");
        row.className = "daily-row";
        row.innerHTML = `
            <span class="day-name">${dName}</span>
            <span class="desc-part">
                <img src="${window.getWeatherIcon(dDesc, true, 0)}" alt="icon">
                <span>${dDesc}</span>
            </span>
            <span class="temp-range">${maxT}° / ${minT}°F</span>
            <span class="precip">--</span>
        `;
        dailyContainer.appendChild(row);
    }
}

/**
 * Builds custom textual synthesis based on localized observations
 */
function generateInsight(desc, temp, wind, precip) {
    let insight = `Atmospheric diagnostic features confirm a ${desc.toLowerCase()} layout today. `;
    if (temp < 40) insight += "Frigid temperatures command standard protective winter gear. ";
    else if (temp > 85) insight += "Elevated thermals present warm dynamics. Hydration cycles recommended. ";
    else insight += "Mild thermal behavior present across the locale. ";

    if (precip >= 50) {
        insight += "Precipitation chances are elevated. An umbrella instrument is advised for outdoors transit.";
    } else if (precip >= 20) {
        insight += "Low-level vapor profiles indicate isolated moisture possibilities. Keep an eye out.";
    } else {
        insight += "Dry ground-level moisture conditions expected.";
    }

    document.getElementById("weather-insight-text").textContent = insight;
}

/**
 * Loads dynamic interactive global rain/radar frame
 */
function updateRadarFrame(lat, lon) {
    const frame = document.getElementById("radar-iframe");
    // Secure interactive global view from RainViewer platform
    frame.src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&o=1&t=1&m=1&p=1&v=1&c=1&g=0&s=1`;
}

/**
 * Normalizes Open-Meteo (WMO) codes into standard English labels
 */
function getWmoInterpretation(code) {
    const wmo = {
        0: "Clear Sky",
        1: "Partly Cloudy", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Fog Night",
        51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
        61: "Rain Showers", 63: "Rain", 65: "Heavy Rain",
        71: "Snow Showers", 73: "Snow", 75: "Heavy Snow",
        77: "Sleet",
        80: "Rain Showers", 81: "Rain", 82: "Violent Rain Showers",
        85: "Snow Showers", 86: "Heavy Snow Showers",
        95: "Thunderstorms", 96: "Thunderstorms Day Rain", 99: "Thunderstorms Night Rain"
    };
    return wmo[code] || "Clear Sky";
}