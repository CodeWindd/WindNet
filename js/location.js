/* ==========================================================================
   WINDYWEATHER LOCATION MANAGEMENT MODULE
   ========================================================================== */

const fallbackLocation = {
    name: "Dallas, TX",
    lat: 32.7767,
    lon: -96.7970
};

window.currentLocation = { ...fallbackLocation };

document.addEventListener("DOMContentLoaded", () => {
    initLocations();
});

function initLocations() {
    // Hydrate standard configuration if empty
    const saved = getStoredLocations();
    if (saved.length === 0) {
        saveNewLocation(fallbackLocation.name, fallbackLocation.lat, fallbackLocation.lon);
    }

    // Restore last session location
    const storedLast = localStorage.getItem("last_active_location");
    if (storedLast) {
        try {
            window.currentLocation = JSON.parse(storedLast);
        } catch (e) {
            window.currentLocation = { ...fallbackLocation };
        }
    }

    renderSavedShelf();

    const input = document.getElementById("location-input");
    const suggestions = document.getElementById("suggestions");

    // Dynamic autocomplete suggestion dispatcher
    input.addEventListener("input", debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) {
            suggestions.classList.add("hidden");
            return;
        }

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            if (!res.ok) return;

            const data = await res.json();
            if (data.results && data.results.length > 0) {
                suggestions.innerHTML = "";
                data.results.forEach(item => {
                    const country = item.country || "";
                    const state = item.admin1 || "";
                    const label = `${item.name}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`;

                    const el = document.createElement("div");
                    el.className = "suggestion-item";
                    el.textContent = label;
                    el.addEventListener("click", () => {
                        window.currentLocation = {
                            name: label,
                            lat: item.latitude,
                            lon: item.longitude
                        };
                        localStorage.setItem("last_active_location", JSON.stringify(window.currentLocation));
                        suggestions.classList.add("hidden");
                        input.value = "";
                        triggerWeatherFetch();
                    });
                    suggestions.appendChild(el);
                });
                suggestions.classList.remove("hidden");
            } else {
                suggestions.classList.add("hidden");
            }
        } catch (err) {
            console.warn("Geocoder query bypassed:", err);
        }
    }, 350));

    // Handle outside clicks to close autocomplete dropdown
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add("hidden");
        }
    });

    // Handle search triggers
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const val = input.value.trim();
            if (val) {
                fetchLocationByString(val);
                suggestions.classList.add("hidden");
            }
        }
    });

    // Handle geolocation queries
    document.getElementById("gps-btn").addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                window.currentLocation = {
                    name: `Current Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
                    lat: lat,
                    lon: lon
                };
                localStorage.setItem("last_active_location", JSON.stringify(window.currentLocation));
                triggerWeatherFetch();
            }, () => {
                alert("Location access denied. Using fallback coordinates.");
            });
        }
    });

    // Save location trigger
    document.getElementById("save-current-btn").addEventListener("click", () => {
        saveNewLocation(window.currentLocation.name, window.currentLocation.lat, window.currentLocation.lon);
        renderSavedShelf();
    });
}

/**
 * Fetch Coordinates from Text
 */
async function fetchLocationByString(query) {
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
            localStorage.setItem("last_active_location", JSON.stringify(window.currentLocation));
            document.getElementById("location-input").value = "";
            triggerWeatherFetch();
        } else {
            alert("No matching cities found.");
        }
    } catch (e) {
        console.error("Geocoding fetch failed:", e);
    }
}

function getStoredLocations() {
    const raw = localStorage.getItem("windyweather_saved");
    return raw ? JSON.parse(raw) : [];
}

function saveNewLocation(name, lat, lon) {
    const list = getStoredLocations();
    if (!list.some(item => item.name === name)) {
        list.push({ name, lat, lon });
        localStorage.setItem("windyweather_saved", JSON.stringify(list));
    }
}

function removeLocation(name) {
    let list = getStoredLocations();
    list = list.filter(item => item.name !== name);
    localStorage.setItem("windyweather_saved", JSON.stringify(list));
    renderSavedShelf();
}

/**
 * Hydrates saved locations into UI pills
 */
function renderSavedShelf() {
    const container = document.getElementById("saved-list");
    container.innerHTML = "";

    const list = getStoredLocations();
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
                removeLocation(item.name);
                return;
            }
            window.currentLocation = { name: item.name, lat: item.lat, lon: item.lon };
            localStorage.setItem("last_active_location", JSON.stringify(window.currentLocation));
            triggerWeatherFetch();
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

function triggerWeatherFetch() {
    if (window.fetchWeatherData) {
        window.fetchWeatherData(window.currentLocation.lat, window.currentLocation.lon);
    }
}