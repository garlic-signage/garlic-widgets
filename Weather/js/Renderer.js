/**
 * Renderer
 * Writes normalized weather data to the DOM using HTML templates.
 * No styling here — structure and data only.
 */
export class Renderer
{
	#i18n;
	#root;
	#templates;

	/**
	 * Mapping from normalized condition keys to Meteocons production/fill/all filenames.
	 * @type {Object<string, string>}
	 */
	static #ICON_MAP = {
		sunny:               'clear-day',
		clear_night:         'clear-night',
		mostly_sunny:        'partly-cloudy-day',
		mostly_clear_night:  'partly-cloudy-night',
		partly_cloudy:       'partly-cloudy-day',
		mostly_cloudy_night: 'partly-cloudy-night',
		cloudy:              'overcast',
		fog:                 'fog',
		drizzle:             'drizzle',
		freezing_drizzle:    'partly-cloudy-day-drizzle',
		rain:                'rain',
		freezing_rain:       'sleet',
		showers:             'partly-cloudy-day-rain',
		snow:                'snow',
		snow_showers:        'partly-cloudy-day-snow',
		thunderstorm:        'thunderstorms',
		thunderstorm_hail:   'thunderstorms-rain',
		unknown:             'not-available',
	};

	/**
	 * @param {I18n} i18n
	 */
	constructor(i18n)
	{
		this.#i18n = i18n;
		this.#root = document.getElementById('widget');
		this.#templates = {
			widget:      document.getElementById('tpl-widget'),
			forecastDay: document.getElementById('tpl-forecast-day'),
			loading:     document.getElementById('tpl-loading'),
			error:       document.getElementById('tpl-error'),
		};
	}

	showLoading()
	{
		const tpl = this.#cloneTemplate('loading');
		this.#applyBindings(tpl, { message: this.#i18n.t('loading') });
		this.#replaceContent(tpl);
	}

	showError(msg)
	{
		const tpl = this.#cloneTemplate('error');
		this.#applyBindings(tpl, { message: msg });
		this.#replaceContent(tpl);
	}

	/**
	 * @param {NormalizedWeatherData} data
	 */
	render(data)
	{
		const condition = data.condition ?? 'unknown';
		const bgClass   = `bg-${condition}${!data.is_day && !condition.includes('night') ? ' night' : ''}`;
		const windDir   = this.#degreesToCardinal(data.wind_direction);

		const tpl = this.#cloneTemplate('widget');

		const bindings = {
			location:       data.location,
			refresh:        this.#i18n.t('refresh'),
			iconSrc:        `icons/${this.#iconFile(data.condition, data.is_day)}.svg`,
			conditionText:  this.#i18n.t(`condition_${data.condition}`),
			temperature:    Math.round(data.temperature),
			unitCelsius:    this.#i18n.t('unit_celsius'),
			feelsLikeLabel: this.#i18n.t('feels_like'),
			feelsLikeValue: `${Math.round(data.feels_like)}${this.#i18n.t('unit_celsius')}`,
			humidityLabel:  this.#i18n.t('humidity'),
			humidityValue:  `${data.humidity}${this.#i18n.t('unit_percent')}`,
			windLabel:      this.#i18n.t('wind'),
			windValue:      `${Math.round(data.wind_speed)} ${this.#i18n.t('unit_kmh')}${windDir ? ` ${windDir}` : ''}`,
			forecastLabel:  this.#i18n.t('forecast'),
			lastUpdated:    this.#i18n.t('last_updated', { time: this.#formatTime(data.timestamp) }),
			provider:       data.provider,
			noForecast:     !data.forecast || data.forecast.length === 0,
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
	#cloneTemplate(key)
	{
		return this.#templates[key].content.cloneNode(true);
	}

	/**
	 * Replace widget content with a DocumentFragment.
	 * @param {DocumentFragment} fragment
	 */
	#replaceContent(fragment)
	{
		this.#root.innerHTML = '';
		this.#root.appendChild(fragment);
	}

	/**
	 * Apply data bindings to a template fragment.
	 * Supports: data-bind (textContent), data-bind-src, data-bind-alt,
	 *           data-bind-title, data-bind-hidden
	 * @param {DocumentFragment|Element} root
	 * @param {Object<string, any>} bindings
	 */
	#applyBindings(root, bindings)
	{
		for (const [key, value] of Object.entries(bindings))
		{
			// textContent binding
			root.querySelectorAll(`[data-bind="${key}"]`).forEach(el => {
				el.textContent = value;
			});

			// Attribute bindings
			root.querySelectorAll(`[data-bind-src="${key}"]`).forEach(el => {
				el.setAttribute('src', value);
			});

			root.querySelectorAll(`[data-bind-alt="${key}"]`).forEach(el => {
				el.setAttribute('alt', value);
			});

			root.querySelectorAll(`[data-bind-title="${key}"]`).forEach(el => {
				el.setAttribute('title', value);
			});

			// Hidden binding (boolean)
			root.querySelectorAll(`[data-bind-hidden="${key}"]`).forEach(el => {
				el.hidden = !!value;
			});
		}
	}

	/**
	 * Render forecast days into the forecast slot.
	 * @param {DocumentFragment} root
	 * @param {Array} forecast
	 */
	#renderForecastSlot(root, forecast)
	{
		const slot = root.querySelector('[data-slot="forecast"]');
		if (!slot || !forecast || forecast.length === 0)
		{
			return;
		}

		forecast.slice(0, 3).forEach(day => {
			const dayFragment = this.#cloneTemplate('forecastDay');
			const date = new Date(day.date);

			this.#applyBindings(dayFragment, {
				dayName:       this.#i18n.t(`day_${date.getDay()}`),
				iconSrc:       `icons/${this.#iconFile(day.condition, true)}.svg`,
				conditionText: this.#i18n.t(`condition_${day.condition}`),
				tempMax:       `${Math.round(day.temp_max)}°`,
				tempMin:       `${Math.round(day.temp_min)}°`,
			});

			slot.appendChild(dayFragment);
		});
	}

	/**
	 * Format timestamp to localized time string.
	 * @param {number|string} timestamp
	 * @returns {string}
	 */
	#formatTime(timestamp)
	{
		return new Date(timestamp).toLocaleTimeString(this.#i18n.lang, {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * Resolve a condition key to a Meteocons filename (without .svg).
	 * For night conditions, tries a night-specific key first before falling back.
	 * @param {string}  condition
	 * @param {boolean} isDay
	 * @returns {string}
	 */
	#iconFile(condition, isDay = true)
	{
		if (!isDay)
		{
			const nightKey = condition.endsWith('_night') ? condition : `${condition}_night`;
			if (Renderer.#ICON_MAP[nightKey])
			{
				return Renderer.#ICON_MAP[nightKey];
			}
		}
		return Renderer.#ICON_MAP[condition] ?? Renderer.#ICON_MAP['unknown'];
	}

	/**
	 * Convert degrees to cardinal direction label.
	 * @param {number|null} deg
	 * @returns {string}
	 */
	#degreesToCardinal(deg)
	{
		if (deg === null || deg === undefined)
		{
			return '';
		}
		const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
		const key  = dirs[Math.round(deg / 45) % 8];
		return this.#i18n.t(`wind_${key}`);
	}
}