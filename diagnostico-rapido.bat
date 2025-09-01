@echo off
echo 🔍 DIAGNÓSTICO RÁPIDO DE CONECTIVIDAD
echo =====================================

echo 1. Verificando conexión a internet...
ping -n 2 8.8.8.8

echo.
echo 2. Verificando DNS...
nslookup google.com

echo.
echo 3. Intentando conectar al servidor AWS...
telnet 34.196.15.155 80

echo.
echo 4. Verificando si el servidor está en línea desde otro punto...
curl -I --connect-timeout 10 http://34.196.15.155

pause