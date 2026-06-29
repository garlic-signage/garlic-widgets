import {PrayerUtils} from "./PrayerUtils.js";

export class PrayerCalculator
{
	constructor(config, dataService)
	{
		this.config = config;
		this.dataService = dataService;
		this.LABEL = {
			Fajr: "Fajr",
			Sunrise: "Sunrise",
			Dhuhr: "Dhuhr",
			Asr: "Asr",
			Maghrib: "Maghrib",
			Isha: "Isha"
		};
		this.PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
	}

	compute()
	{
		const now = new Date();
		const today = this.dataService.getDayEntry(now);
		if (!today) return null;

		const times = {};
		this.config.getDisplayOrder().forEach((k) =>
		{
			const hm = PrayerUtils.parseHM(today.timings[k]);
			if (hm) times[k] = {
				hm: hm,
				date: PrayerUtils.dateAt(now, hm)
			};
		});

		const labels = Object.assign({}, this.LABEL);
		if (this.config.showJumuah && now.getDay() === 5) labels.Dhuhr = "Jumu'ah";

		let nextKey = null;
		let nextDate = null;
		for (let i = 0; i < this.PRAYERS.length; i++)
		{
			const k = this.PRAYERS[i];
			if (times[k] && times[k].date.getTime() > now.getTime())
			{
				nextKey = k;
				nextDate = times[k].date;
				break;
			}
		}

		if (!nextKey)
		{
			nextKey = "Fajr";
			const tomorrow = new Date(now.getTime() + 86400000);
			const tEntry = this.dataService.getDayEntry(tomorrow);
			const tHM = tEntry ? PrayerUtils.parseHM(tEntry.timings.Fajr) : (times.Fajr ? times.Fajr.hm : null);
			nextDate = tHM ? new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), tHM.h, tHM.m, 0, 0)
				: new Date(now.getTime() + 3600000);
		}

		return {
			now: now,
			times: times,
			labels: labels,
			hijri: today.hijri,
			nextKey: nextKey,
			nextDate: nextDate
		};
	}
}
