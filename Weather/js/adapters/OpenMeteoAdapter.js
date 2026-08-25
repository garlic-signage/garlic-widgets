import {BaseAdapter} from './BaseAdapter.js';

/**
 * OpenMeteoAdapter
 * No API key required for the free tier.
 * With API key: routes to the commercial endpoint.
 * Docs: https://open-meteo.com/en/docs
 */
export class OpenMeteoAdapter extends BaseAdapter {

    constructor(apiKey = '') {
        super(apiKey);
        const commercial = apiKey.length > 0;
        this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
        this.forecastUrl = commercial
            ? 'https://customer-api.open-meteo.com/v1/forecast'
            : 'https://api.open-meteo.com/v1/forecast';
    }

    async fetchByCoords(lat, lon) {
        const url = this.#buildForecastUrl(lat, lon);
        const data = await this.get(url);
        return this.#normalize(data, lat, lon, null);
    }

    async fetchByCity(city) {
        const geo = await this.#geocode(city);
        const url = this.#buildForecastUrl(geo.latitude, geo.longitude);
        const data = await this.get(url);
        return this.#normalize(data, geo.latitude, geo.longitude, geo.name);
    }

    async #geocode(city) {
        const url = `${this.geocodingUrl}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const data = await this.get(url);
        if (!data.results || data.results.length === 0) {
            throw new Error(`OpenMeteo: Location "${city}" not found.`);
        }
        return data.results[0];
    }

    #buildForecastUrl(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max',
            wind_speed_unit: 'kmh',
            timezone: 'auto',
            forecast_days: 4   // today + 3 days
        });
        if (this.apiKey) params.set('apikey', this.apiKey);
        return `${this.forecastUrl}?${params}`;
    }

    #normalize(data, lat, lon, locationName) {
        const c = data.current;
        const d = data.daily;
        const schema = this.normalizedSchema();

        schema.temperature = c.temperature_2m;
        schema.feels_like = c.apparent_temperature;
        schema.humidity = c.relative_humidity_2m;
        schema.wind_speed = c.wind_speed_10m;
        schema.wind_direction = c.wind_direction_10m;
        schema.condition = this.#mapCondition(c.weather_code, c.is_day);
        schema.condition_text = this.#conditionText(c.weather_code);
        schema.is_day = c.is_day === 1;
        schema.location = locationName ?? `${lat}, ${lon}`;
        schema.lat = lat;
        schema.lon = lon;
        schema.provider = 'open-meteo';

        // Skip index 0 (today), take next 3 days
        schema.forecast = d.time.slice(1, 4).map((date, i) => ({
            date: date,
            temp_min: d.temperature_2m_min[i + 1],
            temp_max: d.temperature_2m_max[i + 1],
            condition: this.#mapCondition(d.weather_code[i + 1], 1),
            humidity: d.relative_humidity_2m_mean[i + 1],
            wind_speed: d.wind_speed_10m_max[i + 1]
        }));

        return schema;
    }

    /**
     * WMO weather code → normalized condition key
     * https://open-meteo.com/en/docs#weathervariables
     */
    #mapCondition(code, isDay = 1) {
        if (code === 0) return isDay ? 'sunny' : 'clear_night';
        if (code === 1) return isDay ? 'mostly_sunny' : 'mostly_clear_night';
        if (code === 2) return 'partly_cloudy';
        if (code === 3) return 'cloudy';
        if ([45, 48].includes(code)) return 'fog';
        if ([51, 53, 55].includes(code)) return 'drizzle';
        if ([56, 57].includes(code)) return 'freezing_drizzle';
        if ([61, 63, 65].includes(code)) return 'rain';
        if ([66, 67].includes(code)) return 'freezing_rain';
        if ([71, 73, 75, 77].includes(code)) return 'snow';
        if ([80, 81, 82].includes(code)) return 'showers';
        if ([85, 86].includes(code)) return 'snow_showers';
        if ([95].includes(code)) return 'thunderstorm';
        if ([96, 99].includes(code)) return 'thunderstorm_hail';
        return 'unknown';
    }

    #conditionText(code) {
        const map = {
            0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy',
            45: 'Fog', 48: 'Freezing fog',
            51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
            61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
            71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
            80: 'Showers', 81: 'Heavy showers', 82: 'Violent showers',
            95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
        };
        return map[code] ?? 'Unknown';
    }
}
