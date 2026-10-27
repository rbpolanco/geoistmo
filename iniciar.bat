@echo off
chcp 65001 >nul
title GeoIstmo
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instale la version LTS desde https://nodejs.org y vuelva a intentarlo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
  if errorlevel 1 ( echo Error al instalar dependencias. & pause & exit /b 1 )
)
if not exist data\geoistmo.db call npm run init-db
echo.
echo Abriendo http://localhost:3000 ...
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm start
pause
