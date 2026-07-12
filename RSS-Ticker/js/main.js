// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

import {TickerApp} from "./TickerApp.js";
import {TickerView} from "./TickerView.js";
import {TickerFormatter} from "./TickerFormater.js";
import {RSSFetcher} from "./RSSFetcher.js";

document.addEventListener('DOMContentLoaded', () => {

	// enter the path to the fetch-rss.php from tools Dir
	const pathToFetcherScript = 'https://YOUR_PATH_TO/fetch-rss.php';
	const tickerView      = new TickerView();
	const tickerFormatter = new TickerFormatter(tickerView);

	const rssFetcher      = new RSSFetcher(pathToFetcherScript);

	const app = new TickerApp(tickerView, tickerFormatter, rssFetcher);
	app.init();
});
