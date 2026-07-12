import { BaseAdapter } from './BaseAdapter.js';

/**
 * OpenWeatherMapAdapter
 * API key required (free plan is sufficient).
 * Docs: https://openweathermap.org/api/one-call-3
 */
export class OpenWeatherMapAdapter extends BaseAdapter {

    constructor(apiKey = '')
	{
        super(apiKey);
        this.geoUrl      = 'https://api.openweathermap.org/geo/1.0';
        this.forecastUrl = 'https://api.openweathermap.org/data/2.5';
    }

    async fetchByCoords(lat, lon)
	{
        const [current, forecast] = await Promise.all([
            this.get(`${this.forecastUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=en`),
            this.get(`${this.forecastUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=en&cnt=40`)
        ]);
        return this.#normalize(current, forecast, lat, lon);
    }

    async fetchByCity(city)
	{
        const geo    = await this.#geocode(city);
        const result = await this.fetchByCoords(geo.lat, geo.lon);
        result.location = geo.name;
        return result;
    }

    async #geocode(city)
	{
        const url  = `${this.geoUrl}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`;
        const data = await this.get(url);
        if (!data || data.length === 0) {
            throw new Error(`OpenWeatherMap: Location "${city}" not found.`);
        }
        return data[0];
    }

    #normalize(current, forecastData, lat, lon)
	{
        const schema = this.normalizedSchema();
        const w      = current.weather[0];

        schema.temperature    = current.main.temp;
        schema.feels_like     = current.main.feels_like;
        schema.humidity       = current.main.humidity;
        schema.wind_speed     = this.#msToKmh(current.wind.speed);
        schema.wind_direction = current.wind.deg ?? null;
        schema.condition      = this.#mapCondition(w.id, current.dt, current.sys.sunrise, current.sys.sunset);
        schema.condition_text = w.description;
        schema.is_day         = current.dt > current.sys.sunrise && current.dt < current.sys.sunset;
        schema.location       = current.name;
        schema.lat            = lat;
        schema.lon            = lon;
        schema.provider       = 'openweathermap';
        schema.forecast       = this.#buildForecast(forecastData);

        return schema;
    }

    /**
     * OWM /forecast returns 3h intervals — aggregate to daily entries.
     * Skips today, returns next 3 days.
     */
    #buildForecast(forecastData)
	{
        const days  = {};
        const today = new Date().toISOString().split('T')[0];

        for (const item of forecastData.list) {
            const date = item.dt_txt.split(' ')[0];
            if (!days[date]) days[date] = { temps: [], humidity: [], wind: [], codes: [] };
            days[date].temps.push(item.main.temp);
            days[date].humidity.push(item.main.humidity);
            days[date].wind.push(item.wind.speed);
            days[date].codes.push(item.weather[0].id);
        }

        return Object.entries(days)
            .filter(([date]) => date > today)
            .slice(0, 3)
            .map(([date, d]) => ({
                date:       date,
                temp_min:   Math.min(...d.temps),
                temp_max:   Math.max(...d.temps),
                condition:  this.#mapCondition(this.#mostFrequent(d.codes), null, null, null),
                humidity:   Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
                wind_speed: this.#msToKmh(Math.max(...d.wind))
            }));
    }

    #mostFrequent(arr)
	{
        return arr.sort((a, b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
        ).pop();
    }

    #msToKmh(ms)
	{
        return Math.round(ms * 3.6 * 10) / 10;
    }

    /**
     * OWM weather condition codes → normalized condition key
     * https://openweathermap.org/weather-conditions
     */
    #mapCondition(code, dt, sunrise, sunset)
	{
        const isDay = dt && sunrise && sunset ? (dt > sunrise && dt < sunset) : true;

        if (code >= 200 && code < 300) return 'thunderstorm';
        if (code >= 300 && code < 400) return 'drizzle';
        if (code >= 500 && code < 510) return 'rain';
        if (code === 511)              return 'freezing_rain';
        if (code >= 520 && code < 600) return 'showers';
        if (code >= 600 && code < 610) return 'snow';
        if (code >= 610 && code < 620) return 'freezing_rain';
        if (code >= 620 && code < 700) return 'snow_showers';
        if (code === 701 || code === 741) return 'fog';
        if (code >= 700 && code < 800) return 'fog';
        if (code === 800)              return isDay ? 'sunny' : 'clear_night';
        if (code === 801)              return isDay ? 'mostly_sunny' : 'mostly_clear_night';
        if (code === 802)              return 'partly_cloudy';
        if (code === 803 || code === 804) return 'cloudy';
        return 'unknown';
    }
}
