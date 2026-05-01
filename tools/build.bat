@echo off
:: tools/build.bat — garlic-widgets builder

set MISSING=0

where zip >nul 2>&1 || (
    echo ERROR: 'zip' nicht gefunden.
    echo   Chocolatey:  choco install zip
    echo   Winget:      winget install GnuWin32.Zip
    echo   Manuell:     https://gnuwin32.sourceforge.net/packages/zip.htm
    set MISSING=1
)

where make >nul 2>&1 || (
    echo ERROR: 'make' nicht gefunden.
    echo   Chocolatey:  choco install make
    echo   Winget:      winget install GnuWin32.Make
    set MISSING=1
)

if %MISSING%==1 exit /b 1

cd /d "%~dp0.." && make %*
