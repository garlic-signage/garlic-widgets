import { Cache }                   from './Cache.js';
import { OpenMeteoAdapter }        from './adapters/OpenMeteoAdapter.js';
import { OpenWeatherMapAdapter }   from './adapters/OpenWeatherMapAdapter.js';
import { WeatherApiAdapter }       from './adapters/WeatherApiAdapter.js';

/**
 * WeatherService
 * Central service. Selects the correct adapter, checks cache,
 * executes the fetch and returns normalized data.
 */
export class WeatherService
{
	#provider;
	#apiKey;
	#cache;
	#adapter;

    /**
     * @param {Object} config
     * @param {string} config.provider       - 'open-meteo' | 'openweathermap' | 'weatherapi'
     * @param {string} [config.apiKey]       - API key (not required for open-meteo free tier)
     * @param {number} [config.cacheTtlMs]   - Cache TTL in ms (default: 1h)
     */
    constructor(config = {})
	{
        this.#provider = config.provider   ?? 'open-meteo';
        this.#apiKey   = config.apiKey     ?? '';
        this.#cache    = new Cache(config.cacheTtlMs ?? 60 * 60 * 1000);
        this.#adapter  = this.#buildAdapter(this.#provider, this.#apiKey);
    }

	get provider()
	{
		return this.#provider;
	}

	/**
     * Main fetch method.
     * Coordinates take priority over city name.
     *
     * @param {Object}      params
     * @param {number|null} [params.lat]
     * @param {number|null} [params.lon]
     * @param {string|null} [params.city]
     * @returns {Promise<NormalizedWeatherData>}
     */
    async fetch({ lat = null, lon = null, city = null } = {})
	{
        if (!lat && !lon && !city)
            throw new Error('WeatherService: lat/lon or city must be provided.');


        const cacheKey = Cache.buildKey(this.#provider, city, lat, lon);
        const cached   = this.#cache.get(cacheKey);

        if (cached)
		{
            console.info(`WeatherService: Cache hit for "${cacheKey}"`);
            return cached;
        }

        const data = (lat !== null && lon !== null)
            ? await this.#adapter.fetchByCoords(lat, lon)
            : await this.#adapter.fetchByCity(city);

        this.#cache.set(cacheKey, data);
        return data;
    }

    /**
     * Switch provider at runtime.
     * @param {string} provider
     * @param {string} [apiKey]
     */
    setProvider(provider, apiKey = '')
	{
        this.#provider = provider;
        this.#apiKey   = apiKey;
        this.#adapter  = this.#buildAdapter(provider, apiKey);
    }

    /**
     * Manually clear cache (e.g. for a refresh button).
     */
    clearCache()
	{
        this.#cache.clear();
    }

    #buildAdapter(provider, apiKey)
	{
        switch (provider)
		{
            case 'open-meteo':      return new OpenMeteoAdapter(apiKey);
            case 'openweathermap':  return new OpenWeatherMapAdapter(apiKey);
            case 'weatherapi':      return new WeatherApiAdapter(apiKey);
            default: throw new Error(`WeatherService: Unknown provider "${provider}".`);
        }
    }
}
