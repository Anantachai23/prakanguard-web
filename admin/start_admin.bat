@echo off
title PrakanGuard - Admin Command Center (Port 4000)
echo ========================================================
echo   PRAKANGUARD ADMIN COMMAND CENTER
echo   ระบบบริหารจัดการแอดมิน ศูนย์ข้อมูลอุทกภัยสมุทรปราการ
echo ========================================================
echo.
echo [1/2] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

cd /d "%~dp0"
echo [2/2] Launching Admin Server at http://localhost:4000 ...
timeout /t 2 /nobreak >nul
start http://localhost:4000
node server.js
pause
