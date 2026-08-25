# Stream Widget

A self-contained digital signage widget that plays a video or audio stream in full-screen mode. No build step and no external runtime dependencies.

## Features

- Plays video or audio streams full-screen.
- Optional playback controls.

## Configuration

All options are set via W3C widget preferences (`config.xml`), read through `widget.preferences.getItem(name)`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `streamUrl` | text | _empty_ | URL of the video or audio stream. Mandatory. |
| `mediaType` | text | `video` | Media type: `video` or `audio` |
| `showControls` | text | `false` | Show playback controls: `true` or `false` |

## Installation

1. Package `config.xml`, `index.html` and `icon.png` per your signage player's widget format.
2. Set `streamUrl` to the stream to play and `mediaType` accordingly.
3. Assign the widget to a zone.

## Network Access

The widget contacts the host configured in `streamUrl`.

## Author

Niko Sagiadinos ([niko@sagiadinos.com](mailto:niko@sagiadinos.com)) – [garlic-signage.com](https://garlic-signage.com)

## License

MIT License – see [LICENSE](../LICENSE) for details.