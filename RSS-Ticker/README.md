# RSS-Ticker Widget

A lightweight Digital Signage widget that displays RSS feed headlines as smooth, scrolling text using HTML5 Canvas.

## Description

This RSS-Ticker is a [Digital Signage Widget](https://smil-control.com/magazine/digital-signage-widgets)
[[1]](https://smil-control.com/magazine/digital-signage-widgets) designed for integration into digital signage
playlists.
It fetches RSS feeds and renders the headlines
as [HTML running text based on Canvas](https://smil-control.com/magazine/html-running-texts) [[2]](https://smil-control.com/magazine/html-running-texts).

### Why Canvas?

Unlike CSS-based marquees, the Canvas approach offers:

- **Smooth scrolling** with `requestAnimationFrame`
- **Dynamic content sizing** – automatically adapts to the screen width
- **Better performance** on embedded digital signage players
- **Full control** over animation speed and rendering

## Parameters

| Parameter   | Type    | Default      | Description                  |
|-------------|---------|--------------|------------------------------|
| `url`       | text    | *(required)* | URL of the RSS feed          |
| `fetch_rss` | text    | *(required)* | URL of faetch-rss.php script |
| `font_size` | integer | `30`         | Font size in pixels          |
| `bgcolor`   | color   | `#008080`    | Background color             |
| `color`     | color   | `#ffffff`    | Text color                   |

## Usage

### Direct URL

Open the widget in a browser with URL parameters:

### Fetch RSS PHP

To prevent rss get blocked by SOP, a PHP proxy script (`tools/fetch-rss.php`) is required.
Here you can set the path to the PHP proxy script.

### As W3C Widget

The widget follows the [W3C Widget specification](https://www.w3.org/TR/widgets/) and can be packaged as a `.wgt` file
for use in compatible Digital Signage CMS systems.

## Server-Side Proxy

Due to browser Same-Origin-Policy (SOP) restrictions, RSS feeds from external domains cannot be fetched directly. A PHP
proxy script (`tools/fetch-rss.php`) is required.

### Setup

1. Deploy `fetch-rss.php` to your web server
2. Ensure the `php-xml` extension is installed:
   ```bash
   sudo apt-get install php7.3-xml
   ```
3. Configure the `baseUrl` in `RSSFetcher.js` to point to your proxy

## Project Structure

RSS-Ticker/
├── index.html # Main entry point
├── config.xml # W3C Widget configuration
├── icon.png # Widget icon
├── css/ │
└── style.css # Styles
└── js/ ├── init.js# Bootstrap and dependency injection
├── TickerApp.js # Main application controller
├── TickerView.js # Canvas rendering and animation
├── TickerFormatter.js # RSS data formatting
└── RSSFetcher.js # HTTP fetch logic

## License Widget

MIT License – see [LICENSE](../LICENSE) for details.