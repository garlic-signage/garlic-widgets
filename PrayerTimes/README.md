# Prayer Times Widget

A self-contained digital signage widget that shows Islamic prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) with the next prayer highlighted, a live countdown and the Hijri date. Prayer data comes from the [Aladhan API](https://aladhan.com/prayer-times-api).

The widget renders as a single `index.html` with inline CSS and JavaScript, no build step and no external runtime dependencies. It caches the running month so it keeps working when the network drops.

## Features

- Five daily prayers plus optional sunrise.
- Next-prayer hero with a live countdown.
- Hijri and Gregorian date in the header.
- Automatic Jumu'ah relabel: on Fridays, Dhuhr is shown as "Jumu'ah".
- Four display modes selected automatically from the zone aspect ratio.
- Offline operation: the current month is cached in `localStorage` and a stale indicator is shown when cached data is served after a failed refresh.
- Configurable via W3C widget preferences or URL query parameters.

## Display Modes

The widget measures the zone aspect ratio (`width / height`) at runtime and picks a layout. No configuration needed.

| Mode | Trigger (aspect ratio) | Layout |
|------|------------------------|--------|
| Banner / Ticker | `>= 3.5` | Horizontal scrolling marquee of all prayers, next one tagged |
| Landscape | `>= 1.3` and `< 3.5` | Header, next-prayer hero, row of prayer cells |
| Square | `> 0.75` and `< 1.3` | Full-bleed next-prayer hero only |
| Portrait | `<= 0.75` | Header, hero, vertical list of prayers |

The layout re-evaluates on resize, and the widget also re-renders automatically when the highlighted prayer rolls over to the next one.

## Languages

Three languages are declared as supported: English (`en`), Arabic (`ar`) and German (`de`). The language is selected through the `lang` preference.

> Note: the `lang` preference is read by the player UI. Confirm that the runtime label translations in `index.html` cover all three before shipping, since prayer labels and the "Next" / "in" strings are the user-facing text that needs localising.

## Configuration

Every option can be set two ways:

1. **W3C widget preferences** (`config.xml`), read via `widget.preferences.getItem(name)`.
2. **URL query parameters**, e.g. `index.html?city=Berlin&country=Germany&method=3`.

URL query parameters take precedence over widget preferences, which take precedence over the built-in defaults.

### Location (required)

Provide **either** coordinates **or** city + country. Coordinates win when both are present: the widget only falls back to city/country when latitude or longitude is missing.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `latitude` | text | _empty_ | Latitude, e.g. `51.5074` |
| `longitude` | text | _empty_ | Longitude, e.g. `-0.1278` |
| `city` | text | _empty_ | City name, used only if coordinates are absent |
| `country` | text | _empty_ | Country name, paired with `city` |

If no location is configured at all, the widget shows a "No location configured" notice instead of rendering.

### Calculation

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `method` | integer | `3` | Aladhan calculation method id (see table below) |
| `school` | integer | `0` | Asr calculation. `0` = Shafi (standard), `1` = Hanafi |
| `timezone` | combo | `Europe/London` | IANA timezone string. Empty lets the API infer it from the location |
| `tune` | text | _empty_ | Per-prayer minute offsets (see Tune section) |
| `latitudeAdjustmentMethod` | text | _empty_ | High-latitude rule. `1` = Middle of the Night, `2` = One Seventh, `3` = Angle Based |

#### Calculation methods

The Aladhan API accepts method ids `0`–`23` plus `99` (custom). The mathematical basis is broadly agreed across the Islamic world, but results differ by a few minutes between authorities because of local tuning, so pick the method of the authority closest to the install location. Common ids:

| id | Method |
|----|--------|
| 2 | Islamic Society of North America (ISNA) |
| 3 | Muslim World League (default) |
| 4 | Umm al-Qura University, Makkah |
| 5 | Egyptian General Authority of Survey |
| 13 | Diyanet İşleri Başkanlığı, Turkey |

The full list is available at `https://api.aladhan.com/v1/methods`.

#### Latitude adjustment

For high-latitude locations where Fajr and Isha angles do not occur on some days, set `latitudeAdjustmentMethod` to force one of the three fallback rules. Leave empty everywhere else.

### Display

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeFormat` | radio | `24` | `24` or `12` hour clock |
| `showSunrise` | radio | `true` | Show the sunrise time. Sunrise is not a prayer; it marks the end of Fajr's window and the end of Suhoor |
| `showJumuah` | radio | `true` | On Fridays, relabel Dhuhr as "Jumu'ah" |
| `highlightNext` | radio | `true` | Highlight the next prayer with the hero block and accent colour |
| `accentColor` | color | `#0F6E56` | Highlight colour for the next-prayer focus (hex) |
| `scrollSpeed` | integer | `60` | Banner / ticker marquee speed in pixels per second |

### Tune

`tune` is a comma-separated string of nine integer minute offsets, in Aladhan's fixed order:

```
imsak,fajr,sunrise,dhuhr,asr,maghrib,sunset,isha,midnight
```

Example: `0,2,0,2,0,1,0,2,0` adds 2 minutes to Fajr, Dhuhr and Isha, and 1 minute to Maghrib. Values may be negative. Tuning one prayer does not affect any other. Leave empty to use the raw calculated times.

## Offline Behaviour

On boot the widget loads the current month from the Aladhan calendar endpoint and stores it in `localStorage` under `aladhan_prayer_cache_v1`. The cache key includes a signature of every parameter that affects the result, so changing location or method invalidates it.

When a refresh fails but a cache exists, the widget serves the cached month and shows an "offline · cached" indicator in the corner. A silent background refresh keeps the running month current, and a refresh is also attempted shortly after midnight.

## Installation

1. Package `config.xml`, `index.html` and `icon.png` per your signage player's widget format.
2. Set at minimum a location (coordinates or city + country).
3. Assign the widget to a zone. The layout adapts to the zone's aspect ratio automatically.

For a quick browser test, open `index.html` with query parameters:

```
index.html?latitude=51.5074&longitude=-0.1278&method=3&timeFormat=24
```

## Network Access

The widget contacts a single host:

```
https://api.aladhan.com
```

This is declared in `config.xml` via `<access origin="https://api.aladhan.com" subdomains="true"/>`. No other network access is required.

## Known Notes

- The bundled `config.xml` declares `highlightNext` twice (once as a radio preference, once as a plain value). Keep the radio definition and remove the duplicate to avoid ambiguity in the player UI.
- The `timezone` combo lists the most common timezones for Muslim-majority regions and Muslim minorities in Europe and North America. The Aladhan API expects IANA timezone strings, not UTC offsets, which is why offsets like `UTC+3:30` are not used.

## Data Source & Credits

Prayer times, Hijri dates and calculation methods are provided by the [Aladhan API](https://aladhan.com), part of the Islamic Network. The widget does not modify the returned times beyond the optional `tune` offsets you configure.

## License Widget

MIT License – see [LICENSE](../LICENSE) for details.