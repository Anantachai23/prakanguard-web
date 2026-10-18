@echo off
title PrakanGuard - Admin Command Center (Port 4000)
echo ========================================================
echo   PRAKANGUARD ADMIN COMMAND CENTER
echo   ระบบบริหารจัดการแอดมิน ศูนย์ข้อมูลอุทกภัยสมุทรปราการ
echo ========================================================
echo.
echo Launching Admin Portal at http://localhost:4000 ...
cd /d "%~dp0"
start http://localhost:4000
node admin\server.js
pause
