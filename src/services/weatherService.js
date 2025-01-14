import { DateTime } from "luxon";

const API_KEY = '0733a9a36ed76b4d2bc109a42a04b414';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Get weather data from API
const getWeatherData = async (infoType, searchParams) => {
    const url = new URL(BASE_URL + '/' + infoType);
    url.search = new URLSearchParams({ ...searchParams, appid: API_KEY });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('City not found or API request failed');
    }

    return response.json();
};

// Format current weather
const formatCurrentWeather = (data) => {
    const {
        coord: { lat, lon },
        main: { temp, feels_like, temp_min, temp_max, humidity },
        name,
        dt,
        sys: { country, sunrise, sunset },
        weather,
        wind: { speed }
    } = data;

    const { main: details, icon } = weather[0];

    return { lat, lon, temp, feels_like, temp_min, temp_max, humidity, name, dt, country, sunrise, sunset, details, icon, speed };
};

// Format forecast weather
const formatForecastWeather = (data) => {
    let { timezone, daily, hourly } = data;
    daily = daily.slice(1, 6).map(d => {
        return {
            title: formatToLocalTime(d.dt, timezone, 'ccc'),
            temp: d.temp.day,
            icon: d.weather[0].icon
        }
    });

    hourly = hourly.slice(1, 6).map(d => {
        return {
            title: formatToLocalTime(d.dt, timezone, 'hh:mm a'),
            temp: d.temp,
            icon: d.weather[0].icon
        }
    });

    return { daily, hourly, timezone };
}

const getFormattedWeatherData = async (searchParams) => {
    try {
        const formattedCurrentWeather = await getWeatherData('weather', searchParams)
            .then(formatCurrentWeather);

        const { lat, lon } = formattedCurrentWeather;
        const formattedForecastWeather = await getWeatherData('onecall', {
            lat, lon, exclude: 'current, minutely, alerts', units: searchParams.units
        }).then(formatForecastWeather);

        return { ...formattedCurrentWeather, ...formattedForecastWeather };
    } catch (error) {

        return null;

    }
};

const formatToLocalTime = (secs, zone, format = "cccc, dd LLL yyyy' | Local time: 'hh:mm a") =>
    DateTime.fromSeconds(secs).setZone(zone).toFormat(format);

const iconUrlFromCode = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
