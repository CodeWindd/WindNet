/* ==========================================================================
   WINDYWEATHER ICONS INTERFACE MODULE
   Strict key-value bindings for all 50 animated icons
   ========================================================================== */

window.WEATHER_ICONS = {
    // Core Weather Conditions
    clearDay: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/clear-day.svg",
    clearNight: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/clear-night.svg",
    cloudy: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/cloudy.svg",
    overcast: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/overcast.svg",
    overcastDay: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/overcast-day.svg",
    overcastNight: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/overcast-night.svg",
    mist: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/mist.svg",
    fog: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/fog.svg",
    fogDay: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/fog-day.svg",
    fogNight: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/fog-night.svg",

    // Mixed Weather (Partly Cloudy)
    partlyCloudyDay: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day.svg",
    partlyCloudyNight: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-night.svg",
    partlyCloudyDayRain: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day-rain.svg",
    partlyCloudyNightRain: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-night-rain.svg",
    partlyCloudyDaySnow: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day-snow.svg",
    partlyCloudyNightSnow: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-night-snow.svg",
    partlyCloudyDayHail: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day-hail.svg",
    partlyCloudyNightHail: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-night-hail.svg",
    partlyCloudyDayDrizzle: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day-drizzle.svg",
    partlyCloudyNightDrizzle: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-night-drizzle.svg",

    // Precipitation & Storms
    drizzle: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/drizzle.svg",
    rain: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/rain.svg",
    snow: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/snow.svg",
    hail: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/hail.svg",
    sleet: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/sleet.svg",
    thunderstorms: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/thunderstorms.svg",
    thunderstormsDay: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/thunderstorms-day.svg",
    thunderstormsNight: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/thunderstorms-night.svg",
    thunderstormsDayRain: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/thunderstorms-day-rain.svg",
    thunderstormsNightRain: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/thunderstorms-night-rain.svg",

    // Severe Weather & Atmosphere
    tornado: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/tornado.svg",
    hurricane: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/hurricane.svg",
    wind: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/wind.svg",
    dust: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/dust.svg",
    dustWind: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/dust-wind.svg",
    haze: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/haze.svg",
    smoke: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/smoke.svg",

    // Astronomical & Moon Phases
    sunrise: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/sunrise.svg",
    sunset: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/sunset.svg",
    horizon: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/horizon.svg",
    solarEclipse: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/solar-eclipse.svg",
    starryNight: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/starry-night.svg",
    moonNew: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/moon-new.svg",
    moonFull: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/moon-full.svg",
    moonFirstQuarter: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/moon-first-quarter.svg",

    // Instruments & Miscellaneous
    thermometer: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/thermometer.svg",
    barometer: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/barometer.svg",
    humidity: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/humidity.svg",
    windsock: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/windsock.svg",
    umbrella: "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/umbrella.svg"
};

/**
 * Parses descriptions to select the correct icon.
 * Cleans out precipitation markers if probability < 20%.
 */
window.getWeatherIcon = function(conditionText, isDay = true, precipPercent = 0) {
    let cleanText = (conditionText || "").toLowerCase().trim();

    // STRICT OVERRIDE: If precip probability is under 20%, clean forecast text
    if (precipPercent !== null && precipPercent < 20) {
        cleanText = cleanText.replace(/(heavy|moderate|light|patchy|scattered|isolated|slight chance of)?\s*(rain|shower|drizzle|snow|thunderstorm|tstorm|hail|sleet|precip|flurries)/gi, "").trim();
        if (cleanText === "" || cleanText.includes("chance") || cleanText.includes("likely") || cleanText.includes("slight")) {
            cleanText = "partly cloudy";
        }
    }

    // Severe conditions
    if (cleanText.includes("tornado")) return window.WEATHER_ICONS.tornado;
    if (cleanText.includes("hurricane") || cleanText.includes("typhoon") || cleanText.includes("tropical storm")) return window.WEATHER_ICONS.hurricane;

    // Atmosphere features
    if (cleanText.includes("dust") && cleanText.includes("wind")) return window.WEATHER_ICONS.dustWind;
    if (cleanText.includes("dust")) return window.WEATHER_ICONS.dust;
    if (cleanText.includes("smoke")) return window.WEATHER_ICONS.smoke;
    if (cleanText.includes("haze")) return window.WEATHER_ICONS.haze;
    if (cleanText.includes("fog")) return isDay ? window.WEATHER_ICONS.fogDay : window.WEATHER_ICONS.fogNight;
    if (cleanText.includes("mist")) return window.WEATHER_ICONS.mist;

    // Wind dynamics
    if (cleanText.includes("windy") || cleanText.includes("breezy") || cleanText.includes("gale") || cleanText.includes("squall")) {
        return window.WEATHER_ICONS.wind;
    }

    // Storm developments
    if (cleanText.includes("thunderstorm") || cleanText.includes("t-storm") || cleanText.includes("tstorm")) {
        if (cleanText.includes("rain") || cleanText.includes("heavy")) {
            return isDay ? window.WEATHER_ICONS.thunderstormsDayRain : window.WEATHER_ICONS.thunderstormsNightRain;
        }
        return isDay ? window.WEATHER_ICONS.thunderstormsDay : window.WEATHER_ICONS.thunderstormsNight;
    }

    // Sleet and Hail
    if (cleanText.includes("hail")) {
        return isDay ? window.WEATHER_ICONS.partlyCloudyDayHail : window.WEATHER_ICONS.partlyCloudyNightHail;
    }
    if (cleanText.includes("sleet") || cleanText.includes("freezing rain")) return window.WEATHER_ICONS.sleet;

    // Snow elements
    if (cleanText.includes("snow") || cleanText.includes("flurries") || cleanText.includes("blizzard")) {
        if (cleanText.includes("partly") || cleanText.includes("scattered") || cleanText.includes("isolated")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDaySnow : window.WEATHER_ICONS.partlyCloudyNightSnow;
        }
        return window.WEATHER_ICONS.snow;
    }

    // Rainy profiles
    if (cleanText.includes("drizzle")) {
        if (cleanText.includes("partly") || cleanText.includes("scattered")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDayDrizzle : window.WEATHER_ICONS.partlyCloudyNightDrizzle;
        }
        return window.WEATHER_ICONS.drizzle;
    }
    if (cleanText.includes("rain") || cleanText.includes("shower")) {
        if (cleanText.includes("partly") || cleanText.includes("scattered") || cleanText.includes("patchy") || cleanText.includes("isolated")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDayRain : window.WEATHER_ICONS.partlyCloudyNightRain;
        }
        return window.WEATHER_ICONS.rain;
    }

    // Cloud layers
    if (cleanText.includes("overcast")) return isDay ? window.WEATHER_ICONS.overcastDay : window.WEATHER_ICONS.overcastNight;
    if (cleanText.includes("mostly cloudy") || cleanText.includes("broken")) return window.WEATHER_ICONS.cloudy;
    if (cleanText.includes("partly cloudy") || cleanText.includes("partly sunny") || cleanText.includes("scattered clouds")) {
        return isDay ? window.WEATHER_ICONS.partlyCloudyDay : window.WEATHER_ICONS.partlyCloudyNight;
    }
    if (cleanText.includes("cloudy")) return window.WEATHER_ICONS.cloudy;

    // Clear profiles
    if (cleanText.includes("sunny") || cleanText.includes("clear") || cleanText.includes("fair")) {
        return isDay ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
    }

    // Fallback
    return isDay ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
};