#!/bin/bash
# tools/build.sh — garlic-widgets builder

MISSING=0

if ! command -v zip &> /dev/null; then
    echo "ERROR: 'zip' nicht gefunden."
    echo "  Ubuntu/Debian:  sudo apt install zip"
    echo "  Fedora/RHEL:    sudo dnf install zip"
    echo "  macOS:          brew install zip"
    MISSING=1
fi

if ! command -v make &> /dev/null; then
    echo "ERROR: 'make' nicht gefunden."
    echo "  Ubuntu/Debian:  sudo apt install make"
    echo "  Fedora/RHEL:    sudo dnf install make"
    echo "  macOS:          brew install make  oder  xcode-select --install"
    MISSING=1
fi

if [ $MISSING -eq 1 ]; then
    exit 1
fi

TOOLS_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$TOOLS_DIR"

ESBUILD_VERSION="0.21.5"
ESBUILD_BIN="esbuild"

if [ ! -f "$ESBUILD_BIN" ]; then
    OS=$(uname -s)
    ARCH=$(uname -m)

    case "$OS" in
        Linux)  PLATFORM="linux" ;;
        Darwin) PLATFORM="darwin" ;;
        MINGW*|MSYS*|CYGWIN*) PLATFORM="win32" ;;
        *) echo "ERROR: Unbekanntes OS: $OS"; exit 1 ;;
    esac

    case "$ARCH" in
        x86_64|amd64) ARCH="x64" ;;
        arm64|aarch64) ARCH="arm64" ;;
        *) echo "ERROR: Unbekannte Architektur: $ARCH"; exit 1 ;;
    esac

    echo "esbuild nicht gefunden, lade esbuild ${ESBUILD_VERSION} für ${PLATFORM}-${ARCH}..."

    TMP_TGZ=$(mktemp)
    BIN_PATH_IN_TGZ="package/bin/esbuild"
    if [ "$PLATFORM" = "win32" ]; then
        BIN_PATH_IN_TGZ="package/esbuild.exe"
        ESBUILD_BIN="esbuild.exe"
    fi

    curl -fsSL "https://registry.npmjs.org/@esbuild/${PLATFORM}-${ARCH}/-/${PLATFORM}-${ARCH}-${ESBUILD_VERSION}.tgz" -o "$TMP_TGZ"
    if [ $? -ne 0 ]; then
        echo "ERROR: Download von esbuild fehlgeschlagen."
        rm -f "$TMP_TGZ"
        exit 1
    fi

    tar -xzf "$TMP_TGZ" -O "$BIN_PATH_IN_TGZ" > "$ESBUILD_BIN"
    if [ $? -ne 0 ] || [ ! -s "$ESBUILD_BIN" ]; then
        echo "ERROR: esbuild-Binary konnte nicht extrahiert werden."
        rm -f "$TMP_TGZ" "$ESBUILD_BIN"
        exit 1
    fi

    chmod +x "$ESBUILD_BIN"
    rm -f "$TMP_TGZ"
    echo "esbuild bereit: $(pwd)/$ESBUILD_BIN"
fi

export ESBUILD_BIN="$TOOLS_DIR/$ESBUILD_BIN"

cd "$TOOLS_DIR/.." && make ESBUILD="$ESBUILD_BIN" "$@"