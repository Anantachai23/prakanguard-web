@echo off
title PrakanGuard - Samut Prakan Flood Monitoring System
echo ========================================================
echo   PRAKANGUARD FLOOD MONITORING SYSTEM
echo   Samut Prakan Road Flood Monitoring Web Application
echo ========================================================
echo.
cd /d "%~dp0"
echo Opening browser at http://localhost:5173 ...
start http://localhost:5173
npm run dev
pause
