# WebWrap

WebWrap is a digital signage widget that embeds any webpage inside a digital signage playlist and automatically returns to the playlist after a configurable idle timeout.

## The Problem

SMIL playlists can open a webpage on various [triggers] (https://garlic-signage.com/garlic-player/docs/essentials/triggers/), but have no way to detect user interaction inside the widget. The only option is a static duration that breaks interactive use cases: if a visitor opens a wayfinder or shopping guide and walks away mid-session, the playlist is stuck until the fixed timer runs out.

## The Solution

WebWrap wraps the target URL in an iframe and monitors touch and click activity. If the screen goes idle for a defined period, it calls the REST API from [Garlic-Player](https://garlic-signage.com/garlic-player/) or [IAdea](https://www.iadea.com) to switch back to the default playlist. The visitor gets a countdown overlay warning before the switch tapping anywhere cancels it.

## Features

- Opens any URL in a fullscreen iframe
- Configurable idle timeout (default: 60s)
- Countdown overlay before returning to the playlist (configurable or disabled)
- Calls `POST /v2/app/switch` on the local Garlic-Player REST API to resume playlist
- OAuth2 token handling with automatic refresh
- Activity detection: touch, click, keyboard, scroll
- Same-origin iframe activity detection (best-effort, silently ignored for cross-origin)
- All parameters passed via SMIL `config.xml` — no code changes needed per deployment

## Parameters

| Parameter      | Default         | Description                                             |
|----------------|-----------------|---------------------------------------------------------|
| `url`          | —               | URL to display (required)                               |
| `idle_timeout` | `60`            | Seconds of inactivity before returning to playlist      |
| `warn_at`      | `10`            | Seconds before timeout at which countdown overlay shows |
| `show_overlay` | `true`          | Show countdown overlay (`true`/`false`)                 |
| `overlay_msg`  | `Tap to continue` | Message shown in the countdown overlay                  |
| `player_host`  | `localhost`     | REST API host                                           |
| `player_port`  | `8080`          | REST API port                                           |
| `player_user`  | ``         | REST API username (optional)                            |
| `player_pass`  | ` `             | REST API password (optional)                                  |

## SMIL Example

```xml
<ref src="WebWrap.wgt">
  <param name="url"          value="https://your-wayfinder.example.com"/>
  <param name="idle_timeout" value="60"/>
  <param name="warn_at"      value="10"/>
  <param name="overlay_msg"  value="Returning to main screen..."/>
</ref>
```

## Use Cases

- **Wayfinder**:  visitor touches the screen to open an interactive map, WebWrap returns to the slideshow after they walk away
- **Shopping guide**: product catalog opened on touch, auto-returns after idle
- **Info kiosk**: any interactive webpage embedded in a playlist without manual timeout guessing

## Compatibility

WebWrap uses the [Garlic-Player REST API](https://garlic-signage.com/garlic-player/docs/rest-api/reference/) which is compatible with Garlic-Player and IAdea media players.

Cross-origin URLs load normally. Same-origin URLs additionally allow idle detection inside the iframe itself.