export class PrayerDataService
{
	constructor(config)
	{
		this.config = config;
		this.CACHE_KEY = "aladhan_prayer_cache_v1";
		this.monthData = null;
		this.stale = false;
	}

	loadCache()
	{
		try
		{
			return JSON.parse(localStorage.getItem(this.CACHE_KEY));
		} catch (e)
		{
			return null;
		}
	}

	saveCache(obj)
	{
		try
		{
			localStorage.setItem(this.CACHE_KEY, JSON.stringify(obj));
		} catch (e)
		{}
	}

	getCalendarUrl(year, month)
	{
		let base;
		const q = [];
		const byCity = (!this.config.latitude || !this.config.longitude) && this.config.city;
		if (byCity)
		{
			base = `https://api.aladhan.com/v1/calendarByCity/${year}/${month}`;
			q.push("city=" + encodeURIComponent(this.config.city));
			q.push("country=" + encodeURIComponent(this.config.country));
		} else
		{
			base = `https://api.aladhan.com/v1/calendar/${year}/${month}`;
			q.push("latitude=" + encodeURIComponent(this.config.latitude));
			q.push("longitude=" + encodeURIComponent(this.config.longitude));
		}
		q.push("method=" + encodeURIComponent(this.config.method));
		q.push("school=" + encodeURIComponent(this.config.school));
		if (this.config.timezone) q.push("timezonestring=" + encodeURIComponent(this.config.timezone));
		if (this.config.tune) q.push("tune=" + encodeURIComponent(this.config.tune));
		if (this.config.latAdj) q.push("latitudeAdjustmentMethod=" + encodeURIComponent(this.config.latAdj));
		return base + "?" + q.join("&");
	}

	async fetchMonth(year, month)
	{
		const response = await fetch(this.getCalendarUrl(year, month));
		if (!response.ok) throw new Error("HTTP " + response.status);
		const j = await response.json();
		if (!j || !j.data || !j.data.length) throw new Error("empty");
		const days = {};
		j.data.forEach((d) =>
		{
			const dayNum = parseInt(d.date.gregorian.day, 10);
			days[dayNum] = {
				timings: d.timings,
				hijri: d.date.hijri
			};
		});
		const obj = {
			sig: this.config.getSignature(),
			year: year,
			month: month,
			days: days
		};
		this.saveCache(obj);
		return obj;
	}

	async ensureData()
	{
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth() + 1;

		const cached = this.loadCache();
		const cacheUsable = cached && cached.sig === this.config.getSignature() &&
			cached.year === y && cached.month === m;

		if (cacheUsable)
		{
			this.monthData = cached;
			this.stale = false;
		}

		if (!cacheUsable)
		{
			try
			{
				const obj = await this.fetchMonth(y, m);
				this.monthData = obj;
				this.stale = false;
				return;
			} catch (e)
			{
				if (cached)
				{
					this.monthData = cached;
					this.stale = true;
					return;
				} else
				{
					throw new Error("no-data");
				}
			}
		}

		// Silent background refresh
		this.fetchMonth(y, m)
			.then((obj) =>
			{
				this.monthData = obj;
				this.stale = false;
			})
			.catch(() =>
			{
				this.stale = true;
			});
	}

	getDayEntry(dateObj)
	{
		if (!this.monthData) return null;
		if (dateObj.getFullYear() === this.monthData.year && (dateObj.getMonth() + 1) === this.monthData.month)
		{
			return this.monthData.days[dateObj.getDate()] || null;
		}
		return null;
	}
}
