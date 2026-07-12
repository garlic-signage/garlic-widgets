(() => {
  // .build/PrayerTimes/js/PrayerConfig.js
  var PrayerConfig = class {
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
      if (v === null || v === void 0 || v === "") return fallback;
      return v;
    }
    boolParam(name, fallback) {
      const v = this.param(name, null);
      if (v === null) return fallback;
      return /^(1|true|yes|on)$/i.test(v);
    }
    getSignature() {
      return [
        this.latitude,
        this.longitude,
        this.city,
        this.country,
        this.method,
        this.school,
        this.timezone,
        this.tune,
        this.latAdj
      ].join("|");
    }
    getDisplayOrder() {
      return this.showSunrise ? ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] : ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    }
  };

  // .build/PrayerTimes/js/PrayerDataService.js
  var PrayerDataService = class {
    constructor(config) {
      this.config = config;
      this.CACHE_KEY = "aladhan_prayer_cache_v1";
      this.monthData = null;
      this.stale = false;
    }
    loadCache() {
      try {
        return JSON.parse(localStorage.getItem(this.CACHE_KEY));
      } catch (e) {
        return null;
      }
    }
    saveCache(obj) {
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(obj));
      } catch (e) {
      }
    }
    getCalendarUrl(year, month) {
      let base;
      const q = [];
      const byCity = (!this.config.latitude || !this.config.longitude) && this.config.city;
      if (byCity) {
        base = `https://api.aladhan.com/v1/calendarByCity/${year}/${month}`;
        q.push("city=" + encodeURIComponent(this.config.city));
        q.push("country=" + encodeURIComponent(this.config.country));
      } else {
        base = `https://api.aladhan.com/v1/calendar/${year}/${month}`;
        q.push("latitude=" + encodeURIComponent(this.config.latitude));
        q.push("longitude=" + encodeURIComponent(this.config.longitude));
      }
      q.push("method=" + encodeURIComponent(this.config.method));
      q.push("school=" + encodeURIComponent(this.config.school));
      if (this.config.timezone) q.push("timezonestring=" + encodeURIComponent(this.config.timezone));
      if (this.config.tune) q.push("tune=" + encodeURIComponent(this.config.tune));
      if (this.config.latAdj) q.push("latitudeAdjustmentMethod=" + encodeURIComponent(this.config.latAdj));
      return base + "?" + q.join("&");
    }
    async fetchMonth(year, month) {
      const response = await fetch(this.getCalendarUrl(year, month));
      if (!response.ok) throw new Error("HTTP " + response.status);
      const j = await response.json();
      if (!j || !j.data || !j.data.length) throw new Error("empty");
      const days = {};
      j.data.forEach((d) => {
        const dayNum = parseInt(d.date.gregorian.day, 10);
        days[dayNum] = {
          timings: d.timings,
          hijri: d.date.hijri
        };
      });
      const obj = {
        sig: this.config.getSignature(),
        year,
        month,
        days
      };
      this.saveCache(obj);
      return obj;
    }
    async ensureData() {
      const now = /* @__PURE__ */ new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const cached = this.loadCache();
      const cacheUsable = cached && cached.sig === this.config.getSignature() && cached.year === y && cached.month === m;
      if (cacheUsable) {
        this.monthData = cached;
        this.stale = false;
      }
      if (!cacheUsable) {
        try {
          const obj = await this.fetchMonth(y, m);
          this.monthData = obj;
          this.stale = false;
          return;
        } catch (e) {
          if (cached) {
            this.monthData = cached;
            this.stale = true;
            return;
          } else {
            throw new Error("no-data");
          }
        }
      }
      this.fetchMonth(y, m).then((obj) => {
        this.monthData = obj;
        this.stale = false;
      }).catch(() => {
        this.stale = true;
      });
    }
    getDayEntry(dateObj) {
      if (!this.monthData) return null;
      if (dateObj.getFullYear() === this.monthData.year && dateObj.getMonth() + 1 === this.monthData.month) {
        return this.monthData.days[dateObj.getDate()] || null;
      }
      return null;
    }
  };

  // .build/PrayerTimes/js/PrayerUtils.js
  var PrayerUtils = class {
    static parseHM(str) {
      const m = String(str).match(/(\d{1,2}):(\d{2})/);
      return m ? {
        h: parseInt(m[1], 10),
        m: parseInt(m[2], 10)
      } : null;
    }
    static dateAt(base, hm) {
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hm.h, hm.m, 0, 0);
    }
    static fmtTime(hm, timeFormat = "24") {
      if (!hm) return "--:--";
      if (timeFormat === "12") {
        const ap = hm.h < 12 ? "AM" : "PM";
        let hr = hm.h % 12;
        if (hr === 0) hr = 12;
        return hr + ":" + String(hm.m).padStart(2, "0") + " " + ap;
      }
      return String(hm.h).padStart(2, "0") + ":" + String(hm.m).padStart(2, "0");
    }
    static fmtClock(d) {
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
    }
    static fmtCountdown(ms, withSeconds) {
      if (ms < 0) ms = 0;
      const total = Math.floor(ms / 1e3);
      const h = Math.floor(total / 3600);
      const m = Math.floor(total % 3600 / 60);
      const s = total % 60;
      if (withSeconds) return "in " + h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      return "in " + h + ":" + String(m).padStart(2, "0");
    }
  };

  // .build/PrayerTimes/js/PrayerCalculator.js
  var PrayerCalculator = class {
    constructor(config, dataService) {
      this.config = config;
      this.dataService = dataService;
      this.LABEL = {
        Fajr: "Fajr",
        Sunrise: "Sunrise",
        Dhuhr: "Dhuhr",
        Asr: "Asr",
        Maghrib: "Maghrib",
        Isha: "Isha"
      };
      this.PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    }
    compute() {
      const now = /* @__PURE__ */ new Date();
      const today = this.dataService.getDayEntry(now);
      if (!today) return null;
      const times = {};
      this.config.getDisplayOrder().forEach((k) => {
        const hm = PrayerUtils.parseHM(today.timings[k]);
        if (hm) times[k] = {
          hm,
          date: PrayerUtils.dateAt(now, hm)
        };
      });
      const labels = Object.assign({}, this.LABEL);
      if (this.config.showJumuah && now.getDay() === 5) labels.Dhuhr = "Jumu'ah";
      let nextKey = null;
      let nextDate = null;
      for (let i = 0; i < this.PRAYERS.length; i++) {
        const k = this.PRAYERS[i];
        if (times[k] && times[k].date.getTime() > now.getTime()) {
          nextKey = k;
          nextDate = times[k].date;
          break;
        }
      }
      if (!nextKey) {
        nextKey = "Fajr";
        const tomorrow = new Date(now.getTime() + 864e5);
        const tEntry = this.dataService.getDayEntry(tomorrow);
        const tHM = tEntry ? PrayerUtils.parseHM(tEntry.timings.Fajr) : times.Fajr ? times.Fajr.hm : null;
        nextDate = tHM ? new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), tHM.h, tHM.m, 0, 0) : new Date(now.getTime() + 36e5);
      }
      return {
        now,
        times,
        labels,
        hijri: today.hijri,
        nextKey,
        nextDate
      };
    }
  };

  // .build/PrayerTimes/js/PrayerRenderer.js
  var PrayerRenderer = class _PrayerRenderer {
    #config;
    #i18n;
    #templates;
    #root;
    static PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    constructor(config, i18n) {
      this.#config = config;
      this.#i18n = i18n;
      this.#root = document.getElementById("app");
      this.#templates = {
        error: document.getElementById("tpl-error"),
        header: document.getElementById("tpl-header"),
        hero: document.getElementById("tpl-hero"),
        cell: document.getElementById("tpl-cell"),
        banner: document.getElementById("tpl-banner"),
        bannerItem: document.getElementById("tpl-banner-item"),
        portrait: document.getElementById("tpl-portrait"),
        landscape: document.getElementById("tpl-landscape"),
        square: document.getElementById("tpl-square")
      };
    }
    pickFormat() {
      const r = window.innerWidth / window.innerHeight;
      if (r >= 3.5) return "banner";
      if (r <= 0.75) return "portrait";
      if (r >= 1.3) return "landscape";
      return "square";
    }
    render(c, appElement) {
      if (!c) {
        const tpl = this.#cloneTemplate("error");
        this.#applyBindings(tpl, {
          message: this.#i18n.t("error_unavailable")
        });
        this.#replaceContent(tpl);
        return null;
      }
      const fmt = this.pickFormat();
      const layoutMap = {
        banner: () => this.#renderBanner(c),
        portrait: () => this.#renderLayout("portrait", c, true),
        square: () => this.#renderSquare(c),
        landscape: () => this.#renderLayout("landscape", c, false)
      };
      layoutMap[fmt]();
      return fmt;
    }
    #renderBanner(c) {
      const tpl = this.#cloneTemplate("banner");
      const slot = tpl.querySelector('[data-slot="items"]');
      for (let i = 0; i < 2; i++) {
        this.#config.getDisplayOrder().forEach((k) => {
          if (!c.times[k]) return;
          const item = this.#cloneTemplate("bannerItem");
          this.#applyBindings(item, {
            name: this.#i18n.t(`prayer_${k}`),
            time: PrayerUtils.fmtTime(c.times[k].hm, this.#config.timeFormat)
          });
          if (k === c.nextKey) {
            item.querySelector(".item").classList.add("next");
          }
          slot.appendChild(item);
        });
      }
      this.#replaceContent(tpl);
      this.#setupMarqueeAnimation();
    }
    #renderLayout(layout, c, asList) {
      const tpl = this.#cloneTemplate(layout);
      const headerSlot = tpl.querySelector('[data-slot="header"]');
      if (headerSlot) {
        headerSlot.replaceWith(this.#buildHeader(c));
      }
      const heroSlot = tpl.querySelector('[data-slot="hero"]');
      if (heroSlot && this.#config.highlightNext) {
        heroSlot.replaceWith(this.#buildHero(c, true));
      } else if (heroSlot) {
        heroSlot.remove();
      }
      const cellsSlot = tpl.querySelector('[data-slot="cells"]');
      if (cellsSlot) {
        this.#buildCells(c, cellsSlot);
      }
      this.#replaceContent(tpl);
    }
    #renderSquare(c) {
      const tpl = this.#cloneTemplate("square");
      const heroSlot = tpl.querySelector('[data-slot="hero"]');
      if (heroSlot && this.#config.highlightNext) {
        heroSlot.replaceWith(this.#buildHero(c, true));
      }
      this.#replaceContent(tpl);
    }
    #buildHeader(c) {
      const tpl = this.#cloneTemplate("header");
      const loc = this.#config.city ? this.#config.country ? `${this.#config.city}, ${this.#config.country}` : this.#config.city : "";
      const hijriMonth = c.hijri ? this.#i18n.t(`hijri_${this.#normalizeHijriKey(c.hijri.month.en)}`) : "";
      const hijri = c.hijri ? `${c.hijri.day} ${hijriMonth} ${c.hijri.year}` : "";
      const greg = c.now.toLocaleDateString(this.#i18n.lang, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      this.#applyBindings(tpl, {
        location: loc,
        clock: PrayerUtils.fmtClock(c.now),
        hijri,
        greg
      });
      return tpl;
    }
    #buildHero(c, withSeconds) {
      const tpl = this.#cloneTemplate("hero");
      this.#applyBindings(tpl, {
        nextPrefix: this.#i18n.t("next"),
        nextLabel: this.#i18n.t(`prayer_${c.nextKey}`),
        nextTime: PrayerUtils.fmtTime(
          { h: c.nextDate.getHours(), m: c.nextDate.getMinutes() },
          this.#config.timeFormat
        ),
        countdown: PrayerUtils.fmtCountdown(c.nextDate - c.now, withSeconds)
      });
      return tpl;
    }
    #buildCells(c, container) {
      this.#config.getDisplayOrder().forEach((k) => {
        if (!c.times[k]) return;
        const cell = this.#cloneTemplate("cell");
        this.#applyBindings(cell, {
          name: this.#i18n.t(`prayer_${k}`),
          time: PrayerUtils.fmtTime(c.times[k].hm, this.#config.timeFormat)
        });
        const cellEl = cell.querySelector(".cell");
        if (k === c.nextKey) {
          cellEl.classList.add("next");
        } else if (this.#isPassed(c, k)) {
          cellEl.classList.add("passed");
        }
        container.appendChild(cell);
      });
    }
    #isPassed(c, k) {
      const isPrayer = _PrayerRenderer.PRAYERS.includes(k) || k === "Sunrise";
      return isPrayer && c.times[k].date.getTime() < c.now.getTime();
    }
    #setupMarqueeAnimation() {
      const mq = document.getElementById("marquee");
      if (mq) {
        const oneSeqWidth = mq.scrollWidth / 2;
        const dur = oneSeqWidth / Math.max(10, this.#config.scrollSpeed);
        mq.style.animationDuration = `${dur}s`;
      }
    }
    /**
     * Normalisiert den Hijri-Monatsnamen zu einem i18n-Schlüssel.
     * z.B. "Rabi' al-Awwal" -> "RabiAlAwwal"
     * @param {string} monthName
     * @returns {string}
     */
    #normalizeHijriKey(monthName) {
      return monthName.replace(/[\s'-]/g, "").replace(/^(\w)/, (m, c) => c.toUpperCase());
    }
    #cloneTemplate(key) {
      return this.#templates[key].content.cloneNode(true);
    }
    #replaceContent(fragment) {
      this.#root.innerHTML = "";
      this.#root.appendChild(fragment);
    }
    #applyBindings(root, bindings) {
      for (const [key, value] of Object.entries(bindings)) {
        root.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => {
          el.textContent = value;
        });
      }
    }
    updateStatus(stale) {
      const s = document.getElementById("status");
      if (stale) {
        s.textContent = this.#i18n.t("status_offline");
        s.classList.add("show");
      } else {
        s.classList.remove("show");
      }
    }
    updateClockAndCountdown(c) {
      const clock = document.getElementById("clock");
      if (clock) {
        clock.textContent = PrayerUtils.fmtClock(c.now);
      }
      const cd = document.getElementById("countdown");
      if (cd) {
        cd.textContent = PrayerUtils.fmtCountdown(c.nextDate - c.now, true);
      }
    }
  };

  // .build/PrayerTimes/js/PrayerApp.js
  var PrayerApp = class {
    constructor(config, dataService, calculator, renderer) {
      this.config = config;
      this.dataService = dataService;
      this.calculator = calculator;
      this.renderer = renderer;
      this.lastFormat = null;
      this.lastNextKey = null;
      this.appElement = document.getElementById("app");
    }
    async boot() {
      if (!this.config.latitude && !this.config.longitude && !this.config.city) {
        this.appElement.innerHTML = '<div class="fatal">No location configured.<br>Set latitude/longitude or city/country.</div>';
        return;
      }
      try {
        await this.dataService.ensureData();
        this.render();
      } catch (e) {
        this.appElement.innerHTML = '<div class="fatal">Could not load prayer times.<br>No cached data and network unavailable.</div>';
      }
      setInterval(() => this.tick(), 1e3);
      let rt;
      window.addEventListener("resize", () => {
        clearTimeout(rt);
        rt = setTimeout(() => this.render(), 200);
      });
      setInterval(() => {
        const n = /* @__PURE__ */ new Date();
        if (n.getHours() === 0 && n.getMinutes() < 5) {
          this.dataService.ensureData().then(() => this.render());
        }
      }, 6e4);
    }
    render() {
      const c = this.calculator.compute();
      this.lastFormat = this.renderer.render(c, this.appElement);
      if (c) {
        this.lastNextKey = c.nextKey;
      }
      this.renderer.updateStatus(this.dataService.stale);
    }
    tick() {
      if (!this.dataService.monthData) return;
      const c = this.calculator.compute();
      if (!c) return;
      if (this.renderer.pickFormat() !== this.lastFormat || c.nextKey !== this.lastNextKey) {
        this.render();
        return;
      }
      this.renderer.updateClockAndCountdown(c);
    }
  };

  // .build/PrayerTimes/js/i18n/I18n.js
  var I18n = class {
    #translations;
    #lang;
    #rtlLanguages = ["ar", "fa", "he", "ur"];
    constructor(translations, lang = "en") {
      this.#translations = translations;
      this.#lang = translations[lang] ? lang : "en";
    }
    get lang() {
      return this.#lang;
    }
    get isRtl() {
      return this.#rtlLanguages.includes(this.#lang);
    }
    t(key, vars = {}) {
      const str = this.#translations[this.#lang]?.[key] ?? this.#translations["en"]?.[key] ?? key;
      return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    }
    setLang(lang) {
      if (this.#translations[lang]) {
        this.#lang = lang;
        document.documentElement.dir = this.isRtl ? "rtl" : "ltr";
        document.documentElement.lang = lang;
      }
    }
  };

  // .build/PrayerTimes/js/i18n/en.js
  var en = {
    // Status messages
    error_unavailable: "Prayer times unavailable.\nCheck location settings and network.",
    error_no_location: "No location configured.\nSet latitude/longitude or city/country.",
    error_network: "Could not load prayer times.\nNo cached data and network unavailable.",
    status_offline: "offline \xB7 cached",
    // Hero section
    next: "Next",
    // Prayer names
    prayer_Fajr: "Fajr",
    prayer_Sunrise: "Sunrise",
    prayer_Dhuhr: "Dhuhr",
    prayer_Asr: "Asr",
    prayer_Maghrib: "Maghrib",
    prayer_Isha: "Isha",
    // Hijri months
    hijri_Muharram: "Muharram",
    hijri_Safar: "Safar",
    hijri_RabiAlAwwal: "Rabi' al-Awwal",
    hijri_RabiAlThani: "Rabi' al-Thani",
    hijri_JumadaAlUla: "Jumada al-Ula",
    hijri_JumadaAlThani: "Jumada al-Thani",
    hijri_Rajab: "Rajab",
    hijri_Shaban: "Sha'ban",
    hijri_Ramadan: "Ramadan",
    hijri_Shawwal: "Shawwal",
    hijri_DhuAlQidah: "Dhu al-Qi'dah",
    hijri_DhuAlHijjah: "Dhu al-Hijjah"
  };

  // .build/PrayerTimes/js/i18n/de.js
  var de = {
    // Statusmeldungen
    error_unavailable: "Gebetszeiten nicht verf\xFCgbar.\nPr\xFCfen Sie die Standorteinstellungen und Netzwerkverbindung.",
    error_no_location: "Kein Standort konfiguriert.\nBitte Koordinaten oder Stadt/Land angeben.",
    error_network: "Gebetszeiten konnten nicht geladen werden.\nKein Cache und kein Netzwerk verf\xFCgbar.",
    status_offline: "offline \xB7 zwischengespeichert",
    // Hero-Bereich
    next: "N\xE4chstes",
    // Gebetsnamen
    prayer_Fajr: "Fadschr",
    prayer_Sunrise: "Sonnenaufgang",
    prayer_Dhuhr: "Dhuhr",
    prayer_Asr: "Asr",
    prayer_Maghrib: "Maghrib",
    prayer_Isha: "Ischa",
    // Hijri-Monate
    hijri_Muharram: "Muharram",
    hijri_Safar: "Safar",
    hijri_RabiAlAwwal: "Rabi' al-Awwal",
    hijri_RabiAlThani: "Rabi' al-Thani",
    hijri_JumadaAlUla: "Dschumada al-Ula",
    hijri_JumadaAlThani: "Dschumada al-Thania",
    hijri_Rajab: "Radschab",
    hijri_Shaban: "Scha'ban",
    hijri_Ramadan: "Ramadan",
    hijri_Shawwal: "Schawwal",
    hijri_DhuAlQidah: "Dhu l-Qa'da",
    hijri_DhuAlHijjah: "Dhu l-Hiddscha"
  };

  // .build/PrayerTimes/js/i18n/ar.js
  var ar = {
    // رسائل الحالة
    error_unavailable: "\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629.\n\u062A\u062D\u0642\u0642 \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0634\u0628\u0643\u0629.",
    error_no_location: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0643\u0648\u064A\u0646 \u0627\u0644\u0645\u0648\u0642\u0639.\n\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u0645\u062F\u064A\u0646\u0629/\u0627\u0644\u0628\u0644\u062F.",
    error_network: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629.\n\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062E\u0632\u0646\u0629 \u0648\u0644\u0627 \u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0634\u0628\u0643\u0629.",
    status_offline: "\u063A\u064A\u0631 \u0645\u062A\u0635\u0644 \xB7 \u0645\u062E\u0632\u0646 \u0645\u0624\u0642\u062A\u0627\u064B",
    // القسم الرئيسي
    next: "\u0627\u0644\u062A\u0627\u0644\u064A",
    // أسماء الصلوات
    prayer_Fajr: "\u0627\u0644\u0641\u062C\u0631",
    prayer_Sunrise: "\u0627\u0644\u0634\u0631\u0648\u0642",
    prayer_Dhuhr: "\u0627\u0644\u0638\u0647\u0631",
    prayer_Asr: "\u0627\u0644\u0639\u0635\u0631",
    prayer_Maghrib: "\u0627\u0644\u0645\u063A\u0631\u0628",
    prayer_Isha: "\u0627\u0644\u0639\u0634\u0627\u0621",
    // الأشهر الهجرية
    hijri_Muharram: "\u0645\u062D\u0631\u0651\u0645",
    hijri_Safar: "\u0635\u0641\u0631",
    hijri_RabiAlAwwal: "\u0631\u0628\u064A\u0639 \u0627\u0644\u0623\u0648\u0644",
    hijri_RabiAlThani: "\u0631\u0628\u064A\u0639 \u0627\u0644\u0622\u062E\u0631",
    hijri_JumadaAlUla: "\u062C\u0645\u0627\u062F\u0649 \u0627\u0644\u0623\u0648\u0644\u0649",
    hijri_JumadaAlThani: "\u062C\u0645\u0627\u062F\u0649 \u0627\u0644\u0622\u062E\u0631\u0629",
    hijri_Rajab: "\u0631\u062C\u0628",
    hijri_Shaban: "\u0634\u0639\u0628\u0627\u0646",
    hijri_Ramadan: "\u0631\u0645\u0636\u0627\u0646",
    hijri_Shawwal: "\u0634\u0648\u0651\u0627\u0644",
    hijri_DhuAlQidah: "\u0630\u0648 \u0627\u0644\u0642\u0639\u062F\u0629",
    hijri_DhuAlHijjah: "\u0630\u0648 \u0627\u0644\u062D\u062C\u0629"
  };

  // .build/PrayerTimes/js/main.js
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang") || en;
    const i18n = new I18n({ en, de, ar }, lang);
    if (i18n.isRtl) {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = lang;
    }
    const config = new PrayerConfig(params);
    const dataService = new PrayerDataService(config);
    const calculator = new PrayerCalculator(config, dataService);
    const renderer = new PrayerRenderer(config, i18n);
    const app = new PrayerApp(config, dataService, calculator, renderer, i18n);
    app.boot();
  });
})();
