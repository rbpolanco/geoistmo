@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Esto BORRA la base de datos y la vuelve a crear con los datos de demostracion.
set /p R=Escriba SI para continuar: 
if /i not "%R%"=="SI" exit /b 0
call npm run seed
pause
