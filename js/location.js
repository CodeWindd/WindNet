const defaultLocation = {
    name: "Chicago, IL",
    lat: 41.8781,
    lon: -87.6298
};

window.currentLocation = { ...defaultLocation };

document.addEventListener("DOMContentLoaded", () => {
    initLocationService();
});

function initLocationService() {
    const savedLocs = getSavedLocations();
    if (savedLocs.length === 0) {
        saveLocation(defaultLocation.name, defaultLocation.lat, defaultLocation.lon);
    }
    
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
            console.warn("Geocoding service skipped: ", err);
        }
    }, 400));

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add("hidden");
        }
    });

    document.getElementById("gps-btn").addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                window.currentLocation = {
                    name: `My Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
                    lat: lat,
                    lon: lon
                };
                localStorage.setItem("last_viewed_location", JSON.stringify(window.currentLocation));
                triggerWeatherFetch();
            }, () => {
                alert("GPS connection failed. Access permissions restricted.");
            });
        }
    });

    document.getElementById("save-current-btn").addEventListener("click", () => {
        saveLocation(window.currentLocation.name, window.currentLocation.lat, window.currentLocation.lon);
        renderSavedLocations();
    });
}

function getSavedLocations() {
    const list = localStorage.getItem("saved_locations");
    return list ? JSON.parse(list) : [];
}

function saveLocation(name, lat, lon) {
    let current = getSavedLocations();
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