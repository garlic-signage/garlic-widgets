"use strict";

var FLIP_TOTAL_MS = 700; // must be >= 2 * CSS --flip-speed

export class FlipCard
{
    constructor(labelText)
	{
        this.value = null;
        this.timer = null;

        this.unitEl = document.createElement("div");
        this.unitEl.className = "unit";

        this.cardEl = document.createElement("div");
        this.cardEl.className = "card";
        this.cardEl.innerHTML =
            '<div class="half upper"><span></span></div>' +
            '<div class="half lower"><span></span></div>' +
            '<div class="half flap-upper"><span></span></div>' +
            '<div class="half flap-lower"><span></span></div>';

        this.upperEl     = this.cardEl.querySelector(".upper span");
        this.lowerEl      = this.cardEl.querySelector(".lower span");
        this.flapUpperEl = this.cardEl.querySelector(".flap-upper span");
        this.flapLowerEl = this.cardEl.querySelector(".flap-lower span");

        this.labelEl = document.createElement("div");
        this.labelEl.className = "label";
        this.labelEl.textContent = labelText;

        this.unitEl.appendChild(this.cardEl);
        this.unitEl.appendChild(this.labelEl);
    }

    appendTo(parentEl)
	{
        parentEl.appendChild(this.unitEl);
    }

    setWide(isWide)
	{
        this.cardEl.classList.toggle("wide", isWide);
    }

    setValue(text)
	{
        if (this.value === text) return;

        if (this.value === null) { // initial paint, no animation
            this.upperEl.textContent = text;
            this.lowerEl.textContent = text;
            this.value = text;
            return;
        }

        var oldText = this.value;
        this.value = text;

        if (this.timer)
		{
			// animation still running, hard set
            clearTimeout(this.timer);
            this.cardEl.classList.remove("flipping");
        }

        this.flapUpperEl.textContent = oldText;
        this.flapLowerEl.textContent = text;
        this.upperEl.textContent = text;
        this.lowerEl.textContent = oldText;

        void this.cardEl.offsetWidth; // restart CSS animation
        this.cardEl.classList.add("flipping");

        var self = this;
        this.timer = setTimeout(function () {
            self.lowerEl.textContent = self.value;
            self.cardEl.classList.remove("flipping");
            self.timer = null;
        }, FLIP_TOTAL_MS);
    }
}
