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

cd "$(dirname "$0")/.." && make "$@"
