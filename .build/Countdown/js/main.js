"use strict";
(() => {
  // .build/Countdown/js/WidgetConfig.js
  var WidgetConfig = class {
    constructor(search) {
      var params = new URLSearchParams(search);
      this.target = this.#get(params, "target", this.#defaultTarget());
      this.timezone = this.#get(params, "timezone", "Europe/Berlin");
      this.language = this.#get(params, "language", "en").toLowerCase();
      this.bgColor = this.#get(params, "bgcolor", "#10151B");
      this.cardColor = this.#get(params, "cardcolor", "#1F2731");
      this.digitColor = this.#get(params, "digitcolor", "#FFFFFF");
      this.labelColor = this.#get(params, "labelcolor", "#8FA0B3");
    }
    #get(params, name, fallback) {
      var v = params.get(name);
      return v === null || v === "" ? fallback : v;
    }
    #defaultTarget() {
      var d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + 30);
      var pad = function(n) {
        return String(n).padStart(2, "0");
      };
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }
  };

  // .build/Countdown/js/ThemeApplier.js
  var ThemeApplier = class {
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
      let r = Math.max(0, Math.min(255, Math.round((n >> 16 & 255) * factor)));
      let g = Math.max(0, Math.min(255, Math.round((n >> 8 & 255) * factor)));
      let b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
      return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    }
  };

  // .build/Countdown/js/Translator.js
  var Translator = class {
    constructor(dictionary) {
      this.dictionary = dictionary;
    }
    labelsFor(language) {
      return this.dictionary[language] || this.dictionary.de;
    }
  };

  // .build/Countdown/js/TimezoneConverter.js
  var TimezoneConverter = class {
    toTimestamp(targetString, timezone) {
      let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(targetString.trim());
      if (!m) return NaN;
      let y = +m[1], mo = +m[2] - 1, d = +m[3], h = +m[4], mi = +m[5], s = +(m[6] || 0);
      if (!timezone) {
        return new Date(y, mo, d, h, mi, s).getTime();
      }
      try {
        let ts = Date.UTC(y, mo, d, h, mi, s);
        ts = Date.UTC(y, mo, d, h, mi, s) - this._offsetMs(ts, timezone);
        ts = Date.UTC(y, mo, d, h, mi, s) - this._offsetMs(ts, timezone);
        return ts;
      } catch (e) {
        return new Date(y, mo, d, h, mi, s).getTime();
      }
    }
    _offsetMs(ts, timezone) {
      let dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      let p = {};
      dtf.formatToParts(new Date(ts)).forEach(function(x) {
        p[x.type] = x.value;
      });
      let asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
      return asUtc - ts;
    }
  };

  // .build/Countdown/js/FlipCard.js
  var FLIP_TOTAL_MS = 700;
  var FlipCard = class {
    constructor(labelText) {
      this.value = null;
      this.timer = null;
      this.unitEl = document.createElement("div");
      this.unitEl.className = "unit";
      this.cardEl = document.createElement("div");
      this.cardEl.className = "card";
      this.cardEl.innerHTML = '<div class="half upper"><span></span></div><div class="half lower"><span></span></div><div class="half flap-upper"><span></span></div><div class="half flap-lower"><span></span></div>';
      this.upperEl = this.cardEl.querySelector(".upper span");
      this.lowerEl = this.cardEl.querySelector(".lower span");
      this.flapUpperEl = this.cardEl.querySelector(".flap-upper span");
      this.flapLowerEl = this.cardEl.querySelector(".flap-lower span");
      this.labelEl = document.createElement("div");
      this.labelEl.className = "label";
      this.labelEl.textContent = labelText;
      this.unitEl.appendChild(this.cardEl);
      this.unitEl.appendChild(this.labelEl);
    }
    appendTo(parentEl) {
      parentEl.appendChild(this.unitEl);
    }
    setWide(isWide) {
      this.cardEl.classList.toggle("wide", isWide);
    }
    setValue(text) {
      if (this.value === text) return;
      if (this.value === null) {
        this.upperEl.textContent = text;
        this.lowerEl.textContent = text;
        this.value = text;
        return;
      }
      var oldText = this.value;
      this.value = text;
      if (this.timer) {
        clearTimeout(this.timer);
        this.cardEl.classList.remove("flipping");
      }
      this.flapUpperEl.textContent = oldText;
      this.flapLowerEl.textContent = text;
      this.upperEl.textContent = text;
      this.lowerEl.textContent = oldText;
      void this.cardEl.offsetWidth;
      this.cardEl.classList.add("flipping");
      var self = this;
      this.timer = setTimeout(function() {
        self.lowerEl.textContent = self.value;
        self.cardEl.classList.remove("flipping");
        self.timer = null;
      }, FLIP_TOTAL_MS);
    }
  };

  // .build/Countdown/js/RemainingTime.js
  var RemainingTime = class {
    static fromMillis(diffMs) {
      let total = Math.floor(Math.max(diffMs, 0) / 1e3);
      return {
        days: Math.floor(total / 86400),
        hours: Math.floor(total % 86400 / 3600),
        minutes: Math.floor(total % 3600 / 60),
        seconds: total % 60
      };
    }
    static pad(n, len) {
      let s = String(n);
      while (s.length < len) s = "0" + s;
      return s;
    }
  };

  // .build/Countdown/js/FlipCountdown.js
  var FlipCountdown = class {
    constructor(containerEl, targetTs, labels) {
      this.targetTs = targetTs;
      this.cards = labels.map(function(label) {
        return new FlipCard(label);
      });
      this.cards.forEach(function(card) {
        card.appendTo(containerEl);
      });
      this.intervalId = null;
    }
    start() {
      this._render();
      let self = this;
      this.intervalId = setInterval(function() {
        self._render();
      }, 1e3);
    }
    stop() {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
    _render() {
      let diff = this.targetTs - Date.now();
      let remaining = RemainingTime.fromMillis(isNaN(diff) ? 0 : diff);
      let dayStr = RemainingTime.pad(remaining.days, 2);
      this.cards[0].setWide(dayStr.length > 2);
      this.cards[0].setValue(dayStr);
      this.cards[1].setValue(RemainingTime.pad(remaining.hours, 2));
      this.cards[2].setValue(RemainingTime.pad(remaining.minutes, 2));
      this.cards[3].setValue(RemainingTime.pad(remaining.seconds, 2));
    }
  };

  // .build/Countdown/js/main.js
  document.addEventListener("DOMContentLoaded", () => {
    let config = new WidgetConfig(window.location.search);
    new ThemeApplier(document.documentElement.style).apply(config);
    let labels = new Translator(I18N).labelsFor(config.language);
    let targetTs = new TimezoneConverter().toTimestamp(config.target, config.timezone);
    let countdown = new FlipCountdown(document.getElementById("clock"), targetTs, labels);
    countdown.start();
  });
})();
