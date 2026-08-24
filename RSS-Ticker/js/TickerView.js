// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

/**
 * TickerCanvas - Handles all canvas rendering and animation
 */
export class TickerView {
    #canvas = document.getElementById("myTicker");
    #ctx = {};
    #movePixel = 1;
    #maxCanvasWidth = 16384;
    #x = 0;
    #margin = 10;
    #textWidth = 0;
    #tickerContent = "";
    #tickerColor = "yellow";
    #fontSize = 30;

    constructor() {
        this.#ctx = this.#canvas.getContext("2d");
    }

    setStyle(color, fontSize) {
        this.#tickerColor = color;
        this.#fontSize = parseInt(fontSize);
    }

    resize() {
        this.#canvas.width = window.innerWidth;
        this.#margin = Math.round(this.#fontSize / 3);
        this.#canvas.height = this.#fontSize + this.#margin;
        this.#ctx.font = `bold ${this.#fontSize}px Sans`;
        this.#ctx.fillStyle = this.#tickerColor;
        this.#textWidth = Math.round(this.#ctx.measureText(this.#tickerContent).width) + 1;
        this.#x = this.#canvas.width;
    }

    isNewContentSizeValid(text) {
        return this.#ctx.measureText(text).width < this.#maxCanvasWidth;
    }

    setContent(text) {
        this.#tickerContent = text;
    }

    animate() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

        if (this.#x > -this.#textWidth)
            this.#x -= this.#movePixel;
        else
            this.#x = this.#canvas.width;

        this.#ctx.fillText(this.#tickerContent, this.#x, this.#canvas.height - this.#margin);
        window.requestAnimationFrame(() => this.animate());
    }

    start(text) {
        this.setContent(text);
        this.resize();
        window.requestAnimationFrame(() => this.animate());
    }
}