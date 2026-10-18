@echo off
title PrakanGuard - Dual System Launcher (Web & Admin)
echo ========================================================
echo   PRAKANGUARD FLOOD MONITORING & ADMIN COMMAND CENTER
echo ========================================================
echo.
echo [1/2] Starting Admin Command Center (Port 4000)...
start "PrakanGuard Admin Command Center" cmd /c "cd /d "%~dp0" && start_admin.bat"

echo [2/2] Starting Citizen Flood Web Application (Port 5173)...
timeout /t 2 /nobreak >nul
start "PrakanGuard Flood Webapp" cmd /c "cd /d "%~dp0" && start_website.bat"

echo.
echo ========================================================
echo   Both systems are starting up!
echo   - Citizen Webapp: http://localhost:5173
echo   - Admin Portal:   http://localhost:4000
echo ========================================================
