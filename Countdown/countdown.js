(function () {
    "use strict";

    /* ---------- parameters ---------- */

    var params = new URLSearchParams(window.location.search);

    function param(name, fallback) {
        var v = params.get(name);
        return (v === null || v === "") ? fallback : v;
    }

    var cfg = {
        target: param("target", "2026-12-31 00:00"),
        timezone: param("timezone", ""),
        language: param("language", "de").toLowerCase(),
        bgcolor: param("bgcolor", "#10151B"),
        cardcolor: param("cardcolor", "#1F2731"),
        digitcolor: param("digitcolor", "#FFFFFF"),
        labelcolor: param("labelcolor", "#8FA0B3")
    };

    var labels = I18N[cfg.language] || I18N.de;

    /* ---------- colors ---------- */

    function shade(hex, factor) {
        var m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
        if (!m) return hex;
        var n = parseInt(m[1], 16);
        var r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
        var g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
        var b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
        return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }

    var root = document.documentElement.style;
    root.setProperty("--bg", cfg.bgcolor);
    root.setProperty("--card", cfg.cardcolor);
    root.setProperty("--card-dark", shade(cfg.cardcolor, 0.72));
    root.setProperty("--digit", cfg.digitcolor);
    root.setProperty("--label", cfg.labelcolor);

    /* ---------- timezone handling ----------
       Target is interpreted in the given IANA timezone.
       Empty timezone = local timezone of the player.
       DST is resolved automatically via Intl. */

    function tzOffsetMs(ts, tz) {
        var dtf = new Intl.DateTimeFormat("en-US", {
            timeZone: tz, hour12: false,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
        var p = {};
        dtf.formatToParts(new Date(ts)).forEach(function (x) {
            p[x.type] = x.value;
        });
        var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
        return asUtc - ts;
    }

    function parseTarget(str, tz) {
        var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(str.trim());
        if (!m) return NaN;
        var y = +m[1], mo = +m[2] - 1, d = +m[3], h = +m[4], mi = +m[5], s = +(m[6] || 0);

        if (!tz) {
            return new Date(y, mo, d, h, mi, s).getTime();
        }
        try {
            var ts = Date.UTC(y, mo, d, h, mi, s);
            // two iterations handle DST transitions
            ts = Date.UTC(y, mo, d, h, mi, s) - tzOffsetMs(ts, tz);
            ts = Date.UTC(y, mo, d, h, mi, s) - tzOffsetMs(ts, tz);
            return ts;
        } catch (e) {
            // invalid timezone name -> fall back to player local time
            return new Date(y, mo, d, h, mi, s).getTime();
        }
    }

    var targetTs = parseTarget(cfg.target, cfg.timezone);

    /* ---------- build DOM ---------- */

    var clockEl = document.getElementById("clock");
    var cards = [];

    function buildCard(labelText) {
        var unit = document.createElement("div");
        unit.className = "unit";

        var card = document.createElement("div");
        card.className = "card";
        card.innerHTML =
            '<div class="half upper"><span></span></div>' +
            '<div class="half lower"><span></span></div>' +
            '<div class="half flap-upper"><span></span></div>' +
            '<div class="half flap-lower"><span></span></div>';

        var label = document.createElement("div");
        label.className = "label";
        label.textContent = labelText;

        unit.appendChild(card);
        unit.appendChild(label);
        clockEl.appendChild(unit);

        return {
            el: card,
            value: null,
            upper: card.querySelector(".upper span"),
            lower: card.querySelector(".lower span"),
            flapUpper: card.querySelector(".flap-upper span"),
            flapLower: card.querySelector(".flap-lower span"),
            timer: null
        };
    }

    for (var i = 0; i < 4; i++) cards.push(buildCard(labels[i]));

    /* ---------- flip logic ---------- */

    var FLIP_TOTAL = 700; // must be >= 2 * --flip-speed

    function setCard(card, text) {
        if (card.value === text) return;

        if (card.value === null) { // initial paint, no animation
            card.upper.textContent = text;
            card.lower.textContent = text;
            card.value = text;
            return;
        }

        var oldText = card.value;
        card.value = text;

        if (card.timer) { // animation still running: hard set
            clearTimeout(card.timer);
            card.el.classList.remove("flipping");
        }

        card.flapUpper.textContent = oldText;
        card.flapLower.textContent = text;
        card.upper.textContent = text;
        card.lower.textContent = oldText;

        void card.el.offsetWidth; // restart CSS animation
        card.el.classList.add("flipping");

        card.timer = setTimeout(function () {
            card.lower.textContent = card.value;
            card.el.classList.remove("flipping");
            card.timer = null;
        }, FLIP_TOTAL);
    }

    /* ---------- tick ---------- */

    function pad(n, len) {
        var s = String(n);
        while (s.length < len) s = "0" + s;
        return s;
    }

    function tick() {
        var diff = targetTs - Date.now();
        if (isNaN(diff) || diff < 0) diff = 0;

        var total = Math.floor(diff / 1000);
        var days = Math.floor(total / 86400);
        var hours = Math.floor((total % 86400) / 3600);
        var mins = Math.floor((total % 3600) / 60);
        var secs = total % 60;

        var dayStr = pad(days, 2);
        cards[0].el.classList.toggle("wide", dayStr.length > 2);

        setCard(cards[0], dayStr);
        setCard(cards[1], pad(hours, 2));
        setCard(cards[2], pad(mins, 2));
        setCard(cards[3], pad(secs, 2));
    }

    tick();
    setInterval(tick, 1000);
})();
