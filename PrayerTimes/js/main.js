import {PrayerConfig} from "./PrayerConfig.js";
import {PrayerDataService} from "./PrayerDataService.js";
import {PrayerCalculator} from "./PrayerCalculator.js";
import {PrayerRenderer} from "./PrayerRenderer.js";
import {PrayerApp} from "./PrayerApp.js";

import {I18n} from './i18n/I18n.js';
import {en} from './i18n/en.js';
import {de} from './i18n/de.js';
import {ar} from './i18n/ar.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || en;

    const i18n = new I18n({en, de, ar}, lang);

    if (i18n.isRtl) {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = lang;
    }

    const config = new PrayerConfig(params);
    const dataService = new PrayerDataService(config);
    const calculator = new PrayerCalculator(config, dataService);
    const renderer = new PrayerRenderer(config, i18n);
    const app = new PrayerApp(config, dataService, calculator, renderer, i18n);

    app.boot();
});