"use strict";

import {WidgetConfig} from "./WidgetConfig.js";
import {ThemeApplier} from "./ThemeApplier.js";
import {Translator}   from "./Translator.js";
import {TimezoneConverter} from "./TimezoneConverter.js";
import {FlipCountdown} from "./FlipCountdown.js";

document.addEventListener('DOMContentLoaded', () => {

    let config = new WidgetConfig(window.location.search);
    new ThemeApplier(document.documentElement.style).apply(config);

    let labels   = new Translator(I18N).labelsFor(config.language);
    let targetTs = new TimezoneConverter().toTimestamp(config.target, config.timezone);

    let countdown = new FlipCountdown(document.getElementById("clock"), targetTs, labels);
    countdown.start();
});
