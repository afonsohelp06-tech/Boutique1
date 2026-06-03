@echo off
title Azavision - Serveur local
echo.
echo  ========================================
echo   AZAVISION - Demarrage serveur local
echo  ========================================
echo.
echo  Boutique : http://localhost:3000/client/
echo  Admin    : http://localhost:3000/admin/
echo  Portail  : http://localhost:3000/
echo.
echo  Mot de passe admin : azavision_admin
echo.
where npx >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js/npx non trouve. Utilisez INICIAR-DEMO.bat a la place.
    pause
    exit /b 1
)
npx --yes serve . -p 3000
