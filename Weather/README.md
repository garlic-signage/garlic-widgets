# Weather Widget

A responsive Digital Signage weather widget with animated icons, background images and a 3-day forecast. Supports multiple weather API providers via a normalized adapter layer.

## Structure

```
weather-widget/
├── index.html
├── config.xml
├── icon.svg
├── .gitignore
├── backgrounds/          # AI-generated background images (see below)
│   ├── sunny.jpg
│   ├── sunny-portrait.jpg
│   └── ...
├── icons/                # Meteocons animated SVG icons (see below)
│   ├── clear-day.svg
│   ├── rain.svg
│   └── ...
├── css/
│   └── widget.css
└── js/
    ├── main.js
    ├── WeatherService.js
    ├── Cache.js
    ├── Renderer.js
    ├── adapters/
    │   ├── BaseAdapter.js
    │   ├── OpenMeteoAdapter.js
    │   ├── OpenWeatherMapAdapter.js
    │   └── WeatherApiAdapter.js
    └── i18n/
        ├── I18n.js
        ├── de.js
        └── en.js
```

## Parameters

Passed from the DS CMS as URL query string.

| Name       | Default      | Description                                          |
|------------|--------------|------------------------------------------------------|
| `provider` | `open-meteo` | API provider: `open-meteo`, `openweathermap`, `weatherapi` |
| `apikey`   | _(empty)_    | API key (not required for open-meteo free tier)      |
| `city`     | `Hannover`   | City name (used if no coordinates are given)         |
| `lat`      | _(empty)_    | Latitude — takes priority over `city`                |
| `lon`      | _(empty)_    | Longitude — takes priority over `city`               |
| `lang`     | `de`         | Language: `de` or `en`                               |
| `refresh`  | `3600000`    | Cache TTL in milliseconds (default: 1 hour)          |

Coordinates always take priority over city name. If neither is given, defaults to Hannover.

## Local Testing

Requires a local web server due to ES6 modules:

```bash
# PHP
cd weather-widget && php -S localhost:8080

# Python
cd weather-widget && python3 -m http.server 8080

# Node
cd weather-widget && npx serve .
```

Then open in browser:

```
http://localhost:8080?city=Berlin&lang=de
http://localhost:8080?lat=48.13&lon=11.57&provider=openweathermap&apikey=XXX
http://localhost:8080?city=Bora+Bora&provider=weatherapi&apikey=XXX&lang=en
```

## Build WGT

Open the terminal with `Alt+F12` (Windows/Linux) or `Option+F12` (macOS) and run:

```bash
make
```

The finished `.wgt` file will be placed in `dist/`.

## Icons

Animated SVG weather icons by **Meteocons** by Bas Milius.

- Website: https://meteocons.com
- Repository: https://github.com/basmilius/meteocons
- License: MIT
- Used style: `production/fill/all`

## Background Images

Background images are AI-generated and licensed for free use.

- Tool: DALL-E / Gemini
- Format: JPG, 85% quality
- Two variants per weather condition: landscape (16:9) and portrait (9:16)
- Location: `backgrounds/`

## API Providers

| Provider | Free Tier | API Key | Docs |
|---|---|---|---|
| Open-Meteo | Unlimited | No (optional for commercial) | https://open-meteo.com/en/docs |
| OpenWeatherMap | 1000 calls/day | Yes | https://openweathermap.org/api |
| WeatherAPI | 1M calls/month | Yes | https://www.weatherapi.com/docs |

## Adding a new Provider

1. Create `js/adapters/YourAdapter.js` extending `BaseAdapter`
2. Implement `fetchByCoords(lat, lon)` and `fetchByCity(city)`
3. Return a normalized `NormalizedWeatherData` object (see `BaseAdapter.js`)
4. Register the adapter in `WeatherService._buildAdapter()`