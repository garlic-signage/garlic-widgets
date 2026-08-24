# Flip Countdown

A self-contained digital signage widget that counts down to a target date and time using a flip-clock style display (days, hours, minutes, seconds). No build step and no external runtime dependencies.

## Features

- Flip-clock animation for days, hours, minutes and seconds.
- Configurable target date/time with timezone support and automatic DST handling.
- Six supported legend languages.
- Fully configurable colors for background, cards, digits and labels.

## Configuration

All options are set via W3C widget preferences (`config.xml`), read through `widget.preferences.getItem(name)`.

### Target

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | text | `2026-12-31 00:00` | Target date/time, format `YYYY-MM-DD HH:MM`. Mandatory. |
| `timezone` | text | `Europe/Berlin` | IANA timezone, e.g. `Europe/Berlin`, `America/New_York`. Empty uses the player's timezone. DST is handled automatically. |

### Language

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | text | `de` | Legend language: `de`, `en`, `es`, `el`, `fr`, `ru` |

### Colors

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bgcolor` | color | `#10151B` | Background color |
| `cardcolor` | color | `#1F2731` | Flip card color |
| `digitcolor` | color | `#FFFFFF` | Digit font color |
| `labelcolor` | color | `#8FA0B3` | Legend color (days/hours/minutes/seconds) |

## Installation

1. Package `config.xml`, `index.html` and `icon.png` per your signage player's widget format.
2. Set the `target` preference to the desired date/time and `timezone` to the matching IANA timezone.
3. Assign the widget to a zone.

## Network Access

The widget performs all countdown calculations locally and requires no network access.

## License

MIT License – see [LICENSE](../LICENSE) for details.