/* ==========================================================================
   WINDYWEATHER MASTER ENGINE MODULE
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initAppTabs();
    
    // Initial fetch for the default location
    window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
});

/**
 * Tab Navigation Handler
 */
function initAppTabs() {
    const tabs = document.querySelectorAll(".pixel-tab-chip");
    const panels = document.querySelectorAll(".viewport-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active-panel"));

            tab.classList.add("active");
            const targetId = tab.getAttribute("data-tab");
            document.getElementById(targetId).classList.add("active-panel");
        });
    });
}

/**
 * Astronomical Solar Calculator Engine
 * Solves the 6:00 PM sunset bug by determining real solar altitude.
 */
function isDaytimeAstronomical(lat, lon, targetDate) {
    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const decimalHour = hours + (minutes / 60);

    // Day of the year
    const start = new Date(targetDate.getFullYear(), 0, 0);
    const diff = targetDate - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Local standard time meridian
    const timezoneOffsetHours = -targetDate.getTimezoneOffset() / 60;
    
    // Fractional Year
    const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + ((decimalHour - 12) / 24));
    
    // Equation of Time (minutes)
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    
    // Solar Declination Angle (radians)
    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

    // Time offset (minutes)
    const timeOffset = eqtime + 4 * lon - 60 * timezoneOffsetHours;
    
    // True Solar Time
    const tst = decimalHour * 60 + timeOffset;
    
    // Hour Angle (degrees)
    const ha = (tst / 4) - 180;
    const haRad = ha * Math.PI / 180;
    const latRad = lat * Math.PI / 180;

    // Solar Elevation Angle
    const sinEl = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
    const elevationRad = Math.asin(sinEl);
    const elevationDeg = elevationRad * 180 / Math.PI;

    // Sun is above the horizon if solar altitude is > -0.83 degrees
    return elevationDeg > -0.83;
}

/**
 * Primary Weather Dispatcher
 */
window.fetchWeatherData = async function(lat, lon) {
    const loader = document.getElementById("weather-loader");
    loader.classList.remove("hidden");

    // Clear alerts first
    document.getElementById("nws-alerts-container").innerHTML = "";
    document.getElementById("nws-alerts-container").classList.add("hidden");

    document.getElementById("current-city-name").textContent = window.currentLocation.name;
    document.getElementById("current-coordinates-subtext").textContent = `Latitude: ${lat.toFixed(4)} | Longitude: ${lon.toFixed(4)}`;

    try {
        // Query NWS points for US metadata
        const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
        const pointsRes = await fetch(pointsUrl, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });

        if (!pointsRes.ok) {
            throw new Error("Location outside US borders. Switching to Open-Meteo.");
        }

        const pointsData = await pointsRes.json();
        const stationsUrl = pointsData.properties.observationStations;
        const forecastUrl = pointsData.properties.forecast;
        const forecastHourlyUrl = pointsData.properties.forecastHourly;

        // Fetch station list, forecasts, and active alerts
        const [stationsRes, forecastRes, forecastHourlyRes] = await Promise.all([
            fetch(stationsUrl, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } }),
            fetch(forecastUrl),
            fetch(forecastHourlyUrl)
        ]);

        if (!stationsRes.ok || !forecastRes.ok || !forecastHourlyRes.ok) {
            throw new Error("NWS forecast data unavailable. Switching to fallback.");
        }

        const stationsData = await stationsRes.json();
        const forecastData = await forecastRes.json();
        const forecastHourlyData = await forecastHourlyRes.json();

        // Retrieve real-time metrics from the closest station
        let currentConditions = null;
        if (stationsData.features && stationsData.features.length > 0) {
            const primaryStationUrl = stationsData.features[0].id;
            try {
                const obsRes = await fetch(`${primaryStationUrl}/observations/latest`, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });
                if (obsRes.ok) {
                    const obsData = await obsRes.json();
                    currentConditions = obsData.properties;
                }
            } catch (obsErr) {
                console.warn("Failed to retrieve current station observations. Using hourly forecasts instead.", obsErr);
            }
        }

        fetchNWSAlerts(lat, lon);
        renderUSWeather(forecastData.properties.periods, forecastHourlyData.properties.periods, currentConditions, lat, lon);
        updateRadarFrame(lat, lon);

    } catch (err) {
        console.warn(err.message);
        fetchGlobalFallback(lat, lon);
    } finally {
        loader.classList.add("hidden");
    }
};

/**
 * Fetch and display active NWS alerts
 */
async function fetchNWSAlerts(lat, lon) {
    const container = document.getElementById("nws-alerts-container");
    container.innerHTML = "";

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
                el.className = "alert-item-box";
                el.innerHTML = `
                    <span class="alert-warning-symbol">⚠️</span>
                    <div class="alert-body">
                        <h4>${props.event}</h4>
                        <p>${props.headline || "Active Warning Issued by NWS"}</p>
                    </div>
                `;
                container.appendChild(el);
            });
        }
    } catch (e) {
        console.warn("NWS alerts skipped:", e);
    }
}

/**
 * Process and Render US Datasets
 */
function renderUSWeather(dailyPeriods, hourlyPeriods, currentConditions, lat, lon) {
    const hourlyNow = hourlyPeriods[0];
    const isDay = isDaytimeAstronomical(lat, lon, new Date());

    // Fall back to hourly forecast if station observation is unavailable
    let tempF = hourlyNow.temperature;
    let textDescription = hourlyNow.shortForecast;
    let humidityVal = hourlyNow.relativeHumidity?.value || 50;
    let windSpeedString = `${hourlyNow.windSpeed}`;
    let baroInches = 29.92;

    if (currentConditions) {
        if (currentConditions.temperature && currentConditions.temperature.value !== null) {
            tempF = Math.round((currentConditions.temperature.value * 9/5) + 32);
        }
        if (currentConditions.textDescription) {
            textDescription = currentConditions.textDescription;
        }
        if (currentConditions.relativeHumidity && currentConditions.relativeHumidity.value !== null) {
            humidityVal = Math.round(currentConditions.relativeHumidity.value);
        }
        if (currentConditions.windSpeed && currentConditions.windSpeed.value !== null) {
            const mph = Math.round(currentConditions.windSpeed.value * 2.23694);
            windSpeedString = `${mph} mph`;
        }
        if (currentConditions.barometricPressure && currentConditions.barometricPressure.value !== null) {
            baroInches = (currentConditions.barometricPressure.value / 3386.39).toFixed(2);
        }
    }

    // Dynamic UI styling for hero metrics
    document.getElementById("current-temp").textContent = `${tempF}°`;
    document.getElementById("current-condition-desc").textContent = textDescription;
    
    const precipChance = hourlyNow.probabilityOfPrecipitation?.value || 0;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(textDescription, isDay, precipChance);

    // Handle high/low displays
    let todayHigh = "--°";
    let todayLow = "--°";
    if (dailyPeriods && dailyPeriods.length > 0) {
        todayHigh = `${dailyPeriods[0].temperature}°`;
        todayLow = dailyPeriods[1] ? `${dailyPeriods[1].temperature}°` : "--°";
    }
    document.getElementById("hero-temp-high").textContent = `H: ${todayHigh}`;
    document.getElementById("hero-temp-low").textContent = `L: ${todayLow}`;

    // Apply dashboard card values
    document.getElementById("metric-apparent").textContent = `${tempF}°F`;
    document.getElementById("apparent-eval").textContent = tempF < 50 ? "Cool index" : "Standard Index";
    
    document.getElementById("metric-wind").textContent = windSpeedString;
    document.getElementById("wind-direction-text").textContent = `Direction: ${hourlyNow.windDirection || 'N'}`;

    document.getElementById("metric-humidity").textContent = `${humidityVal}%`;
    document.getElementById("humidity-dewpoint").textContent = `Dewpoint: ${Math.round(tempF - ((100 - humidityVal) / 5))}°`;

    document.getElementById("metric-pressure").textContent = `${baroInches} inHg`;
    document.getElementById("metric-precip").textContent = `${precipChance}%`;

    // Process solar curves
    const calculatedSunrise = new Date();
    calculatedSunrise.setHours(6, 0, 0); 
    const calculatedSunset = new Date();
    calculatedSunset.setHours(20, 0, 0); 

    document.getElementById("astro-sunrise").textContent = "06:00 AM";
    document.getElementById("astro-sunset").textContent = "08:00 PM";
    drawSolarArcSvg(calculatedSunrise, calculatedSunset);

    // Build meteorological insight
    buildInsightText(textDescription, tempF, windSpeedString, precipChance);

    // Build the 48-hour horizontal scroll cards
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";
    
    hourlyPeriods.slice(0, 48).forEach(period => {
        const itemPrecip = period.probabilityOfPrecipitation?.value || 0;
        const targetDate = new Date(period.startTime);
        const colIsDay = isDaytimeAstronomical(lat, lon, targetDate);
        const timeStr = targetDate.toLocaleTimeString([], { hour: 'numeric' });

        const card = document.createElement("div");
        card.className = "hourly-scroll-column";
        card.innerHTML = `
            <span class="hourly-hour-text">${timeStr}</span>
            <img class="hourly-icon-gfx" src="${window.getWeatherIcon(period.shortForecast, colIsDay, itemPrecip)}" alt="weather">
            <span class="hourly-temp-value">${period.temperature}°</span>
            <span class="hourly-precip-value">${itemPrecip >= 20 ? itemPrecip + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(card);
    });

    // Build the 7-day outlook using horizontal range visualizers
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";

    // Extract weekly min/max range for the slider scaling
    let absoluteMin = 100;
    let absoluteMax = -100;
    dailyPeriods.forEach(p => {
        if (p.temperature < absoluteMin) absoluteMin = p.temperature;
        if (p.temperature > absoluteMax) absoluteMax = p.temperature;
    });

    // Pair daytime and nighttime forecasts for clean daily rows
    const groupedDays = [];
    for (let i = 0; i < dailyPeriods.length; i++) {
        const period = dailyPeriods[i];
        if (period.isDaytime) {
            groupedDays.push({
                day: period,
                night: dailyPeriods[i + 1] || null
            });
            i++; 
        } else {
            groupedDays.push({
                day: null,
                night: period
            });
        }
    }

    groupedDays.forEach(group => {
        const primary = group.day || group.night;
        const label = primary.name;
        const iconSrc = window.getWeatherIcon(primary.shortForecast, true, primary.probabilityOfPrecipitation?.value || 0);

        const highTemp = group.day ? group.day.temperature : primary.temperature;
        const lowTemp = group.night ? group.night.temperature : primary.temperature;

        // Map range margins as percentages for the visual slider
        const totalSpan = absoluteMax - absoluteMin || 1;
        const leftPercent = Math.max(0, Math.min(100, ((lowTemp - absoluteMin) / totalSpan) * 100));
        const widthPercent = Math.max(5, Math.min(100, ((highTemp - lowTemp) / totalSpan) * 100));

        const row = document.createElement("div");
        row.className = "daily-outlook-row";
        row.innerHTML = `
            <span class="day-title-label">${label}</span>
            <img class="day-weather-ico" src="${iconSrc}" alt="Daily Icon">
            <span class="day-precip-label">${primary.probabilityOfPrecipitation?.value >= 20 ? primary.probabilityOfPrecipitation.value + '%' : ''}</span>
            <span class="bar-min-lbl">${lowTemp}°</span>
            <div class="temp-slider-visual-track">
                <div class="active-range-fill-track" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
            </div>
            <span class="bar-max-lbl">${highTemp}°</span>
        `;
        dailyContainer.appendChild(row);
    });

    applyDynamicThemeColor(textDescription, isDay);
}

/**
 * Fallback to Open-Meteo for non-US coordinates
 */
async function fetchGlobalFallback(lat, lon) {
    try {
        const queryUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        const res = await fetch(queryUrl);
        if (!res.ok) throw new Error("Fallback servers offline.");

        const data = await res.json();
        renderGlobalWeather(data, lat, lon);

    } catch (e) {
        console.error("No data sources are currently reachable:", e);
    }
}

/**
 * Process and Render Global Fallback Data
 */
function renderGlobalWeather(data, lat, lon) {
    const cur = data.current;
    const desc = getWmoInterpretation(cur.weather_code);
    const isDay = cur.is_day === 1;

    const tempF = Math.round(cur.temperature_2m);
    document.getElementById("current-temp").textContent = `${tempF}°`;
    document.getElementById("current-condition-desc").textContent = desc;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(desc, isDay, 0);

    const maxT = Math.round(data.daily.temperature_2m_max[0]);
    const minT = Math.round(data.daily.temperature_2m_min[0]);
    document.getElementById("hero-temp-high").textContent = `H: ${maxT}°`;
    document.getElementById("hero-temp-low").textContent = `L: ${minT}°`;

    document.getElementById("metric-apparent").textContent = `${Math.round(cur.apparent_temperature)}°F`;
    document.getElementById("metric-wind").textContent = `${cur.wind_speed_10m} mph`;
    document.getElementById("metric-humidity").textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById("metric-pressure").textContent = `${(cur.surface_pressure * 0.02953).toFixed(2)} inHg`;
    document.getElementById("metric-precip").textContent = `${data.hourly.precipitation_probability[0]}%`;

    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunriseStr = formatTime(data.daily.sunrise[0]);
    const sunsetStr = formatTime(data.daily.sunset[0]);

    document.getElementById("astro-sunrise").textContent = sunriseStr;
    document.getElementById("astro-sunset").textContent = sunsetStr;
    drawSolarArcSvg(new Date(data.daily.sunrise[0]), new Date(data.daily.sunset[0]));

    buildInsightText(desc, tempF, `${cur.wind_speed_10m} mph`, data.hourly.precipitation_probability[0]);

    // Build the 48-hour horizontal scroll cards
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";

    for (let i = 0; i < 48; i++) {
        const targetDate = new Date(data.hourly.time[i]);
        const colIsDay = isDaytimeAstronomical(lat, lon, targetDate);
        const hTimeStr = targetDate.toLocaleTimeString([], { hour: 'numeric' });
        const hCode = data.hourly.weather_code[i];
        const hDesc = getWmoInterpretation(hCode);
        const hPrecip = data.hourly.precipitation_probability[i];
        const hTemp = Math.round(data.hourly.temperature_2m[i]);

        const card = document.createElement("div");
        card.className = "hourly-scroll-column";
        card.innerHTML = `
            <span class="hourly-hour-text">${hTimeStr}</span>
            <img class="hourly-icon-gfx" src="${window.getWeatherIcon(hDesc, colIsDay, hPrecip)}" alt="weather">
            <span class="hourly-temp-value">${hTemp}°</span>
            <span class="hourly-precip-value">${hPrecip >= 20 ? hPrecip + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(card);
    }

    // Build the 7-day outlook using horizontal range visualizers
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";

    let absoluteMin = 100;
    let absoluteMax = -100;
    for (let i = 0; i < data.daily.time.length; i++) {
        const mn = Math.round(data.daily.temperature_2m_min[i]);
        const mx = Math.round(data.daily.temperature_2m_max[i]);
        if (mn < absoluteMin) absoluteMin = mn;
        if (mx > absoluteMax) absoluteMax = mx;
    }

    for (let i = 0; i < data.daily.time.length; i++) {
        const dDate = new Date(data.daily.time[i] + 'T00:00:00');
        const dName = dDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dCode = data.daily.weather_code[i];
        const dDesc = getWmoInterpretation(dCode);
        const hi = Math.round(data.daily.temperature_2m_max[i]);
        const lo = Math.round(data.daily.temperature_2m_min[i]);

        const totalSpan = absoluteMax - absoluteMin || 1;
        const leftPercent = Math.max(0, Math.min(100, ((lo - absoluteMin) / totalSpan) * 100));
        const widthPercent = Math.max(5, Math.min(100, ((hi - lo) / totalSpan) * 100));

        const row = document.createElement("div");
        row.className = "daily-outlook-row";
        row.innerHTML = `
            <span class="day-title-label">${dName}</span>
            <img class="day-weather-ico" src="${window.getWeatherIcon(dDesc, true, 0)}" alt="Daily Icon">
            <span class="day-precip-label"></span>
            <span class="bar-min-lbl">${lo}°</span>
            <div class="temp-slider-visual-track">
                <div class="active-range-fill-track" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
            </div>
            <span class="bar-max-lbl">${hi}°</span>
        `;
        dailyContainer.appendChild(row);
    }

    applyDynamicThemeColor(desc, isDay);
}

/**
 * Draws the SVG solar path arc dynamically
 */
function drawSolarArcSvg(sunriseDate, sunsetDate) {
    const sunNode = document.getElementById("svg-sun-node");
    if (!sunNode) return;

    const now = new Date();
    if (now < sunriseDate || now > sunsetDate) {
        // Place sun at coordinates (10, 70) if nighttime
        sunNode.setAttribute("cx", "10");
        sunNode.setAttribute("cy", "70");
        return;
    }

    const totalSecs = sunsetDate - sunriseDate;
    const passedSecs = now - sunriseDate;
    const ratio = Math.max(0, Math.min(1, passedSecs / totalSecs));

    // Map percentage to target path: d="M 10 70 Q 100 0 190 70"
    const cx = 10 + ratio * 180;
    // Quadratic Bezier Formula: y = (1-t)^2 * y0 + 2(1-t)t * y1 + t^2 * y2
    const cy = Math.pow(1 - ratio, 2) * 70 + 2 * (1 - ratio) * ratio * 0 + Math.pow(ratio, 2) * 70;

    sunNode.setAttribute("cx", cx.toFixed(1));
    sunNode.setAttribute("cy", cy.toFixed(1));
}

/**
 * Generates dynamic meteorological text summaries based on real-time parameters
 */
function buildInsightText(desc, temp, wind, precip) {
    let text = `Analysis of local conditions shows a ${desc.toLowerCase()} layout. `;
    if (temp < 45) {
        text += "Frigid temperatures command standard protective winter gear. ";
    } else if (temp > 85) {
        text += "Warm dynamics are active. Hydration cycles are highly recommended. ";
    } else {
        text += "Pleasant temperatures are expected. No extreme heat warnings are in effect. ";
    }

    if (precip >= 50) {
        text += "Precipitation chances are elevated. An umbrella is advised for any outdoor plans.";
    } else if (precip >= 20) {
        text += "Low-level moisture profiles indicate isolated showers may develop today.";
    } else {
        text += "Expect dry ground conditions throughout the day.";
    }

    document.getElementById("weather-insight-text").textContent = text;
}

/**
 * Changes sky gradient styling based on condition parameters
 */
function applyDynamicThemeColor(desc, isDay) {
    const bg = document.getElementById("dynamic-sky-bg");
    if (!bg) return;

    const text = desc.toLowerCase();
    let gradient = "radial-gradient(circle at top, #0f172a 0%, #020617 100%)"; // Standard night fallback

    if (isDay) {
        if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) {
            gradient = "radial-gradient(circle at top, #334155 0%, #0f172a 100%)"; // Rain grey
        } else if (text.includes("thunder") || text.includes("storm")) {
            gradient = "radial-gradient(circle at top, #1e293b 0%, #090d16 100%)"; // Heavy storm grey
        } else if (text.includes("cloud") || text.includes("overcast")) {
            gradient = "radial-gradient(circle at top, #475569 0%, #1e293b 100%)"; // Overcast
        } else {
            gradient = "radial-gradient(circle at top, #0284c7 0%, #0f172a 100%)"; // Clear sky blue
        }
    } else {
        if (text.includes("clear") || text.includes("fair")) {
            gradient = "radial-gradient(circle at top, #1e1b4b 0%, #020617 100%)"; // Indigo night
        }
    }

    bg.style.background = gradient;
}

/**
 * Updates iframe source for Precipitation Radar View
 */
function updateRadarFrame(lat, lon) {
    const frame = document.getElementById("radar-iframe");
    if (frame) {
        frame.src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&o=1&t=1&m=1&p=1&v=1&c=1&g=0&s=1`;
    }
}

/**
 * Maps WMO code values to explicit descriptions
 */
function getWmoInterpretation(code) {
    const codes = {
        0: "Clear Sky",
        1: "Partly Cloudy", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Fog",
        51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
        61: "Rain Showers", 63: "Rain", 65: "Heavy Rain",
        71: "Snow Showers", 73: "Snow", 75: "Heavy Snow",
        77: "Sleet",
        80: "Rain Showers", 81: "Rain", 82: "Heavy Rain Showers",
        85: "Snow Showers", 86: "Heavy Snow Showers",
        95: "Thunderstorms", 96: "Thunderstorms Day Rain", 99: "Thunderstorms Night Rain"
    };
    return codes[code] || "Clear Sky";
}