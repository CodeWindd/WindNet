document.addEventListener("DOMContentLoaded", () => {
    initTabs();
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
 * Main weather coordinator.
 * Tries NWS Station observations first for live, accurate data.
 */
window.fetchWeatherData = async function(lat, lon) {
    const loader = document.getElementById("weather-loader");
    loader.classList.remove("hidden");

    document.getElementById("current-city-name").textContent = window.currentLocation.name;
    document.getElementById("current-coordinates-subtext").textContent = `Lat: ${lat.toFixed(4)} | Lon: ${lon.toFixed(4)}`;

    try {
        // Query NWS point directory metadata
        const pointRes = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, {
            headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' }
        });
        
        if (!pointRes.ok) {
            throw new Error("Coordinate located outside US boundaries.");
        }
        
        const pointData = await pointRes.json();
        const forecastUrl = pointData.properties.forecast;
        const forecastHourlyUrl = pointData.properties.forecastHourly;
        const stationsUrl = pointData.properties.observationStations;

        // Fetch METAR observation station lists
        const stationsRes = await fetch(stationsUrl, {
            headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' }
        });
        const stationsData = await stationsRes.json();
        const nearestStationUrl = stationsData.features[0].id; // Primary local airport METAR station

        // Fetch real-time METAR observations to prevent forecast mismatches
        const obsRes = await fetch(`${nearestStationUrl}/observations/latest`, {
            headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' }
        });
        
        if (!obsRes.ok) {
            throw new Error("METAR active observation stations unreachable.");
        }
        const obsData = await obsRes.json();
        const obsProps = obsData.properties;

        // Fetch daily & hourly datasets
        const [forecastRes, hourlyRes] = await Promise.all([
            fetch(forecastUrl),
            fetch(forecastHourlyUrl)
        ]);

        if (!forecastRes.ok || !hourlyRes.ok) {
            throw new Error("NWS grid projections returned empty records.");
        }

        const forecastData = await forecastRes.json();
        const hourlyData = await hourlyRes.json();

        fetchNWSAlerts(lat, lon);
        renderNWSWeather(obsProps, forecastData.properties.periods, hourlyData.properties.periods);
        updateRadarFrame(lat, lon);

    } catch (e) {
        console.warn(`${e.message} Loading Open-Meteo fallback.`);
        fetchGlobalFallback(lat, lon);
    } finally {
        loader.classList.add("hidden");
    }
};

/**
 * Render NWS layout elements
 */
function renderNWSWeather(obs, dailyPeriods, hourlyPeriods) {
    const currentHour = hourlyPeriods[0];
    
    // Convert temperature readings
    const tempF = obs.temperature.value ? `${Math.round((obs.temperature.value * 9/5) + 32)}°` : `${currentHour.temperature}°`;
    const desc = obs.textDescription || currentHour.shortForecast;
    const isDay = currentHour.isDaytime;
    const precipChance = currentHour.probabilityOfPrecipitation?.value || 0;

    const todayPeriod = dailyPeriods[0];
    const tonightPeriod = dailyPeriods[1];
    const highVal = todayPeriod.isDaytime ? todayPeriod.temperature : currentHour.temperature;
    const lowVal = tonightPeriod ? tonightPeriod.temperature : "--";

    document.getElementById("current-temp").textContent = tempF;
    document.getElementById("current-condition-desc").textContent = desc;
    document.getElementById("current-high-low").textContent = `H: ${highVal}° L: ${lowVal}°`;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(desc, isDay, precipChance);

    // Apply Instruments metrics
    document.getElementById("metric-apparent").textContent = currentHour.temperature ? `${currentHour.temperature}°F` : tempF;
    const windSpeedMph = obs.windSpeed.value ? `${Math.round(obs.windSpeed.value * 0.621371)} mph` : `${currentHour.windSpeed}`;
    document.getElementById("metric-wind").textContent = windSpeedMph;
    document.getElementById("metric-humidity").textContent = obs.relativeHumidity.value ? `${Math.round(obs.relativeHumidity.value)}%` : `${currentHour.relativeHumidity?.value || "--"}%`;
    
    const pressureIn = obs.barometricPressure.value ? `${(obs.barometricPressure.value * 0.0002953).toFixed(2)} inHg` : "-- inHg";
    document.getElementById("metric-pressure").textContent = pressureIn;
    document.getElementById("metric-precip").textContent = `${precipChance}%`;

    document.getElementById("astro-sunrise").textContent = "Sunrise Active";
    document.getElementById("astro-sunset").textContent = "Sunset Active";
    document.getElementById("astro-sky").textContent = isDay ? "Standard Skies" : "Night Skies";

    generateInsight(desc, parseInt(tempF), windSpeedMph, precipChance);

    // Render 48-hour strip
    renderHourlyCards(hourlyPeriods);

    // Render 7-day vertical table
    renderDailyCards(dailyPeriods);
}

/**
 * Parse and populate the 48-Hour horizontally scrolling list
 */
function renderHourlyCards(periods) {
    const container = document.getElementById("hourly-cards-wrapper");
    container.innerHTML = "";
    periods.slice(0, 48).forEach(period => {
        const pChance = period.probabilityOfPrecipitation?.value || 0;
        const timeLabel = new Date(period.startTime).toLocaleTimeString([], { hour: 'numeric' });
        
        const card = document.createElement("div");
        card.className = "pixel-hourly-item";
        card.innerHTML = `
            <span>${timeLabel}</span>
            <img src="${window.getWeatherIcon(period.shortForecast, period.isDaytime, pChance)}" alt="">
            <span class="temp">${period.temperature}°</span>
            <span class="precip">${pChance >= 20 ? '💧 ' + pChance + '%' : ''}</span>
        `;
        container.appendChild(card);
    });
}

/**
 * Parse and populate the 7-day vertical scrolling list
 */
function renderDailyCards(periods) {
    const container = document.getElementById("daily-cards-wrapper");
    container.innerHTML = "";
    
    // Compile day vs night values to build beautiful, concise rows
    const merged = [];
    for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        if (p.isDaytime) {
            const next = periods[i + 1];
            merged.push({
                name: p.name,
                desc: p.shortForecast,
                isDay: true,
                high: p.temperature,
                low: next ? next.temperature : "--",
                precip: p.probabilityOfPrecipitation?.value || 0
            });
            if (next) i++; 
        } else {
            merged.push({
                name: p.name,
                desc: p.shortForecast,
                isDay: false,
                high: p.temperature,
                low: "--",
                precip: p.probabilityOfPrecipitation?.value || 0
            });
        }
    }

    merged.forEach(item => {
        const row = document.createElement("div");
        row.className = "pixel-daily-row";
        row.innerHTML = `
            <span class="day-name">${item.name}</span>
            <span class="desc">
                <img src="${window.getWeatherIcon(item.desc, item.isDay, item.precip)}" alt="">
                <span>${item.desc}</span>
            </span>
            <span class="temp-range">${item.high}° / ${item.low}°</span>
            <span class="precip">${item.precip >= 20 ? '💧 ' + item.precip + '%' : ''}</span>
        `;
        container.appendChild(row);
    });
}

/**
 * Fallback to Open-Meteo for international cities
 */
async function fetchGlobalFallback(lat, lon) {
    try {
        const queryUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        const res = await fetch(queryUrl);
        if (!res.ok) throw new Error("Fallback APIs are offline.");
        
        const data = await res.json();
        renderGlobalWeather(data);
        updateRadarFrame(lat, lon);

        const alertsContainer = document.getElementById("nws-alerts-container");
        alertsContainer.innerHTML = "";
        alertsContainer.classList.add("hidden");
    } catch (e) {
        console.error("Metereological grid completely unreachable.", e);
    }
}

function renderGlobalWeather(data) {
    const cur = data.current;
    const desc = getWmoInterpretation(cur.weather_code);
    const isDay = cur.is_day === 1;
    const temp = `${Math.round(cur.temperature_2m)}°`;

    document.getElementById("current-temp").textContent = temp;
    document.getElementById("current-condition-desc").textContent = desc;
    document.getElementById("current-high-low").textContent = `H: ${Math.round(data.daily.temperature_2m_max[0])}° L: ${Math.round(data.daily.temperature_2m_min[0])}°`;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(desc, isDay, 0);

    // Apply Instruments metrics
    document.getElementById("metric-apparent").textContent = `${Math.round(cur.apparent_temperature)}°F`;
    document.getElementById("metric-wind").textContent = `${cur.wind_speed_10m} mph`;
    document.getElementById("metric-humidity").textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById("metric-pressure").textContent = `${(cur.surface_pressure * 0.02953).toFixed(2)} inHg`;
    document.getElementById("metric-precip").textContent = `${data.hourly.precipitation_probability[0]}%`;

    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById("astro-sunrise").textContent = formatTime(data.daily.sunrise[0]);
    document.getElementById("astro-sunset").textContent = formatTime(data.daily.sunset[0]);
    document.getElementById("astro-sky").textContent = isDay ? "Daytime skies" : "Nighttime skies";

    generateInsight(desc, cur.temperature_2m, cur.wind_speed_10m, data.hourly.precipitation_probability[0]);

    // Populate hourly list
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";
    for (let i = 0; i < 48; i++) {
        const timeLabel = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: 'numeric' });
        const hCode = data.hourly.weather_code[i];
        const hDesc = getWmoInterpretation(hCode);
        const hPrecip = data.hourly.precipitation_probability[i];
        const hTemp = Math.round(data.hourly.temperature_2m[i]);

        const card = document.createElement("div");
        card.className = "pixel-hourly-item";
        card.innerHTML = `
            <span>${timeLabel}</span>
            <img src="${window.getWeatherIcon(hDesc, true, hPrecip)}" alt="">
            <span class="temp">${hTemp}°</span>
            <span class="precip">${hPrecip >= 20 ? '💧 ' + hPrecip + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(card);
    }

    // Populate 7-day list
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";
    for (let i = 0; i < data.daily.time.length; i++) {
        const dDate = new Date(data.daily.time[i] + 'T00:00:00');
        const dayLabel = dDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dCode = data.daily.weather_code[i];
        const dDesc = getWmoInterpretation(dCode);
        const high = Math.round(data.daily.temperature_2m_max[i]);
        const low = Math.round(data.daily.temperature_2m_min[i]);

        const row = document.createElement("div");
        row.className = "pixel-daily-row";
        row.innerHTML = `
            <span class="day-name">${dayLabel}</span>
            <span class="desc">
                <img src="${window.getWeatherIcon(dDesc, true, 0)}" alt="">
                <span>${dDesc}</span>
            </span>
            <span class="temp-range">${high}° / ${low}°</span>
            <span class="precip">--</span>
        `;
        dailyContainer.appendChild(row);
    }
}

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
        console.log("Alert lookup skipped.");
    }
}

function generateInsight(desc, temp, wind, precip) {
    let insight = `Atmospheric measurements identify ${desc.toLowerCase()} layout today. `;
    if (temp < 40) insight += "Frigid parameters indicate standard cold-weather gear is recommended. ";
    else if (temp > 85) insight += "Hot thermal index. Hydration cycles advised. ";
    else insight += "Mild temperature conditions observed across this area. ";

    if (precip >= 50) {
        insight += "Active precipitation likely. Keep an umbrella close by.";
    } else if (precip >= 20) {
        insight += "Isolated moisture events possible.";
    } else {
        insight += "Clear ground moisture profiles expected.";
    }

    document.getElementById("weather-insight-text").textContent = insight;
}

function updateRadarFrame(lat, lon) {
    const frame = document.getElementById("radar-iframe");
    frame.src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&o=1&t=1&m=1&p=1&v=1&c=1&g=0&s=1`;
}

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