import { BaseAdapter } from './BaseAdapter.js';

/**
 * WeatherApiAdapter
 * API key required (free plan: 1M calls/month).
 * Docs: https://www.weatherapi.com/docs/
 */
export class WeatherApiAdapter extends BaseAdapter
{
	#baseUrl;

    constructor(apiKey = '')
	{
        super(apiKey);
        this.#baseUrl = 'https://api.weatherapi.com/v1';
    }

    async fetchByCoords(lat, lon)
	{
        return this._fetch(`${lat},${lon}`);
    }

    async fetchByCity(city)
	{
        return this._fetch(encodeURIComponent(city));
    }

    async _fetch(query)
	{
        const url  = `${this.#baseUrl}/forecast.json?key=${this.apiKey}&q=${query}&days=7&aqi=no&alerts=no&lang=en`;
        const data = await this.get(url);
        return this.#normalize(data);
    }

    #normalize(data)
	{
        const schema  = this.normalizedSchema();
        const current = data.current;
        const loc     = data.location;
        const today   = new Date().toISOString().split('T')[0];

        schema.temperature    = current.temp_c;
        schema.feels_like     = current.feelslike_c;
        schema.humidity       = current.humidity;
        schema.wind_speed     = current.wind_kph;
        schema.wind_direction = current.wind_degree;
        schema.condition      = this.#mapCondition(current.condition.code, current.is_day);
        schema.condition_text = current.condition.text;
        schema.is_day         = current.is_day === 1;
        schema.location       = `${loc.name}, ${loc.country}`;
        schema.lat            = parseFloat(loc.lat);
        schema.lon            = parseFloat(loc.lon);
        schema.provider       = 'weatherapi';
        schema.forecast       = data.forecast.forecastday
            .filter(day => day.date > today)
            .slice(0, 3)
            .map(day => ({
                date:       day.date,
                temp_min:   day.day.mintemp_c,
                temp_max:   day.day.maxtemp_c,
                condition:  this.#mapCondition(day.day.condition.code, 1),
                humidity:   day.day.avghumidity,
                wind_speed: day.day.maxwind_kph
            }));

        return schema;
    }

    /**
     * WeatherAPI condition codes → normalized condition key
     * https://www.weatherapi.com/docs/weather_conditions.json
     */
    #mapCondition(code, isDay = 1)
	{
        const map = {
            1000: isDay ? 'sunny' : 'clear_night',
            1003: isDay ? 'mostly_sunny' : 'mostly_clear_night',
            1006: 'partly_cloudy',
            1009: 'cloudy',
            1030: 'fog',
            1135: 'fog',
            1147: 'fog',
            1063: 'showers',
            1066: 'snow_showers',
            1069: 'freezing_rain',
            1072: 'freezing_drizzle',
            1087: 'thunderstorm',
            1114: 'snow',
            1117: 'snow',
            1150: 'drizzle',
            1153: 'drizzle',
            1168: 'freezing_drizzle',
            1171: 'freezing_drizzle',
            1180: 'showers',
            1183: 'rain',
            1186: 'rain',
            1189: 'rain',
            1192: 'rain',
            1195: 'rain',
            1198: 'freezing_rain',
            1201: 'freezing_rain',
            1204: 'freezing_rain',
            1207: 'freezing_rain',
            1210: 'snow',
            1213: 'snow',
            1216: 'snow',
            1219: 'snow',
            1222: 'snow',
            1225: 'snow',
            1237: 'snow',
            1240: 'showers',
            1243: 'showers',
            1246: 'showers',
            1249: 'snow_showers',
            1252: 'snow_showers',
            1255: 'snow_showers',
            1258: 'snow_showers',
            1261: 'snow_showers',
            1264: 'snow_showers',
            1273: 'thunderstorm',
            1276: 'thunderstorm',
            1279: 'thunderstorm_hail',
            1282: 'thunderstorm_hail',
        };
        return map[code] ?? 'unknown';
    }
}
