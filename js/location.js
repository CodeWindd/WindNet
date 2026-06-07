/* ==========================================================================
   WINDYWEATHER ENVIRONMENT RESOLVER
   Coordinates autocomplete configurations and local storage caches
   ========================================================================== */

const fallbackLocationCoordinates = {
    name: "Dallas, TX",
    lat: 32.7767,
    lon: -96.7970
};

window.currentLocation = { ...fallbackLocationCoordinates };

document.addEventListener("DOMContentLoaded", () => {
    initializeLocalCaches();
});

function initializeLocalCaches() {
    const saved = getCachedLocationsList();
    if (saved.length === 0) {
        cacheLocationRecord(fallbackLocationCoordinates.name, fallbackLocationCoordinates.lat, fallbackLocationCoordinates.lon);
    }

    // Restore last session location coordinates
    const lastCoordinatesRecord = localStorage.getItem("windy_last_active_location");
    if (lastCoordinatesRecord) {
        try {
            window.currentLocation = JSON.parse(lastCoordinatesRecord);
        } catch (e) {
            window.currentLocation = { ...fallbackLocationCoordinates };
        }
    }

    renderSavedShelfPills();

    const input = document.getElementById("location-input");
    const suggestionBox = document.getElementById("suggestions");

    // Dynamic autocomplete suggestion dispatcher
    input.addEventListener("input", debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) {
            suggestionBox.classList.add("hidden");
            return;
        }

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            if (!res.ok) return;

            const data = await res.json();
            if (data.results && data.results.length > 0) {
                suggestionBox.innerHTML = "";
                data.results.forEach(item => {
                    const country = item.country || "";
                    const state = item.admin1 || "";
                    const label = `${item.name}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`;

                    const row = document.createElement("div");
                    row.className = "suggestion-item";
                    row.textContent = label;
                    row.addEventListener("click", () => {
                        window.currentLocation = {
                            name: label,
                            lat: item.latitude,
                            lon: item.longitude
                        };
                        localStorage.setItem("windy_last_active_location", JSON.stringify(window.currentLocation));
                        suggestionBox.classList.add("hidden");
                        input.value = "";
                        triggerAtmosphericDiagnosticsUpdate();
                    });
                    suggestionBox.appendChild(row);
                });
                suggestionBox.classList.remove("hidden");
            } else {
                suggestionBox.classList.add("hidden");
            }
        } catch (err) {
            console.warn("Geocoder pipeline bypassed:", err);
        }
    }, 350));

    // Handle outside clicks to close autocomplete dropdown list
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.classList.add("hidden");
        }
    });

    // Handle manual text inputs
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const val = input.value.trim();
            if (val) {
                fetchLocationRecordFromString(val);
                suggestionBox.classList.add("hidden");
            }
        }
    });

    // Handle Geolocation coordinates API
    document.getElementById("gps-btn").addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                window.currentLocation = {
                    name: `Location Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
                    lat: lat,
                    lon: lon
                };
                localStorage.setItem("windy_last_active_location", JSON.stringify(window.currentLocation));
                triggerAtmosphericDiagnosticsUpdate();
            }, () => {
                alert("Location permission denied. Utilizing default coordinates.");
            });
        }
    });

    // Handle manual quick save triggers
    document.getElementById("save-current-btn").addEventListener("click", () => {
        cacheLocationRecord(window.currentLocation.name, window.currentLocation.lat, window.currentLocation.lon);
        renderSavedShelfPills();
    });
}

/**
 * Convert manual query text into coordinates
 */
async function fetchLocationRecordFromString(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const top = data.results[0];
            const state = top.admin1 || "";
            const label = `${top.name}${state ? ', ' + state : ''}, ${top.country}`;

            window.currentLocation = {
                name: label,
                lat: top.latitude,
                lon: top.longitude
            };
            localStorage.setItem("windy_last_active_location", JSON.stringify(window.currentLocation));
            document.getElementById("location-input").value = "";
            triggerAtmosphericDiagnosticsUpdate();
        } else {
            alert("Location string returned no coordinates.");
        }
    } catch (e) {
        console.error("Geocoding fetch operation skipped:", e);
    }
}

function getCachedLocationsList() {
    const raw = localStorage.getItem("windy_saved_locations_cache");
    return raw ? JSON.parse(raw) : [];
}

function cacheLocationRecord(name, lat, lon) {
    const currentList = getCachedLocationsList();
    if (!currentList.some(item => item.name === name)) {
        currentList.push({ name, lat, lon });
        localStorage.setItem("windy_saved_locations_cache", JSON.stringify(currentList));
    }
}

function deleteCachedLocation(name) {
    let currentList = getCachedLocationsList();
    currentList = currentList.filter(item => item.name !== name);
    localStorage.setItem("windy_saved_locations_cache", JSON.stringify(currentList));
    renderSavedShelfPills();
}

/**
 * Hydrates saved locations into UI pills
 */
function renderSavedShelfPills() {
    const container = document.getElementById("saved-list");
    container.innerHTML = "";

    const list = getCachedLocationsList();
    list.forEach(item => {
        const pill = document.createElement("div");
        pill.className = "location-pill";
        pill.innerHTML = `
            <span>📍 ${item.name}</span>
            <span class="delete-pill-cross" data-name="${item.name}">×</span>
        `;

        pill.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-pill-cross")) {
                e.stopPropagation();
                deleteCachedLocation(item.name);
                return;
            }
            window.currentLocation = { name: item.name, lat: item.lat, lon: item.lon };
            localStorage.setItem("windy_last_active_location", JSON.stringify(window.currentLocation));
            triggerAtmosphericDiagnosticsUpdate();
        });

        container.appendChild(pill);
    });
}

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

function triggerAtmosphericDiagnosticsUpdate() {
    if (window.fetchWeatherData) {
        window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
    }
}