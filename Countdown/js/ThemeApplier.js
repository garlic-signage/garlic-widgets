"use strict";

export class ThemeApplier {
    constructor(rootStyle) {
        this.rootStyle = rootStyle;
    }

    apply(config) {
        this.rootStyle.setProperty("--bg", config.bgColor);
        this.rootStyle.setProperty("--card", config.cardColor);
        this.rootStyle.setProperty("--card-dark", this._shade(config.cardColor, 0.72));
        this.rootStyle.setProperty("--digit", config.digitColor);
        this.rootStyle.setProperty("--label", config.labelColor);
    }

    _shade(hex, factor) {
        let m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
        if (!m) return hex;
        let n = parseInt(m[1], 16);
        let r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
        let g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
        let b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
        return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }
}
