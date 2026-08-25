import {PrayerUtils} from "./PrayerUtils.js";

export class PrayerRenderer {
    #config;
    #i18n;
    #templates;
    #root;

    static PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

    constructor(config, i18n) {
        this.#config = config;
        this.#i18n = i18n;
        this.#root = document.getElementById('app');
        this.#templates = {
            error: document.getElementById('tpl-error'),
            header: document.getElementById('tpl-header'),
            hero: document.getElementById('tpl-hero'),
            cell: document.getElementById('tpl-cell'),
            banner: document.getElementById('tpl-banner'),
            bannerItem: document.getElementById('tpl-banner-item'),
            portrait: document.getElementById('tpl-portrait'),
            landscape: document.getElementById('tpl-landscape'),
            square: document.getElementById('tpl-square'),
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
            const tpl = this.#cloneTemplate('error');
            this.#applyBindings(tpl, {
                message: this.#i18n.t('error_unavailable')
            });
            this.#replaceContent(tpl);
            return null;
        }

        const fmt = this.pickFormat();
        const layoutMap = {
            banner: () => this.#renderBanner(c),
            portrait: () => this.#renderLayout('portrait', c, true),
            square: () => this.#renderSquare(c),
            landscape: () => this.#renderLayout('landscape', c, false),
        };

        layoutMap[fmt]();
        return fmt;
    }

    #renderBanner(c) {
        const tpl = this.#cloneTemplate('banner');
        const slot = tpl.querySelector('[data-slot="items"]');

        // Zwei Durchläufe für Endlos-Scroll
        for (let i = 0; i < 2; i++) {
            this.#config.getDisplayOrder().forEach(k => {
                if (!c.times[k]) return;
                const item = this.#cloneTemplate('bannerItem');
                this.#applyBindings(item, {
                    name: this.#i18n.t(`prayer_${k}`),
                    time: PrayerUtils.fmtTime(c.times[k].hm, this.#config.timeFormat)
                });
                if (k === c.nextKey) {
                    item.querySelector('.item').classList.add('next');
                }
                slot.appendChild(item);
            });
        }

        this.#replaceContent(tpl);
        this.#setupMarqueeAnimation();
    }

    #renderLayout(layout, c, asList) {
        const tpl = this.#cloneTemplate(layout);

        // Header einfügen
        const headerSlot = tpl.querySelector('[data-slot="header"]');
        if (headerSlot) {
            headerSlot.replaceWith(this.#buildHeader(c));
        }

        // Hero einfügen
        const heroSlot = tpl.querySelector('[data-slot="hero"]');
        if (heroSlot && this.#config.highlightNext) {
            heroSlot.replaceWith(this.#buildHero(c, true));
        } else if (heroSlot) {
            heroSlot.remove();
        }

        // Cells einfügen
        const cellsSlot = tpl.querySelector('[data-slot="cells"]');
        if (cellsSlot) {
            this.#buildCells(c, cellsSlot);
        }

        this.#replaceContent(tpl);
    }

    #renderSquare(c) {
        const tpl = this.#cloneTemplate('square');
        const heroSlot = tpl.querySelector('[data-slot="hero"]');

        if (heroSlot && this.#config.highlightNext) {
            heroSlot.replaceWith(this.#buildHero(c, true));
        }

        this.#replaceContent(tpl);
    }

    #buildHeader(c) {
        const tpl = this.#cloneTemplate('header');
        const loc = this.#config.city
            ? (this.#config.country ? `${this.#config.city}, ${this.#config.country}` : this.#config.city)
            : "";

        const hijriMonth = c.hijri
            ? this.#i18n.t(`hijri_${this.#normalizeHijriKey(c.hijri.month.en)}`)
            : '';
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
            hijri: hijri,
            greg: greg
        });
        return tpl;
    }

    #buildHero(c, withSeconds) {
        const tpl = this.#cloneTemplate('hero');
        this.#applyBindings(tpl, {
            nextPrefix: this.#i18n.t('next'),
            nextLabel: this.#i18n.t(`prayer_${c.nextKey}`),
            nextTime: PrayerUtils.fmtTime(
                {h: c.nextDate.getHours(), m: c.nextDate.getMinutes()},
                this.#config.timeFormat
            ),
            countdown: PrayerUtils.fmtCountdown(c.nextDate - c.now, withSeconds)
        });
        return tpl;
    }

    #buildCells(c, container) {
        this.#config.getDisplayOrder().forEach(k => {
            if (!c.times[k]) return;

            const cell = this.#cloneTemplate('cell');
            this.#applyBindings(cell, {
                name: this.#i18n.t(`prayer_${k}`),
                time: PrayerUtils.fmtTime(c.times[k].hm, this.#config.timeFormat)
            });

            const cellEl = cell.querySelector('.cell');
            if (k === c.nextKey) {
                cellEl.classList.add('next');
            } else if (this.#isPassed(c, k)) {
                cellEl.classList.add('passed');
            }

            container.appendChild(cell);
        });
    }

    #isPassed(c, k) {
        const isPrayer = PrayerRenderer.PRAYERS.includes(k) || k === "Sunrise";
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
        return monthName
            .replace(/[\s'-]/g, '')
            .replace(/^(\w)/, (m, c) => c.toUpperCase());
    }

    #cloneTemplate(key) {
        return this.#templates[key].content.cloneNode(true);
    }

    #replaceContent(fragment) {
        this.#root.innerHTML = '';
        this.#root.appendChild(fragment);
    }

    #applyBindings(root, bindings) {
        for (const [key, value] of Object.entries(bindings)) {
            root.querySelectorAll(`[data-bind="${key}"]`).forEach(el => {
                el.textContent = value;
            });
        }
    }

    updateStatus(stale) {
        const s = document.getElementById("status");
        if (stale) {
            s.textContent = this.#i18n.t('status_offline');
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
}