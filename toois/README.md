## Build

### Command line
```bash
# All widgets
tools/build.sh

# Single widget
tools/build.sh WebWrap

# Windows
tools\build.bat
tools\build.bat WebWrap
```

### Idea based IDE like PHPStorm, WebStorm or other  
Run configuration **Build Widgets** is included in `.idea/runConfigurations/`.
Open the project — it appears automatically in the Run menu.

### VSCode
`Ctrl+Shift+B` → **Build Widgets**
Or: `Terminal > Run Task > Build Widgets`

Built widgets are placed in `dist/` as `.wgt` files.

---

## Widget structure

Each widget is a folder containing at minimum:

```
MyWidget/
├── config.xml    # required — widget metadata and parameters
├── index.html    # entry point
└── icon.png      # optional but recommended
```

## Widgets

| Widget  | Description                                              |
|---------|----------------------------------------------------------|
| WebWrap | Embeds a URL in an iframe, returns to playlist on idle   |
