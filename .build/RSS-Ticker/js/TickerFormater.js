// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

/**
 * TickerFormatter - Formats RSS feed data into ticker text
 */
export class TickerFormatter
{
	#tickerView = {};
	#separator  = " +++ ";

	constructor(tickerView)
	{
		this.#tickerView = tickerView;
	}

	format(feedObj)
	{
		let tickerText = this.#separator;

		for (let i = 0; i < feedObj.query.count; i++)
		{
			const itemText = feedObj.query.results.item[i].title + this.#separator;

			if (this.#tickerView.isNewContentSizeValid(tickerText + itemText))
			{
				tickerText += itemText;
			}
			else
			{
				break;
			}
		}

		return tickerText;
	}
}
