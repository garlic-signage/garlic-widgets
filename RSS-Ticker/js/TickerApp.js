// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

/**
 * TickerApp - Main application controller
 */
export class TickerApp {
    #tickerView = {};
    #rssFetcher = {};
    #tickerFormatter = {};

    constructor(tickerView, tickerFormatter, rssFetcher) {
        this.#tickerView = tickerView;
        this.#rssFetcher = rssFetcher;
        this.#tickerFormatter = tickerFormatter;
    }

    init() {
        // Konfiguration aus URL-Parametern
        const url = this.getUrlParam("url", "https://www.phoronix.com/rss.php");
        const fetch_rss_url = this.getUrlParam("fetch_rss", "");
        const color = this.getUrlParam("color", "black");
        const fontSize = this.getUrlParam("font_size", "30");
        const bgColor = this.getUrlParam("bgcolor", "transparent");

        this.#tickerView.setStyle(color, fontSize);
        document.body.style.background = bgColor;

        window.addEventListener('resize', () => this.#tickerView.resize(), false);

        this.loadFeed(url, fetch_rss_url);
    }

    async loadFeed(url, fetch_rss_url) {
        try {
			this.#rssFetcher.baseUrl = fetch_rss_url;
            const feedObj = await this.#rssFetcher.fetch(url);
            const tickerText = this.#tickerFormatter.format(feedObj);
            this.#tickerView.start(tickerText);
        } catch (error) {
            console.error(error);
        }
    }

    getUrlParam(name, defaultValue) {
        const url = new URL(window.location);
        const value = url.searchParams.get(name);
        return (value === "" || value == null) ? defaultValue : value;
    }
}
