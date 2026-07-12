export class PrayerUtils
{
	static parseHM(str)
	{
		const m = String(str).match(/(\d{1,2}):(\d{2})/);
		return m ? {
			h: parseInt(m[1], 10),
			m: parseInt(m[2], 10)
		} : null;
	}

	static dateAt(base, hm)
	{
		return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hm.h, hm.m, 0, 0);
	}

	static fmtTime(hm, timeFormat = "24")
	{
		if (!hm) return "--:--";
		if (timeFormat === "12")
		{
			const ap = hm.h < 12 ? "AM" : "PM";
			let hr = hm.h % 12;
			if (hr === 0) hr = 12;
			return hr + ":" + String(hm.m).padStart(2, "0") + " " + ap;
		}
		return String(hm.h).padStart(2, "0") + ":" + String(hm.m).padStart(2, "0");
	}

	static fmtClock(d)
	{
		return String(d.getHours()).padStart(2, "0") + ":" +
			String(d.getMinutes()).padStart(2, "0") + ":" +
			String(d.getSeconds()).padStart(2, "0");
	}

	static fmtCountdown(ms, withSeconds)
	{
		if (ms < 0) ms = 0;
		const total = Math.floor(ms / 1000);
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		const s = total % 60;
		if (withSeconds) return "in " + h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
		return "in " + h + ":" + String(m).padStart(2, "0");
	}
}
