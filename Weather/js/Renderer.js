/**
 * Renderer
 * Writes normalized weather data to the DOM.
 * No styling here — structure and data only.
 */
export class Renderer
{

	#i18n;
	#root;

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
	}

	showLoading()
	{
		this.#root.innerHTML = `<div class="state-loading">${this.#i18n.t('loading')}</div>`;
	}

	showError(msg)
	{
		this.#root.innerHTML = `<div class="state-error">${msg}</div>`;
	}

	/**
	 * @param {NormalizedWeatherData} data
	 */
	render(data)
	{
		const condition = data.condition ?? 'unknown';
		const bgClass = `bg-${condition}${!data.is_day && !condition.includes('night') ? ' night' : ''}`;

		this.#root.className = `widget ${bgClass}`;
		this.#root.innerHTML = `
		${this.#renderHeader(data)}
		${this.#renderCurrent(data)}
		${this.#renderDetails(data)}
		${this.#renderForecast(data.forecast)}
		${this.#renderFooter(data)}
	`;
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
				return Renderer.#ICON_MAP[nightKey];
		}
		return Renderer.#ICON_MAP[condition] ?? Renderer.#ICON_MAP['unknown'];
	}

	#renderHeader(data)
	{
		return `
        <header class="widget-header">
            <span class="location">${this.#esc(data.location)}</span>
            <button id="btn-refresh" class="btn-refresh" title="${this.#i18n.t('refresh')}">↻</button>
        </header>`;
	}

	#renderCurrent(data)
	{
		const condKey  = `condition_${data.condition}`;
		const iconFile = this.#iconFile(data.condition, data.is_day);
		return `
        <section class="widget-current">
            <div class="weather-icon">
                <img src="icons/${iconFile}.svg"
                     alt="${this.#i18n.t(condKey)}"
                     onerror="this.src='icons/not-available.svg'">
            </div>
            <div class="temperature">
                ${Math.round(data.temperature)}<span class="unit">${this.#i18n.t('unit_celsius')}</span>
            </div>
            <div class="condition-text">${this.#i18n.t(condKey)}</div>
        </section>`;
	}

	#renderDetails(data)
	{
		const windDir = this.#degreesToCardinal(data.wind_direction);
		return `
        <section class="widget-details">
            <div class="detail-item">
                <span class="detail-label">${this.#i18n.t('feels_like')}</span>
                <span class="detail-value">${Math.round(data.feels_like)}${this.#i18n.t('unit_celsius')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">${this.#i18n.t('humidity')}</span>
                <span class="detail-value">${data.humidity}${this.#i18n.t('unit_percent')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">${this.#i18n.t('wind')}</span>
                <span class="detail-value">${Math.round(data.wind_speed)} ${this.#i18n.t('unit_kmh')}${windDir ? ` ${windDir}` : ''}</span>
            </div>
        </section>`;
	}

	#renderForecast(forecast)
	{
		if (!forecast || forecast.length === 0) return '';

		const days = forecast.slice(0, 3).map(day => {
			const date     = new Date(day.date);
			const dayName  = this.#i18n.t(`day_${date.getDay()}`);
			const condKey  = `condition_${day.condition}`;
			const iconFile = this.#iconFile(day.condition, true); // forecast always uses day icons
			return `
            <div class="forecast-day">
                <span class="forecast-weekday">${dayName}</span>
                <img class="forecast-icon"
                     src="icons/${iconFile}.svg"
                     alt="${this.#i18n.t(condKey)}"
                     onerror="this.src='icons/not-available.svg'">
                <span class="forecast-temps">
                    <span class="temp-max">${Math.round(day.temp_max)}°</span>
                    <span class="temp-min">${Math.round(day.temp_min)}°</span>
                </span>
            </div>`;
		}).join('');

		return `
        <section class="widget-forecast">
            <div class="forecast-label">${this.#i18n.t('forecast')}</div>
            <div class="forecast-days">${days}</div>
        </section>`;
	}

	#renderFooter(data)
	{
		const time = new Date(data.timestamp).toLocaleTimeString(this.#i18n.lang, {
			hour: '2-digit', minute: '2-digit'
		});
		return `
        <footer class="widget-footer">
            <span>${this.#i18n.t('last_updated', { time })}</span>
            <span class="provider">${data.provider}</span>
        </footer>`;
	}

	/**
	 * Convert degrees to cardinal direction label.
	 * @param {number|null} deg
	 * @returns {string}
	 */
	#degreesToCardinal(deg)
	{
		if (deg === null || deg === undefined) return '';
		const dirs = ['N','NE','E','SE','S','SW','W','NW'];
		const key  = dirs[Math.round(deg / 45) % 8];
		return this.#i18n.t(`wind_${key}`);
	}

	/**
	 * Escape HTML special characters.
	 * @param {string} str
	 * @returns {string}
	 */
	#esc(str)
	{
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
}