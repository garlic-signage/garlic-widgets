import {WeatherService} from './WeatherService.js';
import {I18n} from './i18n/I18n.js';
import {de} from './i18n/de.js';
import {en} from './i18n/en.js';
import {es} from './i18n/es.js';
import {fr} from './i18n/fr.js';
import {el} from './i18n/el.js';
import {ru} from './i18n/ru.js';
import {Renderer} from './Renderer.js';

/**
 * URL parameters:
 *
 * ?provider=open-meteo|openweathermap|weatherapi  (default: open-meteo)
 * ?apikey=XXXX                                    (optional, depends on provider)
 * ?lat=48.13&lon=11.57                            (coordinates, take priority)
 * ?city=Munich                                    (city name, fallback)
 * ?lang=de|en|es|fr|el|ru                     (default: de)
 * ?refresh=3600000                                (cache TTL in ms, default: 1h)
 */

const params = new URLSearchParams(window.location.search);

const config = {
    provider: params.get('provider') ?? 'open-meteo',
    apiKey: params.get('apikey') ?? '',
    lat: params.get('lat') ? parseFloat(params.get('lat')) : null,
    lon: params.get('lon') ? parseFloat(params.get('lon')) : null,
    city: params.get('city') ?? null,
    lang: params.get('lang') ?? 'en',
    cacheTtlMs: params.get('refresh') ? parseInt(params.get('refresh')) : 60 * 60 * 1000,
};

if (!config.lat && !config.lon && !config.city)
    config.city = 'Hannover';

const langMap = {
    de: 'de', en: 'en', es: 'es', fr: 'fr', el: 'el', ru: 'ru',

    german: 'de',
    english: 'en',
    spanish: 'es',
    french: 'fr',
    greek: 'el',
    russian: 'ru',

    deutsch: 'de',
    español: 'es',
    français: 'fr',
    ελληνικά: 'el',
    русский: 'ru'
};

const normalizedLang = langMap[config.lang?.toLowerCase()] || 'en';
const i18n = new I18n({de, en, es, fr, el, ru}, normalizedLang);
const service = new WeatherService({provider: config.provider, apiKey: config.apiKey, cacheTtlMs: config.cacheTtlMs});
const renderer = new Renderer(i18n);

async function load() {
    renderer.showLoading();
    try {
        const data = await service.fetch({lat: config.lat, lon: config.lon, city: config.city});
        renderer.render(data);
    } catch (err) {
        console.error(err);
        renderer.showError(i18n.t('error'));
    }
}

// Initial load
load();

// Auto-refresh after TTL
setInterval(load, config.cacheTtlMs);

// Refresh button
document.getElementById('btn-refresh')?.addEventListener('click', () => {
    service.clearCache();
    load();
});
