"use strict";
export class RemainingTime
{
    static fromMillis(diffMs)
	{
        let total = Math.floor(Math.max(diffMs, 0) / 1000);
        return {
            days:    Math.floor(total / 86400),
            hours:   Math.floor((total % 86400) / 3600),
            minutes: Math.floor((total % 3600) / 60),
            seconds: total % 60
        };
    }

    static pad(n, len)
	{
        let s = String(n);
        while (s.length < len) s = "0" + s;
        return s;
    }
}
