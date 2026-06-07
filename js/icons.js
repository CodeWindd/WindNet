/* ==========================================================================
   WINDYWEATHER ICONS INTERFACE MODULE
   Exhaustive key-value dictionary and string normalization for 50 icons
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
 * Resolves descriptions to one of the 50 assets.
 * Strips all moisture features if the probability of precipitation < 20%.
 */
window.getWeatherIcon = function(textStr, isDayTime = true, precipPercentage = 0) {
    let cleanText = (textStr || "").toLowerCase().trim();

    // Force strict override if precipitation probability is below 20%
    if (precipPercentage !== null && precipPercentage < 20) {
        // Strip out words implying storm or rain
        cleanText = cleanText.replace(/(heavy|moderate|light|patchy|scattered|isolated|slight chance of)?\s*(rain|shower|drizzle|snow|thunderstorm|tstorm|hail|sleet|precip|flurries)/gi, "").trim();
        if (cleanText === "" || cleanText.includes("chance") || cleanText.includes("likely") || cleanText.includes("slight")) {
            cleanText = "partly cloudy";
        }
    }

    // Extreme environmental attributes
    if (cleanText.includes("tornado")) return window.WEATHER_ICONS.tornado;
    if (cleanText.includes("hurricane") || cleanText.includes("typhoon") || cleanText.includes("tropical storm")) return window.WEATHER_ICONS.hurricane;

    // Atmospheric features
    if (cleanText.includes("dust") && cleanText.includes("wind")) return window.WEATHER_ICONS.dustWind;
    if (cleanText.includes("dust")) return window.WEATHER_ICONS.dust;
    if (cleanText.includes("smoke")) return window.WEATHER_ICONS.smoke;
    if (cleanText.includes("haze")) return window.WEATHER_ICONS.haze;
    if (cleanText.includes("fog")) return isDayTime ? window.WEATHER_ICONS.fogDay : window.WEATHER_ICONS.fogNight;
    if (cleanText.includes("mist")) return window.WEATHER_ICONS.mist;

    // Wind attributes
    if (cleanText.includes("windy") || cleanText.includes("breezy") || cleanText.includes("gale") || cleanText.includes("squall")) {
        return window.WEATHER_ICONS.wind;
    }

    // Thunderstorms
    if (cleanText.includes("thunderstorm") || cleanText.includes("t-storm") || cleanText.includes("tstorm")) {
        if (cleanText.includes("rain") || cleanText.includes("heavy")) {
            return isDayTime ? window.WEATHER_ICONS.thunderstormsDayRain : window.WEATHER_ICONS.thunderstormsNightRain;
        }
        return isDayTime ? window.WEATHER_ICONS.thunderstormsDay : window.WEATHER_ICONS.thunderstormsNight;
    }

    // Hail and Sleet
    if (cleanText.includes("hail")) {
        return isDayTime ? window.WEATHER_ICONS.partlyCloudyDayHail : window.WEATHER_ICONS.partlyCloudyNightHail;
    }
    if (cleanText.includes("sleet") || cleanText.includes("freezing rain")) return window.WEATHER_ICONS.sleet;

    // Winter Snow configurations
    if (cleanText.includes("snow") || cleanText.includes("flurries") || cleanText.includes("blizzard")) {
        if (cleanText.includes("partly") || cleanText.includes("scattered") || cleanText.includes("isolated")) {
            return isDayTime ? window.WEATHER_ICONS.partlyCloudyDaySnow : window.WEATHER_ICONS.partlyCloudyNightSnow;
        }
        return window.WEATHER_ICONS.snow;
    }

    // Rainy profiles
    if (cleanText.includes("drizzle")) {
        if (cleanText.includes("partly") || cleanText.includes("scattered")) {
            return isDayTime ? window.WEATHER_ICONS.partlyCloudyDayDrizzle : window.WEATHER_ICONS.partlyCloudyNightDrizzle;
        }
        return window.WEATHER_ICONS.drizzle;
    }
    if (cleanText.includes("rain") || cleanText.includes("shower")) {
        if (cleanText.includes("partly") || cleanText.includes("scattered") || cleanText.includes("patchy") || cleanText.includes("isolated")) {
            return isDayTime ? window.WEATHER_ICONS.partlyCloudyDayRain : window.WEATHER_ICONS.partlyCloudyNightRain;
        }
        return window.WEATHER_ICONS.rain;
    }

    // Overcast profiles
    if (cleanText.includes("overcast")) return isDayTime ? window.WEATHER_ICONS.overcastDay : window.WEATHER_ICONS.overcastNight;
    if (cleanText.includes("mostly cloudy") || cleanText.includes("broken")) return window.WEATHER_ICONS.cloudy;
    if (cleanText.includes("partly cloudy") || cleanText.includes("partly sunny") || cleanText.includes("scattered clouds")) {
        return isDayTime ? window.WEATHER_ICONS.partlyCloudyDay : window.WEATHER_ICONS.partlyCloudyNight;
    }
    if (cleanText.includes("cloudy")) return window.WEATHER_ICONS.cloudy;

    // Clear and Sunny configurations
    if (cleanText.includes("sunny") || cleanText.includes("clear") || cleanText.includes("fair")) {
        return isDayTime ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
    }

    // Universal clear fallback
    return isDayTime ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
};