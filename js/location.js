/* ==========================================================================
   WINDYWEATHER GEOGRAPHICAL LOCATION INTERFACES
   Pre-coded US Location Array and Census Geocoder API for US Locations
   ========================================================================== */

// Predefined high-accuracy US Location Array
const US_LOCATION_ARRAY = [
    { name: "Dallas, TX", lat: 32.7767, lon: -96.7970 },
    { name: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
    { name: "New York, NY", lat: 40.7128, lon: -74.0060 },
    { name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
    { name: "Miami, FL", lat: 25.7617, lon: -80.1918 },
    { name: "Seattle, WA", lat: 47.6062, lon: -122.3321 },
    { name: "San Francisco, CA", lat: 37.7749, lon: -122.4194 },
    { name: "Denver, CO", lat: 39.7392, lon: -104.9903 },
    { name: "Boston, MA", lat: 42.3601, lon: -71.0589 },
    { name: "Austin, TX", lat: 30.2672, lon: -97.7431 },
    { name: "Atlanta, GA", lat: 33.7490, lon: -84.3880 },
    { name: "Washington, DC", lat: 38.9072, lon: -77.0369 },
    { name: "Phoenix, AZ", lat: 33.4484, lon: -112.0740 }
];

window.currentLocation = { ...US_LOCATION_ARRAY[0] }; // Default: Dallas, TX

document.addEventListener("DOMContentLoaded", () => {
    initLocalLocationCaches();
});

function initLocalLocationCaches() {
    const saved = getStoredEnvironmentsList();
    if (saved.length === 0) {
        US_LOCATION_ARRAY.slice(0, 3).forEach(city => {
            saveEnvironmentRecord(city.name, city.lat, city.lon);
        });
    }

    const lastActiveCoordinatesRecord = localStorage.getItem("windy_pixel_active_location");
    if (lastActiveCoordinatesRecord) {
        try {
            window.currentLocation = JSON.parse(lastActiveCoordinatesRecord);
        } catch (e) {
            window.currentLocation = { ...US_LOCATION_ARRAY[0] };
        }
    }

    renderSavedShelfChips();

    const input = document.getElementById("location-input");
    const suggestionBox = document.getElementById("suggestions");
    const searchOverlay = document.getElementById("search-overlay");

    // Click handler to open search overlay
    document.getElementById("search-trigger-btn").addEventListener("click", () => {
        searchOverlay.classList.remove("hidden");
    });

    // Close search overlay
    document.getElementById("close-search-btn").addEventListener("click", () => {
        searchOverlay.classList.add("hidden");
    });

    // Dynamic autocomplete suggestion dispatcher
    input.addEventListener("input", debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) {
            suggestionBox.classList.add("hidden");
            return;
        }

        // Step 1: Check static US Array first for ultra-fast local matches
        const arrayMatches = US_LOCATION_ARRAY.filter(city => 
            city.name.toLowerCase().includes(query.toLowerCase())
        );

        suggestionBox.innerHTML = "";

        if (arrayMatches.length > 0) {
            arrayMatches.forEach(match => {
                appendSuggestionItem(match.name, match.lat, match.lon, suggestionBox, searchOverlay);
            });
            suggestionBox.classList.remove("hidden");
            return;
        }

        // Step 2: Query US Census Geocoder API for any US addresses or zip queries
        try {
            const censusUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`;
            const res = await fetch(censusUrl);
            
            if (res.ok) {
                const data = await res.json();
                if (data.result && data.result.addressMatches && data.result.addressMatches.length > 0) {
                    data.result.addressMatches.slice(0, 3).forEach(match => {
                        const coords = match.coordinates;
                        const label = match.matchedAddress;
                        appendSuggestionItem(label, coords.y, coords.x, suggestionBox, searchOverlay);
                    });
                    suggestionBox.classList.remove("hidden");
                    return;
                }
            }
        } catch (err) {
            console.warn("Census Geocoder skipped, trying global fallback.", err);
        }

        // Step 3: Global Open-Meteo Geocoder API fallback
        try {
            const globalGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
            const res = await fetch(globalGeocodeUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    data.results.forEach(item => {
                        const state = item.admin1 || "";
                        const country = item.country || "";
                        const label = `${item.name}${state ? ', ' + state : ''}, ${country}`;
                        appendSuggestionItem(label, item.latitude, item.longitude, suggestionBox, searchOverlay);
                    });
                    suggestionBox.classList.remove("hidden");
                }
            }
        } catch (err) {
            console.warn("Global geocoder fail:", err);
        }
    }, 400));

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

    // Geolocation coords
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
                localStorage.setItem("windy_pixel_active_location", JSON.stringify(window.currentLocation));
                triggerAtmosphericRefresh();
            }, () => {
                alert("Location access denied.");
            });
        }
    });

    // Save Environment Record
    document.getElementById("save-current-btn").addEventListener("click", () => {
        saveEnvironmentRecord(window.currentLocation.name, window.currentLocation.lat, window.currentLocation.lon);
        renderSavedShelfChips();
    });
}

function appendSuggestionItem(label, lat, lon, container, overlay) {
    const row = document.createElement("div");
    row.className = "suggestion-item";
    row.textContent = label;
    row.addEventListener("click", () => {
        window.currentLocation = { name: label, lat, lon };
        localStorage.setItem("windy_pixel_active_location", JSON.stringify(window.currentLocation));
        container.classList.add("hidden");
        document.getElementById("location-input").value = "";
        overlay.classList.add("hidden");
        triggerAtmosphericRefresh();
    });
    container.appendChild(row);
}

/**
 * Fetch Coordinates from Text string lookup
 */
async function fetchLocationRecordByString(query) {
    // Check static US Location Array first
    const staticMatch = US_LOCATION_ARRAY.find(city => city.name.toLowerCase().includes(query.toLowerCase()));
    if (staticMatch) {
        window.currentLocation = { ...staticMatch };
        localStorage.setItem("windy_pixel_active_location", JSON.stringify(window.currentLocation));
        document.getElementById("search-overlay").classList.add("hidden");
        triggerAtmosphericRefresh();
        return;
    }

    // Try Census Geocoder / Open-Meteo fallback geocoding lookup
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const top = data.results[0];
            const state = top.admin1 || "";
            const label = `${top.name}${state ? ', ' + state : ''}, ${top.country}`;

            window.currentLocation = { name: label, lat: top.latitude, lon: top.longitude };
            localStorage.setItem("windy_pixel_active_location", JSON.stringify(window.currentLocation));
            document.getElementById("location-input").value = "";
            document.getElementById("search-overlay").classList.add("hidden");
            triggerAtmosphericRefresh();
        } else {
            alert("No results found.");
        }
    } catch (e) {
        console.error("Geocoding conversion skipped:", e);
    }
}

function getStoredEnvironmentsList() {
    const raw = localStorage.getItem("windy_pixel_saved_environments");
    return raw ? JSON.parse(raw) : [];
}

function saveEnvironmentRecord(name, lat, lon) {
    const list = getStoredEnvironmentsList();
    if (!list.some(item => item.name === name)) {
        list.push({ name, lat, lon });
        localStorage.setItem("windy_pixel_saved_environments", JSON.stringify(list));
    }
}

function deleteEnvironmentRecord(name) {
    let list = getStoredEnvironmentsList();
    list = list.filter(item => item.name !== name);
    localStorage.setItem("windy_pixel_saved_environments", JSON.stringify(list));
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
            <span>📍 ${item.name.split(',')[0]}</span>
            <span class="delete-pill-cross" data-name="${item.name}">×</span>
        `;

        chip.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-pill-cross")) {
                e.stopPropagation();
                deleteEnvironmentRecord(item.name);
                return;
            }
            window.currentLocation = { name: item.name, lat: item.lat, lon: item.lon };
            localStorage.setItem("windy_pixel_active_location", JSON.stringify(window.currentLocation));
            document.getElementById("search-overlay").classList.add("hidden");
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