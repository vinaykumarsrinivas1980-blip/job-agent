@echo off
title AI Job Search Dashboard
echo ======================================================
echo Starting AI Job Search Interactive Dashboard...
echo Opening http://localhost:3000 in your browser
echo ======================================================
start http://localhost:3000
bun run tools\ui_server.ts
pause
