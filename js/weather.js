/* ==========================================================================
   WINDYWEATHER ENGINE SYSTEM - WEATHER INTERFACES
   Handles NWS data requests and gets Sunrise/Sunset times from Open-Meteo.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initViewportsTabbar();
    
    // Initial fetch trigger
    window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
});

/**
 * Handle Tabbar selections
 */
function initViewportsTabbar() {
    const tabs = document.querySelectorAll(".pixel-tab-pill");
    const viewports = document.querySelectorAll(".pixel-viewport-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            viewports.forEach(v => v.classList.remove("active-panel"));

            tab.classList.add("active");
            const target = tab.getAttribute("data-tab");
            const activePanel = document.getElementById(target);
            if (activePanel) {
                activePanel.classList.add("active-panel");
            }
        });
    });
}

/**
 * Custom day/night twilight evaluator
 * Corrects the 6:00 PM sunset daylight calculations bug.
 */
function isDaytimeAstronomical(latitude, longitude, targetDate, sunriseTimeStr, sunsetTimeStr) {
    if (sunriseTimeStr && sunsetTimeStr) {
        try {
            const sunrise = new Date(sunriseTimeStr);
            const sunset = new Date(sunsetTimeStr);
            return targetDate >= sunrise && targetDate <= sunset;
        } catch (e) {
            console.warn("Date parse error for astronomical boundary logic:", e);
        }
    }

    // Fallback static boundary formula if times are missing
    const decHours = targetDate.getHours() + (targetDate.getMinutes() / 60);
    const yearStart = new Date(targetDate.getFullYear(), 0, 0);
    const dayIndex = Math.floor((targetDate - yearStart) / (1000 * 60 * 60 * 24));
    const timezoneOffset = -targetDate.getTimezoneOffset() / 60;
    
    const gamma = (2 * Math.PI / 365) * (dayIndex - 1 + ((decHours - 12) / 24));
    const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const solarDecl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

    const timeOffset = eqTime + 4 * longitude - 60 * timezoneOffset;
    const trueSolarTime = decHours * 60 + timeOffset;
    
    const hourAngle = (trueSolarTime / 4) - 180;
    const hourAngleRad = hourAngle * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;

    const sinElevation = Math.sin(latRad) * Math.sin(solarDecl) + Math.cos(latRad) * Math.cos(solarDecl) * Math.cos(hourAngleRad);
    const elevationDeg = Math.asin(sinElevation) * 180 / Math.PI;

    return elevationDeg > -0.83;
}

/**
 * Primary coordinates parser
 */
window.fetchWeatherData = async function(latitude, longitude) {
    const loader = document.getElementById("weather-loader");
    loader.classList.remove("hidden");

    // Reset warnings HUD displays
    const alertsBox = document.getElementById("nws-alerts-container");
    alertsBox.innerHTML = "";
    alertsBox.classList.add("hidden");

    // Parse location city name
    document.getElementById("current-city-name").textContent = window.currentLocation.name.split(',')[0];
    document.getElementById("current-coordinates-subtext").textContent = `Lat: ${latitude.toFixed(4)} | Lon: ${longitude.toFixed(4)}`;

    try {
        // Query Open-Meteo strictly for Sunrise and Sunset times
        const openMeteoAstroUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&timezone=auto`;
        const openMeteoRes = await fetch(openMeteoAstroUrl);
        let sunriseISO = null;
        let sunsetISO = null;
        
        if (openMeteoRes.ok) {
            const openMeteoData = await openMeteoRes.json();
            if (openMeteoData.daily && openMeteoData.daily.sunrise) {
                sunriseISO = openMeteoData.daily.sunrise[0];
                sunsetISO = openMeteoData.daily.sunset[0];
            }
        }

        // Fetch NWS points for forecast details
        const pointsUrl = `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const pointsRes = await fetch(pointsUrl, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });

        if (!pointsRes.ok) {
            throw new Error("Coordinates outside US borders. Invoking global fallback.");
        }

        const pointsData = await pointsRes.json();
        const stationsURL = pointsData.properties.observationStations;
        const forecastURL = pointsData.properties.forecast;
        const forecastHourlyURL = pointsData.properties.forecastHourly;

        const [stationsRes, forecastRes, forecastHourlyRes] = await Promise.all([
            fetch(stationsURL, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } }),
            fetch(forecastURL),
            fetch(forecastHourlyURL)
        ]);

        if (!stationsRes.ok || !forecastRes.ok || !forecastHourlyRes.ok) {
            throw new Error("Station registries returned error. Switching to fallback.");
        }

        const stationsData = await stationsRes.json();
        const forecastData = await forecastRes.json();
        const forecastHourlyData = await forecastHourlyRes.json();

        // Retrieve current observations directly from NWS nearest active station
        let realTimeTelemetry = null;
        if (stationsData.features && stationsData.features.length > 0) {
            const firstStationId = stationsData.features[0].id;
            try {
                const obsRes = await fetch(`${firstStationId}/observations/latest`, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });
                if (obsRes.ok) {
                    const obsData = await obsRes.json();
                    realTimeTelemetry = obsData.properties;
                }
            } catch (obsErr) {
                console.warn("Failed to retrieve current real-time observations, using hourly estimates.", obsErr);
            }
        }

        fetchNWSAlerts(latitude, longitude);
        renderUSWeather(forecastData.properties.periods, forecastHourlyData.properties.periods, realTimeTelemetry, latitude, longitude, sunriseISO, sunsetISO);
        updateRadarFrame(latitude, longitude);

    } catch (err) {
        console.warn(err.message);
        fetchGlobalFallback(latitude, longitude);
    } finally {
        loader.classList.add("hidden");
    }
};

/**
 * Query active emergency alerts from the NWS
 */
async function fetchNWSAlerts(lat, lon) {
    const alertsBox = document.getElementById("nws-alerts-container");
    alertsBox.innerHTML = "";

    try {
        const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
            headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' }
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data.features && data.features.length > 0) {
            alertsBox.classList.remove("hidden");
            data.features.forEach(feat => {
                const props = feat.properties;
                const div = document.createElement("div");
                div.className = "alert-item-card";
                div.innerHTML = `
                    <svg class="alert-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div class="alert-text-body">
                        <h4>${props.event}</h4>
                        <p>${props.headline || "Active localized emergency warning."}</p>
                    </div>
                `;
                alertsBox.appendChild(div);
            });
        }
    } catch (e) {
        console.warn("Alert pipeline skipped:", e);
    }
}

/**
 * Parse daytime boundaries using NWS pre-calculated icon path
 * Fixes timezone and solar twilight calculation errors.
 */
function checkNwsIsDay(period) {
    if (period.isDaytime !== undefined) return period.isDaytime;
    if (period.icon && period.icon.includes("/night/")) return false;
    return true;
}

/**
 * Process and render US weather datasets
 */
function renderUSWeather(dailyPeriods, hourlyPeriods, currentObservation, lat, lon, sunriseISO, sunsetISO) {
    const hourlyNow = hourlyPeriods[0];
    const isCurrentlyDay = isDaytimeAstronomical(lat, lon, new Date(), sunriseISO, sunsetISO);

    let currentTemp = hourlyNow.temperature;
    let descriptionStr = hourlyNow.shortForecast;
    let relativeHumidityVal = hourlyNow.relativeHumidity?.value || 50;
    let windSpeedVal = `${hourlyNow.windSpeed}`;
    let baroPressure = 29.92;

    if (currentObservation) {
        if (currentObservation.temperature && currentObservation.temperature.value !== null) {
            currentTemp = Math.round((currentObservation.temperature.value * 9/5) + 32);
        }
        if (currentObservation.textDescription) {
            descriptionStr = currentObservation.textDescription;
        }
        if (currentObservation.relativeHumidity && currentObservation.relativeHumidity.value !== null) {
            relativeHumidityVal = Math.round(currentObservation.relativeHumidity.value);
        }
        if (currentObservation.windSpeed && currentObservation.windSpeed.value !== null) {
            const convertedMph = Math.round(currentObservation.windSpeed.value * 2.23694);
            windSpeedVal = `${convertedMph} mph`;
        }
        if (currentObservation.barometricPressure && currentObservation.barometricPressure.value !== null) {
            baroPressure = (currentObservation.barometricPressure.value / 3386.39).toFixed(2);
        }
    }

    // Dallas conditions cloudy vs thunderstorm patch
    const precipChance = hourlyNow.probabilityOfPrecipitation?.value || 0;
    if (precipChance < 20) {
        descriptionStr = descriptionStr.replace(/(thunderstorm|tstorm|storm|rain|drizzle)/gi, "Cloudy").trim();
        if (descriptionStr === "" || descriptionStr.toLowerCase().includes("chance")) {
            descriptionStr = "Partly Cloudy";
        }
    }

    // Bind current details
    document.getElementById("current-temp").textContent = `${currentTemp}°`;
    document.getElementById("current-condition-desc").textContent = descriptionStr;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(descriptionStr, isCurrentlyDay, precipChance);

    // Bind high/low metrics
    let todayHigh = "--";
    let todayLow = "--";
    if (dailyPeriods && dailyPeriods.length > 0) {
        todayHigh = `${dailyPeriods[0].temperature}`;
        todayLow = dailyPeriods[1] ? `${dailyPeriods[1].temperature}` : "--";
    }
    document.getElementById("metric-apparent").textContent = `Feels like ${currentTemp}°`;
    document.getElementById("hero-temp-range").textContent = `High ${todayHigh}° • Low ${todayLow}°`;

    // Wind Card
    document.getElementById("metric-wind").textContent = windSpeedVal;
    document.getElementById("wind-direction-text").textContent = `Direction: ${hourlyNow.windDirection || 'N'}`;

    // Humidity Card
    document.getElementById("metric-humidity").textContent = `${relativeHumidityVal}%`;
    document.getElementById("humidity-dewpoint").textContent = `Dewpoint: ${Math.round(currentTemp - ((100 - relativeHumidityVal) / 5))}°`;

    // Barometer Card
    document.getElementById("metric-pressure").textContent = `${baroPressure} inHg`;
    document.getElementById("metric-precip").textContent = `${precipChance}%`;

    // Sunrise & Sunset display using Open-Meteo times
    if (sunriseISO && sunsetISO) {
        const sunriseObj = new Date(sunriseISO);
        const sunsetObj = new Date(sunsetISO);
        const formattedSunrise = sunriseObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedSunset = sunsetObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        document.getElementById("astro-sunrise").textContent = formattedSunrise;
        document.getElementById("astro-sunset").textContent = formattedSunset;
        updateSolarArcSvgNode(sunriseObj, sunsetObj);
    } else {
        document.getElementById("astro-sunrise").textContent = "06:00 AM";
        document.getElementById("astro-sunset").textContent = "08:00 PM";
    }

    // Build meteorological analysis summary
    buildMeteorologicalInsight(descriptionStr, currentTemp, windSpeedVal, precipChance);

    // Render 48-hour horizontal scroll columns
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";
    
    hourlyPeriods.slice(0, 48).forEach(period => {
        const itemPrecip = period.probabilityOfPrecipitation?.value || 0;
        const targetDate = new Date(period.startTime);
        const colIsDay = checkNwsIsDay(period);
        const hourLabel = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        const column = document.createElement("div");
        column.className = "hourly-tile-column";
        column.innerHTML = `
            <span class="hourly-column-temp">${period.temperature}°</span>
            <img class="hourly-column-icon" src="${window.getWeatherIcon(period.shortForecast, colIsDay, itemPrecip)}" alt="Hourly Gfx">
            <span class="hourly-column-precip">${itemPrecip >= 20 ? itemPrecip + '%' : '10%'}</span>
            <span class="hourly-column-hour">${hourLabel}</span>
        `;
        hourlyContainer.appendChild(column);
    });

    // Render 10-day outlook horizontal column scroll tiles (matches image layout)
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";

    const weeklySegments = [];
    for (let i = 0; i < dailyPeriods.length; i++) {
        const segment = dailyPeriods[i];
        if (segment.isDaytime) {
            weeklySegments.push({
                day: segment,
                night: dailyPeriods[i + 1] || null
            });
            i++; 
        } else {
            weeklySegments.push({
                day: null,
                night: segment
            });
        }
    }

    weeklySegments.forEach((group, index) => {
        const primary = group.day || group.night;
        const nameLabel = index === 0 ? "Today" : primary.name.substring(0, 3);
        const iconURL = window.getWeatherIcon(primary.shortForecast, true, primary.probabilityOfPrecipitation?.value || 0);

        const highTemp = group.day ? group.day.temperature : primary.temperature;
        const lowTemp = group.night ? group.night.temperature : primary.temperature;
        const itemPrecip = primary.probabilityOfPrecipitation?.value || 0;

        const column = document.createElement("div");
        column.className = "daily-tile-column";
        column.innerHTML = `
            <div class="daily-column-extremes">
                <span class="daily-column-high">${highTemp}°</span>
                <span class="daily-column-low">${lowTemp}°</span>
            </div>
            <img class="daily-column-icon" src="${iconURL}" alt="Daily Gfx">
            <span class="daily-column-precip">${itemPrecip >= 20 ? itemPrecip + '%' : '10%'}</span>
            <span class="daily-column-day">${nameLabel}</span>
        `;
        dailyContainer.appendChild(column);
    });
}

/**
 * Handle direct fallbacks to Open-Meteo for international coordinates
 */
async function fetchGlobalFallback(lat, lon) {
    try {
        const queryURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        const res = await fetch(queryURL);
        if (!res.ok) throw new Error("Fallback telemetry Down.");

        const data = await res.json();
        renderGlobalFallbackWeather(data, lat, lon);

    } catch (e) {
        console.error("No active weather data networks available:", e);
    }
}

/**
 * Process and Render Global Fallback Layers
 */
function renderGlobalFallbackWeather(data, lat, lon) {
    const cur = data.current;
    const wmoLabel = getWmoCodeLabel(cur.weather_code);
    const isCurrentlyDay = cur.is_day === 1;

    const tempF = Math.round(cur.temperature_2m);
    document.getElementById("current-temp").textContent = `${tempF}°`;
    document.getElementById("current-condition-desc").textContent = wmoLabel;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(wmoLabel, isCurrentlyDay, 0);

    const highVal = Math.round(data.daily.temperature_2m_max[0]);
    const lowVal = Math.round(data.daily.temperature_2m_min[0]);
    document.getElementById("metric-apparent").textContent = `Feels like ${Math.round(cur.apparent_temperature)}°`;
    document.getElementById("hero-temp-range").textContent = `High ${highVal}° • Low ${lowVal}°`;

    document.getElementById("metric-wind").textContent = `${cur.wind_speed_10m} mph`;
    document.getElementById("metric-humidity").textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById("metric-pressure").textContent = `${(cur.surface_pressure * 0.02953).toFixed(2)} inHg`;
    document.getElementById("metric-precip").textContent = `${data.hourly.precipitation_probability[0]}%`;

    const formatISOTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunriseLabel = formatISOTime(data.daily.sunrise[0]);
    const sunsetLabel = formatISOTime(data.daily.sunset[0]);

    document.getElementById("astro-sunrise").textContent = sunriseLabel;
    document.getElementById("astro-sunset").textContent = sunsetLabel;
    updateSolarArcSvgNode(new Date(data.daily.sunrise[0]), new Date(data.daily.sunset[0]));

    buildMeteorologicalInsight(wmoLabel, tempF, `${cur.wind_speed_10m} mph`, data.hourly.precipitation_probability[0]);

    // Build the 48-hour horizontal scroll columns
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";

    for (let i = 0; i < 48; i++) {
        const targetDate = new Date(data.hourly.time[i]);
        const colIsDay = data.hourly.is_day[i] === 1; // Accurate day/night coordinate tracking
        const hTimeLabel = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const hWmo = data.hourly.weather_code[i];
        const hDescription = getWmoCodeLabel(hWmo);
        const hPrecip = data.hourly.precipitation_probability[i];
        const hTemp = Math.round(data.hourly.temperature_2m[i]);

        const column = document.createElement("div");
        column.className = "hourly-tile-column";
        column.innerHTML = `
            <span class="hourly-column-temp">${hTemp}°</span>
            <img class="hourly-column-icon" src="${window.getWeatherIcon(hDescription, colIsDay, hPrecip)}" alt="Hourly Gfx">
            <span class="hourly-column-precip">${hPrecip >= 20 ? hPrecip + '%' : '10%'}</span>
            <span class="hourly-column-hour">${hTimeLabel}</span>
        `;
        hourlyContainer.appendChild(column);
    }

    // Build 10-day daily columns
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";

    for (let i = 0; i < data.daily.time.length; i++) {
        const dDate = new Date(data.daily.time[i] + 'T00:00:00');
        const dayLabel = i === 0 ? "Today" : dDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dWmo = data.daily.weather_code[i];
        const dDescription = getWmoCodeLabel(dWmo);
        const hi = Math.round(data.daily.temperature_2m_max[i]);
        const lo = Math.round(data.daily.temperature_2m_min[i]);
        const hPrecip = data.hourly.precipitation_probability[i * 24] || 0;

        const column = document.createElement("div");
        column.className = "daily-tile-column";
        column.innerHTML = `
            <div class="daily-column-extremes">
                <span class="daily-column-high">${hi}°</span>
                <span class="daily-column-low">${lo}°</span>
            </div>
            <img class="daily-column-icon" src="${window.getWeatherIcon(dDescription, true, 0)}" alt="Daily Gfx">
            <span class="daily-column-precip">${hPrecip >= 20 ? hPrecip + '%' : '10%'}</span>
            <span class="daily-column-day">${dayLabel}</span>
        `;
        dailyContainer.appendChild(column);
    }
}

/**
 * Draws dynamic SVG path elements for the sun trajectory
 */
function updateSolarArcSvgNode(sunriseDate, sunsetDate) {
    const sunDot = document.getElementById("svg-solar-node");
    if (!sunDot) return;

    const now = new Date();
    if (now < sunriseDate || now > sunsetDate) {
        // Flat night coordinate sets
        sunDot.setAttribute("cx", "10");
        sunDot.setAttribute("cy", "70");
        return;
    }

    const totalSeconds = sunsetDate - sunriseDate;
    const passedSeconds = now - sunriseDate;
    const trackingRatio = Math.max(0, Math.min(1, passedSeconds / totalSeconds));

    // Map percentage to target path: d="M 10 70 Q 100 0 190 70"
    const cx = 10 + (trackingRatio * 180);
    const cy = Math.pow(1 - trackingRatio, 2) * 70 + 2 * (1 - trackingRatio) * trackingRatio * 0 + Math.pow(trackingRatio, 2) * 70;

    sunDot.setAttribute("cx", cx.toFixed(1));
    sunDot.setAttribute("cy", cy.toFixed(1));
}

/**
 * Generates textual insights based on local condition parameters
 */
function buildMeteorologicalInsight(desc, temp, wind, precip) {
    let text = `Analysis of localized atmospheric parameters indicates a ${desc.toLowerCase()} layout today. `;
    if (temp < 45) {
        text += "Frigid parameters are active. Keep insulated with layered clothing. ";
    } else if (temp > 85) {
        text += "Warm thermal profiles are active. Keep hydrated. ";
    } else {
        text += "Mild and temperate conditions are active across coordinates. ";
    }

    if (precip >= 50) {
        text += "Elevated water-vapor profiles confirmed. Protect instruments with an umbrella.";
    } else if (precip >= 20) {
        text += "Isolated moisture blocks suggest transient dampness may occur.";
    } else {
        text += "Expect completely dry surface layers.";
    }

    document.getElementById("weather-insight-text").textContent = text;
}

/**
 * Configure target URL coordinates for Radar
 */
function updateRadarFrame(lat, lon) {
    const frame = document.getElementById("radar-iframe");
    if (frame) {
        frame.src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&o=1&t=1&m=1&p=1&v=1&c=1&g=0&s=1`;
    }
}

/**
 * Maps WMO code parameters to standard text descriptions
 */
function getWmoCodeLabel(code) {
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