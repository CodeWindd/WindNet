/* ==========================================================================
   WINDYWEATHER ICONS INTERFACE MODULE
   Includes detailed mapping variables for all 50 animated SVGs.
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
 * Normalizes dynamic API condition fields to match the 50 CDN assets.
 * Implements the <20% precipitation rule to replace rain/snow elements with pure sky conditions.
 */
window.getWeatherIcon = function(conditionText, isDay = true, precipitationPercent = 0) {
    let text = (conditionText || "").toLowerCase().trim();

    // Core rule logic: if precipitation is below 20%, ignore water descriptors entirely
    if (precipitationPercent !== null && precipitationPercent < 20) {
        text = text.replace(/(heavy|moderate|light|chance of|patchy|scattered|isolated|slight chance)?\s*(rain|shower|drizzle|snow|thunderstorm|tstorm|hail|sleet|precip|flurries)/gi, "").trim();
        if (text === "" || text.includes("chance") || text.includes("likely") || text.includes("slight")) {
            text = "partly cloudy";
        }
    }

    // Tornadoes and Hurricanes
    if (text.includes("tornado")) return window.WEATHER_ICONS.tornado;
    if (text.includes("hurricane") || text.includes("typhoon") || text.includes("tropical storm")) return window.WEATHER_ICONS.hurricane;

    // Atmospheric conditions
    if (text.includes("dust") && text.includes("wind")) return window.WEATHER_ICONS.dustWind;
    if (text.includes("dust")) return window.WEATHER_ICONS.dust;
    if (text.includes("smoke")) return window.WEATHER_ICONS.smoke;
    if (text.includes("haze")) return window.WEATHER_ICONS.haze;
    if (text.includes("fog")) return isDay ? window.WEATHER_ICONS.fogDay : window.WEATHER_ICONS.fogNight;
    if (text.includes("mist")) return window.WEATHER_ICONS.mist;

    // Wind events
    if (text.includes("windy") || text.includes("breezy") || text.includes("gale") || text.includes("squall")) {
        return window.WEATHER_ICONS.wind;
    }

    // Storms / Thunderstorms
    if (text.includes("thunderstorm") || text.includes("t-storm") || text.includes("tstorm")) {
        if (text.includes("rain") || text.includes("heavy")) {
            return isDay ? window.WEATHER_ICONS.thunderstormsDayRain : window.WEATHER_ICONS.thunderstormsNightRain;
        }
        return isDay ? window.WEATHER_ICONS.thunderstormsDay : window.WEATHER_ICONS.thunderstormsNight;
    }

    // Sleet and Hail
    if (text.includes("hail")) {
        return isDay ? window.WEATHER_ICONS.partlyCloudyDayHail : window.WEATHER_ICONS.partlyCloudyNightHail;
    }
    if (text.includes("sleet") || text.includes("freezing rain")) return window.WEATHER_ICONS.sleet;

    // Snow Elements
    if (text.includes("snow") || text.includes("flurries") || text.includes("blizzard")) {
        if (text.includes("partly") || text.includes("scattered") || text.includes("isolated")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDaySnow : window.WEATHER_ICONS.partlyCloudyNightSnow;
        }
        return window.WEATHER_ICONS.snow;
    }

    // Rainy conditions
    if (text.includes("drizzle")) {
        if (text.includes("partly") || text.includes("scattered")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDayDrizzle : window.WEATHER_ICONS.partlyCloudyNightDrizzle;
        }
        return window.WEATHER_ICONS.drizzle;
    }
    if (text.includes("rain") || text.includes("shower")) {
        if (text.includes("partly") || text.includes("scattered") || text.includes("patchy") || text.includes("isolated")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDayRain : window.WEATHER_ICONS.partlyCloudyNightRain;
        }
        return window.WEATHER_ICONS.rain;
    }

    // Overcast and Clouds
    if (text.includes("overcast")) return isDay ? window.WEATHER_ICONS.overcastDay : window.WEATHER_ICONS.overcastNight;
    if (text.includes("mostly cloudy") || text.includes("broken")) return window.WEATHER_ICONS.cloudy;
    if (text.includes("partly cloudy") || text.includes("partly sunny") || text.includes("scattered clouds")) {
        return isDay ? window.WEATHER_ICONS.partlyCloudyDay : window.WEATHER_ICONS.partlyCloudyNight;
    }
    if (text.includes("cloudy")) return window.WEATHER_ICONS.cloudy;

    // Clear sky conditions
    if (text.includes("sunny") || text.includes("clear") || text.includes("fair")) {
        return isDay ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
    }

    // Default fallback
    return isDay ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
};