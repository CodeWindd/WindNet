/* ==========================================================================
   WINDYWEATHER SYSTEM DISPATCHER ENGINE
   Master coordinates parser, fallback triggers, and particle generators
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initAppNavigationTabHandlers();
    
    // Initial dispatcher sequence
    window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
});

/**
 * Handle Material Nav button shifts
 */
function initAppNavigationTabHandlers() {
    const tabChips = document.querySelectorAll(".tab-pill-navigation-btn");
    const viewportPanels = document.querySelectorAll(".workspace-viewport-panel");

    tabChips.forEach(chip => {
        chip.addEventListener("click", () => {
            tabChips.forEach(t => t.classList.remove("active"));
            viewportPanels.forEach(p => p.classList.remove("active-panel"));

            chip.classList.add("active");
            const targetID = chip.getAttribute("data-tab");
            const targetPanel = document.getElementById(targetID);
            if (targetPanel) {
                targetPanel.classList.add("active-panel");
            }
        });
    });
}

/**
 * Custom Day/Night twilight evaluator
 * Solves twilight rendering mismatch errors.
 */
function evaluateSolarDayNight(latitude, longitude, targetDate) {
    const decHours = targetDate.getHours() + (targetDate.getMinutes() / 60);

    // Get current calendar day index
    const yearStart = new Date(targetDate.getFullYear(), 0, 0);
    const dayIndex = Math.floor((targetDate - yearStart) / (1000 * 60 * 60 * 24));

    // Standard UTC offset representation
    const tzOffsetHours = -targetDate.getTimezoneOffset() / 60;
    
    // Fractional Year calculations
    const fractYear = (2 * Math.PI / 365) * (dayIndex - 1 + ((decHours - 12) / 24));
    
    // Equation of Time offset
    const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(fractYear) - 0.032077 * Math.sin(fractYear) - 0.014615 * Math.cos(2 * fractYear) - 0.040849 * Math.sin(2 * fractYear));
    
    // Solar declination coordinates (radians)
    const solarDecl = 0.006918 - 0.399912 * Math.cos(fractYear) + 0.070257 * Math.sin(fractYear) - 0.006758 * Math.cos(2 * fractYear) + 0.000907 * Math.sin(2 * fractYear) - 0.002697 * Math.cos(3 * fractYear) + 0.00148 * Math.sin(3 * fractYear);

    // True Solar Time calculations
    const timeOffset = eqTime + 4 * longitude - 60 * tzOffsetHours;
    const trueSolarTime = decHours * 60 + timeOffset;
    
    // Hour Angle conversions
    const hourAngle = (trueSolarTime / 4) - 180;
    const hourAngleRad = hourAngle * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;

    // Solar Elevation Angle
    const sinElevation = Math.sin(latRad) * Math.sin(solarDecl) + Math.cos(latRad) * Math.cos(solarDecl) * Math.cos(hourAngleRad);
    const elevationDeg = Math.asin(sinElevation) * 180 / Math.PI;

    // Horizon threshold represents standard refractive index values (-0.83 degrees)
    return elevationDeg > -0.83;
}

/**
 * Core Orchestrator
 */
window.fetchWeatherData = async function(latitude, longitude) {
    const loadingHUD = document.getElementById("weather-loader");
    loadingHUD.classList.remove("hidden");

    // Clear alert stacks
    const alertBox = document.getElementById("nws-alerts-container");
    alertBox.innerHTML = "";
    alertBox.classList.add("hidden");

    document.getElementById("current-city-name").textContent = window.currentLocation.name;
    document.getElementById("current-coordinates-subtext").textContent = `Latitude: ${latitude.toFixed(4)} | Longitude: ${longitude.toFixed(4)}`;

    try {
        // Fetch NWS grid endpoints
        const pointsEndpoint = `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const pointsRes = await fetch(pointsEndpoint, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });

        if (!pointsRes.ok) {
            throw new Error("Target region lies outside NWS service limits. Initializing global fallback.");
        }

        const pointsData = await pointsRes.json();
        const stationsURL = pointsData.properties.observationStations;
        const forecastURL = pointsData.properties.forecast;
        const forecastHourlyURL = pointsData.properties.forecastHourly;

        // Fetch station registers, hourly datasets, and primary daily forecasts
        const [stationsRes, forecastRes, forecastHourlyRes] = await Promise.all([
            fetch(stationsURL, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } }),
            fetch(forecastURL),
            fetch(forecastHourlyURL)
        ]);

        if (!stationsRes.ok || !forecastRes.ok || !forecastHourlyRes.ok) {
            throw new Error("Station registers returned invalid states. Launching global fallback.");
        }

        const stationsData = await stationsRes.json();
        const forecastData = await forecastRes.json();
        const forecastHourlyData = await forecastHourlyRes.json();

        // Retrieve real-time parameters from the closest observation station
        let realTimeStationObservation = null;
        if (stationsData.features && stationsData.features.length > 0) {
            const nearestStationURL = stationsData.features[0].id;
            try {
                const obsRes = await fetch(`${nearestStationURL}/observations/latest`, { headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' } });
                if (obsRes.ok) {
                    const obsData = await obsRes.json();
                    realTimeStationObservation = obsData.properties;
                }
            } catch (obsErr) {
                console.warn("Failed to retrieve real-time station observations. Falling back to hourly forecasts.", obsErr);
            }
        }

        fetchNWSAlerts(latitude, longitude);
        renderUSWeather(forecastData.properties.periods, forecastHourlyData.properties.periods, realTimeStationObservation, latitude, longitude);
        updateRadarFrame(latitude, longitude);

    } catch (err) {
        console.warn(err.message);
        fetchGlobalFallback(latitude, longitude);
    } finally {
        loadingHUD.classList.add("hidden");
    }
};

/**
 * Query active emergency alerts from the NWS
 */
async function fetchNWSAlerts(lat, lon) {
    const alertBox = document.getElementById("nws-alerts-container");
    alertBox.innerHTML = "";

    try {
        const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
            headers: { 'Accept': 'application/geo+json', 'User-Agent': 'WindyWeatherClient' }
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data.features && data.features.length > 0) {
            alertBox.classList.remove("hidden");
            data.features.forEach(feat => {
                const props = feat.properties;
                const node = document.createElement("div");
                node.className = "alert-item-box";
                node.innerHTML = `
                    <span class="alert-warning-symbol">⚠️</span>
                    <div class="alert-body">
                        <h4>${props.event}</h4>
                        <p>${props.headline || "Active localized emergency statement issued by weather services."}</p>
                    </div>
                `;
                alertBox.appendChild(node);
            });
        }
    } catch (e) {
        console.warn("Alert service connection timed out:", e);
    }
}

/**
 * Extract daytime booleans using the NWS pre-calculated icon path
 * This is highly accurate and bypasses timezone offset conversion errors.
 */
function parseNwsIsDay(period) {
    if (period.isDaytime !== undefined) return period.isDaytime;
    if (period.icon && period.icon.includes("/night/")) return false;
    return true;
}

/**
 * Process and render US-based data layers
 */
function renderUSWeather(dailyPeriods, hourlyPeriods, currentObservation, lat, lon) {
    const hourlyNow = hourlyPeriods[0];
    const isCurrentlyDay = evaluateSolarDayNight(lat, lon, new Date());

    let currentTempF = hourlyNow.temperature;
    let descriptionText = hourlyNow.shortForecast;
    let relativeHumidityVal = hourlyNow.relativeHumidity?.value || 50;
    let windVelocityString = `${hourlyNow.windSpeed}`;
    let barometricPressureInches = 29.92;

    if (currentObservation) {
        if (currentObservation.temperature && currentObservation.temperature.value !== null) {
            currentTempF = Math.round((currentObservation.temperature.value * 9/5) + 32);
        }
        if (currentObservation.textDescription) {
            descriptionText = currentObservation.textDescription;
        }
        if (currentObservation.relativeHumidity && currentObservation.relativeHumidity.value !== null) {
            relativeHumidityVal = Math.round(currentObservation.relativeHumidity.value);
        }
        if (currentObservation.windSpeed && currentObservation.windSpeed.value !== null) {
            const calculatedMph = Math.round(currentObservation.windSpeed.value * 2.23694);
            windVelocityString = `${calculatedMph} mph`;
        }
        if (currentObservation.barometricPressure && currentObservation.barometricPressure.value !== null) {
            barometricPressureInches = (currentObservation.barometricPressure.value / 3386.39).toFixed(2);
        }
    }

    // Bind current HUD details
    document.getElementById("current-temp").textContent = `${currentTempF}°`;
    document.getElementById("current-condition-desc").textContent = descriptionText;
    
    const precipitationChance = hourlyNow.probabilityOfPrecipitation?.value || 0;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(descriptionText, isCurrentlyDay, precipitationChance);

    // Bind high/low metrics
    let dailyHighTemp = "--°";
    let dailyLowTemp = "--°";
    if (dailyPeriods && dailyPeriods.length > 0) {
        dailyHighTemp = `${dailyPeriods[0].temperature}°`;
        dailyLowTemp = dailyPeriods[1] ? `${dailyPeriods[1].temperature}°` : "--°";
    }
    document.getElementById("hero-temp-high").textContent = `H: ${dailyHighTemp}`;
    document.getElementById("hero-temp-low").textContent = `L: ${dailyLowTemp}`;

    // Apparent Temp Card
    document.getElementById("metric-apparent").textContent = `${currentTempF}°F`;
    document.getElementById("apparent-evaluation-text").textContent = currentTempF < 50 ? "Cool thermal index" : "Pleasant index";
    
    // Wind velocity Card
    document.getElementById("metric-wind").textContent = windVelocityString;
    document.getElementById("wind-panel-direction-text").textContent = `Trajectory direction: ${hourlyNow.windDirection || 'N'}`;

    // Humidity Card
    document.getElementById("metric-humidity").textContent = `${relativeHumidityVal}%`;
    document.getElementById("humidity-dewpoint-evaluation-text").textContent = `Dewpoint: ${Math.round(currentTempF - ((100 - relativeHumidityVal) / 5))}°`;

    // Barometer Card
    document.getElementById("metric-pressure").textContent = `${barometricPressureInches} inHg`;
    document.getElementById("metric-precip").textContent = `${precipitationChance}%`;

    // Process solar curves
    const mockSunriseTime = new Date();
    mockSunriseTime.setHours(6, 0, 0);
    const mockSunsetTime = new Date();
    mockSunsetTime.setHours(20, 0, 0);

    document.getElementById("astro-sunrise").textContent = "06:00 AM";
    document.getElementById("astro-sunset").textContent = "08:00 PM";
    updateAstronomicalSolarSunNode(mockSunriseTime, mockSunsetTime);

    // Build the dynamic analysis insight text
    buildAnalyticalInsightText(descriptionText, currentTempF, windVelocityString, precipitationChance);

    // Render 48-hour horizontal scroll columns
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";
    
    hourlyPeriods.slice(0, 48).forEach(period => {
        const itemPrecip = period.probabilityOfPrecipitation?.value || 0;
        const targetDate = new Date(period.startTime);
        const colIsDay = parseNwsIsDay(period);
        const hourLabel = targetDate.toLocaleTimeString([], { hour: 'numeric' });

        const node = document.createElement("div");
        node.className = "hourly-scroll-column-box";
        node.innerHTML = `
            <span class="hourly-column-hour-lbl">${hourLabel}</span>
            <img class="hourly-column-icon-gfx" src="${window.getWeatherIcon(period.shortForecast, colIsDay, itemPrecip)}" alt="Weather forecast column state">
            <span class="hourly-column-temp-lbl">${period.temperature}°</span>
            <span class="hourly-column-precip-lbl">${itemPrecip >= 20 ? itemPrecip + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(node);
    });

    // Render 7-day outlook using custom horizontal range visualizers
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";

    // Extract absolute extremes to scale visual tracks
    let absoluteMinTemp = 100;
    let absoluteMaxTemp = -100;
    dailyPeriods.forEach(p => {
        if (p.temperature < absoluteMinTemp) absoluteMinTemp = p.temperature;
        if (p.temperature > absoluteMaxTemp) absoluteMaxTemp = p.temperature;
    });

    // Group forecast elements into daily segments
    const weeklyGroupedSegments = [];
    for (let i = 0; i < dailyPeriods.length; i++) {
        const segment = dailyPeriods[i];
        if (segment.isDaytime) {
            weeklyGroupedSegments.push({
                day: segment,
                night: dailyPeriods[i + 1] || null
            });
            i++; 
        } else {
            weeklyGroupedSegments.push({
                day: null,
                night: segment
            });
        }
    }

    weeklyGroupedSegments.forEach(group => {
        const primary = group.day || group.night;
        const dayLabel = primary.name;
        const iconURL = window.getWeatherIcon(primary.shortForecast, true, primary.probabilityOfPrecipitation?.value || 0);

        const highVal = group.day ? group.day.temperature : primary.temperature;
        const lowVal = group.night ? group.night.temperature : primary.temperature;

        const totalSpan = absoluteMaxTemp - absoluteMinTemp || 1;
        const leftPercent = Math.max(0, Math.min(100, ((lowVal - absoluteMinTemp) / totalSpan) * 100));
        const widthPercent = Math.max(8, Math.min(100, ((highVal - lowVal) / totalSpan) * 100));

        const node = document.createElement("div");
        node.className = "daily-forecast-row-block";
        node.innerHTML = `
            <span class="daily-row-day-title">${dayLabel}</span>
            <img class="daily-row-weather-gfx" src="${iconURL}" alt="Weather forecast row state">
            <span class="daily-row-precip-lbl">${primary.probabilityOfPrecipitation?.value >= 20 ? primary.probabilityOfPrecipitation.value + '%' : ''}</span>
            <span class="daily-row-temp-min-lbl">${lowVal}°</span>
            <div class="daily-temp-slider-visual-track">
                <div class="daily-active-range-fill-track" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
            </div>
            <span class="daily-row-temp-max-lbl">${highVal}°</span>
        `;
        dailyContainer.appendChild(node);
    });

    generateDynamicSkyBackgroundTheme(descriptionText, isCurrentlyDay);
    initializeBackdropAnimations(descriptionText);
}

/**
 * Handle direct queries to Open-Meteo for international coverage
 */
async function fetchGlobalFallback(lat, lon) {
    try {
        const queryURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        const res = await fetch(queryURL);
        if (!res.ok) throw new Error("Fallback connection timed out.");

        const data = await res.json();
        renderGlobalFallbackWeather(data, lat, lon);

    } catch (e) {
        console.error("Critical rendering failure across all weather services:", e);
    }
}

/**
 * Process and Render Global Fallback Layers
 */
function renderGlobalFallbackWeather(data, lat, lon) {
    const cur = data.current;
    const wmoLabel = getWmoCodeLabelRepresentation(cur.weather_code);
    const isCurrentlyDay = cur.is_day === 1;

    const tempF = Math.round(cur.temperature_2m);
    document.getElementById("current-temp").textContent = `${tempF}°`;
    document.getElementById("current-condition-desc").textContent = wmoLabel;
    document.getElementById("current-weather-icon").src = window.getWeatherIcon(wmoLabel, isCurrentlyDay, 0);

    const highT = Math.round(data.daily.temperature_2m_max[0]);
    const lowT = Math.round(data.daily.temperature_2m_min[0]);
    document.getElementById("hero-temp-high").textContent = `H: ${highT}°`;
    document.getElementById("hero-temp-low").textContent = `L: ${lowT}°`;

    document.getElementById("metric-apparent").textContent = `${Math.round(cur.apparent_temperature)}°F`;
    document.getElementById("metric-wind").textContent = `${cur.wind_speed_10m} mph`;
    document.getElementById("metric-humidity").textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById("metric-pressure").textContent = `${(cur.surface_pressure * 0.02953).toFixed(2)} inHg`;
    document.getElementById("metric-precip").textContent = `${data.hourly.precipitation_probability[0]}%`;

    const formatISOTimeString = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunriseLabel = formatISOTimeString(data.daily.sunrise[0]);
    const sunsetLabel = formatISOTimeString(data.daily.sunset[0]);

    document.getElementById("astro-sunrise").textContent = sunriseLabel;
    document.getElementById("astro-sunset").textContent = sunsetLabel;
    updateAstronomicalSolarSunNode(new Date(data.daily.sunrise[0]), new Date(data.daily.sunset[0]));

    buildAnalyticalInsightText(wmoLabel, tempF, `${cur.wind_speed_10m} mph`, data.hourly.precipitation_probability[0]);

    // Build hourly scroll column tiles
    const hourlyContainer = document.getElementById("hourly-cards-wrapper");
    hourlyContainer.innerHTML = "";

    for (let i = 0; i < 48; i++) {
        const targetDate = new Date(data.hourly.time[i]);
        const isColumnDay = data.hourly.is_day[i] === 1; // Direct API day/night calculation
        const hTimeLabel = targetDate.toLocaleTimeString([], { hour: 'numeric' });
        const hWmoCode = data.hourly.weather_code[i];
        const hDescription = getWmoCodeLabelRepresentation(hWmoCode);
        const hPrecipChance = data.hourly.precipitation_probability[i];
        const hTempF = Math.round(data.hourly.temperature_2m[i]);

        const column = document.createElement("div");
        column.className = "hourly-scroll-column-box";
        column.innerHTML = `
            <span class="hourly-column-hour-lbl">${hTimeLabel}</span>
            <img class="hourly-column-icon-gfx" src="${window.getWeatherIcon(hDescription, isColumnDay, hPrecipChance)}" alt="Weather forecast column state">
            <span class="hourly-column-temp-lbl">${hTempF}°</span>
            <span class="hourly-column-precip-lbl">${hPrecipChance >= 20 ? hPrecipChance + '%' : ''}</span>
        `;
        hourlyContainer.appendChild(column);
    }

    // Build daily range visualizer rows
    const dailyContainer = document.getElementById("daily-cards-wrapper");
    dailyContainer.innerHTML = "";

    let absoluteMinTemp = 100;
    let absoluteMaxTemp = -100;
    for (let i = 0; i < data.daily.time.length; i++) {
        const mn = Math.round(data.daily.temperature_2m_min[i]);
        const mx = Math.round(data.daily.temperature_2m_max[i]);
        if (mn < absoluteMinTemp) absoluteMinTemp = mn;
        if (mx > absoluteMaxTemp) absoluteMaxTemp = mx;
    }

    for (let i = 0; i < data.daily.time.length; i++) {
        const dDate = new Date(data.daily.time[i] + 'T00:00:00');
        const dayLabel = dDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dWmoCode = data.daily.weather_code[i];
        const dDescription = getWmoCodeLabelRepresentation(dWmoCode);
        const maxVal = Math.round(data.daily.temperature_2m_max[i]);
        const minVal = Math.round(data.daily.temperature_2m_min[i]);

        const totalSpan = absoluteMaxTemp - absoluteMinTemp || 1;
        const leftPercent = Math.max(0, Math.min(100, ((minVal - absoluteMinTemp) / totalSpan) * 100));
        const widthPercent = Math.max(8, Math.min(100, ((maxVal - minVal) / totalSpan) * 100));

        const row = document.createElement("div");
        row.className = "daily-forecast-row-block";
        row.innerHTML = `
            <span class="daily-row-day-title">${dayLabel}</span>
            <img class="daily-row-weather-gfx" src="${window.getWeatherIcon(dDescription, true, 0)}" alt="Weather forecast row state">
            <span class="daily-row-precip-lbl"></span>
            <span class="daily-row-temp-min-lbl">${minVal}°</span>
            <div class="daily-temp-slider-visual-track">
                <div class="daily-active-range-fill-track" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
            </div>
            <span class="daily-row-temp-max-lbl">${maxVal}°</span>
        `;
        dailyContainer.appendChild(row);
    }

    generateDynamicSkyBackgroundTheme(wmoLabel, isCurrentlyDay);
    initializeBackdropAnimations(wmoLabel);
}

/**
 * Draws the active SVG path coordinates for the astronomical trajectory
 */
function updateAstronomicalSolarSunNode(sunriseDate, sunsetDate) {
    const activeSunIndicator = document.getElementById("svg-active-sun-indicator");
    if (!activeSunIndicator) return;

    const now = new Date();
    if (now < sunriseDate || now > sunsetDate) {
        // Night layout placement
        activeSunIndicator.setAttribute("cx", "10");
        activeSunIndicator.setAttribute("cy", "70");
        return;
    }

    const totalSecondsSpan = sunsetDate - sunriseDate;
    const passedSecondsSpan = now - sunriseDate;
    const trackingRatio = Math.max(0, Math.min(1, passedSecondsSpan / totalSecondsSpan));

    // Map tracking value to Bezier coordinates: d="M 10 70 Q 100 0 190 70"
    const cx = 10 + (trackingRatio * 180);
    const cy = Math.pow(1 - trackingRatio, 2) * 70 + 2 * (1 - trackingRatio) * trackingRatio * 0 + Math.pow(trackingRatio, 2) * 70;

    activeSunIndicator.setAttribute("cx", cx.toFixed(1));
    activeSunIndicator.setAttribute("cy", cy.toFixed(1));
}

/**
 * Procedural rain/snow particle generator overlay
 */
function initializeBackdropAnimations(description) {
    const box = document.getElementById("weather-particle-effect-renderer");
    if (!box) return;

    box.innerHTML = "";
    const txt = description.toLowerCase();
    
    let count = 0;
    let particleType = "";

    if (txt.includes("rain") || txt.includes("drizzle") || txt.includes("shower") || txt.includes("thunderstorm")) {
        count = 60;
        particleType = "rain";
    } else if (txt.includes("snow") || txt.includes("flurries")) {
        count = 45;
        particleType = "snow";
    }

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.className = "weather-particle";
        
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 2 + (particleType === "rain" ? 1.5 : 3);
        const opacity = Math.random() * 0.5 + 0.25;

        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.opacity = opacity;

        if (particleType === "rain") {
            particle.style.width = "1.5px";
            particle.style.height = "16px";
            particle.style.background = "linear-gradient(transparent, rgba(255,255,255,0.75))";
            particle.style.borderRadius = "0";
            particle.style.animationName = "fall-rain";
            particle.style.animationIterationCount = "infinite";
            particle.style.animationTimingFunction = "linear";
        } else {
            const size = Math.random() * 3 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = "#ffffff";
            particle.style.animationName = "drift-snow";
            particle.style.animationIterationCount = "infinite";
            particle.style.animationTimingFunction = "ease-in-out";
        }

        box.appendChild(particle);
    }
}

// Inject procedural styles into the sheet rules
const customParticleAnimationsSheet = document.createElement("style");
customParticleAnimationsSheet.textContent = `
@keyframes fall-rain {
    0% { transform: translateY(-30px); }
    100% { transform: translateY(380px); }
}
@keyframes drift-snow {
    0% { transform: translateY(-20px) translateX(0); }
    50% { transform: translateY(190px) translateX(12px); }
    100% { transform: translateY(380px) translateX(-12px); }
}
`;
document.head.appendChild(customParticleAnimationsSheet);

/**
 * Generate structural descriptions
 */
function buildAnalyticalInsightText(desc, temp, wind, precip) {
    let insightStr = `Diagnostic parameters indicate a localized ${desc.toLowerCase()} condition state. `;
    if (temp < 40) {
        insightStr += "Frigid temperatures are active. Heavy layered clothing is highly recommended. ";
    } else if (temp > 85) {
        insightStr += "Elevated temperatures detected. Hydration schedules should be active. ";
    } else {
        insightStr += "Temperate climate behaviors are present across coordinates. ";
    }

    if (precip >= 50) {
        insightStr += "High-level water-vapor concentration confirmed. Protect instrumentation with an umbrella.";
    } else if (precip >= 20) {
        insightStr += "Micro-moisture levels suggest localized high-humidity features may develop.";
    } else {
        insightStr += "Dry surface-level conditions will persist.";
    }

    document.getElementById("weather-insight-text").textContent = insightStr;
}

/**
 * Dynamically shift atmosphere sky background vectors
 */
function generateDynamicSkyBackgroundTheme(desc, isDaytime) {
    const bg = document.getElementById("dynamic-atmosphere-sky");
    if (!bg) return;

    const conditionLabel = desc.toLowerCase();
    let themeGradient = "radial-gradient(circle at top, #0f172a 0%, #020617 100%)";

    if (isDaytime) {
        if (conditionLabel.includes("rain") || conditionLabel.includes("drizzle") || conditionLabel.includes("shower")) {
            themeGradient = "radial-gradient(circle at top, #334155 0%, #1e293b 100%)";
        } else if (conditionLabel.includes("thunder") || conditionLabel.includes("storm")) {
            themeGradient = "radial-gradient(circle at top, #1e293b 0%, #0c1017 100%)";
        } else if (conditionLabel.includes("cloud") || conditionLabel.includes("overcast")) {
            themeGradient = "radial-gradient(circle at top, #475569 0%, #1e293b 100%)";
        } else {
            themeGradient = "radial-gradient(circle at top, #0284c7 0%, #0f172a 100%)";
        }
    } else {
        if (conditionLabel.includes("clear") || conditionLabel.includes("fair")) {
            themeGradient = "radial-gradient(circle at top, #1e1b4b 0%, #020617 100%)";
        }
    }

    bg.style.background = themeGradient;
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
 * Maps WMO code parameters to text labels
 */
function getWmoCodeLabelRepresentation(code) {
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