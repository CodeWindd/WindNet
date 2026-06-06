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
 * Clean and match forecast text strings to actual CDNs.
 * Incorporates: If precipitation probability < 20%, replace precipitation graphics with clear or cloudy states.
 */
window.getWeatherIcon = function(forecastText, isDay = true, precipProb = 0) {
    let desc = (forecastText || "").toLowerCase();
    
    const ignorePrecip = (precipProb !== null && precipProb < 20);

    if (ignorePrecip) {
        desc = desc.replace(/(rain|shower|drizzle|snow|thunderstorm|tstorm|hail|sleet|flurries)/g, "");
        if (desc.trim() === "" || desc.includes("chance") || desc.includes("slight")) {
            desc = "partly cloudy";
        }
    }

    if (desc.includes("tornado")) return window.WEATHER_ICONS.tornado;
    if (desc.includes("hurricane") || desc.includes("typhoon")) return window.WEATHER_ICONS.hurricane;
    if (desc.includes("dust") && desc.includes("wind")) return window.WEATHER_ICONS.dustWind;
    if (desc.includes("dust")) return window.WEATHER_ICONS.dust;
    if (desc.includes("smoke")) return window.WEATHER_ICONS.smoke;
    if (desc.includes("haze")) return window.WEATHER_ICONS.haze;

    if (desc.includes("fog")) {
        return isDay ? window.WEATHER_ICONS.fogDay : window.WEATHER_ICONS.fogNight;
    }
    if (desc.includes("mist")) return window.WEATHER_ICONS.mist;

    if (desc.includes("windy") || desc.includes("breezy") || desc.includes("gale")) {
        return window.WEATHER_ICONS.wind;
    }

    if (desc.includes("thunderstorm") || desc.includes("tstorm")) {
        if (desc.includes("rain")) {
            return isDay ? window.WEATHER_ICONS.thunderstormsDayRain : window.WEATHER_ICONS.thunderstormsNightRain;
        }
        return isDay ? window.WEATHER_ICONS.thunderstormsDay : window.WEATHER_ICONS.thunderstormsNight;
    }

    if (desc.includes("hail")) {
        return isDay ? window.WEATHER_ICONS.partlyCloudyDayHail : window.WEATHER_ICONS.partlyCloudyNightHail;
    }
    if (desc.includes("sleet")) return window.WEATHER_ICONS.sleet;

    if (desc.includes("snow") || desc.includes("flurries") || desc.includes("blizzard")) {
        if (desc.includes("partly") || desc.includes("scattered")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDaySnow : window.WEATHER_ICONS.partlyCloudyNightSnow;
        }
        return window.WEATHER_ICONS.snow;
    }

    if (desc.includes("drizzle")) {
        if (desc.includes("partly") || desc.includes("scattered")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDayDrizzle : window.WEATHER_ICONS.partlyCloudyNightDrizzle;
        }
        return window.WEATHER_ICONS.drizzle;
    }

    if (desc.includes("rain") || desc.includes("shower")) {
        if (desc.includes("partly") || desc.includes("scattered") || desc.includes("patchy")) {
            return isDay ? window.WEATHER_ICONS.partlyCloudyDayRain : window.WEATHER_ICONS.partlyCloudyNightRain;
        }
        return window.WEATHER_ICONS.rain;
    }

    if (desc.includes("overcast")) {
        return isDay ? window.WEATHER_ICONS.overcastDay : window.WEATHER_ICONS.overcastNight;
    }
    if (desc.includes("mostly cloudy")) {
        return window.WEATHER_ICONS.cloudy;
    }
    if (desc.includes("partly cloudy") || desc.includes("partly sunny") || desc.includes("scattered clouds") || desc.includes("broken")) {
        return isDay ? window.WEATHER_ICONS.partlyCloudyDay : window.WEATHER_ICONS.partlyCloudyNight;
    }
    if (desc.includes("cloudy")) {
        return window.WEATHER_ICONS.cloudy;
    }

    return isDay ? window.WEATHER_ICONS.clearDay : window.WEATHER_ICONS.clearNight;
};