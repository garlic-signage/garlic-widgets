(() => {
  // .build/Weather/js/Cache.js
  var Cache = class {
    #ttl;
    #prefix;
    /**
     * @param {number} ttlMs - Time-to-live in milliseconds (default: 3600000 = 1h)
     */
    constructor(ttlMs = 60 * 60 * 1e3) {
      this.#ttl = ttlMs;
      this.#prefix = "weather_widget_";
    }
    /**
     * Get value from cache. Returns null if not found or expired.
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
      try {
        const raw = localStorage.getItem(this.#prefix + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() > entry.expiresAt) {
          this.delete(key);
          return null;
        }
        return entry.value;
      } catch {
        return null;
      }
    }
    /**
     * Write value to cache.
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
      try {
        const entry = { value, expiresAt: Date.now() + this.#ttl };
        localStorage.setItem(this.#prefix + key, JSON.stringify(entry));
      } catch (e) {
        console.warn("Cache: Write failed.", e);
      }
    }
    /**
     * @param {string} key
     */
    delete(key) {
      localStorage.removeItem(this.#prefix + key);
    }
    /**
     * Clear all weather widget cache entries.
     */
    clear() {
      Object.keys(localStorage).filter((k) => k.startsWith(this.prefix)).forEach((k) => localStorage.removeItem(k));
    }
    /**
     * Build a cache key from request parameters.
     * @param {string}      provider
     * @param {string|null} city
     * @param {number|null} lat
     * @param {number|null} lon
     * @returns {string}
     */
    static buildKey(provider, city, lat, lon) {
      if (lat !== null && lon !== null) return `${provider}_${lat}_${lon}`;
      return `${provider}_${city.toLowerCase().trim()}`;
    }
  };

  // .build/Weather/js/adapters/BaseAdapter.js
  var BaseAdapter = class _BaseAdapter {
    apiKey;
    /**
     * @param {string} apiKey
     */
    constructor(apiKey = "") {
      if (new.target === _BaseAdapter)
        throw new Error("BaseAdapter is abstract and cannot be instantiated directly.");
      this.apiKey = apiKey;
    }
    /**
     * @param {number} lat
     * @param {number} lon
     * @returns {Promise<NormalizedWeatherData>}
     */
    async fetchByCoords(lat, lon) {
      throw new Error("fetchByCoords() must be implemented.");
    }
    /**
     * @param {string} city
     * @returns {Promise<NormalizedWeatherData>}
     */
    async fetchByCity(city) {
      throw new Error("fetchByCity() must be implemented.");
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
  };

  // .build/Weather/js/adapters/OpenMeteoAdapter.js
  var OpenMeteoAdapter = class extends BaseAdapter {
    constructor(apiKey = "") {
      super(apiKey);
      const commercial = apiKey.length > 0;
      this.geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search";
      this.forecastUrl = commercial ? "https://customer-api.open-meteo.com/v1/forecast" : "https://api.open-meteo.com/v1/forecast";
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
      const params2 = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max",
        wind_speed_unit: "kmh",
        timezone: "auto",
        forecast_days: 4
        // today + 3 days
      });
      if (this.apiKey) params2.set("apikey", this.apiKey);
      return `${this.forecastUrl}?${params2}`;
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
      schema.provider = "open-meteo";
      schema.forecast = d.time.slice(1, 4).map((date, i) => ({
        date,
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
      if (code === 0) return isDay ? "sunny" : "clear_night";
      if (code === 1) return isDay ? "mostly_sunny" : "mostly_clear_night";
      if (code === 2) return "partly_cloudy";
      if (code === 3) return "cloudy";
      if ([45, 48].includes(code)) return "fog";
      if ([51, 53, 55].includes(code)) return "drizzle";
      if ([56, 57].includes(code)) return "freezing_drizzle";
      if ([61, 63, 65].includes(code)) return "rain";
      if ([66, 67].includes(code)) return "freezing_rain";
      if ([71, 73, 75, 77].includes(code)) return "snow";
      if ([80, 81, 82].includes(code)) return "showers";
      if ([85, 86].includes(code)) return "snow_showers";
      if ([95].includes(code)) return "thunderstorm";
      if ([96, 99].includes(code)) return "thunderstorm_hail";
      return "unknown";
    }
    #conditionText(code) {
      const map = {
        0: "Clear",
        1: "Mostly clear",
        2: "Partly cloudy",
        3: "Cloudy",
        45: "Fog",
        48: "Freezing fog",
        51: "Light drizzle",
        53: "Drizzle",
        55: "Heavy drizzle",
        61: "Light rain",
        63: "Rain",
        65: "Heavy rain",
        71: "Light snow",
        73: "Snow",
        75: "Heavy snow",
        80: "Showers",
        81: "Heavy showers",
        82: "Violent showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
      };
      return map[code] ?? "Unknown";
    }
  };

  // .build/Weather/js/adapters/OpenWeatherMapAdapter.js
  var OpenWeatherMapAdapter = class extends BaseAdapter {
    constructor(apiKey = "") {
      super(apiKey);
      this.geoUrl = "https://api.openweathermap.org/geo/1.0";
      this.forecastUrl = "https://api.openweathermap.org/data/2.5";
    }
    async fetchByCoords(lat, lon) {
      const [current, forecast] = await Promise.all([
        this.get(`${this.forecastUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=en`),
        this.get(`${this.forecastUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=en&cnt=40`)
      ]);
      return this.#normalize(current, forecast, lat, lon);
    }
    async fetchByCity(city) {
      const geo = await this.#geocode(city);
      const result = await this.fetchByCoords(geo.lat, geo.lon);
      result.location = geo.name;
      return result;
    }
    async #geocode(city) {
      const url = `${this.geoUrl}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`;
      const data = await this.get(url);
      if (!data || data.length === 0) {
        throw new Error(`OpenWeatherMap: Location "${city}" not found.`);
      }
      return data[0];
    }
    #normalize(current, forecastData, lat, lon) {
      const schema = this.normalizedSchema();
      const w = current.weather[0];
      schema.temperature = current.main.temp;
      schema.feels_like = current.main.feels_like;
      schema.humidity = current.main.humidity;
      schema.wind_speed = this.#msToKmh(current.wind.speed);
      schema.wind_direction = current.wind.deg ?? null;
      schema.condition = this.#mapCondition(w.id, current.dt, current.sys.sunrise, current.sys.sunset);
      schema.condition_text = w.description;
      schema.is_day = current.dt > current.sys.sunrise && current.dt < current.sys.sunset;
      schema.location = current.name;
      schema.lat = lat;
      schema.lon = lon;
      schema.provider = "openweathermap";
      schema.forecast = this.#buildForecast(forecastData);
      return schema;
    }
    /**
     * OWM /forecast returns 3h intervals — aggregate to daily entries.
     * Skips today, returns next 3 days.
     */
    #buildForecast(forecastData) {
      const days = {};
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      for (const item of forecastData.list) {
        const date = item.dt_txt.split(" ")[0];
        if (!days[date]) days[date] = { temps: [], humidity: [], wind: [], codes: [] };
        days[date].temps.push(item.main.temp);
        days[date].humidity.push(item.main.humidity);
        days[date].wind.push(item.wind.speed);
        days[date].codes.push(item.weather[0].id);
      }
      return Object.entries(days).filter(([date]) => date > today).slice(0, 3).map(([date, d]) => ({
        date,
        temp_min: Math.min(...d.temps),
        temp_max: Math.max(...d.temps),
        condition: this.#mapCondition(this.#mostFrequent(d.codes), null, null, null),
        humidity: Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
        wind_speed: this.#msToKmh(Math.max(...d.wind))
      }));
    }
    #mostFrequent(arr) {
      return arr.sort(
        (a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
      ).pop();
    }
    #msToKmh(ms) {
      return Math.round(ms * 3.6 * 10) / 10;
    }
    /**
     * OWM weather condition codes → normalized condition key
     * https://openweathermap.org/weather-conditions
     */
    #mapCondition(code, dt, sunrise, sunset) {
      const isDay = dt && sunrise && sunset ? dt > sunrise && dt < sunset : true;
      if (code >= 200 && code < 300) return "thunderstorm";
      if (code >= 300 && code < 400) return "drizzle";
      if (code >= 500 && code < 510) return "rain";
      if (code === 511) return "freezing_rain";
      if (code >= 520 && code < 600) return "showers";
      if (code >= 600 && code < 610) return "snow";
      if (code >= 610 && code < 620) return "freezing_rain";
      if (code >= 620 && code < 700) return "snow_showers";
      if (code === 701 || code === 741) return "fog";
      if (code >= 700 && code < 800) return "fog";
      if (code === 800) return isDay ? "sunny" : "clear_night";
      if (code === 801) return isDay ? "mostly_sunny" : "mostly_clear_night";
      if (code === 802) return "partly_cloudy";
      if (code === 803 || code === 804) return "cloudy";
      return "unknown";
    }
  };

  // .build/Weather/js/adapters/WeatherApiAdapter.js
  var WeatherApiAdapter = class extends BaseAdapter {
    #baseUrl;
    constructor(apiKey = "") {
      super(apiKey);
      this.#baseUrl = "https://api.weatherapi.com/v1";
    }
    async fetchByCoords(lat, lon) {
      return this._fetch(`${lat},${lon}`);
    }
    async fetchByCity(city) {
      return this._fetch(encodeURIComponent(city));
    }
    async _fetch(query) {
      const url = `${this.#baseUrl}/forecast.json?key=${this.apiKey}&q=${query}&days=7&aqi=no&alerts=no&lang=en`;
      const data = await this.get(url);
      return this.#normalize(data);
    }
    #normalize(data) {
      const schema = this.normalizedSchema();
      const current = data.current;
      const loc = data.location;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      schema.temperature = current.temp_c;
      schema.feels_like = current.feelslike_c;
      schema.humidity = current.humidity;
      schema.wind_speed = current.wind_kph;
      schema.wind_direction = current.wind_degree;
      schema.condition = this.#mapCondition(current.condition.code, current.is_day);
      schema.condition_text = current.condition.text;
      schema.is_day = current.is_day === 1;
      schema.location = `${loc.name}, ${loc.country}`;
      schema.lat = parseFloat(loc.lat);
      schema.lon = parseFloat(loc.lon);
      schema.provider = "weatherapi";
      schema.forecast = data.forecast.forecastday.filter((day) => day.date > today).slice(0, 3).map((day) => ({
        date: day.date,
        temp_min: day.day.mintemp_c,
        temp_max: day.day.maxtemp_c,
        condition: this.#mapCondition(day.day.condition.code, 1),
        humidity: day.day.avghumidity,
        wind_speed: day.day.maxwind_kph
      }));
      return schema;
    }
    /**
     * WeatherAPI condition codes → normalized condition key
     * https://www.weatherapi.com/docs/weather_conditions.json
     */
    #mapCondition(code, isDay = 1) {
      const map = {
        1e3: isDay ? "sunny" : "clear_night",
        1003: isDay ? "mostly_sunny" : "mostly_clear_night",
        1006: "partly_cloudy",
        1009: "cloudy",
        1030: "fog",
        1135: "fog",
        1147: "fog",
        1063: "showers",
        1066: "snow_showers",
        1069: "freezing_rain",
        1072: "freezing_drizzle",
        1087: "thunderstorm",
        1114: "snow",
        1117: "snow",
        1150: "drizzle",
        1153: "drizzle",
        1168: "freezing_drizzle",
        1171: "freezing_drizzle",
        1180: "showers",
        1183: "rain",
        1186: "rain",
        1189: "rain",
        1192: "rain",
        1195: "rain",
        1198: "freezing_rain",
        1201: "freezing_rain",
        1204: "freezing_rain",
        1207: "freezing_rain",
        1210: "snow",
        1213: "snow",
        1216: "snow",
        1219: "snow",
        1222: "snow",
        1225: "snow",
        1237: "snow",
        1240: "showers",
        1243: "showers",
        1246: "showers",
        1249: "snow_showers",
        1252: "snow_showers",
        1255: "snow_showers",
        1258: "snow_showers",
        1261: "snow_showers",
        1264: "snow_showers",
        1273: "thunderstorm",
        1276: "thunderstorm",
        1279: "thunderstorm_hail",
        1282: "thunderstorm_hail"
      };
      return map[code] ?? "unknown";
    }
  };

  // .build/Weather/js/WeatherService.js
  var WeatherService = class {
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
    constructor(config2 = {}) {
      this.#provider = config2.provider ?? "open-meteo";
      this.#apiKey = config2.apiKey ?? "";
      this.#cache = new Cache(config2.cacheTtlMs ?? 60 * 60 * 1e3);
      this.#adapter = this.#buildAdapter(this.#provider, this.#apiKey);
    }
    get provider() {
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
    async fetch({ lat = null, lon = null, city = null } = {}) {
      if (!lat && !lon && !city)
        throw new Error("WeatherService: lat/lon or city must be provided.");
      const cacheKey = Cache.buildKey(this.#provider, city, lat, lon);
      const cached = this.#cache.get(cacheKey);
      if (cached) {
        console.info(`WeatherService: Cache hit for "${cacheKey}"`);
        return cached;
      }
      const data = lat !== null && lon !== null ? await this.#adapter.fetchByCoords(lat, lon) : await this.#adapter.fetchByCity(city);
      this.#cache.set(cacheKey, data);
      return data;
    }
    /**
     * Switch provider at runtime.
     * @param {string} provider
     * @param {string} [apiKey]
     */
    setProvider(provider, apiKey = "") {
      this.#provider = provider;
      this.#apiKey = apiKey;
      this.#adapter = this.#buildAdapter(provider, apiKey);
    }
    /**
     * Manually clear cache (e.g. for a refresh button).
     */
    clearCache() {
      this.#cache.clear();
    }
    #buildAdapter(provider, apiKey) {
      switch (provider) {
        case "open-meteo":
          return new OpenMeteoAdapter(apiKey);
        case "openweathermap":
          return new OpenWeatherMapAdapter(apiKey);
        case "weatherapi":
          return new WeatherApiAdapter(apiKey);
        default:
          throw new Error(`WeatherService: Unknown provider "${provider}".`);
      }
    }
  };

  // .build/Weather/js/i18n/I18n.js
  var I18n = class {
    /**
     * @param {Object} translations - { de: {...}, en: {...} }
     * @param {string} lang         - Language code (e.g. 'de', 'en')
     */
    constructor(translations, lang = "en") {
      this.translations = translations;
      this.lang = translations[lang] ? lang : "en";
    }
    /**
     * Get a translated string. Supports placeholders:
     * t('greeting', { name: 'World' }) with "Hello {{name}}" → "Hello World"
     * @param {string} key
     * @param {Object} [vars]
     * @returns {string}
     */
    t(key, vars = {}) {
      const str = this.translations[this.lang]?.[key] ?? this.translations["en"]?.[key] ?? key;
      return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    }
    /**
     * Change language at runtime.
     * @param {string} lang
     */
    setLang(lang) {
      if (this.translations[lang]) {
        this.lang = lang;
      } else {
        console.warn(`I18n: Language "${lang}" not available, staying with "${this.lang}".`);
      }
    }
  };

  // .build/Weather/js/i18n/de.js
  var de = {
    // Allgemein
    loading: "Wetterdaten werden geladen\u2026",
    error: "Fehler beim Laden der Wetterdaten.",
    last_updated: "Aktualisiert um {{time}}",
    refresh: "Aktualisieren",
    // Wetterwerte
    feels_like: "Gef\xFChlt",
    humidity: "Luftfeuchtigkeit",
    wind: "Wind",
    wind_direction: "Windrichtung",
    forecast: "Vorhersage",
    // Einheiten
    unit_celsius: "\xB0C",
    unit_kmh: "km/h",
    unit_percent: "%",
    // Wochentage (kurz)
    day_0: "So",
    day_1: "Mo",
    day_2: "Di",
    day_3: "Mi",
    day_4: "Do",
    day_5: "Fr",
    day_6: "Sa",
    // Wochentage (lang)
    day_long_0: "Sonntag",
    day_long_1: "Montag",
    day_long_2: "Dienstag",
    day_long_3: "Mittwoch",
    day_long_4: "Donnerstag",
    day_long_5: "Freitag",
    day_long_6: "Samstag",
    // Monate (kurz)
    month_0: "Jan",
    month_1: "Feb",
    month_2: "M\xE4r",
    month_3: "Apr",
    month_4: "Mai",
    month_5: "Jun",
    month_6: "Jul",
    month_7: "Aug",
    month_8: "Sep",
    month_9: "Okt",
    month_10: "Nov",
    month_11: "Dez",
    // Condition Keys → lesbarer Text
    condition_sunny: "Sonnig",
    condition_clear_night: "Klare Nacht",
    condition_mostly_sunny: "\xDCberwiegend sonnig",
    condition_mostly_clear_night: "\xDCberwiegend klar",
    condition_partly_cloudy: "Teilweise bew\xF6lkt",
    condition_cloudy: "Bew\xF6lkt",
    condition_fog: "Nebel",
    condition_drizzle: "Nieselregen",
    condition_freezing_drizzle: "Gefrierender Nieselregen",
    condition_rain: "Regen",
    condition_freezing_rain: "Gefrierender Regen",
    condition_showers: "Schauer",
    condition_snow: "Schnee",
    condition_snow_showers: "Schneeschauer",
    condition_thunderstorm: "Gewitter",
    condition_thunderstorm_hail: "Gewitter mit Hagel",
    condition_unknown: "Unbekannt",
    // Windrichtungen
    wind_N: "N",
    wind_NE: "NO",
    wind_E: "O",
    wind_SE: "SO",
    wind_S: "S",
    wind_SW: "SW",
    wind_W: "W",
    wind_NW: "NW"
  };

  // .build/Weather/js/i18n/en.js
  var en = {
    // General
    loading: "Loading weather data\u2026",
    error: "Failed to load weather data.",
    last_updated: "Updated at {{time}}",
    refresh: "Refresh",
    // Weather values
    feels_like: "Feels like",
    humidity: "Humidity",
    wind: "Wind",
    wind_direction: "Wind direction",
    forecast: "Forecast",
    // Units
    unit_celsius: "\xB0C",
    unit_kmh: "km/h",
    unit_percent: "%",
    // Weekdays (short)
    day_0: "Sun",
    day_1: "Mon",
    day_2: "Tue",
    day_3: "Wed",
    day_4: "Thu",
    day_5: "Fri",
    day_6: "Sat",
    // Weekdays (long)
    day_long_0: "Sunday",
    day_long_1: "Monday",
    day_long_2: "Tuesday",
    day_long_3: "Wednesday",
    day_long_4: "Thursday",
    day_long_5: "Friday",
    day_long_6: "Saturday",
    // Months (short)
    month_0: "Jan",
    month_1: "Feb",
    month_2: "Mar",
    month_3: "Apr",
    month_4: "May",
    month_5: "Jun",
    month_6: "Jul",
    month_7: "Aug",
    month_8: "Sep",
    month_9: "Oct",
    month_10: "Nov",
    month_11: "Dec",
    // Condition Keys → readable text
    condition_sunny: "Sunny",
    condition_clear_night: "Clear night",
    condition_mostly_sunny: "Mostly sunny",
    condition_mostly_clear_night: "Mostly clear",
    condition_partly_cloudy: "Partly cloudy",
    condition_cloudy: "Cloudy",
    condition_fog: "Fog",
    condition_drizzle: "Drizzle",
    condition_freezing_drizzle: "Freezing drizzle",
    condition_rain: "Rain",
    condition_freezing_rain: "Freezing rain",
    condition_showers: "Showers",
    condition_snow: "Snow",
    condition_snow_showers: "Snow showers",
    condition_thunderstorm: "Thunderstorm",
    condition_thunderstorm_hail: "Thunderstorm with hail",
    condition_unknown: "Unknown",
    // Wind directions
    wind_N: "N",
    wind_NE: "NE",
    wind_E: "E",
    wind_SE: "SE",
    wind_S: "S",
    wind_SW: "SW",
    wind_W: "W",
    wind_NW: "NW"
  };

  // .build/Weather/js/i18n/es.js
  var es = {
    // General
    loading: "Cargando datos meteorol\xF3gicos\u2026",
    error: "Error al cargar los datos meteorol\xF3gicos.",
    last_updated: "Actualizado a las {{time}}",
    refresh: "Actualizar",
    // Weather values
    feels_like: "Sensaci\xF3n t\xE9rmica",
    humidity: "Humedad",
    wind: "Viento",
    wind_direction: "Direcci\xF3n del viento",
    forecast: "Pron\xF3stico",
    // Units
    unit_celsius: "\xB0C",
    unit_kmh: "km/h",
    unit_percent: "%",
    // Weekdays (short)
    day_0: "Dom",
    day_1: "Lun",
    day_2: "Mar",
    day_3: "Mi\xE9",
    day_4: "Jue",
    day_5: "Vie",
    day_6: "S\xE1b",
    // Weekdays (long)
    day_long_0: "Domingo",
    day_long_1: "Lunes",
    day_long_2: "Martes",
    day_long_3: "Mi\xE9rcoles",
    day_long_4: "Jueves",
    day_long_5: "Viernes",
    day_long_6: "S\xE1bado",
    // Months (short)
    month_0: "Ene",
    month_1: "Feb",
    month_2: "Mar",
    month_3: "Abr",
    month_4: "May",
    month_5: "Jun",
    month_6: "Jul",
    month_7: "Ago",
    month_8: "Sep",
    month_9: "Oct",
    month_10: "Nov",
    month_11: "Dic",
    // Condition Keys → readable text
    condition_sunny: "Soleado",
    condition_clear_night: "Noche despejada",
    condition_mostly_sunny: "Mayormente soleado",
    condition_mostly_clear_night: "Mayormente despejado",
    condition_partly_cloudy: "Parcialmente nublado",
    condition_cloudy: "Nublado",
    condition_fog: "Niebla",
    condition_drizzle: "Llovizna",
    condition_freezing_drizzle: "Llovizna g\xE9lida",
    condition_rain: "Lluvia",
    condition_freezing_rain: "Lluvia g\xE9lida",
    condition_showers: "Chubascos",
    condition_snow: "Nieve",
    condition_snow_showers: "Chubascos de nieve",
    condition_thunderstorm: "Tormenta",
    condition_thunderstorm_hail: "Tormenta con granizo",
    condition_unknown: "Desconocido",
    // Wind directions
    wind_N: "N",
    wind_NE: "NE",
    wind_E: "E",
    wind_SE: "SE",
    wind_S: "S",
    wind_SW: "SO",
    wind_W: "O",
    wind_NW: "NO"
  };

  // .build/Weather/js/i18n/fr.js
  var fr = {
    // General
    loading: "Chargement des donn\xE9es m\xE9t\xE9o\u2026",
    error: "Impossible de charger les donn\xE9es m\xE9t\xE9o.",
    last_updated: "Mis \xE0 jour \xE0 {{time}}",
    refresh: "Actualiser",
    // Weather values
    feels_like: "Ressenti",
    humidity: "Humidit\xE9",
    wind: "Vent",
    wind_direction: "Direction du vent",
    forecast: "Pr\xE9visions",
    // Units
    unit_celsius: "\xB0C",
    unit_kmh: "km/h",
    unit_percent: "%",
    // Weekdays (short)
    day_0: "Dim",
    day_1: "Lun",
    day_2: "Mar",
    day_3: "Mer",
    day_4: "Jeu",
    day_5: "Ven",
    day_6: "Sam",
    // Weekdays (long)
    day_long_0: "Dimanche",
    day_long_1: "Lundi",
    day_long_2: "Mardi",
    day_long_3: "Mercredi",
    day_long_4: "Jeudi",
    day_long_5: "Vendredi",
    day_long_6: "Samedi",
    // Months (short)
    month_0: "Janv",
    month_1: "F\xE9vr",
    month_2: "Mars",
    month_3: "Avril",
    month_4: "Mai",
    month_5: "Juin",
    month_6: "Juil",
    month_7: "Ao\xFBt",
    month_8: "Sept",
    month_9: "Oct",
    month_10: "Nov",
    month_11: "D\xE9c",
    // Condition Keys → readable text
    condition_sunny: "Ensoleill\xE9",
    condition_clear_night: "Nuit claire",
    condition_mostly_sunny: "Tr\xE8s ensoleill\xE9",
    condition_mostly_clear_night: "Nuit g\xE9n\xE9ralement claire",
    condition_partly_cloudy: "Partiellement nuageux",
    condition_cloudy: "Nuageux",
    condition_fog: "Brouillard",
    condition_drizzle: "Bruine",
    condition_freezing_drizzle: "Bruine vergla\xE7ante",
    condition_rain: "Pluie",
    condition_freezing_rain: "Pluie vergla\xE7ante",
    condition_showers: "Averses",
    condition_snow: "Neige",
    condition_snow_showers: "Averses de neige",
    condition_thunderstorm: "Orage",
    condition_thunderstorm_hail: "Orage avec gr\xEAle",
    condition_unknown: "Inconnu",
    // Wind directions
    wind_N: "N",
    wind_NE: "NE",
    wind_E: "E",
    wind_SE: "SE",
    wind_S: "S",
    wind_SW: "SO",
    wind_W: "O",
    wind_NW: "NO"
  };

  // .build/Weather/js/i18n/el.js
  var el = {
    // General
    loading: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03BC\u03B5\u03C4\u03B5\u03C9\u03C1\u03BF\u03BB\u03BF\u03B3\u03B9\u03BA\u03CE\u03BD \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD\u2026",
    error: "\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u03C2 \u03BC\u03B5\u03C4\u03B5\u03C9\u03C1\u03BF\u03BB\u03BF\u03B3\u03B9\u03BA\u03CE\u03BD \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD.",
    last_updated: "\u0395\u03BD\u03B7\u03BC\u03B5\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5 \u03C3\u03C4\u03B9\u03C2 {{time}}",
    refresh: "\u0391\u03BD\u03B1\u03BD\u03AD\u03C9\u03C3\u03B7",
    // Weather values
    feels_like: "\u0391\u03AF\u03C3\u03B8\u03B7\u03C3\u03B7 \u03C3\u03B1\u03BD",
    humidity: "\u03A5\u03B3\u03C1\u03B1\u03C3\u03AF\u03B1",
    wind: "\u0386\u03BD\u03B5\u03BC\u03BF\u03C2",
    wind_direction: "\u039A\u03B1\u03C4\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 \u03B1\u03BD\u03AD\u03BC\u03BF\u03C5",
    forecast: "\u03A0\u03C1\u03CC\u03B3\u03BD\u03C9\u03C3\u03B7",
    // Units
    unit_celsius: "\xB0C",
    unit_kmh: "\u03C7\u03BB\u03BC/\u03CE\u03C1\u03B1",
    unit_percent: "%",
    // Weekdays (short)
    day_0: "\u039A\u03C5\u03C1",
    day_1: "\u0394\u03B5\u03C5",
    day_2: "\u03A4\u03C1\u03AF",
    day_3: "\u03A4\u03B5\u03C4",
    day_4: "\u03A0\u03AD\u03BC",
    day_5: "\u03A0\u03B1\u03C1",
    day_6: "\u03A3\u03AC\u03B2",
    // Weekdays (long)
    day_long_0: "\u039A\u03C5\u03C1\u03B9\u03B1\u03BA\u03AE",
    day_long_1: "\u0394\u03B5\u03C5\u03C4\u03AD\u03C1\u03B1",
    day_long_2: "\u03A4\u03C1\u03AF\u03C4\u03B7",
    day_long_3: "\u03A4\u03B5\u03C4\u03AC\u03C1\u03C4\u03B7",
    day_long_4: "\u03A0\u03AD\u03BC\u03C0\u03C4\u03B7",
    day_long_5: "\u03A0\u03B1\u03C1\u03B1\u03C3\u03BA\u03B5\u03C5\u03AE",
    day_long_6: "\u03A3\u03AC\u03B2\u03B2\u03B1\u03C4\u03BF",
    // Months (short)
    month_0: "\u0399\u03B1\u03BD",
    month_1: "\u03A6\u03B5\u03B2",
    month_2: "\u039C\u03AC\u03C1",
    month_3: "\u0391\u03C0\u03C1",
    month_4: "\u039C\u03AC\u03B9",
    month_5: "\u0399\u03BF\u03CD\u03BD",
    month_6: "\u0399\u03BF\u03CD\u03BB",
    month_7: "\u0391\u03CD\u03B3",
    month_8: "\u03A3\u03B5\u03C0",
    month_9: "\u039F\u03BA\u03C4",
    month_10: "\u039D\u03BF\u03AD",
    month_11: "\u0394\u03B5\u03BA",
    // Condition Keys → readable text
    condition_sunny: "\u0397\u03BB\u03B9\u03BF\u03C6\u03AC\u03BD\u03B5\u03B9\u03B1",
    condition_clear_night: "\u0391\u03AF\u03B8\u03C1\u03B9\u03BF\u03C2 \u03BD\u03C5\u03C7\u03C4\u03B5\u03C1\u03B9\u03BD\u03CC\u03C2 \u03BF\u03C5\u03C1\u03B1\u03BD\u03CC\u03C2",
    condition_mostly_sunny: "\u039A\u03C5\u03C1\u03AF\u03C9\u03C2 \u03B7\u03BB\u03B9\u03CC\u03BB\u03BF\u03C5\u03C3\u03C4\u03BF\u03C2",
    condition_mostly_clear_night: "\u039A\u03C5\u03C1\u03AF\u03C9\u03C2 \u03B1\u03AF\u03B8\u03C1\u03B9\u03BF\u03C2",
    condition_partly_cloudy: "\u039C\u03B5\u03C1\u03B9\u03BA\u03CE\u03C2 \u03C3\u03C5\u03BD\u03BD\u03B5\u03C6\u03B9\u03B1\u03C3\u03BC\u03AD\u03BD\u03BF\u03C2",
    condition_cloudy: "\u03A3\u03C5\u03BD\u03BD\u03B5\u03C6\u03B9\u03B1\u03C3\u03BC\u03AD\u03BD\u03BF\u03C2",
    condition_fog: "\u039F\u03BC\u03AF\u03C7\u03BB\u03B7",
    condition_drizzle: "\u03A8\u03B9\u03C7\u03AC\u03BB\u03B9\u03C3\u03BC\u03B1",
    condition_freezing_drizzle: "\u03A0\u03B1\u03B3\u03C9\u03BC\u03AD\u03BD\u03BF \u03C8\u03B9\u03C7\u03AC\u03BB\u03B9\u03C3\u03BC\u03B1",
    condition_rain: "\u0392\u03C1\u03BF\u03C7\u03AE",
    condition_freezing_rain: "\u03A0\u03B1\u03B3\u03C9\u03BC\u03AD\u03BD\u03B7 \u03B2\u03C1\u03BF\u03C7\u03AE",
    condition_showers: "\u039A\u03B1\u03C4\u03B1\u03B9\u03B3\u03AF\u03B4\u03B5\u03C2",
    condition_snow: "\u03A7\u03B9\u03CC\u03BD\u03B9",
    condition_snow_showers: "\u03A7\u03B9\u03BF\u03BD\u03BF\u03C0\u03C4\u03CE\u03C3\u03B5\u03B9\u03C2",
    condition_thunderstorm: "\u039A\u03B1\u03C4\u03B1\u03B9\u03B3\u03AF\u03B4\u03B1",
    condition_thunderstorm_hail: "\u039A\u03B1\u03C4\u03B1\u03B9\u03B3\u03AF\u03B4\u03B1 \u03BC\u03B5 \u03C7\u03B1\u03BB\u03AC\u03B6\u03B9",
    condition_unknown: "\u0386\u03B3\u03BD\u03C9\u03C3\u03C4\u03BF",
    // Wind directions
    wind_N: "\u0392",
    wind_NE: "\u0392\u0391",
    wind_E: "\u0391",
    wind_SE: "\u039D\u0391",
    wind_S: "\u039D",
    wind_SW: "\u039D\u0394",
    wind_W: "\u0394",
    wind_NW: "\u0392\u0394"
  };

  // .build/Weather/js/i18n/ru.js
  var ru = {
    // General
    loading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E \u043F\u043E\u0433\u043E\u0434\u0435\u2026",
    error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E \u043F\u043E\u0433\u043E\u0434\u0435.",
    last_updated: "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0432 {{time}}",
    refresh: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
    // Weather values
    feels_like: "\u041E\u0449\u0443\u0449\u0430\u0435\u0442\u0441\u044F \u043A\u0430\u043A",
    humidity: "\u0412\u043B\u0430\u0436\u043D\u043E\u0441\u0442\u044C",
    wind: "\u0412\u0435\u0442\u0435\u0440",
    wind_direction: "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432\u0435\u0442\u0440\u0430",
    forecast: "\u041F\u0440\u043E\u0433\u043D\u043E\u0437",
    // Units
    unit_celsius: "\xB0C",
    unit_kmh: "\u043A\u043C/\u0447",
    unit_percent: "%",
    // Weekdays (short)
    day_0: "\u0412\u0441",
    day_1: "\u041F\u043D",
    day_2: "\u0412\u0442",
    day_3: "\u0421\u0440",
    day_4: "\u0427\u0442",
    day_5: "\u041F\u0442",
    day_6: "\u0421\u0431",
    // Weekdays (long)
    day_long_0: "\u0412\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u0435",
    day_long_1: "\u041F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A",
    day_long_2: "\u0412\u0442\u043E\u0440\u043D\u0438\u043A",
    day_long_3: "\u0421\u0440\u0435\u0434\u0430",
    day_long_4: "\u0427\u0435\u0442\u0432\u0435\u0440\u0433",
    day_long_5: "\u041F\u044F\u0442\u043D\u0438\u0446\u0430",
    day_long_6: "\u0421\u0443\u0431\u0431\u043E\u0442\u0430",
    // Months (short)
    month_0: "\u042F\u043D\u0432",
    month_1: "\u0424\u0435\u0432",
    month_2: "\u041C\u0430\u0440",
    month_3: "\u0410\u043F\u0440",
    month_4: "\u041C\u0430\u0439",
    month_5: "\u0418\u044E\u043D",
    month_6: "\u0418\u044E\u043B",
    month_7: "\u0410\u0432\u0433",
    month_8: "\u0421\u0435\u043D",
    month_9: "\u041E\u043A\u0442",
    month_10: "\u041D\u043E\u044F",
    month_11: "\u0414\u0435\u043A",
    // Condition Keys → readable text
    condition_sunny: "\u0421\u043E\u043B\u043D\u0435\u0447\u043D\u043E",
    condition_clear_night: "\u042F\u0441\u043D\u0430\u044F \u043D\u043E\u0447\u044C",
    condition_mostly_sunny: "\u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E \u0441\u043E\u043B\u043D\u0435\u0447\u043D\u043E",
    condition_mostly_clear_night: "\u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E \u044F\u0441\u043D\u043E",
    condition_partly_cloudy: "\u041F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u043E\u0431\u043B\u0430\u0447\u043D\u043E\u0441\u0442\u044C",
    condition_cloudy: "\u041E\u0431\u043B\u0430\u0447\u043D\u043E",
    condition_fog: "\u0422\u0443\u043C\u0430\u043D",
    condition_drizzle: "\u041C\u043E\u0440\u043E\u0441\u044C",
    condition_freezing_drizzle: "\u041B\u0435\u0434\u044F\u043D\u0430\u044F \u043C\u043E\u0440\u043E\u0441\u044C",
    condition_rain: "\u0414\u043E\u0436\u0434\u044C",
    condition_freezing_rain: "\u041B\u0435\u0434\u044F\u043D\u043E\u0439 \u0434\u043E\u0436\u0434\u044C",
    condition_showers: "\u041B\u0438\u0432\u043D\u0438",
    condition_snow: "\u0421\u043D\u0435\u0433",
    condition_snow_showers: "\u0421\u043D\u0435\u0433\u043E\u043F\u0430\u0434",
    condition_thunderstorm: "\u0413\u0440\u043E\u0437\u0430",
    condition_thunderstorm_hail: "\u0413\u0440\u043E\u0437\u0430 \u0441 \u0433\u0440\u0430\u0434\u043E\u043C",
    condition_unknown: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E",
    // Wind directions
    wind_N: "\u0421",
    wind_NE: "\u0421\u0412",
    wind_E: "\u0412",
    wind_SE: "\u042E\u0412",
    wind_S: "\u042E",
    wind_SW: "\u042E\u0417",
    wind_W: "\u0417",
    wind_NW: "\u0421\u0417"
  };

  // .build/Weather/js/Renderer.js
  var Renderer = class _Renderer {
    #i18n;
    #root;
    #templates;
    /**
     * Mapping from normalized condition keys to Meteocons production/fill/all filenames.
     * @type {Object<string, string>}
     */
    static #ICON_MAP = {
      sunny: "clear-day",
      clear_night: "clear-night",
      mostly_sunny: "partly-cloudy-day",
      mostly_clear_night: "partly-cloudy-night",
      partly_cloudy: "partly-cloudy-day",
      mostly_cloudy_night: "partly-cloudy-night",
      cloudy: "overcast",
      fog: "fog",
      drizzle: "drizzle",
      freezing_drizzle: "partly-cloudy-day-drizzle",
      rain: "rain",
      freezing_rain: "sleet",
      showers: "partly-cloudy-day-rain",
      snow: "snow",
      snow_showers: "partly-cloudy-day-snow",
      thunderstorm: "thunderstorms",
      thunderstorm_hail: "thunderstorms-rain",
      unknown: "not-available"
    };
    /**
     * @param {I18n} i18n
     */
    constructor(i18n2) {
      this.#i18n = i18n2;
      this.#root = document.getElementById("widget");
      this.#templates = {
        widget: document.getElementById("tpl-widget"),
        forecastDay: document.getElementById("tpl-forecast-day"),
        loading: document.getElementById("tpl-loading"),
        error: document.getElementById("tpl-error")
      };
    }
    showLoading() {
      const tpl = this.#cloneTemplate("loading");
      this.#applyBindings(tpl, { message: this.#i18n.t("loading") });
      this.#replaceContent(tpl);
    }
    showError(msg) {
      const tpl = this.#cloneTemplate("error");
      this.#applyBindings(tpl, { message: msg });
      this.#replaceContent(tpl);
    }
    /**
     * @param {NormalizedWeatherData} data
     */
    render(data) {
      const condition = data.condition ?? "unknown";
      const bgClass = `bg-${condition}${!data.is_day && !condition.includes("night") ? " night" : ""}`;
      const windDir = this.#degreesToCardinal(data.wind_direction);
      const tpl = this.#cloneTemplate("widget");
      const bindings = {
        location: data.location,
        refresh: this.#i18n.t("refresh"),
        iconSrc: `icons/${this.#iconFile(data.condition, data.is_day)}.svg`,
        conditionText: this.#i18n.t(`condition_${data.condition}`),
        temperature: Math.round(data.temperature),
        unitCelsius: this.#i18n.t("unit_celsius"),
        feelsLikeLabel: this.#i18n.t("feels_like"),
        feelsLikeValue: `${Math.round(data.feels_like)}${this.#i18n.t("unit_celsius")}`,
        humidityLabel: this.#i18n.t("humidity"),
        humidityValue: `${data.humidity}${this.#i18n.t("unit_percent")}`,
        windLabel: this.#i18n.t("wind"),
        windValue: `${Math.round(data.wind_speed)} ${this.#i18n.t("unit_kmh")}${windDir ? ` ${windDir}` : ""}`,
        forecastLabel: this.#i18n.t("forecast"),
        lastUpdated: this.#i18n.t("last_updated", { time: this.#formatTime(data.timestamp) }),
        provider: data.provider,
        noForecast: !data.forecast || data.forecast.length === 0
      };
      this.#applyBindings(tpl, bindings);
      this.#renderForecastSlot(tpl, data.forecast);
      this.#root.className = `widget ${bgClass}`;
      this.#replaceContent(tpl);
    }
    /**
     * Clone a template by key.
     * @param {string} key
     * @returns {DocumentFragment}
     */
    #cloneTemplate(key) {
      return this.#templates[key].content.cloneNode(true);
    }
    /**
     * Replace widget content with a DocumentFragment.
     * @param {DocumentFragment} fragment
     */
    #replaceContent(fragment) {
      this.#root.innerHTML = "";
      this.#root.appendChild(fragment);
    }
    /**
     * Apply data bindings to a template fragment.
     * Supports: data-bind (textContent), data-bind-src, data-bind-alt,
     *           data-bind-title, data-bind-hidden
     * @param {DocumentFragment|Element} root
     * @param {Object<string, any>} bindings
     */
    #applyBindings(root, bindings) {
      for (const [key, value] of Object.entries(bindings)) {
        root.querySelectorAll(`[data-bind="${key}"]`).forEach((el2) => {
          el2.textContent = value;
        });
        root.querySelectorAll(`[data-bind-src="${key}"]`).forEach((el2) => {
          el2.setAttribute("src", value);
        });
        root.querySelectorAll(`[data-bind-alt="${key}"]`).forEach((el2) => {
          el2.setAttribute("alt", value);
        });
        root.querySelectorAll(`[data-bind-title="${key}"]`).forEach((el2) => {
          el2.setAttribute("title", value);
        });
        root.querySelectorAll(`[data-bind-hidden="${key}"]`).forEach((el2) => {
          el2.hidden = !!value;
        });
      }
    }
    /**
     * Render forecast days into the forecast slot.
     * @param {DocumentFragment} root
     * @param {Array} forecast
     */
    #renderForecastSlot(root, forecast) {
      const slot = root.querySelector('[data-slot="forecast"]');
      if (!slot || !forecast || forecast.length === 0) {
        return;
      }
      forecast.slice(0, 3).forEach((day) => {
        const dayFragment = this.#cloneTemplate("forecastDay");
        const date = new Date(day.date);
        this.#applyBindings(dayFragment, {
          dayName: this.#i18n.t(`day_${date.getDay()}`),
          iconSrc: `icons/${this.#iconFile(day.condition, true)}.svg`,
          conditionText: this.#i18n.t(`condition_${day.condition}`),
          tempMax: `${Math.round(day.temp_max)}\xB0`,
          tempMin: `${Math.round(day.temp_min)}\xB0`
        });
        slot.appendChild(dayFragment);
      });
    }
    /**
     * Format timestamp to localized time string.
     * @param {number|string} timestamp
     * @returns {string}
     */
    #formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString(this.#i18n.lang, {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    /**
     * Resolve a condition key to a Meteocons filename (without .svg).
     * For night conditions, tries a night-specific key first before falling back.
     * @param {string}  condition
     * @param {boolean} isDay
     * @returns {string}
     */
    #iconFile(condition, isDay = true) {
      if (!isDay) {
        const nightKey = condition.endsWith("_night") ? condition : `${condition}_night`;
        if (_Renderer.#ICON_MAP[nightKey]) {
          return _Renderer.#ICON_MAP[nightKey];
        }
      }
      return _Renderer.#ICON_MAP[condition] ?? _Renderer.#ICON_MAP["unknown"];
    }
    /**
     * Convert degrees to cardinal direction label.
     * @param {number|null} deg
     * @returns {string}
     */
    #degreesToCardinal(deg) {
      if (deg === null || deg === void 0) {
        return "";
      }
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const key = dirs[Math.round(deg / 45) % 8];
      return this.#i18n.t(`wind_${key}`);
    }
  };

  // .build/Weather/js/main.js
  var params = new URLSearchParams(window.location.search);
  var config = {
    provider: params.get("provider") ?? "open-meteo",
    apiKey: params.get("apikey") ?? "",
    lat: params.get("lat") ? parseFloat(params.get("lat")) : null,
    lon: params.get("lon") ? parseFloat(params.get("lon")) : null,
    city: params.get("city") ?? null,
    lang: params.get("lang") ?? "en",
    cacheTtlMs: params.get("refresh") ? parseInt(params.get("refresh")) : 60 * 60 * 1e3
  };
  if (!config.lat && !config.lon && !config.city)
    config.city = "Hannover";
  var langMap = {
    de: "de",
    en: "en",
    es: "es",
    fr: "fr",
    el: "el",
    ru: "ru",
    german: "de",
    english: "en",
    spanish: "es",
    french: "fr",
    greek: "el",
    russian: "ru",
    deutsch: "de",
    espa\u00F1ol: "es",
    fran\u00E7ais: "fr",
    \u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC: "el",
    \u0440\u0443\u0441\u0441\u043A\u0438\u0439: "ru"
  };
  var normalizedLang = langMap[config.lang?.toLowerCase()] || "en";
  var i18n = new I18n({ de, en, es, fr, el, ru }, normalizedLang);
  var service = new WeatherService({ provider: config.provider, apiKey: config.apiKey, cacheTtlMs: config.cacheTtlMs });
  var renderer = new Renderer(i18n);
  async function load() {
    renderer.showLoading();
    try {
      const data = await service.fetch({ lat: config.lat, lon: config.lon, city: config.city });
      renderer.render(data);
    } catch (err) {
      console.error(err);
      renderer.showError(i18n.t("error"));
    }
  }
  load();
  setInterval(load, config.cacheTtlMs);
  document.getElementById("btn-refresh")?.addEventListener("click", () => {
    service.clearCache();
    load();
  });
})();
