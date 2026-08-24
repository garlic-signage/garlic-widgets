"use strict";

import {FlipCard} from "./FlipCard.js";
import {RemainingTime} from "./RemainingTime.js";

export class FlipCountdown {
    constructor(containerEl, targetTs, labels) {
        this.targetTs = targetTs;
        this.cards = labels.map(function (label) {
            return new FlipCard(label);
        });
        this.cards.forEach(function (card) {
            card.appendTo(containerEl);
        });
        this.intervalId = null;
    }

    start() {
        this._render();
        let self = this;
        this.intervalId = setInterval(function () {
            self._render();
        }, 1000);
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
}
