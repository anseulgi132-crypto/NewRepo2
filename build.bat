@echo off
cd /d "%~dp0"
node src/build.js
echo.
echo Exit code: %errorlevel%
pause