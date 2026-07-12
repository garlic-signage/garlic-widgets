@echo off
REM tools\build.bat — garlic-widgets builder

setlocal enabledelayedexpansion

set MISSING=0

where zip >nul 2>nul
if errorlevel 1 (
    echo ERROR: 'zip' not found.
    echo   Install e.g. via:  choco install zip
    echo   or use Git Bash / MSYS2, where zip is available.
    set MISSING=1
)

where make >nul 2>nul
if errorlevel 1 (
    echo ERROR: 'make' not found.
    echo   Install e.g. via:  choco install make
    echo   or use Git Bash / MSYS2.
    set MISSING=1
)

if %MISSING%==1 exit /b 1

set "TOOLS_DIR=%~dp0"
REM Remove trailing backslash
if "%TOOLS_DIR:~-1%"=="\" set "TOOLS_DIR=%TOOLS_DIR:~0,-1%"
cd /d "%TOOLS_DIR%"

set ESBUILD_VERSION=0.21.5
set ESBUILD_BIN=esbuild.exe

if not exist "%ESBUILD_BIN%" (
    set ARCH=x64
    if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set ARCH=arm64

    echo esbuild not found, downloading esbuild %ESBUILD_VERSION% for win32-!ARCH!...

    set "TMP_TGZ=%TEMP%\esbuild-%RANDOM%.tgz"

    curl -fsSL "https://registry.npmjs.org/@esbuild/win32-!ARCH!/-/win32-!ARCH!-%ESBUILD_VERSION%.tgz" -o "!TMP_TGZ!"
    if errorlevel 1 (
        echo ERROR: Failed to download esbuild.
        del /q "!TMP_TGZ!" 2>nul
        exit /b 1
    )

    tar -xzf "!TMP_TGZ!" -O package/esbuild.exe > "%ESBUILD_BIN%"
    if errorlevel 1 (
        echo ERROR: Failed to extract esbuild binary.
        del /q "!TMP_TGZ!" "%ESBUILD_BIN%" 2>nul
        exit /b 1
    )
    for %%F in ("%ESBUILD_BIN%") do if %%~zF==0 (
        echo ERROR: esbuild binary is empty.
        del /q "!TMP_TGZ!" "%ESBUILD_BIN%" 2>nul
        exit /b 1
    )

    del /q "!TMP_TGZ!"
    echo esbuild ready: %TOOLS_DIR%\%ESBUILD_BIN%
)

set "ESBUILD_BIN=%TOOLS_DIR%\%ESBUILD_BIN%"

cd /d "%TOOLS_DIR%\.."
make ESBUILD="%ESBUILD_BIN%" %*