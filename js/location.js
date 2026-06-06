const defaultLocation = {
    name: "Dallas, TX",
    lat: 32.7767,
    lon: -96.7970
};

window.currentLocation = { ...defaultLocation };

document.addEventListener("DOMContentLoaded", () => {
    initLocationService();
});

function initLocationService() {
    const savedLocs = getSavedLocations();
    if (savedLocs.length === 0) {
        // Hydrate default saved locations with Dallas
        saveLocation(defaultLocation.name, defaultLocation.lat, defaultLocation.lon);
    }
    
    // Load last viewed location or default
    const lastSessionLoc = localStorage.getItem("last_viewed_location");
    if (lastSessionLoc) {
        try {
            window.currentLocation = JSON.parse(lastSessionLoc);
        } catch(e) {
            window.currentLocation = { ...defaultLocation };
        }
    } else {
        window.currentLocation = { ...defaultLocation };
    }

    renderSavedLocations();

    const input = document.getElementById("location-input");
    const suggestions = document.getElementById("suggestions");

    // Input autocomplete geocoder suggestions
    input.addEventListener("input", debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) {
            suggestions.classList.add("hidden");
            return;
        }

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                suggestions.innerHTML = "";
                data.results.forEach(item => {
                    const country = item.country || "";
                    const admin1 = item.admin1 || "";
                    const displayName = `${item.name}${admin1 ? ', ' + admin1 : ''}${country ? ', ' + country : ''}`;
                    
                    const el = document.createElement("div");
                    el.className = "suggestion-item";
                    el.textContent = displayName;
                    el.addEventListener("click", () => {
                        window.currentLocation = {
                            name: displayName,
                            lat: item.latitude,
                            lon: item.longitude
                        };
                        localStorage.setItem("last_viewed_location", JSON.stringify(window.currentLocation));
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
            console.warn("Geocoder query missed data endpoint:", err);
        }
    }, 400));

    // Handle outside clicks
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add("hidden");
        }
    });

    // Handle manual primary search
    document.getElementById("search-btn").addEventListener("click", () => {
        const query = input.value.trim();
        if (query) {
            fetchGeocodeAndLoad(query);
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const query = input.value.trim();
            if (query) {
                fetchGeocodeAndLoad(query);
                suggestions.classList.add("hidden");
            }
        }
    });

    // Handle GPS trigger
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
                localStorage.setItem("last_viewed_location", JSON.stringify(window.currentLocation));
                triggerWeatherFetch();
            }, () => {
                alert("Location access was denied. Utilizing fallback coords.");
            });
        }
    });

    // Handle Quick Save Button
    document.getElementById("save-current-btn").addEventListener("click", () => {
        saveLocation(window.currentLocation.name, window.currentLocation.lat, window.currentLocation.lon);
        renderSavedLocations();
    });
}

async function fetchGeocodeAndLoad(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const top = data.results[0];
            const name = `${top.name}${top.admin1 ? ', ' + top.admin1 : ''}, ${top.country}`;
            window.currentLocation = { name, lat: top.latitude, lon: top.longitude };
            localStorage.setItem("last_viewed_location", JSON.stringify(window.currentLocation));
            document.getElementById("location-input").value = "";
            triggerWeatherFetch();
        } else {
            alert("Location search matches no active stations.");
        }
    } catch (e) {
        console.error("Geocoding failed", e);
    }
}

function getSavedLocations() {
    const list = localStorage.getItem("saved_locations");
    return list ? JSON.parse(list) : [];
}

function saveLocation(name, lat, lon) {
    let current = getSavedLocations();
    // Exclude duplicates
    if (!current.some(item => item.name === name || (Math.abs(item.lat - lat) < 0.01 && Math.abs(item.lon - lon) < 0.01))) {
        current.push({ name, lat, lon });
        localStorage.setItem("saved_locations", JSON.stringify(current));
    }
}

function deleteLocation(name) {
    let current = getSavedLocations();
    current = current.filter(item => item.name !== name);
    localStorage.setItem("saved_locations", JSON.stringify(current));
    renderSavedLocations();
}

function renderSavedLocations() {
    const container = document.getElementById("saved-list");
    container.innerHTML = "";
    const list = getSavedLocations();
    
    list.forEach(item => {
        const pill = document.createElement("div");
        pill.className = "saved-pill";
        pill.innerHTML = `<span>📍 ${item.name}</span><span class="delete-saved" data-name="${item.name}">×</span>`;
        
        pill.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-saved")) {
                e.stopPropagation();
                deleteLocation(item.name);
                return;
            }
            window.currentLocation = { name: item.name, lat: item.lat, lon: item.lon };
            localStorage.setItem("last_viewed_location", JSON.stringify(window.currentLocation));
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