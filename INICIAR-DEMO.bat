@echo off
echo Ouverture Azavision (mode demo - sans serveur)...
start "" "%~dp0index.html"
timeout /t 2 >nul
start "" "%~dp0client\index.html"
echo.
echo Boutique ouverte dans le navigateur.
echo Admin : ouvrez admin\index.html (mot de passe : azavision_admin)
pause
