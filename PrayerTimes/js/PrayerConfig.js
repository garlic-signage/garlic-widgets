export class PrayerConfig {
    constructor() {
        this.latitude = this.param("latitude", "");
        this.longitude = this.param("longitude", "");
        this.city = this.param("city", "Hanover");
        this.country = this.param("country", "Germany");
        this.method = this.param("method", "3");
        this.school = this.param("school", "0");
        this.timezone = this.param("timezone", "");
        this.tune = this.param("tune", "");
        this.latAdj = this.param("latitudeAdjustmentMethod", "");
        this.timeFormat = this.param("timeFormat", "24");
        this.showSunrise = this.boolParam("showSunrise", true);
        this.showJumuah = this.boolParam("showJumuah", true);
        this.highlightNext = this.boolParam("highlightNext", true);
        this.accent = this.param("accentColor", "#0F6E56");
        this.scrollSpeed = parseFloat(this.param("scrollSpeed", "60"));

        document.documentElement.style.setProperty("--accent", this.accent);
    }

    param(name, fallback) {
        let v = new URLSearchParams(location.search).get(name);
        if (v === null && window.widget && widget.preferences) {
            try {
                v = widget.preferences.getItem(name);
            } catch (e) {
                v = null;
            }
        }
        if (v === null || v === undefined || v === "") return fallback;
        return v;
    }

    boolParam(name, fallback) {
        const v = this.param(name, null);
        if (v === null) return fallback;
        return /^(1|true|yes|on)$/i.test(v);
    }

    getSignature() {
        return [this.latitude, this.longitude, this.city, this.country, this.method,
            this.school, this.timezone, this.tune, this.latAdj].join("|");
    }

    getDisplayOrder() {
        return this.showSunrise
            ? ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
            : ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    }
}
