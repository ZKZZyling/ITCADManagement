@echo off
cd /d "%~dp0"
node scripts/export-presentation.mjs
if errorlevel 1 pause
