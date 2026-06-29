# garlic-widgets

A collection of ready-to-use widgets for SMIL-compatible digital signage players such as [garlic-player](https://garlic-signage.com/garlic-player/), IAdea and others.

Each widget is self-contained, packaged as a W3C `.wgt`, and configured entirely through `config.xml` or URL query parameters. No build step is required to run them, and most need only a browser to test.

## Widgets

| Widget | What it does |
|--------|--------------|
| [**Prayer Times**](./prayer-times/) | Islamic prayer times with next-prayer highlight, live countdown and Hijri date. Adapts to landscape, portrait, square and banner zones. Caches the running month for offline use. |
| [**Weather**](./weather-widget/) | Responsive weather widget with animated icons, background images and a 3-day forecast. Multiple API providers via a normalized adapter layer. |
| [**RSS-Ticker**](./rss-ticker/) | Smooth scrolling RSS headlines rendered on HTML5 Canvas. Better performance than CSS marquees on embedded players. |
| [**WebWrap**](./webwrap/) | Embeds any webpage in a playlist and returns to the default playlist after an idle timeout, using the player REST API. Solves the missing interaction-detection problem in SMIL. |

## At a Glance

| Widget | Data source | Network | Build needed | Languages |
|--------|-------------|---------|--------------|-----------|
| Prayer Times | Aladhan API | `api.aladhan.com` | No | en, ar, de |
| Weather | Open-Meteo / OpenWeatherMap / WeatherAPI | provider host | `make` | en, de |
| RSS-Ticker | any RSS feed (via PHP proxy) | your proxy host | No | — |
| WebWrap | any URL | player REST API | No | — |

## Requirements

The packaging step (building `.wgt` files) needs `make` and `zip`.

### Linux
```bash
sudo apt install make zip      # Debian/Ubuntu
sudo dnf install make zip      # Fedora/RHEL
```

### macOS
```bash
brew install make zip
# or
xcode-select --install         # includes make
```

### Windows
```batch
choco install make zip
:: or
winget install GnuWin32.Make
winget install GnuWin32.Zip
```

## Building a Widget

Each widget folder ships its own `Makefile`. From inside a widget directory:

```bash
make
```

The finished `.wgt` is placed in that widget's `dist/` folder, ready to upload to your CMS or copy to the player.

## Testing Locally

Widgets without ES6 modules can be opened directly in a browser with query parameters, e.g.:

```
prayer-times/index.html?city=Berlin&country=Germany&method=3
rss-ticker/index.html?url=https://example.com/feed.xml
```

Widgets that use ES6 modules (Weather) need a local web server:

```bash
cd weather-widget && php -S localhost:8080
# or
cd weather-widget && python3 -m http.server 8080
# or
cd weather-widget && npx serve .
```

See each widget's own README for its full parameter list and provider-specific notes.

## Compatibility

All widgets target the [W3C Widget specification](https://www.w3.org/TR/widgets/) and run on SMIL-compatible players. WebWrap additionally requires the [Garlic-Player REST API](https://garlic-signage.com/garlic-player/docs/rest-api/reference/), which is also supported by IAdea media players.

## License

MIT License — see [LICENSE](./LICENSE).

Third-party assets keep their own licenses (e.g. Weather uses [Meteocons](https://meteocons.com) by Bas Milius, MIT). See the respective widget README for details.
