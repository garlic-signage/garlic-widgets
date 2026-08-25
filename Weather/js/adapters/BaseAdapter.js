/**
 * BaseAdapter
 * Abstract base class for all weather API adapters.
 * Every adapter must implement fetchByCoords() and fetchByCity()
 * and return a normalized WeatherData object.
 */
export class BaseAdapter {
    apiKey

    /**
     * @param {string} apiKey
     */
    constructor(apiKey = '') {
        if (new.target === BaseAdapter)
            throw new Error('BaseAdapter is abstract and cannot be instantiated directly.');

        this.apiKey = apiKey;
    }

    /**
     * @param {number} lat
     * @param {number} lon
     * @returns {Promise<NormalizedWeatherData>}
     */
    async fetchByCoords(lat, lon) {
        throw new Error('fetchByCoords() must be implemented.');
    }

    /**
     * @param {string} city
     * @returns {Promise<NormalizedWeatherData>}
     */
    async fetchByCity(city) {
        throw new Error('fetchByCity() must be implemented.');
    }

    /**
     * Normalized data format that all adapters must return.
     *
     * @returns {NormalizedWeatherData}
     *
     * @typedef {Object} NormalizedWeatherData
     * @property {number}        temperature    - Current temperature in °C
     * @property {number}        feels_like     - Apparent temperature in °C
     * @property {number}        humidity       - Relative humidity in %
     * @property {number}        wind_speed     - Wind speed in km/h
     * @property {number}        wind_direction - Wind direction in degrees
     * @property {string}        condition      - Normalized condition key (e.g. "sunny", "partly_cloudy")
     * @property {string}        condition_text - Human-readable condition text from the API
     * @property {boolean}       is_day         - Whether it is currently daytime
     * @property {string}        location       - Location name
     * @property {number}        lat            - Latitude
     * @property {number}        lon            - Longitude
     * @property {number}        timestamp      - Unix timestamp of the fetch
     * @property {string}        provider       - Adapter/provider name
     * @property {ForecastDay[]} forecast       - Daily forecast entries
     *
     * @typedef {Object} ForecastDay
     * @property {string} date       - ISO date string (YYYY-MM-DD)
     * @property {number} temp_min   - Minimum temperature in °C
     * @property {number} temp_max   - Maximum temperature in °C
     * @property {string} condition  - Normalized condition key
     * @property {number} humidity   - Relative humidity in %
     * @property {number} wind_speed - Wind speed in km/h
     */
    normalizedSchema() {
        return {
            temperature: null,
            feels_like: null,
            humidity: null,
            wind_speed: null,
            wind_direction: null,
            condition: null,
            condition_text: null,
            is_day: true,
            location: null,
            lat: null,
            lon: null,
            timestamp: Date.now(),
            provider: null,
            forecast: []
        };
    }

    /**
     * Helper: HTTP GET with error handling.
     * @param {string} url
     * @returns {Promise<Object>}
     */
    async get(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`${this.constructor.name}: HTTP ${response.status} for ${url}`);
        }
        return response.json();
    }
}
