"use strict";
export class WidgetConfig
{
    constructor(search)
	{
        var params = new URLSearchParams(search);
        this.target     = this.#get(params, "target", "2026-12-31 00:00");
        this.timezone   = this.#get(params, "timezone", "Europe/Berlin");
        this.language   = this.#get(params, "language", "en").toLowerCase();
        this.bgColor    = this.#get(params, "bgcolor", "#10151B");
        this.cardColor  = this.#get(params, "cardcolor", "#1F2731");
        this.digitColor = this.#get(params, "digitcolor", "#FFFFFF");
        this.labelColor = this.#get(params, "labelcolor", "#8FA0B3");
    }

    #get(params, name, fallback)
	{
        var v = params.get(name);
        return (v === null || v === "") ? fallback : v;
    }
}
