@echo off
title PrakanGuard - Sync & Deploy to GitHub
echo ========================================================
echo   PRAKANGUARD - SYNC & PUSH TO GITHUB (AUTO DEPLOY)
echo ========================================================
echo.
cd /d "%~dp0"

if exist "..\prakanguard-web" (
    echo [1/3] Syncing latest code to prakanguard-web...
    xcopy /E /I /Y "src" "..\prakanguard-web\src"
    xcopy /E /I /Y "admin" "..\prakanguard-web\admin"
    copy /Y "index.html" "..\prakanguard-web\index.html"
    echo [2/3] Adding and Committing changes...
    git -C "..\prakanguard-web" add .
    git -C "..\prakanguard-web" commit -m "update: sync and deploy latest changes"
    echo [3/3] Pushing to GitHub...
    git -C "..\prakanguard-web" push origin main
) else (
    echo [1/2] Adding and Committing changes...
    git add .
    git commit -m "update: sync and deploy latest changes"
    echo [2/2] Pushing to GitHub (Auto-trigger Vercel/Netlify Deploy)...
    git push origin main
)

echo.
echo ========================================================
echo   SUCCESS! Pushed to https://github.com/Anantachai23/prakanguard-web
echo   Vercel / Hosting is now building the latest update.
echo ========================================================
pause
