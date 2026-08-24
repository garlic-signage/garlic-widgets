// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

/**
 * RSSFetcher - Handles RSS feed fetching and parsing
 */
export class RSSFetcher
{
	#baseUrl = "";
	constructor()
	{
	}


	set baseUrl(value) {
		this.#baseUrl = value + "?feed_url=";
	}

	fetch(feedUrl)
	{
		return new Promise((resolve, reject) => {
			const requestUrl = this.#baseUrl + feedUrl;
			const request = new XMLHttpRequest();

			request.open("GET", requestUrl, true);
			request.onload = () => {
				if (request.readyState === 4 && request.status === 200)
					resolve(JSON.parse(request.responseText));
				else
					reject(new Error(request.statusText));
			};
			request.onerror = () => reject(new Error(request.statusText));
			request.send(null);
		});
	}
}