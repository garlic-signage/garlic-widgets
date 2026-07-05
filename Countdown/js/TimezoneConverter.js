"use strict";
export class TimezoneConverter
{
    toTimestamp(targetString, timezone)
	{
        let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(targetString.trim());
        if (!m) return NaN;

        let y = +m[1], mo = +m[2] - 1, d = +m[3], h = +m[4], mi = +m[5], s = +(m[6] || 0);

        if (!timezone)
		{
            return new Date(y, mo, d, h, mi, s).getTime();
        }

        try
		{
            let ts = Date.UTC(y, mo, d, h, mi, s);
            // two iterations handle DST transitions
            ts = Date.UTC(y, mo, d, h, mi, s) - this._offsetMs(ts, timezone);
            ts = Date.UTC(y, mo, d, h, mi, s) - this._offsetMs(ts, timezone);
            return ts;
        }
		catch (e)
		{
            // invalid timezone name, fall back to player local time
            return new Date(y, mo, d, h, mi, s).getTime();
        }
    }

    _offsetMs(ts, timezone)
	{
        let dtf = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone, hour12: false,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
        let p = {};
        dtf.formatToParts(new Date(ts)).forEach(function (x) { p[x.type] = x.value; });
        let asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
        return asUtc - ts;
    }
}
