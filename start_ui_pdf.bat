@echo off
title AI Job Search & Instant PDF Dashboard
echo ======================================================
echo Starting AI Job Search with Instant PDF Generation...
echo Opening http://localhost:3001 in your browser
echo ======================================================
start http://localhost:3001
bun run pdf_engine\ui_server_pdf.ts
pause
