/* ==========================================================================
   WINDYWEATHER REGIONAL COORDINATION SERVICES
   Autocomplete and dynamic coordinates resolver
   ========================================================================== */

const fallbackLocationCoordinates = {
    name: "Dallas, TX",
    lat: 32.7767,
    lon: -96.7970
};

window.currentLocation = { ...fallbackLocationCoordinates };

document.addEventListener("DOMContentLoaded", () => {
    initLocalLocationCaches();
});

function initLocalLocationCaches() {
    const saved = getStoredEnvironmentsList();
    if (saved.length === 0) {
        saveEnvironmentRecord(fallbackLocationCoordinates.name, fallbackLocationCoordinates.lat, fallbackLocationCoordinates.lon);
    }

    const lastActiveCoordinatesRecord = localStorage.getItem("windy_hollow_active_location");
    if (lastActiveCoordinatesRecord) {
        try {
            window.currentLocation = JSON.parse(lastActiveCoordinatesRecord);
        } catch (e) {
            window.currentLocation = { ...fallbackLocationCoordinates };
        }
    }

    renderSavedShelfChips();

    const input = document.getElementById("location-input");
    const suggestionBox = document.getElementById("suggestions");

    // Dynamic geocoding autocomplete query
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
                        localStorage.setItem("windy_hollow_active_location", JSON.stringify(window.currentLocation));
                        suggestionBox.classList.add("hidden");
                        input.value = "";
                        triggerAtmosphericRefresh();
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

    // Close autocomplete on external page clicks
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.classList.add("hidden");
        }
    });

    // Keyboard enter search triggers
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const val = input.value.trim();
            if (val) {
                fetchLocationRecordByString(val);
                suggestionBox.classList.add("hidden");
            }
        }
    });

    // Handle Geolocation Coordinates API
    document.getElementById("gps-btn").addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                window.currentLocation = {
                    name: `Current Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
                    lat: lat,
                    lon: lon
                };
                localStorage.setItem("windy_hollow_active_location", JSON.stringify(window.currentLocation));
                triggerAtmosphericRefresh();
            }, () => {
                alert("Location access denied. Restoring standard coordinate sets.");
            });
        }
    });

    // Handle quick save triggers
    document.getElementById("save-current-btn").addEventListener("click", () => {
        saveEnvironmentRecord(window.currentLocation.name, window.currentLocation.lat, window.currentLocation.lon);
        renderSavedShelfChips();
    });
}

/**
 * Convert textual queries into standard coordinates
 */
async function fetchLocationRecordByString(query) {
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
            localStorage.setItem("windy_hollow_active_location", JSON.stringify(window.currentLocation));
            document.getElementById("location-input").value = "";
            triggerAtmosphericRefresh();
        } else {
            alert("Specified city query matched no active entries.");
        }
    } catch (e) {
        console.error("Geocoding coordinates conversion skipped:", e);
    }
}

function getStoredEnvironmentsList() {
    const raw = localStorage.getItem("windy_hollow_saved_environments");
    return raw ? JSON.parse(raw) : [];
}

function saveEnvironmentRecord(name, lat, lon) {
    const list = getStoredEnvironmentsList();
    if (!list.some(item => item.name === name)) {
        list.push({ name, lat, lon });
        localStorage.setItem("windy_hollow_saved_environments", JSON.stringify(list));
    }
}

function deleteEnvironmentRecord(name) {
    let list = getStoredEnvironmentsList();
    list = list.filter(item => item.name !== name);
    localStorage.setItem("windy_hollow_saved_environments", JSON.stringify(list));
    renderSavedShelfChips();
}

/**
 * Hydrates saved locations into UI pills
 */
function renderSavedShelfChips() {
    const container = document.getElementById("saved-list");
    container.innerHTML = "";

    const list = getStoredEnvironmentsList();
    list.forEach(item => {
        const chip = document.createElement("div");
        chip.className = "location-pill";
        chip.innerHTML = `
            <span>📍 ${item.name}</span>
            <span class="delete-pill-cross" data-name="${item.name}">×</span>
        `;

        chip.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-pill-cross")) {
                e.stopPropagation();
                deleteEnvironmentRecord(item.name);
                return;
            }
            window.currentLocation = { name: item.name, lat: item.lat, lon: item.lon };
            localStorage.setItem("windy_hollow_active_location", JSON.stringify(window.currentLocation));
            triggerAtmosphericRefresh();
        });

        container.appendChild(chip);
    });
}

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

function triggerAtmosphericRefresh() {
    if (window.fetchWeatherData) {
        window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
    }
}